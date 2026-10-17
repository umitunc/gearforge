/**
 * GearDimensionThumbnail2D.ts
 * GearForge 3D — Her bir parametre ve ölçü için 2D CAD Teknik Çizim Önizleme (Thumbnail) Üreteci.
 * Geliştirici: Trunçgil Teknoloji (https://www.truncgil.com.tr)
 */

export interface ThumbnailRenderOptions {
  readonly width?: number;
  readonly height?: number;
  readonly showValue?: boolean;
}

export class GearDimensionThumbnail2D {
  /**
   * Belirtilen parametre anahtarı ve değeri için 2D SVG teknik çizim döndürür.
   */
  public static renderSvg(
    key: string,
    value: number,
    options: ThumbnailRenderOptions = {}
  ): string {
    const width = options.width ?? 110;
    const height = options.height ?? 80;
    const showValue = options.showValue ?? true;

    const valStr = Number(value.toFixed(2)).toString();

    let innerContent = '';

    switch (key) {
      // Dişli Tipleri
      case 'spur':
      case 'gearType_spur':
        innerContent = GearDimensionThumbnail2D.drawSpurGear(valStr);
        break;
      case 'helical':
      case 'gearType_helical':
        innerContent = GearDimensionThumbnail2D.drawHelicalGear(valStr);
        break;
      case 'herringbone':
      case 'gearType_herringbone':
        innerContent = GearDimensionThumbnail2D.drawHerringboneGear(valStr);
        break;
      case 'bevel':
      case 'gearType_bevel':
        innerContent = GearDimensionThumbnail2D.drawBevelGear(valStr);
        break;
      case 'internal':
      case 'gearType_internal':
        innerContent = GearDimensionThumbnail2D.drawInternalGear(valStr);
        break;

      // Ölçüler & Parametreler
      case 'teethCount':
        innerContent = GearDimensionThumbnail2D.drawTeethCount(valStr);
        break;
      case 'module':
        innerContent = GearDimensionThumbnail2D.drawModule(valStr);
        break;
      case 'targetPitchDiameter':
        innerContent = GearDimensionThumbnail2D.drawPitchDiameter(valStr);
        break;
      case 'targetOuterDiameter':
        innerContent = GearDimensionThumbnail2D.drawOuterDiameter(valStr);
        break;
      case 'thickness':
        innerContent = GearDimensionThumbnail2D.drawThickness(valStr);
        break;
      case 'helixAngleDeg':
        innerContent = GearDimensionThumbnail2D.drawHelixAngle(valStr);
        break;
      case 'boreDiameter':
        innerContent = GearDimensionThumbnail2D.drawBoreDiameter(valStr);
        break;
      case 'keywayWidth':
        innerContent = GearDimensionThumbnail2D.drawKeywayWidth(valStr);
        break;
      case 'keywayDepth':
        innerContent = GearDimensionThumbnail2D.drawKeywayDepth(valStr);
        break;
      case 'dShaftFlatDepth':
        innerContent = GearDimensionThumbnail2D.drawDShaft(valStr);
        break;
      case 'hubDiameter':
        innerContent = GearDimensionThumbnail2D.drawHubDiameter(valStr);
        break;
      case 'hubTopExtension':
        innerContent = GearDimensionThumbnail2D.drawHubExtension(valStr);
        break;
      case 'rimThickness':
        innerContent = GearDimensionThumbnail2D.drawRimThickness(valStr);
        break;
      case 'webThickness':
        innerContent = GearDimensionThumbnail2D.drawWebThickness(valStr);
        break;
      case 'cutoutCount':
        innerContent = GearDimensionThumbnail2D.drawCutouts(valStr);
        break;
      case 'pressureAngleDeg':
        innerContent = GearDimensionThumbnail2D.drawPressureAngle(valStr);
        break;
      case 'profileShift':
        innerContent = GearDimensionThumbnail2D.drawProfileShift(valStr);
        break;
      case 'backlashMm':
        innerContent = GearDimensionThumbnail2D.drawBacklash(valStr);
        break;
      case 'boreClearanceMm':
        innerContent = GearDimensionThumbnail2D.drawClearance(valStr);
        break;
      default:
        innerContent = GearDimensionThumbnail2D.drawGenericGear(valStr);
        break;
    }

    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 110 80"
        width="${width}"
        height="${height}"
        class="gear-2d-thumbnail-svg"
      >
        <defs>
          <linearGradient id="blueprintBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0a101f" />
            <stop offset="100%" stop-color="#050811" />
          </linearGradient>
          <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(56, 189, 248, 0.06)" stroke-width="0.5" />
          </pattern>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#38bdf8" />
          </marker>
          <marker id="arrowAmber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#fbbf24" />
          </marker>
        </defs>

        <!-- Arka Plan ve CAD Izgarası -->
        <rect width="110" height="80" rx="8" fill="url(#blueprintBg)" stroke="rgba(56, 189, 248, 0.2)" stroke-width="1" />
        <rect width="110" height="80" rx="8" fill="url(#gridPattern)" />

        <!-- 2D Çizim Elemanları -->
        ${innerContent}

        ${
          showValue
            ? `<text x="5" y="74" fill="#94a3b8" font-size="8.5" font-family="'JetBrains Mono', Consolas, monospace" font-weight="600">2D CAD</text>`
            : ''
        }
      </svg>
    `.trim();
  }

  // 1. Diş Sayısı (z)
  private static drawTeethCount(val: string): string {
    return `
      <!-- Merkez Eksenler -->
      <line x1="55" y1="8" x2="55" y2="72" stroke="rgba(245, 158, 11, 0.4)" stroke-dasharray="2,2" stroke-width="0.8" />
      <line x1="15" y1="40" x2="95" y2="40" stroke="rgba(245, 158, 11, 0.4)" stroke-dasharray="2,2" stroke-width="0.8" />
      
      <!-- Dişli Çemberi & Dişler -->
      <circle cx="55" cy="40" r="26" fill="none" stroke="#475569" stroke-width="1" />
      <circle cx="55" cy="40" r="22" fill="none" stroke="#0ea5e9" stroke-dasharray="2,1.5" stroke-width="1" />
      <circle cx="55" cy="40" r="17" fill="none" stroke="#334155" stroke-width="1" />
      
      <!-- Stilize Dişler -->
      <path d="
        M 52 14 L 54 12 L 56 12 L 58 14 
        M 76 25 L 79 26 L 80 28 L 79 30 
        M 81 49 L 83 51 L 83 53 L 81 55
        M 58 66 L 56 68 L 54 68 L 52 66
        M 34 55 L 32 53 L 32 51 L 34 49
        M 29 30 L 28 28 L 29 26 L 32 25
      " fill="none" stroke="#38bdf8" stroke-width="1.4" stroke-linecap="round" />

      <!-- Merkez Delik -->
      <circle cx="55" cy="40" r="6" fill="#0f172a" stroke="#64748b" stroke-width="1" />

      <!-- Ölçü Oku ve Değer -->
      <path d="M 40 22 A 22 22 0 0 1 70 22" fill="none" stroke="#fbbf24" stroke-width="1.2" marker-end="url(#arrowAmber)" />
      <rect x="36" y="32" width="38" height="15" rx="3" fill="#0f172a" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="43" fill="#fbbf24" font-size="9.5" font-family="'JetBrains Mono', Consolas, monospace" font-weight="700" text-anchor="middle">z=${val}</text>
    `;
  }

  // 2. Modül (m)
  private static drawModule(val: string): string {
    return `
      <!-- Referans Hatlar -->
      <line x1="10" y1="20" x2="100" y2="20" stroke="#64748b" stroke-dasharray="2,2" stroke-width="0.8" />
      <line x1="10" y1="36" x2="100" y2="36" stroke="#0ea5e9" stroke-dasharray="2,2" stroke-width="0.9" />
      <line x1="10" y1="56" x2="100" y2="56" stroke="#64748b" stroke-dasharray="2,2" stroke-width="0.8" />

      <!-- 2 Diş Yakın Plan Profili -->
      <path d="M 12 56 L 24 56 Q 30 45 36 20 L 46 20 Q 52 45 58 56 L 70 56 Q 76 45 82 20 L 92 20 Q 98 45 104 56" fill="rgba(14, 165, 233, 0.12)" stroke="#38bdf8" stroke-width="1.8" />

      <!-- Modül Ölçü Çizgisi (ha = 1.0 m) -->
      <line x1="41" y1="20" x2="41" y2="36" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <text x="45" y="30" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700">m=${val}</text>

      <!-- Hatve Göstergesi p = π·m -->
      <line x1="36" y1="12" x2="82" y2="12" stroke="#38bdf8" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)" />
      <text x="59" y="9" fill="#38bdf8" font-size="7.5" font-family="'JetBrains Mono', monospace" text-anchor="middle">p = π·m</text>
    `;
  }

  // 3. Bölüm Çapı (d)
  private static drawPitchDiameter(val: string): string {
    return `
      <!-- Dış Diş Konturu -->
      <circle cx="55" cy="40" r="28" fill="none" stroke="#334155" stroke-width="1" />
      <!-- Bölüm Dairesi (Vurgulanan) -->
      <circle cx="55" cy="40" r="22" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="3,1.5" />
      <circle cx="55" cy="40" r="16" fill="none" stroke="#1e293b" stroke-width="1" />
      <circle cx="55" cy="40" r="6" fill="#0f172a" stroke="#64748b" stroke-width="1" />

