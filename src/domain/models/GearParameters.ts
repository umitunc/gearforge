import {
  BoreType,
  FilamentMaterial,
  GearType,
  HelixHandedness,
  SizingMode,
  WebStyle,
} from './GearTypes';

/**
 * Bir dişliye ait tüm parametrik varyasyonları tanımlayan ana veri modeli.
 */
export interface GearParameters {
  // 1. Boyutlandırma & Diş Profili (Sizing & Tooth Geometry)
  readonly gearType: GearType;
  readonly sizingMode: SizingMode;
  readonly teethCount: number;              // z: Diş sayısı (6 - 180)
  readonly module: number;                  // m: Modül (mm) (0.4 - 12.0)
  readonly targetPitchDiameter: number;     // d: Hedef Bölüm Dairesi Çapı (mm)
  readonly targetOuterDiameter: number;     // da: Hedef Dış Çap (mm)
  readonly pressureAngleDeg: number;        // alpha: Kavrama açısı (derece, örn. 20)
  readonly profileShift: number;            // x: Profil kaydırma katsayısı (-0.5 ile +0.8)
  readonly addendumFactor: number;          // ha*: Diş üstü katsayısı (varsayılan 1.0)
  readonly dedendumFactor: number;          // hf*: Diş dibi katsayısı (varsayılan 1.25)
  readonly rootFilletFactor: number;        // rf*: Diş dibi radyüs yumuşatma oranı (0.0 - 0.45)
  readonly tipReliefFactor: number;         // Diş ucu pah/yuvarlatma oranı (0.0 - 0.30)

  // 2. Eksenel Kalınlık & Helis / Konik Varyasyonları (Axial & Helix)
  readonly thickness: number;               // b: Dişli kalınlığı / yüz genişliği (mm)
  readonly helixAngleDeg: number;           // beta: Helis açısı (0 - 45 derece)
  readonly helixHandedness: HelixHandedness;// Sağ / Sol el helis yönü
  readonly bevelTaperFactor: number;        // Konik eğim daralma oranı (0.0 - 0.50)
  readonly outerRingWallThickness: number;  // İç dişli (Internal Ring) için dış çember et kalınlığı (mm)

  // 3. Merkez Delik & Mil Bağlantısı (Bore & Shaft Coupling)
  readonly boreType: BoreType;
  readonly boreDiameter: number;            // Merkez delik nominal çapı (mm)
  readonly dShaftFlatDepth: number;         // D-Mil düz kesim derinliği (mm)
  readonly keywayWidth: number;             // Kama kanalı genişliği (mm)
  readonly keywayDepth: number;             // Kama kanalı derinliği (mm)
  readonly splineCount: number;             // Çoklu kama diş sayısı (4 - 16)
  readonly splineDepth: number;             // Çoklu kama diş derinliği (mm)

  // 4. Göbek (Hub), Gövde (Web) & Hafifletme Varyasyonları
  readonly webStyle: WebStyle;
  readonly rimThickness: number;            // Diş dibinden içeriye çember (rim) et kalınlığı (mm)
  readonly webThickness: number;            // İnceltilmiş orta gövde kalınlığı (mm)
  readonly hubDiameter: number;             // Merkez göbek (hub) dış çapı (mm)
  readonly hubTopExtension: number;         // Üst göbek çıkıntı yüksekliği (mm)
  readonly hubBottomExtension: number;      // Alt göbek çıkıntı yüksekliği (mm)
  readonly cutoutCount: number;             // Hafifletme deliği veya jant kolu sayısı (3 - 12)
  readonly spokeWidthFactor: number;        // Jant kolu genişliği veya delik doluluk oranı (0.20 - 0.75)

  // 5. 3D Yazıcı Kalibrasyon & Çözünürlük (3D Print Tolerances & Mesh Quality)
  readonly backlashMm: number;              // Diş yan boşluğu / FDM toleransı (mm)
  readonly boreClearanceMm: number;         // İç delik yatay genişleme telafisi (mm)
  readonly profileSegmentsPerFlank: number; // Her evolvent yanak için eğri segment sayısı (6 - 24)
  readonly axialSlices: number;             // Kalınlık boyunca katman sayısı (1 - 60)
  readonly filamentMaterial: FilamentMaterial;
  readonly infillPercentage: number;        // Tahmini 3D baskı doluluk oranı (%)

  // 6. Eşleşen Dişli Simülasyonu (Mating Pinion Preview)
  readonly showMatingGear: boolean;
  readonly matingTeethCount: number;
  readonly simulationRpm: number;
}

/**
 * Varsayılan 3D yazdırılabilir dişli parametrelerini döndürür.
 */
export function createDefaultGearParameters(): GearParameters {
  const teethCount = 24;
  const module = 2.0;
  const pitchDiameter = teethCount * module; // 48 mm
  const outerDiameter = pitchDiameter + 2 * module; // 52 mm

  return {
    gearType: GearType.SPUR,
    sizingMode: SizingMode.MODULE,
    teethCount,
    module,
    targetPitchDiameter: pitchDiameter,
    targetOuterDiameter: outerDiameter,
    pressureAngleDeg: 20,
    profileShift: 0.0,
    addendumFactor: 1.0,
    dedendumFactor: 1.25,
    rootFilletFactor: 0.25,
    tipReliefFactor: 0.06,

    thickness: 10.0,
    helixAngleDeg: 20.0,
    helixHandedness: HelixHandedness.RIGHT,
    bevelTaperFactor: 0.25,
    outerRingWallThickness: 6.0,

    boreType: BoreType.KEYWAY,
    boreDiameter: 10.0,
    dShaftFlatDepth: 1.0,
    keywayWidth: 3.0,
    keywayDepth: 1.5,
    splineCount: 6,
    splineDepth: 1.2,

    webStyle: WebStyle.LIGHTENING_HOLES,
    rimThickness: 4.5,
    webThickness: 5.0,
    hubDiameter: 20.0,
    hubTopExtension: 4.0,
    hubBottomExtension: 0.0,
    cutoutCount: 6,
    spokeWidthFactor: 0.45,

    backlashMm: 0.10,
    boreClearanceMm: 0.15,
    profileSegmentsPerFlank: 12,
    axialSlices: 20,
    filamentMaterial: FilamentMaterial.PLA,
    infillPercentage: 40,

    showMatingGear: false,
    matingTeethCount: 14,
    simulationRpm: 15,
  };
}
