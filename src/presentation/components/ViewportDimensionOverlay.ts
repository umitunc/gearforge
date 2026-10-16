import { GearBuilderState, GearBuilderStore } from '../../application/GearBuilderStore';
import {
  BoreType,
  GearHighlightSection,
  GearType,
  WebStyle,
} from '../../domain/models/GearTypes';
import { ParameterControlsView } from './ParameterControlsView';

interface MetricItem {
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly highlight?: boolean;
}

const SECTION_TITLES: Record<
  GearHighlightSection,
  { title: string; icon: string; subtitle: string; colorClass: string }
> = {
  [GearHighlightSection.NONE]: {
    title: 'Genel Dişli Geometrisi',
    icon: '⚙️',
    subtitle: 'ISO 21771 Temel Ölçüler',
    colorClass: 'dim-hl-none',
  },
  [GearHighlightSection.DIMENSIONS_AND_TYPE]: {
    title: 'Dış Çember & Diş Boyutları',
    icon: '⚙️',
    subtitle: 'Bölüm Çapı, Modül & Kalınlık',
    colorClass: 'dim-hl-dimensions',
  },
  [GearHighlightSection.BORE_AND_SHAFT]: {
    title: 'Merkez Delik & Mil Yuvası',
    icon: '🔩',
    subtitle: 'Şaft, Kama Kanalı & Tolerans',
    colorClass: 'dim-hl-bore',
  },
  [GearHighlightSection.HUB_AND_WEB]: {
    title: 'Göbek (Hub) & Gövde Web',
    icon: '🛞',
    subtitle: 'Hafifletme, Kollar & Eksenel Z',
    colorClass: 'dim-hl-hub',
  },
  [GearHighlightSection.EVOLVENT_AND_PRINT]: {
    title: 'Evolvent Diş Yanağı & FDM',
    icon: '🖨️',
    subtitle: 'Kavrama Açısı, Backlash & Hatve',
    colorClass: 'dim-hl-evolvent',
  },
  [GearHighlightSection.MATING_SIMULATION]: {
    title: 'Eşleşen Dişli & Temas Hattı',
    icon: '🔄',
    subtitle: 'Eksen Mesafesi & Çevrim Oranı',
    colorClass: 'dim-hl-mating',
  },
};

/**
 * 3B Sahne üzerinde doğrudan interaktif ölçüleri (da, d, s, b, alpha, jt vb.)
 * ve parça üzerindeki hover/tıklama verilerini gösteren CAD HUD katmanı (SRP).
 * Sol panel kaldırıldığında seçili bölümün parametre ayarlarını doğrudan
 * "Bu Bölümü Düzenle" altında akordeon/collapse panel olarak sunar.
 */
export class ViewportDimensionOverlay {
  private readonly container: HTMLElement;
  private readonly store: GearBuilderStore;
  private parameterControlsView?: ParameterControlsView;
  private readonly onEditSectionCallback?: (section: GearHighlightSection) => void;

  private cardEl!: HTMLElement;
  private collapsedPillEl!: HTMLButtonElement;
  private expandedWrapperEl!: HTMLElement;
  private headerIconEl!: HTMLElement;
  private headerTitleEl!: HTMLElement;
  private headerSubtitleEl!: HTMLElement;
  private metricsGridEl!: HTMLElement;
  private editBtnEl!: HTMLButtonElement;
  private editBtnLabelEl!: HTMLElement;
  private editBtnChevronEl!: HTMLElement;
  private editorCollapseEl!: HTMLElement;
  private editorScrollAreaEl!: HTMLElement;

  private isVisible = true;
  private isCollapsed = typeof window !== 'undefined' && window.innerWidth <= 960;
  private isEditorOpen = false;
  private currentDisplaySection: GearHighlightSection =
    GearHighlightSection.DIMENSIONS_AND_TYPE;
  private lastMountedSection: GearHighlightSection | null = null;
  private lastState: GearBuilderState | null = null;
  private hoverTimeout: number | null = null;

