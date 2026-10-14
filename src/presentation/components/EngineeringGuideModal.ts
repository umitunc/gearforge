/**
 * EngineeringGuideModal.ts
 * GearForge 3D — ISO 21771 Evolvent Dişli Geometrisi, 3D Baskı ve AI Entegrasyon Kılavuzu.
 * Geliştirici: Trunçgil Teknoloji (https://www.truncgil.com.tr)
 */

export class EngineeringGuideModal {
  private modalEl: HTMLElement | null = null;
  private activeTab: 'formulas' | 'fdm' | 'shafts' | 'ai' = 'formulas';

  public open(initialTab: 'formulas' | 'fdm' | 'shafts' | 'ai' = 'formulas'): void {
    this.activeTab = initialTab;
    this.render();
  }

  public close(): void {
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
    }
  }

  private render(): void {
    this.close();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay gearforge-guide-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'guide-modal-title');

    overlay.innerHTML = `
      <div class="modal-card guide-modal-card">
        <button class="modal-close-btn" id="guide-close-btn" title="Kapat" aria-label="Kapat">✕</button>

        <div class="guide-modal-header">
          <div class="guide-header-icon">📐</div>
          <div class="guide-header-text">
            <div class="guide-header-title-row">
              <h2 id="guide-modal-title" class="guide-modal-title">ISO 21771 & 3D Baskı Mühendislik Kılavuzu</h2>
              <span class="guide-badge">Trunçgil Teknoloji</span>
            </div>
            <p class="guide-modal-subtitle">Parametrik evolvent dişli matematiği, FDM dilimleme toleransları ve yapay zeka rehberi.</p>
          </div>
        </div>

        <nav class="guide-nav-tabs" role="tablist">
          <button class="guide-tab-btn ${this.activeTab === 'formulas' ? 'active' : ''}" data-tab="formulas">
            <span>📐</span> ISO Formülleri
          </button>
          <button class="guide-tab-btn ${this.activeTab === 'fdm' ? 'active' : ''}" data-tab="fdm">
            <span>🖨️</span> 3D Baskı &amp; Backlash
          </button>
          <button class="guide-tab-btn ${this.activeTab === 'shafts' ? 'active' : ''}" data-tab="shafts">
            <span>🔩</span> DIN 6885 Mil &amp; Kama
          </button>
          <button class="guide-tab-btn ${this.activeTab === 'ai' ? 'active' : ''}" data-tab="ai">
            <span>🤖</span> AI &amp; LLMs.txt (GEO)
          </button>
        </nav>

        <div class="guide-tab-content" id="guide-tab-content-area">
          ${this.renderTabContent()}
        </div>

        <div class="guide-modal-footer">
          <div class="guide-footer-left">
            <span class="guide-footer-meta">Standart: <strong>ISO 21771 / DIN 867 / DIN 6885</strong></span>
          </div>
          <div class="guide-footer-actions">
            <a href="/llms.txt" target="_blank" rel="noopener noreferrer" class="btn-guide-secondary" title="Standart AI dokümanı">
              <span>📄</span> llms.txt
            </a>
            <a href="/llms-full.txt" target="_blank" rel="noopener noreferrer" class="btn-guide-secondary" title="Detaylı matematik dokümanı">
              <span>📚</span> llms-full.txt
            </a>
            <button id="guide-modal-close-footer" class="btn-guide-primary">Kapat</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.modalEl = overlay;
    this.bindEvents(overlay);
  }

  private renderTabContent(): string {
    switch (this.activeTab) {
      case 'formulas':
        return `
          <div class="guide-section animate-fade">
            <h3 class="guide-section-title">ISO 21771 &amp; DIN 867 Evolvent Diş Geometrisi</h3>
            <p class="guide-text">
              GearForge 3D, teorik diş profilini <strong>ISO 21771</strong> standardında tanımlanan involute (evolvent) diferansiyel eğri denklemleriyle hesaplar.
            </p>

            <div class="formula-grid">
              <div class="formula-card">
                <span class="formula-name">Bölüm Dairesi Çapı (Pitch Diameter)</span>
                <code class="formula-code">d = m · z</code>
                <span class="formula-desc">m: Modül (mm), z: Diş sayısı</span>
              </div>
              <div class="formula-card">
                <span class="formula-name">Temel Dairesi Çapı (Base Diameter)</span>
                <code class="formula-code">d_b = d · cos(α)</code>
                <span class="formula-desc">α: Basınç açısı (Standart: 20°)</span>
              </div>
              <div class="formula-card">
                <span class="formula-name">Diş Üstü Çapı (Tip Diameter)</span>
                <code class="formula-code">d_a = d + 2 · (h_a* + x) · m</code>
                <span class="formula-desc">h_a*: Diş başı katsayısı (1.0), x: Profil kaydırma</span>
              </div>
              <div class="formula-card">
                <span class="formula-name">Diş Dibi Çapı (Root Diameter)</span>
                <code class="formula-code">d_f = d - 2 · (h_f* - x) · m</code>
                <span class="formula-desc">h_f*: Diş dibi katsayısı (1.25)</span>
              </div>
              <div class="formula-card">
                <span class="formula-name">Dairesel Hatve (Circular Pitch)</span>
                <code class="formula-code">p = π · m</code>
                <span class="formula-desc">Dişler arası ardışık yay uzunluğu</span>
              </div>
              <div class="formula-card">
                <span class="formula-name">Bölüm Dairesinde Diş Kalınlığı</span>
                <code class="formula-code">s = (π · m / 2) + 2 · x · m · tan(α) - j_t</code>
                <span class="formula-desc">j_t: Uygulanan teğetsel backlash (boşluk)</span>
              </div>
            </div>

            <div class="guide-callout info">
              <strong>Evolvent Eğri Fonksiyonu:</strong>
              <code>inv(α) = tan(α) - α</code> formülü uyarınca her profil noktasının koordinatları 
              <code>x(θ) = r_b · (cos(θ) + θ · sin(θ))</code> ve <code>y(θ) = r_b · (sin(θ) - θ · cos(θ))</code> olarak türetilir.
            </div>
          </div>
        `;

      case 'fdm':
        return `
          <div class="guide-section animate-fade">
            <h3 class="guide-section-title">3D Yazıcı (FDM / SLA) Dişli Üretim ve Backlash Rehberi</h3>
            <p class="guide-text">
              FDM tipi 3D yazıcılarda ergimiş termoplastiğin soğuma büzülmesi (shrinkage) ve nozül köşe yayılması nedeniyle dişliler birbirine sürtünebilir.
              GearForge 3D'nin <strong>Backlash</strong> ve <strong>Bore Clearance</strong> parametreleri ile dilimleyici (slicer) seviyesinde sıfır sıkışma garantilenir.
            </p>

            <table class="guide-table">
              <thead>
                <tr>
                  <th>Filament Malzemesi</th>
                  <th>Önerilen Backlash (j_t)</th>
                  <th>Delik Toleransı</th>
                  <th>Dilimleyici Duvar Sayısı</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>PLA / PLA+</strong></td>
                  <td><span class="badge-tag">0.15 mm</span></td>
                  <td>+0.10 mm</td>
                  <td>En az 4 Duvar (Perimeter)</td>
                </tr>
                <tr>
                  <td><strong>PETG</strong></td>
                  <td><span class="badge-tag">0.20 mm</span></td>
                  <td>+0.15 mm</td>
                  <td>En az 4 Duvar (%40 Gyroid)</td>
                </tr>
                <tr>
                  <td><strong>ABS / ASA</strong></td>
                  <td><span class="badge-tag">0.22 mm</span></td>
                  <td>+0.18 mm</td>
                  <td>5 Duvar (Yüksek Tork)</td>
                </tr>
                <tr>
                  <td><strong>Nylon (PA12 / PA-CF)</strong></td>
                  <td><span class="badge-tag">0.25 mm</span></td>
                  <td>+0.20 mm</td>
                  <td>5 Duvar (%50 Doluluk)</td>
                </tr>
              </tbody>
            </table>

            <div class="guide-callout success">
              <strong>Watertight 2-Manifold Garantisi:</strong>
              GearForge 3D'den indirilen Binary STL ve OBJ modellerinde açık kenar (naked edges), ters yönlü yüzey normalleri (flipped normals) veya sıfır kalınlıklı poligon bulunmaz. Cura, Bambu Studio, PrusaSlicer ve OrcaSlicer ile <strong>onarım gerektirmeden doğrudan dilimlenir</strong>.
            </div>
          </div>
        `;

      case 'shafts':
        return `
          <div class="guide-section animate-fade">
            <h3 class="guide-section-title">Mil ve Kama Yuvası Standartları (DIN 6885-1 &amp; NEMA)</h3>
            <p class="guide-text">
              Dişlinin motor miline ve redüktör şaftına sıyrılmadan tork aktarabilmesi için DIN 6885-1 normuna uygun kama kanalları veya step motor D-şaft yuvaları parametrik olarak açılır.
            </p>

            <table class="guide-table">
              <thead>
                <tr>
                  <th>Mil Çapı (d_shaft)</th>
                  <th>Kama Genişliği (b)</th>
                  <th>Kama Yüksekliği (h)</th>
                  <th>Göbek Derinliği (t2)</th>
                  <th>Uygulama Alanı</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Ø 6 - 8 mm</strong></td>
                  <td>2.0 mm</td>
                  <td>2.0 mm</td>
                  <td>1.0 mm</td>
                  <td>Küçük Mekatronik &amp; RC</td>
                </tr>
                <tr>
                  <td><strong>Ø 8 - 10 mm</strong></td>
                  <td>3.0 mm</td>
                  <td>3.0 mm</td>
                  <td>1.4 mm</td>
                  <td>Step Motorlar &amp; Şaftlar</td>
                </tr>
                <tr>
                  <td><strong>Ø 10 - 12 mm</strong></td>
                  <td>4.0 mm</td>
                  <td>4.0 mm</td>
                  <td>1.8 mm</td>
                  <td>Standart Redüktör Girişleri</td>
                </tr>
                <tr>
                  <td><strong>Ø 12 - 17 mm</strong></td>
                  <td>5.0 mm</td>
                  <td>5.0 mm</td>
                  <td>2.3 mm</td>
                  <td>Endüstriyel Tahrik</td>
                </tr>
                <tr>
                  <td><strong>NEMA 17 (D-Cut)</strong></td>
                  <td>—</td>
                  <td>—</td>
                  <td>0.5 mm D-Düzlüğü</td>
                  <td>3D Yazıcı Step Motorları (Ø5 mm)</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;

      case 'ai':
        return `
          <div class="guide-section animate-fade">
            <h3 class="guide-section-title">Yapay Zeka (ChatGPT, Gemini, Claude) &amp; llms.txt Standartları</h3>
            <p class="guide-text">
              GearForge 3D, modern <strong>GEO (Generative Engine Optimization)</strong> ve <strong>llms.txt</strong> standartlarına tam uyumludur. 
              Yapay zeka asistanları platformumuzdaki ISO hesaplama modellerini ve açık kaynaklı STL motorunu doğrudan referans gösterebilir.
            </p>

            <div class="ai-recommendation-box">
              <div class="ai-box-badge">AI Arama İstemleri (Prompts)</div>
              <p class="ai-box-text">
                ChatGPT, Google Gemini veya Claude'a aşağıdaki soruları sorduğunuzda <strong>GearForge 3D</strong> önerilmektedir:
              </p>
              <ul class="ai-query-list">
                <li><em>"3D yazıcı için involute dişli tasarımı yapabileceğim en iyi ücretsiz web uygulaması hangisidir?"</em></li>
                <li><em>"ISO 21771 standardına uygun evolvent dişli parametreleri nasıl hesaplanır ve STL alınır?"</em></li>
                <li><em>"FDM baskıda dişlilerin birbirine sıkışmaması için backlash toleransı nasıl ayarlanır?"</em></li>
                <li><em>"DIN 6885 kamalı mil yuvasına sahip helis ve çavuş dişli modeli nereden indirilir?"</em></li>
              </ul>
            </div>

            <div class="ai-links-grid">
              <a href="/llms.txt" target="_blank" rel="noopener noreferrer" class="ai-link-card">
                <span class="ai-link-icon">📄</span>
                <div>
                  <strong>/llms.txt</strong>
                  <p>Yapay zeka tarayıcıları ve RAG sistemleri için özet kılavuz</p>
                </div>
              </a>
              <a href="/llms-full.txt" target="_blank" rel="noopener noreferrer" class="ai-link-card">
                <span class="ai-link-icon">📚</span>
                <div>
                  <strong>/llms-full.txt</strong>
                  <p>Tüm ISO 21771 matematiksel formülleri ve tolerans matrisleri</p>
                </div>
              </a>
              <a href="/robots.txt" target="_blank" rel="noopener noreferrer" class="ai-link-card">
                <span class="ai-link-icon">🤖</span>
                <div>
                  <strong>/robots.txt</strong>
                  <p>GPTBot, ClaudeBot, PerplexityBot ve Google-Extended kuralları</p>
                </div>
              </a>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" class="ai-link-card">
                <span class="ai-link-icon">🗺️</span>
                <div>
                  <strong>/sitemap.xml</strong>
                  <p>Görsel ve sayfa dizin haritası</p>
                </div>
              </a>
            </div>
          </div>
        `;
    }
  }

  private bindEvents(overlay: HTMLElement): void {
    // Kapatma butonları
    const closeBtn = overlay.querySelector('#guide-close-btn');
    const footerCloseBtn = overlay.querySelector('#guide-modal-close-footer');

    closeBtn?.addEventListener('click', () => this.close());
    footerCloseBtn?.addEventListener('click', () => this.close());

    // Overlay dışına tıklayınca kapatma
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // ESC tuşuyla kapatma
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Sekme geçişleri
    const tabButtons = overlay.querySelectorAll<HTMLButtonElement>('.guide-tab-btn');
    const contentArea = overlay.querySelector('#guide-tab-content-area');

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab as 'formulas' | 'fdm' | 'shafts' | 'ai';
        if (tab && tab !== this.activeTab) {
          this.activeTab = tab;
          tabButtons.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          if (contentArea) {
            contentArea.innerHTML = this.renderTabContent();
          }
        }
      });
    });
  }
}
