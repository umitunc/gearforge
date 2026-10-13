import * as THREE from 'three';
import { GearMetricsCalculator } from '../calculators/GearMetricsCalculator';
import { InvoluteMathCalculator } from '../calculators/InvoluteMathCalculator';
import { GearParameters } from '../models/GearParameters';
import { GearMeshZone, GearType, WebStyle } from '../models/GearTypes';
import {
  GearMeshData,
  ManifoldReport,
  MeshZoneGroup,
  Point2D,
  PolygonLoop2D,
} from '../models/GeometryTypes';
import { BoreProfileRegistry } from '../profiles/bore/BoreProfileRegistry';
import { IToothProfileGenerator } from '../profiles/interfaces/IToothProfileGenerator';
import { InvoluteToothProfileGenerator } from '../profiles/tooth/InvoluteToothProfileGenerator';
import { WebCutoutRegistry } from '../profiles/web/WebCutoutRegistry';
import { AxialTwistRegistry } from './twist/AxialTwistRegistry';

interface WeldedMesh {
  vertices: number[];            // [x0, y0, z0, x1, y1, z1, ...]
  indices: number[];             // [i0, i1, i2, ...]
  triangleZones: GearMeshZone[]; // Her üçgen için pürüzsüz dairesel anatomik bölge etiketi
}

/**
 * 3D Yazıcı (Slicer) uyumlu, %100 su geçirmez (watertight / 2-manifold) ve
 * pürüzsüz dairesel bölge sınırlarına sahip dişli 3B ağ üreticisi (SRP / DIP).
 */
export class ManifoldGearMeshBuilder {
  private readonly toothGenerator: IToothProfileGenerator;
  private readonly boreRegistry: BoreProfileRegistry;
  private readonly webCutoutRegistry: WebCutoutRegistry;
  private readonly twistRegistry: AxialTwistRegistry;
  private readonly metricsCalculator: GearMetricsCalculator;

  constructor(
    toothGenerator: IToothProfileGenerator = new InvoluteToothProfileGenerator(),
    boreRegistry: BoreProfileRegistry = new BoreProfileRegistry(),
    webCutoutRegistry: WebCutoutRegistry = new WebCutoutRegistry(),
    twistRegistry: AxialTwistRegistry = new AxialTwistRegistry(),
    metricsCalculator: GearMetricsCalculator = new GearMetricsCalculator()
  ) {
    this.toothGenerator = toothGenerator;
    this.boreRegistry = boreRegistry;
    this.webCutoutRegistry = webCutoutRegistry;
    this.twistRegistry = twistRegistry;
    this.metricsCalculator = metricsCalculator;
  }

  /**
   * Verilen dişli parametrelerinden su geçirmez (watertight) 3B ağ ve doğrulama raporu üretir.
   */
  public build(params: GearParameters): GearMeshData {
    const welded: WeldedMesh = {
      vertices: [],
      indices: [],
      triangleZones: [],
    };

    if (params.gearType === GearType.INTERNAL_RING) {
      this.buildInternalRingGear(params, welded);
    } else {
      this.buildExternalGear(params, welded);
    }

    const manifoldReport = this.computeManifoldReport(welded);
    return this.buildRenderableBuffers(welded, manifoldReport);
  }

