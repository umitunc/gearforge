import { GearBuilderStore } from '../../application/GearBuilderStore';
import { ExportFormat, GearHighlightSection } from '../../domain/models/GearTypes';
import { ParameterControlsView } from './ParameterControlsView';
import { SwipeCategoryId } from './SwipeCategoryBar';

export type DrawerHeightMode = 'hidden' | 'half' | 'full';

/**
 * Mobil cihazlarda ekran alanını maksimum 3B görünürlükte tutan,
 * parça tıklamaları veya swipe panel seçimleriyle doğrudan açılan
 * Apple HIG tarzı alt çekmece (Bottom Sheet) bileşeni (SRP / OCP).
 */
export class MobileDrawerSheet {
  private readonly container: HTMLElement;
  private readonly store: GearBuilderStore;
  private readonly parameterControlsView: ParameterControlsView;
  private readonly onOpenSaveModal?: () => void;
  private readonly onOpenProjectsModal?: () => void;
  private readonly onHeightModeChange?: (mode: DrawerHeightMode) => void;

  private backdropEl!: HTMLElement;
  private sheetEl!: HTMLElement;
  private bottomBarEl!: HTMLElement;
  private sheetTitleEl!: HTMLElement;
  private sheetBadgeEl!: HTMLElement;
  private sheetBodyEl!: HTMLElement;
  private expandBtn!: HTMLButtonElement;

  private currentHeightMode: DrawerHeightMode = 'hidden';
  private currentActiveSection: SwipeCategoryId =
    GearHighlightSection.DIMENSIONS_AND_TYPE;

  private startY = 0;
  private currentY = 0;
  private isDragging = false;

  constructor(
    container: HTMLElement,
    store: GearBuilderStore,
    parameterControlsView: ParameterControlsView,
    onOpenSaveModal?: () => void,
    onOpenProjectsModal?: () => void,
    onHeightModeChange?: (mode: DrawerHeightMode) => void
  ) {
    this.container = container;
    this.store = store;
    this.parameterControlsView = parameterControlsView;
    this.onOpenSaveModal = onOpenSaveModal;
    this.onOpenProjectsModal = onOpenProjectsModal;
    this.onHeightModeChange = onHeightModeChange;

    this.render();
    this.setupTouchGestures();
  }

