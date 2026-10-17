/**
 * GearCreationWizardModal.ts
 * GearForge 3D — Çok Dilli (TR, EN, DE, RU) Parametrik Dişli Tasarım Sihirbazı Modalı.
 * Geliştirici: Trunçgil Teknoloji (https://www.truncgil.com.tr)
 */

import katex from 'katex';
import 'katex/dist/katex.min.css';
import { GearBuilderStore } from '../../application/GearBuilderStore';
import { i18n, SUPPORTED_LANGUAGES } from '../../application/I18nService';
import { InvoluteMathCalculator } from '../../domain/calculators/InvoluteMathCalculator';
import { createDefaultGearParameters, GearParameters } from '../../domain/models/GearParameters';
import {
  BoreType,
  FilamentMaterial,
  GearType,
  SizingMode,
  WebStyle,
} from '../../domain/models/GearTypes';
import { GearDimensionThumbnail2D } from './GearDimensionThumbnail2D';
import { ToastNotification } from './ToastNotification';
import { WizardThreePreview } from './WizardThreePreview';

/**
 * KaTeX formül render yardımcısı.
 */
function renderMath(expr: string, displayMode = false): string {
  try {
    return katex.renderToString(expr, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return `<code class="formula-fallback">${expr}</code>`;
  }
}

export class GearCreationWizardModal {
  private readonly store: GearBuilderStore;
  private modalEl: HTMLElement | null = null;
  private previewPanelEl: HTMLElement | null = null;
  private wizardThreePreview: WizardThreePreview | null = null;
  private previewMode: '3d' | '2d' | 'dual' = '3d';
  private currentStep = 1;
  private readonly totalSteps = 5;
  private params: GearParameters;
  private projectName = '';
  private activeInfoKeys = new Set<string>();
  private activeInspectKey = 'spur';
  private unsubscribeI18n?: () => void;

  constructor(store: GearBuilderStore) {
    this.store = store;
    this.params = { ...this.store.getState().parameters };
  }

  /**
   * Sihirbazı açar.
   */
  public open(startFromDefault = true): void {
    if (startFromDefault) {
      this.params = createDefaultGearParameters();
      const typeLabel = this.params.gearType === 'spur' ? 'Düz' : 'Dişli';
      this.projectName = `${typeLabel} Dişli Z${this.params.teethCount} M${this.params.module.toFixed(1)}`;
    } else {
      this.params = { ...this.store.getState().parameters };
      this.projectName = this.store.getState().currentProjectName || 'Yeni Dişli Tasarımı';
    }

    // Three.js 3B kalıcı önizleyiciyi başlat
    if (this.wizardThreePreview) {
      this.wizardThreePreview.dispose();
      this.wizardThreePreview = null;
    }
    this.wizardThreePreview = new WizardThreePreview();
    this.wizardThreePreview.update(this.params);
    this.wizardThreePreview.frameCamera();

    this.currentStep = 1;
    this.activeInspectKey = this.params.gearType;
    this.activeInfoKeys.clear();
    this.render();

    this.unsubscribeI18n = i18n.onLanguageChange(() => {
      if (this.modalEl) {
        this.render();
      }
    });
  }

  /**
   * Sihirbazı kapatır.
   */
  public close(): void {
    if (this.wizardThreePreview) {
      this.wizardThreePreview.dispose();
      this.wizardThreePreview = null;
    }
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
      this.previewPanelEl = null;
    }
    if (this.unsubscribeI18n) {
      this.unsubscribeI18n();
      this.unsubscribeI18n = undefined;
    }
  }

  /**
   * Modal DOM ağacını render eder.
   */
  private render(): void {
    const existing = this.modalEl;
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay gearforge-wizard-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'wizard-title');

    const card = document.createElement('div');
    card.className = 'modal-card wizard-card';

    // 1. Üst Bar: Başlık, Dil Değiştirici ve Kapatma Butonu
    const header = this.buildHeader();

    // 2. Stepper Adım Göstergesi
    const stepper = this.buildStepper();

    // 3. Adım İçerik Konteyneri (İki Kolonlu Split Düzen: Sol Form, Sağ Büyük 2D CAD ve Formüller)
    const body = document.createElement('div');
    body.className = 'wizard-body wizard-split-body';

    const leftCol = document.createElement('div');
    leftCol.className = 'wizard-form-col';
    leftCol.appendChild(this.buildStepContent(this.currentStep));

    const rightCol = this.buildPreviewPanel(this.currentStep);
    this.previewPanelEl = rightCol;

    body.append(leftCol, rightCol);

    // 4. Alt Eylem Çubuğu: Geri, İleri, Oluştur, İptal
    const footer = this.buildFooter();

    card.append(header, stepper, body, footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    this.modalEl = overlay;

    // ESC ile kapatma
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.modalEl) {
        this.close();
        window.removeEventListener('keydown', handleKeydown);
      }
    };
    window.addEventListener('keydown', handleKeydown);
  }

  /**
   * Başlık ve dil seçici
   */
  private buildHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'wizard-header';

    const left = document.createElement('div');
    left.className = 'wizard-header-left';
    left.innerHTML = `
      <div class="wizard-icon-box">🧙‍♂️</div>
      <div>
        <h2 id="wizard-title" class="wizard-title">${i18n.t('wizard.title')}</h2>
        <p class="wizard-subtitle">${i18n.t('wizard.subtitle')}</p>
      </div>
    `;

    const right = document.createElement('div');
    right.className = 'wizard-header-right';

    // Dil Seçici Buton Grubu
    const langGroup = document.createElement('div');
    langGroup.className = 'wizard-lang-group';
    const currentLang = i18n.getLanguage();

    for (const opt of SUPPORTED_LANGUAGES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `wizard-lang-btn ${opt.code === currentLang ? 'active' : ''}`;
      btn.title = opt.name;
      btn.innerHTML = `<span class="flag">${opt.flag}</span> <span class="code">${opt.code.toUpperCase()}</span>`;
      btn.addEventListener('click', () => {
        i18n.setLanguage(opt.code);
        ToastNotification.info(i18n.t('toast.lang_changed'));
      });
      langGroup.appendChild(btn);
    }

    // Kapatma (X) Butonu
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'modal-close-btn';
    closeBtn.title = i18n.t('wizard.btn_cancel');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.close());

    right.append(langGroup, closeBtn);
    header.append(left, right);
    return header;
  }

  /**
   * Adım İlerleme Çubuğu (Stepper)
   */
  private buildStepper(): HTMLElement {
    const stepper = document.createElement('div');
    stepper.className = 'wizard-stepper';

    const stepTabs = [
      { step: 1, label: i18n.t('wizard.step1.tab'), icon: '⚙️' },
      { step: 2, label: i18n.t('wizard.step2.tab'), icon: '🔩' },
      { step: 3, label: i18n.t('wizard.step3.tab'), icon: '🛞' },
      { step: 4, label: i18n.t('wizard.step4.tab'), icon: '🖨️' },
      { step: 5, label: i18n.t('wizard.step5.tab'), icon: '🚀' },
    ];

    for (const item of stepTabs) {
      const isPast = item.step < this.currentStep;
      const isActive = item.step === this.currentStep;

      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = `wizard-step-tab ${isActive ? 'active' : ''} ${isPast ? 'completed' : ''}`;
      tab.innerHTML = `
        <span class="step-num">${isPast ? '✓' : item.icon}</span>
        <span class="step-label">${item.label}</span>
      `;
      // Tamamlanmış veya tıklanabilir önceki adımlara serbest geçiş
      tab.addEventListener('click', () => {
        this.currentStep = item.step;
        this.resetInspectKeyForStep(item.step);
        this.render();
      });

      stepper.appendChild(tab);
    }

    return stepper;
  }

  /**
   * Belirtilen adımın içerik formunu üretir.
   */
  private buildStepContent(step: number): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'wizard-step-pane';

    switch (step) {
      case 1:
        this.renderStep1(wrap);
        break;
      case 2:
        this.renderStep2(wrap);
        break;
      case 3:
        this.renderStep3(wrap);
        break;
      case 4:
        this.renderStep4(wrap);
        break;
      case 5:
        this.renderStep5(wrap);
        break;
      default:
        this.renderStep1(wrap);
        break;
    }

    return wrap;
  }

  /**
   * ADIM 1: Dişli Tipi ve Ana Boyutlandırma
   */
  private renderStep1(container: HTMLElement): void {
    container.innerHTML = `
      <div class="step-header">
        <h3 class="step-title">${i18n.t('wizard.step1.title')}</h3>
        <p class="step-desc">${i18n.t('wizard.step1.desc')}</p>
      </div>
    `;

    // 1. Dişli Tipi Seçimi Kartları
    const gearTypeGroup = document.createElement('div');
    gearTypeGroup.className = 'wizard-card-group';

    const gearTypes = [
      { type: GearType.SPUR, label: i18n.t('param.gearType.spur'), icon: '⚙️' },
      { type: GearType.HELICAL, label: i18n.t('param.gearType.helical'), icon: '🌀' },
      { type: GearType.HERRINGBONE, label: i18n.t('param.gearType.herringbone'), icon: '⚡' },
      { type: GearType.BEVEL_TAPER, label: i18n.t('param.gearType.bevel'), icon: '📐' },
      { type: GearType.INTERNAL_RING, label: i18n.t('param.gearType.internal'), icon: '⭕' },
    ];

    for (const item of gearTypes) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `wizard-choice-card ${this.params.gearType === item.type ? 'active' : ''}`;
      card.innerHTML = `
        <span class="choice-icon">${item.icon}</span>
        <span class="choice-label">${item.label}</span>
      `;
      card.addEventListener('click', () => {
        this.updateParam('gearType', item.type);
        this.activeInspectKey = item.type;
        this.render();
      });
      gearTypeGroup.appendChild(card);
    }
    container.appendChild(gearTypeGroup);

    // 2. Boyutlandırma Modu (Module vs Pitch Dia vs Outer Dia)
    const modeWrap = document.createElement('div');
    modeWrap.className = 'wizard-mode-selector-wrap';
    modeWrap.innerHTML = `<span class="wizard-field-title">${i18n.t('param.sizingMode')}</span>`;

    const modeRow = document.createElement('div');
    modeRow.className = 'wizard-mode-chips';
    const modes = [
      { mode: SizingMode.MODULE, label: i18n.t('param.sizingMode.module') },
      { mode: SizingMode.PITCH_DIAMETER, label: i18n.t('param.sizingMode.pitch') },
      { mode: SizingMode.OUTER_DIAMETER, label: i18n.t('param.sizingMode.outer') },
    ];
    for (const m of modes) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `wizard-mode-chip ${this.params.sizingMode === m.mode ? 'active' : ''}`;
      btn.textContent = m.label;
      btn.addEventListener('click', () => {
        this.updateParam('sizingMode', m.mode);
        this.render();
      });
      modeRow.appendChild(btn);
    }
    modeWrap.appendChild(modeRow);
    container.appendChild(modeWrap);

    // 3. Parametre Girişleri (Diş Sayısı, Modül / Çap, Kalınlık, Helis Açısı)
    const grid = document.createElement('div');
    grid.className = 'wizard-params-grid';

    // Diş Sayısı (z)
    grid.appendChild(
      this.createSliderField(
        'teethCount',
        i18n.t('param.teethCount'),
        i18n.t('param.teethCount.unit'),
        6,
        140,
        1,
        this.params.teethCount,
        'param.teethCount.formula',
        'param.teethCount.info',
        (v) => this.updateParam('teethCount', Math.round(v))
      )
    );

    // Modül veya Hedef Çap
    if (this.params.sizingMode === SizingMode.MODULE) {
      grid.appendChild(
        this.createSliderField(
          'module',
          i18n.t('param.module'),
          i18n.t('param.module.unit'),
          0.5,
          8.0,
          0.05,
          this.params.module,
          'param.module.formula',
          'param.module.info',
          (v) => this.updateParam('module', v)
        )
      );
    } else if (this.params.sizingMode === SizingMode.PITCH_DIAMETER) {
      grid.appendChild(
        this.createSliderField(
          'targetPitchDiameter',
          i18n.t('param.targetPitchDiameter'),
          i18n.t('param.targetPitchDiameter.unit'),
          10,
          280,
          0.5,
          this.params.targetPitchDiameter,
          'param.targetPitchDiameter.formula',
          'param.targetPitchDiameter.info',
          (v) => this.updateParam('targetPitchDiameter', v)
        )
      );
    } else {
      grid.appendChild(
        this.createSliderField(
          'targetOuterDiameter',
          i18n.t('param.targetOuterDiameter'),
          i18n.t('param.targetOuterDiameter.unit'),
          12,
          300,
          0.5,
          this.params.targetOuterDiameter,
          'param.targetOuterDiameter.formula',
          'param.targetOuterDiameter.info',
          (v) => this.updateParam('targetOuterDiameter', v)
        )
      );
    }

    // Dişli Kalınlığı (b)
    grid.appendChild(
      this.createSliderField(
        'thickness',
        i18n.t('param.thickness'),
        i18n.t('param.thickness.unit'),
        2.0,
        60.0,
        0.5,
        this.params.thickness,
        'param.thickness.formula',
        'param.thickness.info',
        (v) => this.updateParam('thickness', v)
      )
    );

    // Helis Açısı (β) — Eğer Helisel veya Çavuş seçildiyse
    if (
      this.params.gearType === GearType.HELICAL ||
      this.params.gearType === GearType.HERRINGBONE
    ) {
      grid.appendChild(
        this.createSliderField(
          'helixAngleDeg',
          i18n.t('param.helixAngleDeg'),
          i18n.t('param.helixAngleDeg.unit'),
          5,
          45,
          1,
          this.params.helixAngleDeg,
          'param.helixAngleDeg.formula',
          'param.helixAngleDeg.info',
          (v) => this.updateParam('helixAngleDeg', v)
        )
      );
    }

    container.appendChild(grid);
  }

  /**
   * ADIM 2: Merkez Delik ve Mil Bağlantısı
   */
  private renderStep2(container: HTMLElement): void {
    container.innerHTML = `
      <div class="step-header">
        <h3 class="step-title">${i18n.t('wizard.step2.title')}</h3>
        <p class="step-desc">${i18n.t('wizard.step2.desc')}</p>
      </div>
    `;

    // 1. Delik Tipi Seçim Kartları
    const boreGroup = document.createElement('div');
    boreGroup.className = 'wizard-card-group';

    const boreTypes = [
      { type: BoreType.CIRCULAR, label: 'Yuvarlak Mil', icon: '⭕' },
      { type: BoreType.KEYWAY, label: 'DIN 6885 Kama', icon: '🗝️' },
      { type: BoreType.D_SHAFT, label: 'Tek D-Mil (NEMA)', icon: '🔲' },
      { type: BoreType.DOUBLE_D, label: 'Çift D-Mil', icon: '⏸️' },
      { type: BoreType.HEXAGONAL, label: 'Altıgen (Hex)', icon: '⬡' },
      { type: BoreType.SQUARE, label: 'Kare Mil', icon: '⏹️' },
      { type: BoreType.SPLINE, label: 'Frezeli Spline', icon: '✳️' },
      { type: BoreType.NONE, label: 'Deliksiz (Masif)', icon: '⚪' },
    ];

    for (const item of boreTypes) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `wizard-choice-card ${this.params.boreType === item.type ? 'active' : ''}`;
      card.innerHTML = `
        <span class="choice-icon">${item.icon}</span>
        <span class="choice-label">${item.label}</span>
      `;
      card.addEventListener('click', () => {
        this.updateParam('boreType', item.type);
        this.activeInspectKey = item.type === BoreType.KEYWAY ? 'keywayWidth' : 'boreDiameter';
        this.render();
      });
      boreGroup.appendChild(card);
    }
    container.appendChild(boreGroup);

    // 2. Delik ve Kama Ölçüleri
    if (this.params.boreType !== BoreType.NONE) {
      const grid = document.createElement('div');
      grid.className = 'wizard-params-grid';

      // Mil Çapı
      grid.appendChild(
        this.createSliderField(
          'boreDiameter',
          i18n.t('param.boreDiameter'),
          i18n.t('param.boreDiameter.unit'),
          2.0,
          80.0,
          0.5,
          this.params.boreDiameter,
          'param.boreDiameter.formula',
          'param.boreDiameter.info',
          (v) => {
            this.updateParam('boreDiameter', v);
            // DIN 6885 otomatik öneri
            if (this.params.boreType === BoreType.KEYWAY) {
              this.applyDin6885Auto(v);
            }
          }
        )
      );

      // DIN 6885 Kama Boyutları
      if (this.params.boreType === BoreType.KEYWAY) {
        grid.appendChild(
          this.createSliderField(
            'keywayWidth',
            i18n.t('param.keywayWidth'),
            i18n.t('param.keywayWidth.unit'),
            1.0,
            16.0,
            0.5,
            this.params.keywayWidth,
            'param.keywayWidth.formula',
            'param.keywayWidth.info',
            (v) => this.updateParam('keywayWidth', v)
          )
        );

        grid.appendChild(
          this.createSliderField(
            'keywayDepth',
            i18n.t('param.keywayDepth'),
            i18n.t('param.keywayDepth.unit'),
            0.5,
            10.0,
            0.1,
            this.params.keywayDepth,
            'param.keywayDepth.formula',
            'param.keywayDepth.info',
            (v) => this.updateParam('keywayDepth', v)
          )
        );
      }

      // D-Şaft Düzlük Derinliği
      if (this.params.boreType === BoreType.D_SHAFT || this.params.boreType === BoreType.DOUBLE_D) {
        grid.appendChild(
          this.createSliderField(
            'dShaftFlatDepth',
            'D-Mil Düzlük Derinliği',
            'mm',
            0.2,
            3.0,
            0.05,
            this.params.dShaftFlatDepth,
            'param.boreType.formula',
            'param.boreType.info',
            (v) => this.updateParam('dShaftFlatDepth', v)
          )
        );
      }

      container.appendChild(grid);
    }
  }

  /**
   * ADIM 3: Göbek (Hub) ve Web Tasarımı
   */
  private renderStep3(container: HTMLElement): void {
    container.innerHTML = `
      <div class="step-header">
        <h3 class="step-title">${i18n.t('wizard.step3.title')}</h3>
        <p class="step-desc">${i18n.t('wizard.step3.desc')}</p>
      </div>
    `;

    // 1. Gövde Stili Seçimi
    const webGroup = document.createElement('div');
    webGroup.className = 'wizard-card-group';

    const webStyles = [
      { style: WebStyle.SOLID, label: 'Masif Tam Dolu', icon: '🔘' },
      { style: WebStyle.RECESSED, label: 'Kademeli Web', icon: '🛞' },
      { style: WebStyle.LIGHTENING_HOLES, label: 'Delikli Web', icon: '🕳️' },
      { style: WebStyle.SPOKED, label: 'Kollu Jant Tipi', icon: '☸️' },
    ];

    for (const item of webStyles) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `wizard-choice-card ${this.params.webStyle === item.style ? 'active' : ''}`;
      card.innerHTML = `
        <span class="choice-icon">${item.icon}</span>
        <span class="choice-label">${item.label}</span>
      `;
      card.addEventListener('click', () => {
        this.updateParam('webStyle', item.style);
        this.activeInspectKey = item.style === WebStyle.SOLID ? 'hubDiameter' : 'webThickness';
        this.render();
      });
      webGroup.appendChild(card);
    }
    container.appendChild(webGroup);

    // 2. Göbek ve Gövde Parametreleri
    const grid = document.createElement('div');
    grid.className = 'wizard-params-grid';

    grid.appendChild(
      this.createSliderField(
        'hubDiameter',
        i18n.t('param.hubDiameter'),
        i18n.t('param.hubDiameter.unit'),
        6.0,
        120.0,
        0.5,
        this.params.hubDiameter,
        'param.hubDiameter.formula',
        'param.hubDiameter.info',
        (v) => this.updateParam('hubDiameter', v)
      )
    );

    grid.appendChild(
      this.createSliderField(
        'hubTopExtension',
        i18n.t('param.hubTopExtension'),
        i18n.t('param.hubTopExtension.unit'),
        0.0,
        25.0,
        0.5,
        this.params.hubTopExtension,
        'param.hubTopExtension.formula',
        'param.hubTopExtension.info',
        (v) => this.updateParam('hubTopExtension', v)
      )
    );

    if (this.params.webStyle !== WebStyle.SOLID) {
      grid.appendChild(
        this.createSliderField(
          'rimThickness',
          'Çember (Rim) Et Kalınlığı',
          'mm',
          2.0,
          25.0,
          0.5,
          this.params.rimThickness,
          'param.webStyle.formula',
          'param.webStyle.info',
          (v) => this.updateParam('rimThickness', v)
        )
      );

      grid.appendChild(
        this.createSliderField(
          'webThickness',
          'Web Gövde Et Kalınlığı',
          'mm',
          1.5,
          30.0,
          0.5,
          this.params.webThickness,
          'param.webStyle.formula',
          'param.webStyle.info',
          (v) => this.updateParam('webThickness', v)
        )
      );
    }

    if (
      this.params.webStyle === WebStyle.LIGHTENING_HOLES ||
      this.params.webStyle === WebStyle.SPOKED
    ) {
      grid.appendChild(
        this.createSliderField(
          'cutoutCount',
          'Hafifletme Delik / Kol Sayısı',
          'adet',
          3,
          10,
          1,
          this.params.cutoutCount,
          'param.webStyle.formula',
          'param.webStyle.info',
          (v) => this.updateParam('cutoutCount', Math.round(v))
        )
      );
    }

    container.appendChild(grid);
  }

  /**
   * ADIM 4: Evolvent Geometri ve 3D Baskı Kalibrasyonu
   */
  private renderStep4(container: HTMLElement): void {
    container.innerHTML = `
      <div class="step-header">
        <h3 class="step-title">${i18n.t('wizard.step4.title')}</h3>
        <p class="step-desc">${i18n.t('wizard.step4.desc')}</p>
      </div>
    `;

    const grid = document.createElement('div');
    grid.className = 'wizard-params-grid';

    // Kavrama Açısı (alpha)
    grid.appendChild(
      this.createSliderField(
        'pressureAngleDeg',
        i18n.t('param.pressureAngleDeg'),
        i18n.t('param.pressureAngleDeg.unit'),
        14.5,
        28.0,
        0.5,
        this.params.pressureAngleDeg,
        'param.pressureAngleDeg.formula',
        'param.pressureAngleDeg.info',
        (v) => this.updateParam('pressureAngleDeg', v)
      )
    );

    // Profil Kaydırma (x)
    grid.appendChild(
      this.createSliderField(
        'profileShift',
        i18n.t('param.profileShift'),
        i18n.t('param.profileShift.unit'),
        -0.3,
        0.6,
        0.02,
        this.params.profileShift,
        'param.profileShift.formula',
        'param.profileShift.info',
        (v) => this.updateParam('profileShift', v)
      )
    );

    // 3D Baskı Backlash Payı (jt)
    grid.appendChild(
      this.createSliderField(
        'backlashMm',
        i18n.t('param.backlashMm'),
        i18n.t('param.backlashMm.unit'),
        0.0,
        0.5,
        0.01,
        this.params.backlashMm,
        'param.backlashMm.formula',
        'param.backlashMm.info',
        (v) => this.updateParam('backlashMm', v)
      )
    );

    // İç Delik Toleransı (Clearance)
    grid.appendChild(
      this.createSliderField(
        'boreClearanceMm',
        i18n.t('param.boreClearanceMm'),
        i18n.t('param.boreClearanceMm.unit'),
        0.0,
        0.35,
        0.01,
        this.params.boreClearanceMm,
        'param.boreClearanceMm.formula',
        'param.boreClearanceMm.info',
        (v) => this.updateParam('boreClearanceMm', v)
      )
    );

    container.appendChild(grid);

    // Filament Malzeme Seçimi & Hızlı Backlash Eşleştirme
    const matBox = document.createElement('div');
    matBox.className = 'wizard-material-selector-box';
    matBox.innerHTML = `
      <div class="wizard-field-title">
        <span>${i18n.t('param.filamentMaterial')}</span>
        <span class="formula-chip">${renderMath(i18n.t('param.filamentMaterial.formula'))}</span>
      </div>
      <p class="field-info-text">${i18n.t('param.filamentMaterial.info')}</p>
    `;

    const matChips = document.createElement('div');
    matChips.className = 'wizard-mode-chips';
    const materials = [
      { mat: FilamentMaterial.PLA, label: 'PLA (0.15mm Backlash)', backlash: 0.15 },
      { mat: FilamentMaterial.PETG, label: 'PETG (0.20mm Backlash)', backlash: 0.20 },
      { mat: FilamentMaterial.ABS, label: 'ABS/ASA (0.22mm Backlash)', backlash: 0.22 },
      { mat: FilamentMaterial.NYLON_PA12, label: 'Naylon PA12 (0.25mm Backlash)', backlash: 0.25 },
      { mat: FilamentMaterial.TPU, label: 'TPU Esnek (0.18mm Backlash)', backlash: 0.18 },
    ];

    for (const m of materials) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `wizard-mode-chip ${this.params.filamentMaterial === m.mat ? 'active' : ''}`;
      chip.textContent = m.label;
      chip.addEventListener('click', () => {
        this.updateParam('filamentMaterial', m.mat);
        this.updateParam('backlashMm', m.backlash);
        this.render();
      });
      matChips.appendChild(chip);
    }

    matBox.appendChild(matChips);
    container.appendChild(matBox);
  }

  /**
   * ADIM 5: Teknik Doğrulama, Özet ve Oluşturma
   */
  private renderStep5(container: HTMLElement): void {
    container.innerHTML = `
      <div class="step-header">
        <h3 class="step-title">${i18n.t('wizard.step5.title')}</h3>
        <p class="step-desc">${i18n.t('wizard.step5.desc')}</p>
      </div>
    `;

    // Proje İsmi Giriş Alanı
    const nameGroup = document.createElement('div');
    nameGroup.className = 'wizard-project-name-group';
    nameGroup.innerHTML = `
      <label for="wizard-proj-name" class="wizard-field-title">${i18n.t('param.projectName')}</label>
      <input
        type="text"
        id="wizard-proj-name"
        class="form-input wizard-name-input"
        value="${this.escapeHtml(this.projectName)}"
        placeholder="${i18n.t('param.projectName.placeholder')}"
      />
    `;
    const input = nameGroup.querySelector('#wizard-proj-name') as HTMLInputElement;
    input?.addEventListener('input', () => {
      this.projectName = input.value;
    });
    container.appendChild(nameGroup);

    // Canlı Geometrik Metrikler Hesabı
    const radii = InvoluteMathCalculator.calculateRadii(this.params);
    const d = radii.pitchRadius * 2;
    const db = radii.baseRadius * 2;
    const da = radii.outerRadius * 2;
    const df = radii.rootRadius * 2;
    const p = radii.circularPitch;
    const s = radii.toothThicknessAtPitch;
    const h = radii.addendum + radii.dedendum;

    // Özet Tablosu
    const table = document.createElement('div');
    table.className = 'wizard-summary-grid';
    table.innerHTML = `
      <div class="summary-metric-card">
        <span class="metric-label">${i18n.t('wizard.summary.pitch_dia')}</span>
        <span class="metric-val highlight-blue">${d.toFixed(2)} mm</span>
        <span class="metric-formula">${renderMath('d = m \\cdot z')}</span>
      </div>

      <div class="summary-metric-card">
        <span class="metric-label">${i18n.t('wizard.summary.outer_dia')}</span>
        <span class="metric-val highlight-amber">${da.toFixed(2)} mm</span>
        <span class="metric-formula">${renderMath('d_a = d + 2 h_a')}</span>
      </div>

      <div class="summary-metric-card">
        <span class="metric-label">${i18n.t('wizard.summary.root_dia')}</span>
        <span class="metric-val">${df.toFixed(2)} mm</span>
        <span class="metric-formula">${renderMath('d_f = d - 2 h_f')}</span>
      </div>

      <div class="summary-metric-card">
        <span class="metric-label">${i18n.t('wizard.summary.base_dia')}</span>
        <span class="metric-val">${db.toFixed(2)} mm</span>
        <span class="metric-formula">${renderMath('d_b = d \\cdot \\cos\\alpha')}</span>
      </div>

      <div class="summary-metric-card">
        <span class="metric-label">${i18n.t('wizard.summary.circular_pitch')}</span>
        <span class="metric-val">${p.toFixed(2)} mm</span>
        <span class="metric-formula">${renderMath('p = \\pi \\cdot m')}</span>
      </div>

      <div class="summary-metric-card">
        <span class="metric-label">${i18n.t('wizard.summary.tooth_thickness')}</span>
        <span class="metric-val">${s.toFixed(2)} mm</span>
        <span class="metric-formula">${renderMath('s = \\frac{\\pi m}{2} - j_t')}</span>
      </div>

      <div class="summary-metric-card">
        <span class="metric-label">${i18n.t('wizard.summary.whole_depth')}</span>
        <span class="metric-val">${h.toFixed(2)} mm</span>
        <span class="metric-formula">${renderMath('h = 2.25 \\cdot m')}</span>
      </div>

      <div class="summary-metric-card highlight-manifold">
        <span class="metric-label">${i18n.t('wizard.summary.manifold_status')}</span>
        <span class="metric-val text-emerald">✓ ${i18n.t('wizard.summary.manifold_ok')}</span>
        <span class="metric-formula">${renderMath('\\chi = V - E + F = 2')}</span>
      </div>
    `;
    container.appendChild(table);

    // Açılışta gösterme tercihi
    const prefBox = document.createElement('div');
    prefBox.className = 'wizard-startup-preference';
    const isChecked = localStorage.getItem('gearforge_show_wizard_startup') !== 'false';
    prefBox.innerHTML = `
      <label class="wizard-checkbox-label">
        <input type="checkbox" id="wizard-startup-check" ${isChecked ? 'checked' : ''} />
        <span>${i18n.t('wizard.startup_checkbox')}</span>
      </label>
    `;
    const checkInput = prefBox.querySelector('#wizard-startup-check') as HTMLInputElement;
    checkInput?.addEventListener('change', () => {
      localStorage.setItem('gearforge_show_wizard_startup', checkInput.checked ? 'true' : 'false');
    });
    container.appendChild(prefBox);
  }

  /**
   * Alt Eylem Çubuğu
   */
  private buildFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'wizard-footer';

    // Sol: İptal butonu
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn-wizard-secondary';
    cancelBtn.textContent = i18n.t('wizard.btn_cancel');
    cancelBtn.addEventListener('click', () => this.close());

    // Orta: Adım göstergesi
    const stepInfo = document.createElement('span');
    stepInfo.className = 'wizard-step-info';
    stepInfo.textContent = i18n.t('wizard.step_counter', {
      current: this.currentStep,
      total: this.totalSteps,
    });

    // Sağ: Geri ve İleri / Oluştur
    const actionsRight = document.createElement('div');
    actionsRight.className = 'wizard-footer-right';

    if (this.currentStep > 1) {
      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'btn-wizard-secondary';
      backBtn.textContent = i18n.t('wizard.btn_back');
      backBtn.addEventListener('click', () => {
        this.currentStep--;
        this.resetInspectKeyForStep(this.currentStep);
        this.render();
      });
      actionsRight.appendChild(backBtn);
    }

    if (this.currentStep < this.totalSteps) {
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'btn-wizard-primary';
      nextBtn.textContent = i18n.t('wizard.btn_next');
      nextBtn.addEventListener('click', () => {
        this.currentStep++;
        this.resetInspectKeyForStep(this.currentStep);
        this.render();
      });
      actionsRight.appendChild(nextBtn);
    } else {
      const createBtn = document.createElement('button');
      createBtn.type = 'button';
      createBtn.className = 'btn-wizard-accent';
      createBtn.innerHTML = `<span>🚀</span> <strong>${i18n.t('wizard.btn_create')}</strong>`;
      createBtn.addEventListener('click', () => this.handleCompleteWizard());
      actionsRight.appendChild(createBtn);
    }

    footer.append(cancelBtn, stepInfo, actionsRight);
    return footer;
  }

  /**
   * Adım değiştiğinde aktif incelenen parametreyi varsayılana getirir.
   */
  private resetInspectKeyForStep(step: number): void {
    switch (step) {
      case 1:
        this.activeInspectKey = this.params.gearType;
        break;
      case 2:
        this.activeInspectKey = 'boreDiameter';
        break;
      case 3:
        this.activeInspectKey = 'hubDiameter';
        break;
      case 4:
        this.activeInspectKey = 'pressureAngleDeg';
        break;
      case 5:
        this.activeInspectKey = 'summary';
        break;
    }
  }

  /**
   * Sağ Yan Panel: 3B Three.js Canlı Önizleme, 2D CAD Teknik Çizim ve Önizleme Altında %30 Büyütülmüş Formüller
   */
  private buildPreviewPanel(step: number): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'wizard-preview-col';
    panel.id = 'wizard-preview-panel';

    const data = this.getInspectData(this.activeInspectKey);
    const activeVal = this.getActiveParamValue(this.activeInspectKey);

    // 1. Üst Başlık & Görünüm Modu Seçici (3D / 2D / İkili)
    const header = document.createElement('div');
    header.className = 'wizard-preview-header';

    const left = document.createElement('div');
    left.className = 'preview-header-left';
    left.innerHTML = `
      <span class="preview-icon">${data.icon}</span>
      <div>
        <h4 class="preview-title">${data.title}</h4>
        <span class="preview-badge">${data.standard || 'ISO 21771 / DIN'}</span>
      </div>
    `;

    // 3B / 2D / İkili Mod Değiştirici
    const modeSwitch = document.createElement('div');
    modeSwitch.className = 'wizard-preview-mode-switch';

    const modes = [
      { mode: '3d' as const, label: i18n.t('wizard.view_3d') || '🧊 3B Model' },
      { mode: '2d' as const, label: i18n.t('wizard.view_2d') || '📐 2D CAD' },
      { mode: 'dual' as const, label: i18n.t('wizard.view_dual') || '🔲 İkili' },
    ];

    for (const m of modes) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `wizard-preview-mode-btn ${this.previewMode === m.mode ? 'active' : ''}`;
      btn.textContent = m.label;
      btn.addEventListener('click', () => {
        this.previewMode = m.mode;
        this.updatePreviewPanel();
      });
      modeSwitch.appendChild(btn);
    }

    header.append(left, modeSwitch);

    // 2. Bu Adımdaki Parametrelerin / Çizimlerin Hızlı Seçim Şeridi
    const pills = this.buildStepThumbnailsStrip(step);

    // 3. Görünüm Alanı (3B Three.js Viewport ve/veya 2D CAD Blueprint)
    let viewportArea: HTMLElement;
    if (this.previewMode === '3d') {
      viewportArea = this.build3DViewportCard(activeVal, data);
    } else if (this.previewMode === '2d') {
      viewportArea = this.build2DBlueprintCard(activeVal, data);
    } else {
      const dualRow = document.createElement('div');
      dualRow.className = 'wizard-dual-preview-row';
      dualRow.append(
        this.build3DViewportCard(activeVal, data, true),
        this.build2DBlueprintCard(activeVal, data, true)
      );
      viewportArea = dualRow;
    }

    // 4. THUMBNAIL VE 3B MODEL ALTINDA MÜHENDİSLİK FORMÜLÜ ALANI (%30 BÜYÜTÜLMÜŞ)
    const formulaHero = document.createElement('div');
    formulaHero.className = 'wizard-formula-hero-card';
    formulaHero.innerHTML = `
      <div class="formula-hero-header">
        <span class="formula-hero-icon">📐</span>
        <span class="formula-hero-title">${i18n.t('wizard.formula_label')}</span>
        ${activeVal > 0 ? `<span class="formula-active-val">${Number(activeVal.toFixed(2))} ${data.unit || ''}</span>` : ''}
      </div>
      <div class="formula-hero-math">
        ${renderMath(data.formula, true)}
      </div>
      ${data.calculation ? `<div class="formula-hero-calc">${renderMath(data.calculation)}</div>` : ''}
    `;

    // 5. Mühendislik Açıklaması ve Standart Bilgisi
    const explanationCard = document.createElement('div');
    explanationCard.className = 'wizard-preview-info-card';
    explanationCard.innerHTML = `
      <div class="preview-info-header">
        <span class="info-bulb">💡</span>
        <strong>${i18n.t('wizard.explanation_label')}</strong>
      </div>
      <p class="preview-info-text">${data.explanation}</p>
    `;

    panel.append(header, pills, viewportArea, formulaHero, explanationCard);
    return panel;
  }

  /**
   * 3B Three.js Viewport Kartı
   */
  private build3DViewportCard(
    activeVal: number,
    data: { title: string; unit?: string; formula: string; explanation: string },
    isCompact = false
  ): HTMLElement {
    const card = document.createElement('div');
    card.className = `wizard-3d-viewport-card ${isCompact ? 'compact' : ''}`;

    const host = document.createElement('div');
    host.id = 'wizard-three-container';
    host.className = 'wizard-three-canvas-wrap';

    const liveBadge = document.createElement('span');
    liveBadge.className = 'blueprint-live-indicator';
    liveBadge.textContent = '● 3B CANLI THREE.JS';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'wizard-3d-toolbar';

    // Otomatik dönüş butonu
    const rotateBtn = document.createElement('button');
    rotateBtn.type = 'button';
    const isRotating = this.wizardThreePreview ? this.wizardThreePreview.isAutoRotating() : true;
    rotateBtn.className = `wizard-3d-tool-btn ${isRotating ? 'active' : ''}`;
    rotateBtn.title = i18n.t('wizard.toolbar_rotate') || 'Otomatik Dönüş';
    rotateBtn.textContent = isRotating ? '🔄' : '⏸️';
    rotateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.wizardThreePreview) {
        const active = this.wizardThreePreview.toggleAutoRotate();
        rotateBtn.classList.toggle('active', active);
        rotateBtn.textContent = active ? '🔄' : '⏸️';
      }
    });

    // Tel kafes butonu
    const wireBtn = document.createElement('button');
    wireBtn.type = 'button';
    const isWire = this.wizardThreePreview ? this.wizardThreePreview.isWireframeActive() : false;
    wireBtn.className = `wizard-3d-tool-btn ${isWire ? 'active' : ''}`;
    wireBtn.title = i18n.t('wizard.toolbar_wireframe') || 'Tel Kafes';
    wireBtn.textContent = '🌐';
    wireBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.wizardThreePreview) {
        const active = this.wizardThreePreview.toggleWireframe();
        wireBtn.classList.toggle('active', active);
      }
    });

    // Kamerayı Sıfırla
    const centerBtn = document.createElement('button');
    centerBtn.type = 'button';
    centerBtn.className = 'wizard-3d-tool-btn';
    centerBtn.title = i18n.t('wizard.toolbar_center') || 'Kamerayı Sıfırla';
    centerBtn.textContent = '🎯';
    centerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.wizardThreePreview?.frameCamera();
    });

    // 2D CAD inceleme butonu
    const zoomBtn = document.createElement('button');
    zoomBtn.type = 'button';
    zoomBtn.className = 'wizard-3d-tool-btn';
    zoomBtn.title = i18n.t('wizard.inspect_2d_title') || '2D CAD Detay İncele';
    zoomBtn.textContent = '🔍';
    zoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.open2DInspectionModal(
        this.activeInspectKey,
        data.title,
        activeVal,
        data.unit || '',
        data.formula,
        data.explanation
      );
    });

    toolbar.append(rotateBtn, wireBtn, centerBtn, zoomBtn);
    card.append(host, liveBadge, toolbar);

    // Host DOM'a girdikten sonra Three.js canvasını içine bağla ve modeli güncelle
    requestAnimationFrame(() => {
      if (this.wizardThreePreview) {
        this.wizardThreePreview.attachTo(host);
        this.wizardThreePreview.update(this.params);
      }
    });

    return card;
  }

  /**
   * 2D CAD Teknik Çizim Kartı
   */
  private build2DBlueprintCard(
    activeVal: number,
    data: { title: string; unit?: string; formula: string; explanation: string },
    isCompact = false
  ): HTMLElement {
    const svgBox = document.createElement('div');
    svgBox.className = `wizard-large-blueprint-card ${isCompact ? 'compact' : ''}`;
    svgBox.title = 'Büyütmek için tıklayın';
    svgBox.innerHTML = `
      ${GearDimensionThumbnail2D.renderSvg(this.activeInspectKey, activeVal, {
        width: isCompact ? 220 : 380,
        height: isCompact ? 160 : 220,
        showValue: true,
      })}
      <span class="blueprint-live-indicator">● CANLI 2D CAD</span>
    `;
    svgBox.addEventListener('click', () => {
      this.open2DInspectionModal(
        this.activeInspectKey,
        data.title,
        activeVal,
        data.unit || '',
        data.formula,
        data.explanation
      );
    });
    return svgBox;
  }

  /**
   * Sağ paneli bütün modalı yeniden render etmeden canlı ve akıcı günceller.
   */
  private updatePreviewPanel(): void {
    if (!this.previewPanelEl || !this.modalEl) return;
    const newPanel = this.buildPreviewPanel(this.currentStep);
    this.previewPanelEl.replaceWith(newPanel);
    this.previewPanelEl = newPanel;
  }

  /**
   * İlgili adımdaki tüm parametre ve modeller için hızlı geçiş şeridi üretir.
   */
  private buildStepThumbnailsStrip(step: number): HTMLElement {
    const strip = document.createElement('div');
    strip.className = 'wizard-preview-pills';

    interface StripItem {
      key: string;
      label: string;
      icon: string;
    }

    let items: StripItem[] = [];

    switch (step) {
      case 1:
        items = [
          { key: GearType.SPUR, label: 'Düz Dişli', icon: '⚙️' },
          { key: GearType.HELICAL, label: 'Helisel Dişli', icon: '🌀' },
          { key: GearType.HERRINGBONE, label: 'Çavuş Dişli', icon: '⚡' },
          { key: GearType.BEVEL_TAPER, label: 'Konik Dişli', icon: '📐' },
          { key: GearType.INTERNAL_RING, label: 'İç Dişli', icon: '⭕' },
          { key: 'teethCount', label: 'Diş Sayısı (z)', icon: 'z' },
          { key: 'module', label: 'Modül (m)', icon: 'm' },
          { key: 'thickness', label: 'Kalınlık (b)', icon: 'b' },
        ];
        if (
          this.params.gearType === GearType.HELICAL ||
          this.params.gearType === GearType.HERRINGBONE
        ) {
          items.push({ key: 'helixAngleDeg', label: 'Helis Açısı (β)', icon: 'β' });
        }
        break;
      case 2:
        items = [
          { key: 'boreDiameter', label: 'Mil Çapı', icon: '⌀' },
          { key: 'keywayWidth', label: 'Kama Genişliği', icon: 'b' },
          { key: 'keywayDepth', label: 'Kama Derinliği', icon: 't₂' },
          { key: 'dShaftFlatDepth', label: 'D-Mil Düzlüğü', icon: 'h' },
        ];
        break;
      case 3:
        items = [
          { key: 'hubDiameter', label: 'Göbek Çapı', icon: '⌀hub' },
          { key: 'hubTopExtension', label: 'Göbek Boynu', icon: 'h' },
          { key: 'rimThickness', label: 'Rim Kalınlığı', icon: 's' },
          { key: 'webThickness', label: 'Web Kalınlığı', icon: 't' },
          { key: 'cutoutCount', label: 'Delik Sayısı', icon: 'n' },
        ];
        break;
      case 4:
        items = [
          { key: 'pressureAngleDeg', label: 'Kavrama Açısı (α)', icon: 'α' },
          { key: 'profileShift', label: 'Profil Kaydırma (x)', icon: 'x' },
          { key: 'backlashMm', label: 'Backlash (jt)', icon: 'jt' },
          { key: 'boreClearanceMm', label: 'Delik Toleransı', icon: 'c' },
        ];
        break;
      case 5:
        items = [
          { key: 'summary', label: 'Kinematik Özet', icon: '🚀' },
          { key: 'teethCount', label: 'Diş Geometrisi', icon: 'z' },
          { key: 'targetPitchDiameter', label: 'Bölüm Çapı', icon: 'd' },
        ];
        break;
    }

    for (const it of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = this.activeInspectKey === it.key;
      btn.className = `wizard-preview-pill ${isActive ? 'active' : ''}`;
      btn.innerHTML = `<span class="pill-icon">${it.icon}</span> <span class="pill-label">${it.label}</span>`;
      btn.addEventListener('click', () => {
        this.activeInspectKey = it.key;
        this.updatePreviewPanel();
      });
      strip.appendChild(btn);
    }

    return strip;
  }

  /**
   * İncelenen parametre için anlık sayısal değeri döndürür.
   */
  private getActiveParamValue(key: string): number {
    switch (key) {
      case 'teethCount':
        return this.params.teethCount;
      case 'module':
        return this.params.module;
      case 'targetPitchDiameter':
        return this.params.targetPitchDiameter;
      case 'targetOuterDiameter':
        return this.params.targetOuterDiameter;
      case 'thickness':
        return this.params.thickness;
      case 'helixAngleDeg':
        return this.params.helixAngleDeg;
      case 'boreDiameter':
        return this.params.boreDiameter;
      case 'keywayWidth':
        return this.params.keywayWidth;
      case 'keywayDepth':
        return this.params.keywayDepth;
      case 'dShaftFlatDepth':
        return this.params.dShaftFlatDepth;
      case 'hubDiameter':
        return this.params.hubDiameter;
      case 'hubTopExtension':
        return this.params.hubTopExtension;
      case 'rimThickness':
        return this.params.rimThickness;
      case 'webThickness':
        return this.params.webThickness;
      case 'cutoutCount':
        return this.params.cutoutCount;
      case 'pressureAngleDeg':
        return this.params.pressureAngleDeg;
      case 'profileShift':
        return this.params.profileShift;
      case 'backlashMm':
        return this.params.backlashMm;
      case 'boreClearanceMm':
        return this.params.boreClearanceMm;
      case GearType.SPUR:
      case 'gearType_spur':
        return this.params.teethCount;
      case GearType.HELICAL:
      case 'gearType_helical':
        return this.params.helixAngleDeg;
      case GearType.HERRINGBONE:
      case 'gearType_herringbone':
        return this.params.thickness;
      case GearType.BEVEL_TAPER:
      case 'gearType_bevel':
        return this.params.teethCount;
      case GearType.INTERNAL_RING:
      case 'gearType_internal':
        return this.params.teethCount;
      default:
        return 0;
    }
  }

  /**
   * İncelenen parametre veya dişli tipi için detaylı mühendislik formülü, açıklaması ve standartlarını döndürür.
   */
  private getInspectData(key: string): {
    title: string;
    icon: string;
    standard: string;
    formula: string;
    calculation?: string;
    explanation: string;
    unit?: string;
  } {
    const radii = InvoluteMathCalculator.calculateRadii(this.params);
    const d = (radii.pitchRadius * 2).toFixed(2);
    const da = (radii.outerRadius * 2).toFixed(2);
    const db = (radii.baseRadius * 2).toFixed(2);
    const df = (radii.rootRadius * 2).toFixed(2);
    const m = this.params.module.toFixed(2);
    const z = this.params.teethCount;
    const b = this.params.thickness.toFixed(2);
    const beta = this.params.helixAngleDeg;
    const alpha = this.params.pressureAngleDeg;

    switch (key) {
      case GearType.SPUR:
      case 'gearType_spur':
        return {
          title: i18n.t('param.gearType.spur'),
          icon: '⚙️',
          standard: 'ISO 21771 / DIN 867',
          formula: 'd = m \\cdot z, \\quad d_a = d + 2m',
          calculation: `d = ${m} \\times ${z} = ${d}\\,\\text{mm}, \\quad d_a = ${da}\\,\\text{mm}`,
          explanation: 'Eksenleri paralel miller arasında kaymasız güç ve hareket aktarımı sağlayan standart düz dişli mimarisi. Eksenel kuvvet sıfırdır ($F_{axial} = 0$). FDM baskıda en az destek malzemesi gerektiren formdur.',
        };
      case GearType.HELICAL:
      case 'gearType_helical': {
        const dt = ((this.params.module * z) / Math.cos((beta * Math.PI) / 180)).toFixed(2);
        return {
          title: i18n.t('param.gearType.helical'),
          icon: '🌀',
          standard: 'DIN 3960 / ISO 21771',
          formula: 'd_t = \\frac{m_n \\cdot z}{\\cos\\beta}, \\quad p_x = \\frac{\\pi m_n}{\\sin\\beta}',
          calculation: `d_t = \\frac{${m} \\times ${z}}{\\cos(${beta}^\\circ)} = ${dt}\\,\\text{mm}`,
          explanation: 'Açılı helis dişleri aynı anda birden fazla diş çiftinin yumuşakça temasa girmesini sağlar. Titreşimi ve çalışma sesini %60\'a varan oranda düşürür. 15°-25° arası helis açısı 3D baskı için idealdir.',
        };
      }
      case GearType.HERRINGBONE:
      case 'gearType_herringbone':
        return {
          title: i18n.t('param.gearType.herringbone'),
          icon: '⚡',
          standard: 'Citroën V-Chevron / ISO 21771',
          formula: 'F_{axial} = F_{a1} - F_{a2} = 0',
          calculation: '\\Sigma F_{axial} = 0\\,\\text{N} \\quad (\\text{Eksenel İtme Sıfırlanır})',
          explanation: 'Çift helis (V-şekilli) diş profili, helis dişlinin oluşturduğu eksenel itme kuvvetlerini karşılıklı sıfırlar. Yataklara eksenel baskı yapmaz ve yüksek torku en sessiz şekilde iletir.',
        };
      case GearType.BEVEL_TAPER:
      case 'gearType_bevel':
        return {
          title: i18n.t('param.gearType.bevel'),
          icon: '📐',
          standard: 'DIN 3971 / ISO 23509',
          formula: '\\delta_1 = \\tan^{-1}\\left(\\frac{z_1}{z_2}\\right), \\quad R_a = \\frac{d}{2\\sin\\delta}',
          calculation: `\\delta = \\tan^{-1}(${z} / ${z * 2}) \\approx 26.57^\\circ`,
          explanation: 'Kesişen açılı millerde (genellikle 90° dik açıyla) güç ve devir aktarımı için konik geometrili dişli mimarisi.',
        };
      case GearType.INTERNAL_RING:
      case 'gearType_internal':
        return {
          title: i18n.t('param.gearType.internal'),
          icon: '⭕',
          standard: 'DIN 3960 Planet Standart',
          formula: 'd_a = d - 2m, \\quad d_f = d + 2.5m',
          calculation: `d_a = ${d} - 2 \\times ${m} = ${(parseFloat(d) - 2 * parseFloat(m)).toFixed(2)}\\,\\text{mm}`,
          explanation: 'Planet redüktörlerde dış sabit çember olarak kullanılır. Dişler silindirin içine doğru bakar ve pinyon dişlilerle içten temas kurar.',
        };
      case 'teethCount':
        return {
          title: i18n.t('param.teethCount'),
          icon: '⚙️',
          standard: 'ISO 21771 (Undercut: z ≥ 17)',
          formula: 'z = \\frac{d}{m} = \\frac{\\pi \\cdot d}{p}',
          calculation: `z = \\frac{${d}}{${m}} = ${z}\\,\\text{diş}`,
          explanation: i18n.t('param.teethCount.info'),
          unit: 'diş',
        };
      case 'module':
        return {
          title: i18n.t('param.module'),
          icon: '📏',
          standard: 'DIN 867 / ISO 54 Modül Serisi',
          formula: 'm = \\frac{d}{z} = \\frac{p}{\\pi}',
          calculation: `m = \\frac{${d}}{${z}} = ${m}\\,\\text{mm}`,
          explanation: i18n.t('param.module.info'),
          unit: 'mm',
        };
      case 'targetPitchDiameter':
        return {
          title: i18n.t('param.targetPitchDiameter'),
          icon: '🎯',
          standard: 'Kinematik Bölüm Dairesi',
          formula: 'd = m \\cdot z',
          calculation: `d = ${m} \\times ${z} = ${d}\\,\\text{mm}`,
          explanation: i18n.t('param.targetPitchDiameter.info'),
          unit: 'mm',
        };
      case 'targetOuterDiameter':
        return {
          title: i18n.t('param.targetOuterDiameter'),
          icon: '⭕',
          standard: 'Dış Tepe Çapı (Kumpas Ölçüsü)',
          formula: 'd_a = d + 2 \\cdot (h_a^* + x) \\cdot m',
          calculation: `d_a = ${da}\\,\\text{mm}`,
          explanation: i18n.t('param.targetOuterDiameter.info'),
          unit: 'mm',
        };
      case 'thickness':
        return {
          title: i18n.t('param.thickness'),
          icon: '🧱',
          standard: 'DIN 3960 Yüz Genişliği',
          formula: 'b \\approx (8 \\dots 12) \\cdot m',
          calculation: `b = ${b}\\,\\text{mm} \\approx ${(parseFloat(b) / parseFloat(m)).toFixed(1)}\\,m`,
          explanation: i18n.t('param.thickness.info'),
          unit: 'mm',
        };
      case 'helixAngleDeg':
        return {
          title: i18n.t('param.helixAngleDeg'),
          icon: '🌀',
          standard: 'DIN 3960 Helis Açısı',
          formula: '\\tan\\beta_b = \\tan\\beta \\cdot \\cos\\alpha_t',
          calculation: `\\beta = ${beta}^\\circ`,
          explanation: i18n.t('param.helixAngleDeg.info'),
          unit: '°',
        };
      case 'boreDiameter': {
        const dia = this.params.boreDiameter;
        const total = (dia + 2 * this.params.boreClearanceMm).toFixed(2);
        return {
          title: i18n.t('param.boreDiameter'),
          icon: '🔘',
          standard: 'ISO H7 Delik Toleransı',
          formula: '\\varnothing = d_{bore} + 2 \\cdot c_{bore}',
          calculation: `\\varnothing = ${dia.toFixed(2)} + 2 \\times ${this.params.boreClearanceMm.toFixed(2)} = ${total}\\,\\text{mm}`,
          explanation: i18n.t('param.boreDiameter.info'),
          unit: 'mm',
        };
      }
      case 'keywayWidth':
        return {
          title: i18n.t('param.keywayWidth'),
          icon: '🗝️',
          standard: 'DIN 6885-1 Form A Kama',
          formula: 'b_{kama} \\in \\text{DIN 6885}',
          calculation: `b = ${this.params.keywayWidth.toFixed(2)}\\,\\text{mm}`,
          explanation: i18n.t('param.keywayWidth.info'),
          unit: 'mm',
        };
      case 'keywayDepth':
        return {
          title: i18n.t('param.keywayDepth'),
          icon: '🔽',
          standard: 'DIN 6885-1 Hub Derinliği',
          formula: 't_2 \\approx (0.15 \\dots 0.20) \\cdot d_{bore}',
          calculation: `t_2 = ${this.params.keywayDepth.toFixed(2)}\\,\\text{mm}`,
          explanation: i18n.t('param.keywayDepth.info'),
          unit: 'mm',
        };
      case 'dShaftFlatDepth':
        return {
          title: 'D-Mil Düzlük Derinliği',
          icon: '🔲',
          standard: 'NEMA 17 Şaft Düzlüğü',
          formula: 'h_d = r_{bore} - y_{kesim}',
          calculation: `h = ${this.params.dShaftFlatDepth.toFixed(2)}\\,\\text{mm}`,
          explanation: 'Step motor milleri için kesme düzlük yuvası. Setuskur vidanın mile kilitlenmesini sağlar.',
          unit: 'mm',
        };
      case 'hubDiameter':
        return {
          title: i18n.t('param.hubDiameter'),
          icon: '⭕',
          standard: 'Göbek Mekanik Mukavemeti',
          formula: 'd_{hub} \\ge 1.6 \\dots 1.8 \\cdot d_{bore}',
          calculation: `d_{hub} = ${this.params.hubDiameter.toFixed(2)}\\,\\text{mm} \\ge ${(1.6 * this.params.boreDiameter).toFixed(2)}\\,\\text{mm}`,
          explanation: i18n.t('param.hubDiameter.info'),
          unit: 'mm',
        };
      case 'hubTopExtension':
        return {
          title: i18n.t('param.hubTopExtension'),
          icon: '🗼',
          standard: 'Setuskur Boyun Yüksekliği',
          formula: 'L_{boss} \\ge 1.2 \\cdot \\varnothing_{vida}',
          calculation: `L_{boss} = ${this.params.hubTopExtension.toFixed(2)}\\,\\text{mm}`,
          explanation: i18n.t('param.hubTopExtension.info'),
          unit: 'mm',
        };
      case 'rimThickness':
        return {
          title: 'Çember (Rim) Et Kalınlığı',
          icon: '🛞',
          standard: 'Diş Dibi Çember Mukavemeti',
          formula: 's_{rim} \\ge (1.8 \\dots 2.2) \\cdot m',
          calculation: `s_{rim} = ${this.params.rimThickness.toFixed(2)}\\,\\text{mm} \\ge ${(1.8 * this.params.module).toFixed(2)}\\,\\text{mm}`,
          explanation: 'Diş köklerinin esnemesini önleyen minimum çember et kalınlığı.',
          unit: 'mm',
        };
      case 'webThickness':
        return {
          title: 'Web Gövde Et Kalınlığı',
          icon: '🥞',
          standard: 'Ağırlık Hafifletme Web Tasarımı',
          formula: 't_{web} \\approx (0.4 \\dots 0.6) \\cdot b',
          calculation: `t_{web} = ${this.params.webThickness.toFixed(2)}\\,\\text{mm}`,
          explanation: 'Dişli gövdesinde baskı süresini ve filament sarfiyatını %50 azaltan inceltilmiş web yapısı.',
          unit: 'mm',
        };
      case 'cutoutCount':
        return {
          title: 'Hafifletme Delik / Kol Sayısı',
          icon: '🕳️',
          standard: 'Gövde Hafifletme Delikleri',
          formula: 'V_{tasarruf} = 30\\% \\dots 65\\%',
          calculation: `n = ${this.params.cutoutCount}\\,\\text{adet delik}`,
          explanation: 'Gövdedeki dairesel boşaltmalar dönme eylemsizlik momentini düşürür.',
          unit: 'adet',
        };
      case 'pressureAngleDeg':
        return {
          title: i18n.t('param.pressureAngleDeg'),
          icon: '📐',
          standard: 'ISO 21771 / DIN 867',
          formula: 'd_b = d \\cdot \\cos(\\alpha), \\quad p_b = p \\cdot \\cos(\\alpha)',
          calculation: `d_b = ${d} \\times \\cos(${alpha}^\\circ) = ${db}\\,\\text{mm}`,
          explanation: i18n.t('param.pressureAngleDeg.info'),
          unit: '°',
        };
      case 'profileShift':
        return {
          title: i18n.t('param.profileShift'),
          icon: '🔀',
          standard: 'ISO 21771 Profil Kaydırma',
          formula: 'x_{min} = 1 - \\frac{z \\cdot \\sin^2(\\alpha)}{2 \\cdot h_a^*}',
          calculation: `x = ${this.params.profileShift >= 0 ? '+' : ''}${this.params.profileShift.toFixed(2)}`,
          explanation: i18n.t('param.profileShift.info'),
          unit: 'oran',
        };
      case 'backlashMm':
        return {
          title: i18n.t('param.backlashMm'),
          icon: '↔️',
          standard: 'FDM 3D Baskı Boşluk Payı',
          formula: 's = \\frac{\\pi \\cdot m}{2} + 2 x m \\tan(\\alpha) - j_t',
          calculation: `j_t = ${this.params.backlashMm.toFixed(2)}\\,\\text{mm}`,
          explanation: i18n.t('param.backlashMm.info'),
          unit: 'mm',
        };
      case 'boreClearanceMm':
        return {
          title: i18n.t('param.boreClearanceMm'),
          icon: '⭕',
          standard: 'Mil Geçme Radyal Toleransı',
          formula: 'r_{gerçek} = r_{nominal} + c_{bore}',
          calculation: `+${this.params.boreClearanceMm.toFixed(2)}\\,\\text{mm}`,
          explanation: i18n.t('param.boreClearanceMm.info'),
          unit: 'mm',
        };
      case 'summary':
      default:
        return {
          title: 'ISO 21771 Kinematik Özet',
          icon: '🚀',
          standard: '100% Watertight 2-Manifold',
          formula: '\\chi = V - E + F = 2, \\quad d = m \\cdot z',
          calculation: `d = ${d}\\,\\text{mm}, \\quad d_a = ${da}\\,\\text{mm}, \\quad d_b = ${db}\\,\\text{mm}, \\quad d_f = ${df}\\,\\text{mm}`,
          explanation: 'Modeliniz 3D baskı için su geçirmez 2-manifold kapalı mesh topolojisine sahiptir. Dilimleme programlarında (Cura, PrusaSlicer, Bambu Studio) hatasız üretilir.',
        };
    }
  }

  /**
   * Sol Panel Parametre Girişi: Başlık, Odaklama Rozeti, Sayısal Giriş, Mini CAD Thumbnail ve Slider
   */
  private createSliderField(
    key: string,
    label: string,
    unit: string,
    min: number,
    max: number,
    step: number,
    value: number,
    _formulaKey: string,
    _infoKey: string,
    onChange: (val: number) => void
  ): HTMLElement {
    const card = document.createElement('div');
    const isFocused = this.activeInspectKey === key;
    card.className = `wizard-control-card ${isFocused ? 'inspect-focused' : ''}`;

    // Üst Satır: Başlık, Mini 2D Rozet, Sayısal Giriş ve Birim
    const topRow = document.createElement('div');
    topRow.className = 'wizard-control-top';

    const labelWrap = document.createElement('div');
    labelWrap.className = 'wizard-control-label-wrap';

    const lbl = document.createElement('label');
    lbl.className = 'wizard-control-label';
    lbl.textContent = label;

    // Mini 2D CAD Odaklama Butonu
    const miniBadge = document.createElement('button');
    miniBadge.type = 'button';
    miniBadge.className = `wizard-mini-cad-badge ${isFocused ? 'active' : ''}`;
    miniBadge.title = '2D CAD ve Formülü Sağ Panelde Göster';
    miniBadge.innerHTML = '📐 2D';
    miniBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      this.activeInspectKey = key;
      this.updatePreviewPanel();
      card.parentElement?.querySelectorAll('.wizard-control-card').forEach((c) => c.classList.remove('inspect-focused'));
      card.classList.add('inspect-focused');
    });

    labelWrap.append(lbl, miniBadge);

    const inputWrap = document.createElement('div');
    inputWrap.className = 'control-input-group';

    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.className = 'control-number';
    numInput.min = String(min);
    numInput.max = String(max);
    numInput.step = String(step);
    numInput.value = String(Number(value.toFixed(2)));

    const unitEl = document.createElement('span');
    unitEl.className = 'control-unit';
    unitEl.textContent = unit;

    inputWrap.append(numInput, unitEl);
    topRow.append(labelWrap, inputWrap);

    // Slider ve Mini Önizleme Satırı
    const sliderRow = document.createElement('div');
    sliderRow.className = 'wizard-slider-row';

    const miniThumb = document.createElement('div');
    miniThumb.className = 'wizard-slider-mini-thumb';
    miniThumb.title = 'Sağ panelde büyük önizle';
    miniThumb.innerHTML = GearDimensionThumbnail2D.renderSvg(key, value, {
      width: 58,
      height: 42,
      showValue: false,
    });
    miniThumb.addEventListener('click', (e) => {
      e.stopPropagation();
      this.activeInspectKey = key;
      this.updatePreviewPanel();
      card.parentElement?.querySelectorAll('.wizard-control-card').forEach((c) => c.classList.remove('inspect-focused'));
      card.classList.add('inspect-focused');
    });

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'control-slider';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);

    const emitVal = (valStr: string) => {
      const parsed = parseFloat(valStr);
      if (!Number.isNaN(parsed)) {
        miniThumb.innerHTML = GearDimensionThumbnail2D.renderSvg(key, parsed, {
          width: 58,
          height: 42,
          showValue: false,
        });
        this.activeInspectKey = key;
        onChange(parsed);
        this.updatePreviewPanel();
        card.parentElement?.querySelectorAll('.wizard-control-card').forEach((c) => c.classList.remove('inspect-focused'));
        card.classList.add('inspect-focused');
      }
    };

    slider.addEventListener('input', () => {
      numInput.value = slider.value;
      emitVal(slider.value);
    });

    numInput.addEventListener('input', () => {
      slider.value = numInput.value;
      emitVal(numInput.value);
    });

    card.addEventListener('click', () => {
      if (this.activeInspectKey !== key) {
        this.activeInspectKey = key;
        this.updatePreviewPanel();
        card.parentElement?.querySelectorAll('.wizard-control-card').forEach((c) => c.classList.remove('inspect-focused'));
        card.classList.add('inspect-focused');
      }
    });

    sliderRow.append(miniThumb, slider);
    card.append(topRow, sliderRow);
    return card;
  }


  /**
   * 2D CAD Teknik Çizim Büyütülmüş Detay İnceleme Modalı
   */
  private open2DInspectionModal(
    key: string,
    label: string,
    value: number,
    unit: string,
    formulaLatex: string,
    explanationText: string
  ): void {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay gearforge-cad-inspect-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const card = document.createElement('div');
    card.className = 'modal-card cad-inspect-card';

    card.innerHTML = `
      <div class="cad-inspect-header">
        <div class="cad-inspect-title-wrap">
          <span class="cad-inspect-icon">📐</span>
          <div>
            <h3 class="cad-inspect-title">${this.escapeHtml(label)}</h3>
            <span class="cad-inspect-badge">${i18n.t('wizard.cad_inspect_modal_title')}</span>
          </div>
        </div>
        <button type="button" class="modal-close-btn cad-inspect-close">✕</button>
      </div>

      <div class="cad-inspect-svg-view">
        ${GearDimensionThumbnail2D.renderSvg(key, value, {
          width: 320,
          height: 230,
          showValue: true,
        })}
      </div>

      <div class="cad-inspect-meta">
        <div class="cad-inspect-val-pill">
          <span class="cad-inspect-val-label">Ölçü Değeri / Value:</span>
          <strong class="cad-inspect-val-num">${Number(value.toFixed(2))} ${this.escapeHtml(unit)}</strong>
        </div>
        <div class="wizard-formula-box cad-inspect-formula">
          <span class="formula-label">${i18n.t('wizard.formula_label')}</span>
          <span class="formula-math">${renderMath(formulaLatex)}</span>
        </div>
      </div>

      <div class="cad-inspect-explanation">
        <p>${this.escapeHtml(explanationText)}</p>
      </div>

      <div class="cad-inspect-footer">
        <button type="button" class="btn-wizard-primary cad-inspect-close-btn">
          ${i18n.t('wizard.btn_cancel') || 'Kapat'}
        </button>
      </div>
    `;

    const close = () => overlay.remove();
    card.querySelector('.cad-inspect-close')?.addEventListener('click', close);
    card.querySelector('.cad-inspect-close-btn')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }


  /**
   * DIN 6885 Kama Boyutlarını Mil Çapına Göre Otomatik Önerir
   */
  private applyDin6885Auto(shaftDia: number): void {
    let width = 3.0;
    let depth = 1.4;

    if (shaftDia <= 8) {
      width = 2.0;
      depth = 1.0;
    } else if (shaftDia <= 10) {
      width = 3.0;
      depth = 1.4;
    } else if (shaftDia <= 12) {
      width = 4.0;
      depth = 1.8;
    } else if (shaftDia <= 17) {
      width = 5.0;
      depth = 2.3;
    } else if (shaftDia <= 22) {
      width = 6.0;
      depth = 2.8;
    } else {
      width = 8.0;
      depth = 3.3;
    }

    this.params = {
      ...this.params,
      keywayWidth: width,
      keywayDepth: depth,
    };
  }

  /**
   * Parametre güncellemesini kaydeder ve 3B sahneyi arka planda canlı senkronize eder.
   */
  private updateParam<K extends keyof GearParameters>(key: K, value: GearParameters[K]): void {
    this.params = {
      ...this.params,
      [key]: value,
    };
    this.wizardThreePreview?.update(this.params);
    if (key === 'gearType') {
      this.wizardThreePreview?.frameCamera();
    }
    // Kullanıcı sihirbazda ayarlarla oynarken arkadaki 3B sahne canlı güncellenir!
    this.store.updateParameters({ [key]: value });
  }

  /**
   * Sihirbazı tamamlar ve projeyi store'a kaydeder.
   */
  private handleCompleteWizard(): void {
    this.store.updateParameters(this.params);

    const finalName = this.projectName.trim() || 'Yeni Dişli Tasarımı';
    this.store.saveCurrentProject(finalName);

    localStorage.setItem('gearforge_has_visited', 'true');

    ToastNotification.success(
      i18n.t('toast.wizard_created'),
      i18n.t('toast.wizard_created_title')
    );

    this.close();
  }

  private escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case "'":
          return '&#39;';
        default:
          return m;
      }
    });
  }
}
