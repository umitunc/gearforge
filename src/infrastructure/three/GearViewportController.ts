import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GearMetrics } from '../../domain/models/GearMetrics';
import { GearParameters } from '../../domain/models/GearParameters';
import {
  FilamentMaterial,
  GearHighlightSection,
  GearMeshZone,
  GearType,
  HelixHandedness,
  WebStyle,
} from '../../domain/models/GearTypes';
import { GearMeshData } from '../../domain/models/GeometryTypes';

export interface ViewportDisplayOptions {
  readonly showWireframe: boolean;
  readonly showPitchCircles: boolean;
  readonly showCrossSection: boolean;
  readonly showBuildPlate: boolean;
  readonly isAnimationPlaying: boolean;
}

const MATERIAL_STYLE_MAP: Record<
  FilamentMaterial,
  { color: number; metalness: number; roughness: number }
> = {
  [FilamentMaterial.PLA]: { color: 0x38bdf8, metalness: 0.22, roughness: 0.35 },
  [FilamentMaterial.PETG]: { color: 0x2dd4bf, metalness: 0.15, roughness: 0.22 },
  [FilamentMaterial.ABS]: { color: 0xf59e0b, metalness: 0.12, roughness: 0.48 },
  [FilamentMaterial.ASA]: { color: 0xf97316, metalness: 0.14, roughness: 0.42 },
  [FilamentMaterial.NYLON_PA12]: { color: 0xe2e8f0, metalness: 0.10, roughness: 0.38 },
  [FilamentMaterial.TPU]: { color: 0xa855f7, metalness: 0.08, roughness: 0.58 },
};

/**
 * Three.js 3B sahne, kamera, ışıklandırma, bölgesel 3B vurgulama (Zone Highlight),
 * eşleşen pinyon simülasyonu, referans çemberleri ve kesit düzlemi yöneticisi (SRP).
 */
export class GearViewportController {
  private readonly container: HTMLElement;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;

  private readonly primaryGroup: THREE.Group;
  private readonly matingGroup: THREE.Group;
  private readonly referenceOverlayGroup: THREE.Group;
  private readonly buildPlateGroup: THREE.Group;

  private primaryMesh: THREE.Mesh | null = null;
  private primaryWireframe: THREE.LineSegments | null = null;
  private matingMesh: THREE.Mesh | null = null;
  private matingWireframe: THREE.LineSegments | null = null;

  private lastPrimaryMeshData: GearMeshData | null = null;
  private lastMatingMeshData: GearMeshData | null = null;

  private readonly clippingPlane: THREE.Plane;
  // 4 Anatomik Bölge Materyali: [TOOTH_FLANK, TEETH_RIM, HUB_WEB, BORE]
  private readonly zoneMaterials: THREE.MeshStandardMaterial[];
  private readonly matingMaterial: THREE.MeshStandardMaterial;
  private readonly wireframeMaterial: THREE.LineBasicMaterial;

  private displayOptions: ViewportDisplayOptions = {
    showWireframe: false,
    showPitchCircles: true,
    showCrossSection: false,
    showBuildPlate: true,
    isAnimationPlaying: true,
  };