      <!-- Çap Ölçülendirme Çizgisi -->
      <line x1="33" y1="40" x2="77" y2="40" stroke="#fbbf24" stroke-width="1.4" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <rect x="36" y="44" width="38" height="14" rx="3" fill="#0b1120" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="54" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">⌀d=${val}</text>
    `;
  }

  // 4. Dış Çap (da)
  private static drawOuterDiameter(val: string): string {
    return `
      <!-- Dış Tepe Çapı (Vurgulanan) -->
      <circle cx="55" cy="40" r="30" fill="none" stroke="#fbbf24" stroke-width="2" />
      <circle cx="55" cy="40" r="24" fill="none" stroke="#334155" stroke-dasharray="2,2" stroke-width="0.8" />
      <circle cx="55" cy="40" r="6" fill="#0f172a" stroke="#64748b" stroke-width="1" />

      <!-- Çap Ölçülendirme Çizgisi (Dıştan Dışa) -->
      <line x1="25" y1="40" x2="85" y2="40" stroke="#fbbf24" stroke-width="1.4" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <rect x="36" y="24" width="38" height="14" rx="3" fill="#0b1120" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="34" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">⌀da=${val}</text>
    `;
  }

  // 5. Dişli Kalınlığı (b) — Yan Kesit Görünümü
  private static drawThickness(val: string): string {
    return `
      <!-- Eksen Çizgisi -->
      <line x1="20" y1="40" x2="90" y2="40" stroke="rgba(245, 158, 11, 0.4)" stroke-dasharray="3,2" stroke-width="0.8" />

