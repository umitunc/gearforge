import { GearParameters } from '../../models/GearParameters';
import { BoreType } from '../../models/GearTypes';
import { Point2D, PolygonLoop2D } from '../../models/GeometryTypes';
import { IBoreProfileGenerator } from '../interfaces/IBoreProfileGenerator';

/**
 * Etkin delik yarıçapını 3D yazıcı toleransı ile birlikte güvenli sınırlar içinde hesaplar.
 */
function resolveSafeBoreRadius(params: GearParameters, maxAllowedRadius: number): number {
  const rawDiameter = Math.max(0.8, params.boreDiameter + params.boreClearanceMm * 2);
  const rawRadius = rawDiameter * 0.5;
  return Math.min(Math.max(0.4, maxAllowedRadius), rawRadius);
}

/**
 * 1. Deliksiz / Tam Dolu Mil (BoreType.NONE)
 */
export class SolidBoreGenerator implements IBoreProfileGenerator {
  public readonly supportedType = BoreType.NONE;

  public generateBoreLoop(): PolygonLoop2D {
    return [];
  }
}

/**
 * 2. Standart Yuvarlak Delik (BoreType.CIRCULAR)
 */
export class CircularBoreGenerator implements IBoreProfileGenerator {
  public readonly supportedType = BoreType.CIRCULAR;

  public generateBoreLoop(
    params: GearParameters,
    maxAllowedRadius: number,
    angularResolution: number
  ): PolygonLoop2D {
    const r = resolveSafeBoreRadius(params, maxAllowedRadius);
    const steps = Math.max(24, angularResolution);
    const points: Point2D[] = [];

    for (let i = 0; i < steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      points.push({
        x: r * Math.cos(theta),
        y: r * Math.sin(theta),
      });
    }
    return points;
  }
}

/**
 * 3. Tek Düzlüklü Step Motor Mili - D-Shaft (BoreType.D_SHAFT)
 */
export class DShaftBoreGenerator implements IBoreProfileGenerator {
  public readonly supportedType = BoreType.D_SHAFT;

  public generateBoreLoop(
    params: GearParameters,
    maxAllowedRadius: number,
    angularResolution: number
  ): PolygonLoop2D {
    const r = resolveSafeBoreRadius(params, maxAllowedRadius);
    const flatDepth = Math.min(r * 0.65, Math.max(0.15, params.dShaftFlatDepth));
    const flatX = r - flatDepth;
    const steps = Math.max(36, angularResolution);
    const points: Point2D[] = [];

    for (let i = 0; i < steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      const cx = r * Math.cos(theta);
      const cy = r * Math.sin(theta);

      if (cx > flatX) {
        points.push({ x: flatX, y: cy });
      } else {
        points.push({ x: cx, y: cy });
      }
    }
    return points;
  }
}

/**
 * 4. Çift Düzlüklü Mil - Double D-Shaft (BoreType.DOUBLE_D)
 */
export class DoubleDShaftBoreGenerator implements IBoreProfileGenerator {
  public readonly supportedType = BoreType.DOUBLE_D;

  public generateBoreLoop(
    params: GearParameters,
    maxAllowedRadius: number,
    angularResolution: number
  ): PolygonLoop2D {
    const r = resolveSafeBoreRadius(params, maxAllowedRadius);
    const flatDepth = Math.min(r * 0.55, Math.max(0.15, params.dShaftFlatDepth));
    const flatX = r - flatDepth;
    const steps = Math.max(36, angularResolution);
    const points: Point2D[] = [];

    for (let i = 0; i < steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      const cx = r * Math.cos(theta);
      const cy = r * Math.sin(theta);

      const clampedX = Math.max(-flatX, Math.min(flatX, cx));
      points.push({ x: clampedX, y: cy });
    }
    return points;
  }
}

/**
 * 5. Kama Kanallı Delik - DIN 6885 Keyway (BoreType.KEYWAY)
 * Üst (+Y) ekseninde dikdörtgen kama yuvası açılmış dairesel delik.
 */
export class KeywayBoreGenerator implements IBoreProfileGenerator {
  public readonly supportedType = BoreType.KEYWAY;

