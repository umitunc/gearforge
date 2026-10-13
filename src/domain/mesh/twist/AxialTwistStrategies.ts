import { InvoluteMathCalculator } from '../../calculators/InvoluteMathCalculator';
import { GearParameters } from '../../models/GearParameters';
import { GearType, HelixHandedness } from '../../models/GearTypes';
import { AxialSliceTransform, IAxialTwistStrategy } from '../interfaces/IAxialTwistStrategy';

/**
 * 1. Düz Dişli (Spur Gear) ve İç Dişli Çember (Internal Ring Gear) Stratejisi
 */
export class SpurTwistStrategy implements IAxialTwistStrategy {
  public readonly supportedType: GearType;

  constructor(type: GearType.SPUR | GearType.INTERNAL_RING = GearType.SPUR) {
    this.supportedType = type;
  }

  public computeTransform(): AxialSliceTransform {
    return {
      rotationAngleRad: 0,
      radialScale: 1.0,
    };
  }

  public resolveSliceCount(): number {
    return 1;
  }
}

/**
 * 2. Helisel Dişli (Helical Gear) Stratejisi
 */
export class HelicalTwistStrategy implements IAxialTwistStrategy {
  public readonly supportedType = GearType.HELICAL;

  public computeTransform(
    normalizedHeight: number,
    params: GearParameters,
    pitchRadius: number
  ): AxialSliceTransform {
    const betaRad = InvoluteMathCalculator.degToRad(
      Math.min(45, Math.max(0, params.helixAngleDeg))
    );
    const direction = params.helixHandedness === HelixHandedness.RIGHT ? 1 : -1;
    const zOffset = (normalizedHeight - 0.5) * params.thickness;
    const rotationAngleRad =
      direction * ((zOffset * Math.tan(betaRad)) / Math.max(2, pitchRadius));

    return {
      rotationAngleRad,
      radialScale: 1.0,
    };
  }

  public resolveSliceCount(params: GearParameters): number {
    return Math.max(8, Math.round(params.axialSlices));
  }
}

/**
 * 3. Çavuş / Çift Helisel Dişli (Herringbone Gear) Stratejisi
 * Orta düzlemde (normalizedHeight = 0.5) yön değiştiren simetrik V-helis.
 */
export class HerringboneTwistStrategy implements IAxialTwistStrategy {
  public readonly supportedType = GearType.HERRINGBONE;

  public computeTransform(
    normalizedHeight: number,
    params: GearParameters,
    pitchRadius: number
  ): AxialSliceTransform {
    const betaRad = InvoluteMathCalculator.degToRad(
      Math.min(45, Math.max(0, params.helixAngleDeg))
    );
    const direction = params.helixHandedness === HelixHandedness.RIGHT ? 1 : -1;
    // u=0 -> 0, u=0.5 -> +0.5*b, u=1.0 -> 0 (Simetrik V profili)
    const symmetricProgress =
      normalizedHeight <= 0.5 ? normalizedHeight : 1.0 - normalizedHeight;
    const zOffset = (symmetricProgress - 0.25) * params.thickness;
    const rotationAngleRad =
      direction * ((zOffset * Math.tan(betaRad)) / Math.max(2, pitchRadius));

    return {
      rotationAngleRad,
      radialScale: 1.0,
    };
  }

  public resolveSliceCount(params: GearParameters): number {
    const raw = Math.max(12, Math.round(params.axialSlices));
    // Orta düzlemde (u = 0.5) tam keskin köşe oluşması için çift sayı garantisi
    return raw % 2 === 0 ? raw : raw + 1;
  }
}

/**
 * 4. Konik Eğimli Dişli (Bevel / Conical Taper Gear) Stratejisi
 */
export class BevelTaperTwistStrategy implements IAxialTwistStrategy {
  public readonly supportedType = GearType.BEVEL_TAPER;

  public computeTransform(
    normalizedHeight: number,
    params: GearParameters
  ): AxialSliceTransform {
    const taper = Math.min(0.45, Math.max(0.0, params.bevelTaperFactor));
    const radialScale = 1.0 - normalizedHeight * taper;

    return {
      rotationAngleRad: 0,
      radialScale,
    };
  }

  public resolveSliceCount(params: GearParameters): number {
    return Math.max(4, Math.round(params.axialSlices * 0.5));
  }
}