  /**
   * Dış Dişli (Spur, Helical, Herringbone, Bevel Taper) için 3 bölgeli (Rim -> Web -> Hub/Bore)
   * su geçirmez katı model oluşturur. Tüm bölge sınırları tam çember halkalarıdır.
   */
  private buildExternalGear(params: GearParameters, mesh: WeldedMesh): void {
    const radii = InvoluteMathCalculator.calculateRadii(params);
    const metrics = this.metricsCalculator.calculate(params);
    const twistStrategy = this.twistRegistry.resolve(params.gearType);

    const baseToothLoop = this.ensureCCW(this.toothGenerator.generateToothLoop(params));
    const sliceCount = twistStrategy.resolveSliceCount(params);
    const halfThickness = params.thickness * 0.5;

    const topTransform = twistStrategy.computeTransform(1.0, params, radii.pitchRadius);
    const minTopRootRadius = radii.rootRadius * topTransform.radialScale;

    const maxSafeRimRadius = Math.max(1.2, minTopRootRadius - 1.0);
    const rimRadius = Math.min(maxSafeRimRadius, metrics.effectiveRimRadius);
    const hubRadius = Math.min(rimRadius - 0.05, metrics.effectiveHubRadius);
    const maxAllowedBoreRadius = Math.max(0.5, hubRadius - 0.8);

    // Delik (Bore) konturu
    const boreGen = this.boreRegistry.resolve(params.boreType);
    const rawBoreLoop = boreGen.generateBoreLoop(params, maxAllowedBoreRadius, 64);
    const boreLoop = rawBoreLoop.length >= 3 ? this.ensureCCW(rawBoreLoop) : [];

    // Z yükseklikleri
    const isWebRecessed =
      params.webStyle !== WebStyle.SOLID && rimRadius - hubRadius >= 1.0;
    const halfWebZ = isWebRecessed
      ? Math.min(halfThickness, Math.max(0.5, params.webThickness * 0.5))
      : halfThickness;

    const zRimTop = halfThickness;
    const zRimBot = -halfThickness;
    const zWebTop = halfWebZ;
    const zWebBot = -halfWebZ;
    const zHubTop = halfThickness + Math.max(0, params.hubTopExtension);
    const zHubBot = -halfThickness - Math.max(0, params.hubBottomExtension);

    // 1. Dış Diş Yan Yüzeyleri (Z katmanları boyunca burulmuş dilimler -> TOOTH_FLANK)
    const toothSliceRings: number[][] = [];
    const toothSliceLoops2D: PolygonLoop2D[] = [];

    for (let s = 0; s <= sliceCount; s++) {
      const u = s / sliceCount;
      const z = zRimBot + u * params.thickness;
      const tf = twistStrategy.computeTransform(u, params, radii.pitchRadius);
      const transformedLoop = this.transformLoop2D(
        baseToothLoop,
        tf.rotationAngleRad,
        tf.radialScale
      );
      toothSliceLoops2D.push(transformedLoop);
      toothSliceRings.push(this.addRingVertices(mesh, transformedLoop, z));
    }

    for (let s = 0; s < sliceCount; s++) {
      this.stitchOuterWall(
        mesh,
        toothSliceRings[s],
        toothSliceRings[s + 1],
        GearMeshZone.TOOTH_FLANK
      );
    }

    const topToothLoop = toothSliceLoops2D[sliceCount];
    const botToothLoop = toothSliceLoops2D[0];
    const topToothRing = toothSliceRings[sliceCount];
    const botToothRing = toothSliceRings[0];

    const cutoutGen = this.webCutoutRegistry.resolve(params.webStyle);
    const cutoutLoops =
      rimRadius - hubRadius >= 2.2
        ? cutoutGen.generateCutouts(params, hubRadius, rimRadius).map((l) => this.ensureCCW(l))
        : [];

    // Pürüzsüz dairesel bölge sınırları için her zaman 64 köşeli tam çember halkaları kullan
    const circleRes = 64;
    const rimCircleLoop = this.createCircleLoop(rimRadius, circleRes);
    const hubCircleLoop = this.createCircleLoop(hubRadius, circleRes);

    // Bölge 1 (Rim + Dişler): topToothLoop -> rimCircleLoop
    const rimRingAtRimTop = this.addRingVertices(mesh, rimCircleLoop, zRimTop);
    const rimRingAtRimBot = this.addRingVertices(mesh, rimCircleLoop, zRimBot);

    this.triangulateCap(
      mesh,
      topToothLoop,
      topToothRing,
      [rimCircleLoop],
      [rimRingAtRimTop],
      true,
      GearMeshZone.TEETH_RIM
    );
    this.triangulateCap(
      mesh,
      botToothLoop,
      botToothRing,
      [rimCircleLoop],
      [rimRingAtRimBot],
      false,
      GearMeshZone.TEETH_RIM
    );

    // Rim ile Web arasındaki kademe duvarı
    const rimRingAtWebTop =
      Math.abs(zRimTop - zWebTop) > 1e-4
        ? this.addRingVertices(mesh, rimCircleLoop, zWebTop)
        : rimRingAtRimTop;
    const rimRingAtWebBot =
      Math.abs(zRimBot - zWebBot) > 1e-4
        ? this.addRingVertices(mesh, rimCircleLoop, zWebBot)
        : rimRingAtRimBot;

    if (rimRingAtWebTop !== rimRingAtRimTop) {
      this.stitchOuterWall(mesh, rimRingAtRimTop, rimRingAtWebTop, GearMeshZone.HUB_WEB);
    }
    if (rimRingAtWebBot !== rimRingAtRimBot) {
      this.stitchOuterWall(mesh, rimRingAtWebBot, rimRingAtRimBot, GearMeshZone.HUB_WEB);
    }

    // Bölge 2 (Web + Hafifletme Delikleri / Jant Kolları)
    const hubRingAtWebTop = this.addRingVertices(mesh, hubCircleLoop, zWebTop);
    const hubRingAtWebBot = this.addRingVertices(mesh, hubCircleLoop, zWebBot);

    const webHoles2D: PolygonLoop2D[] = [hubCircleLoop];
    const webTopHoleRings: number[][] = [hubRingAtWebTop];
    const webBotHoleRings: number[][] = [hubRingAtWebBot];

    for (const cutout of cutoutLoops) {
      const cTopRing = this.addRingVertices(mesh, cutout, zWebTop);
      const cBotRing = this.addRingVertices(mesh, cutout, zWebBot);
      this.stitchInnerWall(mesh, cBotRing, cTopRing, GearMeshZone.HUB_WEB);
      webHoles2D.push(cutout);
      webTopHoleRings.push(cTopRing);
      webBotHoleRings.push(cBotRing);
    }

    this.triangulateCap(
      mesh,
      rimCircleLoop,
      rimRingAtWebTop,
      webHoles2D,
      webTopHoleRings,
      true,
      GearMeshZone.HUB_WEB
    );
    this.triangulateCap(
      mesh,
      rimCircleLoop,
      rimRingAtWebBot,
      webHoles2D,
      webBotHoleRings,
      false,
      GearMeshZone.HUB_WEB
    );

    // Web ile Hub arasındaki kademe duvarı
    const hubRingAtHubTop =
      Math.abs(zHubTop - zWebTop) > 1e-4
        ? this.addRingVertices(mesh, hubCircleLoop, zHubTop)
        : hubRingAtWebTop;
    const hubRingAtHubBot =
      Math.abs(zHubBot - zWebBot) > 1e-4
        ? this.addRingVertices(mesh, hubCircleLoop, zHubBot)
        : hubRingAtWebBot;

    if (hubRingAtHubTop !== hubRingAtWebTop) {
      this.stitchOuterWall(mesh, hubRingAtWebTop, hubRingAtHubTop, GearMeshZone.HUB_WEB);
    }
    if (hubRingAtHubBot !== hubRingAtWebBot) {
      this.stitchOuterWall(mesh, hubRingAtHubBot, hubRingAtWebBot, GearMeshZone.HUB_WEB);
    }

    // Bölge 3 (Hub + Merkez Delik): hubCircleLoop -> boreLoop
    const hubHoles2D: PolygonLoop2D[] = [];
    const hubTopHoleRings: number[][] = [];
    const hubBotHoleRings: number[][] = [];

    if (boreLoop.length >= 3) {
      const boreTopRing = this.addRingVertices(mesh, boreLoop, zHubTop);
      const boreBotRing = this.addRingVertices(mesh, boreLoop, zHubBot);
      this.stitchInnerWall(mesh, boreBotRing, boreTopRing, GearMeshZone.BORE);
      hubHoles2D.push(boreLoop);
      hubTopHoleRings.push(boreTopRing);
      hubBotHoleRings.push(boreBotRing);
    }

    // Hub üst ve alt yüzeyi tamamen pürüzsüz dairesel kalması için tek parça olarak atanır
    this.triangulateCap(
      mesh,
      hubCircleLoop,
      hubRingAtHubTop,
      hubHoles2D,
      hubTopHoleRings,
      true,
      GearMeshZone.HUB_WEB
    );
    this.triangulateCap(
      mesh,
      hubCircleLoop,
      hubRingAtHubBot,
      hubHoles2D,
      hubBotHoleRings,
      false,
      GearMeshZone.HUB_WEB
    );
  }

