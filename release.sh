#!/usr/bin/env bash
# ==============================================================================
#  GearForge 3D — Otomatik Derleme, Sürüm Artırma & Canlıya Alma (Release) Betiği
#  Geliştirici: Trunçgil Teknoloji (https://www.truncgil.com.tr)
#  Alan Adı: https://gear.truncgil.com/
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR"
PUBLIC_HTML="/home/truncgil/web/gear.truncgil.com/public_html"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}  ⚙️  GearForge 3D — Otomatik Release & Dağıtım Sistemi${NC}"
echo -e "${CYAN}  🏢 Trunçgil Teknoloji | gear.truncgil.com${NC}"
echo -e "${CYAN}======================================================================${NC}"

# 1. Dizin kontrolü
cd "$REPO_DIR"

# 2. Node & NPM kontrolü
if ! command -v node &> /dev/null; then
    echo -e "${RED}[HATA] Node.js bulunamadı!${NC}"
    exit 1
fi

# 3. İsteğe bağlı sürüm notu kontrolü
RELEASE_MSG="$*"
if [ -n "$RELEASE_MSG" ]; then
    echo -e "${YELLOW}📝 Sürüm Notu:${NC} $RELEASE_MSG"
else
    echo -e "${YELLOW}ℹ️  Özel sürüm notu girilmedi, standart release mesajı kullanılacak.${NC}"
fi

# 4. publish.js üzerinden test, semver artırımı, build, deploy ve git push adımlarını çalıştır
echo -e "${CYAN}🚀 Release süreci başlatılıyor...${NC}"
node "$REPO_DIR/scripts/publish.js" "$RELEASE_MSG"

echo -e "${GREEN}✅ Release işlemi başarıyla tamamlandı!${NC}"
