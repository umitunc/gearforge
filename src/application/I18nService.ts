/**
 * I18nService.ts
 * GearForge 3D — Çok Dilli Yerelleştirme Servisi (TR, EN, DE, RU)
 * Geliştirici: Trunçgil Teknoloji (https://www.truncgil.com.tr)
 */

export type SupportedLanguage = 'tr' | 'en' | 'de' | 'ru';

export interface LanguageOption {
  readonly code: SupportedLanguage;
  readonly name: string;
  readonly flag: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export interface TranslationDictionary {
  readonly [key: string]: string;
}

const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  tr: {
    // Menü ve Genel
    'app.title': 'GearForge 3D',
    'app.subtitle': 'ISO 21771 Evolvent CAD & 3D Yazıcı Dilimleyici Stüdyosu',
    'menu.file': '📁 Dosya',
    'menu.new_gear': 'Yeni Dişli Tasarımı',
    'menu.wizard': '🧙‍♂️ Dişli Tasarım Sihirbazı',
    'menu.open_saved': 'Kayıtlı Projelerden Aç (LocalStorage)...',
    'menu.save': 'Projeyi Kaydet',
    'menu.save_as': 'Farklı Kaydet (LocalStorage)...',
    'menu.import_json': 'JSON Ayar Dosyası Yükle...',
    'menu.export_json': 'Ayarları JSON Olarak İndir',
    'menu.reset_default': 'Varsayılan Ayarlara Sıfırla',
    'menu.projects': '📂 Projelerim',
    'menu.export': '🚀 Dışa Aktar',
    'menu.export_stl_binary': 'STL İndir (İkili / Binary STL - 3D Baskı)',
    'menu.export_stl_ascii': 'ASCII STL İndir (.stl)',
    'menu.export_obj': 'Wavefront OBJ İndir (.obj)',
    'menu.export_mating': 'Karşı Pinyon Dişli STL İndir',
    'menu.screenshot': '3B Sahne Ekran Görüntüsü Al (.png)',
    'menu.presets': '⚙️ Şablonlar',
    'menu.view': '👁️ Görünüm',
    'menu.help': '❓ Yardım',
    'menu.about': 'GearForge 3D & Trunçgil Teknoloji Hakkında',
    'menu.iso_guide': 'ISO 21771 & 3D Baskı Kılavuzu',
    'menu.shortcuts': 'Klavye Kısayolları (Shortcuts)',
    'quick.new': '➕ Yeni',
    'quick.projects': '📂 Projelerim',
    'quick.save': '💾 Kaydet',
    'quick.export_stl': '⬇ STL İndir',
    'badge.active_project': 'Yeni Dişli Tasarımı',
    'badge.dirty': '● Değiştirildi',
    'offline.badge': 'Çevrimdışı CAD',

    // Sihirbaz Genel
    'wizard.title': 'Dişli Tasarım Sihirbazı',
    'wizard.subtitle': '5 adımda parametrik, 3D baskıya hazır ve su geçirmez ISO 21771 dişlinizi tasarlayın.',
    'wizard.step_counter': 'Adım {current} / {total}',
    'wizard.btn_cancel': 'İptal',
    'wizard.btn_back': '◀ Geri',
    'wizard.btn_next': 'İleri ▶',
    'wizard.btn_create': '🚀 Dişliyi Oluştur ve Sahneye Aktar',
    'wizard.startup_checkbox': 'Uygulama açılışında sihirbazı otomatik göster',
    'wizard.info_btn_title': 'Mühendislik formülü ve 3D baskı detayları için tıklayın',
    'wizard.formula_label': 'Mühendislik Formülü:',
    'wizard.explanation_label': 'Mühendislik Detayı & Standart:',
    'wizard.inspect_2d_title': '2D CAD Teknik Çizimi Büyüt ve İncele',
    'wizard.cad_badge': '2D CAD ÖNİZLEME',
    'wizard.cad_inspect_modal_title': '2D CAD Teknik Çizim & Ölçülendirme İncelemesi',
    'wizard.view_3d': '🧊 3B Model',
    'wizard.view_2d': '📐 2D CAD',
    'wizard.view_dual': '🔲 İkili',
    'wizard.toolbar_rotate': 'Otomatik Dönüş',
    'wizard.toolbar_wireframe': 'Tel Kafes',
    'wizard.toolbar_center': 'Kamerayı Sıfırla',


    // Sihirbaz Adımları
    'wizard.step1.tab': '1. Boyut & Tip',
    'wizard.step1.title': '1. Dişli Tipi ve Ana Boyutlar',
    'wizard.step1.desc': 'Dişli mekanizma mimarisini, diş sayısını, modülünü ve et kalınlığını belirleyin.',

    'wizard.step2.tab': '2. Delik & Mil',
    'wizard.step2.title': '2. Merkez Delik & Mil Bağlantısı',
    'wizard.step2.desc': 'Motor veya rulman şaftı tipini (Yuvarlak, DIN 6885 Kama veya Step Motor D-Şaft) yapılandırın.',

    'wizard.step3.tab': '3. Göbek & Web',
    'wizard.step3.title': '3. Göbek (Hub) ve Ağırlık Hafifletme',
    'wizard.step3.desc': 'Filament tasarrufu ve rijitlik için gövde çökertmesi, jant kolları veya hafifletme delikleri ekleyin.',

    'wizard.step4.tab': '4. Evolvent & FDM',
    'wizard.step4.title': '4. Evolvent Profil & 3D Yazıcı Toleransları',
    'wizard.step4.desc': 'Kavrama açısı, profil kaydırma, filament büzülmesi ve FDM backlash ayarlarını kalibre edin.',

    'wizard.step5.tab': '5. Özet & Oluştur',
    'wizard.step5.title': '5. Teknik Doğrulama ve Proje Kaydı',
    'wizard.step5.desc': 'Hesaplanan ISO 21771 diş geometrisini inceleyin ve projenizi 3B çalışma alanına aktarın.',

    // Parametreler ve Formüller (TR)
    'param.gearType': 'Dişli Tipi',
    'param.gearType.tip': 'Eksenel ve kinematik diş yönü mimarisi.',
    'param.gearType.spur': 'Düz Dişli (Spur)',
    'param.gearType.helical': 'Helisel Dişli (Helical)',
    'param.gearType.herringbone': 'Çavuş Dişli (Herringbone)',
    'param.gearType.bevel': 'Konik Eğimli Dişli (Bevel)',
    'param.gearType.internal': 'İç Dişli Çember (Internal)',

    'param.sizingMode': 'Boyutlandırma Modu',
    'param.sizingMode.tip': 'Hangi parametrenin öncelikli olarak sabit tutulacağını seçin.',
    'param.sizingMode.module': 'Modül (m) + Diş Sayısı (z) ➔ Çap Hesaplanır',
    'param.sizingMode.pitch': 'Bölüm Çapı (d) + Diş Sayısı ➔ Modül Hesaplanır',
    'param.sizingMode.outer': 'Dış Çap (da) + Diş Sayısı ➔ Modül Hesaplanır',

    'param.teethCount': 'Diş Sayısı (z)',
    'param.teethCount.unit': 'diş',
    'param.teethCount.tip': 'Dişli çark üzerindeki toplam evolvent diş sayısı.',
    'param.teethCount.formula': 'z = \\frac{d}{m}',
    'param.teethCount.info': 'Standart düz dişlilerde 20° kavrama açısıyla alt kesilme (undercut) olmadan çalışabilecek minimum diş sayısı teorik olarak 17\'dir. Daha az diş için pozitif profil kaydırma (x > 0) önerilir.',

    'param.module': 'Modül (m)',
    'param.module.unit': 'mm',
    'param.module.tip': 'ISO standardı diş büyüklüğü birimi. Birbirine geçen dişlilerin modülleri eşit olmalıdır.',
    'param.module.formula': 'm = \\frac{d}{z} = \\frac{p}{\\pi}',
    'param.module.info': 'Modül büyüdükçe diş kalınlığı ve taşıyabileceği mekanik tork artar. FDM 3D yazıcılarda 0.4mm nozül için m ≥ 1.0 mm önerilir; 0.2mm nozülle m = 0.5 mm hassas pinyonlar üretilebilir.',

    'param.targetPitchDiameter': 'Hedef Bölüm Dairesi Çapı (d)',
    'param.targetPitchDiameter.unit': 'mm',
    'param.targetPitchDiameter.tip': 'İki dişlinin teorik olarak birbiri üzerinde kaymadan yuvarlandığı kinematik temas çapı.',
    'param.targetPitchDiameter.formula': 'd = m \\cdot z',
    'param.targetPitchDiameter.info': 'Dişliler arası eksen mesafesi a = (d1 + d2) / 2 formülüyle doğrudan bölüm çapına bağlıdır.',

    'param.targetOuterDiameter': 'Hedef Dış Çap (da)',
    'param.targetOuterDiameter.unit': 'mm',
    'param.targetOuterDiameter.tip': 'Kumpas ile doğrudan ölçülen uçtan uca maksimum tepe çapı.',
    'param.targetOuterDiameter.formula': 'd_a = d + 2 \\cdot (h_a^* + x) \\cdot m',
    'param.targetOuterDiameter.info': 'Mevcut kırık bir dişliyi kumpasla ölçüp tersine mühendislikle yeniden üretirken en kullanışlı referanstır.',

    'param.thickness': 'Dişli Kalınlığı (b)',
    'param.thickness.unit': 'mm',
    'param.thickness.tip': 'Dişlinin eksenel yüz genişliği.',
    'param.thickness.formula': 'b \\approx (8 \\dots 12) \\cdot m',
    'param.thickness.info': 'Endüstriyel standartlarda yüz genişliği b = 8·m ile 12·m arasında seçilir. Daha kalın dişliler daha yüksek burulma torkunu dağıtır.',

    'param.helixAngleDeg': 'Helis Açısı (β)',
    'param.helixAngleDeg.unit': '°',
    'param.helixAngleDeg.tip': 'Dişlerin eksene göre eğim açısı. Sürekli temas ve sessiz çalışma sağlar.',
    'param.helixAngleDeg.formula': 'd_b = \\frac{m \\cdot z}{\\cos \\beta}',
    'param.helixAngleDeg.info': '3D baskıda 15°-25° arası helis açısı idealdir. Çavuş dişlide eksenel itme kuvveti sıfırlanır, destek malzemesi gerekmez.',

    'param.boreType': 'Merkez Delik / Mil Bağlantı Tipi',
    'param.boreType.tip': 'Şaft montajı için geometrik yuva şekli.',
    'param.boreType.formula': 'r_{bore} = \\frac{d_{bore}}{2} + c_{bore}',
    'param.boreType.info': 'DIN 6885-1 kama kanallı şaftlar endüstriyel redüktörler için, Tek D-Şaft (NEMA 17) ise 3D yazıcı step motorları için standarttır.',

    'param.boreDiameter': 'Merkez Delik Çapı (d_bore)',
    'param.boreDiameter.unit': 'mm',
    'param.boreDiameter.tip': 'Milin nominal dış çapı (örn. 5mm, 8mm, 10mm).',
    'param.boreDiameter.formula': '\\varnothing = d_{bore} + 2 \\cdot c_{bore}',
    'param.boreDiameter.info': 'FDM 3D yazıcılarda iç delikler nozül yayılması nedeniyle 0.1 - 0.2 mm daha dar çıkar. Bunu telafi etmek için Delik Toleransı payı eklenir.',

    'param.keywayWidth': 'Kama Genişliği (b_kama)',
    'param.keywayWidth.unit': 'mm',
    'param.keywayWidth.tip': 'DIN 6885 standardı paralel kama genişliği.',
    'param.keywayWidth.formula': 'b_{kama} \\in \\text{DIN 6885 Tablosu}',
    'param.keywayWidth.info': 'Ø8-10mm mil için 3mm kama, Ø10-12mm mil için 4mm kama, Ø12-17mm mil için 5mm kama genişliği ISO/DIN standart standardıdır.',

    'param.keywayDepth': 'Kama Derinliği (t2)',
    'param.keywayDepth.unit': 'mm',
    'param.keywayDepth.tip': 'Mil deliği yüzeyinden içeriye doğru yuva derinliği.',
    'param.keywayDepth.formula': 't_2 \\approx 0.15 \\dots 0.20 \\cdot d_{bore}',
    'param.keywayDepth.info': 'Göbekteki kama kanalı derinliği t2, tork aktarımı sırasında kamanın kaymasını veya yuvanın yırtılmasını engeller.',

    'param.webStyle': 'Gövde Tasarım Tipi (Web Style)',
    'param.webStyle.tip': 'Dişli gövdesinin hafifletme mimarisi.',
    'param.webStyle.formula': 'V_{tasarruf} = 30\\% \\dots 65\\%',
    'param.webStyle.info': 'Gövde çökertmesi ve hafifletme delikleri 3D baskı süresini ve filament sarfiyatını %50\'ye varan oranda azaltır.',

    'param.hubDiameter': 'Merkez Göbek Dış Çapı (d_hub)',
    'param.hubDiameter.unit': 'mm',
    'param.hubDiameter.tip': 'Merkez deliğin etrafındaki masif takviye bileziği.',
    'param.hubDiameter.formula': 'd_{hub} \\ge 1.6 \\dots 1.8 \\cdot d_{bore}',
    'param.hubDiameter.info': 'Mil bağlantısında kırılmayı önlemek için göbek çapı delik çapının en az 1.6 katı olmalıdır.',

    'param.hubTopExtension': 'Üst Göbek Çıkıntısı (Boss)',
    'param.hubTopExtension.unit': 'mm',
    'param.hubTopExtension.tip': 'Setuskur (M3/M4 vida) takmak veya rulman dayamak için yükseltilmiş göbek boynu.',
    'param.hubTopExtension.formula': 'L_{boss} \\ge 1.2 \\cdot \\varnothing_{vida}',
    'param.hubTopExtension.info': 'M3 veya M4 setuskur ile mili sıkıştırmak için en az 4-6 mm göbek boyu önerilir.',

    'param.pressureAngleDeg': 'Kavrama Açısı (α)',
    'param.pressureAngleDeg.unit': '°',
    'param.pressureAngleDeg.tip': 'Diş profilinin temas doğrusu açısı.',
    'param.pressureAngleDeg.formula': 'd_b = d \\cdot \\cos(\\alpha)',
    'param.pressureAngleDeg.info': 'ISO standardı 20°\'dir. Ağır yük ve yüksek tork iletiminde diş dibini kalınlaştırmak için 25° tercih edilir.',

    'param.profileShift': 'Profil Kaydırma (x)',
    'param.profileShift.unit': 'oran',
    'param.profileShift.tip': 'Diş profilini dışarı veya içeri kaydırarak z < 17 pinyonlarda dipten kesilmeyi önleme katsayısı.',
    'param.profileShift.formula': 'x_{min} = 1 - \\frac{z \\cdot \\sin^2(\\alpha)}{2 \\cdot h_a^*}',
    'param.profileShift.info': '12 dişli bir pinyonda x = +0.25 verilerek diş kökü kalınlaştırılır ve kırılma riski %40 azaltılır.',

    'param.backlashMm': '3D Baskı Backlash (jt)',
    'param.backlashMm.unit': 'mm',
    'param.backlashMm.tip': 'FDM baskıda katman taşmasını telafi etmek için diş kalınlığından düşülen pay.',
    'param.backlashMm.formula': 's = \\frac{\\pi \\cdot m}{2} + 2 \\cdot x \\cdot m \\cdot \\tan(\\alpha) - j_t',
    'param.backlashMm.info': 'Önerilen FDM toleransları: PLA için 0.15mm, PETG için 0.20mm, ABS/ASA için 0.22mm, Naylon için 0.25mm.',

    'param.boreClearanceMm': 'Delik Toleransı (Yarıçap)',
    'param.boreClearanceMm.unit': 'mm',
    'param.boreClearanceMm.tip': 'Deliğin mil üzerine rahat geçmesi için yarıçapa eklenen tolerans payı.',
    'param.boreClearanceMm.formula': 'r_{gerçek} = r_{nominal} + c_{bore}',
    'param.boreClearanceMm.info': 'FDM baskılarda +0.10 ile +0.15 mm delik payı milin çekiç vurmadan rahat geçmesini sağlar.',

    'param.filamentMaterial': 'Filament Malzemesi',
    'param.filamentMaterial.tip': 'Mekanik güç ve ağırlık hesabı için malzeme cinsi.',
    'param.filamentMaterial.formula': 'm_{ağırlık} = V \\cdot \\rho_{materyal} \\cdot \\text{Doluluk}\\%',
    'param.filamentMaterial.info': 'Dişli mekanizmalarında yüksek aşınma direnci için PETG veya Naylon (PA12/PA-CF) mükemmel sonuç verir.',

    'param.projectName': 'Proje / Dişli Adı',
    'param.projectName.placeholder': 'Örn: Z24 M2.0 Redüktör Pinyonu',

    // Özet Adımı
    'wizard.summary.pitch_dia': 'Bölüm Çapı (d)',
    'wizard.summary.outer_dia': 'Diş Üstü Dış Çap (da)',
    'wizard.summary.root_dia': 'Diş Dibi Çapı (df)',
    'wizard.summary.base_dia': 'Temel Dairesi Çapı (db)',
    'wizard.summary.circular_pitch': 'Dairesel Hatve (p)',
    'wizard.summary.tooth_thickness': 'Diş Kalınlığı (s)',
    'wizard.summary.whole_depth': 'Toplam Diş Derinliği (h)',
    'wizard.summary.contact_ratio': 'Kavrama Oranı (εα)',
    'wizard.summary.est_weight': 'Tahmini Ağırlık',
    'wizard.summary.manifold_status': 'Topoloji Durumu',
    'wizard.summary.manifold_ok': '%100 Su Geçirmez (Watertight 2-Manifold)',

    // Bildirimler
    'toast.wizard_created': 'Yeni dişli tasarımı başarıyla oluşturuldu ve sahneye aktarıldı!',
    'toast.wizard_created_title': 'Tasarım Hazır',
    'toast.lang_changed': 'Arayüz dili güncellendi.',
  },