      <!-- Dişli Yan Kesit Gövdesi -->
      <rect x="38" y="14" width="34" height="14" rx="1" fill="rgba(14, 165, 233, 0.15)" stroke="#38bdf8" stroke-width="1.3" />
      <rect x="42" y="28" width="26" height="24" fill="none" stroke="#475569" stroke-width="1" />
      <rect x="38" y="52" width="34" height="14" rx="1" fill="rgba(14, 165, 233, 0.15)" stroke="#38bdf8" stroke-width="1.3" />

      <!-- Kalınlık Ölçü Çizgisi (b) -->
      <line x1="38" y1="70" x2="72" y2="70" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <line x1="38" y1="67" x2="38" y2="73" stroke="#fbbf24" stroke-width="1" />
      <line x1="72" y1="67" x2="72" y2="73" stroke="#fbbf24" stroke-width="1" />
      <text x="55" y="66" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">b=${val}mm</text>
    `;
  }

  // 6. Helis Açısı (β)
  private static drawHelixAngle(val: string): string {
    return `
      <!-- Dikey Eksen -->
      <line x1="55" y1="10" x2="55" y2="68" stroke="#64748b" stroke-dasharray="2,2" stroke-width="0.8" />

      <!-- Açılı Helis Diş Yolları -->
      <path d="M 32 64 L 52 14" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 48 64 L 68 14" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
      <path d="M 64 64 L 84 14" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" />