  constructor(
    container: HTMLElement,
    store: GearBuilderStore,
    parameterControlsView?: ParameterControlsView,
    onEditSectionCallback?: (section: GearHighlightSection) => void
  ) {
    this.container = container;
    this.store = store;
    this.parameterControlsView = parameterControlsView;
    this.onEditSectionCallback = onEditSectionCallback;

    this.render();
    this.store.subscribe((state) => {
      this.lastState = state;
      if (state.activeHighlightSection !== GearHighlightSection.NONE) {
        this.currentDisplaySection = state.activeHighlightSection;
      }
      this.updateContent();
    });
  }

  public setParameterControlsView(view: ParameterControlsView): void {
    this.parameterControlsView = view;
    if (this.isEditorOpen) {
      this.mountActiveEditorControls();
    }
  }

  private render(): void {
    this.cardEl = document.createElement('div');
    this.cardEl.className = 'viewport-dimension-hud';
    this.cardEl.id = 'viewport-dimension-hud';

    // 1. Minimized (Küçültülmüş) Hap Buton
    this.collapsedPillEl = document.createElement('button');
    this.collapsedPillEl.type = 'button';
    this.collapsedPillEl.className = 'hud-collapsed-pill hidden';
    this.collapsedPillEl.title = 'Ölçü kartını genişlet';
    this.collapsedPillEl.addEventListener('click', () => this.toggleCollapsed());
    this.cardEl.appendChild(this.collapsedPillEl);

    // 2. Genişletilmiş CAD Kart Gövdesi
    this.expandedWrapperEl = document.createElement('div');
    this.expandedWrapperEl.className = 'hud-expanded-wrapper';

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = 'hud-header';

    const headerLeft = document.createElement('div');
    headerLeft.className = 'hud-header-left';

    this.headerIconEl = document.createElement('span');
    this.headerIconEl.className = 'hud-section-icon';

    const titleCol = document.createElement('div');
    titleCol.className = 'hud-title-col';

    this.headerTitleEl = document.createElement('span');
    this.headerTitleEl.className = 'hud-title';

    this.headerSubtitleEl = document.createElement('span');
    this.headerSubtitleEl.className = 'hud-subtitle';

    titleCol.append(this.headerTitleEl, this.headerSubtitleEl);
    headerLeft.append(this.headerIconEl, titleCol);

    const headerActions = document.createElement('div');
    headerActions.className = 'hud-header-actions';

    const minBtn = document.createElement('button');
    minBtn.type = 'button';
    minBtn.className = 'hud-action-btn hud-btn-minimize';
    minBtn.title = 'Kartı Küçült';
    minBtn.textContent = '─';
    minBtn.addEventListener('click', () => this.toggleCollapsed());
    headerActions.appendChild(minBtn);

    headerEl.append(headerLeft, headerActions);
    this.expandedWrapperEl.appendChild(headerEl);

    // Canlı Ölçüler Izgarası (Metrics Grid)
    this.metricsGridEl = document.createElement('div');
    this.metricsGridEl.className = 'hud-metrics-grid';
    this.expandedWrapperEl.appendChild(this.metricsGridEl);

    // Footer & Akordeon Düzenleme Paneli
    const footerEl = document.createElement('div');
    footerEl.className = 'hud-footer';

    this.editBtnEl = document.createElement('button');
    this.editBtnEl.type = 'button';
    this.editBtnEl.className = 'hud-edit-section-btn';

    this.editBtnLabelEl = document.createElement('span');
    this.editBtnLabelEl.className = 'hud-btn-main-label';
    this.editBtnLabelEl.textContent = '⚙️ Bu Bölümü Düzenle';

    this.editBtnChevronEl = document.createElement('span');
    this.editBtnChevronEl.className = 'hud-collapse-chevron';
    this.editBtnChevronEl.textContent = '▾';

    this.editBtnEl.append(this.editBtnLabelEl, this.editBtnChevronEl);
    this.editBtnEl.addEventListener('click', () => {
      this.toggleEditorOpen();
      this.onEditSectionCallback?.(this.currentDisplaySection);
    });
    footerEl.appendChild(this.editBtnEl);

    // Açılır-Kapanır Düzenleme Paneli (Collapse Container)
    this.editorCollapseEl = document.createElement('div');
    this.editorCollapseEl.className = 'hud-editor-collapse collapsed';

    this.editorScrollAreaEl = document.createElement('div');
    this.editorScrollAreaEl.className = 'hud-editor-scroll-area';
    this.editorCollapseEl.appendChild(this.editorScrollAreaEl);

    footerEl.appendChild(this.editorCollapseEl);

    const tipEl = document.createElement('span');
    tipEl.className = 'hud-interactive-tip';
    tipEl.textContent = '💡 3D dişliye tıklayarak da bölge seçebilirsiniz';
    footerEl.appendChild(tipEl);

    this.expandedWrapperEl.appendChild(footerEl);
    this.cardEl.appendChild(this.expandedWrapperEl);

    this.container.appendChild(this.cardEl);
  }

