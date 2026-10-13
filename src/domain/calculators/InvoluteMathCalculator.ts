import { GearParameters } from '../models/GearParameters';
import { GearType, SizingMode } from '../models/GearTypes';

export interface InvoluteRadii {
  readonly module: number;
  readonly pitchRadius: number;
  readonly baseRadius: number;
  readonly outerRadius: number;
  readonly rootRadius: number;
  readonly addendum: number;
  readonly dedendum: number;
  readonly circularPitch: number;
  readonly toothThicknessAtPitch: number;
  readonly pressureAngleRad: number;
  readonly invPitchAngle: number;
}

/**
 * Evolvent (Involute) dişli geometrisi için saf matematiksel hesaplama sınıfı (SRP).
 */
export class InvoluteMathCalculator {
  private static readonly DEG_TO_RAD = Math.PI / 180;

  /**
   * Dereceyi radyana çevirir.
   */
  public static degToRad(deg: number): number {
    return deg * InvoluteMathCalculator.DEG_TO_RAD;
  }

  /**
   * Evolvent fonksiyonu: inv(alpha) = tan(alpha) - alpha
   */
  public static involute(angleRad: number): number {
    return Math.tan(angleRad) - angleRad;
  }

  /**
   * Seçilen boyutlandırma moduna göre etkin modülü (m) hesaplar.
   */
  public static resolveEffectiveModule(params: GearParameters): number {
    const z = Math.max(6, Math.round(params.teethCount));

    switch (params.sizingMode) {
      case SizingMode.PITCH_DIAMETER: {
        const targetD = Math.max(4, params.targetPitchDiameter);
        return Math.max(0.25, targetD / z);
      }
      case SizingMode.OUTER_DIAMETER: {
        const targetDa = Math.max(6, params.targetOuterDiameter);
        const factor = z + 2 * (params.addendumFactor + params.profileShift);
        return Math.max(0.25, targetDa / Math.max(2, factor));
      }
      case SizingMode.MODULE:
      default:
        return Math.max(0.25, params.module);
    }
  }

  /**
   * Dişlinin tüm temel yarıçaplarını ve evolvent parametrelerini hesaplar.
   */
  public static calculateRadii(params: GearParameters): InvoluteRadii {
    const z = Math.max(6, Math.round(params.teethCount));
    const m = InvoluteMathCalculator.resolveEffectiveModule(params);
    const alphaRad = InvoluteMathCalculator.degToRad(
      Math.min(35, Math.max(10, params.pressureAngleDeg))
    );

    const pitchDiameter = m * z;
    const pitchRadius = pitchDiameter * 0.5;
    const baseRadius = pitchRadius * Math.cos(alphaRad);

    const isInternal = params.gearType === GearType.INTERNAL_RING;

    // Profil kaydırma (x) dahil diş üstü (addendum) ve diş dibi (dedendum)
    const addendum = isInternal
      ? m * Math.max(0.3, params.addendumFactor - params.profileShift)
      : m * Math.max(0.3, params.addendumFactor + params.profileShift);

    const dedendum = isInternal
      ? m * Math.max(0.4, params.dedendumFactor + params.profileShift)
      : m * Math.max(0.4, params.dedendumFactor - params.profileShift);

    // Dış dişlide diş ucu dışarıda (r + ha), iç dişlide diş ucu içeride (r - ha)
    const outerRadius = isInternal
      ? Math.max(2.0, pitchRadius - addendum)
      : pitchRadius + addendum;

    const rootRadius = isInternal
      ? pitchRadius + dedendum
      : Math.max(1.5, pitchRadius - dedendum);

    const circularPitch = Math.PI * m;

    // Bölüm dairesi üzerindeki yay kalınlığı: s = m * (pi/2 + 2*x*tan(alpha)) - backlash
    const theoreticalThickness =
      m * (Math.PI * 0.5 + 2 * params.profileShift * Math.tan(alphaRad));
    const toothThicknessAtPitch = Math.max(
      m * 0.25,
      theoreticalThickness - Math.max(0, params.backlashMm)
    );

    const invPitchAngle = InvoluteMathCalculator.involute(alphaRad);

    return {
      module: m,
      pitchRadius,
      baseRadius,
      outerRadius,
      rootRadius,
      addendum,
      dedendum,
      circularPitch,
      toothThicknessAtPitch,
      pressureAngleRad: alphaRad,
      invPitchAngle,
    };
  }

  /**
   * Herhangi bir r yarıçapındaki evolvent kavrama açısını (alpha_r) hesaplar.
   */
  public static pressureAngleAtRadius(r: number, baseRadius: number): number {
    if (r <= baseRadius) {
      return 0;
    }
    return Math.acos(Math.min(1, Math.max(-1, baseRadius / r)));
  }

  /**
   * Herhangi bir r yarıçapındaki yarı diş açısal kalınlığını (radyan) döndürür.
   */
  public static halfToothAngleAtRadius(
    r: number,
    radii: InvoluteRadii
  ): number {
    const halfAngleAtPitch = radii.toothThicknessAtPitch / (2 * radii.pitchRadius);
    if (r <= radii.baseRadius) {
      return halfAngleAtPitch + radii.invPitchAngle;
    }
    const alphaR = InvoluteMathCalculator.pressureAngleAtRadius(r, radii.baseRadius);
    const invAlphaR = InvoluteMathCalculator.involute(alphaR);
    return halfAngleAtPitch + radii.invPitchAngle - invAlphaR;
  }
}
