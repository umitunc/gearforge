import { describe, expect, it } from 'vitest';
import { GearDimensionThumbnail2D } from '../../presentation/components/GearDimensionThumbnail2D';

describe('GearDimensionThumbnail2D', () => {
  const sampleKeys = [
    'teethCount',
    'module',
    'targetPitchDiameter',
    'targetOuterDiameter',
    'thickness',
    'helixAngleDeg',
    'boreDiameter',
    'keywayWidth',
    'keywayDepth',
    'dShaftFlatDepth',
    'hubDiameter',
    'hubTopExtension',
    'rimThickness',
    'webThickness',
    'cutoutCount',
    'pressureAngleDeg',
    'profileShift',
    'backlashMm',
    'boreClearanceMm',
    'unknownKey',
  ];

  it('renders valid SVG for all dimension keys', () => {
    for (const key of sampleKeys) {
      const svg = GearDimensionThumbnail2D.renderSvg(key, 15.5, {
        width: 108,
        height: 76,
        showValue: true,
      });

      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox="0 0 110 80"');
      expect(svg).toContain('width="108"');
      expect(svg).toContain('height="76"');
      expect(svg).toContain('class="gear-2d-thumbnail-svg"');
    }
  });

  it('supports hiding value label when showValue is false', () => {
    const svg = GearDimensionThumbnail2D.renderSvg('module', 2.5, { showValue: false });
    expect(svg).not.toContain('>2D CAD<');
  });

  it('embeds value into the technical blueprint', () => {
    const svg = GearDimensionThumbnail2D.renderSvg('teethCount', 24);
    expect(svg).toContain('z=24');

    const svgModule = GearDimensionThumbnail2D.renderSvg('module', 2.5);
    expect(svgModule).toContain('m=2.5');
  });
});
