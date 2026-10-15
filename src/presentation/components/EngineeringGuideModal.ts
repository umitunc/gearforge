/**
 * EngineeringGuideModal.ts
 * GearForge 3D — ISO 21771 Evolvent Dişli Geometrisi, 3D Baskı ve AI Entegrasyon Kılavuzu.
 * Geliştirici: Trunçgil Teknoloji (https://www.truncgil.com.tr)
 */

import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * KaTeX formül render yardımcısı.
 */
function tex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return `<code class="formula-fallback">${latex}</code>`;
  }
}

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
            <div class="guide-section-header-row">
              <div>
                <h3 class="guide-section-title">ISO 21771 &amp; DIN 867 Evolvent Diş Geometrisi</h3>
                <p class="guide-text">
                  GearForge 3D, teorik diş profilini <strong>ISO 21771</strong> standardında tanımlanan involute (evolvent) diferansiyel eğri denklemleriyle hesaplar.
                </p>
              </div>
            </div>

            <div class="formula-grid">
              <div class="formula-card">
                <div class="formula-card-top">
                  <span class="formula-name">Bölüm Dairesi Çapı (Pitch Diameter)</span>
                  <button class="btn-copy-latex" data-latex="d = m \\cdot z" title="LaTeX Kodunu Kopyala" aria-label="LaTeX Kodunu Kopyala">
                    <span class="copy-icon">📋</span> LaTeX
                  </button>
                </div>
                <div class="formula-latex">
                  ${tex('d = m \\cdot z', true)}
                </div>
                <div class="formula-desc">
                  <span>${tex('m')}: Modül (mm)</span>
                  <span class="desc-sep">•</span>
                  <span>${tex('z')}: Diş sayısı</span>
                </div>
              </div>

              <div class="formula-card">
                <div class="formula-card-top">
                  <span class="formula-name">Temel Dairesi Çapı (Base Diameter)</span>
                  <button class="btn-copy-latex" data-latex="d_b = d \\cdot \\cos\\alpha" title="LaTeX Kodunu Kopyala" aria-label="LaTeX Kodunu Kopyala">
                    <span class="copy-icon">📋</span> LaTeX
                  </button>
                </div>
                <div class="formula-latex">
                  ${tex('d_b = d \\cdot \\cos\\alpha', true)}
                </div>
                <div class="formula-desc">
                  <span>${tex('\\alpha')}: Basınç açısı (Standart: ${tex('20^\\circ')})</span>
                </div>
              </div>

              <div class="formula-card">
                <div class="formula-card-top">
                  <span class="formula-name">Diş Üstü Çapı (Tip Diameter)</span>
                  <button class="btn-copy-latex" data-latex="d_a = d + 2 \\cdot (h_a^* + x) \\cdot m" title="LaTeX Kodunu Kopyala" aria-label="LaTeX Kodunu Kopyala">
                    <span class="copy-icon">📋</span> LaTeX
                  </button>
                </div>
                <div class="formula-latex">
                  ${tex('d_a = d + 2 \\cdot (h_a^* + x) \\cdot m', true)}
                </div>
                <div class="formula-desc">
                  <span>${tex('h_a^*')}: Diş başı katsayısı (${tex('1.0')})</span>
                  <span class="desc-sep">•</span>
                  <span>${tex('x')}: Profil kaydırma</span>
                </div>
              </div>

              <div class="formula-card">
                <div class="formula-card-top">
                  <span class="formula-name">Diş Dibi Çapı (Root Diameter)</span>
                  <button class="btn-copy-latex" data-latex="d_f = d - 2 \\cdot (h_f^* - x) \\cdot m" title="LaTeX Kodunu Kopyala" aria-label="LaTeX Kodunu Kopyala">
                    <span class="copy-icon">📋</span> LaTeX
                  </button>
                </div>
                <div class="formula-latex">
                  ${tex('d_f = d - 2 \\cdot (h_f^* - x) \\cdot m', true)}
                </div>
                <div class="formula-desc">
                  <span>${tex('h_f^*')}: Diş dibi katsayısı (${tex('1.25')})</span>
                </div>
              </div>

              <div class="formula-card">
                <div class="formula-card-top">
                  <span class="formula-name">Dairesel Hatve (Circular Pitch)</span>
                  <button class="btn-copy-latex" data-latex="p = \\pi \\cdot m = \\frac{\\pi \\cdot d}{z}" title="LaTeX Kodunu Kopyala" aria-label="LaTeX Kodunu Kopyala">
                    <span class="copy-icon">📋</span> LaTeX
                  </button>
                </div>
                <div class="formula-latex">
                  ${tex('p = \\pi \\cdot m', true)}
                </div>
                <div class="formula-desc">
                  <span>Dişler arası ardışık yay uzunluğu (${tex('p = \\frac{\\pi \\cdot d}{z}')})</span>
                </div>
              </div>

              <div class="formula-card">
                <div class="formula-card-top">
                  <span class="formula-name">Bölüm Dairesinde Diş Kalınlığı</span>
                  <button class="btn-copy-latex" data-latex="s = \\frac{\\pi \\cdot m}{2} + 2 \\cdot x \\cdot m \\cdot \\tan\\alpha - j_t" title="LaTeX Kodunu Kopyala" aria-label="LaTeX Kodunu Kopyala">
                    <span class="copy-icon">📋</span> LaTeX
                  </button>
                </div>
                <div class="formula-latex">
                  ${tex('s = \\frac{\\pi \\cdot m}{2} + 2 \\cdot x \\cdot m \\cdot \\tan\\alpha - j_t', true)}
                </div>
                <div class="formula-desc">
                  <span>${tex('j_t')}: Uygulanan teğetsel backlash (boşluk payı)</span>
                </div>
              </div>

              <div class="formula-card">
                <div class="formula-card-top">
                  <span class="formula-name">Eksenler Arası Mesafe (Center Distance)</span>
                  <button class="btn-copy-latex" data-latex="a = \\frac{d_1 + d_2}{2} = \\frac{m \\cdot (z_1 + z_2)}{2}" title="LaTeX Kodunu Kopyala" aria-label="LaTeX Kodunu Kopyala">
                    <span class="copy-icon">📋</span> LaTeX
                  </button>
                </div>
                <div class="formula-latex">
                  ${tex('a = \\frac{d_1 + d_2}{2} = \\frac{m \\cdot (z_1 + z_2)}{2}', true)}
                </div>
                <div class="formula-desc">
                  <span>${tex('z_1, z_2')}: Eş çalışan dişli çifti diş sayıları</span>
                </div>
              </div>

              <div class="formula-card">
                <div class="formula-card-top">
                  <span class="formula-name">Toplam Diş Derinliği (Whole Depth)</span>
                  <button class="btn-copy-latex" data-latex="h = h_a + h_f = 2.25 \\cdot m" title="LaTeX Kodunu Kopyala" aria-label="LaTeX Kodunu Kopyala">
                    <span class="copy-icon">📋</span> LaTeX
                  </button>
                </div>
                <div class="formula-latex">
                  ${tex('h = h_a + h_f = 2.25 \\cdot m', true)}
                </div>
                <div class="formula-desc">
                  <span>${tex('h_a = 1.0\\,m')}: Diş başı</span>
                  <span class="desc-sep">•</span>
                  <span>${tex('h_f = 1.25\\,m')}: Diş dibi</span>
                </div>
              </div>

              <div class="formula-card">
                <div class="formula-card-top">
                  <span class="formula-name">Helis Dişli Alın Modülü (Transverse Module)</span>
                  <button class="btn-copy-latex" data-latex="m_t = \\frac{m_n}{\\cos\\beta}, \\quad \\tan\\alpha_t = \\frac{\\tan\\alpha_n}{\\cos\\beta}" title="LaTeX Kodunu Kopyala" aria-label="LaTeX Kodunu Kopyala">
                    <span class="copy-icon">📋</span> LaTeX
                  </button>
                </div>
                <div class="formula-latex">
                  ${tex('m_t = \\frac{m_n}{\\cos\\beta}, \\quad \\tan\\alpha_t = \\frac{\\tan\\alpha_n}{\\cos\\beta}', true)}
                </div>
                <div class="formula-desc">
                  <span>${tex('\\beta')}: Helis açısı</span>
                  <span class="desc-sep">•</span>
                  <span>${tex('m_n')}: Normal modül</span>
                </div>
              </div>
            </div>

            <div class="guide-latex-highlight-card">
              <div class="guide-latex-card-header">
                <div class="guide-latex-title-group">
                  <span class="guide-badge-cyan">Diferansiyel Geometri</span>
                  <h4 class="guide-latex-card-title">Evolvent (İnvolute) Eğri Fonksiyonu &amp; Parametrik Koordinatlar</h4>
                </div>
                <button class="btn-copy-latex" data-latex="\\operatorname{inv}(\\alpha) = \\tan\\alpha - \\alpha \\\\ x(\\theta) = r_b \\cdot (\\cos\\theta + \\theta \\cdot \\sin\\theta) \\\\ y(\\theta) = r_b \\cdot (\\sin\\theta - \\theta \\cdot \\cos\\theta)" title="LaTeX Kodunu Kopyala">
                  <span class="copy-icon">📋</span> LaTeX
                </button>
              </div>
              <p class="guide-latex-card-desc">
                ISO 21771 standardı uyarınca diş profilinin kusursuz yuvarlanma (rolling contact) teması sağlaması için involut açısı ${tex('\\alpha')} ve evolvent yay parametresi ${tex('\\theta \\ge 0')} kullanılarak profil noktaları analitik olarak türetilir:
              </p>
              <div class="guide-latex-math-row">
                <div class="latex-math-block">
                  <span class="latex-math-label">İnvolut (Evolvent) Açı Fonksiyonu:</span>
                  <div class="formula-latex">
                    ${tex('\\operatorname{inv}(\\alpha) = \\tan\\alpha - \\alpha', true)}
                  </div>
                </div>
                <div class="latex-math-block">
                  <span class="latex-math-label">Kartezyen Düzlem Parametrik Koordinatları:</span>
                  <div class="formula-latex">
                    ${tex('\\begin{cases} x(\\theta) = r_b \\cdot (\\cos\\theta + \\theta \\cdot \\sin\\theta) \\\\[4pt] y(\\theta) = r_b \\cdot (\\sin\\theta - \\theta \\cdot \\cos\\theta) \\end{cases}', true)}
                  </div>
                </div>
              </div>
              <div class="guide-latex-card-footer">
                <span class="footer-note">Burada ${tex('r_b = \\frac{d_b}{2}')} temel daire yarıçapı, ${tex('\\theta')} temel daireden açılan evolvent yay açısıdır (radyan).</span>
              </div>
            </div>
          </div>
        `;

      case 'fdm':
        return `
          <div class="guide-section animate-fade">
            <h3 class="guide-section-title">3D Yazıcı (FDM / SLA) Dişli Üretim ve Backlash Rehberi</h3>
            <p class="guide-text">
              FDM tipi 3D yazıcılarda ergimiş termoplastiğin soğuma büzülmesi (shrinkage) ve nozül köşe yayılması nedeniyle dişliler birbirine sürtünebilir.
              GearForge 3D'nin <strong>Backlash (${tex('j_t')})</strong> ve <strong>Delik Toleransı (${tex('\\Delta d')})</strong> parametreleri ile dilimleyici (slicer) seviyesinde sıfır sıkışma garantilenir.
            </p>

            <table class="guide-table">
              <thead>
                <tr>
                  <th>Filament Malzemesi</th>
                  <th>Önerilen Backlash (${tex('j_t')})</th>
                  <th>Delik Toleransı (${tex('\\Delta d')})</th>
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
                  <th>Mil Çapı (${tex('d_{\\text{mil}}')})</th>
                  <th>Kama Genişliği (${tex('b')})</th>
                  <th>Kama Yüksekliği (${tex('h')})</th>
                  <th>Göbek Derinliği (${tex('t_2')})</th>
                  <th>Uygulama Alanı</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>${tex('\\varnothing')} 6 - 8 mm</strong></td>
                  <td>2.0 mm</td>
                  <td>2.0 mm</td>
                  <td>1.0 mm</td>
                  <td>Küçük Mekatronik &amp; RC</td>
                </tr>
                <tr>
                  <td><strong>${tex('\\varnothing')} 8 - 10 mm</strong></td>
                  <td>3.0 mm</td>
                  <td>3.0 mm</td>
                  <td>1.4 mm</td>
                  <td>Step Motorlar &amp; Şaftlar</td>
                </tr>
                <tr>
                  <td><strong>${tex('\\varnothing')} 10 - 12 mm</strong></td>
                  <td>4.0 mm</td>
                  <td>4.0 mm</td>
                  <td>1.8 mm</td>
                  <td>Standart Redüktör Girişleri</td>
                </tr>
                <tr>
                  <td><strong>${tex('\\varnothing')} 12 - 17 mm</strong></td>
                  <td>5.0 mm</td>
                  <td>5.0 mm</td>
                  <td>2.3 mm</td>
                  <td>Endüstriyel Tahrik</td>
                </tr>
                <tr>
                  <td><strong>NEMA 17 (D-Cut) (${tex('\\varnothing 5\\text{ mm}')})</strong></td>
                  <td>—</td>
                  <td>—</td>
                  <td>0.5 mm D-Düzlüğü</td>
                  <td>3D Yazıcı Step Motorları (${tex('\\varnothing 5\\text{ mm}')})</td>
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

    // LaTeX Kopyalama Butonları
    const bindCopyButtons = () => {
      const copyBtns = overlay.querySelectorAll<HTMLButtonElement>('.btn-copy-latex');
      copyBtns.forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const latexCode = btn.dataset.latex;
          if (!latexCode) return;
          try {
            await navigator.clipboard.writeText(latexCode);
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<span class="copy-icon">✓</span> Kopyalandı';
            btn.classList.add('copied');
            setTimeout(() => {
              btn.innerHTML = originalHtml;
              btn.classList.remove('copied');
            }, 1800);
          } catch (err) {
            console.error('LaTeX kopyalanamadı:', err);
          }
        });
      });
    };

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
            bindCopyButtons();
          }
        }
      });
    });

    bindCopyButtons();
  }
}
