import { describe, expect, it } from 'vitest';
import { LocalStorageProjectRepository } from '../../infrastructure/storage/LocalStorageProjectRepository';
import { createDefaultGearParameters } from '../../domain/models/GearParameters';

describe('LocalStorageProjectRepository Tests', () => {
  it('initializes with seed projects when empty', () => {
    const repo = new LocalStorageProjectRepository();
    const projects = repo.getAll();
    expect(projects.length).toBeGreaterThanOrEqual(1);
    expect(projects[0]).toHaveProperty('id');
    expect(projects[0]).toHaveProperty('name');
    expect(projects[0]).toHaveProperty('parameters');
    expect(projects[0]).toHaveProperty('summary');
  });

  it('saves new gear project and retrieves it by id', () => {
    const repo = new LocalStorageProjectRepository();
    const params = {
      ...createDefaultGearParameters(),
      teethCount: 42,
      module: 2.5,
    };

    const saved = repo.save('Özel Redüktör Z42', params, undefined, 'Test açıklaması');
    expect(saved.id).toBeTruthy();
    expect(saved.name).toBe('Özel Redüktör Z42');
    expect(saved.summary.teethCount).toBe(42);

    const fetched = repo.getById(saved.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.parameters.teethCount).toBe(42);
    expect(fetched?.summary.teethCount).toBe(42);
  });

  it('updates an existing project when existingId is provided', () => {
    const repo = new LocalStorageProjectRepository();
    const params = createDefaultGearParameters();
    const saved = repo.save('İlk İsim', params);

    const updatedParams = { ...params, teethCount: 50 };
    const updated = repo.save('Güncellenmiş İsim', updatedParams, saved.id);

    expect(updated.id).toBe(saved.id);
    expect(updated.name).toBe('Güncellenmiş İsim');
    expect(updated.summary.teethCount).toBe(50);
  });

  it('duplicates an existing project', () => {
    const repo = new LocalStorageProjectRepository();
    const saved = repo.save('Orijinal Dişli', createDefaultGearParameters());
    const dup = repo.duplicate(saved.id);

    expect(dup).not.toBeNull();
    expect(dup?.id).not.toBe(saved.id);
    expect(dup?.name).toBe('Orijinal Dişli (Kopya)');
  });

  it('deletes an existing project', () => {
    const repo = new LocalStorageProjectRepository();
    const saved = repo.save('Silinecek Dişli', createDefaultGearParameters());
    const ok = repo.delete(saved.id);
    expect(ok).toBe(true);

    const lookup = repo.getById(saved.id);
    expect(lookup).toBeNull();
  });

  it('exports and imports projects via JSON', () => {
    const repo = new LocalStorageProjectRepository();
    const jsonStr = repo.exportAllAsJson();
    expect(typeof jsonStr).toBe('string');
    expect(jsonStr).toContain('gearforge_saved_projects_v1');

    const result = repo.importFromJson(jsonStr);
    expect(result.errors.length).toBe(0);
    expect(result.importedCount).toBeGreaterThan(0);
  });
});
