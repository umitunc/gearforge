import { GearMetrics } from '../models/GearMetrics';
import { GearParameters } from '../models/GearParameters';
import { BoreType, FilamentMaterial, GearType, WebStyle } from '../models/GearTypes';
import { InvoluteMathCalculator } from './InvoluteMathCalculator';

/**
 * Filament materyallerinin özkütle tablosu (g/cm^3)
 */
const FILAMENT_DENSITY_MAP: Record<FilamentMaterial, number> = {
  [FilamentMaterial.PLA]: 1.24,
  [FilamentMaterial.PETG]: 1.27,
  [FilamentMaterial.ABS]: 1.04,
  [FilamentMaterial.ASA]: 1.07,
  [FilamentMaterial.NYLON_PA12]: 1.02,
  [FilamentMaterial.TPU]: 1.21,
};

/**
 * Dişli mühendislik hesaplamaları ve 3D baskı metrikleri hesaplayıcısı (SRP).
 */
export class GearMetricsCalculator {
  /**
   * Verilen dişli parametreleri ve opsiyonel gerçek mesh hacmi üzerinden tüm metrikleri üretir.
   */
  public calculate(params: GearParameters, actualMeshVolumeMm3?: number): GearMetrics {
    const radii = InvoluteMathCalculator.calculateRadii(params);
    const z1 = Math.max(6, Math.round(params.teethCount));
    const z2 = Math.max(6, Math.round(params.matingTeethCount));

    const pitchDiameter = radii.pitchRadius * 2;
    const baseDiameter = radii.baseRadius * 2;
    const outerDiameter = radii.outerRadius * 2;
    const rootDiameter = radii.rootRadius * 2;

    const wholeDepth = radii.addendum + radii.dedendum;
    const basePitch = radii.circularPitch * Math.cos(radii.pressureAngleRad);

    // 3D Yazıcı iç delik toleransı uygulanmış etkin delik çapı
    const effectiveBoreDiameter =
      params.boreType === BoreType.NONE
        ? 0
        : Math.max(0.5, params.boreDiameter + params.boreClearanceMm * 2);

    const boreRadius = effectiveBoreDiameter * 0.5;

    // Etkin Rim (Çember) iç yarıçapı ve Hub (Göbek) dış yarıçapı sınırlandırması
    const maxSafeRimRadius = Math.max(boreRadius + 1.5, radii.rootRadius - 1.2);
    const desiredRimRadius = Math.max(
      boreRadius + 1.5,
      radii.rootRadius - Math.max(1.2, params.rimThickness)
    );
    const effectiveRimRadius = Math.min(maxSafeRimRadius, desiredRimRadius);

    const minHubRadius = boreRadius + 1.2;
    const desiredHubRadius = Math.max(minHubRadius, params.hubDiameter * 0.5);
    const effectiveHubRadius = Math.min(effectiveRimRadius, desiredHubRadius);

    // Dipten kesilme (undercut) olmaması için minimum diş sayısı: z_min = 2 * ha* / sin^2(alpha)
    const sinAlpha = Math.sin(radii.pressureAngleRad);
    const minimumTeethNoUndercut = Math.ceil(
      (2 * params.addendumFactor * (1 - params.profileShift)) /
        Math.max(0.01, sinAlpha * sinAlpha)
    );

    // Eşleşen dişli ile kavrama oranı (Contact Ratio - epsilon_alpha)
    const rPitch2 = radii.module * z2 * 0.5;
    const rBase2 = rPitch2 * Math.cos(radii.pressureAngleRad);
    const rAdd2 = rPitch2 + radii.module * params.addendumFactor;
    const rAdd1 = Math.max(radii.outerRadius, radii.rootRadius);

    const term1 = Math.sqrt(Math.max(0, rAdd1 * rAdd1 - radii.baseRadius * radii.baseRadius));
    const term2 = Math.sqrt(Math.max(0, rAdd2 * rAdd2 - rBase2 * rBase2));
    const centerDist =
      params.gearType === GearType.INTERNAL_RING
        ? Math.abs(radii.pitchRadius - rPitch2)
        : radii.pitchRadius + rPitch2;
    const term3 = (radii.pitchRadius + rPitch2) * Math.sin(radii.pressureAngleRad);
    const contactRatio = Math.max(1.0, (term1 + term2 - term3) / Math.max(0.1, basePitch));

    const gearRatio = z1 / z2;

    const hasHubExtension = params.gearType !== GearType.INTERNAL_RING;
    const totalAxialHeight =
      params.thickness +
      (hasHubExtension ? Math.max(0, params.hubTopExtension) + Math.max(0, params.hubBottomExtension) : 0);

    // Hacim ve 3D baskı ağırlık hesabı
    const volumeMm3 =
      actualMeshVolumeMm3 !== undefined && actualMeshVolumeMm3 > 0
        ? actualMeshVolumeMm3
        : this.estimateAnalyticalVolumeMm3(
            params,
            radii.pitchRadius,
            boreRadius,
            effectiveHubRadius,
            effectiveRimRadius
          );

    const estimatedVolumeCm3 = volumeMm3 / 1000;
    const density = FILAMENT_DENSITY_MAP[params.filamentMaterial] ?? 1.24;
    // Duvar/kabuk (shell) oranı %35 sabit + kalan %65 hacim infill oranına göre hesaplanır
    const shellFraction = 0.35;
    const infillFraction = Math.min(1, Math.max(0.05, params.infillPercentage / 100));
    const effectiveDensityFactor = shellFraction + (1 - shellFraction) * infillFraction;
    const estimatedWeightGrams = estimatedVolumeCm3 * density * effectiveDensityFactor;

    return {
      effectiveModule: radii.module,
      pitchDiameter,
      baseDiameter,
      outerDiameter,
      rootDiameter,
      addendum: radii.addendum,
      dedendum: radii.dedendum,
      wholeDepth,
      circularPitch: radii.circularPitch,
      basePitch,
      toothThicknessAtPitch: radii.toothThicknessAtPitch,
      effectiveBoreDiameter,
      effectiveRimRadius,
      effectiveHubRadius,
      minimumTeethNoUndercut,
      contactRatio,
      gearRatio,
      centerDistance: centerDist,
      totalAxialHeight,
      estimatedVolumeCm3,
      estimatedWeightGrams,
    };
  }

