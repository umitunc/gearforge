import { GearBuilderState, GearBuilderStore } from '../../application/GearBuilderStore';
import { GearParameters } from '../../domain/models/GearParameters';
import {
  BoreType,
  FilamentMaterial,
  GearHighlightSection,
  GearType,
  HelixHandedness,
  SizingMode,
  WebStyle,
} from '../../domain/models/GearTypes';

interface SliderFieldConfig {
  readonly key: keyof GearParameters;
  readonly label: string;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly tooltip?: string;
  readonly isVisible?: (params: GearParameters) => boolean;
}

const OPTION_METADATA: Record<string, { icon: string; shortLabel: string; subtitle: string }> = {
  // 1. Dişli Tipleri
  [GearType.SPUR]: { icon: '⚙️', shortLabel: 'Düz Dişli', subtitle: 'Spur Gear' },
  [GearType.HELICAL]: { icon: '🌀', shortLabel: 'Helisel Dişli', subtitle: 'Açılı & Sessiz' },
  [GearType.HERRINGBONE]: { icon: '⚡', shortLabel: 'Çavuş Dişli', subtitle: 'Çift Helis (V)' },
  [GearType.BEVEL_TAPER]: { icon: '📐', shortLabel: 'Konik Eğimli', subtitle: 'Daralan Profil' },
  [GearType.INTERNAL_RING]: { icon: '⭕', shortLabel: 'İç Dişli', subtitle: 'Halka Çember' },

  // 2. Boyutlandırma Modları
  [SizingMode.MODULE]: { icon: '📏', shortLabel: 'Modül (m)', subtitle: 'm + z ➔ Çap' },
  [SizingMode.PITCH_DIAMETER]: { icon: '⭕', shortLabel: 'Bölüm Çapı', subtitle: 'Hedef d ➔ m' },
  [SizingMode.OUTER_DIAMETER]: { icon: '🎯', shortLabel: 'Dış Çap (da)', subtitle: 'da + z ➔ m' },

  // 3. Merkez Delik & Mil Tipleri
  [BoreType.CIRCULAR]: { icon: '⭕', shortLabel: 'Yuvarlak Mil', subtitle: 'Standart Daire' },
  [BoreType.KEYWAY]: { icon: '🗝️', shortLabel: 'DIN 6885 Kama', subtitle: 'Kamalı Mil' },
  [BoreType.D_SHAFT]: { icon: '🔲', shortLabel: 'Tek D-Mil', subtitle: 'NEMA 17 D-Şaft' },
  [BoreType.DOUBLE_D]: { icon: '⏸️', shortLabel: 'Çift D-Mil', subtitle: 'Çift Düzlem' },
  [BoreType.HEXAGONAL]: { icon: '⬡', shortLabel: 'Altıgen Mil', subtitle: 'Hex / Allen' },
  [BoreType.SQUARE]: { icon: '⏹️', shortLabel: 'Kare Mil', subtitle: 'Kare Şaft' },
  [BoreType.SPLINE]: { icon: '✳️', shortLabel: 'Frezeli Spline', subtitle: 'Yıldız Şaft' },
  [BoreType.NONE]: { icon: '⚪', shortLabel: 'Deliksiz', subtitle: 'Tam Dolu Masif' },

  // 4. Helis Yönü
  [HelixHandedness.RIGHT]: { icon: '↗️', shortLabel: 'Sağ El', subtitle: 'Right-Hand (RH)' },
  [HelixHandedness.LEFT]: { icon: '↖️', shortLabel: 'Sol El', subtitle: 'Left-Hand (LH)' },

  // 5. Gövde Tasarımı (Web Styles)
  [WebStyle.SOLID]: { icon: '🔘', shortLabel: 'Masif Gövde', subtitle: 'Düz Masif Disc' },
  [WebStyle.RECESSED]: { icon: '🛞', shortLabel: 'Kademeli Web', subtitle: 'Çökertmeli İnce' },
  [WebStyle.LIGHTENING_HOLES]: { icon: '🕳️', shortLabel: 'Delikli Web', subtitle: 'Dairesel Hafif' },
  [WebStyle.SPOKED]: { icon: '☸️', shortLabel: 'Kollu Jant', subtitle: 'İspitli Kollar' },

  // 6. Filament Materyalleri
  [FilamentMaterial.PLA]: { icon: '🌿', shortLabel: 'PLA / PLA+', subtitle: 'Standart & Hassas' },
  [FilamentMaterial.PETG]: { icon: '💎', shortLabel: 'PETG', subtitle: 'Darbe & Isı Direnci' },
  [FilamentMaterial.ABS]: { icon: '🛡️', shortLabel: 'ABS', subtitle: 'Yüksek Tork' },
  [FilamentMaterial.ASA]: { icon: '☀️', shortLabel: 'ASA', subtitle: 'Dış Ortam & UV' },
  [FilamentMaterial.NYLON_PA12]: { icon: '⚙️', shortLabel: 'Naylon PA12', subtitle: 'Aşınma Direnci' },
  [FilamentMaterial.TPU]: { icon: '👟', shortLabel: 'TPU / Esnek', subtitle: 'Titreşim Emici' },
};

