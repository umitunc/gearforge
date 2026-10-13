import { ValidationIssue } from '../models/GearMetrics';
import { GearParameters } from '../models/GearParameters';
import { BoreType, GearType, SizingMode, WebStyle } from '../models/GearTypes';
import { InvoluteMathCalculator } from './InvoluteMathCalculator';

/**
 * Dişli parametrelerini mekanik ve 3D baskı kurallarına göre doğrulayan ve normalize eden sınıf (SRP).
 */
export class GearParameterValidator {
  /**
   * Parametreleri güvenli sınırlar içine normalize eder ve bağımlı çap/modül değerlerini senkronize eder.
   */
  public sanitize(raw: GearParameters): GearParameters {
    const teethCount = Math.min(180, Math.max(6, Math.round(raw.teethCount)));
    const pressureAngleDeg = Math.min(35, Math.max(12, raw.pressureAngleDeg));
    const profileShift = Math.min(0.8, Math.max(-0.5, raw.profileShift));
    const addendumFactor = Math.min(1.5, Math.max(0.4, raw.addendumFactor));
    const dedendumFactor = Math.min(1.8, Math.max(0.5, raw.dedendumFactor));

    const tempParams: GearParameters = {
      ...raw,
      teethCount,
      pressureAngleDeg,
      profileShift,
      addendumFactor,
      dedendumFactor,
    };

    const effectiveModule = InvoluteMathCalculator.resolveEffectiveModule(tempParams);
    const pitchDiameter = effectiveModule * teethCount;
    const outerDiameter =
      raw.gearType === GearType.INTERNAL_RING
        ? pitchDiameter + 2 * (effectiveModule * dedendumFactor + raw.outerRingWallThickness)
        : pitchDiameter + 2 * effectiveModule * (addendumFactor + profileShift);

    const thickness = Math.min(120, Math.max(1.0, raw.thickness));
    const webThickness = Math.min(thickness, Math.max(1.0, raw.webThickness));

    return {
      ...tempParams,
      module: Number(effectiveModule.toFixed(4)),
      targetPitchDiameter:
        raw.sizingMode === SizingMode.PITCH_DIAMETER
          ? raw.targetPitchDiameter
          : Number(pitchDiameter.toFixed(2)),
      targetOuterDiameter:
        raw.sizingMode === SizingMode.OUTER_DIAMETER
          ? raw.targetOuterDiameter
          : Number(outerDiameter.toFixed(2)),
      thickness,
      webThickness,
      cutoutCount: Math.min(16, Math.max(3, Math.round(raw.cutoutCount))),
      splineCount: Math.min(24, Math.max(3, Math.round(raw.splineCount))),
      profileSegmentsPerFlank: Math.min(28, Math.max(6, Math.round(raw.profileSegmentsPerFlank))),
      axialSlices: Math.min(64, Math.max(2, Math.round(raw.axialSlices))),
    };
  }

  /**
   * Mekanik tasarım ve 3D yazıcı uyumluluk uyarılarını üretir.
   */
  public validate(params: GearParameters): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const radii = InvoluteMathCalculator.calculateRadii(params);
    const effectiveBoreRadius =
      params.boreType === BoreType.NONE
        ? 0
        : (params.boreDiameter + params.boreClearanceMm * 2) * 0.5;

    // 1. Modül ve 0.4mm Nozzle uyumluluğu
    if (radii.module < 0.8) {
      issues.push({
        code: 'SMALL_MODULE_NOZZLE',
        severity: 'warning',
        message: `Modül (${radii.module.toFixed(2)} mm) standart 0.4 mm FDM nozzle için oldukça küçük.`,
        suggestion: '0.4 mm nozzle ile temiz diş profili için Modül >= 1.0 mm veya 0.2 mm nozzle önerilir.',
      });
    }

    // 2. Dipten kesilme (Undercut) kontrolü
    const sinAlpha = Math.sin(radii.pressureAngleRad);
    const minTeeth = Math.ceil(
      (2 * params.addendumFactor * (1 - params.profileShift)) /
        Math.max(0.01, sinAlpha * sinAlpha)
    );
    if (params.gearType !== GearType.INTERNAL_RING && params.teethCount < minTeeth) {
      const recShift = Number(
        Math.max(0.1, 1 - (params.teethCount * sinAlpha * sinAlpha) / 2).toFixed(2)
      );
      issues.push({
        code: 'UNDERCUT_RISK',
        severity: 'warning',
        message: `${params.teethCount} diş sayısı, ${params.pressureAngleDeg}° kavrama açısında dipten kesilme (undercut) sınırının (${minTeeth} diş) altında.`,
        suggestion: `Diş dibi mukavemetini artırmak için Profil Kaydırma (x) değerini +${recShift} civarına çıkarabilirsiniz.`,
      });
    }

    // 3. Delik çapı vs Diş dibi çapı kontrolü
    if (params.gearType !== GearType.INTERNAL_RING && params.boreType !== BoreType.NONE) {
      const minWallBetweenBoreAndRoot = radii.rootRadius - effectiveBoreRadius;
      if (minWallBetweenBoreAndRoot < 1.8) {
        issues.push({
          code: 'BORE_TOO_LARGE',
          severity: 'error',
          message: `Delik çapı (${params.boreDiameter.toFixed(1)} mm) diş dibi çapına (${(radii.rootRadius * 2).toFixed(1)} mm) çok yakın veya büyük!`,
          suggestion: 'Delik çapını küçültün veya diş sayısı / modül değerini artırın (Geometri otomatik güvenli sınıra çekildi).',
        });
      }
    }

    // 4. Hafifletme / Kol (Spoke) alanı yeterliliği
    if (
      params.gearType !== GearType.INTERNAL_RING &&
      (params.webStyle === WebStyle.LIGHTENING_HOLES || params.webStyle === WebStyle.SPOKED)
    ) {
      const radialSpan =
        radii.rootRadius - params.rimThickness - Math.max(effectiveBoreRadius + 1.5, params.hubDiameter * 0.5);
      if (radialSpan < 3.5) {
        issues.push({
          code: 'WEB_SPAN_TOO_NARROW',
          severity: 'info',
          message: 'Göbek (Hub) ile Çember (Rim) arasındaki radyal mesafe hafifletme delikleri için dar.',
          suggestion: 'Hafifletme pencerelerinin görünmesi için dişli çapını büyütün veya Hub/Rim kalınlığını azaltın.',
        });
      }
    }

    // 5. Helisel dişlide 3D baskı sarkan açı (Overhang) kontrolü
    if (
      (params.gearType === GearType.HELICAL || params.gearType === GearType.HERRINGBONE) &&
      params.helixAngleDeg > 35
    ) {
      issues.push({
        code: 'HIGH_HELIX_OVERHANG',
        severity: 'warning',
        message: `${params.helixAngleDeg}° helis açısı desteksiz (supportless) 3D baskıda sarkma yapabilir.`,
        suggestion: 'FDM yazıcılarda temiz baskı için 15° - 30° arası helis açısı idealdir.',
      });
    }

    return issues;
  }
}
