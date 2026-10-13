import { GearParameters } from '../../models/GearParameters';
import { PolygonLoop2D } from '../../models/GeometryTypes';

/**
 * Dişli dış/iç evolvent diş profilini 2B kapalı kontur olarak üreten strateji arayüzü.
 */
export interface IToothProfileGenerator {
  /**
   * Saat yönünün tersine (CCW) sıralı, kapalı 2B dişli çevresi konturu üretir.
   */
  generateToothLoop(params: GearParameters): PolygonLoop2D;
}
