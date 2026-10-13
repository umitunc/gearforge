import { describe, expect, it } from 'vitest';
import { GearBuilderStore } from '../../application/GearBuilderStore';
import { ExporterRegistry } from '../../infrastructure/exporters/ExporterRegistry';
import { GearMetricsCalculator } from '../calculators/GearMetricsCalculator';
import { GearParameterValidator } from '../calculators/GearParameterValidator';
import { InvoluteMathCalculator } from '../calculators/InvoluteMathCalculator';
import { ManifoldGearMeshBuilder } from '../mesh/ManifoldGearMeshBuilder';
import { createDefaultGearParameters, GearParameters } from '../models/GearParameters';
import { BoreType, ExportFormat, GearType, SizingMode, WebStyle } from '../models/GearTypes';

describe('Gear Builder Domain, Exporters & Watertight Manifold Tests', () => {
  const meshBuilder = new ManifoldGearMeshBuilder();
  const metricsCalc = new GearMetricsCalculator();
  const validator = new GearParameterValidator();
  const exporterRegistry = new ExporterRegistry();

  it('calculates exact ISO pitch and outer diameters in MODULE mode', () => {
    const params: GearParameters = {
      ...createDefaultGearParameters(),
      sizingMode: SizingMode.MODULE,
      teethCount: 24,
      module: 2.0,
      addendumFactor: 1.0,
      profileShift: 0.0,
    };
    const radii = InvoluteMathCalculator.calculateRadii(params);
    expect(radii.pitchRadius * 2).toBeCloseTo(48.0, 4);
    expect(radii.outerRadius * 2).toBeCloseTo(52.0, 4);
  });

  it('calculates exact module when sizing by TARGET_OUTER_DIAMETER', () => {
    const params: GearParameters = {
      ...createDefaultGearParameters(),
      sizingMode: SizingMode.OUTER_DIAMETER,
      teethCount: 18,
      targetOuterDiameter: 40.0,
      addendumFactor: 1.0,
      profileShift: 0.0,
    };
    const m = InvoluteMathCalculator.resolveEffectiveModule(params);
    expect(m).toBeCloseTo(2.0, 4);
  });

  it('produces 100% watertight (2-manifold) mesh across all GearTypes', () => {
    const gearTypes = [
      GearType.SPUR,
      GearType.HELICAL,
      GearType.HERRINGBONE,
      GearType.BEVEL_TAPER,
      GearType.INTERNAL_RING,
    ];

    for (const gearType of gearTypes) {
      const params = validator.sanitize({
        ...createDefaultGearParameters(),
        gearType,
      });
      const meshData = meshBuilder.build(params);
      expect(
        meshData.manifoldReport.isWatertight,
        `GearType ${gearType} should be watertight`
      ).toBe(true);
      expect(meshData.manifoldReport.volumeMm3).toBeGreaterThan(100);
      expect(meshData.manifoldReport.triangleCount).toBeGreaterThan(100);
    }
  });

  it('produces 100% watertight mesh across all BoreTypes and WebStyles', () => {
    const boreTypes = [
      BoreType.NONE,
      BoreType.CIRCULAR,
      BoreType.D_SHAFT,
      BoreType.DOUBLE_D,
      BoreType.KEYWAY,
      BoreType.HEXAGONAL,
      BoreType.SQUARE,
      BoreType.SPLINE,
    ];
    const webStyles = [
      WebStyle.SOLID,
      WebStyle.RECESSED,
      WebStyle.LIGHTENING_HOLES,
      WebStyle.SPOKED,
    ];

    for (const boreType of boreTypes) {
      for (const webStyle of webStyles) {
        const params = validator.sanitize({
          ...createDefaultGearParameters(),
          boreType,
          webStyle,
          teethCount: 30,
          module: 2.0,
        });
        const meshData = meshBuilder.build(params);
        expect(
          meshData.manifoldReport.isWatertight,
          `BoreType=${boreType}, WebStyle=${webStyle} should be watertight`
        ).toBe(true);
        const metrics = metricsCalc.calculate(params, meshData.manifoldReport.volumeMm3);
        expect(metrics.estimatedWeightGrams).toBeGreaterThan(0);
      }
    }
  });

  it('exports valid Binary STL, ASCII STL, Wavefront OBJ, and JSON artifacts', () => {
    const store = new GearBuilderStore();
    for (const preset of store.getPresets()) {
      store.applyPreset(preset.id);
      const state = store.getState();
      expect(state.primaryMesh.manifoldReport.isWatertight).toBe(true);
    }

    const { primaryMesh, parameters } = store.getState();

    const binStl = exporterRegistry.resolve(ExportFormat.STL_BINARY).export(primaryMesh, parameters);
    expect(binStl.byteSize).toBe(84 + primaryMesh.manifoldReport.triangleCount * 50);

    const asciiStl = exporterRegistry.resolve(ExportFormat.STL_ASCII).export(primaryMesh, parameters);
    expect(typeof asciiStl.content).toBe('string');
    expect((asciiStl.content as string).startsWith('solid gearforge_gear')).toBe(true);

    const objOut = exporterRegistry.resolve(ExportFormat.OBJ).export(primaryMesh, parameters);
    expect((objOut.content as string).includes('v ')).toBe(true);

    const jsonOut = exporterRegistry.resolve(ExportFormat.JSON_CONFIG).export(primaryMesh, parameters);
    expect(store.importJsonConfiguration(jsonOut.content as string)).toBe(true);

    // Zone groups toplam indeks sayısı doğrulaması
    const totalGroupedIndices = primaryMesh.zoneGroups.reduce((acc, g) => acc + g.count, 0);
    expect(totalGroupedIndices).toBe(primaryMesh.indices.length);
  });
});
