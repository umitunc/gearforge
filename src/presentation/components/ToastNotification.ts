export type ToastType = 'success' | 'info' | 'warn' | 'error';

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  durationMs?: number;
}

export class ToastNotification {
  private static container: HTMLElement | null = null;

  private static ensureContainer(): HTMLElement {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = document.createElement('div');
      this.container.id = 'gearforge-toast-container';
      this.container.className = 'gearforge-toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  public static show(options: ToastOptions): void {
    const { title, message, type = 'info', durationMs = 3200 } = options;
    const container = this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `gearforge-toast toast-${type}`;

    const iconMap: Record<ToastType, string> = {
      success: '✓',
      info: 'ℹ',
      warn: '⚠',
      error: '✕',
    };

    toast.innerHTML = `
      <div class="toast-icon-badge">${iconMap[type]}</div>
      <div class="toast-content">
        ${title ? `<strong class="toast-title">${title}</strong>` : ''}
        <span class="toast-msg">${message}</span>
      </div>
      <button class="toast-close-btn" aria-label="Kapat">×</button>
    `;

    const closeBtn = toast.querySelector('.toast-close-btn');
    const dismiss = () => {
      toast.classList.add('toast-exit');
      setTimeout(() => {
        toast.remove();
      }, 300);
    };

    closeBtn?.addEventListener('click', dismiss);

    container.appendChild(toast);

    // Otomatik kapanma
    if (durationMs > 0) {
      setTimeout(() => {
        if (document.body.contains(toast)) {
          dismiss();
        }
      }, durationMs);
    }
  }

  public static success(message: string, title?: string): void {
    this.show({ message, title, type: 'success' });
  }

  public static info(message: string, title?: string): void {
    this.show({ message, title, type: 'info' });
  }

  public static warn(message: string, title?: string): void {
    this.show({ message, title, type: 'warn' });
  }

  public static error(message: string, title?: string): void {
    this.show({ message, title, type: 'error' });
  }
}