  en: {
    // Menu & General
    'app.title': 'GearForge 3D',
    'app.subtitle': 'ISO 21771 Involute CAD & 3D Printer Slicer Studio',
    'menu.file': '📁 File',
    'menu.new_gear': 'New Gear Design',
    'menu.wizard': '🧙‍♂️ Gear Creation Wizard',
    'menu.open_saved': 'Open Saved Projects (LocalStorage)...',
    'menu.save': 'Save Project',
    'menu.save_as': 'Save As (LocalStorage)...',
    'menu.import_json': 'Import JSON Settings...',
    'menu.export_json': 'Export Settings as JSON',
    'menu.reset_default': 'Reset to Factory Defaults',
    'menu.projects': '📂 Projects',
    'menu.export': '🚀 Export',
    'menu.export_stl_binary': 'Download STL (Binary STL - 3D Printing)',
    'menu.export_stl_ascii': 'Download ASCII STL (.stl)',
    'menu.export_obj': 'Download Wavefront OBJ (.obj)',
    'menu.export_mating': 'Download Mating Pinion STL',
    'menu.screenshot': 'Capture 3D Viewport Screenshot (.png)',
    'menu.presets': '⚙️ Presets',
    'menu.view': '👁️ View',
    'menu.help': '❓ Help',
    'menu.about': 'About GearForge 3D & Trunçgil Technology',
    'menu.iso_guide': 'ISO 21771 & 3D Print Engineering Guide',
    'menu.shortcuts': 'Keyboard Shortcuts',
    'quick.new': '➕ New',
    'quick.projects': '📂 Projects',
    'quick.save': '💾 Save',
    'quick.export_stl': '⬇ STL Download',
    'badge.active_project': 'New Gear Design',
    'badge.dirty': '● Modified',
    'offline.badge': 'Offline CAD',

    // Wizard General
    'wizard.title': 'Gear Creation Wizard',
    'wizard.subtitle': 'Design your parametric, 3D printable, watertight ISO 21771 gear in 5 guided steps.',
    'wizard.step_counter': 'Step {current} of {total}',
    'wizard.btn_cancel': 'Cancel',
    'wizard.btn_back': '◀ Back',
    'wizard.btn_next': 'Next ▶',
    'wizard.btn_create': '🚀 Create Gear & Open in Stage',
    'wizard.startup_checkbox': 'Show this wizard automatically on application launch',
    'wizard.info_btn_title': 'Click for engineering formula and 3D printing details',
    'wizard.formula_label': 'Engineering Formula:',
    'wizard.explanation_label': 'Engineering Detail & Standard:',
    'wizard.inspect_2d_title': 'Inspect 2D CAD Blueprint Drawing',
    'wizard.cad_badge': '2D CAD PREVIEW',
    'wizard.cad_inspect_modal_title': '2D CAD Technical Blueprint & Dimension Inspection',
    'wizard.view_3d': '🧊 3D Model',
    'wizard.view_2d': '📐 2D CAD',
    'wizard.view_dual': '🔲 Dual View',
    'wizard.toolbar_rotate': 'Auto Rotate',
    'wizard.toolbar_wireframe': 'Wireframe',
    'wizard.toolbar_center': 'Reset Camera',


    // Wizard Steps
    'wizard.step1.tab': '1. Sizing & Type',
    'wizard.step1.title': '1. Gear Type and Key Dimensions',
    'wizard.step1.desc': 'Select mechanical gear architecture, teeth count, module, and face width.',

    'wizard.step2.tab': '2. Bore & Shaft',
    'wizard.step2.title': '2. Center Bore & Shaft Coupling',
    'wizard.step2.desc': 'Configure shaft interface (Circular, DIN 6885 Keyway, or Stepper D-Shaft).',

    'wizard.step3.tab': '3. Hub & Web',
    'wizard.step3.title': '3. Hub & Weight Lightening',
    'wizard.step3.desc': 'Add recessed web, spokes, or lightening holes for filament savings and rigidity.',

    'wizard.step4.tab': '4. Involute & FDM',
    'wizard.step4.title': '4. Involute Profile & 3D Print Tolerances',
    'wizard.step4.desc': 'Calibrate pressure angle, profile shift, filament shrinkage, and FDM backlash.',

    'wizard.step5.tab': '5. Review & Create',
    'wizard.step5.title': '5. Technical Verification & Finalize',
    'wizard.step5.desc': 'Inspect calculated ISO 21771 gear metrics and deploy project to 3D workspace.',

    // Parameters and Formulas (EN)
    'param.gearType': 'Gear Architecture',
    'param.gearType.tip': 'Axial and kinematic tooth orientation architecture.',
    'param.gearType.spur': 'Spur Gear (Straight Teeth)',
    'param.gearType.helical': 'Helical Gear (Angled Flanks)',
    'param.gearType.herringbone': 'Herringbone (Double Helical V)',
    'param.gearType.bevel': 'Bevel Taper Gear',
    'param.gearType.internal': 'Internal Ring Gear',

    'param.sizingMode': 'Sizing Priority Mode',
    'param.sizingMode.tip': 'Choose which fundamental parameter remains fixed during calculations.',
    'param.sizingMode.module': 'Module (m) + Teeth Count (z) ➔ Diameters Calculated',
    'param.sizingMode.pitch': 'Pitch Diameter (d) + Teeth Count ➔ Module Calculated',
    'param.sizingMode.outer': 'Outer Diameter (da) + Teeth Count ➔ Module Calculated',

    'param.teethCount': 'Teeth Count (z)',
    'param.teethCount.unit': 'teeth',
    'param.teethCount.tip': 'Total number of involute teeth around the pitch circle.',
    'param.teethCount.formula': 'z = \\frac{d}{m}',
    'param.teethCount.info': 'In standard spur gears with 20° pressure angle, the theoretical minimum number of teeth without undercut is 17. For lower teeth counts, a positive profile shift (x > 0) is recommended.',

    'param.module': 'Module (m)',
    'param.module.unit': 'mm',
    'param.module.tip': 'Standard ISO tooth size factor. Mating gears must share identical modules.',
    'param.module.formula': 'm = \\frac{d}{z} = \\frac{p}{\\pi}',
    'param.module.info': 'Higher module increases tooth beam strength and torque capacity. For FDM with 0.4mm nozzle, m ≥ 1.0 mm is ideal; with a 0.2mm nozzle, m = 0.5 mm pinions print reliably.',

    'param.targetPitchDiameter': 'Pitch Diameter (d)',
    'param.targetPitchDiameter.unit': 'mm',
    'param.targetPitchDiameter.tip': 'Theoretical kinematic rolling circle diameter where mating gears touch without slip.',
    'param.targetPitchDiameter.formula': 'd = m \\cdot z',
    'param.targetPitchDiameter.info': 'Center distance between mating gears directly follows a = (d1 + d2) / 2.',

    'param.targetOuterDiameter': 'Outer Tip Diameter (da)',
    'param.targetOuterDiameter.unit': 'mm',
    'param.targetOuterDiameter.tip': 'Overall tip-to-tip outer diameter measured directly with a caliper.',
    'param.targetOuterDiameter.formula': 'd_a = d + 2 \\cdot (h_a^* + x) \\cdot m',
    'param.targetOuterDiameter.info': 'Essential for reverse-engineering broken gears with physical calipers.',

    'param.thickness': 'Face Width / Thickness (b)',
    'param.thickness.unit': 'mm',
    'param.thickness.tip': 'Axial tooth face width along the gear cylinder axis.',
    'param.thickness.formula': 'b \\approx (8 \\dots 12) \\cdot m',
    'param.thickness.info': 'Industrial standard recommends face width between 8·m and 12·m. Wider gears distribute shear torque more safely across 3D printed layer lines.',

    'param.helixAngleDeg': 'Helix Angle (β)',
    'param.helixAngleDeg.unit': '°',
    'param.helixAngleDeg.tip': 'Tooth incline angle relative to rotational axis. Ensures smooth, quiet power transmission.',
    'param.helixAngleDeg.formula': 'd_b = \\frac{m \\cdot z}{\\cos \\beta}',
    'param.helixAngleDeg.info': '15°-25° helix angle is recommended for 3D printing. Herringbone (double helical) cancels out axial thrust bearing loads.',

    'param.boreType': 'Bore & Shaft Coupling',
    'param.boreType.tip': 'Geometric interface for motor shaft, keyway, or axle.',
    'param.boreType.formula': 'r_{bore} = \\frac{d_{bore}}{2} + c_{bore}',
    'param.boreType.info': 'DIN 6885-1 keyways suit industrial gearboxes; Single D-Shaft fits standard NEMA 17 stepper motors.',

    'param.boreDiameter': 'Bore Diameter (d_bore)',
    'param.boreDiameter.unit': 'mm',
    'param.boreDiameter.tip': 'Nominal shaft outer diameter (e.g. 5mm, 8mm, 10mm).',
    'param.boreDiameter.formula': '\\varnothing = d_{bore} + 2 \\cdot c_{bore}',
    'param.boreDiameter.info': 'In FDM printing, internal holes shrink by ~0.1 - 0.2 mm due to polymer contraction. Bore clearance compensates for this.',

    'param.keywayWidth': 'Keyway Width (b_key)',
    'param.keywayWidth.unit': 'mm',
    'param.keywayWidth.tip': 'Parallel keyway width according to DIN 6885-1.',
    'param.keywayWidth.formula': 'b_{key} \\in \\text{DIN 6885}',
    'param.keywayWidth.info': 'Ø8-10mm shaft uses 3mm key; Ø10-12mm uses 4mm key; Ø12-17mm uses 5mm key.',

    'param.keywayDepth': 'Keyway Depth (t2)',
    'param.keywayDepth.unit': 'mm',
    'param.keywayDepth.tip': 'Keyway groove cut depth into the bore wall.',
    'param.keywayDepth.formula': 't_2 \\approx 0.15 \\dots 0.20 \\cdot d_{bore}',
    'param.keywayDepth.info': 'Standard hub keyway depth prevents key rollover under continuous or shock motor torque.',

    'param.webStyle': 'Web & Body Style',
    'param.webStyle.tip': 'Lightening geometry of the inner gear body.',
    'param.webStyle.formula': 'V_{saved} = 30\\% \\dots 65\\%',
    'param.webStyle.info': 'Recessed webs and holes reduce print time and filament usage by up to 50% without compromising tooth root rigidity.',

    'param.hubDiameter': 'Hub Outer Diameter (d_hub)',
    'param.hubDiameter.unit': 'mm',
    'param.hubDiameter.tip': 'Solid boss collar reinforcing the shaft bore.',
    'param.hubDiameter.formula': 'd_{hub} \\ge 1.6 \\dots 1.8 \\cdot d_{bore}',
    'param.hubDiameter.info': 'Hub diameter should be at least 1.6 times the bore diameter to withstand radial shaft stresses.',

    'param.hubTopExtension': 'Hub Boss Extension',
    'param.hubTopExtension.unit': 'mm',
    'param.hubTopExtension.tip': 'Axial collar protrusion for set screw (M3/M4) or bearing positioning.',
    'param.hubTopExtension.formula': 'L_{boss} \\ge 1.2 \\cdot \\varnothing_{screw}',
    'param.hubTopExtension.info': 'A 4-6 mm boss provides sufficient thread depth for metal heat-set inserts or direct tapping.',

    'param.pressureAngleDeg': 'Pressure Angle (α)',
    'param.pressureAngleDeg.unit': '°',
    'param.pressureAngleDeg.tip': 'Angle of the tooth contact normal line.',
    'param.pressureAngleDeg.formula': 'd_b = d \\cdot \\cos(\\alpha)',
    'param.pressureAngleDeg.info': '20° is the universal ISO standard. 25° provides thicker tooth roots for extreme torque applications.',

    'param.profileShift': 'Profile Shift (x)',
    'param.profileShift.unit': 'factor',
    'param.profileShift.tip': 'Radial tool displacement coefficient preventing undercut on pinions with z < 17.',
    'param.profileShift.formula': 'x_{min} = 1 - \\frac{z \\cdot \\sin^2(\\alpha)}{2 \\cdot h_a^*}',
    'param.profileShift.info': 'Applying x = +0.25 on a 12-tooth pinion thickens the root and decreases tooth bending failure by 40%.',

    'param.backlashMm': '3D Print Backlash (jt)',
    'param.backlashMm.unit': 'mm',
    'param.backlashMm.tip': 'Tooth thickness reduction compensating for FDM nozzle flare and shrinkage.',
    'param.backlashMm.formula': 's = \\frac{\\pi \\cdot m}{2} + 2 \\cdot x \\cdot m \\cdot \\tan(\\alpha) - j_t',
    'param.backlashMm.info': 'Recommended FDM backlash: 0.15mm for PLA, 0.20mm for PETG, 0.22mm for ABS/ASA, 0.25mm for Nylon.',

    'param.boreClearanceMm': 'Bore Clearance (Radius)',
    'param.boreClearanceMm.unit': 'mm',
    'param.boreClearanceMm.tip': 'Radial expansion offset enabling snug slide fit over steel shafts.',
    'param.boreClearanceMm.formula': 'r_{real} = r_{nominal} + c_{bore}',
    'param.boreClearanceMm.info': 'A +0.10 to +0.15 mm radial offset allows smooth sliding without reaming or hammering.',

    'param.filamentMaterial': 'Filament Material',
    'param.filamentMaterial.tip': 'Filament polymer grade for density and strength calculations.',
    'param.filamentMaterial.formula': 'm = V \\cdot \\rho_{material} \\cdot \\text{Infill}\\%',
    'param.filamentMaterial.info': 'PETG and Nylon (PA12) deliver exceptional wear resistance and self-lubricating low friction for gearboxes.',

    'param.projectName': 'Project / Gear Name',
    'param.projectName.placeholder': 'e.g. Z24 M2.0 Gearbox Pinion',

    // Summary Step
    'wizard.summary.pitch_dia': 'Pitch Diameter (d)',
    'wizard.summary.outer_dia': 'Tip Diameter (da)',
    'wizard.summary.root_dia': 'Root Diameter (df)',
    'wizard.summary.base_dia': 'Base Circle Diameter (db)',
    'wizard.summary.circular_pitch': 'Circular Pitch (p)',
    'wizard.summary.tooth_thickness': 'Tooth Thickness (s)',
    'wizard.summary.whole_depth': 'Whole Tooth Depth (h)',
    'wizard.summary.contact_ratio': 'Contact Ratio (εα)',
    'wizard.summary.est_weight': 'Estimated Weight',
    'wizard.summary.manifold_status': 'Mesh Topology',
    'wizard.summary.manifold_ok': '100% Watertight (2-Manifold Slicer-Ready)',

    // Notifications
    'toast.wizard_created': 'New gear design created and loaded into the 3D stage!',
    'toast.wizard_created_title': 'Design Ready',
    'toast.lang_changed': 'Language switched successfully.',
  },