/**
 * Sol paneldeki tüm parametrik dişli kontrollerini modüler, kaydırılabilir (scrollable)
 * ve 3B bölge vurgulamalı (section-highlight) olarak yöneten görünüm sınıfı (SRP / OCP).
 */
export class ParameterControlsView {
  private readonly container: HTMLElement;
  private readonly store: GearBuilderStore;
  private readonly fieldUpdaters = new Map<string, (state: GearBuilderState) => void>();
  private readonly sectionElements = new Map<GearHighlightSection, HTMLElement>();
  private readonly sectionBodies = new Map<GearHighlightSection, HTMLElement>();
  private presetSectionEl!: HTMLElement;
  private isAccordionMode = true;

  constructor(container: HTMLElement, store: GearBuilderStore) {
    this.container = container;
    this.store = store;
    this.render();
    this.store.subscribe((state) => this.syncValues(state));
  }

  public getSectionElement(section: GearHighlightSection): HTMLElement | undefined {
    return this.sectionElements.get(section);
  }

  public getPresetSectionElement(): HTMLElement {
    return this.presetSectionEl;
  }

  public getSectionBodyElement(section: GearHighlightSection): HTMLElement | undefined {
    return this.sectionBodies.get(section);
  }

  /**
   * Belirtilen bölümün parametre kontrollerini (ve 1. bölüm için hazır şablonları)
   * verilen hedef DOM konteynerine (HUD kartı veya mobil çekmece) tek kalemde yerleştirir.
   */
  public mountSectionContent(section: GearHighlightSection, targetEl: HTMLElement): void {
    targetEl.innerHTML = '';
    if (section === GearHighlightSection.DIMENSIONS_AND_TYPE && this.presetSectionEl) {
      targetEl.appendChild(this.presetSectionEl);
    }
    const body = this.sectionBodies.get(section);
    if (body) {
      targetEl.appendChild(body);
    }
  }

  public setAccordionMode(enabled: boolean): void {
    this.isAccordionMode = enabled;
  }

