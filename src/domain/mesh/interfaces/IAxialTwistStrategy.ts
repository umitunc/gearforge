import { GearParameters } from '../../models/GearParameters';
import { GearType } from '../../models/GearTypes';

export interface AxialSliceTransform {
  readonly rotationAngleRad: number;
  readonly radialScale: number;
}

/**
 * Dişli profilinin Z ekseni boyunca burulma (helis/çavuş) ve ölçeklenme (konik/bevel)
 * davranışını belirleyen strateji arayüzü (ISP / OCP / LSP).
 */
export interface IAxialTwistStrategy {
  readonly supportedType: GearType;

  /**
   * @param normalizedHeight 0.0 (alt yüzey: -b/2) ile 1.0 (üst yüzey: +b/2) arası oran
   * @param params Dişli parametreleri
   * @param pitchRadius Bölüm dairesi yarıçapı (mm)
   */
  computeTransform(
    normalizedHeight: number,
    params: GearParameters,
    pitchRadius: number
  ): AxialSliceTransform;

  /**
   * Bu dişli tipi için önerilen efektif Z katman sayısını döndürür.
   */
  resolveSliceCount(params: GearParameters): number;
}
