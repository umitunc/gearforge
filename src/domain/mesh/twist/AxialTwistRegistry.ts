import { GearType } from '../../models/GearTypes';
import { IAxialTwistStrategy } from '../interfaces/IAxialTwistStrategy';
import {
  BevelTaperTwistStrategy,
  HelicalTwistStrategy,
  HerringboneTwistStrategy,
  SpurTwistStrategy,
} from './AxialTwistStrategies';

/**
 * Eksenel burulma ve konik daralma stratejilerini yöneten kayıt defteri (OCP / DIP).
 */
export class AxialTwistRegistry {
  private readonly strategies = new Map<GearType, IAxialTwistStrategy>();

  constructor(customStrategies?: readonly IAxialTwistStrategy[]) {
    const defaults: IAxialTwistStrategy[] = [
      new SpurTwistStrategy(GearType.SPUR),
      new SpurTwistStrategy(GearType.INTERNAL_RING),
      new HelicalTwistStrategy(),
      new HerringboneTwistStrategy(),
      new BevelTaperTwistStrategy(),
    ];

    for (const s of defaults) {
      this.register(s);
    }

    if (customStrategies) {
      for (const s of customStrategies) {
        this.register(s);
      }
    }
  }

  public register(strategy: IAxialTwistStrategy): void {
    this.strategies.set(strategy.supportedType, strategy);
  }

  public resolve(type: GearType): IAxialTwistStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Desteklenmeyen dişli tipi: ${type}`);
    }
    return strategy;
  }
}
