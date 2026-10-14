import { GearBuilderStore } from '../../application/GearBuilderStore';
import { SavedGearProject } from '../../domain/models/SavedProject';
import { ToastNotification } from './ToastNotification';
import { SaveProjectModal } from './SaveProjectModal';

export class ProjectManagerModal {
  private readonly store: GearBuilderStore;
  private readonly saveModal: SaveProjectModal;
  private modalEl: HTMLElement | null = null;
  private searchQuery = '';

  constructor(store: GearBuilderStore, saveModal: SaveProjectModal) {
    this.store = store;
    this.saveModal = saveModal;
  }

  public open(): void {
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

    const repo = this.store.getStorageRepository();
    const projects = repo.getAll();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay gearforge-projects-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = `
      <div class="modal-card projects-manager-card">
        <button class="modal-close-btn" id="pm-close-btn" title="Kapat">✕</button>

        <div class="pm-header">
          <div class="pm-header-title-row">
            <div class="pm-icon-badge">📁</div>
            <div>
              <h3 class="pm-title">Kayıtlı Dişli Tasarımlarım (LocalStorage)</h3>
              <p class="pm-subtitle">Tarayıcınızda kayıtlı parametrik dişli modellerini yönetin, yükleyin veya yedekleyin.</p>
            </div>
          </div>
          <div class="pm-header-actions">
            <button class="btn-action-primary" id="pm-btn-new-gear">
              <span>➕</span> Yeni Dişli Oluştur
            </button>
            <button class="btn-action-secondary" id="pm-btn-save-current">
              <span>💾</span> Mevcut Tasarımı Kaydet
            </button>
          </div>
        </div>

        <div class="pm-toolbar">
          <div class="pm-search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              id="pm-search-input"
              class="pm-search-input"
              placeholder="Tasarımlarda ara (İsim, diş sayısı, modül...)"
              value="${this.escapeHtml(this.searchQuery)}"
            />
            ${this.searchQuery ? `<button id="pm-clear-search" class="pm-clear-search">✕</button>` : ''}
          </div>
          <div class="pm-toolbar-meta">
            <span class="pm-count-badge">Toplam: <strong id="pm-project-count">${projects.length}</strong> Tasarım</span>
          </div>
        </div>

        <div class="pm-list-container" id="pm-projects-list"></div>

        <div class="pm-footer">
          <div class="pm-footer-left">
            <button class="pm-footer-btn" id="pm-btn-import-json" title="JSON dosyasından projeleri içe aktarın">
              <span>📥</span> JSON'dan İçe Aktar
            </button>
            <button class="pm-footer-btn" id="pm-btn-export-backup" title="Tüm kayıtlı projeleri tek bir JSON dosyasında yedekleyin">
              <span>📤</span> Tümünü Yedekle (.json)
            </button>
          </div>
          <div class="pm-footer-right">
            <button class="btn-secondary" id="pm-btn-dismiss">Kapat</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.modalEl = overlay;

    this.renderProjectList();

    // Event Dinleyicileri
    const closeBtn = overlay.querySelector('#pm-close-btn');
    const dismissBtn = overlay.querySelector('#pm-btn-dismiss');
    const searchInput = overlay.querySelector<HTMLInputElement>('#pm-search-input');
    const clearSearchBtn = overlay.querySelector('#pm-clear-search');
    const newGearBtn = overlay.querySelector('#pm-btn-new-gear');
    const saveCurrentBtn = overlay.querySelector('#pm-btn-save-current');
    const importJsonBtn = overlay.querySelector('#pm-btn-import-json');
    const exportBackupBtn = overlay.querySelector('#pm-btn-export-backup');

    closeBtn?.addEventListener('click', () => this.close());
    dismissBtn?.addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.renderProjectList();
    });

    clearSearchBtn?.addEventListener('click', () => {
      this.searchQuery = '';
      if (searchInput) searchInput.value = '';
      this.renderProjectList();
    });

    newGearBtn?.addEventListener('click', () => {
      if (confirm('Mevcut çalışma alanını sıfırlayıp yeni bir dişli tasarımı başlatmak istiyor musunuz?')) {
        this.store.newProject();
        ToastNotification.info('Yeni dişli çalışma alanı hazırlandı.', 'Yeni Proje');
        this.close();
      }
    });

    saveCurrentBtn?.addEventListener('click', () => {
      this.close();
      this.saveModal.open(false);
    });

    importJsonBtn?.addEventListener('click', () => {
      this.triggerJsonImport();
    });

    exportBackupBtn?.addEventListener('click', () => {
      this.triggerBackupDownload();
    });

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        window.removeEventListener('keydown', handleKeydown);
      }
    };
    window.addEventListener('keydown', handleKeydown);
  }

  private renderProjectList(): void {
    const listEl = this.modalEl?.querySelector('#pm-projects-list');
    if (!listEl) return;

    const repo = this.store.getStorageRepository();
    let projects = repo.getAll();
    const activeId = this.store.getState().currentProjectId;

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      projects = projects.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const teethMatch = `z${p.summary.teethCount}`.includes(q) || `${p.summary.teethCount}` === q;
        const modMatch = `m${p.summary.module}`.includes(q) || `${p.summary.module}` === q;
        return nameMatch || descMatch || teethMatch || modMatch;
      });
    }

    if (projects.length === 0) {
      listEl.innerHTML = `
        <div class="pm-empty-state">
          <div class="empty-icon">⚙️</div>
          <h4>${this.searchQuery ? 'Aramanıza uygun tasarım bulunamadı' : 'Henüz Kayıtlı Bir Dişli Yok'}</h4>
          <p>${
            this.searchQuery
              ? 'Farklı bir arama terimi deneyin.'
              : 'Mevcut dişli modelinizi tarayıcınıza kaydetmek için "Mevcut Tasarımı Kaydet" butonuna tıklayabilirsiniz.'
          }</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    for (const project of projects) {
      const isActive = project.id === activeId;
      const card = document.createElement('div');
      card.className = `pm-project-card ${isActive ? 'is-active-project' : ''}`;

      const dateStr = this.formatDate(project.updatedAt);
      const s = project.summary;

      card.innerHTML = `
        <div class="pm-card-top">
          <div class="pm-card-title-col">
            <div class="pm-card-title-row">
              <h4 class="pm-card-title" title="${this.escapeHtml(project.name)}">${this.escapeHtml(project.name)}</h4>
              ${isActive ? `<span class="active-badge">Aktif Tasarım</span>` : ''}
            </div>
            <span class="pm-card-date">🕒 Güncellendi: ${dateStr}</span>
          </div>
          <div class="pm-card-actions">
            <button class="pm-card-btn pm-btn-load ${isActive ? 'is-current' : ''}" data-id="${project.id}" title="Bu tasarımı çalışma alanına yükle">
              <span>⚡</span> <strong>${isActive ? 'Tekrar Yükle' : 'Yükle'}</strong>
            </button>
            <button class="pm-card-btn-icon pm-btn-rename" data-id="${project.id}" title="Adını Değiştir">
              ✏️
            </button>
            <button class="pm-card-btn-icon pm-btn-duplicate" data-id="${project.id}" title="Klonla (Kopya Oluştur)">
              📋
            </button>
            <button class="pm-card-btn-icon pm-btn-export-single" data-id="${project.id}" title="JSON Olarak İndir">
              📥
            </button>
            <button class="pm-card-btn-icon pm-btn-delete" data-id="${project.id}" title="Tasarımı Sil">
              🗑️
            </button>
          </div>
        </div>

        ${project.description ? `<p class="pm-card-desc">${this.escapeHtml(project.description)}</p>` : ''}

        <div class="pm-card-specs">
          <span class="spec-tag"><strong>${s.teethCount}</strong> Diş (z)</span>
          <span class="spec-tag">Modül <strong>${s.module}</strong></span>
          <span class="spec-tag">Dış Çap <strong>Ø${s.outerDiameter}mm</strong></span>
          <span class="spec-tag">Kalınlık <strong>${s.thickness}mm</strong></span>
          <span class="spec-tag">Delik <strong>${s.boreType} (${s.boreDiameter}mm)</strong></span>
          <span class="spec-tag">Materyal <strong>${s.material}</strong></span>
        </div>
      `;

      // Buton olayları
      const loadBtn = card.querySelector('.pm-btn-load');
      const renameBtn = card.querySelector('.pm-btn-rename');
      const dupBtn = card.querySelector('.pm-btn-duplicate');
      const exportSingleBtn = card.querySelector('.pm-btn-export-single');
      const delBtn = card.querySelector('.pm-btn-delete');

      loadBtn?.addEventListener('click', () => {
        const ok = this.store.loadProjectById(project.id);
        if (ok) {
          ToastNotification.success(`"${project.name}" çalışma alanına başarıyla yüklendi.`, 'Tasarım Yüklendi');
          this.close();
        } else {
          ToastNotification.error('Proje yüklenirken bir hata oluştu.', 'Hata');
        }
      });

      renameBtn?.addEventListener('click', () => {
        const newName = prompt('Yeni tasarım adını girin:', project.name);
        if (newName && newName.trim() && newName.trim() !== project.name) {
          repo.rename(project.id, newName.trim());
          if (isActive) {
            this.store.getState().currentProjectId; // tetikle
          }
          ToastNotification.info('Tasarım adı güncellendi.', 'Yeniden Adlandırıldı');
          this.renderProjectList();
        }
      });

      dupBtn?.addEventListener('click', () => {
        const dup = repo.duplicate(project.id);
        if (dup) {
          ToastNotification.success(`"${dup.name}" kopyası oluşturuldu.`, 'Klonlandı');
          this.renderProjectList();
        }
      });

      exportSingleBtn?.addEventListener('click', () => {
        this.downloadSingleProject(project);
      });

      delBtn?.addEventListener('click', () => {
        if (confirm(`"${project.name}" tasarımını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
          this.store.deleteProject(project.id);
          ToastNotification.warn(`"${project.name}" silindi.`, 'Silindi');
          this.renderProjectList();
        }
      });

      listEl.appendChild(card);
    }
  }

  private downloadSingleProject(project: SavedGearProject): void {
    const jsonStr = JSON.stringify(
      {
        format: 'gearforge_project',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        name: project.name,
        description: project.description,
        parameters: project.parameters,
        summary: project.summary,
      },
      null,
      2
    );

    const safeName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gearforge_${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    ToastNotification.info(`"${project.name}" JSON dosyası olarak indirildi.`);
  }

  private triggerBackupDownload(): void {
    const repo = this.store.getStorageRepository();
    const backupJson = repo.exportAllAsJson();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gearforge_all_projects_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    ToastNotification.success('Tüm projeleriniz JSON formatında yedeklendi.', 'Yedek Alındı');
  }

  private triggerJsonImport(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const repo = this.store.getStorageRepository();
        const result = repo.importFromJson(text);
        if (result.importedCount > 0) {
          ToastNotification.success(`${result.importedCount} adet dişli tasarımı içe aktarıldı.`, 'İçe Aktarma Başarılı');
          this.renderProjectList();
        } else {
          ToastNotification.error(result.errors.join(', ') || 'Dosya içinde geçerli dişli verisi bulunamadı.', 'Hata');
        }
      } catch (err) {
        ToastNotification.error((err as Error).message || 'Dosya okunurken bir hata oluştu.', 'Hata');
      }
    });
    input.click();
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Bugün, ${timeStr}`;
    }
    return `${date.toLocaleDateString('tr-TR')} ${timeStr}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