  /**
   * İç Dişli Çember (Internal Ring Gear) için su geçirmez katı model oluşturur.
   */
  private buildInternalRingGear(params: GearParameters, mesh: WeldedMesh): void {
    const radii = InvoluteMathCalculator.calculateRadii(params);
    const innerTeethLoop = this.ensureCCW(this.toothGenerator.generateToothLoop(params));
    const outerWall = Math.max(2.5, params.outerRingWallThickness);
    const outerRadius = radii.rootRadius + outerWall;

    const outerCircleLoop = this.createCircleLoop(outerRadius, Math.max(72, params.teethCount * 4));
    const halfZ = params.thickness * 0.5;

    const outerTopRing = this.addRingVertices(mesh, outerCircleLoop, halfZ);
    const outerBotRing = this.addRingVertices(mesh, outerCircleLoop, -halfZ);
    const innerTopRing = this.addRingVertices(mesh, innerTeethLoop, halfZ);
    const innerBotRing = this.addRingVertices(mesh, innerTeethLoop, -halfZ);

    this.stitchOuterWall(mesh, outerBotRing, outerTopRing, GearMeshZone.TEETH_RIM);
    this.stitchInnerWall(mesh, innerBotRing, innerTopRing, GearMeshZone.TOOTH_FLANK);

    this.triangulateCap(
      mesh,
      outerCircleLoop,
      outerTopRing,
      [innerTeethLoop],
      [innerTopRing],
      true,
      GearMeshZone.TEETH_RIM
    );
    this.triangulateCap(
      mesh,
      outerCircleLoop,
      outerBotRing,
      [innerTeethLoop],
      [innerBotRing],
      false,
      GearMeshZone.TEETH_RIM
    );
  }

