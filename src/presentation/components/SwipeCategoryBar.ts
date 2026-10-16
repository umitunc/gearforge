import { GearBuilderStore } from '../../application/GearBuilderStore';
import { GearHighlightSection } from '../../domain/models/GearTypes';

export type SwipeCategoryId =
  | GearHighlightSection
  | 'iso_metrics'
  | 'export_stl';

export interface SwipeCategoryItem {
  readonly id: SwipeCategoryId;
  readonly icon: string;
  readonly shortTitle: string;
  readonly badgeText: string;
  readonly highlightSection?: GearHighlightSection;
}

export const SWIPE_CATEGORIES: readonly SwipeCategoryItem[] = [
  {
    id: GearHighlightSection.DIMENSIONS_AND_TYPE,
    icon: '⚙️',
    shortTitle: '1. Boyutlar & Tip',
    badgeText: 'Çember & Diş',
    highlightSection: GearHighlightSection.DIMENSIONS_AND_TYPE,
  },
  {
    id: GearHighlightSection.BORE_AND_SHAFT,
    icon: '🔩',
    shortTitle: '2. Delik & Mil',
    badgeText: 'Kama & Şaft',
    highlightSection: GearHighlightSection.BORE_AND_SHAFT,
  },
  {
    id: GearHighlightSection.HUB_AND_WEB,
    icon: '🛞',
    shortTitle: '3. Göbek & Web',
    badgeText: 'Hafifletme',
    highlightSection: GearHighlightSection.HUB_AND_WEB,
  },
  {
    id: GearHighlightSection.EVOLVENT_AND_PRINT,
    icon: '🖨️',
    shortTitle: '4. Evolvent & FDM',
    badgeText: 'Backlash & Açı',
    highlightSection: GearHighlightSection.EVOLVENT_AND_PRINT,
  },
  {
    id: GearHighlightSection.MATING_SIMULATION,
    icon: '🔄',
    shortTitle: '5. Karşı Pinyon',
    badgeText: 'Çift Dişli Sim',
    highlightSection: GearHighlightSection.MATING_SIMULATION,
  },
  {
    id: 'iso_metrics',
    icon: '📐',
    shortTitle: '6. ISO Ölçüleri',
    badgeText: 'Mühendislik',
  },
  {
    id: 'export_stl',
    icon: '🚀',
    shortTitle: '7. STL & Baskı',
    badgeText: '3D Printer Çıktı',
  },
];

/**
 * Üst yatay kaydırılabilir/swipe edilebilir kategori gezinme çubuğu.
 * Mobil ve masaüstü ekranda dişli bölümlerine anında erişim, 3B parça vurgulama
 * ve hızlı geçiş sağlar (SRP / OCP).
 */
export class SwipeCategoryBar {
  private readonly container: HTMLElement;
  private readonly store: GearBuilderStore;
  private readonly onSelectCallback?: (categoryId: SwipeCategoryId) => void;
  private activeId: SwipeCategoryId = GearHighlightSection.DIMENSIONS_AND_TYPE;
  private tabButtons = new Map<SwipeCategoryId, HTMLButtonElement>();
  private trackEl!: HTMLElement;

  constructor(
    container: HTMLElement,
    store: GearBuilderStore,
    onSelectCallback?: (categoryId: SwipeCategoryId) => void
  ) {
    this.container = container;
    this.store = store;
    this.onSelectCallback = onSelectCallback;

    this.render();
    this.store.subscribe((state) => {
      if (
        state.activeHighlightSection !== GearHighlightSection.NONE &&
        state.activeHighlightSection !== this.activeId
      ) {
        this.setActive(state.activeHighlightSection, false);
      }
    });
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'swipe-category-bar';

    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'swipe-scroll-wrapper';

    this.trackEl = document.createElement('div');
    this.trackEl.className = 'swipe-category-track';

    for (const cat of SWIPE_CATEGORIES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `swipe-category-pill cat-${cat.id}`;
      btn.innerHTML = `
        <span class="cat-pill-icon">${cat.icon}</span>
        <span class="cat-pill-title">${cat.shortTitle}</span>
        <span class="cat-pill-badge">${cat.badgeText}</span>
      `;

      btn.addEventListener('click', () => {
        this.selectCategory(cat.id);
      });

      this.tabButtons.set(cat.id, btn);
      this.trackEl.appendChild(btn);
    }

    scrollWrapper.appendChild(this.trackEl);
    this.container.appendChild(scrollWrapper);

    this.updateActiveStyles();
  }

  public selectCategory(categoryId: SwipeCategoryId): void {
    this.setActive(categoryId, true);

    const cat = SWIPE_CATEGORIES.find((c) => c.id === categoryId);
    if (cat?.highlightSection) {
      this.store.setActiveHighlightSection(cat.highlightSection);
    }

    this.onSelectCallback?.(categoryId);
  }

  public setActive(categoryId: SwipeCategoryId, scrollIntoView = true): void {
    this.activeId = categoryId;
    this.updateActiveStyles();

    if (scrollIntoView) {
      const activeBtn = this.tabButtons.get(categoryId);
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }

  public getActiveId(): SwipeCategoryId {
    return this.activeId;
  }

  private updateActiveStyles(): void {
    for (const [id, btn] of this.tabButtons) {
      const isActive = id === this.activeId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
  }
}
