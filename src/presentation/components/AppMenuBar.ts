import { GearBuilderState, GearBuilderStore } from '../../application/GearBuilderStore';
import { i18n, SUPPORTED_LANGUAGES } from '../../application/I18nService';
import { ExportFormat } from '../../domain/models/GearTypes';
import { GearViewportController } from '../../infrastructure/three/GearViewportController';
import { EngineeringGuideModal } from './EngineeringGuideModal';
import { GearCreationWizardModal } from './GearCreationWizardModal';
import { ProjectManagerModal } from './ProjectManagerModal';
import { SaveProjectModal } from './SaveProjectModal';
import { ToastNotification } from './ToastNotification';

export class AppMenuBar {
  private readonly container: HTMLElement;
  private readonly store: GearBuilderStore;
  private readonly viewport: GearViewportController;
  private readonly projectManagerModal: ProjectManagerModal;
  private readonly saveModal: SaveProjectModal;
  private readonly guideModal: EngineeringGuideModal;
  private readonly wizardModal: GearCreationWizardModal;

  private activeDropdown: HTMLElement | null = null;
  private activeProjectBadgeEl!: HTMLElement;
  private isDirtyBadgeEl!: HTMLElement;

  constructor(
    container: HTMLElement,
    store: GearBuilderStore,
    viewport: GearViewportController,
    projectManagerModal: ProjectManagerModal,
    saveModal: SaveProjectModal,
    wizardModal: GearCreationWizardModal
  ) {
    this.container = container;
    this.store = store;
    this.viewport = viewport;
    this.projectManagerModal = projectManagerModal;
    this.saveModal = saveModal;
    this.guideModal = new EngineeringGuideModal();
    this.wizardModal = wizardModal;

    this.render();
    this.setupGlobalShortcuts();
    this.setupDropdownBehavior();

    this.store.subscribe((state) => this.updateStateBadges(state));
    i18n.onLanguageChange(() => {
      this.render();
      this.updateStateBadges(this.store.getState());
    });
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'app-menubar';

    const menuLeft = document.createElement('div');
    menuLeft.className = 'menubar-left';

    // 1. Dosya (File) Menüsü
    const fileMenu = this.createDropdownMenu(i18n.t('menu.file'), [
      {
        icon: '🧙‍♂️',
        label: i18n.t('menu.wizard'),
        shortcut: 'Ctrl+W',
        highlight: true,
        action: () => this.wizardModal.open(true),
      },
      {
        icon: '📄',
        label: i18n.t('menu.new_gear'),
        shortcut: 'Ctrl+N',
        action: () => this.handleNewGear(),
      },
      {
        icon: '📂',
        label: i18n.t('menu.open_saved'),
        shortcut: 'Ctrl+O',
        action: () => this.projectManagerModal.open(),
      },
      {
        icon: '💾',
        label: i18n.t('menu.save'),
        shortcut: 'Ctrl+S',
        action: () => this.handleQuickSave(),
      },
      {
        icon: '📑',
        label: i18n.t('menu.save_as'),
        action: () => this.saveModal.open(true),
      },
      { divider: true },
      {
        icon: '📥',
        label: i18n.t('menu.import_json'),
        action: () => this.triggerJsonUpload(),
      },
      {
        icon: '📤',
        label: i18n.t('menu.export_json'),
        action: () => this.store.exportPrimaryGear(ExportFormat.JSON_CONFIG),
      },
      { divider: true },
      {
        icon: '🔄',
        label: i18n.t('menu.reset_default'),
        action: () => this.handleResetDefault(),
      },
    ]);

    // 2. Projelerim / Kayıtlar (LocalStorage) Menüsü
    const projectsMenu = this.createProjectsDropdown();

    // 3. Dışa Aktar (Export) Menüsü
    const exportMenu = this.createDropdownMenu('🚀 Dışa Aktar', [
      {
        icon: '🖨️',
        label: 'STL İndir (İkili / Binary STL - 3D Baskı)',
        shortcut: 'Ctrl+E',
        highlight: true,
        action: () => {
          this.store.exportPrimaryGear(ExportFormat.STL_BINARY);
          ToastNotification.success('Binary STL dosyası üretildi ve indiriliyor.', '3D Baskı İhracatı');
        },
      },
      {
        icon: '📄',
        label: 'ASCII STL İndir (.stl)',
        action: () => this.store.exportPrimaryGear(ExportFormat.STL_ASCII),
      },
      {
        icon: '🧊',
        label: 'Wavefront OBJ İndir (.obj)',
        action: () => this.store.exportPrimaryGear(ExportFormat.OBJ),
      },
      {
        icon: '⚙️',
        label: 'Karşı Pinyon Dişli STL İndir',
        action: () => {
          this.store.exportMatingGear(ExportFormat.STL_BINARY);
          ToastNotification.success('Karşı pinyon dişli STL olarak indirildi.');
        },
      },
      { divider: true },
      {
        icon: '📸',
        label: '3B Sahne Ekran Görüntüsü Al (.png)',
        action: () => this.handleCaptureScreenshot(),
      },
    ]);

    // 4. Şablonlar (Presets) Menüsü
    const presetsMenu = this.createPresetsDropdown();

    // 5. Görünüm (View) Menüsü
    const viewMenu = this.createViewDropdown();

    // 6. Yardım Menüsü
    const helpMenu = this.createDropdownMenu('❓ Yardım', [
      {
        icon: 'ℹ️',
        label: 'GearForge 3D & Trunçgil Teknoloji Hakkında',
        action: () => {
          const btn = document.getElementById('btn-open-credits');
          btn?.click();
        },
      },
      {
        icon: '📐',
        label: 'ISO 21771 & 3D Baskı Kılavuzu',
        highlight: true,
        action: () => {
          this.guideModal.open('formulas');
        },
      },
      {
        icon: '🖨️',
        label: 'FDM Baskı & Backlash Tolerans Tablosu',
        action: () => {
          this.guideModal.open('fdm');
        },
      },
      {
        icon: '🔩',
        label: 'DIN 6885 Mil & Kama Standartları',
        action: () => {
          this.guideModal.open('shafts');
        },
      },
      {
        icon: '🤖',
        label: 'Yapay Zeka (GEO) & llms.txt Rehberi',
        action: () => {
          this.guideModal.open('ai');
        },
      },
      { divider: true },
      {
        icon: '⌨️',
        label: 'Klavye Kısayolları (Shortcuts)',
        action: () => this.showShortcutsInfo(),
      },
    ]);

    menuLeft.append(fileMenu, projectsMenu, exportMenu, presetsMenu, viewMenu, helpMenu);

    // Sağ Hızlı Erişim ve Durum Çubuğu
    const menuRight = document.createElement('div');
    menuRight.className = 'menubar-right';

    // Aktif Proje Göstergesi (Tıklayınca sihirbazı veya proje adını açar)
    const projectInfo = document.createElement('div');
    projectInfo.className = 'menubar-project-info';
    projectInfo.title = 'Şu anki açık olan dişli tasarımı (Sihirbaz ile düzenlemek için tıklayın)';
    projectInfo.style.cursor = 'pointer';

    this.activeProjectBadgeEl = document.createElement('span');
    this.activeProjectBadgeEl.className = 'project-name-badge';
    this.activeProjectBadgeEl.textContent = this.store.getState().currentProjectName || i18n.t('badge.active_project');

    this.isDirtyBadgeEl = document.createElement('span');
    this.isDirtyBadgeEl.className = 'project-dirty-badge hidden';
    this.isDirtyBadgeEl.textContent = i18n.t('badge.dirty');
    this.isDirtyBadgeEl.title = 'Kaydedilmemiş değişiklikler var';

    projectInfo.append(this.activeProjectBadgeEl, this.isDirtyBadgeEl);
    projectInfo.addEventListener('click', () => {
      this.wizardModal.open(false);
    });

    // Hızlı Aksiyon Butonları
    const quickActions = document.createElement('div');
    quickActions.className = 'menubar-quick-actions';

    const btnNew = this.createQuickBtn(i18n.t('quick.new'), 'Yeni bir dişli tasarımı başlat (Ctrl+N)', () =>
      this.handleNewGear()
    );

    const btnProjects = this.createQuickBtn(i18n.t('quick.projects'), 'Kayıtlı projeler yöneticisini aç (Ctrl+O)', () =>
      this.projectManagerModal.open()
    );

    const btnSave = this.createQuickBtn(i18n.t('quick.save'), 'Projeyi LocalStorage\'a kaydet (Ctrl+S)', () =>
      this.handleQuickSave(),
      'btn-quick-save'
    );

    const btnStl = this.createQuickBtn(i18n.t('quick.export_stl'), '3D Yazıcı için Binary STL İndir (Ctrl+E)', () => {
      this.store.exportPrimaryGear(ExportFormat.STL_BINARY);
      ToastNotification.success('Binary STL indiriliyor.', '3D Baskı');
    }, 'btn-quick-export');

    quickActions.append(btnNew, btnProjects, btnSave, btnStl);

    // Dil Seçici Açılır Menüsü (TR, EN, DE, RU)
    const langDropdown = this.createLanguageDropdown();

    menuRight.append(projectInfo, quickActions, langDropdown);

    this.container.append(menuLeft, menuRight);
  }

