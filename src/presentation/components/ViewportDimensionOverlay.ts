import { GearBuilderState, GearBuilderStore } from '../../application/GearBuilderStore';
import {
  BoreType,
  GearHighlightSection,
  GearType,
  WebStyle,
} from '../../domain/models/GearTypes';

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
 */
export class ViewportDimensionOverlay {
  private readonly container: HTMLElement;
  private readonly store: GearBuilderStore;
  private readonly onEditSectionCallback?: (section: GearHighlightSection) => void;

  private cardEl!: HTMLElement;
  private isVisible = true;
  private isCollapsed = typeof window !== 'undefined' && window.innerWidth <= 960;
  private currentDisplaySection: GearHighlightSection =
    GearHighlightSection.DIMENSIONS_AND_TYPE;
  private lastState: GearBuilderState | null = null;
  private hoverTimeout: number | null = null;

  constructor(
    container: HTMLElement,
    store: GearBuilderStore,
    onEditSectionCallback?: (section: GearHighlightSection) => void
  ) {
    this.container = container;
    this.store = store;
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

  private render(): void {
    this.cardEl = document.createElement('div');
    this.cardEl.className = 'viewport-dimension-hud';
    this.cardEl.id = 'viewport-dimension-hud';
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

  public toggleVisibility(force?: boolean): boolean {
    this.isVisible = force !== undefined ? force : !this.isVisible;
    this.cardEl.style.display = this.isVisible ? 'block' : 'none';
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
      this.cardEl.innerHTML = `
        <button type="button" class="hud-collapsed-pill" title="Ölçü kartını genişlet">
          <span class="hud-pill-icon">${info.icon}</span>
          <span class="hud-pill-label">📐 ${info.title} (${m.outerDiameter.toFixed(1)} mm)</span>
          <span class="hud-pill-expand">↗</span>
        </button>
      `;
      this.cardEl
        .querySelector('.hud-collapsed-pill')
        ?.addEventListener('click', () => this.toggleCollapsed());
      return;
    }

    this.cardEl.className = `viewport-dimension-hud expanded ${info.colorClass}`;
    this.cardEl.innerHTML = `
      <div class="hud-header">
        <div class="hud-header-left">
          <span class="hud-section-icon">${info.icon}</span>
          <div class="hud-title-col">
            <span class="hud-title">${info.title}</span>
            <span class="hud-subtitle">${info.subtitle}</span>
          </div>
        </div>
        <div class="hud-header-actions">
          <button type="button" class="hud-action-btn hud-btn-minimize" title="Küçült">─</button>
        </div>
      </div>

      <div class="hud-metrics-grid">
        ${metricsList
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
          .join('')}
      </div>

      <div class="hud-footer">
        <button type="button" class="hud-edit-section-btn">
          <span>⚙️ Bu Bölümü Düzenle</span>
          <span class="hud-arrow">↗</span>
        </button>
        <span class="hud-interactive-tip">💡 3D dişliye tıklayarak da bölge seçebilirsiniz</span>
      </div>
    `;

    this.cardEl
      .querySelector('.hud-btn-minimize')
      ?.addEventListener('click', () => this.toggleCollapsed());

    this.cardEl
      .querySelector('.hud-edit-section-btn')
      ?.addEventListener('click', () => {
        this.onEditSectionCallback?.(this.currentDisplaySection);
      });
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

      case GearHighlightSection.BORE_AND_SHAFT: {
        const items: MetricItem[] = [
          {
            label: 'Etkin Delik Çapı',
            value:
              m.effectiveBoreDiameter > 0
                ? m.effectiveBoreDiameter.toFixed(2)
                : 'Deliksiz',
            unit: m.effectiveBoreDiameter > 0 ? 'mm' : undefined,
            highlight: true,
          },
          {
            label: 'Mil / Yuva Tipi',
            value: this.formatBoreType(p.boreType),
          },
          {
            label: 'Baskı Toleransı',
            value: `+${p.boreClearanceMm.toFixed(2)}`,
            unit: 'mm',
          },
        ];

        if (p.boreType === BoreType.KEYWAY) {
          items.push({
            label: 'Kama Yuvası',
            value: `${p.keywayWidth.toFixed(1)} × ${p.keywayDepth.toFixed(1)}`,
            unit: 'mm',
            highlight: true,
          });
        } else if (
          p.boreType === BoreType.D_SHAFT ||
          p.boreType === BoreType.DOUBLE_D
        ) {
          items.push({
            label: 'D-Mil Düzlük',
            value: p.dShaftFlatDepth.toFixed(2),
            unit: 'mm',
            highlight: true,
          });
        } else if (p.boreType === BoreType.SPLINE) {
          items.push({
            label: 'Spline Diş',
            value: `${p.splineCount} diş • ${p.splineDepth}mm`,
            highlight: true,
          });
        }
        return items;
      }

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
            value: m.totalAxialHeight.toFixed(2),
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
            label: 'Diş Kalınlığı (s)',
            value: m.toothThicknessAtPitch.toFixed(2),
            unit: 'mm',
            highlight: true,
          },
          {
            label: 'Kavrama Açısı (α)',
            value: p.pressureAngleDeg.toFixed(1),
            unit: '°',
          },
          {
            label: '3D Backlash (jt)',
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
            label: 'Diş Boyu (h)',
            value: m.wholeDepth.toFixed(2),
            unit: 'mm',
          },
          {
            label: 'Diş Dibi (df)',
            value: m.rootDiameter.toFixed(2),
            unit: 'mm',
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
            label: 'Çevrim Oranı (i)',
            value: `1 : ${(1 / m.gearRatio).toFixed(2)}`,
            highlight: true,
          },
          {
            label: 'Karşı Dişli (z₂)',
            value: String(p.matingTeethCount),
            unit: 'diş',
          },
          {
            label: 'Kavrama Oranı',
            value: m.contactRatio.toFixed(2),
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
