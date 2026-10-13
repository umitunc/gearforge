import { GearParameters } from '../../models/GearParameters';
import { WebStyle } from '../../models/GearTypes';
import { PolygonLoop2D } from '../../models/GeometryTypes';

/**
 * Dişli gövdesi (Web) içindeki hafifletme delikleri veya jant kolu boşluklarını üreten strateji arayüzü (ISP / OCP).
 */
export interface IWebCutoutGenerator {
  readonly supportedStyle: WebStyle;

  /**
   * Göbek (hubRadius) ile Çember (rimRadius) arasındaki bölgede yer alan
   * kapalı, kesişmeyen 2B delik konturlarını (CCW) döndürür.
   */
  generateCutouts(
    params: GearParameters,
    hubRadius: number,
    rimRadius: number
  ): PolygonLoop2D[];
}