  public generateBoreLoop(
    params: GearParameters,
    maxAllowedRadius: number,
    angularResolution: number
  ): PolygonLoop2D {
    const r = resolveSafeBoreRadius(params, maxAllowedRadius);
    const maxKeyDepth = Math.max(0.2, maxAllowedRadius - r);
    const keyDepth = Math.min(maxKeyDepth, Math.max(0.3, params.keywayDepth));
    const halfKeyWidth = Math.min(
      r * 0.65,
      Math.max(0.4, (params.keywayWidth + params.boreClearanceMm) * 0.5)
    );

    // Kama kanalının çemberi kestiği açı (Y ekseni etrafında: pi/2 - delta ile pi/2 + delta)
    const sinDelta = Math.min(0.85, halfKeyWidth / r);
    const deltaAngle = Math.asin(sinDelta);
    const startAngle = Math.PI * 0.5 + deltaAngle;
    const endAngle = Math.PI * 2.5 - deltaAngle;

    const arcSpan = endAngle - startAngle;
    const arcSteps = Math.max(32, angularResolution);
    const points: Point2D[] = [];

    const yBase = Math.sqrt(Math.max(0, r * r - halfKeyWidth * halfKeyWidth));
    const yTop = r + keyDepth;

    // Kama kanalı sağ üst köşeden sol üst köşeye ve çember yayına (CCW)
    points.push({ x: halfKeyWidth, y: yBase });
    points.push({ x: halfKeyWidth, y: yTop });
    points.push({ x: -halfKeyWidth, y: yTop });
    points.push({ x: -halfKeyWidth, y: yBase });

    for (let i = 1; i < arcSteps; i++) {
      const theta = startAngle + (i / arcSteps) * arcSpan;
      points.push({
        x: r * Math.cos(theta),
        y: r * Math.sin(theta),
      });
    }

    return points;
  }
}

/**
 * 6. Çokgen Delik (Altıgen ve Kare Mil Delikleri) (BoreType.HEXAGONAL / BoreType.SQUARE)
 * Across-flats (anahtar ağzı) ölçüsü `boreDiameter` olarak kabul edilir.
 */
export class PolygonalBoreGenerator implements IBoreProfileGenerator {
  public readonly supportedType: BoreType;
  private readonly sides: number;

  constructor(type: BoreType.HEXAGONAL | BoreType.SQUARE, sides: number) {
    this.supportedType = type;
    this.sides = sides;
  }

  public generateBoreLoop(
    params: GearParameters,
    maxAllowedRadius: number,
    angularResolution: number
  ): PolygonLoop2D {
    // boreDiameter = across-flats (iç teğet çember çapı) -> köşe yarıçapı r_corner = r_in / cos(pi / sides)
    const inRadius = resolveSafeBoreRadius(params, maxAllowedRadius * Math.cos(Math.PI / this.sides));
    const cornerRadius = Math.min(
      maxAllowedRadius,
      inRadius / Math.cos(Math.PI / this.sides)
    );

    const pointsPerSide = Math.max(4, Math.floor(angularResolution / this.sides));
    const points: Point2D[] = [];

    for (let s = 0; s < this.sides; s++) {
      const a1 = (s / this.sides) * Math.PI * 2;
      const a2 = ((s + 1) / this.sides) * Math.PI * 2;
      const p1: Point2D = { x: cornerRadius * Math.cos(a1), y: cornerRadius * Math.sin(a1) };
      const p2: Point2D = { x: cornerRadius * Math.cos(a2), y: cornerRadius * Math.sin(a2) };

      for (let k = 0; k < pointsPerSide; k++) {
        const t = k / pointsPerSide;
        points.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
        });
      }
    }

    return points;
  }
}

/**
 * 7. Çok Kamalı / Yıldız Mil Deliği (BoreType.SPLINE)
 */
export class SplineBoreGenerator implements IBoreProfileGenerator {
  public readonly supportedType = BoreType.SPLINE;

  public generateBoreLoop(
    params: GearParameters,
    maxAllowedRadius: number
  ): PolygonLoop2D {
    const innerRadius = resolveSafeBoreRadius(params, maxAllowedRadius * 0.85);
    const maxDepth = Math.max(0.15, maxAllowedRadius - innerRadius);
    const depth = Math.min(maxDepth, Math.max(0.25, params.splineDepth));
    const outerRadius = innerRadius + depth;
    const count = Math.min(24, Math.max(3, Math.round(params.splineCount)));

    const points: Point2D[] = [];
    const subStepsPerRidge = 4;
    const pitchAngle = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const baseAngle = i * pitchAngle;
      // Her bir spline dilimi: iç yay (%50) + dış kama yuvası (%50)
      const a0 = baseAngle;
      const a1 = baseAngle + pitchAngle * 0.22;
      const a2 = baseAngle + pitchAngle * 0.28;
      const a3 = baseAngle + pitchAngle * 0.72;
      const a4 = baseAngle + pitchAngle * 0.78;

      for (let s = 0; s < subStepsPerRidge; s++) {
        const theta = a0 + (s / subStepsPerRidge) * (a1 - a0);
        points.push({ x: innerRadius * Math.cos(theta), y: innerRadius * Math.sin(theta) });
      }
      for (let s = 0; s <= subStepsPerRidge; s++) {
        const theta = a2 + (s / subStepsPerRidge) * (a3 - a2);
        points.push({ x: outerRadius * Math.cos(theta), y: outerRadius * Math.sin(theta) });
      }
      for (let s = 1; s < subStepsPerRidge; s++) {
        const theta = a4 + (s / subStepsPerRidge) * (baseAngle + pitchAngle - a4);
        points.push({ x: innerRadius * Math.cos(theta), y: innerRadius * Math.sin(theta) });
      }
    }

    return points;
  }
}
