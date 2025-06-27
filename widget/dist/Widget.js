import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef, useEffect } from 'react';
import { solveChallenges } from './worker';
import './widget.css';
export const Widget = ({ api, color = 'light', workerCount = navigator.hardwareConcurrency || 4, onSolve, onProgress, onError, onReset, className = '', style, disabled = false, i18n = {} }) => {
    const [state, setState] = useState({
        state: 'idle',
        progress: 0,
        token: null,
        error: null
    });
    const resetTimeoutRef = useRef(null);
    const isProcessingRef = useRef(false);
    const i18nTexts = {
        initialState: i18n.initialState || "I'm a human",
        verifying: i18n.verifying || 'Verifying...',
        verified: i18n.verified || "You're a human",
        error: i18n.error || 'Error. Try again.'
    };
    const handleProgress = useCallback((progress) => {
        setState(prev => ({ ...prev, progress }));
        onProgress?.(progress);
    }, [onProgress]);
    const handleError = useCallback((error) => {
        setState({
            state: 'error',
            progress: 0,
            token: null,
            error
        });
        onError?.(error);
        isProcessingRef.current = false;
    }, [onError]);
    const reset = useCallback(() => {
        if (resetTimeoutRef.current) {
            window.clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
        setState({
            state: 'idle',
            progress: 0,
            token: null,
            error: null
        });
        onReset?.();
        isProcessingRef.current = false;
    }, [onReset]);
    const solve = useCallback(async () => {
        if (isProcessingRef.current || disabled) {
            return;
        }
        isProcessingRef.current = true;
        try {
            setState({
                state: 'verifying',
                progress: 0,
                token: null,
                error: null
            });
            // Validate API endpoint
            if (!api) {
                throw new Error('API endpoint is required');
            }
            // Request challenge
            const challengeResponse = await fetch(`${api}/challenge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!challengeResponse.ok) {
                throw new Error(`Failed to get challenge: ${challengeResponse.statusText}`);
            }
            const challengeData = await challengeResponse.json();
            // Solve challenges
            const solutions = await solveChallenges(challengeData.challenge, workerCount, handleProgress);
            // Submit solutions
            const solutionResponse = await fetch(`${api}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: challengeData.token,
                    solutions
                })
            });
            if (!solutionResponse.ok) {
                throw new Error(`Failed to verify solution: ${solutionResponse.statusText}`);
            }
            const solutionData = await solutionResponse.json();
            if (!solutionData.success) {
                throw new Error('Solution verification failed');
            }
            // Success
            setState({
                state: 'verified',
                progress: 100,
                token: solutionData.token,
                error: null
            });
            onSolve?.(solutionData.token);
            // Set up auto-reset based on expiration
            if (solutionData.expires) {
                const expiresIn = new Date(solutionData.expires).getTime() - Date.now();
                if (expiresIn > 0 && expiresIn < 24 * 60 * 60 * 1000) {
                    resetTimeoutRef.current = window.setTimeout(reset, expiresIn);
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            handleError(errorMessage);
        }
        finally {
            isProcessingRef.current = false;
        }
    }, [api, workerCount, disabled, handleProgress, handleError, onSolve, reset]);
    const handleClick = useCallback(() => {
        if (state.state === 'error' || state.state === 'idle') {
            solve();
        }
    }, [state.state, solve]);
    const handleKeyDown = useCallback((event) => {
        if ((event.key === 'Enter' || event.key === ' ') && (state.state === 'error' || state.state === 'idle')) {
            event.preventDefault();
            solve();
        }
    }, [state.state, solve]);
    useEffect(() => {
        return () => {
            if (resetTimeoutRef.current) {
                window.clearTimeout(resetTimeoutRef.current);
            }
        };
    }, []);
    const getDisplayText = () => {
        switch (state.state) {
            case 'verifying':
                return `${i18nTexts.verifying} ${state.progress}%`;
            case 'verified':
                return i18nTexts.verified;
            case 'error':
                return i18nTexts.error;
            default:
                return i18nTexts.initialState;
        }
    };
    const getAriaLabel = () => {
        switch (state.state) {
            case 'verifying':
                return `Verifying you're a human, ${state.progress}% complete`;
            case 'verified':
                return "We have verified you're a human, you may now continue";
            case 'error':
                return 'An error occurred, click to try again';
            default:
                return "Click to verify you're a human";
        }
    };
    const isClickable = state.state === 'idle' || state.state === 'error';
    const isDisabled = disabled || state.state === 'verifying' || state.state === 'verified';
    return (_jsxs("div", { className: `wayn-widget wayn-widget--${color} wayn-widget--${state.state} ${className}`, style: style, onClick: handleClick, onKeyDown: handleKeyDown, role: "button", tabIndex: isDisabled ? -1 : 0, "aria-label": getAriaLabel(), "aria-live": "polite", "data-testid": "wayn-widget", children: [_jsxs("div", { className: "wayn-widget__content", children: [_jsx("div", { className: "wayn-widget__checkbox", style: state.state === 'verifying' ? { '--progress': `${state.progress}%` } : undefined }), _jsx("span", { className: "wayn-widget__text", children: getDisplayText() })] }), _jsxs("a", { href: "https://github.com/islemci/wayn", className: "wayn-widget__credits", target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), "aria-label": "Secured by Wayn", children: [_jsx("span", { className: "wayn-widget__credits-text", children: "Secured by\u00A0" }), "Wayn"] }), _jsx("input", { type: "hidden", name: "wayn-token", value: state.token || '', "data-testid": "wayn-token-input" })] }));
};
export default Widget;
//# sourceMappingURL=Widget.js.map