  public setHoverSection(section: GearHighlightSection | null): void {
    if (this.hoverTimeout !== null) {
      window.clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    if (!section) {
      // Fare objeden çıktığında mevcut aktif section'a yumuşakça dön
      this.hoverTimeout = window.setTimeout(() => {
        const active = this.lastState?.activeHighlightSection;
        this.currentDisplaySection =
          active && active !== GearHighlightSection.NONE
            ? active
            : GearHighlightSection.DIMENSIONS_AND_TYPE;
        this.updateContent();
      }, 450);
      return;
    }

    if (this.currentDisplaySection !== section) {
      this.currentDisplaySection = section;
      this.updateContent();
      this.cardEl.classList.remove('hud-pulse');
      void this.cardEl.offsetWidth; // Force reflow
      this.cardEl.classList.add('hud-pulse');
    }
  }

  public setActiveSection(section: GearHighlightSection): void {
    this.currentDisplaySection =
      section !== GearHighlightSection.NONE
        ? section
        : GearHighlightSection.DIMENSIONS_AND_TYPE;
    this.updateContent();
  }

  public openEditorForSection(section: GearHighlightSection): void {
    this.isCollapsed = false;
    this.currentDisplaySection =
      section !== GearHighlightSection.NONE
        ? section
        : GearHighlightSection.DIMENSIONS_AND_TYPE;
    this.isEditorOpen = true;
    this.updateContent();
  }

  public toggleEditorOpen(force?: boolean): void {
    this.isEditorOpen = force !== undefined ? force : !this.isEditorOpen;
    this.applyEditorState();
  }

  private applyEditorState(): void {
    if (this.isEditorOpen) {
      this.editBtnLabelEl.textContent = '✕ Parametreleri Gizle';
      this.editBtnChevronEl.textContent = '▴';
      this.editBtnEl.classList.add('active');
      this.editorCollapseEl.classList.remove('collapsed');
      this.editorCollapseEl.classList.add('open');
      this.mountActiveEditorControls();
    } else {
      this.editBtnLabelEl.textContent = '⚙️ Bu Bölümü Düzenle';
      this.editBtnChevronEl.textContent = '▾';
      this.editBtnEl.classList.remove('active');
      this.editorCollapseEl.classList.remove('open');
      this.editorCollapseEl.classList.add('collapsed');
    }
  }

  private mountActiveEditorControls(): void {
    if (!this.parameterControlsView) return;
    this.parameterControlsView.mountSectionContent(
      this.currentDisplaySection,
      this.editorScrollAreaEl
    );
    this.lastMountedSection = this.currentDisplaySection;
  }

  public toggleVisibility(force?: boolean): boolean {
    this.isVisible = force !== undefined ? force : !this.isVisible;
    this.cardEl.style.display = this.isVisible ? 'flex' : 'none';
    return this.isVisible;
  }

  public toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
    this.updateContent();
  }

