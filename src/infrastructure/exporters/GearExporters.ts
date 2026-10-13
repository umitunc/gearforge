import { GearParameters } from '../../domain/models/GearParameters';
import { ExportFormat } from '../../domain/models/GearTypes';
import { GearMeshData } from '../../domain/models/GeometryTypes';
import { ExportArtifact, IGearExporter } from './interfaces/IGearExporter';

function buildBaseFileName(params: GearParameters, suffix?: string): string {
  const tag = suffix ? `_${suffix}` : '';
  return `gear_${params.gearType}_z${params.teethCount}_m${params.module.toFixed(2)}_b${params.thickness.toFixed(1)}${tag}`;
}

/**
 * 1. Binary STL İhracatçısı (Cura, PrusaSlicer, Bambu Studio, OrcaSlicer için standart ve hızlı format)
 */
export class BinaryStlExporter implements IGearExporter {
  public readonly format = ExportFormat.STL_BINARY;
  public readonly label = 'Binary STL (.stl) — 3D Yazıcı Standart';
  public readonly extension = 'stl';

  public export(
    meshData: GearMeshData,
    params: GearParameters,
    suffix?: string
  ): ExportArtifact {
    const triCount = meshData.indices.length / 3;
    const byteLength = 84 + triCount * 50;
    const buffer = new ArrayBuffer(byteLength);
    const view = new DataView(buffer);

    // 80-byte ASCII başlık (Birim: mm)
    const headerText = `GearForge 3D Builder | type=${params.gearType} z=${params.teethCount} m=${params.module} unit=mm`;
    for (let i = 0; i < 80; i++) {
      view.setUint8(i, i < headerText.length ? headerText.charCodeAt(i) : 0x20);
    }

    // Üçgen sayısı (uint32 little-endian)
    view.setUint32(80, triCount, true);

    const pos = meshData.positions;
    const norm = meshData.normals;
    const idx = meshData.indices;

    let offset = 84;
    for (let t = 0; t < triCount; t++) {
      const i0 = idx[t * 3] * 3;
      const i1 = idx[t * 3 + 1] * 3;
      const i2 = idx[t * 3 + 2] * 3;

      // Normal vektörü
      view.setFloat32(offset, norm[i0], true);
      view.setFloat32(offset + 4, norm[i0 + 1], true);
      view.setFloat32(offset + 8, norm[i0 + 2], true);

      // Köşe 1
      view.setFloat32(offset + 12, pos[i0], true);
      view.setFloat32(offset + 16, pos[i0 + 1], true);
      view.setFloat32(offset + 20, pos[i0 + 2], true);

      // Köşe 2
      view.setFloat32(offset + 24, pos[i1], true);
      view.setFloat32(offset + 28, pos[i1 + 1], true);
      view.setFloat32(offset + 32, pos[i1 + 2], true);

      // Köşe 3
      view.setFloat32(offset + 36, pos[i2], true);
      view.setFloat32(offset + 40, pos[i2 + 1], true);
      view.setFloat32(offset + 44, pos[i2 + 2], true);

      // Attribute byte count (uint16 = 0)
      view.setUint16(offset + 48, 0, true);
      offset += 50;
    }

    return {
      fileName: `${buildBaseFileName(params, suffix)}.stl`,
      mimeType: 'model/stl',
      content: buffer,
      byteSize: byteLength,
    };
  }
}

/**
 * 2. ASCII STL İhracatçısı (Okunabilir metin tabanlı STL)
 */
export class AsciiStlExporter implements IGearExporter {
  public readonly format = ExportFormat.STL_ASCII;
  public readonly label = 'ASCII STL (.stl) — Metin Tabanlı';
  public readonly extension = 'stl';

