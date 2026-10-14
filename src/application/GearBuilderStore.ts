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
import { SavedGearProject } from '../domain/models/SavedProject';
import { ExporterRegistry } from '../infrastructure/exporters/ExporterRegistry';
import { LocalStorageProjectRepository } from '../infrastructure/storage/LocalStorageProjectRepository';
import { GearViewportController } from '../infrastructure/three/GearViewportController';

export interface GearBuilderState {
  readonly parameters: GearParameters;
  readonly metrics: GearMetrics;
  readonly validationIssues: readonly ValidationIssue[];
  readonly primaryMesh: GearMeshData;
  readonly matingMesh: GearMeshData | null;
  readonly activePresetId: string | null;
  readonly activeHighlightSection: GearHighlightSection;
  readonly currentProjectId: string | null;
  readonly currentProjectName: string;
  readonly isDirty: boolean;
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
  private readonly storageRepository: LocalStorageProjectRepository;

  private state: GearBuilderState;
  private readonly subscribers = new Set<StateSubscriber>();

  constructor(
    validator = new GearParameterValidator(),
    metricsCalculator = new GearMetricsCalculator(),
    meshBuilder = new ManifoldGearMeshBuilder(),
    presetRepository = new GearPresetRepository(),
    exporterRegistry = new ExporterRegistry(),
    storageRepository = new LocalStorageProjectRepository()
  ) {
    this.validator = validator;
    this.metricsCalculator = metricsCalculator;
    this.meshBuilder = meshBuilder;
    this.presetRepository = presetRepository;
    this.exporterRegistry = exporterRegistry;
    this.storageRepository = storageRepository;

    // Son aktif projeyi kontrol et veya varsayılanı yükle
    let initialParams = createDefaultGearParameters();
    let initialPresetId: string | null = 'standard_spur_keyway';
    let initialProjectId: string | null = null;
    let initialProjectName = 'Yeni Dişli Tasarımı';

    const activeId = this.storageRepository.getActiveProjectId();
    if (activeId) {
      const saved = this.storageRepository.getById(activeId);
      if (saved) {
        initialParams = saved.parameters;
        initialPresetId = null;
        initialProjectId = saved.id;
        initialProjectName = saved.name;
      }
    }

    this.state = this.computeFullState(
      initialParams,
      initialPresetId,
      GearHighlightSection.NONE,
      initialProjectId,
      initialProjectName,
      false
    );
  }

  public getState(): GearBuilderState {
    return this.state;
  }

  public getStorageRepository(): LocalStorageProjectRepository {
    return this.storageRepository;
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
      this.state.activeHighlightSection,
      this.state.currentProjectId,
      this.state.currentProjectName,
      true
    );
    this.storageRepository.saveAutoSave(merged);
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
      this.state.activeHighlightSection,
      null,
      preset.name,
      false
    );
    this.storageRepository.setActiveProjectId(null);
    this.storageRepository.saveAutoSave(preset.parameters);
    this.notify();
  }

  public newProject(): void {
    const defaultParams = createDefaultGearParameters();
    this.state = this.computeFullState(
      defaultParams,
      'standard_spur_keyway',
      GearHighlightSection.NONE,
      null,
      'Yeni Dişli Tasarımı',
      false
    );
    this.storageRepository.setActiveProjectId(null);
    this.storageRepository.saveAutoSave(defaultParams);
    this.notify();
  }

  public resetToDefault(): void {
    this.newProject();
  }

  public saveCurrentProject(name?: string, description?: string): SavedGearProject {
    const finalName = name?.trim() || this.state.currentProjectName || 'Yeni Dişli Tasarımı';
    const saved = this.storageRepository.save(
      finalName,
      this.state.parameters,
      this.state.currentProjectId || undefined,
      description
    );

    this.state = {
      ...this.state,
      currentProjectId: saved.id,
      currentProjectName: saved.name,
      isDirty: false,
    };
    this.notify();
    return saved;
  }

  public saveProjectAs(name: string, description?: string): SavedGearProject {
    const saved = this.storageRepository.save(
      name,
      this.state.parameters,
      undefined,
      description
    );

    this.state = {
      ...this.state,
      currentProjectId: saved.id,
      currentProjectName: saved.name,
      isDirty: false,
    };
    this.notify();
    return saved;
  }

  public loadProjectById(id: string): boolean {
    const project = this.storageRepository.getById(id);
    if (!project) return false;

    this.state = this.computeFullState(
      project.parameters,
      null,
      GearHighlightSection.NONE,
      project.id,
      project.name,
      false
    );
    this.storageRepository.setActiveProjectId(project.id);
    this.storageRepository.saveAutoSave(project.parameters);
    this.notify();
    return true;
  }

  public deleteProject(id: string): boolean {
    const currentId = this.state.currentProjectId;
    const ok = this.storageRepository.delete(id);
    if (ok && currentId === id) {
      this.state = {
        ...this.state,
        currentProjectId: null,
        isDirty: true,
      };
      this.notify();
    }
    return ok;
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
      const suggestedName = typeof parsed?.name === 'string' ? parsed.name : 'İçe Aktarılan Dişli';
      this.state = this.computeFullState(
        merged,
        null,
        this.state.activeHighlightSection,
        null,
        suggestedName,
        true
      );
      this.storageRepository.saveAutoSave(merged);
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  private computeFullState(
    rawParams: GearParameters,
    presetId: string | null,
    activeHighlightSection: GearHighlightSection,
    currentProjectId: string | null,
    currentProjectName: string,
    isDirty: boolean
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
      currentProjectId,
      currentProjectName,
      isDirty,
    };
  }

  private notify(): void {
    for (const sub of this.subscribers) {
      sub(this.state);
    }
  }
}
