import { GearBuilderState, GearBuilderStore } from '../../application/GearBuilderStore';
import { ExportFormat } from '../../domain/models/GearTypes';

/**
 * Sağ panelde yer alan 3D yazıcı ihracat (Export) butonları, Manifold doğrulama durumu,
 * ISO mühendislik hesaplama tablosu ve tasarım uyarılarını yöneten görünüm sınıfı (SRP).
 */
export class EngineeringMetricsView {
  private readonly container: HTMLElement;
  private readonly store: GearBuilderStore;

  private manifoldBadgeEl!: HTMLElement;
  private statsGridEl!: HTMLElement;
  private dimensionsTableEl!: HTMLElement;
  private issuesContainerEl!: HTMLElement;
  private exportPinionBtn!: HTMLButtonElement;

  constructor(container: HTMLElement, store: GearBuilderStore) {
    this.container = container;
    this.store = store;
    this.renderLayout();
    this.store.subscribe((state) => this.update(state));
  }

  private renderLayout(): void {
    this.container.innerHTML = '';

    // 1. 3D Yazıcı İhracat (Export) Kartı
    const exportCard = document.createElement('section');
    exportCard.className = 'metrics-card export-card';
    exportCard.innerHTML = `
      <div class="card-header">
        <span class="card-title">🖨️ 3D Yazıcı Çıktısı (Slicer Export)</span>
      </div>
    `;

    const primaryStlBtn = document.createElement('button');
    primaryStlBtn.className = 'btn-primary-export';
    primaryStlBtn.innerHTML = `
      <span class="btn-icon">⬇</span>
      <span class="btn-text">
        <strong>STL İndir (3D Printer Hazır)</strong>
        <small>Binary .STL • Milimetre (mm) • Manifold</small>
      </span>
    `;
    primaryStlBtn.addEventListener('click', () => {
      this.store.exportPrimaryGear(ExportFormat.STL_BINARY);
    });

    const secondaryGrid = document.createElement('div');
    secondaryGrid.className = 'export-secondary-grid';

    const objBtn = this.createButton('OBJ İndir (.obj)', 'btn-secondary', () =>
      this.store.exportPrimaryGear(ExportFormat.OBJ)
    );
    const asciiStlBtn = this.createButton('ASCII STL (.stl)', 'btn-secondary', () =>
      this.store.exportPrimaryGear(ExportFormat.STL_ASCII)
    );
    this.exportPinionBtn = this.createButton(
      'Karşı Pinyon STL İndir',
      'btn-secondary btn-accent',
      () => this.store.exportMatingGear(ExportFormat.STL_BINARY)
    );
    const saveJsonBtn = this.createButton('Ayarları Kaydet (.json)', 'btn-secondary', () =>
      this.store.exportPrimaryGear(ExportFormat.JSON_CONFIG)
    );

    const loadJsonBtn = this.createButton('JSON Yükle', 'btn-secondary', () => {
      this.triggerJsonUpload();
    });

    const resetBtn = this.createButton('Sıfırla', 'btn-secondary', () => {
      this.store.resetToDefault();
    });

    secondaryGrid.append(
      objBtn,
      asciiStlBtn,
      this.exportPinionBtn,
      saveJsonBtn,
      loadJsonBtn,
      resetBtn
    );

    exportCard.append(primaryStlBtn, secondaryGrid);
    this.container.appendChild(exportCard);

    // 2. Manifold & Baskı Maliyet / Ağırlık Özeti
    const printCard = document.createElement('section');
    printCard.className = 'metrics-card';
    printCard.innerHTML = `
      <div class="card-header">
        <span class="card-title">🔍 3B Ağ & Baskı Analizi</span>
      </div>
    `;
    this.manifoldBadgeEl = document.createElement('div');
    this.manifoldBadgeEl.className = 'manifold-badge';
    this.statsGridEl = document.createElement('div');
    this.statsGridEl.className = 'print-stats-grid';
    printCard.append(this.manifoldBadgeEl, this.statsGridEl);
    this.container.appendChild(printCard);

    // 3. Uyarı & Öneri Kartı
    this.issuesContainerEl = document.createElement('section');
    this.issuesContainerEl.className = 'issues-section';
    this.container.appendChild(this.issuesContainerEl);

    // 4. ISO 21771 Mühendislik Hesaplama Tablosu
    const dimCard = document.createElement('section');
    dimCard.className = 'metrics-card';
    dimCard.innerHTML = `
      <div class="card-header">
        <span class="card-title">📐 ISO Mühendislik Ölçüleri</span>
      </div>
    `;
    this.dimensionsTableEl = document.createElement('div');
    this.dimensionsTableEl.className = 'dimensions-list';
    dimCard.appendChild(this.dimensionsTableEl);
    this.container.appendChild(dimCard);
  }

