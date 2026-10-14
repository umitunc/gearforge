import { GearParameters, createDefaultGearParameters } from '../../domain/models/GearParameters';
import { BoreType, FilamentMaterial, GearType, WebStyle } from '../../domain/models/GearTypes';
import { SavedGearProject, SavedGearProjectSummary } from '../../domain/models/SavedProject';

const STORAGE_KEY_PROJECTS = 'gearforge_saved_projects_v1';
const STORAGE_KEY_ACTIVE_ID = 'gearforge_active_project_id_v1';
const STORAGE_KEY_AUTOSAVE = 'gearforge_autosave_params_v1';

export class LocalStorageProjectRepository {
  private memoryMap = new Map<string, string>();

  constructor() {
    this.ensureSeedProjects();
  }

  private getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        return window.localStorage.getItem(key);
      }
    } catch {
      // sessizce belleğe dön
    }
    return this.memoryMap.get(key) ?? null;
  }

  private setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // sessizce belleğe dön
    }
    this.memoryMap.set(key, value);
  }

  private removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // sessizce belleğe dön
    }
    this.memoryMap.delete(key);
  }

  public getAll(): SavedGearProject[] {
    try {
      const raw = this.getItem(STORAGE_KEY_PROJECTS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  }

  public getById(id: string): SavedGearProject | null {
    const all = this.getAll();
    return all.find((p) => p.id === id) || null;
  }

  public save(
    name: string,
    parameters: GearParameters,
    existingId?: string,
    description?: string
  ): SavedGearProject {
    const all = this.getAll();
    const now = Date.now();
    const summary = this.buildSummary(parameters);

    let targetProject: SavedGearProject;

    if (existingId) {
      const idx = all.findIndex((p) => p.id === existingId);
      if (idx >= 0) {
        targetProject = {
          ...all[idx],
          name: name.trim() || all[idx].name,
          description: description !== undefined ? description : all[idx].description,
          parameters,
          summary,
          updatedAt: now,
        };
        all[idx] = targetProject;
      } else {
        targetProject = {
          id: existingId,
          name: name.trim() || 'Adsız Dişli Tasarımı',
          description,
          createdAt: now,
          updatedAt: now,
          parameters,
          summary,
        };
        all.unshift(targetProject);
      }
    } else {
      targetProject = {
        id: 'gear_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 6),
        name: name.trim() || 'Yeni Dişli Tasarımı',
        description,
        createdAt: now,
        updatedAt: now,
        parameters,
        summary,
      };
      all.unshift(targetProject);
    }

    this.persist(all);
    this.setActiveProjectId(targetProject.id);
    return targetProject;
  }

  public delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter((p) => p.id !== id);
    if (filtered.length === all.length) return false;

    this.persist(filtered);
    if (this.getActiveProjectId() === id) {
      this.setActiveProjectId(null);
    }
    return true;
  }

  public duplicate(id: string): SavedGearProject | null {
    const orig = this.getById(id);
    if (!orig) return null;

    const copyName = `${orig.name} (Kopya)`;
    return this.save(copyName, orig.parameters, undefined, orig.description);
  }

  public rename(id: string, newName: string): boolean {
    const all = this.getAll();
    const project = all.find((p) => p.id === id);
    if (!project) return false;

    project.name = newName.trim();
    project.updatedAt = Date.now();
    this.persist(all);
    return true;
  }

  public getActiveProjectId(): string | null {
    try {
      return this.getItem(STORAGE_KEY_ACTIVE_ID);
    } catch {
      return null;
    }
  }

  public setActiveProjectId(id: string | null): void {
    try {
      if (id) {
        this.setItem(STORAGE_KEY_ACTIVE_ID, id);
      } else {
        this.removeItem(STORAGE_KEY_ACTIVE_ID);
      }
    } catch (e) {
      console.warn('Aktif proje ID kaydedilemedi:', e);
    }
  }

  public saveAutoSave(parameters: GearParameters): void {
    try {
      this.setItem(STORAGE_KEY_AUTOSAVE, JSON.stringify(parameters));
    } catch {
      // quota hatası vs. sessizce geç
    }
  }

  public getAutoSave(): GearParameters | null {
    try {
      const raw = this.getItem(STORAGE_KEY_AUTOSAVE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public exportAllAsJson(): string {
    const projects = this.getAll();
    return JSON.stringify(
      {
        format: 'gearforge_saved_projects_v1',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        total: projects.length,
        projects,
      },
      null,
      2
    );
  }

  public importFromJson(jsonText: string): { importedCount: number; errors: string[] } {
    const errors: string[] = [];
    try {
      const parsed = JSON.parse(jsonText);
      const rawList: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.projects)
        ? parsed.projects
        : [parsed];

      const current = this.getAll();
      let importedCount = 0;

      for (const item of rawList) {
        const candidate = item as Partial<SavedGearProject>;
        const rawParams = (candidate.parameters || candidate) as GearParameters;

        if (typeof rawParams?.teethCount !== 'number') {
          errors.push(`Geçersiz proje nesnesi: Diş sayısı eksik.`);
          continue;
        }

        const now = Date.now();
        const mergedParams: GearParameters = {
          ...createDefaultGearParameters(),
          ...rawParams,
        };

        const newProject: SavedGearProject = {
          id: 'gear_' + (now + importedCount).toString(36) + '_' + Math.random().toString(36).substring(2, 6),
          name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name.trim() : `İçe Aktarılan Dişli (${mergedParams.teethCount} Diş)`,
          description: typeof candidate.description === 'string' ? candidate.description : undefined,
          createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : now,
          updatedAt: now,
          parameters: mergedParams,
          summary: this.buildSummary(mergedParams),
        };

        current.unshift(newProject);
        importedCount++;
      }

      this.persist(current);
      return { importedCount, errors };
    } catch (e) {
      errors.push(`JSON Çözümleme Hatası: ${(e as Error).message}`);
      return { importedCount: 0, errors };
    }
  }

  private persist(projects: SavedGearProject[]): void {
    try {
      this.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('LocalStorage yazma hatası (Kota aşımı olabilir):', e);
      throw new Error('Yerel depolama alanı dolu veya erişilemiyor.');
    }
  }

  private buildSummary(p: GearParameters): SavedGearProjectSummary {
    const d = p.teethCount * p.module;
    const da = d + 2 * p.module;
    return {
      gearType: p.gearType,
      teethCount: p.teethCount,
      module: p.module,
      pitchDiameter: Number(d.toFixed(2)),
      outerDiameter: Number(da.toFixed(2)),
      thickness: p.thickness,
      boreType: p.boreType,
      boreDiameter: p.boreDiameter,
      material: p.filamentMaterial,
    };
  }

  private ensureSeedProjects(): void {
    try {
      const existing = this.getItem(STORAGE_KEY_PROJECTS);
      if (existing) return; // Zaten mevcut, ezmeyelim

      const base = createDefaultGearParameters();
      const now = Date.now();

      const seed1: SavedGearProject = {
        id: 'seed_standard_spur_24t',
        name: 'Endüstriyel Düz Dişli (Kamalı M2.0)',
        description: 'DIN 6885 standart kama kanallı, 6 hafifletme delikli genel amaçlı redüktör dişlisi.',
        createdAt: now - 3600000 * 24 * 2,
        updatedAt: now - 3600000 * 2,
        parameters: {
          ...base,
          gearType: GearType.SPUR,
          teethCount: 24,
          module: 2.0,
          thickness: 10.0,
          boreType: BoreType.KEYWAY,
          boreDiameter: 10.0,
          keywayWidth: 3.0,
          keywayDepth: 1.5,
          webStyle: WebStyle.LIGHTENING_HOLES,
          cutoutCount: 6,
          hubTopExtension: 4.0,
          showMatingGear: true,
          matingTeethCount: 14,
        },
        summary: {
          gearType: GearType.SPUR,
          teethCount: 24,
          module: 2.0,
          pitchDiameter: 48,
          outerDiameter: 52,
          thickness: 10,
          boreType: BoreType.KEYWAY,
          boreDiameter: 10,
          material: FilamentMaterial.PLA,
        },
      };

      const seed2: SavedGearProject = {
        id: 'seed_nema17_pinion_15t',
        name: 'NEMA 17 Step Motor Pinyonu (D-Mil)',
        description: '5mm D-kesit mil bağlantılı, 15 diş M1.5 yüksek torklu CNC pinyonu.',
        createdAt: now - 3600000 * 24 * 5,
        updatedAt: now - 3600000 * 24,
        parameters: {
          ...base,
          gearType: GearType.SPUR,
          teethCount: 15,
          module: 1.5,
          thickness: 12.0,
          boreType: BoreType.D_SHAFT,
          boreDiameter: 5.0,
          dShaftFlatDepth: 0.8,
          webStyle: WebStyle.SOLID,
          hubTopExtension: 5.0,
          hubDiameter: 12.0,
          profileShift: 0.2,
          filamentMaterial: FilamentMaterial.PETG,
        },
        summary: {
          gearType: GearType.SPUR,
          teethCount: 15,
          module: 1.5,
          pitchDiameter: 22.5,
          outerDiameter: 25.5,
          thickness: 12,
          boreType: BoreType.D_SHAFT,
          boreDiameter: 5,
          material: FilamentMaterial.PETG,
        },
      };

      const seed3: SavedGearProject = {
        id: 'seed_spoke_gear_36t',
        name: 'Hafifletilmiş 8 Kollu Jant Dişli (M1.5)',
        description: 'Robotik kol için filament tasarruflu 8 kollu estetik gövde yapısı.',
        createdAt: now - 3600000 * 24 * 8,
        updatedAt: now - 3600000 * 12,
        parameters: {
          ...base,
          gearType: GearType.SPUR,
          teethCount: 36,
          module: 1.5,
          thickness: 8.0,
          boreType: BoreType.CIRCULAR,
          boreDiameter: 8.0,
          webStyle: WebStyle.SPOKED,
          cutoutCount: 8,
          spokeWidthFactor: 0.35,
          hubTopExtension: 3.0,
          hubBottomExtension: 3.0,
          filamentMaterial: FilamentMaterial.PLA,
        },
        summary: {
          gearType: GearType.SPUR,
          teethCount: 36,
          module: 1.5,
          pitchDiameter: 54,
          outerDiameter: 57,
          thickness: 8,
          boreType: BoreType.CIRCULAR,
          boreDiameter: 8,
          material: FilamentMaterial.PLA,
        },
      };

      this.persist([seed1, seed2, seed3]);
    } catch {
      // LocalStorage kapalı olabilir, sessiz geç
    }
  }
}