  private activeHighlight: GearHighlightSection = GearHighlightSection.NONE;
  private currentParams: GearParameters | null = null;
  private currentMetrics: GearMetrics | null = null;
  private primaryAngleRad = 0;
  private pulseTime = 0;
  private lastFrameTime = performance.now();
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1120);

    const width = Math.max(300, container.clientWidth);
    const height = Math.max(300, container.clientHeight);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 2500);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0, -95, 75);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.localClippingEnabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.maxDistance = 900;
    this.controls.minDistance = 8;
    this.controls.target.set(0, 0, 0);

    this.clippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // 4 Bölge Materyali: [0: TOOTH_FLANK, 1: TEETH_RIM, 2: HUB_WEB, 3: BORE]
    this.zoneMaterials = [0, 1, 2, 3].map(
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          metalness: 0.22,
          roughness: 0.35,
          side: THREE.DoubleSide,
        })
    );

    this.matingMaterial = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      metalness: 0.25,
      roughness: 0.38,
      side: THREE.DoubleSide,
    });

    this.wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.32,
    });

    this.primaryGroup = new THREE.Group();
    this.matingGroup = new THREE.Group();
    this.referenceOverlayGroup = new THREE.Group();
    this.buildPlateGroup = new THREE.Group();

    this.scene.add(this.buildPlateGroup);
    this.scene.add(this.primaryGroup);
    this.scene.add(this.matingGroup);
    this.scene.add(this.referenceOverlayGroup);

    this.setupLighting();
    this.setupBuildPlateGrid();
    this.setupResizeHandling();
    this.startRenderLoop();
  }

  /**
   * Ana dişli, opsiyonel eşleşen pinyon, mühendislik çemberleri ve bölgesel vurgulamayı günceller.
   */
  public updateGearScene(
    primaryMeshData: GearMeshData,
    matingMeshData: GearMeshData | null,
    params: GearParameters,
    metrics: GearMetrics,
    highlightSection: GearHighlightSection = GearHighlightSection.NONE
  ): void {
    this.currentParams = params;
    this.currentMetrics = metrics;
    this.activeHighlight = highlightSection;

    this.applyZoneMaterialStyles();

    const meshChanged =
      primaryMeshData !== this.lastPrimaryMeshData ||
      matingMeshData !== this.lastMatingMeshData;

    if (!meshChanged) {
      return;
    }

    this.lastPrimaryMeshData = primaryMeshData;
    this.lastMatingMeshData = matingMeshData;

    // 1. Ana dişli geometrisini yenile
    this.clearGroupGeometry(this.primaryGroup);
    const primaryGeo = this.createBufferGeometry(primaryMeshData);
    this.primaryMesh = new THREE.Mesh(primaryGeo, this.zoneMaterials);
    this.primaryMesh.castShadow = true;
    this.primaryMesh.receiveShadow = true;
    this.primaryGroup.add(this.primaryMesh);

    const wireGeo = new THREE.WireframeGeometry(primaryGeo);
    this.primaryWireframe = new THREE.LineSegments(wireGeo, this.wireframeMaterial);
    this.primaryWireframe.visible = this.displayOptions.showWireframe;
    this.primaryGroup.add(this.primaryWireframe);

    // 2. Eşleşen (Mating) pinyon dişliyi yenile
    this.clearGroupGeometry(this.matingGroup);
    if (params.showMatingGear && matingMeshData) {
      const matingGeo = this.createBufferGeometry(matingMeshData);
      this.matingMesh = new THREE.Mesh(matingGeo, this.matingMaterial);
      this.matingMesh.castShadow = true;
      this.matingMesh.receiveShadow = true;
      this.matingGroup.add(this.matingMesh);

      const matingWireGeo = new THREE.WireframeGeometry(matingGeo);
      this.matingWireframe = new THREE.LineSegments(
        matingWireGeo,
        this.wireframeMaterial
      );
      this.matingWireframe.visible = this.displayOptions.showWireframe;
      this.matingGroup.add(this.matingWireframe);

      this.matingGroup.position.set(metrics.centerDistance, 0, 0);
      this.matingGroup.visible = true;
    } else {
      this.matingMesh = null;
      this.matingWireframe = null;
      this.matingGroup.visible = false;
    }

    // 3. Mühendislik referans çemberlerini yenile
    this.rebuildReferenceOverlays(params, metrics);

    // 4. Baskı tablası Z konumunu dişlinin en alt noktasına hizala
    const bottomZ =
      params.gearType === GearType.INTERNAL_RING
        ? -params.thickness * 0.5
        : -params.thickness * 0.5 - Math.max(0, params.hubBottomExtension);
    this.buildPlateGroup.position.set(0, 0, bottomZ - 0.15);

    this.syncGearRotations();
  }

  /**
   * Aktif parametre bölümüne göre dişlinin ana rengini bozmadan sadece ilgili bölgeye hafif bir parlama (glow) verir.
   */
  private applyZoneMaterialStyles(pulseFactor = 1.0): void {
    const params = this.currentParams;
    const baseStyle =
      (params && MATERIAL_STYLE_MAP[params.filamentMaterial]) ??
      MATERIAL_STYLE_MAP[FilamentMaterial.PLA];

    const activeClipping = this.displayOptions.showCrossSection
      ? [this.clippingPlane]
      : [];

    for (const mat of this.zoneMaterials) {
      mat.clippingPlanes = activeClipping;
      mat.color.setHex(baseStyle.color);
      mat.metalness = baseStyle.metalness;
      mat.roughness = baseStyle.roughness;
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
    }

    this.matingMaterial.clippingPlanes = activeClipping;
    this.matingMaterial.color.setHex(0xf43f5e);
    this.matingMaterial.emissive.setHex(0x000000);
    this.matingMaterial.emissiveIntensity = 0;

    if (this.activeHighlight === GearHighlightSection.NONE) {
      return;
    }

    // Sadece ilgili bölgeye kendi renginde hafif ve yumuşak bir parlama (emissive glow) uygula
    const subtleGlow = 0.24 * pulseFactor;

    switch (this.activeHighlight) {
      case GearHighlightSection.DIMENSIONS_AND_TYPE: {
        for (const z of [GearMeshZone.TOOTH_FLANK, GearMeshZone.TEETH_RIM]) {
          const mat = this.zoneMaterials[z];
          mat.emissive.setHex(baseStyle.color);
          mat.emissiveIntensity = subtleGlow;
        }
        break;
      }
      case GearHighlightSection.BORE_AND_SHAFT: {
        const boreMat = this.zoneMaterials[GearMeshZone.BORE];
        boreMat.emissive.setHex(0xffffff);
        boreMat.emissiveIntensity = subtleGlow * 1.15;
        break;
      }
      case GearHighlightSection.HUB_AND_WEB: {
        const hubWebMat = this.zoneMaterials[GearMeshZone.HUB_WEB];
        hubWebMat.emissive.setHex(baseStyle.color);
        hubWebMat.emissiveIntensity = subtleGlow;
        break;
      }
      case GearHighlightSection.EVOLVENT_AND_PRINT: {
        const flankMat = this.zoneMaterials[GearMeshZone.TOOTH_FLANK];
        flankMat.emissive.setHex(baseStyle.color);
        flankMat.emissiveIntensity = subtleGlow * 1.1;
        break;
      }
      case GearHighlightSection.MATING_SIMULATION: {
        this.matingMaterial.emissive.setHex(0xf43f5e);
        this.matingMaterial.emissiveIntensity = subtleGlow;
        break;
      }
    }
  }

  public setDisplayOptions(partial: Partial<ViewportDisplayOptions>): void {
    this.displayOptions = { ...this.displayOptions, ...partial };

    if (this.primaryWireframe) {
      this.primaryWireframe.visible = this.displayOptions.showWireframe;
    }
    if (this.matingWireframe) {
      this.matingWireframe.visible = this.displayOptions.showWireframe;
    }

    this.referenceOverlayGroup.visible = this.displayOptions.showPitchCircles;
    this.buildPlateGroup.visible = this.displayOptions.showBuildPlate;

    this.applyZoneMaterialStyles();
  }

  public getDisplayOptions(): ViewportDisplayOptions {
    return this.displayOptions;
  }

  public setCameraPreset(preset: 'iso' | 'top' | 'front' | 'fit'): void {
    const outerD = this.currentMetrics?.outerDiameter ?? 55;
    const dist = Math.max(45, outerD * 1.9);

    this.controls.target.set(0, 0, 0);

    switch (preset) {
      case 'top':
        this.camera.up.set(0, 1, 0);
        this.camera.position.set(0, 0, dist * 1.15);
        break;
      case 'front':
        this.camera.up.set(0, 0, 1);
        this.camera.position.set(0, -dist * 1.15, 4);
        break;
      case 'iso':
      case 'fit':
      default:
        this.camera.up.set(0, 0, 1);
        this.camera.position.set(dist * 0.5, -dist * 0.95, dist * 0.72);
        break;
    }

    this.controls.update();
  }

  public static createMatingGearParameters(primary: GearParameters): GearParameters {
    const oppositeHand =
      primary.helixHandedness === HelixHandedness.RIGHT
        ? HelixHandedness.LEFT
        : HelixHandedness.RIGHT;

    const matingType =
      primary.gearType === GearType.INTERNAL_RING ? GearType.SPUR : primary.gearType;

    return {
      ...primary,
      gearType: matingType,
      teethCount: Math.max(6, Math.round(primary.matingTeethCount)),
      profileShift: primary.gearType === GearType.INTERNAL_RING ? 0 : -primary.profileShift,
      helixHandedness: oppositeHand,
      webStyle: primary.matingTeethCount < 18 ? WebStyle.SOLID : primary.webStyle,
      boreDiameter: Math.min(
        primary.boreDiameter,
        primary.module * primary.matingTeethCount * 0.35
      ),
      hubTopExtension: 0,
      hubBottomExtension: 0,
      showMatingGear: false,
    };
  }

  private createBufferGeometry(meshData: GearMeshData): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
    geo.setIndex(new THREE.BufferAttribute(meshData.indices, 1));

    geo.clearGroups();
    for (const grp of meshData.zoneGroups) {
      if (grp.count > 0) {
        geo.addGroup(grp.start, grp.count, grp.zone);
      }
    }

    geo.computeBoundingSphere();
    return geo;
  }

  private rebuildReferenceOverlays(params: GearParameters, metrics: GearMetrics): void {
    this.clearGroupGeometry(this.referenceOverlayGroup);

    const zTop = params.thickness * 0.5 + 0.35;

    this.referenceOverlayGroup.add(
      this.createCircleLine(metrics.pitchDiameter * 0.5, zTop, 0x38bdf8, true)
    );
    this.referenceOverlayGroup.add(
      this.createCircleLine(metrics.baseDiameter * 0.5, zTop, 0xfbbf24, true)
    );
    this.referenceOverlayGroup.add(
      this.createCircleLine(metrics.outerDiameter * 0.5, zTop, 0x34d399, false)
    );
    this.referenceOverlayGroup.add(
      this.createCircleLine(metrics.rootDiameter * 0.5, zTop, 0xf87171, false)
    );

    if (params.showMatingGear) {
      const rPitch2 = metrics.effectiveModule * params.matingTeethCount * 0.5;
      const matingCircle = this.createCircleLine(rPitch2, zTop, 0xf43f5e, true);
      matingCircle.position.set(metrics.centerDistance, 0, 0);
      this.referenceOverlayGroup.add(matingCircle);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, zTop),
        new THREE.Vector3(metrics.centerDistance, 0, zTop),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0 });
      this.referenceOverlayGroup.add(new THREE.Line(lineGeo, lineMat));
    }
  }

  private createCircleLine(
    radius: number,
    z: number,
    colorHex: number,
    dashed: boolean
  ): THREE.Line {
    const segments = 128;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), z)
      );
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);

    if (dashed) {
      const mat = new THREE.LineDashedMaterial({
        color: colorHex,
        dashSize: 1.8,
        gapSize: 1.2,
        transparent: true,
        opacity: 0.85,
      });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      return line;
    }

    const mat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.55,
    });
    return new THREE.Line(geo, mat);
  }

  private setupLighting(): void {
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.85);
    hemiLight.position.set(0, 0, 150);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.55);
    keyLight.position.set(70, -85, 120);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 350;
    const d = 95;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rimLight.position.set(-90, 80, 60);
    this.scene.add(rimLight);

    const bottomFill = new THREE.DirectionalLight(0x94a3b8, 0.45);
    bottomFill.position.set(0, 50, -90);
    this.scene.add(bottomFill);
  }

  private setupBuildPlateGrid(): void {
    const gridHelper = new THREE.GridHelper(220, 22, 0x38bdf8, 0x1e293b);
    gridHelper.rotation.x = Math.PI * 0.5;
    this.buildPlateGroup.add(gridHelper);

    const plateGeo = new THREE.PlaneGeometry(220, 220);
    const plateMat = new THREE.ShadowMaterial({ opacity: 0.28 });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.receiveShadow = true;
    this.buildPlateGroup.add(plateMesh);
  }

  private syncGearRotations(): void {
    if (!this.currentParams) {
      return;
    }
    const z1 = Math.max(6, Math.round(this.currentParams.teethCount));
    const z2 = Math.max(6, Math.round(this.currentParams.matingTeethCount));

    this.primaryGroup.rotation.z = this.primaryAngleRad;

    if (this.matingGroup.visible) {
      const isInternal = this.currentParams.gearType === GearType.INTERNAL_RING;
      const phaseOffset = Math.PI + (isInternal ? 0 : Math.PI / z2);
      const directionSign = isInternal ? 1 : -1;
      this.matingGroup.rotation.z =
        phaseOffset + directionSign * this.primaryAngleRad * (z1 / z2);
    }
  }

  private startRenderLoop(): void {
    const animate = (now: number) => {
      this.animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;

      if (
        this.displayOptions.isAnimationPlaying &&
        this.currentParams &&
        this.currentParams.simulationRpm > 0
      ) {
        const radPerSec = (this.currentParams.simulationRpm * Math.PI * 2) / 60;
        this.primaryAngleRad = (this.primaryAngleRad + radPerSec * dt) % (Math.PI * 200);
        this.syncGearRotations();
      }

      if (this.activeHighlight !== GearHighlightSection.NONE) {
        this.pulseTime += dt * 3.5;
        const pulseFactor = 0.85 + 0.25 * Math.sin(this.pulseTime);
        this.applyZoneMaterialStyles(pulseFactor);
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private setupResizeHandling(): void {
    this.resizeObserver = new ResizeObserver(() => {
      const w = Math.max(200, this.container.clientWidth);
      const h = Math.max(200, this.container.clientHeight);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
    this.resizeObserver.observe(this.container);
  }

  private clearGroupGeometry(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh | THREE.Line;
      if (child.geometry) {
        child.geometry.dispose();
      }
      group.remove(child);
    }
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.resizeObserver?.disconnect();
    this.clearGroupGeometry(this.primaryGroup);
    this.clearGroupGeometry(this.matingGroup);
    this.clearGroupGeometry(this.referenceOverlayGroup);
    this.renderer.dispose();
  }
}
