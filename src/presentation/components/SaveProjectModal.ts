import { GearBuilderStore } from '../../application/GearBuilderStore';
import { ToastNotification } from './ToastNotification';

export class SaveProjectModal {
  private readonly store: GearBuilderStore;
  private modalEl: HTMLElement | null = null;
  private isSaveAs = false;

  constructor(store: GearBuilderStore) {
    this.store = store;
  }

  public open(isSaveAs = false): void {
    this.isSaveAs = isSaveAs;
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

    const state = this.store.getState();
    const p = state.parameters;
    const m = state.metrics;

    let defaultName = state.currentProjectName;
    if (this.isSaveAs || !defaultName || defaultName === 'Yeni Dişli Tasarımı') {
      const typeLabel = p.gearType === 'spur' ? 'Düz' : p.gearType === 'helical' ? 'Helisel' : 'Dişli';
      defaultName = `${typeLabel} Dişli Z${p.teethCount} M${p.module.toFixed(1)}`;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay gearforge-save-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = `
      <div class="modal-card save-project-card">
        <button class="modal-close-btn" id="save-modal-close-btn" title="Kapat">✕</button>
        <div class="save-modal-header">
          <div class="save-icon-badge">💾</div>
          <div>
            <h3 class="save-modal-title">${this.isSaveAs ? 'Farklı Kaydet (LocalStorage)' : 'Projeyi Kaydet (LocalStorage)'}</h3>
            <p class="save-modal-subtitle">Tasarımınızı tarayıcınızın güvenli yerel depolama alanına kaydedin.</p>
          </div>
        </div>

        <form id="save-project-form" class="save-project-form">
          <div class="form-group">
            <label for="project-name-input" class="form-label">Tasarım / Proje Adı <span class="required">*</span></label>
            <input
              type="text"
              id="project-name-input"
              class="form-input"
              value="${this.escapeHtml(defaultName)}"
              placeholder="Örn: CNC Redüktör Pinyonu Z24 M2"
              required
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="project-desc-input" class="form-label">Açıklama / Notlar (İsteğe Bağlı)</label>
            <textarea
              id="project-desc-input"
              class="form-textarea"
              rows="2"
              placeholder="Tolerans değerleri, montaj notları vb..."
            ></textarea>
          </div>

          <div class="project-specs-preview">
            <div class="spec-pill"><strong>Diş:</strong> ${p.teethCount} adet</div>
            <div class="spec-pill"><strong>Modül:</strong> ${p.module} mm</div>
            <div class="spec-pill"><strong>Dış Çap:</strong> ${m.outerDiameter.toFixed(1)} mm</div>
            <div class="spec-pill"><strong>Kalınlık:</strong> ${p.thickness} mm</div>
            <div class="spec-pill"><strong>Delik:</strong> ${p.boreDiameter} mm (${p.boreType})</div>
            <div class="spec-pill"><strong>Ağırlık:</strong> ${m.estimatedWeightGrams.toFixed(1)}g (${p.filamentMaterial})</div>
          </div>

          <div class="save-modal-actions">
            <button type="button" class="btn-secondary" id="save-modal-cancel-btn">İptal</button>
            <button type="submit" class="btn-primary-accent" id="save-modal-submit-btn">
              <span>💾</span>
              <strong>${this.isSaveAs ? 'Yeni Olarak Kaydet' : 'Değişiklikleri Kaydet'}</strong>
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    this.modalEl = overlay;

    const input = overlay.querySelector<HTMLInputElement>('#project-name-input');
    if (input) {
      setTimeout(() => {
        input.focus();
        input.select();
      }, 50);
    }

    const closeBtn = overlay.querySelector('#save-modal-close-btn');
    const cancelBtn = overlay.querySelector('#save-modal-cancel-btn');
    const form = overlay.querySelector<HTMLFormElement>('#save-project-form');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = input?.value.trim();
      if (!name) return;

      const descInput = overlay.querySelector<HTMLTextAreaElement>('#project-desc-input');
      const desc = descInput?.value.trim() || undefined;

      try {
        if (this.isSaveAs) {
          const saved = this.store.saveProjectAs(name, desc);
          ToastNotification.success(`"${saved.name}" yeni proje olarak kaydedildi.`, 'Farklı Kaydedildi');
        } else {
          const saved = this.store.saveCurrentProject(name, desc);
          ToastNotification.success(`"${saved.name}" projesine kaydedildi.`, 'Kayıt Başarılı');
        }
        this.close();
      } catch (err) {
        ToastNotification.error((err as Error).message || 'Kayıt sırasında bir hata oluştu.', 'Hata');
      }
    });

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        window.removeEventListener('keydown', handleKeydown);
      }
    };
    window.addEventListener('keydown', handleKeydown);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