      <!-- Açı Yayı ve Ölçüsü -->
      <path d="M 55 35 A 20 20 0 0 1 63 38" fill="none" stroke="#fbbf24" stroke-width="1.3" marker-end="url(#arrowAmber)" />
      <rect x="62" y="32" width="34" height="14" rx="3" fill="#0b1120" stroke="#fbbf24" stroke-width="0.8" />
      <text x="79" y="42" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">β=${val}°</text>
    `;
  }

  // 7. Mil / Delik Çapı (d_bore)
  private static drawBoreDiameter(val: string): string {
    return `
      <!-- Dış Göbek & Merkez Delik -->
      <circle cx="55" cy="40" r="30" fill="none" stroke="#334155" stroke-width="1" />
      <circle cx="55" cy="40" r="16" fill="rgba(14, 165, 233, 0.2)" stroke="#38bdf8" stroke-width="2" />
      
      <!-- Çap Ölçüsü -->
      <line x1="39" y1="40" x2="71" y2="40" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <rect x="36" y="44" width="38" height="14" rx="3" fill="#0b1120" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="54" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">⌀=${val}mm</text>
    `;
  }

  // 8. Kama Genişliği (b_key)
  private static drawKeywayWidth(val: string): string {
    return `
      <!-- Delik ve Üst Kama Yuvası -->
      <path d="
        M 45 40 
        A 18 18 0 0 0 65 40 
        A 18 18 0 0 0 59 23 
        L 59 16 
        L 51 16 
        L 51 23 
        A 18 18 0 0 0 45 40
      " fill="rgba(245, 158, 11, 0.15)" stroke="#38bdf8" stroke-width="1.5" />

      <!-- Kama Genişlik Ölçüsü (b) -->
      <line x1="51" y1="12" x2="59" y2="12" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <line x1="51" y1="10" x2="51" y2="16" stroke="#fbbf24" stroke-width="0.8" />
      <line x1="59" y1="10" x2="59" y2="16" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="8" fill="#fbbf24" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">b=${val}mm</text>
    `;
  }

  // 9. Kama Derinliği (t2)
  private static drawKeywayDepth(val: string): string {
    return `
      <!-- Delik ve Kama Yuvası -->
      <path d="
        M 45 40 
        A 18 18 0 0 0 65 40 
        A 18 18 0 0 0 59 23 
        L 59 15 
        L 51 15 
        L 51 23 
        A 18 18 0 0 0 45 40
      " fill="rgba(245, 158, 11, 0.15)" stroke="#38bdf8" stroke-width="1.5" />

      <!-- Kama Derinlik Ölçüsü (t2) -->
      <line x1="64" y1="15" x2="64" y2="23" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <line x1="59" y1="15" x2="67" y2="15" stroke="#fbbf24" stroke-width="0.8" />
      <line x1="59" y1="23" x2="67" y2="23" stroke="#fbbf24" stroke-width="0.8" />
      <text x="80" y="21" fill="#fbbf24" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">t₂=${val}</text>
    `;
  }

  // 10. D-Şaft (NEMA 17 D-Mil)
  private static drawDShaft(val: string): string {
    return `
      <!-- Yuvarlak Delik ve D-Kesim -->
      <path d="M 45 28 A 16 16 0 1 0 45 52 L 45 28" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1.8" />

