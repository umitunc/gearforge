import { GearBuilderStore } from '../../application/GearBuilderStore';
import { GearViewportController } from '../../infrastructure/three/GearViewportController';

/**
 * 3B Sahne üzerindeki kamera açıları, kesit görünümü, tel kafes,
 * 3D tabla ve referans çemberleri araç çubuğunu yöneten bileşen (SRP).
 */
export class ViewportOverlayToolbar {
  private readonly container: HTMLElement;
  private readonly viewport: GearViewportController;
  private readonly onToggleDimensionOverlay?: (active: boolean) => void;

  constructor(
    container: HTMLElement,
    viewport: GearViewportController,
    _store: GearBuilderStore,
    onToggleDimensionOverlay?: (active: boolean) => void
  ) {
    this.container = container;
    this.viewport = viewport;
    this.onToggleDimensionOverlay = onToggleDimensionOverlay;
    this.render();
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

    // Görsel Katman ve Simülasyon Kontrolleri
    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'toolbar-group';

    const opts = this.viewport.getDisplayOptions();

    const dimPill = this.createTogglePill(
      '📐 Canlı Ölçüler (HUD)',
      true,
      (active) => this.onToggleDimensionOverlay?.(active)
    );

    const playPill = this.createTogglePill(
      '🔄 Dönüş Simülasyonu',
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

    this.container.append(toolbar, legend);
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
