import { GearParameters } from '../../models/GearParameters';
import { WebStyle } from '../../models/GearTypes';
import { Point2D, PolygonLoop2D } from '../../models/GeometryTypes';
import { IWebCutoutGenerator } from '../interfaces/IWebCutoutGenerator';

/**
 * Tam Dolu (Solid) veya Çökertmeli Deliksiz (Recessed) Gövde Stratejisi
 */
export class SolidOrRecessedWebGenerator implements IWebCutoutGenerator {
  public readonly supportedStyle: WebStyle;

  constructor(style: WebStyle.SOLID | WebStyle.RECESSED) {
    this.supportedStyle = style;
  }

  public generateCutouts(): PolygonLoop2D[] {
    return [];
  }
}

/**
 * Dairesel Hafifletme Delikli (Lightening Holes) Gövde Stratejisi
 */
export class LighteningHolesGenerator implements IWebCutoutGenerator {
  public readonly supportedStyle = WebStyle.LIGHTENING_HOLES;

  public generateCutouts(
    params: GearParameters,
    hubRadius: number,
    rimRadius: number
  ): PolygonLoop2D[] {
    const radialSpan = rimRadius - hubRadius;
    if (radialSpan < 3.6) {
      return [];
    }

    const count = Math.min(16, Math.max(3, Math.round(params.cutoutCount)));
    const midRadius = (hubRadius + rimRadius) * 0.5;

    // Radyal ve çevresel maksimum güvenli delik yarıçapı
    const maxRadialHoleR = radialSpan * 0.5 - 1.0;
    const chordHalfSpacing = midRadius * Math.sin(Math.PI / count) - 1.0;
    const maxPossibleHoleR = Math.min(maxRadialHoleR, chordHalfSpacing);

    if (maxPossibleHoleR < 0.8) {
      return [];
    }

    const scale = Math.min(0.92, Math.max(0.25, params.spokeWidthFactor));
    const holeRadius = Math.max(0.8, maxPossibleHoleR * scale);
    const segmentsPerHole = 24;
    const loops: PolygonLoop2D[] = [];

    for (let k = 0; k < count; k++) {
      const centerAngle = (k / count) * Math.PI * 2;
      const cx = midRadius * Math.cos(centerAngle);
      const cy = midRadius * Math.sin(centerAngle);
      const holePoints: Point2D[] = [];

      for (let i = 0; i < segmentsPerHole; i++) {
        const theta = (i / segmentsPerHole) * Math.PI * 2;
        holePoints.push({
          x: cx + holeRadius * Math.cos(theta),
          y: cy + holeRadius * Math.sin(theta),
        });
      }
      loops.push(holePoints);
    }

    return loops;
  }
}

/**
 * Kollu / Jant Tipi (Spoked Wheel) Gövde Stratejisi
 * Kollar arasındaki sektör pencerelerini CCW kapalı konturlar olarak üretir.
 */
export class SpokedWebGenerator implements IWebCutoutGenerator {
  public readonly supportedStyle = WebStyle.SPOKED;

  public generateCutouts(
    params: GearParameters,
    hubRadius: number,
    rimRadius: number
  ): PolygonLoop2D[] {
    const radialMargin = 1.1;
    const rIn = hubRadius + radialMargin;
    const rOut = rimRadius - radialMargin;

    if (rOut - rIn < 2.2) {
      return [];
    }

    const count = Math.min(16, Math.max(3, Math.round(params.cutoutCount)));
    const sectorAngle = (Math.PI * 2) / count;

    // spokeWidthFactor (0.20 - 0.75) -> Kol kalınlığını belirler
    const spokeRatio = Math.min(0.65, Math.max(0.15, 1.0 - params.spokeWidthFactor));
    const spokeWidthMm = Math.max(
      1.6,
      ((2 * Math.PI * rIn) / count) * spokeRatio * 0.65
    );

    const halfAngleIn = Math.asin(Math.min(0.42, spokeWidthMm / (2 * rIn)));
    const halfAngleOut = Math.asin(Math.min(0.42, spokeWidthMm / (2 * rOut)));

    if (halfAngleIn * 2 >= sectorAngle * 0.88 || halfAngleOut * 2 >= sectorAngle * 0.88) {
      return [];
    }

    const arcSteps = Math.max(10, Math.round(36 / count));
    const radialSteps = 4;
    const loops: PolygonLoop2D[] = [];

    for (let k = 0; k < count; k++) {
      const baseAngle = k * sectorAngle;
      const startIn = baseAngle + halfAngleIn;
      const endIn = baseAngle + sectorAngle - halfAngleIn;
      const startOut = baseAngle + halfAngleOut;
      const endOut = baseAngle + sectorAngle - halfAngleOut;

      const windowLoop: Point2D[] = [];

      // 1. Alt kol kenarı: rIn -> rOut (startIn -> startOut)
      for (let i = 0; i < radialSteps; i++) {
        const t = i / radialSteps;
        const r = rIn + (rOut - rIn) * t;
        const a = startIn + (startOut - startIn) * t;
        windowLoop.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
      }

      // 2. Dış çember yayı: rOut üzerinde startOut -> endOut
      for (let i = 0; i < arcSteps; i++) {
        const t = i / arcSteps;
        const a = startOut + (endOut - startOut) * t;
        windowLoop.push({ x: rOut * Math.cos(a), y: rOut * Math.sin(a) });
      }

      // 3. Üst kol kenarı: rOut -> rIn (endOut -> endIn)
      for (let i = 0; i < radialSteps; i++) {
        const t = i / radialSteps;
        const r = rOut - (rOut - rIn) * t;
        const a = endOut + (endIn - endOut) * t;
        windowLoop.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
      }

      // 4. İç göbek yayı: rIn üzerinde endIn -> startIn
      for (let i = 0; i < arcSteps; i++) {
        const t = i / arcSteps;
        const a = endIn - (endIn - startIn) * t;
        windowLoop.push({ x: rIn * Math.cos(a), y: rIn * Math.sin(a) });
      }

      loops.push(windowLoop);
    }

    return loops;
  }
}