  /**
   * Mesh henüz oluşturulmadığında kullanılan hızlı analitik hacim tahmini (mm^3)
   */
  private estimateAnalyticalVolumeMm3(
    params: GearParameters,
    pitchRadius: number,
    boreRadius: number,
    hubRadius: number,
    rimRadius: number
  ): number {
    if (params.gearType === GearType.INTERNAL_RING) {
      const outerR = pitchRadius + params.outerRingWallThickness + params.module;
      return Math.PI * (outerR * outerR - pitchRadius * pitchRadius) * params.thickness;
    }

    const rimArea = Math.PI * (pitchRadius * pitchRadius - rimRadius * rimRadius);
    const webArea = Math.PI * (rimRadius * rimRadius - hubRadius * hubRadius);
    const hubArea = Math.PI * (hubRadius * hubRadius - boreRadius * boreRadius);

    const webHeight =
      params.webStyle === WebStyle.SOLID
        ? params.thickness
        : Math.min(params.thickness, Math.max(1.0, params.webThickness));

    const cutoutFactor =
      params.webStyle === WebStyle.LIGHTENING_HOLES
        ? 0.65
        : params.webStyle === WebStyle.SPOKED
          ? params.spokeWidthFactor
          : 1.0;

    const hubHeight =
      params.thickness + Math.max(0, params.hubTopExtension) + Math.max(0, params.hubBottomExtension);

    return (
      rimArea * params.thickness +
      webArea * webHeight * cutoutFactor +
      hubArea * hubHeight
    );
  }
}