  private updateContent(): void {
    if (!this.lastState || !this.isVisible) {
      return;
    }

    const { parameters: p, metrics: m } = this.lastState;
    const info = SECTION_TITLES[this.currentDisplaySection];
    const metricsList = this.getMetricsForSection(this.currentDisplaySection, p, m);

    if (this.isCollapsed) {
      this.cardEl.className = `viewport-dimension-hud collapsed ${info.colorClass}`;
      this.collapsedPillEl.classList.remove('hidden');
      this.expandedWrapperEl.classList.add('hidden');
      this.collapsedPillEl.innerHTML = `
        <span class="hud-pill-icon">${info.icon}</span>
        <span class="hud-pill-label">📐 ${info.title} (${m.outerDiameter.toFixed(1)} mm)</span>
        <span class="hud-pill-expand">↗</span>
      `;
      return;
    }

    this.collapsedPillEl.classList.add('hidden');
    this.expandedWrapperEl.classList.remove('hidden');
    this.cardEl.className = `viewport-dimension-hud expanded ${info.colorClass} ${this.isEditorOpen ? 'editor-expanded' : ''}`;

    // Header güncelle
    this.headerIconEl.textContent = info.icon;
    this.headerTitleEl.textContent = info.title;
    this.headerSubtitleEl.textContent = info.subtitle;

    // Canlı Ölçü Hücrelerini güncelle
    this.metricsGridEl.innerHTML = metricsList
      .map(
        (item) => `
        <div class="hud-metric-cell ${item.highlight ? 'cell-highlight' : ''}">
          <span class="hud-m-label">${item.label}</span>
          <span class="hud-m-value">
            <strong>${item.value}</strong>
            ${item.unit ? `<small>${item.unit}</small>` : ''}
          </span>
        </div>
      `
      )
      .join('');

    // Düzenleme paneli durumunu uygula
    this.applyEditorState();

    // Bölüm değiştiyse ve panel açıksa içeriği yenile
    if (this.isEditorOpen && this.lastMountedSection !== this.currentDisplaySection) {
      this.mountActiveEditorControls();
    }
  }

