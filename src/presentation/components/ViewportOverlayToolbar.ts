import { GearBuilderStore } from '../../application/GearBuilderStore';
import { GearHighlightSection } from '../../domain/models/GearTypes';
import { GearViewportController } from '../../infrastructure/three/GearViewportController';

const HIGHLIGHT_LABELS: Record<
  GearHighlightSection,
  { title: string; colorClass: string }
> = {
  [GearHighlightSection.NONE]: {
    title: 'Tam Görünüm (Vurgu Yok)',
    colorClass: 'hl-none',
  },
  [GearHighlightSection.DIMENSIONS_AND_TYPE]: {
    title: '1. Dişli Çemberi & Dış Rim (Mavi)',
    colorClass: 'hl-dimensions',
  },
  [GearHighlightSection.BORE_AND_SHAFT]: {
    title: '2. Merkez Delik & Mil Yuvası (Yeşil)',
    colorClass: 'hl-bore',
  },
  [GearHighlightSection.HUB_AND_WEB]: {
    title: '3. Göbek (Hub), Web & Hafifletme (Turuncu)',
    colorClass: 'hl-hub',
  },
  [GearHighlightSection.EVOLVENT_AND_PRINT]: {
    title: '4. Evolvent Diş Yanakları (Mor)',
    colorClass: 'hl-evolvent',
  },
  [GearHighlightSection.MATING_SIMULATION]: {
    title: '5. Eşleşen Pinyon & Temas Bölgesi (Kırmızı)',
    colorClass: 'hl-mating',
  },
};

/**
 * 3B Sahne üzerindeki kamera açıları, aktif vurgulanan bölge göstergesi (Zone HUD),
 * kesit görünümü, tel kafes ve referans çemberleri araç çubuğunu yöneten bileşen (SRP).
 */
export class ViewportOverlayToolbar {
  private readonly container: HTMLElement;
  private readonly viewport: GearViewportController;
  private readonly store: GearBuilderStore;
  private readonly onToggleDimensionOverlay?: (active: boolean) => void;
  private highlightBannerEl!: HTMLElement;

  constructor(
    container: HTMLElement,
    viewport: GearViewportController,
    store: GearBuilderStore,
    onToggleDimensionOverlay?: (active: boolean) => void
  ) {
    this.container = container;
    this.viewport = viewport;
    this.store = store;
    this.onToggleDimensionOverlay = onToggleDimensionOverlay;
    this.render();
    this.store.subscribe((state) => {
      this.updateHighlightBanner(state.activeHighlightSection);
    });
  }

  private render(): void {
    const toolbar = document.createElement('div');
    toolbar.className = 'viewport-toolbar';

    // Kamera Açısı Butonları
    const camGroup = document.createElement('div');
    camGroup.className = 'toolbar-group';

    camGroup.append(
      this.createActionPill('İzometrik 3B', () => this.viewport.setCameraPreset('iso')),
      this.createActionPill('Üst (Plan)', () => this.viewport.setCameraPreset('top')),
      this.createActionPill('Ön Görünüm', () => this.viewport.setCameraPreset('front'))
    );

    // Görünüm Modu Anahtarları
    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'toolbar-group';

    const opts = this.viewport.getDisplayOptions();

    const dimPill = this.createTogglePill(
      '📐 Canlı Ölçüler (HUD)',
      true,
      (active) => this.onToggleDimensionOverlay?.(active)
    );

    const playPill = this.createTogglePill(
      '⟳ Dönüş Simülasyonu',
      opts.isAnimationPlaying,
      (active) => this.viewport.setDisplayOptions({ isAnimationPlaying: active })
    );

    const pitchPill = this.createTogglePill(
      '◎ Referans Çemberleri',
      opts.showPitchCircles,
      (active) => this.viewport.setDisplayOptions({ showPitchCircles: active })
    );

    const sectionPill = this.createTogglePill(
      '✂ İç Kesit (Cross-Section)',
      opts.showCrossSection,
      (active) => this.viewport.setDisplayOptions({ showCrossSection: active })
    );

    const wirePill = this.createTogglePill(
      '⌗ Tel Kafes (Mesh)',
      opts.showWireframe,
      (active) => this.viewport.setDisplayOptions({ showWireframe: active })
    );

    const gridPill = this.createTogglePill(
      '▦ 3D Tabla (220mm)',
      opts.showBuildPlate,
      (active) => this.viewport.setDisplayOptions({ showBuildPlate: active })
    );

    toggleGroup.append(dimPill, playPill, pitchPill, sectionPill, wirePill, gridPill);
    toolbar.append(camGroup, toggleGroup);

    // Aktif Vurgulanan Bölge (Highlight Zone) HUD Çubuğu
    this.highlightBannerEl = document.createElement('div');
    this.highlightBannerEl.className = 'viewport-highlight-hud';

    // Sol alt mühendislik çemberleri açıklaması (Legend)
    const legend = document.createElement('div');
    legend.className = 'viewport-legend';
    legend.innerHTML = `
      <span class="legend-item"><i class="dot dot-outer"></i>Dış Çap (da)</span>
      <span class="legend-item"><i class="dot dot-pitch"></i>Bölüm Dairesi (d)</span>
      <span class="legend-item"><i class="dot dot-base"></i>Temel Daire (db)</span>
      <span class="legend-item"><i class="dot dot-root"></i>Diş Dibi (df)</span>
      <span class="legend-hint">Sol Tık: Döndür • Sağ Tık: Kaydır • Tekerlek: Yakınlaştır</span>
    `;

    this.container.append(toolbar, this.highlightBannerEl, legend);
  }

  private updateHighlightBanner(section: GearHighlightSection): void {
    if (section === GearHighlightSection.NONE) {
      this.highlightBannerEl.style.display = 'none';
      return;
    }

    const info = HIGHLIGHT_LABELS[section];
    this.highlightBannerEl.style.display = 'flex';
    this.highlightBannerEl.className = `viewport-highlight-hud ${info.colorClass}`;
    this.highlightBannerEl.innerHTML = `
      <span class="hud-indicator-dot"></span>
      <span class="hud-text">Vurgulanan Bölge: <strong>${info.title}</strong></span>
    `;

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'hud-clear-btn';
    clearBtn.textContent = '✕ Vurguyu Kapat';
    clearBtn.addEventListener('click', () => {
      this.store.setActiveHighlightSection(GearHighlightSection.NONE);
    });

    this.highlightBannerEl.appendChild(clearBtn);
  }

  private createActionPill(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toolbar-pill';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private createTogglePill(
    label: string,
    initialState: boolean,
    onToggle: (active: boolean) => void
  ): HTMLButtonElement {
    let active = initialState;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `toolbar-pill ${active ? 'active' : ''}`;
    btn.textContent = label;

    btn.addEventListener('click', () => {
      active = !active;
      btn.classList.toggle('active', active);
      onToggle(active);
    });

    return btn;
  }
}