  de: {
    // Menu & General
    'app.title': 'GearForge 3D',
    'app.subtitle': 'ISO 21771 Evolventen-CAD & 3D-Drucker Slicer Studio',
    'menu.file': '📁 Datei',
    'menu.new_gear': 'Neues Zahnraddesign',
    'menu.wizard': '🧙‍♂️ Zahnrad-Assistent',
    'menu.open_saved': 'Gespeicherte Projekte öffnen (LocalStorage)...',
    'menu.save': 'Projekt speichern',
    'menu.save_as': 'Speichern unter (LocalStorage)...',
    'menu.import_json': 'JSON-Einstellungen laden...',
    'menu.export_json': 'Einstellungen als JSON exportieren',
    'menu.reset_default': 'Auf Werkseinstellungen zurücksetzen',
    'menu.projects': '📂 Projekte',
    'menu.export': '🚀 Exportieren',
    'menu.export_stl_binary': 'STL herunterladen (Binäres STL - 3D-Druck)',
    'menu.export_stl_ascii': 'ASCII-STL herunterladen (.stl)',
    'menu.export_obj': 'Wavefront OBJ herunterladen (.obj)',
    'menu.export_mating': 'Gegenritzel-STL herunterladen',
    'menu.screenshot': '3D-Ansicht als Screenshot (.png)',
    'menu.presets': '⚙️ Vorlagen',
    'menu.view': '👁️ Ansicht',
    'menu.help': '❓ Hilfe',
    'menu.about': 'Über GearForge 3D & Trunçgil Technology',
    'menu.iso_guide': 'ISO 21771 & 3D-Druck Leitfaden',
    'menu.shortcuts': 'Tastaturkürzel',
    'quick.new': '➕ Neu',
    'quick.projects': '📂 Projekte',
    'quick.save': '💾 Speichern',
    'quick.export_stl': '⬇ STL-Download',
    'badge.active_project': 'Neues Zahnrad',
    'badge.dirty': '● Geändert',
    'offline.badge': 'Offline-CAD',

    // Wizard General
    'wizard.title': 'Zahnrad-Konstruktionsassistent',
    'wizard.subtitle': 'Erstellen Sie Ihr parametrisches, 3D-druckbares und wasserdichtes ISO 21771 Zahnrad in 5 Schritten.',
    'wizard.step_counter': 'Schritt {current} von {total}',
    'wizard.btn_cancel': 'Abbrechen',
    'wizard.btn_back': '◀ Zurück',
    'wizard.btn_next': 'Weiter ▶',
    'wizard.btn_create': '🚀 Zahnrad erstellen & in 3D laden',
    'wizard.startup_checkbox': 'Assistenten beim Start automatisch öffnen',
    'wizard.info_btn_title': 'Klicken für Ingenieurformel und 3D-Druck-Tipps',
    'wizard.formula_label': 'Ingenieurformel:',
    'wizard.explanation_label': 'Technische Erklärung & Norm:',
    'wizard.inspect_2d_title': '2D-CAD-Konstruktionszeichnung vergrößern',
    'wizard.cad_badge': '2D-CAD-VORSCHAU',
    'wizard.cad_inspect_modal_title': '2D-CAD Technische Zeichnung & Bemaßung',
    'wizard.view_3d': '🧊 3D-Modell',
    'wizard.view_2d': '📐 2D-CAD',
    'wizard.view_dual': '🔲 Dual-Ansicht',
    'wizard.toolbar_rotate': 'Auto-Drehung',
    'wizard.toolbar_wireframe': 'Drahtgitter',
    'wizard.toolbar_center': 'Kamera zurücksetzen',


    // Wizard Steps
    'wizard.step1.tab': '1. Typ & Maße',
    'wizard.step1.title': '1. Zahnradtyp und Hauptabmessungen',
    'wizard.step1.desc': 'Wählen Sie die Zahnradarchitektur, Zähnezahl, Modul und Zahnbreite.',

    'wizard.step2.tab': '2. Bohrung & Welle',
    'wizard.step2.title': '2. Wellenbohrung & Passfeder',
    'wizard.step2.desc': 'Konfigurieren Sie die Wellenaufnahme (Rund, DIN 6885 Passfeder oder D-Welle).',

    'wizard.step3.tab': '3. Nabe & Steg',
    'wizard.step3.title': '3. Nabe & Gewichtsoptimierung',
    'wizard.step3.desc': 'Fügen Sie Aussparungen, Speichen oder Erleichterungsbohrungen für Filamentersparnis hinzu.',

    'wizard.step4.tab': '4. Evolvente & FDM',
    'wizard.step4.title': '4. Evolventenprofil & 3D-Druck-Toleranzen',
    'wizard.step4.desc': 'Kalibrieren Sie Eingriffswinkel, Profilverschiebung und FDM-Zahnflankenspiel (Backlash).',

    'wizard.step5.tab': '5. Zusammenfassung',
    'wizard.step5.title': '5. Technische Überprüfung & Erstellung',
    'wizard.step5.desc': 'Prüfen Sie die berechneten ISO 21771 Kennwerte und übernehmen Sie das Zahnrad in die 3D-Bühne.',

    // Parameters and Formulas (DE)
    'param.gearType': 'Zahnradtyp',
    'param.gearType.tip': 'Kinematische und axiale Zahnausrichtung.',
    'param.gearType.spur': 'Geradstirnrad (Spur Gear)',
    'param.gearType.helical': 'Schrägzahnrad (Helical)',
    'param.gearType.herringbone': 'Pfeilzahnrad (Doppelschräg)',
    'param.gearType.bevel': 'Kegelzahnrad (Bevel)',
    'param.gearType.internal': 'Innenzahnrad (Hohlrad)',

    'param.sizingMode': 'Dimensionierungsmodus',
    'param.sizingMode.tip': 'Festlegung des primären Konstruktionsparameters.',
    'param.sizingMode.module': 'Modul (m) + Zähnezahl (z) ➔ Durchmesser berechnet',
    'param.sizingMode.pitch': 'Teilkreis (d) + Zähnezahl ➔ Modul berechnet',
    'param.sizingMode.outer': 'Kopfkreis (da) + Zähnezahl ➔ Modul berechnet',

    'param.teethCount': 'Zähnezahl (z)',
    'param.teethCount.unit': 'Zähne',
    'param.teethCount.tip': 'Gesamtzahl der Evolventenzähne.',
    'param.teethCount.formula': 'z = \\frac{d}{m}',
    'param.teethCount.info': 'Bei geradverzahnten Rädern mit 20° Eingriffswinkel beträgt die Grenzzähnezahl gegen Unterschnitt z = 17. Bei kleineren Zähnezahlen ist eine positive Profilverschiebung (x > 0) nötig.',

    'param.module': 'Modul (m)',
    'param.module.unit': 'mm',
    'param.module.tip': 'Genormte Zahngröße nach DIN 867 / ISO. Gepaarte Zahnräder müssen dasselbe Modul aufweisen.',
    'param.module.formula': 'm = \\frac{d}{z} = \\frac{p}{\\pi}',
    'param.module.info': 'Größerer Modul erhöht die Zahnfußfestigkeit und das übertragbare Drehmoment. Für FDM mit 0.4mm Düse wird m ≥ 1.0 mm empfohlen.',

    'param.targetPitchDiameter': 'Teilkreisdurchmesser (d)',
    'param.targetPitchDiameter.unit': 'mm',
    'param.targetPitchDiameter.tip': 'Theoretischer Wälzkreisdurchmesser ohne Schlupf.',
    'param.targetPitchDiameter.formula': 'd = m \\cdot z',
    'param.targetPitchDiameter.info': 'Der Achsabstand a berechnet sich direkt aus a = (d1 + d2) / 2.',

    'param.targetOuterDiameter': 'Kopfkreisdurchmesser (da)',
    'param.targetOuterDiameter.unit': 'mm',
    'param.targetOuterDiameter.tip': 'Mit dem Messschieber direkt messbarer Außendurchmesser.',
    'param.targetOuterDiameter.formula': 'd_a = d + 2 \\cdot (h_a^* + x) \\cdot m',
    'param.targetOuterDiameter.info': 'Ideal für das Reverse Engineering vorhandener Bauteile.',

    'param.thickness': 'Zahnbreite (b)',
    'param.thickness.unit': 'mm',
    'param.thickness.tip': 'Axiale Stirnradbreite entlang der Zylinderachse.',
    'param.thickness.formula': 'b \\approx (8 \\dots 12) \\cdot m',
    'param.thickness.info': 'Im Maschinenbau üblich: b = 8·m bis 12·m. Breitere Räder verteilen Scherkräfte besser über die Schichten des 3D-Drucks.',

    'param.helixAngleDeg': 'Schrägungswinkel (β)',
    'param.helixAngleDeg.unit': '°',
    'param.helixAngleDeg.tip': 'Flankenneigungswinkel für sanften, geräuscharmen Zahneingriff.',
    'param.helixAngleDeg.formula': 'd_b = \\frac{m \\cdot z}{\\cos \\beta}',
    'param.helixAngleDeg.info': '15°-25° ist ideal für FDM-Druck. Pfeilverzahnung eliminiert Axialkräfte vollständig.',

    'param.boreType': 'Wellenverbindung',
    'param.boreType.tip': 'Verbindungsgeometrie zur Kraftübertragung.',
    'param.boreType.formula': 'r_{bore} = \\frac{d_{bore}}{2} + c_{bore}',
    'param.boreType.info': 'DIN 6885 Passfedern für Getriebe; D-Welle für NEMA 17 Schrittmotoren.',

    'param.boreDiameter': 'Bohrungsdurchmesser (d_bore)',
    'param.boreDiameter.unit': 'mm',
    'param.boreDiameter.tip': 'Nenndurchmesser der Welle (z.B. 5mm, 8mm, 10mm).',
    'param.boreDiameter.formula': '\\varnothing = d_{bore} + 2 \\cdot c_{bore}',
    'param.boreDiameter.info': 'Innenlöcher schrumpfen beim FDM-Druck materialbedingt um ca. 0.1-0.2 mm.',

    'param.keywayWidth': 'Nutbreite (b_nut)',
    'param.keywayWidth.unit': 'mm',
    'param.keywayWidth.tip': 'Passfedernutbreite nach DIN 6885-1.',
    'param.keywayWidth.formula': 'b_{nut} \\in \\text{DIN 6885}',
    'param.keywayWidth.info': 'Ø8-10mm Welle: 3mm Nut; Ø10-12mm Welle: 4mm Nut; Ø12-17mm: 5mm Nut.',

    'param.keywayDepth': 'Nuttiefe (t2)',
    'param.keywayDepth.unit': 'mm',
    'param.keywayDepth.tip': 'Einstichtiefe der Naben-Passfedernut.',
    'param.keywayDepth.formula': 't_2 \\approx 0.15 \\dots 0.20 \\cdot d_{bore}',
    'param.keywayDepth.info': 'Verhindert das Ausreißen der Passfeder unter Last.',

    'param.webStyle': 'Stegdesign (Web Style)',
    'param.webStyle.tip': 'Gewichtsreduzierungsgeometrie der Radscheibe.',
    'param.webStyle.formula': 'V_{ersparnis} = 30\\% \\dots 65\\%',
    'param.webStyle.info': 'Aussparungen sparen bis zu 50% Druckzeit und Material bei voller Zahnfußstabilität.',

    'param.hubDiameter': 'Nabendurchmesser (d_hub)',
    'param.hubDiameter.unit': 'mm',
    'param.hubDiameter.tip': 'Massiver Verstärkungskragen um die Bohrung.',
    'param.hubDiameter.formula': 'd_{hub} \\ge 1.6 \\dots 1.8 \\cdot d_{bore}',
    'param.hubDiameter.info': 'Sollte mindestens das 1.6-fache des Wellendurchmessers betragen.',

    'param.hubTopExtension': 'Nabenansatz (Boss)',
    'param.hubTopExtension.unit': 'mm',
    'param.hubTopExtension.tip': 'Axialer Ansatz für Madenschrauben (M3/M4) oder Lagerfixierung.',
    'param.hubTopExtension.formula': 'L_{boss} \\ge 1.2 \\cdot \\varnothing_{schraube}',
    'param.hubTopExtension.info': '4-6 mm bieten ausreichend Gewindetiefe für Gewindeeinsätze.',

    'param.pressureAngleDeg': 'Eingriffswinkel (α)',
    'param.pressureAngleDeg.unit': '°',
    'param.pressureAngleDeg.tip': 'Winkel der Eingriffslinie nach DIN 867.',
    'param.pressureAngleDeg.formula': 'd_b = d \\cdot \\cos(\\alpha)',
    'param.pressureAngleDeg.info': '20° ist ISO-Standard. 25° bietet dickere Zahnfüße für extreme Drehmomente.',

    'param.profileShift': 'Profilverschiebung (x)',
    'param.profileShift.unit': 'Faktor',
    'param.profileShift.tip': 'Vermeidet Unterschnitt bei Ritzeln mit z < 17.',
    'param.profileShift.formula': 'x_{min} = 1 - \\frac{z \\cdot \\sin^2(\\alpha)}{2 \\cdot h_a^*}',
    'param.profileShift.info': 'x = +0.25 bei 12 Zähnen senkt die Bruchgefahr am Zahnfuß um 40%.',

    'param.backlashMm': '3D-Druck Zahnflankenspiel (jt)',
    'param.backlashMm.unit': 'mm',
    'param.backlashMm.tip': 'Flankenspiel zur Kompensation von FDM-Extrusionsaufweitung.',
    'param.backlashMm.formula': 's = \\frac{\\pi \\cdot m}{2} + 2 \\cdot x \\cdot m \\cdot \\tan(\\alpha) - j_t',
    'param.backlashMm.info': 'Empfohlen: 0.15mm für PLA, 0.20mm für PETG, 0.22mm für ABS/ASA, 0.25mm für Nylon.',

    'param.boreClearanceMm': 'Bohrungstoleranz (Radius)',
    'param.boreClearanceMm.unit': 'mm',
    'param.boreClearanceMm.tip': 'Radiale Passungserweiterung für leichtes Aufstecken auf Stahlwellen.',
    'param.boreClearanceMm.formula': 'r_{real} = r_{nominal} + c_{bore}',
    'param.boreClearanceMm.info': '+0.10 bis +0.15 mm ermöglicht eine spielfreie Schiebesitzpassung.',

    'param.filamentMaterial': 'Filamentmaterial',
    'param.filamentMaterial.tip': 'Materialauswahl für Dichte und Gewichtsschätzung.',
    'param.filamentMaterial.formula': 'm = V \\cdot \\rho_{material} \\cdot \\text{Infill}\\%',
    'param.filamentMaterial.info': 'PETG und Nylon PA12 bieten optimale Verschleißfestigkeit und Eigenschmierung.',

    'param.projectName': 'Projekt- / Zahnradname',
    'param.projectName.placeholder': 'z.B. Z24 M2.0 Getrieberitzel',

    // Summary Step
    'wizard.summary.pitch_dia': 'Teilkreisdurchmesser (d)',
    'wizard.summary.outer_dia': 'Kopfkreisdurchmesser (da)',
    'wizard.summary.root_dia': 'Fußkreisdurchmesser (df)',
    'wizard.summary.base_dia': 'Grundkreisdurchmesser (db)',
    'wizard.summary.circular_pitch': 'Teilung (p)',
    'wizard.summary.tooth_thickness': 'Zahndicke (s)',
    'wizard.summary.whole_depth': 'Zahnhöhe (h)',
    'wizard.summary.contact_ratio': 'Profilüberdeckung (εα)',
    'wizard.summary.est_weight': 'Geschätztes Gewicht',
    'wizard.summary.manifold_status': 'Netz-Topologie',
    'wizard.summary.manifold_ok': '100% Wasserdicht (2-Manifold Slicer-Ready)',

    // Notifications
    'toast.wizard_created': 'Neues Zahnraddesign erfolgreich erstellt und in die 3D-Bühne geladen!',
    'toast.wizard_created_title': 'Design Fertig',
    'toast.lang_changed': 'Sprache erfolgreich umgestellt.',
  },

