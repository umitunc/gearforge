import { BoreType } from '../../models/GearTypes';
import { IBoreProfileGenerator } from '../interfaces/IBoreProfileGenerator';
import {
  CircularBoreGenerator,
  DoubleDShaftBoreGenerator,
  DShaftBoreGenerator,
  KeywayBoreGenerator,
  PolygonalBoreGenerator,
  SolidBoreGenerator,
  SplineBoreGenerator,
} from './BoreGenerators';

/**
 * Merkez delik profil üreticilerini yöneten kayıt defteri (OCP / DIP).
 * Yeni bir delik tipi eklendiğinde mevcut sınıflar değiştirilmeden buraya kaydedilebilir.
 */
export class BoreProfileRegistry {
  private readonly generators = new Map<BoreType, IBoreProfileGenerator>();

  constructor(customGenerators?: readonly IBoreProfileGenerator[]) {
    const defaults: IBoreProfileGenerator[] = [
      new SolidBoreGenerator(),
      new CircularBoreGenerator(),
      new DShaftBoreGenerator(),
      new DoubleDShaftBoreGenerator(),
      new KeywayBoreGenerator(),
      new PolygonalBoreGenerator(BoreType.HEXAGONAL, 6),
      new PolygonalBoreGenerator(BoreType.SQUARE, 4),
      new SplineBoreGenerator(),
    ];

    for (const gen of defaults) {
      this.register(gen);
    }

    if (customGenerators) {
      for (const gen of customGenerators) {
        this.register(gen);
      }
    }
  }

  public register(generator: IBoreProfileGenerator): void {
    this.generators.set(generator.supportedType, generator);
  }

  public resolve(type: BoreType): IBoreProfileGenerator {
    const generator = this.generators.get(type);
    if (!generator) {
      throw new Error(`Desteklenmeyen delik tipi: ${type}`);
    }
    return generator;
  }
}
