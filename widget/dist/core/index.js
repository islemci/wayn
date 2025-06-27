import { WaynWidget } from './WaynWidget';
// Register the custom element
if (!customElements.get('wayn-widget')) {
    customElements.define('wayn-widget', WaynWidget);
}
// Export for module usage
export { WaynWidget };
// Global class for programmatic usage
export class Wayn {
    constructor(config) {
        this.widget = document.createElement('wayn-widget');
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
        }
        else {
            this.widget.style.display = 'none';
            document.body.appendChild(this.widget);
        }
    }
    // Event listeners
    onSolve(callback) {
        this.widget.addEventListener('wayn:solve', (event) => {
            const customEvent = event;
            callback(customEvent.detail.token);
        });
    }
    onProgress(callback) {
        this.widget.addEventListener('wayn:progress', (event) => {
            const customEvent = event;
            callback(customEvent.detail.progress);
        });
    }
    onError(callback) {
        this.widget.addEventListener('wayn:error', (event) => {
            const customEvent = event;
            callback(customEvent.detail.error);
        });
    }
    onReset(callback) {
        this.widget.addEventListener('wayn:reset', callback);
    }
    // Public methods
    get token() {
        return this.widget.token;
    }
    get isVerified() {
        return this.widget.isVerified;
    }
    reset() {
        this.widget.resetWidget();
    }
    destroy() {
        if (this.widget.parentNode) {
            this.widget.parentNode.removeChild(this.widget);
        }
    }
}
if (typeof window !== 'undefined') {
    window.Wayn = Wayn;
    window.WaynWidget = WaynWidget;
}
//# sourceMappingURL=index.js.map