import { GearMetricsCalculator } from '../domain/calculators/GearMetricsCalculator';
import { GearParameterValidator } from '../domain/calculators/GearParameterValidator';
import { ManifoldGearMeshBuilder } from '../domain/mesh/ManifoldGearMeshBuilder';
import { GearMetrics, ValidationIssue } from '../domain/models/GearMetrics';
import {
  createDefaultGearParameters,
  GearParameters,
} from '../domain/models/GearParameters';
import { ExportFormat, GearHighlightSection } from '../domain/models/GearTypes';
import { GearMeshData } from '../domain/models/GeometryTypes';
import {
  GearPreset,
  GearPresetRepository,
} from '../domain/presets/GearPresetRepository';
import { ExporterRegistry } from '../infrastructure/exporters/ExporterRegistry';
import { GearViewportController } from '../infrastructure/three/GearViewportController';

export interface GearBuilderState {
  readonly parameters: GearParameters;
  readonly metrics: GearMetrics;
  readonly validationIssues: readonly ValidationIssue[];
  readonly primaryMesh: GearMeshData;
  readonly matingMesh: GearMeshData | null;
  readonly activePresetId: string | null;
  readonly activeHighlightSection: GearHighlightSection;
}

export type StateSubscriber = (state: GearBuilderState) => void;

/**
 * Uygulama katmanı durum yöneticisi ve kullanım senaryosu (Use-Case) koordinatörü (SRP / DIP).
 */
export class GearBuilderStore {
  private readonly validator: GearParameterValidator;
  private readonly metricsCalculator: GearMetricsCalculator;
  private readonly meshBuilder: ManifoldGearMeshBuilder;
  private readonly presetRepository: GearPresetRepository;
  private readonly exporterRegistry: ExporterRegistry;

  private state: GearBuilderState;
  private readonly subscribers = new Set<StateSubscriber>();

  constructor(
    validator = new GearParameterValidator(),
    metricsCalculator = new GearMetricsCalculator(),
    meshBuilder = new ManifoldGearMeshBuilder(),
    presetRepository = new GearPresetRepository(),
    exporterRegistry = new ExporterRegistry()
  ) {
    this.validator = validator;
    this.metricsCalculator = metricsCalculator;
    this.meshBuilder = meshBuilder;
    this.presetRepository = presetRepository;
    this.exporterRegistry = exporterRegistry;

    this.state = this.computeFullState(
      createDefaultGearParameters(),
      'standard_spur_keyway',
      GearHighlightSection.NONE
    );
  }

  public getState(): GearBuilderState {
    return this.state;
  }

  public getPresets(): readonly GearPreset[] {
    return this.presetRepository.getAll();
  }

  public subscribe(subscriber: StateSubscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.state);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  public updateParameters(partial: Partial<GearParameters>): void {
    const merged: GearParameters = {
      ...this.state.parameters,
      ...partial,
    };
    this.state = this.computeFullState(
      merged,
      null,
      this.state.activeHighlightSection
    );
    this.notify();
  }

  /**
   * Aktif parametre bölümüne göre 3B dişli üzerindeki vurgulanacak bölgeyi günceller (Geometriyi yeniden hesaplamaz).
   */
  public setActiveHighlightSection(section: GearHighlightSection): void {
    if (this.state.activeHighlightSection === section) {
      return;
    }
    this.state = {
      ...this.state,
      activeHighlightSection: section,
    };
    this.notify();
  }

  public applyPreset(presetId: string): void {
    const preset = this.presetRepository.getById(presetId);
    if (!preset) {
      return;
    }
    this.state = this.computeFullState(
      preset.parameters,
      preset.id,
      this.state.activeHighlightSection
    );
    this.notify();
  }

  public resetToDefault(): void {
    this.state = this.computeFullState(
      createDefaultGearParameters(),
      'standard_spur_keyway',
      GearHighlightSection.NONE
    );
    this.notify();
  }

  public exportPrimaryGear(format: ExportFormat): void {
    const exporter = this.exporterRegistry.resolve(format);
    const artifact = exporter.export(this.state.primaryMesh, this.state.parameters);
    this.exporterRegistry.triggerBrowserDownload(artifact);
  }

  public exportMatingGear(format: ExportFormat): void {
    if (!this.state.matingMesh) {
      const matingParams = GearViewportController.createMatingGearParameters(
        this.state.parameters
      );
      const sanitizedMating = this.validator.sanitize(matingParams);
      const matingMesh = this.meshBuilder.build(sanitizedMating);
      const exporter = this.exporterRegistry.resolve(format);
      const artifact = exporter.export(matingMesh, sanitizedMating, 'pinion');
      this.exporterRegistry.triggerBrowserDownload(artifact);
      return;
    }

    const matingParams = GearViewportController.createMatingGearParameters(
      this.state.parameters
    );
    const exporter = this.exporterRegistry.resolve(format);
    const artifact = exporter.export(this.state.matingMesh, matingParams, 'pinion');
    this.exporterRegistry.triggerBrowserDownload(artifact);
  }

  public importJsonConfiguration(jsonText: string): boolean {
    try {
      const parsed = JSON.parse(jsonText);
      const rawParams = parsed?.parameters ?? parsed;
      if (typeof rawParams?.teethCount !== 'number') {
        return false;
      }
      const merged: GearParameters = {
        ...createDefaultGearParameters(),
        ...rawParams,
      };
      this.state = this.computeFullState(
        merged,
        null,
        this.state.activeHighlightSection
      );
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  private computeFullState(
    rawParams: GearParameters,
    presetId: string | null,
    activeHighlightSection: GearHighlightSection
  ): GearBuilderState {
    const parameters = this.validator.sanitize(rawParams);
    const validationIssues = this.validator.validate(parameters);
    const primaryMesh = this.meshBuilder.build(parameters);

    let matingMesh: GearMeshData | null = null;
    if (parameters.showMatingGear) {
      const matingParams = this.validator.sanitize(
        GearViewportController.createMatingGearParameters(parameters)
      );
      matingMesh = this.meshBuilder.build(matingParams);
    }

    const metrics = this.metricsCalculator.calculate(
      parameters,
      primaryMesh.manifoldReport.volumeMm3
    );

    return {
      parameters,
      metrics,
      validationIssues,
      primaryMesh,
      matingMesh,
      activePresetId: presetId,
      activeHighlightSection,
    };
  }

  private notify(): void {
    for (const sub of this.subscribers) {
      sub(this.state);
    }
  }
}