  public openSection(section: GearHighlightSection, scrollIntoView = true): void {
    const target = this.sectionElements.get(section);
    if (!target) return;

    if (target instanceof HTMLDetailsElement) {
      target.open = true;
    }

    if (this.isAccordionMode) {
      for (const [sec, el] of this.sectionElements) {
        if (sec !== section && el instanceof HTMLDetailsElement) {
          el.open = false;
        }
      }
    }

    if (scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    target.classList.remove('section-pulse-highlight');
    void target.offsetWidth;
    target.classList.add('section-pulse-highlight');
    window.setTimeout(() => target.classList.remove('section-pulse-highlight'), 1200);
  }

  private render(): void {
    this.container.innerHTML = '';

    // Görünüm Düzeni Seçici (Akordiyon / Tümünü Aç)
    this.container.appendChild(this.buildModeToggleBar());

    // 0. Hazır Şablonlar (Presets) Seçici
    this.container.appendChild(this.buildPresetSection());

    // 1. Dişli Tipi & Boyutlandırma -> DIMENSIONS_AND_TYPE
    this.container.appendChild(
      this.buildSection(
        '1. Dişli Tipi ve Ana Boyutlar',
        '⚙️',
        GearHighlightSection.DIMENSIONS_AND_TYPE,
        'Dış Çember & Dişler',
        (body) => {
          this.appendSelectField(body, 'gearType', 'Dişli Tipi', [
            { value: GearType.SPUR, label: 'Düz Dişli (Spur Gear)' },
            { value: GearType.HELICAL, label: 'Helisel Dişli (Helical Gear)' },
            { value: GearType.HERRINGBONE, label: 'Çavuş / Çift Helisel (Herringbone)' },
            { value: GearType.BEVEL_TAPER, label: 'Konik Eğimli (Bevel Taper)' },
            { value: GearType.INTERNAL_RING, label: 'İç Dişli Çember (Internal Ring)' },
          ]);

          this.appendSelectField(body, 'sizingMode', 'Boyutlandırma Modu', [
            { value: SizingMode.MODULE, label: 'Modül (m) + Diş Sayısı -> Çap Hesapla' },
            { value: SizingMode.PITCH_DIAMETER, label: 'Bölüm Çapı (d) + Diş Sayısı -> Modül Hesapla' },
            { value: SizingMode.OUTER_DIAMETER, label: 'Dış Çap (da) + Diş Sayısı -> Modül Hesapla' },
          ]);

          const primarySliders: SliderFieldConfig[] = [
            {
              key: 'teethCount',
              label: 'Diş Sayısı (z)',
              unit: 'diş',
              min: 6,
              max: 140,
              step: 1,
              tooltip: 'Dişli üzerindeki toplam diş adedi.',
            },
            {
              key: 'module',
              label: 'Modül (m)',
              unit: 'mm',
              min: 0.5,
              max: 8.0,
              step: 0.05,
              tooltip: 'Diş büyüklüğü standart katsayısı (d = m × z).',
              isVisible: (p) => p.sizingMode === SizingMode.MODULE,
            },
            {
              key: 'targetPitchDiameter',
              label: 'Hedef Bölüm Çapı (d)',
              unit: 'mm',
              min: 8,
              max: 300,
              step: 0.5,
              tooltip: 'İstenen bölüm dairesi çapı (Modül otomatik hesaplanır).',
              isVisible: (p) => p.sizingMode === SizingMode.PITCH_DIAMETER,
            },
            {
              key: 'targetOuterDiameter',
              label: 'Hedef Dış Çap (da)',
              unit: 'mm',
              min: 10,
              max: 320,
              step: 0.5,
              tooltip: 'Kumpasla ölçülen uçtan uca toplam dış çap (Modül otomatik hesaplanır).',
              isVisible: (p) => p.sizingMode === SizingMode.OUTER_DIAMETER,
            },
            {
              key: 'thickness',
              label: 'Dişli Kalınlığı (b)',
              unit: 'mm',
              min: 1.5,
              max: 80.0,
              step: 0.5,
              tooltip: 'Eksenel diş genişliği / et kalınlığı.',
            },
            {
              key: 'helixAngleDeg',
              label: 'Helis Açısı (β)',
              unit: '°',
              min: 0,
              max: 45,
              step: 1,
              tooltip: 'Dişlerin eksene göre eğim açısı (15°-30° arası 3D baskı için idealdir).',
              isVisible: (p) =>
                p.gearType === GearType.HELICAL || p.gearType === GearType.HERRINGBONE,
            },
            {
              key: 'bevelTaperFactor',
              label: 'Konik Daralma Oranı',
              unit: 'oran',
              min: 0.05,
              max: 0.45,
              step: 0.01,
              isVisible: (p) => p.gearType === GearType.BEVEL_TAPER,
            },
            {
              key: 'outerRingWallThickness',
              label: 'Dış Halka Et Kalınlığı',
              unit: 'mm',
              min: 2.5,
              max: 30.0,
              step: 0.5,
              isVisible: (p) => p.gearType === GearType.INTERNAL_RING,
            },
          ];

          for (const cfg of primarySliders) {
            this.appendSliderField(body, cfg);
          }

          this.appendSelectField(
            body,
            'helixHandedness',
            'Helis Yönü',
            [
              { value: HelixHandedness.RIGHT, label: 'Sağ El (Right-Hand)' },
              { value: HelixHandedness.LEFT, label: 'Sol El (Left-Hand)' },
            ],
            (p) => p.gearType === GearType.HELICAL || p.gearType === GearType.HERRINGBONE
          );
        }
      )
    );

    // 2. Merkez Delik ve Mil Bağlantısı -> BORE_AND_SHAFT
    this.container.appendChild(
      this.buildSection(
        '2. Merkez Delik & Mil Bağlantısı',
        '🔩',
        GearHighlightSection.BORE_AND_SHAFT,
        'Merkez Delik & Kama',
        (body) => {
          this.appendSelectField(
            body,
            'boreType',
            'Delik / Mil Tipi',
            [
              { value: BoreType.CIRCULAR, label: 'Yuvarlak Delik (Circular)' },
              { value: BoreType.D_SHAFT, label: 'Step Motor Tek D-Mil (D-Shaft)' },
              { value: BoreType.DOUBLE_D, label: 'Çift D-Mil (Double D-Shaft)' },
              { value: BoreType.KEYWAY, label: 'Kama Kanallı Delik (DIN 6885 Keyway)' },
              { value: BoreType.HEXAGONAL, label: 'Altıgen Yuva (Hex Somun / Mil)' },
              { value: BoreType.SQUARE, label: 'Kare Mil Deliği (Square)' },
              { value: BoreType.SPLINE, label: 'Çok Kamalı / Yıldız Mil (Spline)' },
              { value: BoreType.NONE, label: 'Deliksiz (Tam Dolu Göbek)' },
            ],
            (p) => p.gearType !== GearType.INTERNAL_RING
          );

          const boreSliders: SliderFieldConfig[] = [
            {
              key: 'boreDiameter',
              label: 'Merkez Delik Çapı',
              unit: 'mm',
              min: 1.5,
              max: 120.0,
              step: 0.25,
              tooltip: 'Mil veya rulman nominal çapı.',
              isVisible: (p) =>
                p.gearType !== GearType.INTERNAL_RING && p.boreType !== BoreType.NONE,
            },
            {
              key: 'dShaftFlatDepth',
              label: 'D-Mil Kesik Derinliği',
              unit: 'mm',
              min: 0.2,
              max: 4.0,
              step: 0.05,
              tooltip: 'Daire kenarından içeriye düz kesim miktarı (Örn. 5mm NEMA17 mil için 0.5mm).',
              isVisible: (p) =>
                p.gearType !== GearType.INTERNAL_RING &&
                (p.boreType === BoreType.D_SHAFT || p.boreType === BoreType.DOUBLE_D),
            },
            {
              key: 'keywayWidth',
              label: 'Kama Kanalı Genişliği',
              unit: 'mm',
              min: 1.0,
              max: 16.0,
              step: 0.2,
              isVisible: (p) =>
                p.gearType !== GearType.INTERNAL_RING && p.boreType === BoreType.KEYWAY,
            },
            {
              key: 'keywayDepth',
              label: 'Kama Kanalı Derinliği',
              unit: 'mm',
              min: 0.5,
              max: 10.0,
              step: 0.1,
              isVisible: (p) =>
                p.gearType !== GearType.INTERNAL_RING && p.boreType === BoreType.KEYWAY,
            },
            {
              key: 'splineCount',
              label: 'Çoklu Kama Diş Sayısı',
              unit: 'adet',
              min: 4,
              max: 16,
              step: 1,
              isVisible: (p) =>
                p.gearType !== GearType.INTERNAL_RING && p.boreType === BoreType.SPLINE,
            },
            {
              key: 'splineDepth',
              label: 'Çoklu Kama Derinliği',
              unit: 'mm',
              min: 0.3,
              max: 5.0,
              step: 0.1,
              isVisible: (p) =>
                p.gearType !== GearType.INTERNAL_RING && p.boreType === BoreType.SPLINE,
            },
          ];

          for (const cfg of boreSliders) {
            this.appendSliderField(body, cfg);
          }
        }
      )
    );

    // 3. Göbek (Hub), Gövde (Web) ve Hafifletme Varyasyonları -> HUB_AND_WEB
    this.container.appendChild(
      this.buildSection(
        '3. Göbek (Hub) & Gövde Hafifletme',
        '🛞',
        GearHighlightSection.HUB_AND_WEB,
        'Göbek, Web & Kollar',
        (body) => {
          this.appendSelectField(
            body,
            'webStyle',
            'Gövde Tasarımı',
            [
              { value: WebStyle.SOLID, label: 'Tam Dolu Gövde (Solid)' },
              { value: WebStyle.RECESSED, label: 'Çökertmeli İnce Gövde (Recessed Web)' },
              { value: WebStyle.LIGHTENING_HOLES, label: 'Dairesel Hafifletme Delikli' },
              { value: WebStyle.SPOKED, label: 'Kollu / Jant Tipi (Spoked Wheel)' },
            ],
            (p) => p.gearType !== GearType.INTERNAL_RING
          );

          const webSliders: SliderFieldConfig[] = [
            {
              key: 'hubDiameter',
              label: 'Merkez Göbek (Hub) Çapı',
              unit: 'mm',
              min: 4.0,
              max: 160.0,
              step: 0.5,
              isVisible: (p) => p.gearType !== GearType.INTERNAL_RING,
            },
            {
              key: 'hubTopExtension',
              label: 'Üst Göbek Çıkıntısı (Boss)',
              unit: 'mm',
              min: 0.0,
              max: 30.0,
              step: 0.5,
              tooltip: 'Setuskur (set screw) veya yataklama için üst göbek uzantısı.',
              isVisible: (p) => p.gearType !== GearType.INTERNAL_RING,
            },
            {
              key: 'hubBottomExtension',
              label: 'Alt Göbek Çıkıntısı',
              unit: 'mm',
              min: 0.0,
              max: 30.0,
              step: 0.5,
              isVisible: (p) => p.gearType !== GearType.INTERNAL_RING,
            },
            {
              key: 'rimThickness',
              label: 'Dış Çember (Rim) Et Kalınlığı',
              unit: 'mm',
              min: 2.0,
              max: 25.0,
              step: 0.5,
              isVisible: (p) =>
                p.gearType !== GearType.INTERNAL_RING && p.webStyle !== WebStyle.SOLID,
            },
            {
              key: 'webThickness',
              label: 'İç Gövde (Web) Kalınlığı',
              unit: 'mm',
              min: 1.0,
              max: 60.0,
              step: 0.5,
              isVisible: (p) =>
                p.gearType !== GearType.INTERNAL_RING && p.webStyle !== WebStyle.SOLID,
            },
            {
              key: 'cutoutCount',
              label: 'Delik / Jant Kolu Sayısı',
              unit: 'adet',
              min: 3,
              max: 12,
              step: 1,
              isVisible: (p) =>
                p.gearType !== GearType.INTERNAL_RING &&
                (p.webStyle === WebStyle.LIGHTENING_HOLES || p.webStyle === WebStyle.SPOKED),
            },
            {
              key: 'spokeWidthFactor',
              label: 'Boşluk / Hafifletme Oranı',
              unit: 'oran',
              min: 0.25,
              max: 0.80,
              step: 0.05,
              isVisible: (p) =>
                p.gearType !== GearType.INTERNAL_RING &&
                (p.webStyle === WebStyle.LIGHTENING_HOLES || p.webStyle === WebStyle.SPOKED),
            },
          ];

          for (const cfg of webSliders) {
            this.appendSliderField(body, cfg);
          }
        }
      )
    );

    // 4. İleri Evolvent Profili & 3D Yazıcı Toleransları -> EVOLVENT_AND_PRINT
    this.container.appendChild(
      this.buildSection(
        '4. Evolvent Profil & 3D Yazıcı Kalibrasyonu',
        '🖨️',
        GearHighlightSection.EVOLVENT_AND_PRINT,
        'Evolvent Diş Yanakları',
        (body) => {
          const advSliders: SliderFieldConfig[] = [
            {
              key: 'pressureAngleDeg',
              label: 'Kavrama Açısı (α)',
              unit: '°',
              min: 14.5,
              max: 28.0,
              step: 0.5,
              tooltip: 'Standart ISO dişlilerde 20° kullanılır. Yüksek tork için 25° seçilebilir.',
            },
            {
              key: 'profileShift',
              label: 'Profil Kaydırma (x)',
              unit: 'katsayı',
              min: -0.4,
              max: 0.6,
              step: 0.02,
              tooltip: 'Az dişli pinyonlarda dipten kesilmeyi (undercut) önler.',
            },
            {
              key: 'addendumFactor',
              label: 'Diş Üstü Katsayısı (ha*)',
              unit: '×m',
              min: 0.6,
              max: 1.3,
              step: 0.05,
            },
            {
              key: 'dedendumFactor',
              label: 'Diş Dibi Katsayısı (hf*)',
              unit: '×m',
              min: 0.9,
              max: 1.6,
              step: 0.05,
            },
            {
              key: 'rootFilletFactor',
              label: 'Diş Dibi Radyüsü (Fillet)',
              unit: 'oran',
              min: 0.0,
              max: 0.45,
              step: 0.02,
              tooltip: '3D baskıda diş kırılmasını önleyen kök yuvarlatması.',
            },
            {
              key: 'tipReliefFactor',
              label: 'Diş Ucu Pahı (Tip Relief)',
              unit: 'oran',
              min: 0.0,
              max: 0.25,
              step: 0.02,
            },
            {
              key: 'backlashMm',
              label: '3D Baskı Diş Boşluğu (Backlash)',
              unit: 'mm',
              min: 0.0,
              max: 0.5,
              step: 0.02,
              tooltip: 'FDM yazıcıda katman taşmasını telafi etmek için diş kalınlığından düşülen pay.',
            },
            {
              key: 'boreClearanceMm',
              label: 'İç Delik Toleransı (Yarıçap)',
              unit: 'mm',
              min: 0.0,
              max: 0.4,
              step: 0.02,
              tooltip: 'FDM yazıcılarda dar çıkan iç delikleri telafi etmek için yarıçapa eklenen pay.',
            },
            {
              key: 'profileSegmentsPerFlank',
              label: 'Evolvent Eğri Çözünürlüğü',
              unit: 'seg',
              min: 6,
              max: 24,
              step: 1,
            },
            {
              key: 'axialSlices',
              label: 'Z Katman Çözünürlüğü',
              unit: 'dilim',
              min: 4,
              max: 48,
              step: 2,
              isVisible: (p) =>
                p.gearType === GearType.HELICAL ||
                p.gearType === GearType.HERRINGBONE ||
                p.gearType === GearType.BEVEL_TAPER,
            },
          ];

          for (const cfg of advSliders) {
            this.appendSliderField(body, cfg);
          }

          this.appendSelectField(body, 'filamentMaterial', 'Filament Materyali', [
            { value: FilamentMaterial.PLA, label: 'PLA (1.24 g/cm³)' },
            { value: FilamentMaterial.PETG, label: 'PETG (1.27 g/cm³)' },
            { value: FilamentMaterial.ABS, label: 'ABS (1.04 g/cm³)' },
            { value: FilamentMaterial.ASA, label: 'ASA (1.07 g/cm³)' },
            { value: FilamentMaterial.NYLON_PA12, label: 'Nylon PA12 (1.02 g/cm³)' },
            { value: FilamentMaterial.TPU, label: 'TPU Esnek (1.21 g/cm³)' },
          ]);

          this.appendSliderField(body, {
            key: 'infillPercentage',
            label: 'Baskı Doluluk Oranı (Infill)',
            unit: '%',
            min: 10,
            max: 100,
            step: 5,
          });
        }
      )
    );

    // 5. Eşleşen Dişli (Mating Pinion) Simülasyonu -> MATING_SIMULATION
    this.container.appendChild(
      this.buildSection(
        '5. Eşleşen Dişli (Çift Dişli) Simülasyonu',
        '🔄',
        GearHighlightSection.MATING_SIMULATION,
        'Karşı Pinyon & Temas',
        (body) => {
          this.appendToggleField(
            body,
            'showMatingGear',
            'Eşleşen Pinyon Dişliyi Sahneye Ekle'
          );

          this.appendSliderField(body, {
            key: 'matingTeethCount',
            label: 'Karşı Dişli Diş Sayısı (z₂)',
            unit: 'diş',
            min: 8,
            max: 100,
            step: 1,
            isVisible: (p) => p.showMatingGear,
          });

          this.appendSliderField(body, {
            key: 'simulationRpm',
            label: 'Dönüş Hızı (Simülasyon)',
            unit: 'RPM',
            min: 0,
            max: 60,
            step: 1,
          });
        }
      )
    );
  }

  private buildModeToggleBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'section-view-mode-bar';

    const label = document.createElement('span');
    label.className = 'mode-bar-label';
    label.textContent = 'Görünüm Düzeni:';

    const btnGroup = document.createElement('div');
    btnGroup.className = 'mode-btn-group';

    const accordionBtn = document.createElement('button');
    accordionBtn.type = 'button';
    accordionBtn.className = `mode-toggle-btn btn-mode-accordion ${this.isAccordionMode ? 'active' : ''}`;
    accordionBtn.textContent = '🎯 Tekli Odak (Kompakt)';
    accordionBtn.title = 'Sadece aktif bölümü açık tutar, dikey kaydırmayı azaltır';

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = `mode-toggle-btn btn-mode-all ${!this.isAccordionMode ? 'active' : ''}`;
    allBtn.textContent = '📋 Tümünü Aç';
    allBtn.title = 'Tüm bölümleri açık tutar';

    accordionBtn.addEventListener('click', () => {
      this.isAccordionMode = true;
      accordionBtn.classList.add('active');
      allBtn.classList.remove('active');
      let keptOne = false;
      for (const el of this.sectionElements.values()) {
        if (el instanceof HTMLDetailsElement) {
          if (!keptOne && el.open) {
            keptOne = true;
          } else {
            el.open = false;
          }
        }
      }
    });

    allBtn.addEventListener('click', () => {
      this.isAccordionMode = false;
      allBtn.classList.add('active');
      accordionBtn.classList.remove('active');
      for (const el of this.sectionElements.values()) {
        if (el instanceof HTMLDetailsElement) {
          el.open = true;
        }
      }
    });

    btnGroup.append(accordionBtn, allBtn);
    bar.append(label, btnGroup);
    return bar;
  }