  ru: {
    // Menu & General
    'app.title': 'GearForge 3D',
    'app.subtitle': 'ISO 21771 Эвольвентный CAD и Студия Слайсинга 3D-Печати',
    'menu.file': '📁 Файл',
    'menu.new_gear': 'Новый проект шестерни',
    'menu.wizard': '🧙‍♂️ Мастер создания шестерни',
    'menu.open_saved': 'Открыть сохраненные проекты (LocalStorage)...',
    'menu.save': 'Сохранить проект',
    'menu.save_as': 'Сохранить как (LocalStorage)...',
    'menu.import_json': 'Загрузить настройки JSON...',
    'menu.export_json': 'Скачать настройки в формате JSON',
    'menu.reset_default': 'Сбросить к заводским настройкам',
    'menu.projects': '📂 Проекты',
    'menu.export': '🚀 Экспорт',
    'menu.export_stl_binary': 'Скачать STL (Двоичный / Binary STL для 3D-печати)',
    'menu.export_stl_ascii': 'Скачать ASCII STL (.stl)',
    'menu.export_obj': 'Скачать Wavefront OBJ (.obj)',
    'menu.export_mating': 'Скачать STL сопряженной шестерни',
    'menu.screenshot': 'Снимок 3D-сцены (.png)',
    'menu.presets': '⚙️ Шаблоны',
    'menu.view': '👁️ Вид',
    'menu.help': '❓ Справка',
    'menu.about': 'О GearForge 3D и Trunçgil Technology',
    'menu.iso_guide': 'Руководство ISO 21771 и 3D-печати',
    'menu.shortcuts': 'Горячие клавиши',
    'quick.new': '➕ Новый',
    'quick.projects': '📂 Проекты',
    'quick.save': '💾 Сохранить',
    'quick.export_stl': '⬇ Скачать STL',
    'badge.active_project': 'Новый проект шестерни',
    'badge.dirty': '● Изменено',
    'offline.badge': 'Автономный CAD',

    // Wizard General
    'wizard.title': 'Мастер создания шестерни',
    'wizard.subtitle': 'Создайте параметрическую водонепроницаемую шестерню ISO 21771 для 3D-печати за 5 шагов.',
    'wizard.step_counter': 'Шаг {current} из {total}',
    'wizard.btn_cancel': 'Отмена',
    'wizard.btn_back': '◀ Назад',
    'wizard.btn_next': 'Далее ▶',
    'wizard.btn_create': '🚀 Создать шестерню и открыть в 3D',
    'wizard.startup_checkbox': 'Автоматически открывать мастер при запуске приложения',
    'wizard.info_btn_title': 'Нажмите для инженерной формулы и рекомендаций по 3D-печати',
    'wizard.formula_label': 'Инженерная формула:',
    'wizard.explanation_label': 'Инженерное описание и стандарт:',
    'wizard.inspect_2d_title': 'Увеличить 2D CAD чертеж',
    'wizard.cad_badge': '2D CAD ЧЕРТЕЖ',
    'wizard.cad_inspect_modal_title': '2D CAD Технический чертеж и образмеривание',
    'wizard.view_3d': '🧊 3D Модель',
    'wizard.view_2d': '📐 2D CAD',
    'wizard.view_dual': '🔲 Двойной',
    'wizard.toolbar_rotate': 'Автоповорот',
    'wizard.toolbar_wireframe': 'Сетка',
    'wizard.toolbar_center': 'Сброс камеры',


    // Wizard Steps
    'wizard.step1.tab': '1. Размеры и тип',
    'wizard.step1.title': '1. Тип шестерни и основные размеры',
    'wizard.step1.desc': 'Выберите кинематическую архитектуру, число зубьев, модуль и ширину венца.',

    'wizard.step2.tab': '2. Отверстие и вал',
    'wizard.step2.title': '2. Центральное отверстие и крепление к валу',
    'wizard.step2.desc': 'Настройте посадочное место (Круглое, шпоночный паз DIN 6885 или D-вал).',

    'wizard.step3.tab': '3. Ступица и тело',
    'wizard.step3.title': '3. Ступица и облегчение конструкции',
    'wizard.step3.desc': 'Добавьте выточки, спицы или облегчающие отверстия для экономии пластика и прочности.',

    'wizard.step4.tab': '4. Эвольвента и FDM',
    'wizard.step4.title': '4. Эвольвентный профиль и допуски 3D-печати',
    'wizard.step4.desc': 'Откалибруйте угол зацепления, смещение профиля, усадку и боковой зазор (люфт).',

    'wizard.step5.tab': '5. Итог и создание',
    'wizard.step5.title': '5. Техническая проверка и подтверждение',
    'wizard.step5.desc': 'Проверьте расчетные параметры геометрии ISO 21771 и загрузите модель в рабочее 3D-пространство.',

    // Parameters and Formulas (RU)
    'param.gearType': 'Тип шестерни',
    'param.gearType.tip': 'Кинематическая и осевая ориентация зубьев.',
    'param.gearType.spur': 'Прямозубая шестерня (Spur)',
    'param.gearType.helical': 'Косозубая шестерня (Helical)',
    'param.gearType.herringbone': 'Шевронная шестерня (Двойная спираль)',
    'param.gearType.bevel': 'Коническая шестерня (Bevel)',
    'param.gearType.internal': 'Коронная шестерня внутреннего зацепления',

    'param.sizingMode': 'Режим задания размеров',
    'param.sizingMode.tip': 'Определяет, какой параметр остается фиксированным при пересчете.',
    'param.sizingMode.module': 'Модуль (m) + Число зубьев (z) ➔ Диаметры рассчитываются',
    'param.sizingMode.pitch': 'Делительный диаметр (d) + z ➔ Модуль рассчитывается',
    'param.sizingMode.outer': 'Внешний диаметр (da) + z ➔ Модуль рассчитывается',

    'param.teethCount': 'Число зубьев (z)',
    'param.teethCount.unit': 'зуб.',
    'param.teethCount.tip': 'Полное количество эвольвентных зубьев на делительной окружности.',
    'param.teethCount.formula': 'z = \\frac{d}{m}',
    'param.teethCount.info': 'В стандартных прямозубых передачах с углом 20° минимальное число зубьев без подрезания ножки равно 17. Для меньшего числа требуется положительное смещение профиля (x > 0).',

    'param.module': 'Модуль (m)',
    'param.module.unit': 'мм',
    'param.module.tip': 'Стандартный метрический модуль ISO. Сопряженные шестерни должны иметь одинаковый модуль.',
    'param.module.formula': 'm = \\frac{d}{z} = \\frac{p}{\\pi}',
    'param.module.info': 'Больший модуль увеличивает прочность зуба на изгиб и передаваемый крутящий момент. Для сопла 0.4мм оптимален модуль m ≥ 1.0 мм.',

    'param.targetPitchDiameter': 'Делительный диаметр (d)',
    'param.targetPitchDiameter.unit': 'мм',
    'param.targetPitchDiameter.tip': 'Теоретический диаметр качения зубчатой передачи без проскальзывания.',
    'param.targetPitchDiameter.formula': 'd = m \\cdot z',
    'param.targetPitchDiameter.info': 'Межосевое расстояние передачи напрямую равно a = (d1 + d2) / 2.',

    'param.targetOuterDiameter': 'Диаметр вершин зубьев (da)',
    'param.targetOuterDiameter.unit': 'мм',
    'param.targetOuterDiameter.tip': 'Габаритный наружный диаметр, измеряемый штангенциркулем.',
    'param.targetOuterDiameter.formula': 'd_a = d + 2 \\cdot (h_a^* + x) \\cdot m',
    'param.targetOuterDiameter.info': 'Основной ориентир при реверс-инжиниринге сломанных шестерен.',

    'param.thickness': 'Ширина венца (b)',
    'param.thickness.unit': 'мм',
    'param.thickness.tip': 'Осевая толщина зубчатого венца.',
    'param.thickness.formula': 'b \\approx (8 \\dots 12) \\cdot m',
    'param.thickness.info': 'По стандарту ширина венца принимается равной 8-12 модулям для безопасного распределения сдвиговых нагрузок.',

    'param.helixAngleDeg': 'Угол наклона спирали (β)',
    'param.helixAngleDeg.unit': '°',
    'param.helixAngleDeg.tip': 'Угол наклона зуба относительно оси вращения для плавного и бесшумного хода.',
    'param.helixAngleDeg.formula': 'd_b = \\frac{m \\cdot z}{\\cos \\beta}',
    'param.helixAngleDeg.info': 'Угол 15°-25° идеален для 3D-печати. Шевронные шестерни взаимно гасят осевые усилия.',

    'param.boreType': 'Тип крепления к валу',
    'param.boreType.tip': 'Геометрический профиль для передачи крутящего момента на вал.',
    'param.boreType.formula': 'r_{bore} = \\frac{d_{bore}}{2} + c_{bore}',
    'param.boreType.info': 'Шпоночный паз DIN 6885 подходит для редукторов; D-вал для шаговых моторов NEMA 17.',

    'param.boreDiameter': 'Диаметр отверстия под вал (d_bore)',
    'param.boreDiameter.unit': 'мм',
    'param.boreDiameter.tip': 'Номинальный диаметр вала (напр. 5мм, 8мм, 10мм).',
    'param.boreDiameter.formula': '\\varnothing = d_{bore} + 2 \\cdot c_{bore}',
    'param.boreDiameter.info': 'При FDM-печати отверстия уменьшаются на 0.1-0.2 мм из-за расширения расплава пластика.',

    'param.keywayWidth': 'Ширина шпонки (b_шпонки)',
    'param.keywayWidth.unit': 'мм',
    'param.keywayWidth.tip': 'Ширина призматической шпонки по стандарту DIN 6885-1.',
    'param.keywayWidth.formula': 'b_{key} \\in \\text{DIN 6885}',
    'param.keywayWidth.info': 'Вал Ø8-10мм: шпонка 3мм; вал Ø10-12мм: шпонка 4мм; вал Ø12-17мм: шпонка 5мм.',

    'param.keywayDepth': 'Глубина шпоночного паза (t2)',
    'param.keywayDepth.unit': 'мм',
    'param.keywayDepth.tip': 'Глубина паза в теле ступицы.',
    'param.keywayDepth.formula': 't_2 \\approx 0.15 \\dots 0.20 \\cdot d_{bore}',
    'param.keywayDepth.info': 'Обеспечивает надежную фиксацию и исключает проворачивание шпонки.',

    'param.webStyle': 'Конструкция диска (Web Style)',
    'param.webStyle.tip': 'Облегчение внутреннего диска шестерни.',
    'param.webStyle.formula': 'V_{экономия} = 30\\% \\dots 65\\%',
    'param.webStyle.info': 'Углубления и окна экономят до 50% веса и времени печати без потери жесткости обода.',

    'param.hubDiameter': 'Диаметр ступицы (d_hub)',
    'param.hubDiameter.unit': 'мм',
    'param.hubDiameter.tip': 'Массивное утолщение вокруг отверстия вала.',
    'param.hubDiameter.formula': 'd_{hub} \\ge 1.6 \\dots 1.8 \\cdot d_{bore}',
    'param.hubDiameter.info': 'Должен быть минимум в 1.6 раза больше диаметра вала для стойкости к кручению.',

    'param.hubTopExtension': 'Выступ ступицы (буртик)',
    'param.hubTopExtension.unit': 'мм',
    'param.hubTopExtension.tip': 'Осевой выступ для стопорного винта (M3/M4) или упора подшипника.',
    'param.hubTopExtension.formula': 'L_{boss} \\ge 1.2 \\cdot \\varnothing_{винта}',
    'param.hubTopExtension.info': 'Длина 4-6 мм обеспечивает надежную фиксацию резьбовой втулки.',

    'param.pressureAngleDeg': 'Угол зацепления (α)',
    'param.pressureAngleDeg.unit': '°',
    'param.pressureAngleDeg.tip': 'Угол линии зацепления по стандарту ISO/ГОСТ.',
    'param.pressureAngleDeg.formula': 'd_b = d \\cdot \\cos(\\alpha)',
    'param.pressureAngleDeg.info': '20° — мировой стандарт. 25° дает утолщенное основание зуба для сверхвысоких нагрузок.',

    'param.profileShift': 'Коэффициент смещения (x)',
    'param.profileShift.unit': 'коэфф.',
    'param.profileShift.tip': 'Смещение инструмента, предотвращающее подрезание зубьев при z < 17.',
    'param.profileShift.formula': 'x_{min} = 1 - \\frac{z \\cdot \\sin^2(\\alpha)}{2 \\cdot h_a^*}',
    'param.profileShift.info': 'Смещение x = +0.25 на 12-зубом пиньоне снижает риск излома зуба на 40%.',

    'param.backlashMm': 'Боковой зазор люфта (jt)',
    'param.backlashMm.unit': 'мм',
    'param.backlashMm.tip': 'Уменьшение толщины зуба для компенсации растекания слоев FDM 3D-печати.',
    'param.backlashMm.formula': 's = \\frac{\\pi \\cdot m}{2} + 2 \\cdot x \\cdot m \\cdot \\tan(\\alpha) - j_t',
    'param.backlashMm.info': 'Рекомендуемый зазор: PLA: 0.15 мм, PETG: 0.20 мм, ABS/ASA: 0.22 мм, Нейлон: 0.25 мм.',

    'param.boreClearanceMm': 'Допуск отверстия (по радиусу)',
    'param.boreClearanceMm.unit': 'мм',
    'param.boreClearanceMm.tip': 'Радиальная прибавка для легкой посадки шестерни на вал.',
    'param.boreClearanceMm.formula': 'r_{real} = r_{nominal} + c_{bore}',
    'param.boreClearanceMm.info': 'Припуск +0.10...+0.15 мм гарантирует плотную посадку от руки без молотка.',

    'param.filamentMaterial': 'Материал филамента',
    'param.filamentMaterial.tip': 'Тип полимера для расчета массы и механической прочности.',
    'param.filamentMaterial.formula': 'm = V \\cdot \\rho_{material} \\cdot \\text{Заполнение}\\%',
    'param.filamentMaterial.info': 'PETG и Нейлон (PA12) обладают наилучшей износостойкостью и низким коэффициентом трения.',

    'param.projectName': 'Название шестерни / проекта',
    'param.projectName.placeholder': 'Например: Пиньон редуктора Z24 M2.0',

    // Summary Step
    'wizard.summary.pitch_dia': 'Делительный диаметр (d)',
    'wizard.summary.outer_dia': 'Диаметр вершин зубьев (da)',
    'wizard.summary.root_dia': 'Диаметр впадин зубьев (df)',
    'wizard.summary.base_dia': 'Основной диаметр (db)',
    'wizard.summary.circular_pitch': 'Окружной шаг (p)',
    'wizard.summary.tooth_thickness': 'Толщина зуба (s)',
    'wizard.summary.whole_depth': 'Полная высота зуба (h)',
    'wizard.summary.contact_ratio': 'Коэффициент перекрытия (εα)',
    'wizard.summary.est_weight': 'Расчетная масса',
    'wizard.summary.manifold_status': 'Топология 3D-сетки',
    'wizard.summary.manifold_ok': '100% Водонепроницаемая (2-Manifold Slicer-Ready)',

    // Notifications
    'toast.wizard_created': 'Новая шестерня успешно создана и перенесена в 3D-пространство!',
    'toast.wizard_created_title': 'Готово к работе',
    'toast.lang_changed': 'Язык интерфейса успешно обновлен.',
  },
};

