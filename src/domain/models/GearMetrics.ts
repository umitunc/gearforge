/**
 * Dişli doğrulama uyarı seviyeleri
 */
export type ValidationSeverity = 'info' | 'warning' | 'error';

/**
 * Mekanik ve 3B yazdırılabilirlik doğrulama mesajı
 */
export interface ValidationIssue {
  readonly code: string;
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly suggestion?: string;
}

/**
 * ISO 21771 / DIN 3960 standartlarına göre hesaplanan mühendislik metrikleri
 */
export interface GearMetrics {
  readonly effectiveModule: number;       // m (mm)
  readonly pitchDiameter: number;         // d = m * z (mm)
  readonly baseDiameter: number;          // db = d * cos(alpha) (mm)
  readonly outerDiameter: number;         // da (mm)
  readonly rootDiameter: number;          // df (mm)
  readonly addendum: number;              // ha (mm)
  readonly dedendum: number;              // hf (mm)
  readonly wholeDepth: number;            // h = ha + hf (mm)
  readonly circularPitch: number;         // p = pi * m (mm)
  readonly basePitch: number;             // pb = p * cos(alpha) (mm)
  readonly toothThicknessAtPitch: number; // s (mm) - backlash düşülmüş
  readonly effectiveBoreDiameter: number; // Delik çapı + 3D yazıcı toleransı (mm)
  readonly effectiveRimRadius: number;    // Rim iç yarıçapı (mm)
  readonly effectiveHubRadius: number;    // Hub dış yarıçapı (mm)
  readonly minimumTeethNoUndercut: number;// Dipten kesilme olmaması için min diş sayısı
  readonly contactRatio: number;          // Kavrama oranı (epsilon_alpha)
  readonly gearRatio: number;             // Eşleşen dişli ile çevrim oranı (z1 / z2)
  readonly centerDistance: number;        // Eşleşen dişli ile eksenler arası mesafe a (mm)
  readonly totalAxialHeight: number;      // Toplam Z yüksekliği (kalınlık + hub çıkıntıları) (mm)
  readonly estimatedVolumeCm3: number;    // Net 3B hacim (cm^3)
  readonly estimatedWeightGrams: number;  // Seçilen filament ve infill'e göre tahmini ağırlık (g)
}
