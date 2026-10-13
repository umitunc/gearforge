import { GearParameters } from '../../models/GearParameters';
import { BoreType } from '../../models/GearTypes';
import { PolygonLoop2D } from '../../models/GeometryTypes';

/**
 * Merkez delik (Bore) 2B profil üretim stratejisi arayüzü (ISP / OCP / LSP).
 */
export interface IBoreProfileGenerator {
  readonly supportedType: BoreType;

  /**
   * Saat yönünün tersine (CCW) sıralı, kapalı ve kendiyle kesişmeyen 2B delik konturu üretir.
   * Delik yoksa (BoreType.NONE) boş dizi döndürür.
   *
   * @param params Dişli parametreleri
   * @param maxAllowedRadius Diş dibi/göbek sınırına göre izin verilen maksimum yarıçap (mm)
   * @param angularResolution Tam çember başına köşe sayısı
   */
  generateBoreLoop(
    params: GearParameters,
    maxAllowedRadius: number,
    angularResolution: number
  ): PolygonLoop2D;
}