  public export(
    meshData: GearMeshData,
    params: GearParameters,
    suffix?: string
  ): ExportArtifact {
    const triCount = meshData.indices.length / 3;
    const pos = meshData.positions;
    const norm = meshData.normals;
    const idx = meshData.indices;

    const lines: string[] = ['solid gearforge_gear'];

    for (let t = 0; t < triCount; t++) {
      const i0 = idx[t * 3] * 3;
      const i1 = idx[t * 3 + 1] * 3;
      const i2 = idx[t * 3 + 2] * 3;

      lines.push(
        `  facet normal ${norm[i0].toFixed(6)} ${norm[i0 + 1].toFixed(6)} ${norm[i0 + 2].toFixed(6)}`,
        '    outer loop',
        `      vertex ${pos[i0].toFixed(5)} ${pos[i0 + 1].toFixed(5)} ${pos[i0 + 2].toFixed(5)}`,
        `      vertex ${pos[i1].toFixed(5)} ${pos[i1 + 1].toFixed(5)} ${pos[i1 + 2].toFixed(5)}`,
        `      vertex ${pos[i2].toFixed(5)} ${pos[i2 + 1].toFixed(5)} ${pos[i2 + 2].toFixed(5)}`,
        '    endloop',
        '  endfacet'
      );
    }

    lines.push('endsolid gearforge_gear');
    const content = lines.join('\n');

    return {
      fileName: `${buildBaseFileName(params, suffix)}_ascii.stl`,
      mimeType: 'text/plain',
      content,
      byteSize: content.length,
    };
  }
}

/**
 * 3. Wavefront OBJ İhracatçısı (CAD & 3D Modelleme yazılımları için)
 */
export class WavefrontObjExporter implements IGearExporter {
  public readonly format = ExportFormat.OBJ;
  public readonly label = 'Wavefront OBJ (.obj)';
  public readonly extension = 'obj';

  public export(
    meshData: GearMeshData,
    params: GearParameters,
    suffix?: string
  ): ExportArtifact {
    const pos = meshData.positions;
    const norm = meshData.normals;
    const idx = meshData.indices;
    const vertexCount = pos.length / 3;
    const triCount = idx.length / 3;

    const lines: string[] = [
      '# GearForge 3D Builder OBJ Export (Units: mm)',
      `o Gear_${params.gearType}_Z${params.teethCount}`,
    ];

    for (let v = 0; v < vertexCount; v++) {
      const b = v * 3;
      lines.push(`v ${pos[b].toFixed(5)} ${pos[b + 1].toFixed(5)} ${pos[b + 2].toFixed(5)}`);
    }

    for (let v = 0; v < vertexCount; v++) {
      const b = v * 3;
      lines.push(`vn ${norm[b].toFixed(5)} ${norm[b + 1].toFixed(5)} ${norm[b + 2].toFixed(5)}`);
    }

    for (let t = 0; t < triCount; t++) {
      const a = idx[t * 3] + 1;
      const b = idx[t * 3 + 1] + 1;
      const c = idx[t * 3 + 2] + 1;
      lines.push(`f ${a}//${a} ${b}//${b} ${c}//${c}`);
    }

    const content = lines.join('\n');
    return {
      fileName: `${buildBaseFileName(params, suffix)}.obj`,
      mimeType: 'text/plain',
      content,
      byteSize: content.length,
    };
  }
}

/**
 * 4. JSON Parametrik Konfigürasyon İhracatçısı (Tasarımı kaydetmek ve geri yüklemek için)
 */
export class JsonConfigExporter implements IGearExporter {
  public readonly format = ExportFormat.JSON_CONFIG;
  public readonly label = 'Parametrik Proje (.json)';
  public readonly extension = 'json';

  public export(
    _meshData: GearMeshData,
    params: GearParameters,
    suffix?: string
  ): ExportArtifact {
    const payload = {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      parameters: params,
    };
    const content = JSON.stringify(payload, null, 2);

    return {
      fileName: `${buildBaseFileName(params, suffix)}.json`,
      mimeType: 'application/json',
      content,
      byteSize: content.length,
    };
  }
}