  private triangulateCap(
    mesh: WeldedMesh,
    outerLoop: PolygonLoop2D,
    outerRingIndices: readonly number[],
    holeLoops: readonly PolygonLoop2D[],
    holeRingsIndices: readonly (readonly number[])[],
    isTopCap: boolean,
    zone: GearMeshZone
  ): void {
    const contourVec2 = outerLoop.map((p) => new THREE.Vector2(p.x, p.y));
    const holesVec2 = holeLoops.map((h) => h.map((p) => new THREE.Vector2(p.x, p.y)));

    const allPoints2D: Point2D[] = [...outerLoop];
    const indexLookup: number[] = [...outerRingIndices];

    for (let h = 0; h < holeLoops.length; h++) {
      allPoints2D.push(...holeLoops[h]);
      indexLookup.push(...holeRingsIndices[h]);
    }

    const triangles = THREE.ShapeUtils.triangulateShape(contourVec2, holesVec2);

    for (const tri of triangles) {
      const a = tri[0];
      const b = tri[1];
      const c = tri[2];

      const pa = allPoints2D[a];
      const pb = allPoints2D[b];
      const pc = allPoints2D[c];

      const cross = (pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x);
      const isCCW = cross >= 0;

      const idxA = indexLookup[a];
      const idxB = indexLookup[b];
      const idxC = indexLookup[c];

      if (isTopCap) {
        if (isCCW) {
          mesh.indices.push(idxA, idxB, idxC);
        } else {
          mesh.indices.push(idxA, idxC, idxB);
        }
      } else {
        if (isCCW) {
          mesh.indices.push(idxA, idxC, idxB);
        } else {
          mesh.indices.push(idxA, idxB, idxC);
        }
      }

      mesh.triangleZones.push(zone);
    }
  }

