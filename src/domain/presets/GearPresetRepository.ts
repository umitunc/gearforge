import { createDefaultGearParameters, GearParameters } from '../models/GearParameters';
import {
  BoreType,
  FilamentMaterial,
  GearType,
  HelixHandedness,
  SizingMode,
  WebStyle,
} from '../models/GearTypes';

export interface GearPreset {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly parameters: GearParameters;
}

/**
 * 3D Yazıcı ve mekanik tasarım senaryoları için hazır dişli şablonları (SRP).
 */
export class GearPresetRepository {
  private readonly presets: readonly GearPreset[];

  constructor() {
    const base = createDefaultGearParameters();

    this.presets = [
      {
        id: 'standard_spur_keyway',
        name: 'Endüstriyel Düz Dişli (Kamalı)',
        category: 'Standart',
        description: 'DIN 6885 kama kanallı, 6 hafifletme delikli, Modül 2.0 genel amaçlı güç aktarım dişlisi.',
        parameters: {
          ...base,
          gearType: GearType.SPUR,
          teethCount: 24,
          module: 2.0,
          thickness: 10.0,
          boreType: BoreType.KEYWAY,
          boreDiameter: 10.0,
          keywayWidth: 3.0,
          keywayDepth: 1.5,
          webStyle: WebStyle.LIGHTENING_HOLES,
          cutoutCount: 6,
          hubTopExtension: 4.0,
          showMatingGear: true,
          matingTeethCount: 14,
        },
      },
      {
        id: 'nema17_dshaft_pinion',
        name: 'NEMA 17 Step Motor Pinyonu (5mm D-Mil)',
        category: 'Step Motor / CNC',
        description: '5 mm D-kesikli NEMA 17 step motor miline doğrudan geçen, dipten kesilmeyi önlemek için +0.20 profil kaydırmalı pinyon.',
        parameters: {
          ...base,
          gearType: GearType.SPUR,
          teethCount: 15,
          module: 1.5,
          profileShift: 0.2,
          thickness: 9.0,
          boreType: BoreType.D_SHAFT,
          boreDiameter: 5.0,
          dShaftFlatDepth: 0.55,
          webStyle: WebStyle.SOLID,
          hubDiameter: 13.0,
          hubTopExtension: 6.0,
          showMatingGear: true,
          matingTeethCount: 30,
        },
      },
      {
        id: 'herringbone_extruder',
        name: 'Çavuş (Herringbone) Sessiz Extruder Dişlisi',
        category: '3D Yazıcı Parçası',
        description: 'Eksenel kuvvetleri kendi içinde dengeleyen, sessiz çalışan çift helisel (çavuş) dişli.',
        parameters: {
          ...base,
          gearType: GearType.HERRINGBONE,
          teethCount: 32,
          module: 1.5,
          helixAngleDeg: 25,
          thickness: 12.0,
          boreType: BoreType.CIRCULAR,
          boreDiameter: 8.0,
          webStyle: WebStyle.LIGHTENING_HOLES,
          cutoutCount: 8,
          rimThickness: 4.0,
          webThickness: 6.0,
          hubDiameter: 18.0,
          hubTopExtension: 2.0,
          axialSlices: 28,
          filamentMaterial: FilamentMaterial.PETG,
          showMatingGear: true,
          matingTeethCount: 13,
        },
      },
      {
        id: 'helical_hex_torque',
        name: 'Helisel Dişli (Altıgen Somun/Mil Yuvalı)',
        category: 'Robotik',
        description: 'Yumuşak kavrama sağlayan 20° sağ helis açılı, 8 mm altıgen mil/somun göbekli dişli.',
        parameters: {
          ...base,
          gearType: GearType.HELICAL,
          teethCount: 28,
          module: 2.0,
          helixAngleDeg: 20,
          helixHandedness: HelixHandedness.RIGHT,
          thickness: 12.0,
          boreType: BoreType.HEXAGONAL,
          boreDiameter: 8.0,
          webStyle: WebStyle.RECESSED,
          rimThickness: 4.5,
          webThickness: 5.0,
          hubDiameter: 20.0,
          hubTopExtension: 3.0,
          showMatingGear: false,
        },
      },
      {
        id: 'spoked_large_reduction',
        name: 'Jant Kollu Büyük Redüksiyon Dişlisi',
        category: 'Mekanik / Redüktör',
        description: 'Minimum filament harcaması için 6 jant koluyla hafifletilmiş, çok kamalı (Spline) merkez delikli büyük dişli.',
        parameters: {
          ...base,
          gearType: GearType.SPUR,
          sizingMode: SizingMode.OUTER_DIAMETER,
          teethCount: 44,
          module: 2.0,
          targetOuterDiameter: 92.0,
          thickness: 10.0,
          boreType: BoreType.SPLINE,
          boreDiameter: 12.0,
          splineCount: 8,
          splineDepth: 1.4,
          webStyle: WebStyle.SPOKED,
          cutoutCount: 6,
          spokeWidthFactor: 0.55,
          rimThickness: 5.0,
          webThickness: 5.5,
          hubDiameter: 26.0,
          hubTopExtension: 4.0,
          showMatingGear: true,
          matingTeethCount: 16,
        },
      },
      {
        id: 'planetary_internal_ring',
        name: 'Planet Mekanizması İç Çember Dişlisi',
        category: 'Planet Redüktör',
        description: 'Planet dişli kutuları için içe bakan evolvent dişlere sahip dış halka (Internal Ring Gear).',
        parameters: {
          ...base,
          gearType: GearType.INTERNAL_RING,
          teethCount: 42,
          module: 1.75,
          thickness: 10.0,
          outerRingWallThickness: 7.0,
          showMatingGear: true,
          matingTeethCount: 15,
        },
      },
      {
        id: 'bevel_taper_gear',
        name: 'Konik Eğimli (Bevel Taper) Dişli',
        category: 'Özel Form',
        description: 'Açılı güç aktarımı ve konik geçme tasarımlar için üst yüzeye doğru daralan konik dişli.',
        parameters: {
          ...base,
          gearType: GearType.BEVEL_TAPER,
          teethCount: 22,
          module: 2.2,
          bevelTaperFactor: 0.26,
          thickness: 12.0,
          boreType: BoreType.DOUBLE_D,
          boreDiameter: 8.0,
          dShaftFlatDepth: 1.0,
          webStyle: WebStyle.RECESSED,
          webThickness: 6.0,
          hubDiameter: 18.0,
          hubTopExtension: 2.0,
          showMatingGear: false,
        },
      },
    ];
  }

  public getAll(): readonly GearPreset[] {
    return this.presets;
  }

  public getById(id: string): GearPreset | undefined {
    return this.presets.find((p) => p.id === id);
  }
}