      <!-- Düzlük Derinlik Ölçüsü -->
      <line x1="39" y1="40" x2="45" y2="40" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <line x1="39" y1="36" x2="39" y2="44" stroke="#fbbf24" stroke-width="0.8" />
      <line x1="45" y1="36" x2="45" y2="44" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="66" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">h=${val}mm</text>
    `;
  }

  // 11. Göbek Çapı (d_hub)
  private static drawHubDiameter(val: string): string {
    return `
      <!-- Dış Diş Çemberi -->
      <circle cx="55" cy="40" r="30" fill="none" stroke="#334155" stroke-dasharray="2,2" stroke-width="0.8" />
      <!-- Merkez Göbek (Vurgulanan) -->
      <circle cx="55" cy="40" r="18" fill="rgba(14, 165, 233, 0.2)" stroke="#38bdf8" stroke-width="2" />
      <circle cx="55" cy="40" r="8" fill="#0b1120" stroke="#64748b" stroke-width="1" />

      <!-- Göbek Çap Ölçüsü -->
      <line x1="37" y1="40" x2="73" y2="40" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <text x="55" y="36" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">⌀hub=${val}</text>
    `;
  }

  // 12. Göbek Çıkıntısı (h_top)
  private static drawHubExtension(val: string): string {
    return `
      <!-- Yan Kesit Göbek Çıkıntısı -->
      <rect x="36" y="32" width="38" height="26" fill="rgba(14, 165, 233, 0.1)" stroke="#475569" stroke-width="1" />
      <!-- Yükseltilmiş Göbek Boynu -->
      <rect x="44" y="16" width="22" height="16" fill="rgba(245, 158, 11, 0.2)" stroke="#fbbf24" stroke-width="1.5" />

      <!-- Çıkıntı Boyu Ölçüsü -->
      <line x1="72" y1="16" x2="72" y2="32" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <line x1="68" y1="16" x2="76" y2="16" stroke="#fbbf24" stroke-width="0.8" />
      <line x1="68" y1="32" x2="76" y2="32" stroke="#fbbf24" stroke-width="0.8" />
      <text x="86" y="26" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700">h=${val}</text>
    `;
  }

  // 13. Rim (Çember) Et Kalınlığı
  private static drawRimThickness(val: string): string {
    return `
      <!-- Diş Dibi ve İç Çember -->
      <circle cx="55" cy="40" r="30" fill="none" stroke="#334155" stroke-width="1" />
      <circle cx="55" cy="40" r="24" fill="none" stroke="#38bdf8" stroke-width="1.5" />
      <circle cx="55" cy="40" r="18" fill="none" stroke="#0ea5e9" stroke-width="1.5" />
      
      <!-- Rim Kalınlık Ölçüsü -->
      <line x1="55" y1="18" x2="55" y2="24" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <text x="55" y="13" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">s=${val}mm</text>
    `;
  }

  // 14. Web Kalınlığı
  private static drawWebThickness(val: string): string {
    return `
      <!-- Kademeli İnce Gövde Kesiti -->
      <path d="
        M 38 16 L 46 16 L 46 28 L 64 28 L 64 16 L 72 16 L 72 64 L 64 64 L 64 52 L 46 52 L 46 64 L 38 64 z
      " fill="rgba(14, 165, 233, 0.15)" stroke="#38bdf8" stroke-width="1.3" />

      <!-- Web Kalınlığı Ölçüsü (Orta Kısım) -->
      <line x1="46" y1="40" x2="64" y2="40" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <text x="55" y="36" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">t=${val}</text>
    `;
  }

  // 15. Hafifletme Delikleri (Cutouts)
  private static drawCutouts(val: string): string {
    return `
      <!-- Dişli Gövdesi ve Dairesel Delikler -->
      <circle cx="55" cy="40" r="30" fill="none" stroke="#334155" stroke-width="1" />
      <circle cx="55" cy="40" r="7" fill="#0b1120" stroke="#64748b" stroke-width="1" />

