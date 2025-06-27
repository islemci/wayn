import { CSSProperties } from 'react';
export interface WidgetProps {
    /**
     * API endpoint for the @usewayn/server provider
     */
    api: string;
    /**
     * Theme mode for the widget
     */
    color?: 'light' | 'dark';
    /**
     * Number of workers to use for PoW solving
     */
    workerCount?: number;
    /**
     * Callback fired when the CAPTCHA is successfully solved
     */
    onSolve?: (token: string) => void;
    /**
     * Callback fired during solving progress
     */
    onProgress?: (progress: number) => void;
    /**
     * Callback fired when an error occurs
     */
    onError?: (error: string) => void;
    /**
     * Callback fired when the widget is reset
     */
    onReset?: () => void;
    /**
     * Custom CSS class name
     */
    className?: string;
    /**
     * Custom styles
     */
    style?: CSSProperties;
    /**
     * Whether the widget is disabled
     */
    disabled?: boolean;
    /**
     * Custom internationalization texts
     */
    i18n?: {
        initialState?: string;
        verifying?: string;
        verified?: string;
        error?: string;
    };
}
export interface WaynChallenge {
    salt: string;
    target: number;
}
export interface ChallengeResponse {
    challenge: WaynChallenge[];
    token: string;
}
export interface SolutionResponse {
    success: boolean;
    token: string;
    expires: string;
}
export interface WidgetState {
    state: 'idle' | 'verifying' | 'verified' | 'error';
    progress: number;
    token: string | null;
    error: string | null;
}
//# sourceMappingURL=types.d.ts.map