export class I18nService {
  private static instance: I18nService | null = null;
  private currentLanguage: SupportedLanguage = 'tr';
  private readonly listeners = new Set<(lang: SupportedLanguage) => void>();

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('gearforge_language') as SupportedLanguage | null;
      if (saved && (saved === 'tr' || saved === 'en' || saved === 'de' || saved === 'ru')) {
        this.currentLanguage = saved;
        return;
      }
    }

    // Tarayıcı dilini tespit et
    if (typeof navigator !== 'undefined') {
      const navLang = (navigator.language || '').toLowerCase();
      if (navLang.startsWith('tr')) {
        this.currentLanguage = 'tr';
      } else if (navLang.startsWith('de')) {
        this.currentLanguage = 'de';
      } else if (navLang.startsWith('ru')) {
        this.currentLanguage = 'ru';
      } else {
        this.currentLanguage = 'en';
      }
    }
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public setLanguage(lang: SupportedLanguage): void {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gearforge_language', lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    this.notify();
  }

  public onLanguageChange(listener: (lang: SupportedLanguage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentLanguage);
      } catch (e) {
        console.error('Error in i18n listener:', e);
      }
    }
  }

  /**
   * Ana çeviri fonksiyonu (t)
   */
  public t(key: string, params?: Record<string, string | number>): string {
    const dict = TRANSLATIONS[this.currentLanguage] || TRANSLATIONS.tr;
    let text = dict[key] || TRANSLATIONS.en[key] || TRANSLATIONS.tr[key] || key;

    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
    }

    return text;
  }
}

export const i18n = I18nService.getInstance();