  private getMetricsForSection(
    section: GearHighlightSection,
    p: GearBuilderState['parameters'],
    m: GearBuilderState['metrics']
  ): readonly MetricItem[] {
    switch (section) {
      case GearHighlightSection.DIMENSIONS_AND_TYPE:
        return [
          {
            label: 'Dış Çap (da)',
            value: m.outerDiameter.toFixed(2),
            unit: 'mm',
            highlight: true,
          },
          {
            label: 'Bölüm Çapı (d)',
            value: m.pitchDiameter.toFixed(2),
            unit: 'mm',
          },
          {
            label: 'Diş Sayısı (z)',
            value: String(p.teethCount),
            unit: 'diş',
            highlight: true,
          },
          {
            label: 'Modül (m)',
            value: m.effectiveModule.toFixed(3),
            unit: 'mm',
          },
          {
            label: 'Dişli Kalınlığı (b)',
            value: p.thickness.toFixed(1),
            unit: 'mm',
          },
          {
            label: 'Dişli Tipi',
            value: this.formatGearType(p.gearType),
          },
        ];

      case GearHighlightSection.BORE_AND_SHAFT:
        return [
          {
            label: 'Mil Çapı (Bore)',
            value: p.boreDiameter.toFixed(2),
            unit: 'mm',
            highlight: true,
          },
          {
            label: 'Bağlantı Tipi',
            value: this.formatBoreType(p.boreType),
          },
          {
            label: 'Mil Toleransı',
            value: `+${p.boreClearanceMm.toFixed(2)}`,
            unit: 'mm',
          },
          {
            label: 'Kama Genişliği',
            value: p.boreType === BoreType.KEYWAY ? `${p.keywayWidth.toFixed(1)} mm` : '—',
          },
        ];

      case GearHighlightSection.HUB_AND_WEB:
        return [
          {
            label: 'Göbek (Hub) Çapı',
            value: p.hubDiameter.toFixed(1),
            unit: 'mm',
            highlight: true,
          },
          {
            label: 'Web Kalınlığı',
            value: p.webThickness.toFixed(1),
            unit: 'mm',
          },
          {
            label: 'Gövde Tasarımı',
            value: this.formatWebStyle(p.webStyle),
          },
          {
            label: 'Toplam Z Boyu',
            value: (p.thickness + p.hubTopExtension + p.hubBottomExtension).toFixed(2),
            unit: 'mm',
            highlight: true,
          },
          {
            label: 'Üst/Alt Çıkıntı',
            value: `+${p.hubTopExtension.toFixed(1)} / +${p.hubBottomExtension.toFixed(1)}`,
            unit: 'mm',
          },
        ];

      case GearHighlightSection.EVOLVENT_AND_PRINT:
        return [
          {
            label: 'Kavrama Açısı (α)',
            value: `${p.pressureAngleDeg.toFixed(1)}°`,
            highlight: true,
          },
          {
            label: 'Backlash (Boşluk)',
            value: p.backlashMm.toFixed(2),
            unit: 'mm',
            highlight: true,
          },
          {
            label: 'Temel Çap (db)',
            value: m.baseDiameter.toFixed(2),
            unit: 'mm',
          },
          {
            label: 'Diş Dibi Çapı (df)',
            value: m.rootDiameter.toFixed(2),
            unit: 'mm',
          },
          {
            label: 'Hatve (p)',
            value: m.circularPitch.toFixed(2),
            unit: 'mm',
          },
          {
            label: 'Kavrama Oranı (ε)',
            value: m.contactRatio.toFixed(2),
          },
        ];

      case GearHighlightSection.MATING_SIMULATION:
        return [
          {
            label: 'Eksen Mesafesi (a)',
            value: m.centerDistance.toFixed(2),
            unit: 'mm',
            highlight: true,
          },
          {
            label: 'Karşı Diş Sayısı (z₂)',
            value: String(p.matingTeethCount),
            unit: 'diş',
          },
          {
            label: 'Dişli Oranı (i)',
            value: `1 : ${m.gearRatio.toFixed(2)}`,
            highlight: true,
          },
          {
            label: 'Simülasyon RPM',
            value: String(p.simulationRpm),
            unit: 'd/dk',
          },
        ];

      case GearHighlightSection.NONE:
      default:
        return [
          {
            label: 'Dış Çap (da)',
            value: m.outerDiameter.toFixed(2),
            unit: 'mm',
            highlight: true,
          },
          {
            label: 'Diş Sayısı (z)',
            value: String(p.teethCount),
            unit: 'diş',
          },
          {
            label: 'Modül (m)',
            value: m.effectiveModule.toFixed(3),
            unit: 'mm',
          },
          {
            label: 'Ağırlık (Tahmini)',
            value: m.estimatedWeightGrams.toFixed(1),
            unit: 'g',
            highlight: true,
          },
        ];
    }
  }

  private formatGearType(type: GearType): string {
    switch (type) {
      case GearType.SPUR:
        return 'Düz (Spur)';
      case GearType.HELICAL:
        return 'Helis (Helical)';
      case GearType.HERRINGBONE:
        return 'Çavuş (Double Helical)';
      case GearType.BEVEL_TAPER:
        return 'Konik (Bevel)';
      case GearType.INTERNAL_RING:
        return 'İç Dişli (Ring)';
      default:
        return type;
    }
  }

  private formatBoreType(type: BoreType): string {
    switch (type) {
      case BoreType.CIRCULAR:
        return 'Dairesel Mil';
      case BoreType.KEYWAY:
        return 'DIN 6885 Kama';
      case BoreType.D_SHAFT:
        return 'NEMA 17 D-Şaft';
      case BoreType.DOUBLE_D:
        return 'Çift D-Şaft';
      case BoreType.HEXAGONAL:
        return 'Altıgen (Hex)';
      case BoreType.SQUARE:
        return 'Kare Mil';
      case BoreType.SPLINE:
        return 'Yıldız / Spline';
      case BoreType.NONE:
        return 'Tam Dolu';
      default:
        return type;
    }
  }

  private formatWebStyle(style: WebStyle): string {
    switch (style) {
      case WebStyle.SOLID:
        return 'Tam Dolu (Solid)';
      case WebStyle.RECESSED:
        return 'Çökertmeli (Web)';
      case WebStyle.LIGHTENING_HOLES:
        return 'Dairesel Delikli';
      case WebStyle.SPOKED:
        return 'Kollu Jant';
      default:
        return style;
    }
  }
}
