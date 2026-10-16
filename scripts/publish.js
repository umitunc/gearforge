#!/usr/bin/env node
/**
 * scripts/publish.js
 * GearForge 3D — Otomatik Versiyon Artırma (SemVer Increment) & Canlıya Alma (Publish) Aracı.
 * Geliştirici: Trunçgil Teknoloji (https://www.truncgil.com.tr)
 *
 * Sorumluluklar:
 * 1. package.json, index.html, public/sw.js ve public/llms-full.txt dosyalarındaki sürüm kodunu 1 artırır.
 * 2. Güncel tarih ve derleme sayısına göre Build ID oluşturur.
 * 3. 'npm run build' ile üretim paketini (dist/) derler.
 * 4. Çıktıları /home/truncgil/web/gear.truncgil.com/public_html klasörüne kopyalar ve izinleri ayarlar.
 * 5. Değişiklikleri git ile commit'leyip origin/main dalına push'lar.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_HTML = '/home/truncgil/web/gear.truncgil.com/public_html';

function log(msg) {
  console.log(`\x1b[36m[GearForge Publish]\x1b[0m ${msg}`);
}

function error(msg) {
  console.error(`\x1b[31m[GearForge Publish HATA]\x1b[0m ${msg}`);
}

// 1. package.json oku ve versiyonu belirle
const pkgPath = path.join(REPO_ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

let currentVersion = pkg.version || '1.0.4';
// Eğer package.json hala 1.0.0 ise en az 1.0.4 olarak baz al
const [major, minor, patch] = currentVersion.split('.').map(Number);
let nextPatch = patch + 1;
if (major === 1 && minor === 0 && patch < 4) {
  nextPatch = 5;
}
const nextVersion = `${major}.${minor}.${nextPatch}`;
const fullCadVersion = `${nextVersion}-cad`;

const now = new Date();
const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
const buildId = `${dateStr}-r170.${nextPatch}`;

log(`Versiyon artırılıyor: v${currentVersion} -> \x1b[32mv${nextVersion}\x1b[0m (Build ID: ${buildId})`);

// 2. package.json güncelle
pkg.version = nextVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
log(`package.json güncellendi: v${nextVersion}`);

// 3. index.html güncelle
const indexPath = path.join(REPO_ROOT, 'index.html');
if (fs.existsSync(indexPath)) {
  let indexHtml = fs.readFileSync(indexPath, 'utf-8');

  // JSON-LD softwareVersion
  indexHtml = indexHtml.replace(/"softwareVersion":\s*"[^"]+"/, `"softwareVersion": "${fullCadVersion}"`);

  // Preloader versiyonu
  indexHtml = indexHtml.replace(/<span class="preloader-version">[^<]+<\/span>/, `<span class="preloader-version">v${fullCadVersion} (Release)</span>`);

  // Credits modal versiyon ve build
  indexHtml = indexHtml.replace(/<span class="meta-value font-mono">v[0-9.]+(-cad)?\s*\(Stable\)<\/span>/, `<span class="meta-value font-mono">v${fullCadVersion} (Stable)</span>`);
  indexHtml = indexHtml.replace(/<span class="meta-value font-mono">\d{4}\.\d{2}\.\d{2}[^<]*<\/span>/, `<span class="meta-value font-mono">${buildId}</span>`);

  // Brand pill
  indexHtml = indexHtml.replace(/<span class="brand-version-pill" id="brand-version-pill">[^<]+<\/span>/, `<span class="brand-version-pill" id="brand-version-pill">v${nextVersion}</span>`);

  fs.writeFileSync(indexPath, indexHtml, 'utf-8');
  log(`index.html güncellendi (Meta, Preloader, Header pill -> v${nextVersion})`);
}

// 4. public/sw.js (Service Worker önbellek adı) güncelle
const swPath = path.join(REPO_ROOT, 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf-8');
  swContent = swContent.replace(/const CACHE_NAME\s*=\s*'[^']+';/, `const CACHE_NAME = 'gearforge-v${nextVersion}';`);
  fs.writeFileSync(swPath, swContent, 'utf-8');
  log(`public/sw.js güncellendi (CACHE_NAME: gearforge-v${nextVersion})`);
}

// 5. public/llms-full.txt güncelle
const llmsFullPath = path.join(REPO_ROOT, 'public', 'llms-full.txt');
if (fs.existsSync(llmsFullPath)) {
  let llmsContent = fs.readFileSync(llmsFullPath, 'utf-8');
  llmsContent = llmsContent.replace(/Release Version:\s*v[0-9.]+(-cad)?\s*\(Stable\)/, `Release Version: v${fullCadVersion} (Stable)`);
  fs.writeFileSync(llmsFullPath, llmsContent, 'utf-8');
  log(`public/llms-full.txt güncellendi (v${fullCadVersion})`);
}

// 6. Testleri çalıştır
log('Birim testler çalıştırılıyor (vitest run)...');
try {
  execSync('npm run test', { cwd: REPO_ROOT, stdio: 'inherit' });
} catch (err) {
  error('Testler başarısız oldu! Yayın durduruldu.');
  process.exit(1);
}

// 7. Production build al (tsc && vite build)
log('Production derlemesi alınıyor (npm run build)...');
try {
  execSync('npm run build', { cwd: REPO_ROOT, stdio: 'inherit' });
} catch (err) {
  error('Build başarısız oldu! Yayın durduruldu.');
  process.exit(1);
}

// 8. public_html klasörüne dağıt (Deploy)
const distDir = path.join(REPO_ROOT, 'dist');
if (fs.existsSync(PUBLIC_HTML) && fs.existsSync(distDir)) {
  log(`public_html dizinine kopyalanıyor (${PUBLIC_HTML})...`);
  try {
    execSync(`rm -rf "${PUBLIC_HTML}"/* && cp -r "${distDir}"/* "${PUBLIC_HTML}"/`, { stdio: 'inherit' });
    try {
      execSync(`chown -R truncgil:www-data "${PUBLIC_HTML}"/ && chmod -R 755 "${PUBLIC_HTML}"/`, { stdio: 'pipe' });
    } catch {
      // Sudo/root gerektirebilir, atla
    }
    log(`public_html başarıyla güncellendi!`);
  } catch (err) {
    error(`public_html kopyalama hatası: ${err.message}`);
  }
} else {
  log(`Uyarı: ${PUBLIC_HTML} dizini bulunamadı veya dist klasörü eksik.`);
}

// 9. Git commit & push
log('Git commit, tag ve push yapılıyor...');
try {
  const customMessage = process.argv.slice(2).join(' ').trim();
  const commitMsg = customMessage
    ? `chore(release): v${nextVersion} - ${customMessage} [build ${buildId}]`
    : `chore(release): publish v${nextVersion} [build ${buildId}]`;

  // Tüm değişiklikleri ve yeni dosyaları sahneye ekle
  execSync(`git add -A`, { cwd: REPO_ROOT, stdio: 'inherit' });
  execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: REPO_ROOT, stdio: 'inherit' });

  // Resmi sürüm etiketi oluştur (Git Tag)
  try {
    execSync(`git tag -a "v${nextVersion}" -m "GearForge Release v${nextVersion}: ${customMessage || 'Otomatik üretim sürümü'}"`, { cwd: REPO_ROOT, stdio: 'inherit' });
    log(`Git tag oluşturuldu: v${nextVersion}`);
  } catch (tagErr) {
    log(`Uyarı: Git tag oluşturulamadı (${tagErr.message}), push işlemine devam ediliyor.`);
  }

  // GitHub origin main dalına ve etiketlere pushla
  execSync(`git push origin main --tags`, { cwd: REPO_ROOT, stdio: 'inherit' });
  log(`Git commit & push origin main --tags başarılı! (v${nextVersion})`);
} catch (err) {
  error(`Git push sırasında hata: ${err.message}`);
}

console.log(`
\x1b[32m══════════════════════════════════════════════════════════════════════\x1b[0m
  🚀 \x1b[1mGearForge 3D v${nextVersion} Başarıyla Canlıya Alındı!\x1b[0m
  🌐 Canlı URL: \x1b[34mhttps://gear.truncgil.com/\x1b[0m
  🏷️  Sürüm: v${nextVersion} (Yapı: ${buildId})
  📦 Önbellek Adı: gearforge-v${nextVersion}
\x1b[32m══════════════════════════════════════════════════════════════════════\x1b[0m
`);
