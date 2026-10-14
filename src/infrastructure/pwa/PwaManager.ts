/**
 * GearForge 3D — PWA & Çevrimdışı Yaşam Döngüsü Yöneticisi (Trunçgil Teknoloji © 2026)
 *
 * Sorumluluklar:
 * 1. Service Worker kaydı ve arka plan güncelleme tespiti (Stale-While-Revalidate).
 * 2. 'beforeinstallprompt' ve 'appinstalled' olaylarını dinleyerek A2HS (Ana Ekrana Ekleme) akışı.
 * 3. Chrome / Edge / Safari / iOS / Android için bağlama duyarlı rehber modalı.
 * 4. Ağ bağlantısı (Online / Offline) durum izleyicisi ve çevrimdışı CAD çalışma garantisi bildirimi.
 * 5. Window Controls Overlay (Masaüstü PWA başlık çubuğu) desteği.
 * 6. Credits modalinde PWA ve çevrimdışı durum bilgilendirmesi.
 */

export class PwaManager {
  private deferredPrompt: any = null;
  private installBtn: HTMLElement | null = null;
  private offlineBadge: HTMLElement | null = null;
  private guideModal: HTMLElement | null = null;
  private updateToast: HTMLElement | null = null;
  private isStandalone = false;

  constructor() {
    this.isStandalone = this.checkIsStandalone();
  }

  /**
   * PWA yöneticisini başlatır ve olay dinleyicilerini bağlar.
   */
  public init(): void {
    this.bindDomElements();
    this.bindNetworkEvents();
    this.bindInstallEvents();
    this.registerServiceWorker();
    this.setupWindowControlsOverlay();
    this.updatePwaStatusInCredits();
  }

  /**
   * Uygulamanın standalone (PWA olarak yüklü) çalışıp çalışmadığını doğrular.
   */
  public isInstalled(): boolean {
    return this.isStandalone;
  }

  private checkIsStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  /**
   * DOM elemanlarını bağlar ve toast konteynerini hazırlar.
   */
  private bindDomElements(): void {
    this.installBtn = document.getElementById('btn-pwa-install');
    this.offlineBadge = document.getElementById('pwa-offline-badge');
    this.guideModal = document.getElementById('pwa-guide-modal');

    // Standalone çalışıyorsa yükleme butonunu gizle
    if (this.isStandalone && this.installBtn) {
      this.installBtn.classList.add('hidden');
    } else if (this.installBtn) {
      this.installBtn.addEventListener('click', () => this.handleInstallClick());
    }

    // Kılavuz Modalı Kapatma Olayları
    if (this.guideModal) {
      const closeGuide = () => this.guideModal?.classList.add('hidden');
      document.getElementById('pwa-guide-modal-close')?.addEventListener('click', closeGuide);
      document.getElementById('pwa-guide-modal-ok')?.addEventListener('click', closeGuide);
      this.guideModal.addEventListener('click', (e) => {
        if (e.target === this.guideModal) closeGuide();
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.guideModal?.classList.contains('hidden')) closeGuide();
      });
    }