      <!-- Hafifletme Delikleri -->
      <circle cx="55" cy="22" r="5" fill="rgba(14, 165, 233, 0.25)" stroke="#38bdf8" stroke-width="1.3" />
      <circle cx="70" cy="32" r="5" fill="rgba(14, 165, 233, 0.25)" stroke="#38bdf8" stroke-width="1.3" />
      <circle cx="70" cy="48" r="5" fill="rgba(14, 165, 233, 0.25)" stroke="#38bdf8" stroke-width="1.3" />
      <circle cx="55" cy="58" r="5" fill="rgba(14, 165, 233, 0.25)" stroke="#38bdf8" stroke-width="1.3" />
      <circle cx="40" cy="48" r="5" fill="rgba(14, 165, 233, 0.25)" stroke="#38bdf8" stroke-width="1.3" />
      <circle cx="40" cy="32" r="5" fill="rgba(14, 165, 233, 0.25)" stroke="#38bdf8" stroke-width="1.3" />

      <rect x="42" y="35" width="26" height="12" rx="3" fill="#0b1120" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="44" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">n=${val}</text>
    `;
  }

  // 16. Kavrama Açısı (α = 20°)
  private static drawPressureAngle(val: string): string {
    return `
      <!-- Evolvent Diş Yanağı ve Temas Doğrusu -->
      <path d="M 28 58 Q 42 42 62 20" stroke="#38bdf8" stroke-width="2" fill="none" />
      <!-- Teğet Doğrusu -->
      <line x1="45" y1="16" x2="45" y2="64" stroke="#64748b" stroke-dasharray="2,2" stroke-width="1" />
      <!-- Kavrama Doğrusu (Action Line) -->
      <line x1="25" y1="58" x2="68" y2="18" stroke="#fbbf24" stroke-width="1.5" />

      <!-- Açı Yayı -->
      <path d="M 45 42 A 12 12 0 0 1 52 35" fill="none" stroke="#fbbf24" stroke-width="1.2" marker-end="url(#arrowAmber)" />
      <text x="65" y="44" fill="#fbbf24" font-size="9" font-family="'JetBrains Mono', monospace" font-weight="700">α=${val}°</text>
    `;
  }

  // 17. Profil Kaydırma (x)
  private static drawProfileShift(val: string): string {
    return `
      <!-- Standart Profil (Kesik Çizgi) -->
      <path d="M 25 54 Q 38 42 50 18 L 62 18 Q 74 42 87 54" fill="none" stroke="#475569" stroke-dasharray="2,2" stroke-width="1" />
      <!-- Kaydırılmış Profil (Kalınlaşmış Kök) -->
      <path d="M 20 54 Q 35 40 48 14 L 64 14 Q 77 40 92 54" fill="rgba(14, 165, 233, 0.15)" stroke="#38bdf8" stroke-width="1.8" />

      <!-- Kaydırma Vektörü (x·m) -->
      <line x1="50" y1="18" x2="48" y2="14" stroke="#fbbf24" stroke-width="1.5" marker-end="url(#arrowAmber)" />
      <rect x="36" y="58" width="38" height="14" rx="3" fill="#0b1120" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="68" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">x=${val}</text>
    `;
  }

  // 18. Backlash (Diş Boşluğu jt)
  private static drawBacklash(val: string): string {
    return `
      <!-- İki Eşleşen Diş Arası Boşluk -->
      <path d="M 25 56 Q 38 38 48 18 L 54 18" fill="none" stroke="#38bdf8" stroke-width="2" />
      <path d="M 59 18 L 65 18 Q 75 38 88 56" fill="none" stroke="#0ea5e9" stroke-width="2" />

