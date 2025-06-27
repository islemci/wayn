import { WaynWidget } from './WaynWidget';
export { WaynWidget };
export type { WaynChallenge, ChallengeResponse, SolutionResponse } from '../types';
export declare class Wayn {
    private widget;
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
    });
    onSolve(callback: (token: string) => void): void;
    onProgress(callback: (progress: number) => void): void;
    onError(callback: (error: string) => void): void;
    onReset(callback: () => void): void;
    get token(): string | null;
    get isVerified(): boolean;
    reset(): void;
    destroy(): void;
}
declare global {
    interface Window {
        Wayn: typeof Wayn;
        WaynWidget: typeof WaynWidget;
    }
}
//# sourceMappingURL=index.d.ts.map