  private render(): void {
    // 1. Arka plan karartması (Backdrop)
    this.backdropEl = document.createElement('div');
    this.backdropEl.className = 'mobile-drawer-backdrop hidden';
    this.backdropEl.addEventListener('click', () => this.setHeightMode('hidden'));

    // 2. Alt Çekmece Kartı (Bottom Sheet)
    this.sheetEl = document.createElement('div');
    this.sheetEl.className = 'mobile-drawer-sheet mode-hidden';

    // Drag Tutamağı (Handle)
    const handleWrapper = document.createElement('div');
    handleWrapper.className = 'drawer-handle-bar';
    const handlePill = document.createElement('div');
    handlePill.className = 'drawer-handle-pill';
    handleWrapper.appendChild(handlePill);

    // Çekmece Başlığı
    const header = document.createElement('div');
    header.className = 'drawer-header';

    const headerLeft = document.createElement('div');
    headerLeft.className = 'drawer-header-left';
    this.sheetTitleEl = document.createElement('span');
    this.sheetTitleEl.className = 'drawer-title';
    this.sheetTitleEl.textContent = '1. Dişli Tipi ve Boyutlar';

    this.sheetBadgeEl = document.createElement('span');
    this.sheetBadgeEl.className = 'drawer-badge';
    this.sheetBadgeEl.textContent = 'Çember & Diş';

    headerLeft.append(this.sheetTitleEl, this.sheetBadgeEl);

    const headerActions = document.createElement('div');
    headerActions.className = 'drawer-header-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'drawer-action-btn btn-save';
    saveBtn.innerHTML = '💾';
    saveBtn.title = 'Projeyi Kaydet';
    saveBtn.addEventListener('click', () => this.onOpenSaveModal?.());

    const projectsBtn = document.createElement('button');
    projectsBtn.type = 'button';
    projectsBtn.className = 'drawer-action-btn btn-projects';
    projectsBtn.innerHTML = '📂';
    projectsBtn.title = 'Kayıtlı Projeler';
    projectsBtn.addEventListener('click', () => this.onOpenProjectsModal?.());

    this.expandBtn = document.createElement('button');
    this.expandBtn.type = 'button';
    this.expandBtn.className = 'drawer-action-btn btn-expand';
    this.expandBtn.innerHTML = '⤢';
    this.expandBtn.title = 'Tam Ekran / Yarım Ekran';
    this.expandBtn.addEventListener('click', () => {
      this.setHeightMode(this.currentHeightMode === 'full' ? 'half' : 'full');
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'drawer-action-btn btn-close';
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Kapat / 3B Sahneye Dön';
    closeBtn.addEventListener('click', () => this.setHeightMode('hidden'));

    headerActions.append(saveBtn, projectsBtn, this.expandBtn, closeBtn);
    header.append(headerLeft, headerActions);

    // Çekmece İçerik Gövdesi
    this.sheetBodyEl = document.createElement('div');
    this.sheetBodyEl.className = 'drawer-body';

    this.sheetEl.append(handleWrapper, header, this.sheetBodyEl);

    // 3. Mobil Alt Eylem Çubuğu (Bottom Navigation Bar)
    this.bottomBarEl = document.createElement('nav');
    this.bottomBarEl.className = 'mobile-bottom-bar';
    this.bottomBarEl.innerHTML = `
      <button type="button" class="m-bar-btn btn-open-params active">
        <span class="m-bar-icon">🎛️</span>
        <span class="m-bar-label">Parametreler</span>
      </button>
      <button type="button" class="m-bar-btn btn-open-metrics">
        <span class="m-bar-icon">📐</span>
        <span class="m-bar-label">Ölçüler</span>
      </button>
      <button type="button" class="m-bar-btn btn-quick-stl">
        <span class="m-bar-icon">🚀</span>
        <span class="m-bar-label">STL İndir</span>
      </button>
      <button type="button" class="m-bar-btn btn-view-3d">
        <span class="m-bar-icon">👁️</span>
        <span class="m-bar-label">3B Görünüm</span>
      </button>
    `;

    this.setupBottomBarEvents();

    this.container.append(this.backdropEl, this.sheetEl, this.bottomBarEl);
  }

  private setupBottomBarEvents(): void {
    const paramsBtn = this.bottomBarEl.querySelector('.btn-open-params');
    const metricsBtn = this.bottomBarEl.querySelector('.btn-open-metrics');
    const stlBtn = this.bottomBarEl.querySelector('.btn-quick-stl');
    const view3dBtn = this.bottomBarEl.querySelector('.btn-view-3d');

    paramsBtn?.addEventListener('click', () => {
      if (this.currentHeightMode === 'hidden') {
        this.openToSection(this.currentActiveSection);
      } else {
        this.setHeightMode('hidden');
      }
    });

    metricsBtn?.addEventListener('click', () => {
      this.openToSection('iso_metrics');
    });

    stlBtn?.addEventListener('click', () => {
      this.store.exportPrimaryGear(ExportFormat.STL_BINARY);
    });

    view3dBtn?.addEventListener('click', () => {
      this.setHeightMode('hidden');
    });
  }

  public openToSection(sectionId: SwipeCategoryId): void {
    this.currentActiveSection = sectionId;
    this.populateSectionContent(sectionId);
    this.setHeightMode('half');
  }

  public setHeightMode(mode: DrawerHeightMode): void {
    this.currentHeightMode = mode;
    this.sheetEl.className = `mobile-drawer-sheet mode-${mode}`;

    if (mode === 'hidden') {
      this.backdropEl.classList.add('hidden');
      this.expandBtn.innerHTML = '⤢';
    } else if (mode === 'half') {
      this.backdropEl.classList.remove('hidden');
      this.expandBtn.innerHTML = '⤢';
    } else if (mode === 'full') {
      this.backdropEl.classList.remove('hidden');
      this.expandBtn.innerHTML = '⤡';
    }

    this.onHeightModeChange?.(mode);
  }

  public getHeightMode(): DrawerHeightMode {
    return this.currentHeightMode;
  }

  private populateSectionContent(sectionId: SwipeCategoryId): void {
    this.sheetBodyEl.innerHTML = '';

    if (sectionId === 'iso_metrics') {
      this.sheetTitleEl.textContent = '📐 ISO Mühendislik Ölçüleri';
      this.sheetBadgeEl.textContent = 'Teknik Veriler';
      const rightPanel = document.getElementById('right-metrics-panel');
      const dimCard = rightPanel?.querySelector('.metrics-card:last-child');
      if (dimCard) {
        this.sheetBodyEl.appendChild(dimCard.cloneNode(true));
      }
      return;
    }

    if (sectionId === 'export_stl') {
      this.sheetTitleEl.textContent = '🚀 3D Baskı & STL İhracatı';
      this.sheetBadgeEl.textContent = 'Slicer Çıktısı';
      const rightPanel = document.getElementById('right-metrics-panel');
      const exportCard = rightPanel?.querySelector('.export-card');
      if (exportCard) {
        const cloned = exportCard.cloneNode(true) as HTMLElement;
        // Olay dinleyicilerini yeniden bağla
        cloned
          .querySelector('.btn-primary-export')
          ?.addEventListener('click', () =>
            this.store.exportPrimaryGear(ExportFormat.STL_BINARY)
          );
        this.sheetBodyEl.appendChild(cloned);
      }
      return;
    }

    // Dişli Parametre Bölümleri (1-5)
    const sectionEl = this.parameterControlsView.getSectionElement(
      sectionId as GearHighlightSection
    );

    if (sectionEl) {
      const summaryText =
        sectionEl.querySelector('.section-title-text')?.textContent ?? '';
      const zoneBadgeText =
        sectionEl.querySelector('.section-zone-badge')?.textContent ?? '';
      this.sheetTitleEl.textContent = summaryText;
      this.sheetBadgeEl.textContent = zoneBadgeText;

      // Body içeriğini doğrudan çekmecede göster
      const bodySource = sectionEl.querySelector('.param-section-body');
      if (bodySource) {
        // Doğrudan klonlamak yerine canlı DOM elemanını buraya taşıyabilir veya klonlayabiliriz
        // Parametre inputlarının çalışması için bodySource'u doğrudan bu bölüme append edip
        // çekmece kapandığında veya başka bölüme geçildiğinde geri iade ediyoruz:
        this.mountSectionControls(sectionId as GearHighlightSection, bodySource as HTMLElement);
      }
    }
  }

  private activeMountedSection: {
    section: GearHighlightSection;
    element: HTMLElement;
    originalParent: HTMLElement;
  } | null = null;

  private mountSectionControls(
    section: GearHighlightSection,
    bodyElement: HTMLElement
  ): void {
    if (this.activeMountedSection) {
      this.activeMountedSection.originalParent.appendChild(
        this.activeMountedSection.element
      );
      this.activeMountedSection = null;
    }

    const parent = bodyElement.parentElement;
    if (!parent) return;

    this.activeMountedSection = {
      section,
      element: bodyElement,
      originalParent: parent,
    };

    this.sheetBodyEl.appendChild(bodyElement);
  }

  private setupTouchGestures(): void {
    const handleBar = this.sheetEl.querySelector<HTMLElement>('.drawer-handle-bar');
    if (!handleBar) return;

    handleBar.addEventListener('touchstart', (e: TouchEvent) => {
      this.startY = e.touches[0].clientY;
      this.currentY = this.startY;
      this.isDragging = true;
    }, { passive: true });

    window.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.isDragging) return;
      this.currentY = e.touches[0].clientY;
      const dy = this.currentY - this.startY;
      if (dy > 0) {
        // Aşağı kaydırma
        this.sheetEl.style.transform = `translateY(${dy}px)`;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.sheetEl.style.transform = '';
      const dy = this.currentY - this.startY;

      if (dy > 120) {
        // Aşağı swipe -> Kapat / küçült
        if (this.currentHeightMode === 'full') {
          this.setHeightMode('half');
        } else {
          this.setHeightMode('hidden');
        }
      } else if (dy < -60) {
        // Yukarı swipe -> Genişlet
        this.setHeightMode('full');
      }
    });
  }

  public dispose(): void {
    if (this.activeMountedSection) {
      this.activeMountedSection.originalParent.appendChild(
        this.activeMountedSection.element
      );
      this.activeMountedSection = null;
    }
    this.backdropEl.remove();
    this.sheetEl.remove();
    this.bottomBarEl.remove();
  }
}
