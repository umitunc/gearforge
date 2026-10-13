import { WebStyle } from '../../models/GearTypes';
import { IWebCutoutGenerator } from '../interfaces/IWebCutoutGenerator';
import {
  LighteningHolesGenerator,
  SolidOrRecessedWebGenerator,
  SpokedWebGenerator,
} from './WebCutoutGenerators';

/**
 * Gövde hafifletme stratejilerini yöneten kayıt defteri (OCP / DIP).
 */
export class WebCutoutRegistry {
  private readonly generators = new Map<WebStyle, IWebCutoutGenerator>();

  constructor(customGenerators?: readonly IWebCutoutGenerator[]) {
    const defaults: IWebCutoutGenerator[] = [
      new SolidOrRecessedWebGenerator(WebStyle.SOLID),
      new SolidOrRecessedWebGenerator(WebStyle.RECESSED),
      new LighteningHolesGenerator(),
      new SpokedWebGenerator(),
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

  public register(generator: IWebCutoutGenerator): void {
    this.generators.set(generator.supportedStyle, generator);
  }

  public resolve(style: WebStyle): IWebCutoutGenerator {
    const generator = this.generators.get(style);
    if (!generator) {
      throw new Error(`Desteklenmeyen gövde tipi: ${style}`);
    }
    return generator;
  }
}
