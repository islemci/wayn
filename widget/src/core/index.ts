import { WaynWidget } from './WaynWidget';

// Register the custom element
if (!customElements.get('wayn-widget')) {
  customElements.define('wayn-widget', WaynWidget);
}

// Export for module usage
export { WaynWidget };
export type { WaynChallenge, ChallengeResponse, SolutionResponse } from '../types';

// Global class for programmatic usage
export class Wayn {
  private widget: WaynWidget;

  constructor(config: {
    api: string;
    color?: 'light' | 'dark';
    workerCount?: number;
    container?: HTMLElement;
    i18n?: {
      initialState?: string;
      verifying?: string;
      verified?: string;
      error?: string;
    };
  }) {
    this.widget = document.createElement('wayn-widget') as WaynWidget;
    
    // Set attributes
    this.widget.setAttribute('api', config.api);
    if (config.color) {
      this.widget.setAttribute('color', config.color);
    }
    if (config.workerCount) {
      this.widget.setAttribute('worker-count', config.workerCount.toString());
    }
    if (config.i18n) {
      if (config.i18n.initialState) {
        this.widget.setAttribute('data-i18n-initial-state', config.i18n.initialState);
      }
      if (config.i18n.verifying) {
        this.widget.setAttribute('data-i18n-verifying', config.i18n.verifying);
      }
      if (config.i18n.verified) {
        this.widget.setAttribute('data-i18n-verified', config.i18n.verified);
      }
      if (config.i18n.error) {
        this.widget.setAttribute('data-i18n-error', config.i18n.error);
      }
    }

    // Append to container or hide it for programmatic usage
    if (config.container) {
      config.container.appendChild(this.widget);
    } else {
      this.widget.style.display = 'none';
      document.body.appendChild(this.widget);
    }
  }

  // Event listeners
  public onSolve(callback: (token: string) => void): void {
    this.widget.addEventListener('wayn:solve', (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail.token);
    });
  }

  public onProgress(callback: (progress: number) => void): void {
    this.widget.addEventListener('wayn:progress', (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail.progress);
    });
  }

  public onError(callback: (error: string) => void): void {
    this.widget.addEventListener('wayn:error', (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail.error);
    });
  }

  public onReset(callback: () => void): void {
    this.widget.addEventListener('wayn:reset', callback);
  }

  // Public methods
  public get token(): string | null {
    return this.widget.token;
  }

  public get isVerified(): boolean {
    return this.widget.isVerified;
  }

  public reset(): void {
    this.widget.resetWidget();
  }

  public destroy(): void {
    if (this.widget.parentNode) {
      this.widget.parentNode.removeChild(this.widget);
    }
  }
}

// Make it available globally for CDN usage
declare global {
  interface Window {
    Wayn: typeof Wayn;
    WaynWidget: typeof WaynWidget;
  }
}

if (typeof window !== 'undefined') {
  window.Wayn = Wayn;
  window.WaynWidget = WaynWidget;
}