  private createDropdownMenu(
    title: string,
    items: Array<
      | {
          icon?: string;
          label: string;
          shortcut?: string;
          highlight?: boolean;
          action: () => void;
          divider?: false;
        }
      | { divider: true }
    >
  ): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'menubar-item';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'menubar-btn';
    trigger.innerHTML = `${title} <span class="arrow-down">▾</span>`;

    const dropdown = document.createElement('div');
    dropdown.className = 'menubar-dropdown';

    for (const item of items) {
      if ('divider' in item && item.divider) {
        const div = document.createElement('div');
        div.className = 'dropdown-divider';
        dropdown.appendChild(div);
        continue;
      }

      const row = document.createElement('button');
      row.type = 'button';
      row.className = `dropdown-row ${item.highlight ? 'row-highlight' : ''}`;
      row.innerHTML = `
        <span class="row-left">
          ${item.icon ? `<span class="row-icon">${item.icon}</span>` : ''}
          <span class="row-label">${item.label}</span>
        </span>
        ${item.shortcut ? `<kbd class="row-shortcut">${item.shortcut}</kbd>` : ''}
      `;

      row.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeAllDropdowns();
        item.action();
      });

      dropdown.appendChild(row);
    }

    wrap.append(trigger, dropdown);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(wrap);
    });

    wrap.addEventListener('mouseenter', () => {
      if (this.activeDropdown && this.activeDropdown !== wrap) {
        this.openDropdown(wrap);
      }
    });

    return wrap;
  }

  private createProjectsDropdown(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'menubar-item';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'menubar-btn';
    trigger.innerHTML = `💾 Kayıtlar <span class="arrow-down">▾</span>`;

    const dropdown = document.createElement('div');
    dropdown.className = 'menubar-dropdown menubar-dropdown-wide';

    const populateProjects = () => {
      dropdown.innerHTML = '';
      const repo = this.store.getStorageRepository();
      const all = repo.getAll();

      // Üst Başlık ve Yönet Butonu
      const headRow = document.createElement('button');
      headRow.type = 'button';
      headRow.className = 'dropdown-row row-highlight';
      headRow.innerHTML = `
        <span class="row-left">
          <span class="row-icon">📁</span>
          <span class="row-label"><strong>Tüm Kayıtlı Dişlileri Yönet (Galeri)...</strong></span>
        </span>
        <kbd class="row-shortcut">Ctrl+O</kbd>
      `;
      headRow.addEventListener('click', () => {
        this.closeAllDropdowns();
        this.projectManagerModal.open();
      });
      dropdown.appendChild(headRow);

      const div1 = document.createElement('div');
      div1.className = 'dropdown-divider';
      dropdown.appendChild(div1);

      const sectionLabel = document.createElement('div');
      sectionLabel.className = 'dropdown-section-header';
      sectionLabel.textContent = `Son Kayıtlı Dişliler (${Math.min(all.length, 5)} / ${all.length})`;
      dropdown.appendChild(sectionLabel);

      if (all.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'dropdown-empty-hint';
        empty.textContent = 'Kayıtlı dişli bulunamadı. "Projeyi Kaydet" ile ekleyin.';
        dropdown.appendChild(empty);
      } else {
        const topProjects = all.slice(0, 5);
        for (const proj of topProjects) {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'dropdown-row';
          const isCurrent = proj.id === this.store.getState().currentProjectId;
          row.innerHTML = `
            <span class="row-left">
              <span class="row-icon">${isCurrent ? '⚡' : '⚙️'}</span>
              <span class="row-label">${this.escapeHtml(proj.name)}</span>
            </span>
            <span class="row-meta-tag">z=${proj.summary.teethCount} m=${proj.summary.module}</span>
          `;
          row.addEventListener('click', () => {
            this.closeAllDropdowns();
            const ok = this.store.loadProjectById(proj.id);
            if (ok) {
              ToastNotification.success(`"${proj.name}" yüklendi.`);
            }
          });
          dropdown.appendChild(row);
        }
      }

      const div2 = document.createElement('div');
      div2.className = 'dropdown-divider';
      dropdown.appendChild(div2);

      const saveRow = document.createElement('button');
      saveRow.type = 'button';
      saveRow.className = 'dropdown-row';
      saveRow.innerHTML = `
        <span class="row-left">
          <span class="row-icon">💾</span>
          <span class="row-label">Mevcut Dişliyi Kaydet...</span>
        </span>
        <kbd class="row-shortcut">Ctrl+S</kbd>
      `;
      saveRow.addEventListener('click', () => {
        this.closeAllDropdowns();
        this.handleQuickSave();
      });
      dropdown.appendChild(saveRow);
    };

    wrap.append(trigger, dropdown);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      populateProjects();
      this.toggleDropdown(wrap);
    });

    wrap.addEventListener('mouseenter', () => {
      if (this.activeDropdown && this.activeDropdown !== wrap) {
        populateProjects();
        this.openDropdown(wrap);
      }
    });

    return wrap;
  }

  private createPresetsDropdown(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'menubar-item';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'menubar-btn';
    trigger.innerHTML = `⚙️ Şablonlar <span class="arrow-down">▾</span>`;

    const dropdown = document.createElement('div');
    dropdown.className = 'menubar-dropdown menubar-dropdown-presets';

    const presets = this.store.getPresets();
    for (const preset of presets) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'dropdown-row preset-dropdown-row';
      row.innerHTML = `
        <div class="preset-row-content">
          <strong class="preset-name">${preset.name}</strong>
          <small class="preset-desc">${preset.description}</small>
        </div>
      `;
      row.addEventListener('click', () => {
        this.closeAllDropdowns();
        this.store.applyPreset(preset.id);
        ToastNotification.info(`"${preset.name}" şablonu uygulandı.`);
      });
      dropdown.appendChild(row);
    }

    wrap.append(trigger, dropdown);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(wrap);
    });

    wrap.addEventListener('mouseenter', () => {
      if (this.activeDropdown && this.activeDropdown !== wrap) {
        this.openDropdown(wrap);
      }
    });

    return wrap;
  }

  private createViewDropdown(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'menubar-item';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'menubar-btn';
    trigger.innerHTML = `👁️ Görünüm <span class="arrow-down">▾</span>`;

    const dropdown = document.createElement('div');
    dropdown.className = 'menubar-dropdown';

    const camGroup = [
      { label: '📐 İzometrik 3B Kamera', action: () => this.viewport.setCameraPreset('iso') },
      { label: '🔝 Üst (Plan) Görünüm', action: () => this.viewport.setCameraPreset('top') },
      { label: '🔲 Ön Görünüm', action: () => this.viewport.setCameraPreset('front') },
    ];

    for (const cam of camGroup) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'dropdown-row';
      row.innerHTML = `<span class="row-label">${cam.label}</span>`;
      row.addEventListener('click', () => {
        this.closeAllDropdowns();
        cam.action();
      });
      dropdown.appendChild(row);
    }

    const div = document.createElement('div');
    div.className = 'dropdown-divider';
    dropdown.appendChild(div);

    const toggles = [
      {
        key: 'isAnimationPlaying' as const,
        label: '⟳ Dönüş Simülasyonu',
      },
      {
        key: 'showPitchCircles' as const,
        label: '◎ Referans Çemberleri',
      },
      {
        key: 'showCrossSection' as const,
        label: '✂ İç Kesit (Cross-Section)',
      },
      {
        key: 'showWireframe' as const,
        label: '⌗ Tel Kafes (Mesh)',
      },
      {
        key: 'showBuildPlate' as const,
        label: '▦ 3D Tabla (220mm)',
      },
    ];

    const updateCheckboxes = () => {
      const opts = this.viewport.getDisplayOptions();
      for (const t of toggles) {
        const itemEl = dropdown.querySelector(`[data-opt="${t.key}"]`);
        if (itemEl) {
          const isChecked = opts[t.key];
          itemEl.classList.toggle('checked', isChecked);
          const checkIcon = itemEl.querySelector('.check-indicator');
          if (checkIcon) checkIcon.textContent = isChecked ? '✓' : '';
        }
      }
    };

    for (const t of toggles) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'dropdown-row toggle-row';
      row.setAttribute('data-opt', t.key);
      row.innerHTML = `
        <span class="row-left">
          <span class="check-indicator"></span>
          <span class="row-label">${t.label}</span>
        </span>
      `;
      row.addEventListener('click', () => {
        const opts = this.viewport.getDisplayOptions();
        const newVal = !opts[t.key];
        this.viewport.setDisplayOptions({ [t.key]: newVal });
        updateCheckboxes();
      });
      dropdown.appendChild(row);
    }

    wrap.append(trigger, dropdown);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      updateCheckboxes();
      this.toggleDropdown(wrap);
    });

    wrap.addEventListener('mouseenter', () => {
      if (this.activeDropdown && this.activeDropdown !== wrap) {
        updateCheckboxes();
        this.openDropdown(wrap);
      }
    });

    return wrap;
  }

  private createQuickBtn(
    text: string,
    title: string,
    onClick: () => void,
    extraClass = ''
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `menubar-quick-btn ${extraClass}`;
    btn.title = title;
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private handleQuickSave(): void {
    const state = this.store.getState();
    if (state.currentProjectId) {
      const saved = this.store.saveCurrentProject();
      ToastNotification.success(`"${saved.name}" projesindeki değişiklikler kaydedildi.`, 'Kaydedildi');
    } else {
      this.saveModal.open(false);
    }
  }

  private handleNewGear(): void {
    const state = this.store.getState();
    if (state.isDirty) {
      if (!confirm('Kaydedilmemiş değişiklikleriniz var. Yeni bir dişli tasarımı başlatmak istediğinize emin misiniz?')) {
        return;
      }
    }
    this.wizardModal.open(true);
  }

  private handleResetDefault(): void {
    if (confirm('Tüm ayarlar fabrika varsayılanına sıfırlanacaktır. Onaylıyor musunuz?')) {
      this.store.resetToDefault();
      ToastNotification.info('Ayarlar sıfırlandı.');
    }
  }

  private handleCaptureScreenshot(): void {
    try {
      const dataUrl = this.viewport.captureScreenshot();
      const state = this.store.getState();
      const name = (state.currentProjectName || 'gearforge').replace(/[^a-z0-9_-]/gi, '_');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${name}_screenshot.png`;
      a.click();
      ToastNotification.success('3B Sahne görüntüsü PNG formatında kaydedildi.', 'Ekran Görüntüsü');
    } catch (e) {
      ToastNotification.error('Görüntü yakalanırken hata oluştu.', 'Hata');
    }
  }

  private triggerJsonUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const ok = this.store.importJsonConfiguration(text);
      if (ok) {
        ToastNotification.success('JSON ayarları başarıyla yüklendi.', 'İçe Aktarma');
      } else {
        ToastNotification.error('JSON dosyası geçerli dişli parametreleri içermiyor.', 'Hata');
      }
    });
    input.click();
  }

  private showShortcutsInfo(): void {
    ToastNotification.info(
      'Kısayollar: Ctrl+S (Kaydet) • Ctrl+O (Projelerim) • Ctrl+N (Yeni) • Ctrl+E (STL İndir)',
      'Klavye Kısayolları'
    );
  }

  private updateStateBadges(state: GearBuilderState): void {
    this.activeProjectBadgeEl.textContent = state.currentProjectName || 'Yeni Dişli Tasarımı';
    if (state.isDirty) {
      this.isDirtyBadgeEl.classList.remove('hidden');
    } else {
      this.isDirtyBadgeEl.classList.add('hidden');
    }
  }

  private setupDropdownBehavior(): void {
    document.addEventListener('click', (e) => {
      if (this.activeDropdown && !this.activeDropdown.contains(e.target as Node)) {
        this.closeAllDropdowns();
      }
    });
  }

  private toggleDropdown(menuItem: HTMLElement): void {
    if (this.activeDropdown === menuItem) {
      this.closeAllDropdowns();
    } else {
      this.openDropdown(menuItem);
    }
  }

  private openDropdown(menuItem: HTMLElement): void {
    this.closeAllDropdowns();
    this.activeDropdown = menuItem;
    menuItem.classList.add('is-open');
  }

  private closeAllDropdowns(): void {
    if (this.activeDropdown) {
      this.activeDropdown.classList.remove('is-open');
      this.activeDropdown = null;
    }
    const all = this.container.querySelectorAll('.menubar-item.is-open');
    all.forEach((el) => el.classList.remove('is-open'));
  }

  private setupGlobalShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!isCmdOrCtrl) return;

      // Input veya textarea üzerinde ise bazı kısayolları engellemeyelim
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.handleQuickSave();
      } else if (e.key === 'o' || e.key === 'O') {
        if (!isInput) {
          e.preventDefault();
          this.projectManagerModal.open();
        }
      } else if (e.key === 'n' || e.key === 'N') {
        if (!isInput) {
          e.preventDefault();
          this.handleNewGear();
        }
      } else if (e.key === 'w' || e.key === 'W') {
        if (!isInput) {
          e.preventDefault();
          this.wizardModal.open(true);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        if (!isInput) {
          e.preventDefault();
          this.store.exportPrimaryGear(ExportFormat.STL_BINARY);
          ToastNotification.success('Binary STL indiriliyor.', '3D Baskı');
        }
      }
    });
  }

  private createLanguageDropdown(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'menubar-item menubar-lang-item';

    const currentLang = i18n.getLanguage();
    const currentOpt = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'menubar-btn menubar-lang-btn';
    trigger.innerHTML = `<span class="flag">${currentOpt.flag}</span> <span class="lang-text">${currentOpt.code.toUpperCase()}</span> <span class="arrow-down">▾</span>`;
    trigger.title = 'Arayüz Dili / Interface Language / Sprache / Язык';

    const dropdown = document.createElement('div');
    dropdown.className = 'menubar-dropdown menubar-dropdown-lang';

    for (const opt of SUPPORTED_LANGUAGES) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `dropdown-row ${opt.code === currentLang ? 'row-highlight' : ''}`;
      row.innerHTML = `
        <span class="row-left">
          <span class="row-icon">${opt.flag}</span>
          <span class="row-label">${opt.name}</span>
        </span>
        <span class="row-shortcut">${opt.code.toUpperCase()}</span>
      `;
      row.addEventListener('click', () => {
        this.closeAllDropdowns();
        i18n.setLanguage(opt.code);
        ToastNotification.info(i18n.t('toast.lang_changed'));
      });
      dropdown.appendChild(row);
    }

    wrap.append(trigger, dropdown);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(wrap);
    });

    wrap.addEventListener('mouseenter', () => {
      if (this.activeDropdown && this.activeDropdown !== wrap) {
        this.openDropdown(wrap);
      }
    });

    return wrap;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