  private update(state: GearBuilderState): void {
    const { parameters: p, metrics: m, primaryMesh, validationIssues } = state;
    const report = primaryMesh.manifoldReport;

    this.exportPinionBtn.style.display = p.showMatingGear ? 'inline-flex' : 'none';

    // Manifold durumu
    if (report.isWatertight) {
      this.manifoldBadgeEl.className = 'manifold-badge manifold-ok';
      this.manifoldBadgeEl.innerHTML = `
        <span>✅ Su Geçirmez (Watertight 2-Manifold)</span>
        <small>Cura, PrusaSlicer, Bambu Studio, OrcaSlicer %100 uyumlu</small>
      `;
    } else {
      this.manifoldBadgeEl.className = 'manifold-badge manifold-warn';
      this.manifoldBadgeEl.innerHTML = `
        <span>⚠️ Ağ Kontrolü</span>
        <small>Dilimleyici onarımı gerekebilir</small>
      `;
    }

    // 3B Ağ ve Filament İstatistikleri
    this.statsGridEl.innerHTML = `
      <div class="stat-box">
        <span class="stat-label">Tahmini Ağırlık (${p.filamentMaterial})</span>
        <strong class="stat-value highlight">${m.estimatedWeightGrams.toFixed(1)} g</strong>
      </div>
      <div class="stat-box">
        <span class="stat-label">Net Hacim</span>
        <strong class="stat-value">${m.estimatedVolumeCm3.toFixed(2)} cm³</strong>
      </div>
      <div class="stat-box">
        <span class="stat-label">Üçgen (Facet) Sayısı</span>
        <strong class="stat-value">${report.triangleCount.toLocaleString('tr-TR')}</strong>
      </div>
      <div class="stat-box">
        <span class="stat-label">Yüzey Alanı</span>
        <strong class="stat-value">${(report.surfaceAreaMm2 / 100).toFixed(1)} cm²</strong>
      </div>
    `;

    // Mekanik Uyarılar
    this.issuesContainerEl.innerHTML = '';
    for (const issue of validationIssues) {
      const box = document.createElement('div');
      box.className = `issue-alert issue-${issue.severity}`;
      box.innerHTML = `
        <div class="issue-msg">${issue.message}</div>
        ${issue.suggestion ? `<div class="issue-sug">💡 ${issue.suggestion}</div>` : ''}
      `;
      this.issuesContainerEl.appendChild(box);
    }

    // Mühendislik Ölçüleri
    const rows: { label: string; value: string; badge?: string }[] = [
      {
        label: 'Dış Çap / Diş Üstü (da)',
        value: `${m.outerDiameter.toFixed(2)} mm`,
        badge: 'Yeşil Çember',
      },
      {
        label: 'Bölüm Dairesi Çapı (d)',
        value: `${m.pitchDiameter.toFixed(2)} mm`,
        badge: 'Mavi Çember',
      },
      {
        label: 'Temel Daire Çapı (db)',
        value: `${m.baseDiameter.toFixed(2)} mm`,
        badge: 'Sarı Çember',
      },
      {
        label: 'Diş Dibi Çapı (df)',
        value: `${m.rootDiameter.toFixed(2)} mm`,
        badge: 'Kırmızı Çember',
      },
      {
        label: 'Etkin Modül (m)',
        value: `${m.effectiveModule.toFixed(3)} mm`,
      },
      {
        label: 'Etkin Delik Çapı (Toleranslı)',
        value: m.effectiveBoreDiameter > 0 ? `${m.effectiveBoreDiameter.toFixed(2)} mm` : 'Deliksiz',
      },
      {
        label: 'Çevresel Adım / Taksimat (p)',
        value: `${m.circularPitch.toFixed(2)} mm`,
      },
      {
        label: 'Diş Kalınlığı (s - Backlash dahil)',
        value: `${m.toothThicknessAtPitch.toFixed(2)} mm`,
      },
      {
        label: 'Diş Yüksekliği (h = ha + hf)',
        value: `${m.wholeDepth.toFixed(2)} mm`,
      },
      {
        label: 'Toplam Z Yüksekliği',
        value: `${m.totalAxialHeight.toFixed(2)} mm`,
      },
      {
        label: 'Kavrama Oranı (εα)',
        value: m.contactRatio.toFixed(2),
      },
      {
        label: 'Eksenler Arası Mesafe (a)',
        value: `${m.centerDistance.toFixed(2)} mm`,
      },
      {
        label: 'Çevrim Oranı (i = z₁ / z₂)',
        value: `1 : ${(1 / m.gearRatio).toFixed(2)} (${m.gearRatio.toFixed(2)})`,
      },
    ];

    this.dimensionsTableEl.innerHTML = rows
      .map(
        (r) => `
        <div class="dim-row">
          <span class="dim-label">${r.label}${
            r.badge ? ` <em class="dim-badge">${r.badge}</em>` : ''
          }</span>
          <strong class="dim-val">${r.value}</strong>
        </div>
      `
      )
      .join('');
  }

  private createButton(
    text: string,
    className: string,
    onClick: () => void
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private triggerJsonUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      const text = await file.text();
      this.store.importJsonConfiguration(text);
    });
    input.click();
  }
}
