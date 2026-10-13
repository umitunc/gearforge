import { GearParameters } from '../../../domain/models/GearParameters';
import { ExportFormat } from '../../../domain/models/GearTypes';
import { GearMeshData } from '../../../domain/models/GeometryTypes';

export interface ExportArtifact {
  readonly fileName: string;
  readonly mimeType: string;
  readonly content: ArrayBuffer | string;
  readonly byteSize: number;
}

/**
 * 3D Yazıcı veya CAD formatlarına dışa aktarım stratejisi arayüzü (ISP / OCP / DIP).
 */
export interface IGearExporter {
  readonly format: ExportFormat;
  readonly label: string;
  readonly extension: string;

  export(meshData: GearMeshData, params: GearParameters, suffix?: string): ExportArtifact;
}