  private buildPresetSection(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'preset-bar card-select-container';

    const header = document.createElement('div');
    header.className = 'card-select-header';

    const label = document.createElement('label');
    label.className = 'preset-label';
    label.textContent = 'Hazır Mühendislik Şablonları (Presets)';

    const activeBadge = document.createElement('span');
    activeBadge.className = 'active-badge-pill';
    activeBadge.textContent = 'Özel Tasarım';

    header.append(label, activeBadge);

    const track = document.createElement('div');
    track.className = 'card-select-track preset-card-track';
    track.setAttribute('role', 'radiogroup');
    track.setAttribute('aria-label', 'Hazır Mühendislik Şablonları');

    const presetCards = new Map<string, HTMLButtonElement>();

    // 1. Özel Parametrik Tasarım (Custom) Card
    const customCard = document.createElement('button');
    customCard.type = 'button';
    customCard.className = 'card-select-item active';
    customCard.dataset.value = '';
    customCard.setAttribute('role', 'radio');
    customCard.setAttribute('aria-label', 'Özel Parametrik Tasarım');
    customCard.innerHTML = `
      <span class="card-check">✓</span>
      <span class="card-icon">✨</span>
      <span class="card-title">Özel Tasarım</span>
      <span class="card-subtitle">Manuel CAD</span>
    `;
    customCard.addEventListener('click', () => {
      this.store.applyPreset('');
    });
    track.appendChild(customCard);
    presetCards.set('', customCard);

    // 2. Preset Cards
    for (const preset of this.store.getPresets()) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card-select-item';
      card.dataset.value = preset.id;
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-label', preset.name);

      let catIcon = '⚙️';
      if (preset.category.includes('Step') || preset.category.includes('Motor')) catIcon = '⚡';
      else if (preset.category.includes('Robot') || preset.category.includes('Servo')) catIcon = '🤖';
      else if (preset.category.includes('Endüstri')) catIcon = '🏭';
      else if (preset.category.includes('Helis') || preset.category.includes('Sessiz')) catIcon = '🌀';
      else if (preset.category.includes('Planet') || preset.category.includes('İç')) catIcon = '🪐';

      card.innerHTML = `
        <span class="card-check">✓</span>
        <span class="card-icon">${catIcon}</span>
        <span class="card-title">${preset.name}</span>
        <span class="card-subtitle">[${preset.category}]</span>
      `;

      card.addEventListener('click', () => {
        this.store.applyPreset(preset.id);
      });

      track.appendChild(card);
      presetCards.set(preset.id, card);
    }

