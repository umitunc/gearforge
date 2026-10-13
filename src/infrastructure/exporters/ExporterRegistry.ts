import { ExportFormat } from '../../domain/models/GearTypes';
import {
  AsciiStlExporter,
  BinaryStlExporter,
  JsonConfigExporter,
  WavefrontObjExporter,
} from './GearExporters';
import { ExportArtifact, IGearExporter } from './interfaces/IGearExporter';

/**
 * 3D dosya ihracat stratejilerini yöneten kayıt defteri (OCP / DIP).
 */
export class ExporterRegistry {
  private readonly exporters = new Map<ExportFormat, IGearExporter>();

  constructor(customExporters?: readonly IGearExporter[]) {
    const defaults: IGearExporter[] = [
      new BinaryStlExporter(),
      new AsciiStlExporter(),
      new WavefrontObjExporter(),
      new JsonConfigExporter(),
    ];

    for (const exp of defaults) {
      this.register(exp);
    }

    if (customExporters) {
      for (const exp of customExporters) {
        this.register(exp);
      }
    }
  }

  public register(exporter: IGearExporter): void {
    this.exporters.set(exporter.format, exporter);
  }

  public resolve(format: ExportFormat): IGearExporter {
    const exporter = this.exporters.get(format);
    if (!exporter) {
      throw new Error(`Desteklenmeyen ihraç formatı: ${format}`);
    }
    return exporter;
  }

  public getAll(): readonly IGearExporter[] {
    return Array.from(this.exporters.values());
  }

  /**
   * Üretilen ExportArtifact nesnesini tarayıcı üzerinden kullanıcıya indirir.
   */
  public triggerBrowserDownload(artifact: ExportArtifact): void {
    const blob = new Blob([artifact.content], { type: artifact.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = artifact.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}