      <!-- Boşluk Açıklığı Ölçüsü (jt) -->
      <line x1="48" y1="36" x2="62" y2="36" stroke="#fbbf24" stroke-width="1.3" marker-start="url(#arrowAmber)" marker-end="url(#arrowAmber)" />
      <rect x="36" y="56" width="38" height="14" rx="3" fill="#0b1120" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="66" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">jt=${val}mm</text>
    `;
  }

  // 19. Delik Toleransı (Clearance)
  private static drawClearance(val: string): string {
    return `
      <!-- Nominal Mil (Sert Çizgi) ve Genişletilmiş Delik -->
      <circle cx="55" cy="40" r="16" fill="rgba(14, 165, 233, 0.2)" stroke="#38bdf8" stroke-width="1.8" />
      <circle cx="55" cy="40" r="19" fill="none" stroke="#fbbf24" stroke-dasharray="2,2" stroke-width="1.4" />

      <!-- Radyal Boşluk Göstergesi -->
      <line x1="71" y1="40" x2="74" y2="40" stroke="#fbbf24" stroke-width="1.5" marker-end="url(#arrowAmber)" />
      <text x="55" y="65" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">+${val}mm</text>
    `;
  }

  // 20. Düz Dişli Mimarisi (Spur Gear)
  private static drawSpurGear(_val: string): string {
    return `
      <line x1="55" y1="8" x2="55" y2="72" stroke="rgba(245, 158, 11, 0.4)" stroke-dasharray="2,2" stroke-width="0.8" />
      <line x1="15" y1="40" x2="95" y2="40" stroke="rgba(245, 158, 11, 0.4)" stroke-dasharray="2,2" stroke-width="0.8" />
      <circle cx="55" cy="40" r="28" fill="none" stroke="#475569" stroke-width="1.2" />
      <circle cx="55" cy="40" r="23" fill="none" stroke="#0ea5e9" stroke-dasharray="3,1.5" stroke-width="1.4" />
      <circle cx="55" cy="40" r="17" fill="none" stroke="#334155" stroke-width="1" />
      <circle cx="55" cy="40" r="7" fill="#0f172a" stroke="#64748b" stroke-width="1.2" />
      
      <!-- Düz Diş Profilleri -->
      <path d="
        M 52 12 L 54 10 L 56 10 L 58 12 
        M 81 37 L 85 39 L 85 41 L 81 43
        M 58 68 L 56 70 L 54 70 L 52 68
        M 29 43 L 25 41 L 25 39 L 29 37
      " fill="none" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round" />

      <!-- Formül Etiketi -->
      <rect x="25" y="32" width="60" height="15" rx="3" fill="#0b1120" stroke="#0ea5e9" stroke-width="0.8" />
      <text x="55" y="43" fill="#38bdf8" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">d = m · z</text>
    `;
  }

  // 21. Helisel Dişli Mimarisi (Helical Gear)
  private static drawHelicalGear(_val: string): string {
    return `
      <!-- Silindirik Gövde -->
      <rect x="30" y="16" width="50" height="48" rx="4" fill="rgba(14, 165, 233, 0.12)" stroke="#475569" stroke-width="1" />
      <!-- Açılı Helis Diş Hatları -->
      <path d="M 34 60 L 58 20" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 46 60 L 70 20" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
      <path d="M 58 60 L 82 20" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" />

      <!-- Açı Yayı β -->
      <line x1="58" y1="20" x2="58" y2="40" stroke="#64748b" stroke-dasharray="2,2" stroke-width="0.8" />
      <path d="M 58 32 A 12 12 0 0 1 65 34" fill="none" stroke="#fbbf24" stroke-width="1.2" marker-end="url(#arrowAmber)" />
      
      <rect x="22" y="63" width="66" height="13" rx="3" fill="#0b1120" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="73" fill="#fbbf24" font-size="8" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">d_t = (m_n·z)/cosβ</text>
    `;
  }

  // 22. Çavuş Dişli Mimarisi (Herringbone)
  private static drawHerringboneGear(_val: string): string {
    return `
      <!-- Gövde -->
      <rect x="28" y="16" width="54" height="48" rx="4" fill="rgba(245, 158, 11, 0.1)" stroke="#475569" stroke-width="1" />
      <line x1="55" y1="16" x2="55" y2="64" stroke="rgba(255,255,255,0.2)" stroke-dasharray="2,2" stroke-width="0.8" />

