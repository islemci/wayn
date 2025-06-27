"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckpointProvider = void 0;
exports.withCheckpoint = withCheckpoint;
exports.useCheckpoint = useCheckpoint;
const react_1 = __importStar(require("react"));
/**
 * Default loading component
 */
const DefaultLoading = () => (<div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui',
        flexDirection: 'column',
        gap: '1rem'
    }}>
    <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #007AFF',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    }}/>
    <p>Checking verification status...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>);
/**
 * Default error component
 */
const DefaultError = ({ error, onRetry }) => (<div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem'
    }}>
    <h2>Verification Required</h2>
    <p style={{ color: '#666', textAlign: 'center' }}>
      {error || 'You need to complete the security challenge to access this application.'}
    </p>
    <button onClick={onRetry} style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#007AFF',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem'
    }}>
      Retry Verification
    </button>
  </div>);
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
            return <LoadingComponent />;
        }
        if (!isVerified) {
            if (error === 'Verification required') {
                // Redirect to checkpoint page
                const checkpointUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
                window.location.href = checkpointUrl;
                return null;
            }
            const ErrorComponent = checkpointConfig.errorComponent || DefaultError;
            return <ErrorComponent error={error || 'Unknown error'} onRetry={retry}/>;
        }
        return <WrappedComponent {...props}/>;
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
        const LoadingComponent = config.loadingComponent || DefaultLoading;
        return <LoadingComponent />;
    }
    if (!isVerified) {
        if (error === 'Verification required') {
            // Redirect to checkpoint page
            const checkpointUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
            window.location.href = checkpointUrl;
            return null;
        }
        const ErrorComponent = config.errorComponent || DefaultError;
        return <ErrorComponent error={error || 'Unknown error'} onRetry={retry}/>;
    }
    return <>{children}</>;
};
exports.CheckpointProvider = CheckpointProvider;
exports.default = withCheckpoint;
//# sourceMappingURL=react.jsx.map