import { GearParameters } from './GearParameters';

export interface SavedGearProjectSummary {
  readonly gearType: string;
  readonly teethCount: number;
  readonly module: number;
  readonly pitchDiameter: number;
  readonly outerDiameter: number;
  readonly thickness: number;
  readonly boreType: string;
  readonly boreDiameter: number;
  readonly material: string;
}

export interface SavedGearProject {
  readonly id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  parameters: GearParameters;
  summary: SavedGearProjectSummary;
}
