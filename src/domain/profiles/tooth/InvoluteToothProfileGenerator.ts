import { InvoluteMathCalculator } from '../../calculators/InvoluteMathCalculator';
import { GearParameters } from '../../models/GearParameters';
import { GearType } from '../../models/GearTypes';
import { Point2D, PolygonLoop2D } from '../../models/GeometryTypes';
import { IToothProfileGenerator } from '../interfaces/IToothProfileGenerator';

/**
 * ISO Evolvent (Involute) diş profilini dipten radyüs (root fillet),
 * profil kaydırma (profile shift), yan boşluk (backlash) ve diş ucu pahı (tip relief)
 * ile birlikte üreten sınıf (SRP / OCP).
 */
export class InvoluteToothProfileGenerator implements IToothProfileGenerator {
  public generateToothLoop(params: GearParameters): PolygonLoop2D {
    const z = Math.max(6, Math.round(params.teethCount));
    const radii = InvoluteMathCalculator.calculateRadii(params);
    const isInternal = params.gearType === GearType.INTERNAL_RING;

    const pitchAngle = (Math.PI * 2) / z;
    const halfPitchAngle = pitchAngle * 0.5;
    const flankSegments = Math.min(28, Math.max(6, Math.round(params.profileSegmentsPerFlank)));

    // Dış dişlide rRoot < rOuter; iç dişlide rRoot > rOuter (dişler merkeze doğru uzanır)
    const rRoot = radii.rootRadius;
    const rTip = radii.outerRadius;
    const rInvoluteStart = isInternal
      ? Math.min(rRoot, Math.max(radii.baseRadius, rTip + 0.05))
      : Math.max(rRoot, radii.baseRadius);

    // Dişin başlangıç ve uç yarıçaplarındaki yarı açısal kalınlıkları
    const maxAllowedHalfAngle = halfPitchAngle * 0.92;
    const minTipHalfAngle = 0.003;

    const baseHalfAngle = Math.min(
      maxAllowedHalfAngle,
      Math.max(
        minTipHalfAngle * 2,
        InvoluteMathCalculator.halfToothAngleAtRadius(rInvoluteStart, radii)
      )
    );

    // Diş dibi radyüsü (Root Fillet) açısal genişliği
    const availableRootSpace = Math.max(0.002, halfPitchAngle - baseHalfAngle);
    const filletRatio = Math.min(0.85, Math.max(0.0, params.rootFilletFactor * 1.6));
    const filletAngleSpan = availableRootSpace * filletRatio;

    const points: Point2D[] = [];
    const rootSteps = 3;
    const filletSteps = Math.max(3, Math.round(flankSegments * 0.35));
    const tipArcSteps = 3;

    for (let toothIdx = 0; toothIdx < z; toothIdx++) {
      const toothCenterAngle = toothIdx * pitchAngle;

      // 1. Sol Diş Dibi Yay Bölgesi (Left Root Land)
      const leftRootStart = -halfPitchAngle;
      const leftFilletStart = -baseHalfAngle - filletAngleSpan;

      for (let i = 0; i < rootSteps; i++) {
        const t = i / rootSteps;
        const localTheta = leftRootStart + (leftFilletStart - leftRootStart) * t;
        const theta = toothCenterAngle + localTheta;
        points.push({ x: rRoot * Math.cos(theta), y: rRoot * Math.sin(theta) });
      }

      // 2. Sol Diş Dibi Radyüsü (Left Root Fillet: rRoot -> rInvoluteStart)
      for (let i = 0; i < filletSteps; i++) {
        const t = i / filletSteps;
        const localTheta = leftFilletStart + filletAngleSpan * t;
        // Yumuşak kosinüs geçişi ile kök radyüsü
        const blend = 1 - Math.cos(t * Math.PI * 0.5);
        const r = rRoot + (rInvoluteStart - rRoot) * blend;
        const theta = toothCenterAngle + localTheta;
        points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
      }

      // 3. Sol Evolvent Yanak (Left Involute Flank: rInvoluteStart -> rTip)
      const flankAngles: number[] = [];
      const flankRadii: number[] = [];

      for (let i = 0; i <= flankSegments; i++) {
        const t = i / flankSegments;
        const r = rInvoluteStart + (rTip - rInvoluteStart) * t;
        let halfAngle = InvoluteMathCalculator.halfToothAngleAtRadius(r, radii);

        // Diş ucu pahı / Tip Relief (son %25'lik kısımda yumuşak daralma)
        if (params.tipReliefFactor > 0 && t > 0.75) {
          const reliefT = (t - 0.75) / 0.25;
          const reliefAngle =
            (params.tipReliefFactor * radii.module * 0.18 * reliefT * reliefT) /
            Math.max(1, r);
          halfAngle -= reliefAngle;
        }

        halfAngle = Math.min(baseHalfAngle, Math.max(minTipHalfAngle, halfAngle));
        flankRadii.push(r);
        flankAngles.push(halfAngle);
      }

      // Monoton azalan açı garantisi (kendiyle kesişmeyi %100 önler)
      for (let i = 1; i < flankAngles.length; i++) {
        if (flankAngles[i] > flankAngles[i - 1]) {
          flankAngles[i] = flankAngles[i - 1];
        }
      }

      // Sol yanak noktalarını ekle (-flankAngles[i] artarak 0'a yaklaşır)
      for (let i = 0; i <= flankSegments; i++) {
        const r = flankRadii[i];
        const theta = toothCenterAngle - flankAngles[i];
        points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
      }

      // 4. Diş Üstü / Ucu Yayı (Top Land: -tipHalfAngle -> +tipHalfAngle)
      const tipHalfAngle = flankAngles[flankSegments];
      for (let i = 1; i < tipArcSteps; i++) {
        const t = i / tipArcSteps;
        const localTheta = -tipHalfAngle + 2 * tipHalfAngle * t;
        const theta = toothCenterAngle + localTheta;
        points.push({ x: rTip * Math.cos(theta), y: rTip * Math.sin(theta) });
      }

      // 5. Sağ Evolvent Yanak (Right Involute Flank: rTip -> rInvoluteStart)
      for (let i = flankSegments; i >= 0; i--) {
        const r = flankRadii[i];
        const theta = toothCenterAngle + flankAngles[i];
        points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
      }

      // 6. Sağ Diş Dibi Radyüsü (Right Root Fillet: rInvoluteStart -> rRoot)
      for (let i = 1; i <= filletSteps; i++) {
        const t = i / filletSteps;
        const localTheta = baseHalfAngle + filletAngleSpan * t;
        const blend = Math.sin(t * Math.PI * 0.5);
        const r = rInvoluteStart + (rRoot - rInvoluteStart) * blend;
        const theta = toothCenterAngle + localTheta;
        points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
      }
    }

    return points;
  }
}