      <!-- Çift Helis 'V' Hatları -->
      <path d="M 32 58 L 55 36 L 78 58" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 32 40 L 55 18 L 78 40" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Karşılıklı Eksenel İtme Kuvvetleri (Sıfırlanan) -->
      <line x1="42" y1="24" x2="36" y2="24" stroke="#38bdf8" stroke-width="1.2" marker-end="url(#arrow)" />
      <line x1="68" y1="24" x2="74" y2="24" stroke="#38bdf8" stroke-width="1.2" marker-end="url(#arrow)" />

      <rect x="25" y="63" width="60" height="13" rx="3" fill="#0b1120" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="73" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">F_axial = 0</text>
    `;
  }

  // 23. Konik Eğimli Dişli Mimarisi (Bevel Gear)
  private static drawBevelGear(_val: string): string {
    return `
      <!-- Koni Tepe Noktası ve Eksenler -->
      <line x1="55" y1="14" x2="55" y2="66" stroke="#64748b" stroke-dasharray="2,2" stroke-width="0.8" />
      
      <!-- Konik Gövde Yamuğu -->
      <path d="M 30 56 L 40 28 L 70 28 L 80 56 Z" fill="rgba(14, 165, 233, 0.15)" stroke="#38bdf8" stroke-width="1.5" />
      <line x1="40" y1="28" x2="55" y2="14" stroke="#fbbf24" stroke-dasharray="2,2" stroke-width="1" />
      <line x1="70" y1="28" x2="55" y2="14" stroke="#fbbf24" stroke-dasharray="2,2" stroke-width="1" />

      <!-- Koni Açısı δ -->
      <path d="M 55 24 A 10 10 0 0 1 61 22" fill="none" stroke="#fbbf24" stroke-width="1.2" marker-end="url(#arrowAmber)" />
      
      <rect x="20" y="62" width="70" height="14" rx="3" fill="#0b1120" stroke="#fbbf24" stroke-width="0.8" />
      <text x="55" y="72" fill="#fbbf24" font-size="7.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">δ = tan⁻¹(z₁/z₂)</text>
    `;
  }

  // 24. İç Dişli Çember (Internal Ring Gear)
  private static drawInternalGear(_val: string): string {
    return `
      <!-- Dış Masif Halka -->
      <circle cx="55" cy="40" r="30" fill="none" stroke="#475569" stroke-width="2.5" />
      <!-- Bölüm Dairesi -->
      <circle cx="55" cy="40" r="23" fill="none" stroke="#0ea5e9" stroke-dasharray="3,1.5" stroke-width="1.3" />
      <!-- İç Diş Çemberi (İçe Doğru Dişler) -->
      <circle cx="55" cy="40" r="17" fill="none" stroke="#38bdf8" stroke-width="1.5" />

      <!-- İçe Doğru Diş Tırnakları -->
      <path d="
        M 53 23 L 55 26 L 57 23 
        M 72 38 L 69 40 L 72 42
        M 57 57 L 55 54 L 53 57
        M 38 42 L 41 40 L 38 38
      " fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round" />

      <rect x="25" y="33" width="60" height="14" rx="3" fill="#0b1120" stroke="#0ea5e9" stroke-width="0.8" />
      <text x="55" y="44" fill="#38bdf8" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">d_a = d - 2m</text>
    `;
  }

  // Varsayılan Genel Dişli
  private static drawGenericGear(val: string): string {
    return `
      <circle cx="55" cy="40" r="24" fill="none" stroke="#38bdf8" stroke-width="1.5" />
      <circle cx="55" cy="40" r="8" fill="#0f172a" stroke="#64748b" stroke-width="1" />
      <text x="55" y="43" fill="#fbbf24" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="700" text-anchor="middle">${val}</text>
    `;
  }
}

