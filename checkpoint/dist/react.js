"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckpointProvider = void 0;
exports.withCheckpoint = withCheckpoint;
exports.useCheckpoint = useCheckpoint;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
/**
 * Default loading component
 */
const DefaultLoading = () => ((0, jsx_runtime_1.jsxs)("div", { style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui',
        flexDirection: 'column',
        gap: '1rem'
    }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #007AFF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            } }), (0, jsx_runtime_1.jsx)("p", { children: "Checking verification status..." }), (0, jsx_runtime_1.jsx)("style", { children: `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    ` })] }));
/**
 * Default error component
 */
const DefaultError = ({ error, onRetry }) => ((0, jsx_runtime_1.jsxs)("div", { style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem'
    }, children: [(0, jsx_runtime_1.jsx)("h2", { children: "Verification Required" }), (0, jsx_runtime_1.jsx)("p", { style: { color: '#666', textAlign: 'center' }, children: error || 'You need to complete the security challenge to access this application.' }), (0, jsx_runtime_1.jsx)("button", { onClick: onRetry, style: {
                padding: '0.75rem 1.5rem',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
            }, children: "Retry Verification" })] }));
/**
 * Hook to check verification status
 */
function useCheckpointVerification(config) {
    const [status, setStatus] = (0, react_1.useState)({
        isVerified: false,
        isLoading: true,
        error: null
    });
    const checkVerification = async () => {
        try {
            setStatus(prev => ({ ...prev, isLoading: true, error: null }));
            const endpoint = config.verificationEndpoint || (config.config.apiEndpoint || '/__wayn_checkpoint') + '/status';
            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setStatus({
                    isVerified: data.verified || false,
                    isLoading: false,
                    error: null
                });
            }
            else if (response.status === 401 || response.status === 403) {
                // Not verified, need to redirect to checkpoint
                setStatus({
                    isVerified: false,
                    isLoading: false,
                    error: 'Verification required'
                });
            }
            else {
                throw new Error('Verification check failed');
            }
        }
        catch (error) {
            setStatus({
                isVerified: false,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Verification check failed'
            });
        }
    };
    (0, react_1.useEffect)(() => {
        checkVerification();
    }, []);
    return { ...status, retry: checkVerification };
}
/**
 * Higher-Order Component for protecting React applications with Wayn Checkpoint
 */
function withCheckpoint(WrappedComponent, checkpointConfig) {
    const CheckpointProtectedComponent = (props) => {
        const { isVerified, isLoading, error, retry } = useCheckpointVerification(checkpointConfig);
        if (isLoading) {
            const LoadingComponent = checkpointConfig.loadingComponent || DefaultLoading;
            return (0, jsx_runtime_1.jsx)(LoadingComponent, {});
        }
        if (!isVerified) {
            if (error === 'Verification required') {
                // Redirect to checkpoint page
                const checkpointUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
                window.location.href = checkpointUrl;
                return null;
            }
            const ErrorComponent = checkpointConfig.errorComponent || DefaultError;
            return (0, jsx_runtime_1.jsx)(ErrorComponent, { error: error || 'Unknown error', onRetry: retry });
        }
        return (0, jsx_runtime_1.jsx)(WrappedComponent, { ...props });
    };
    CheckpointProtectedComponent.displayName = `withCheckpoint(${WrappedComponent.displayName || WrappedComponent.name})`;
    return CheckpointProtectedComponent;
}
/**
 * React Hook for checkpoint verification
 */
function useCheckpoint(config) {
    return useCheckpointVerification({ config });
}
/**
 * Checkpoint Provider component for React applications
 */
const CheckpointProvider = ({ children, config, ...rest }) => {
    const { isVerified, isLoading, error, retry } = useCheckpointVerification({ config, ...rest });
    if (isLoading) {
        const LoadingComponent = rest.loadingComponent || DefaultLoading;
        return (0, jsx_runtime_1.jsx)(LoadingComponent, {});
    }
    if (!isVerified) {
        if (error === 'Verification required') {
            // Redirect to checkpoint page
            const checkpointUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
            window.location.href = checkpointUrl;
            return null;
        }
        const ErrorComponent = rest.errorComponent || DefaultError;
        return (0, jsx_runtime_1.jsx)(ErrorComponent, { error: error || 'Unknown error', onRetry: retry });
    }
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
};
exports.CheckpointProvider = CheckpointProvider;
exports.default = withCheckpoint;
//# sourceMappingURL=react.js.map