    const descBox = document.createElement('p');
    descBox.className = 'preset-desc';

    this.fieldUpdaters.set('__preset__', (state) => {
      const activeId = state.activePresetId ?? '';
      for (const [id, btn] of presetCards) {
        const isMatch = id === activeId;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
        if (isMatch) {
          btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
      const activePreset = activeId
        ? this.store.getPresets().find((p) => p.id === activeId)
        : undefined;
      activeBadge.textContent = activePreset ? activePreset.name : 'Özel Tasarım';
      descBox.textContent = activePreset
        ? activePreset.description
        : 'Parametreler manuel olarak özelleştirildi. İstediğiniz varyasyonu kaydedebilir veya STL olarak indirebilirsiniz.';
    });

    wrapper.append(header, track, descBox);
    this.presetSectionEl = wrapper;
    return wrapper;
  }

  private buildSection(
    title: string,
    icon: string,
    highlightSection: GearHighlightSection,
    zoneTagText: string,
    populate: (body: HTMLElement) => void
  ): HTMLElement {
    const details = document.createElement('details');
    details.className = `param-section zone-${highlightSection}`;
    details.open = highlightSection === GearHighlightSection.DIMENSIONS_AND_TYPE || !this.isAccordionMode;

    details.addEventListener('toggle', () => {
      if (details.open && this.isAccordionMode) {
        for (const [sec, el] of this.sectionElements) {
          if (sec !== highlightSection && el instanceof HTMLDetailsElement && el.open) {
            el.open = false;
          }
        }
      }
    });

    const summary = document.createElement('summary');
    summary.className = 'param-section-header';
    summary.innerHTML = `
      <span class="section-icon">${icon}</span>
      <span class="section-title-text">${title}</span>
      <span class="section-zone-badge" title="Bu bölümde çalışırken dişli üzerinde vurgulanan alan">${zoneTagText}</span>
    `;

    const body = document.createElement('div');
    body.className = 'param-section-body';
    populate(body);
    this.sectionBodies.set(highlightSection, body);

    const activateHighlight = () => {
      this.store.setActiveHighlightSection(highlightSection);
    };

    const clearHighlight = () => {
      this.store.setActiveHighlightSection(GearHighlightSection.NONE);
    };

    // Kullanıcı bu section üzerine geldiğinde / etkileşime girdiğinde hafif parlat,
    // section üzerinden ayrıldığında (mouseleave / focusout) rengi eski haline döndür.
    details.addEventListener('mouseenter', activateHighlight);
    details.addEventListener('mouseleave', clearHighlight);
    details.addEventListener('focusin', activateHighlight);
    details.addEventListener('focusout', (e: FocusEvent) => {
      if (!details.contains(e.relatedTarget as Node | null)) {
        clearHighlight();
      }
    });
    details.addEventListener('pointerdown', activateHighlight);
    body.addEventListener('scroll', activateHighlight, { passive: true });

    this.sectionElements.set(highlightSection, details);

    details.appendChild(summary);
    details.appendChild(body);
    return details;
  }

  private appendSliderField(parent: HTMLElement, cfg: SliderFieldConfig): void {
    const row = document.createElement('div');
    row.className = 'control-row';

    const topLine = document.createElement('div');
    topLine.className = 'control-label-line';

    const label = document.createElement('label');
    label.className = 'control-label';
    label.textContent = cfg.label;
    if (cfg.tooltip) {
      label.title = cfg.tooltip;
    }

    const unitGroup = document.createElement('div');
    unitGroup.className = 'control-input-group';

    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.className = 'control-number';
    numInput.min = String(cfg.min);
    numInput.max = String(cfg.max);
    numInput.step = String(cfg.step);

    const unitBadge = document.createElement('span');
    unitBadge.className = 'control-unit';
    unitBadge.textContent = cfg.unit;

    unitGroup.appendChild(numInput);
    unitGroup.appendChild(unitBadge);

    topLine.appendChild(label);
    topLine.appendChild(unitGroup);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'control-slider';
    slider.min = String(cfg.min);
    slider.max = String(cfg.max);
    slider.step = String(cfg.step);

    const emitChange = (rawVal: string) => {
      const parsed = parseFloat(rawVal);
      if (!Number.isNaN(parsed)) {
        this.store.updateParameters({ [cfg.key]: parsed } as Partial<GearParameters>);
      }
    };

    slider.addEventListener('input', () => {
      numInput.value = slider.value;
      emitChange(slider.value);
    });

    numInput.addEventListener('change', () => {
      slider.value = numInput.value;
      emitChange(numInput.value);
    });

    row.appendChild(topLine);
    row.appendChild(slider);
    parent.appendChild(row);

    this.fieldUpdaters.set(String(cfg.key), (state) => {
      const val = state.parameters[cfg.key] as number;
      if (document.activeElement !== numInput) {
        numInput.value = String(Number(val.toFixed(3)));
      }
      slider.value = String(val);
      const visible = cfg.isVisible ? cfg.isVisible(state.parameters) : true;
      row.style.display = visible ? 'flex' : 'none';
    });
  }

  private appendSelectField<K extends keyof GearParameters>(
    parent: HTMLElement,
    key: K,
    labelText: string,
    options: readonly { value: string; label: string }[],
    isVisible?: (params: GearParameters) => boolean
  ): void {
    const container = document.createElement('div');
    container.className = 'card-select-container';

    const header = document.createElement('div');
    header.className = 'card-select-header';

    const label = document.createElement('span');
    label.className = 'control-label';
    label.textContent = labelText;

    const activeBadge = document.createElement('span');
    activeBadge.className = 'active-badge-pill';

    header.append(label, activeBadge);

    const track = document.createElement('div');
    track.className = 'card-select-track';
    track.setAttribute('role', 'radiogroup');
    track.setAttribute('aria-label', labelText);

    const itemElements = new Map<string, HTMLButtonElement>();

    for (const opt of options) {
      const meta = OPTION_METADATA[opt.value] || {
        icon: '⚙️',
        shortLabel: opt.label,
        subtitle: '',
      };

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card-select-item';
      card.dataset.value = opt.value;
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-label', opt.label);

      card.innerHTML = `
        <span class="card-check">✓</span>
        <span class="card-icon">${meta.icon}</span>
        <span class="card-title">${meta.shortLabel}</span>
        ${meta.subtitle ? `<span class="card-subtitle">${meta.subtitle}</span>` : ''}
      `;

      card.addEventListener('click', () => {
        this.store.updateParameters({
          [key]: opt.value as unknown as GearParameters[K],
        } as Partial<GearParameters>);
      });

      track.appendChild(card);
      itemElements.set(opt.value, card);
    }

    container.append(header, track);
    parent.appendChild(container);

    this.fieldUpdaters.set(String(key), (state) => {
      const currentVal = String(state.parameters[key]);
      for (const [val, card] of itemElements) {
        const isActive = val === currentVal;
        card.classList.toggle('active', isActive);
        card.setAttribute('aria-checked', isActive ? 'true' : 'false');
        if (isActive) {
          card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }

      const activeMeta = OPTION_METADATA[currentVal];
      const matchedOpt = options.find((o) => o.value === currentVal);
      activeBadge.textContent = activeMeta?.shortLabel || matchedOpt?.label || currentVal;

      const visible = isVisible ? isVisible(state.parameters) : true;
      container.style.display = visible ? 'flex' : 'none';
    });
  }

  private appendToggleField(
    parent: HTMLElement,
    key: keyof GearParameters,
    labelText: string
  ): void {
    const row = document.createElement('label');
    row.className = 'control-toggle-row';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'control-checkbox';

    const span = document.createElement('span');
    span.textContent = labelText;

    checkbox.addEventListener('change', () => {
      this.store.updateParameters({
        [key]: checkbox.checked,
      } as Partial<GearParameters>);
    });

    row.appendChild(checkbox);
    row.appendChild(span);
    parent.appendChild(row);

    this.fieldUpdaters.set(String(key), (state) => {
      checkbox.checked = Boolean(state.parameters[key]);
    });
  }

  private syncValues(state: GearBuilderState): void {
    for (const updater of this.fieldUpdaters.values()) {
      updater(state);
    }

    for (const [sec, el] of this.sectionElements.entries()) {
      el.classList.toggle('is-active-section', state.activeHighlightSection === sec);
    }
  }
}