    // Bildirim Toast Konteyneri (Yoksa oluştur)
    if (!document.getElementById('pwa-toast-container')) {
      const toastHost = document.createElement('div');
      toastHost.id = 'pwa-toast-container';
      toastHost.className = 'pwa-toast-container';
      document.body.appendChild(toastHost);
    }
  }

  /**
   * Service Worker kaydını başlatır ve güncelleme döngüsünü takip eder.
   */
  private registerServiceWorker(): void {
    if (!('serviceWorker' in navigator)) {
      console.info('[GearForge PWA] Service Worker bu tarayıcıda desteklenmiyor.');
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = new URL('./sw.js', window.location.href).href;

      navigator.serviceWorker
        .register(swUrl, { scope: './' })
        .then((registration) => {
          console.log('[GearForge PWA] Service Worker başarıyla kaydedildi. Kapsam:', registration.scope);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdatePrompt(newWorker);
              }
            });
          });
        })
        .catch((error) => {
          console.warn('[GearForge PWA] Service Worker kaydı başarısız:', error);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  /**
   * PWA Kurulum olaylarını dinler (beforeinstallprompt, appinstalled).
   */
  private bindInstallEvents(): void {
    if (this.isStandalone) {
      if (this.installBtn) this.installBtn.classList.add('hidden');
      return;
    }

    // Chromium tabanlı tarayıcılarda (Chrome, Edge, Brave, Opera)
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      if (this.installBtn) {
        this.installBtn.classList.remove('hidden');
      }
    });

    // Başarıyla yüklendiğinde
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isStandalone = true;
      if (this.installBtn) {
        this.installBtn.classList.add('hidden');
      }
      this.showToast('✨ GearForge 3D cihazınıza başarıyla yüklendi! Artık çevrimdışı da kullanabilirsiniz.', 'success', 5000);
      this.updatePwaStatusInCredits();
    });
  }

  /**
   * Yükle butonuna tıklandığında kurulum akışını yürütür.
   */
  private async handleInstallClick(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[GearForge PWA] Kullanıcı kurulumu kabul etti.');
        if (this.installBtn) this.installBtn.classList.add('hidden');
      }
      this.deferredPrompt = null;
    } else {
      // Doğrudan JS çağrısı tetiklenmediyse kılavuz modalı aç
      this.showInstallGuideModal();
    }
  }

  /**
   * Masaüstü ve mobil kullanıcılar için şık PWA kurulum kılavuzu modalı açar.
   */
  private showInstallGuideModal(): void {
    if (!this.guideModal) return;

    const instructionsEl = document.getElementById('pwa-guide-instructions');
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);

    if (instructionsEl) {
      if (isIos) {
        instructionsEl.innerHTML = `
          <ol class="pwa-guide-steps">
            <li>Safari alt araç çubuğundaki <strong class="highlight-cyan">Paylaş (Share <span style="font-size:15px;">⎋</span>)</strong> simgesine dokunun.</li>
            <li>Açılan menüde <strong class="highlight-orange">'Ana Ekrana Ekle' (+ Add to Home Screen)</strong> seçeneğini seçin.</li>
            <li>Sağ üstteki <strong class="highlight-cyan">'Ekle'</strong> butonuna dokunarak kurulumu tamamlayın.</li>
          </ol>
        `;
      } else if (isAndroid) {
        instructionsEl.innerHTML = `
          <ol class="pwa-guide-steps">
            <li>Chrome sağ üst köşesindeki <strong class="highlight-cyan">üç nokta (⋮)</strong> menüsüne dokunun.</li>
            <li>Açılan menüden <strong class="highlight-orange">'Uygulamayı Yükle'</strong> veya <strong>'Ana Ekrana Ekle'</strong> seçeneğini seçin.</li>
            <li>Çıkan onay penceresinde <strong class="highlight-cyan">'Yükle'</strong> butonuna dokunun.</li>
          </ol>
        `;
      } else {
        instructionsEl.innerHTML = `
          <ol class="pwa-guide-steps">
            <li>Tarayıcınızın adres çubuğunun (URL) sağ tarafındaki <strong class="highlight-cyan">Uygulamayı Yükle (⊕ / ⬇)</strong> simgesine tıklayın.</li>
            <li>Veya tarayıcı menüsünden (⋮) <strong class="highlight-orange">'GearForge 3D Uygulamasını Yükle'</strong> seçeneğini seçin.</li>
            <li>Uygulama bağımsız bir masaüstü penceresinde yüksek performansla açılacaktır.</li>
          </ol>
        `;
      }
    }

    this.guideModal.classList.remove('hidden');
  }

  /**
   * Ağ durumu (Online/Offline) dinleyicileri.
   */
  private bindNetworkEvents(): void {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;

      if (!isOnline) {
        if (this.offlineBadge) {
          this.offlineBadge.classList.remove('hidden');
        }
        this.showToast(
          '⚡ Çevrimdışı Mod: GearForge 3D parametrik motoru ve 3B STL üretimi %100 yerel olarak çalışmaya devam ediyor.',
          'warning',
          6000
        );
      } else {
        if (this.offlineBadge) {
          this.offlineBadge.classList.add('hidden');
        }
        if (sessionStorage.getItem('gf_was_offline')) {
          sessionStorage.removeItem('gf_was_offline');
          this.showToast('🟢 İnternet bağlantısı yeniden kuruldu.', 'info', 3000);
        }
      }
    };

    window.addEventListener('offline', () => {
      sessionStorage.setItem('gf_was_offline', 'true');
      updateNetworkStatus();
    });

    window.addEventListener('online', () => {
      updateNetworkStatus();
    });

    // İlk durum kontrolü
    if (!navigator.onLine) {
      updateNetworkStatus();
    }
  }

  /**
   * Yeni bir sürüm önbelleğe alındığında kullanıcıya sunulan bildirim.
   */
  private showUpdatePrompt(worker: ServiceWorker): void {
    if (this.updateToast) return;

    this.updateToast = document.createElement('div');
    this.updateToast.className = 'pwa-update-toast';
    this.updateToast.innerHTML = `
      <div class="pwa-update-content">
        <span class="pwa-update-title">🚀 Yeni Güncelleme Hazır</span>
        <span class="pwa-update-desc">GearForge 3D'nin yeni sürümü indirildi.</span>
      </div>
      <div class="pwa-update-actions">
        <button id="btn-pwa-reload" class="pwa-btn-reload">Şimdi Yenile</button>
        <button id="btn-pwa-dismiss" class="pwa-btn-dismiss">✕</button>
      </div>
    `;

    document.body.appendChild(this.updateToast);

    document.getElementById('btn-pwa-reload')?.addEventListener('click', () => {
      worker.postMessage({ type: 'SKIP_WAITING' });
    });

    document.getElementById('btn-pwa-dismiss')?.addEventListener('click', () => {
      this.updateToast?.remove();
      this.updateToast = null;
    });
  }

  /**
   * Masaüstü Window Controls Overlay (WCO) desteği.
   */
  private setupWindowControlsOverlay(): void {
    if ('windowControlsOverlay' in navigator) {
      const wco = (navigator as any).windowControlsOverlay;
      if (wco && wco.visible) {
        document.body.classList.add('pwa-wco-active');
      }
      wco?.addEventListener('geometrychange', () => {
        if (wco.visible) {
          document.body.classList.add('pwa-wco-active');
        } else {
          document.body.classList.remove('pwa-wco-active');
        }
      });
    }
  }

  /**
   * Credits modalı içerisine PWA & Çevrimdışı mimari bilgisini ekler.
   */
  private updatePwaStatusInCredits(): void {
    const metaGrid = document.querySelector('.credits-meta-grid');
    if (!metaGrid) return;

    if (document.getElementById('credits-pwa-item')) return;

    const pwaItem = document.createElement('div');
    pwaItem.id = 'credits-pwa-item';
    pwaItem.className = 'meta-item';
    pwaItem.innerHTML = `
      <span class="meta-label">PWA &amp; Çevrimdışı Mimari</span>
      <span class="meta-value highlight-cyan">
        ${this.isStandalone ? '🖥️ Masaüstü Standalone (Tam Bağımsız)' : '⚡ Service Worker Aktif (Çevrimdışı Destekli)'}
      </span>
    `;

    metaGrid.appendChild(pwaItem);
  }

  /**
   * Kullanıcı arayüzünde şık, Apple estetiğinde toast mesajı gösterir.
   */
  private showToast(message: string, type: 'info' | 'success' | 'warning' = 'info', durationMs = 4000): void {
    const container = document.getElementById('pwa-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `pwa-toast pwa-toast-${type}`;
    toast.innerHTML = `
      <div class="pwa-toast-inner">
        <span class="pwa-toast-msg">${message}</span>
      </div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, durationMs);
  }
}
