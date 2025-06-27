export declare class WaynWidget extends HTMLElement {
    private shadow;
    private container;
    private resetTimer;
    private isProcessing;
    private state;
    private i18n;
    constructor();
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private setupWidget;
    private injectStyles;
    private addEventListeners;
    private handleClick;
    private handleKeyDown;
    private canInteract;
    private solve;
    private handleProgress;
    private handleError;
    private setState;
    private updateUI;
    private getAriaLabel;
    private reset;
    private cleanup;
    get token(): string | null;
    get isVerified(): boolean;
    resetWidget(): void;
}
//# sourceMappingURL=WaynWidget.d.ts.map