  private stitchOuterWall(
    mesh: WeldedMesh,
    bottomRing: readonly number[],
    topRing: readonly number[],
    zone: GearMeshZone
  ): void {
    const n = bottomRing.length;
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const b0 = bottomRing[i];
      const b1 = bottomRing[next];
      const t0 = topRing[i];
      const t1 = topRing[next];

      mesh.indices.push(b0, b1, t1);
      mesh.triangleZones.push(zone);

      mesh.indices.push(b0, t1, t0);
      mesh.triangleZones.push(zone);
    }
  }

  private stitchInnerWall(
    mesh: WeldedMesh,
    bottomRing: readonly number[],
    topRing: readonly number[],
    zone: GearMeshZone
  ): void {
    const n = bottomRing.length;
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      const b0 = bottomRing[i];
      const b1 = bottomRing[next];
      const t0 = topRing[i];
      const t1 = topRing[next];

      mesh.indices.push(b0, t1, b1);
      mesh.triangleZones.push(zone);

      mesh.indices.push(b0, t0, t1);
      mesh.triangleZones.push(zone);
    }
  }

  private addRingVertices(
    mesh: WeldedMesh,
    loop: PolygonLoop2D,
    z: number
  ): number[] {
    const ringIndices: number[] = [];
    for (let i = 0; i < loop.length; i++) {
      const idx = mesh.vertices.length / 3;
      mesh.vertices.push(loop[i].x, loop[i].y, z);
      ringIndices.push(idx);
    }
    return ringIndices;
  }

  private createCircleLoop(radius: number, segments: number): PolygonLoop2D {
    const pts: Point2D[] = [];
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push({
        x: radius * Math.cos(theta),
        y: radius * Math.sin(theta),
      });
    }
    return pts;
  }

  private transformLoop2D(
    loop: PolygonLoop2D,
    rotationRad: number,
    scale: number
  ): PolygonLoop2D {
    const cosA = Math.cos(rotationRad);
    const sinA = Math.sin(rotationRad);
    return loop.map((p) => {
      const sx = p.x * scale;
      const sy = p.y * scale;
      return {
        x: sx * cosA - sy * sinA,
        y: sx * sinA + sy * cosA,
      };
    });
  }

  private ensureCCW(loop: PolygonLoop2D): PolygonLoop2D {
    if (loop.length < 3) {
      return loop;
    }
    let signedArea2 = 0;
    for (let i = 0; i < loop.length; i++) {
      const p1 = loop[i];
      const p2 = loop[(i + 1) % loop.length];
      signedArea2 += p1.x * p2.y - p2.x * p1.y;
    }
    return signedArea2 >= 0 ? loop : [...loop].reverse();
  }

  private computeManifoldReport(mesh: WeldedMesh): ManifoldReport {
    const v = mesh.vertices;
    const idx = mesh.indices;
    const triangleCount = idx.length / 3;

    let signedVolume6 = 0;
    let totalArea = 0;
    const directedEdges = new Set<string>();

    for (let i = 0; i < idx.length; i += 3) {
      const i0 = idx[i];
      const i1 = idx[i + 1];
      const i2 = idx[i + 2];

      const x0 = v[i0 * 3], y0 = v[i0 * 3 + 1], z0 = v[i0 * 3 + 2];
      const x1 = v[i1 * 3], y1 = v[i1 * 3 + 1], z1 = v[i1 * 3 + 2];
      const x2 = v[i2 * 3], y2 = v[i2 * 3 + 1], z2 = v[i2 * 3 + 2];

      signedVolume6 +=
        x0 * (y1 * z2 - z1 * y2) -
        y0 * (x1 * z2 - z1 * x2) +
        z0 * (x1 * y2 - y1 * x2);

      const ux = x1 - x0, uy = y1 - y0, uz = z1 - z0;
      const vx = x2 - x0, vy = y2 - y0, vz = z2 - z0;
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      totalArea += 0.5 * Math.sqrt(nx * nx + ny * ny + nz * nz);

      directedEdges.add(`${i0}_${i1}`);
      directedEdges.add(`${i1}_${i2}`);
      directedEdges.add(`${i2}_${i0}`);
    }

    let unmatchedEdges = 0;
    for (const edge of directedEdges) {
      const sep = edge.indexOf('_');
      const u = edge.slice(0, sep);
      const w = edge.slice(sep + 1);
      if (!directedEdges.has(`${w}_${u}`)) {
        unmatchedEdges++;
      }
    }

    const hasNoDuplicateHalfEdges = directedEdges.size === triangleCount * 3;

    return {
      isWatertight:
        unmatchedEdges === 0 &&
        hasNoDuplicateHalfEdges &&
        signedVolume6 > 0 &&
        triangleCount > 0,
      vertexCount: v.length / 3,
      triangleCount,
      surfaceAreaMm2: totalArea,
      volumeMm3: Math.abs(signedVolume6) / 6.0,
    };
  }

  private buildRenderableBuffers(
    mesh: WeldedMesh,
    manifoldReport: ManifoldReport
  ): GearMeshData {
    const triCount = mesh.indices.length / 3;
    const positions = new Float32Array(triCount * 9);
    const normals = new Float32Array(triCount * 9);
    const indices = new Uint32Array(triCount * 3);

    const orderedZones: GearMeshZone[] = [
      GearMeshZone.TOOTH_FLANK,
      GearMeshZone.TEETH_RIM,
      GearMeshZone.HUB_WEB,
      GearMeshZone.BORE,
    ];

    const buckets = new Map<GearMeshZone, number[]>();
    for (const z of orderedZones) {
      buckets.set(z, []);
    }

    for (let t = 0; t < triCount; t++) {
      const zone = mesh.triangleZones[t] ?? GearMeshZone.TEETH_RIM;
      buckets.get(zone)!.push(t);
    }

    const v = mesh.vertices;
    const zoneGroups: MeshZoneGroup[] = [];
    let outTriIndex = 0;

    for (const zone of orderedZones) {
      const triList = buckets.get(zone)!;
      const startIndexOffset = outTriIndex * 3;

      for (let k = 0; k < triList.length; k++) {
        const srcTri = triList[k];
        const i0 = mesh.indices[srcTri * 3];
        const i1 = mesh.indices[srcTri * 3 + 1];
        const i2 = mesh.indices[srcTri * 3 + 2];

        const x0 = v[i0 * 3], y0 = v[i0 * 3 + 1], z0 = v[i0 * 3 + 2];
        const x1 = v[i1 * 3], y1 = v[i1 * 3 + 1], z1 = v[i1 * 3 + 2];
        const x2 = v[i2 * 3], y2 = v[i2 * 3 + 1], z2 = v[i2 * 3 + 2];

        const ux = x1 - x0, uy = y1 - y0, uz = z1 - z0;
        const vx = x2 - x0, vy = y2 - y0, vz = z2 - z0;
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= len;
        ny /= len;
        nz /= len;

        const base = outTriIndex * 9;
        positions[base] = x0;
        positions[base + 1] = y0;
        positions[base + 2] = z0;
        positions[base + 3] = x1;
        positions[base + 4] = y1;
        positions[base + 5] = z1;
        positions[base + 6] = x2;
        positions[base + 7] = y2;
        positions[base + 8] = z2;

        normals[base] = nx;
        normals[base + 1] = ny;
        normals[base + 2] = nz;
        normals[base + 3] = nx;
        normals[base + 4] = ny;
        normals[base + 5] = nz;
        normals[base + 6] = nx;
        normals[base + 7] = ny;
        normals[base + 8] = nz;

        indices[outTriIndex * 3] = outTriIndex * 3;
        indices[outTriIndex * 3 + 1] = outTriIndex * 3 + 1;
        indices[outTriIndex * 3 + 2] = outTriIndex * 3 + 2;

        outTriIndex++;
      }

      zoneGroups.push({
        zone,
        start: startIndexOffset,
        count: triList.length * 3,
      });
    }

    return {
      positions,
      normals,
      indices,
      zoneGroups,
      manifoldReport,
    };
  }
}
