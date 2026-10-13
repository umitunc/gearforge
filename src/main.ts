import { GearBuilderStore } from './application/GearBuilderStore';
import { GearMetricsCalculator } from './domain/calculators/GearMetricsCalculator';
import { GearParameterValidator } from './domain/calculators/GearParameterValidator';
import { ManifoldGearMeshBuilder } from './domain/mesh/ManifoldGearMeshBuilder';
import { AxialTwistRegistry } from './domain/mesh/twist/AxialTwistRegistry';
import { GearPresetRepository } from './domain/presets/GearPresetRepository';
import { BoreProfileRegistry } from './domain/profiles/bore/BoreProfileRegistry';
import { InvoluteToothProfileGenerator } from './domain/profiles/tooth/InvoluteToothProfileGenerator';
import { WebCutoutRegistry } from './domain/profiles/web/WebCutoutRegistry';
import { ExporterRegistry } from './infrastructure/exporters/ExporterRegistry';
import { GearViewportController } from './infrastructure/three/GearViewportController';
import { EngineeringMetricsView } from './presentation/components/EngineeringMetricsView';
import { ParameterControlsView } from './presentation/components/ParameterControlsView';
import { ViewportOverlayToolbar } from './presentation/components/ViewportOverlayToolbar';
import './presentation/styles/main.css';

/**
 * Uygulama Bağımlılık Enjeksiyonu Başlangıç Noktası (Composition Root - DIP).
 */
function bootstrapGearBuilderApp(): void {
  const leftPanel = document.getElementById('left-parameter-panel');
  const viewportStage = document.getElementById('viewport-stage');
  const canvasHost = document.getElementById('viewport-canvas-host');
  const rightPanel = document.getElementById('right-metrics-panel');

  if (!leftPanel || !viewportStage || !canvasHost || !rightPanel) {
    throw new Error('Uygulama DOM konteynerleri bulunamadı.');
  }

  // 1. Domain & Infrastructure servislerini oluştur (SOLID - DIP)
  const validator = new GearParameterValidator();
  const metricsCalculator = new GearMetricsCalculator();
  const toothGenerator = new InvoluteToothProfileGenerator();
  const boreRegistry = new BoreProfileRegistry();
  const webCutoutRegistry = new WebCutoutRegistry();
  const twistRegistry = new AxialTwistRegistry();

  const meshBuilder = new ManifoldGearMeshBuilder(
    toothGenerator,
    boreRegistry,
    webCutoutRegistry,
    twistRegistry,
    metricsCalculator
  );

  const presetRepository = new GearPresetRepository();
  const exporterRegistry = new ExporterRegistry();

  // 2. Application Store oluştur
  const store = new GearBuilderStore(
    validator,
    metricsCalculator,
    meshBuilder,
    presetRepository,
    exporterRegistry
  );

  // 3. Three.js 3B Sahne Kontrolcüsünü başlat ve Store'a bağla
  const viewportController = new GearViewportController(canvasHost);
  store.subscribe((state) => {
    viewportController.updateGearScene(
      state.primaryMesh,
      state.matingMesh,
      state.parameters,
      state.metrics,
      state.activeHighlightSection
    );
  });

  // 4. UI Görünüm Bileşenlerini bağla
  new ViewportOverlayToolbar(viewportStage, viewportController, store);
  new ParameterControlsView(leftPanel, store);
  new EngineeringMetricsView(rightPanel, store);
}

bootstrapGearBuilderApp();
