/**
 * Dişli ana tipleri (Eksenel ve yapısal sınıflandırma)
 */
export enum GearType {
  SPUR = 'spur',               // Düz Dişli
  HELICAL = 'helical',         // Helisel Dişli
  HERRINGBONE = 'herringbone', // Çavuş (Çift Helisel) Dişli
  BEVEL_TAPER = 'bevel_taper', // Konik Eğimli Dişli
  INTERNAL_RING = 'internal',  // İç Dişli Çember
}

/**
 * Dişli çap/modül boyutlandırma modu
 */
export enum SizingMode {
  MODULE = 'module',                 // Modül (m) ve Diş Sayısı (z) sabit -> Çap hesaplanır
  PITCH_DIAMETER = 'pitch_diameter', // Bölüm Dairesi Çapı (d) ve Diş Sayısı (z) -> Modül hesaplanır
  OUTER_DIAMETER = 'outer_diameter', // Dış Çap (da) ve Diş Sayısı (z) -> Modül hesaplanır
}

/**
 * Merkez delik ve mil bağlantı tipleri
 */
export enum BoreType {
  NONE = 'none',               // Deliksiz (Tam Dolu)
  CIRCULAR = 'circular',       // Standart Yuvarlak Delik
  D_SHAFT = 'd_shaft',         // Tek Düzlüklü Step Motor Mili (D-Shaft)
  DOUBLE_D = 'double_d',       // Çift Düzlüklü Mil (Double D-Shaft)
  KEYWAY = 'keyway',           // Kama Kanallı Delik (DIN 6885)
  HEXAGONAL = 'hexagonal',     // Altıgen Delik (Somun / Hex Mil)
  SQUARE = 'square',           // Kare Mil Deliği
  SPLINE = 'spline',           // Çok Kamalı / Yıldız Mil Deliği
}

/**
 * Dişli iç gövde (Web) hafifletme ve tasarım tipleri
 */
export enum WebStyle {
  SOLID = 'solid',                     // Tam Dolu Gövde
  RECESSED = 'recessed',               // Çökertmeli İnce Gövde (Web + Rim)
  LIGHTENING_HOLES = 'lightening',     // Dairesel Hafifletme Delikli Gövde
  SPOKED = 'spoked',                   // Kollu / Jant Tipi Dişli
}

/**
 * Helis yönü (Sağ / Sol El)
 */
export enum HelixHandedness {
  RIGHT = 'right',
  LEFT = 'left',
}

/**
 * 3D Yazıcı filament materyal tipleri (ağırlık ve dayanım tahmini için)
 */
export enum FilamentMaterial {
  PLA = 'PLA',
  PETG = 'PETG',
  ABS = 'ABS',
  ASA = 'ASA',
  NYLON_PA12 = 'NYLON',
  TPU = 'TPU',
}

/**
 * İhraç (Export) dosya formatları
 */
export enum ExportFormat {
  STL_BINARY = 'stl_binary',
  STL_ASCII = 'stl_ascii',
  OBJ = 'obj',
  JSON_CONFIG = 'json_config',
}

/**
 * 3B Dişli ağ (mesh) üzerindeki anatomik alt bölgeler (Materyal gruplandırma ve vurgulama için)
 */
export enum GearMeshZone {
  TOOTH_FLANK = 0, // Evolvent diş yan yüzeyleri
  TEETH_RIM = 1,   // Diş üst/alt kapakları ve dış çember (Rim)
  HUB_WEB = 2,     // İç gövde (Web), hafifletme delikleri, kollar ve göbek (Hub)
  BORE = 3,        // Merkez delik iç duvarları, kama kanalı ve delik bileziği
}

/**
 * UI parametre bölümlerine (param-section) karşılık gelen 3B vurgulama (highlight) modları
 */
export enum GearHighlightSection {
  NONE = 'none',
  DIMENSIONS_AND_TYPE = 'dimensions', // 1. Dişli Tipi ve Ana Boyutlar
  BORE_AND_SHAFT = 'bore',            // 2. Merkez Delik & Mil Bağlantısı
  HUB_AND_WEB = 'hub_web',            // 3. Göbek (Hub) & Gövde Hafifletme
  EVOLVENT_AND_PRINT = 'evolvent',    // 4. Evolvent Profil & 3D Yazıcı Kalibrasyonu
  MATING_SIMULATION = 'mating',       // 5. Eşleşen Dişli Simülasyonu
}
