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
import { PwaManager } from './infrastructure/pwa/PwaManager';
import { LocalStorageProjectRepository } from './infrastructure/storage/LocalStorageProjectRepository';
import { GearViewportController } from './infrastructure/three/GearViewportController';
import { AppMenuBar } from './presentation/components/AppMenuBar';
import { EngineeringMetricsView } from './presentation/components/EngineeringMetricsView';
import { MobileDrawerSheet } from './presentation/components/MobileDrawerSheet';
import { GearCreationWizardModal } from './presentation/components/GearCreationWizardModal';
import { ParameterControlsView } from './presentation/components/ParameterControlsView';
import { ProjectManagerModal } from './presentation/components/ProjectManagerModal';
import { SaveProjectModal } from './presentation/components/SaveProjectModal';
import { SwipeCategoryBar } from './presentation/components/SwipeCategoryBar';
import { ViewportDimensionOverlay } from './presentation/components/ViewportDimensionOverlay';
import { ViewportOverlayToolbar } from './presentation/components/ViewportOverlayToolbar';
import { GearHighlightSection } from './domain/models/GearTypes';
import './presentation/styles/main.css';

/**
 * Uygulama Bağımlılık Enjeksiyonu Başlangıç Noktası (Composition Root - DIP).
 */
function bootstrapGearBuilderApp(): void {
  const leftPanel = document.getElementById('left-parameter-panel');
  const viewportStage = document.getElementById('viewport-stage');
  const canvasHost = document.getElementById('viewport-canvas-host');
  const rightPanel = document.getElementById('right-metrics-panel');
  const menubarEl = document.getElementById('app-menubar');
  const swipeContainer = document.getElementById('swipe-category-container');
  const dimensionContainer = document.getElementById('viewport-dimension-container');
  const mobileDrawerHost = document.getElementById('mobile-drawer-host');

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
  const storageRepository = new LocalStorageProjectRepository();

  // 2. Application Store oluştur
  const store = new GearBuilderStore(
    validator,
    metricsCalculator,
    meshBuilder,
    presetRepository,
    exporterRegistry,
    storageRepository
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

  // 4. Modalleri oluştur (Save, Projeler Yöneticisi ve Dişli Tasarım Sihirbazı)
  const saveModal = new SaveProjectModal(store);
  const projectManagerModal = new ProjectManagerModal(store, saveModal);
  const wizardModal = new GearCreationWizardModal(store);

  // 5. Üst Menü Çubuğunu (AppMenuBar) bağla
  if (menubarEl) {
    new AppMenuBar(
      menubarEl,
      store,
      viewportController,
      projectManagerModal,
      saveModal,
      wizardModal
    );
  }

  // 6. UI Görünüm Bileşenlerini bağla
  const parameterControlsView = new ParameterControlsView(leftPanel, store);

  // 7. 3B Sahne Üzeri Canlı Ölçü Göstergesi (CAD Dimension HUD & Akordeon Ayar Paneli)
  const dimensionOverlay = dimensionContainer
    ? new ViewportDimensionOverlay(
        dimensionContainer,
        store,
        parameterControlsView,
        (section) => {
          store.setActiveHighlightSection(section);
          swipeBar?.setActive(section, true);
          if (window.innerWidth <= 960) {
            mobileDrawer?.openToSection(section);
          }
        }
      )
    : null;

  // 8. Viewport Overlay Araç Çubuğu (Toolbar)
  new ViewportOverlayToolbar(
    viewportStage,
    viewportController,
    store,
    (active) => dimensionOverlay?.toggleVisibility(active)
  );

  // 9. Üst Yatay Swipe Kategori Çubuğu (Swipe Panel)
  const swipeBar = swipeContainer
    ? new SwipeCategoryBar(swipeContainer, store, (catId) => {
        if (catId === 'iso_metrics' || catId === 'export_stl') {
          if (window.innerWidth <= 960) {
            mobileDrawer?.openToSection(catId);
          } else {
            rightPanel.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          const section = catId as GearHighlightSection;
          store.setActiveHighlightSection(section);
          if (window.innerWidth <= 960) {
            mobileDrawer?.openToSection(section);
          } else {
            dimensionOverlay?.openEditorForSection(section);
          }
        }
      })
    : null;

  // 10. Mobil Alt Çekmece (Mobile Drawer Sheet)
  const mobileDrawer = mobileDrawerHost
    ? new MobileDrawerSheet(
        mobileDrawerHost,
        store,
        parameterControlsView,
        () => saveModal.open(false),
        () => projectManagerModal.open(),
        (mode) => {
          // Drawer açıkken (half veya full) mobilde HUD'ı gizle, kapandığında geri aç
          if (window.innerWidth <= 960) {
            dimensionOverlay?.toggleVisibility(mode === 'hidden');
          }
        },
        () => wizardModal.open(true)
      )
    : null;

  // 11. 3D Dişli Parçasına Tıklama (Raycast Hit) Olayını Bağla
  // "dişlinin hangi bölgesine tıklarsak o bölgesinde işlem yapılacak section direkt ekranda açılabilir"
  viewportController.onZoneClick = (section) => {
    store.setActiveHighlightSection(section);
    swipeBar?.setActive(section, true);

    if (window.innerWidth <= 960) {
      mobileDrawer?.openToSection(section);
    } else {
      dimensionOverlay?.openEditorForSection(section);
    }
  };

  // 12. 3D Dişli Parçası Üzerine Gelme (Hover) Canlı Ölçü Olayını Bağla
  // "bir de ölçüler vs. ekranda gözükebilir direkt 3d dişli objesinde neyin üzerine gelirsek"
  viewportController.onZoneHover = (section) => {
    dimensionOverlay?.setHoverSection(section);
  };

  // 13. Mühendislik Metrikleri Görünümü
  new EngineeringMetricsView(
    rightPanel,
    store,
    () => saveModal.open(false),
    () => projectManagerModal.open()
  );

  // 14. Trunçgil Teknoloji Telif & Sürüm Bilgisi Modalı Olay Dinleyicileri
  setupCreditsModal();

  // 15. Progressive Web App (PWA) ve Çevrimdışı Yaşam Döngüsü Yöneticisini Başlat
  const pwaManager = new PwaManager();
  pwaManager.init();

  // 16. 3B Sahne ve Arayüz hazır olduğunda Preloader'ı yumuşak geçişle kapat
  dismissAppPreloader();

  // 17. Sıfırdan app'i yeni açmışken sihirbaz dialogunu otomatik aç
  const activeProjectId = storageRepository.getActiveProjectId();
  const showWizardOnStartup = localStorage.getItem('gearforge_show_wizard_startup') !== 'false';
  if (showWizardOnStartup && !activeProjectId) {
    window.setTimeout(() => {
      wizardModal.open(true);
    }, 550);
  }
}

/**
 * Trunçgil Teknoloji Telif ve Sürüm Modalı kontrollerini bağlar.
 */
function setupCreditsModal(): void {
  const modal = document.getElementById('credits-modal-overlay');
  const openBtn = document.getElementById('btn-open-credits');
  const logoBtn = document.getElementById('brand-logo-btn');
  const closeBtn = document.getElementById('credits-modal-close');
  const okBtn = document.getElementById('credits-modal-ok');

  if (!modal) return;

  const show = () => modal.classList.remove('hidden');
  const hide = () => modal.classList.add('hidden');

  openBtn?.addEventListener('click', show);
  logoBtn?.addEventListener('click', show);
  closeBtn?.addEventListener('click', hide);
  okBtn?.addEventListener('click', hide);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hide();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) hide();
  });
}

/**
 * İlk Three.js sahnesi ve UI bileşenleri hazır olduğunda dişli çark preloader'ını yumuşakça kapatır.
 */
function dismissAppPreloader(): void {
  const preloader = document.getElementById('app-preloader');
  if (!preloader) return;

  requestAnimationFrame(() => {
    setTimeout(() => {
      preloader.classList.add('fade-out');
      setTimeout(() => {
        preloader.remove();
      }, 550);
    }, 450);
  });
}

bootstrapGearBuilderApp();
