import React, { ComponentType, useEffect, useState } from 'react';
import { CheckpointConfig } from './types';

/**
 * Props for the Checkpoint wrapper component
 */
interface CheckpointWrapperProps {
  /** Configuration for the checkpoint */
  config: Omit<CheckpointConfig, 'secret'>;
  /** Loading component to show during verification */
  loadingComponent?: React.ComponentType;
  /** Error component to show on verification failure */
  errorComponent?: React.ComponentType<{ error: string; onRetry: () => void }>;
  /** Custom verification endpoint */
  verificationEndpoint?: string;
}

/**
 * Verification status
 */
interface VerificationStatus {
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Verification status with retry function
 */
interface VerificationStatusWithRetry extends VerificationStatus {
  retry: () => void;
}

/**
 * Default loading component
 */
const DefaultLoading: React.FC = () => (
  <div style={{
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
    }} />
    <p>Checking verification status...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

/**
 * Default error component
 */
const DefaultError: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div style={{
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
    <button
      onClick={onRetry}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#007AFF',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem'
      }}
    >
      Retry Verification
    </button>
  </div>
);

/**
 * Hook to check verification status
 */
function useCheckpointVerification(config: CheckpointWrapperProps): VerificationStatusWithRetry {
  const [status, setStatus] = useState<VerificationStatus>({
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
      } else if (response.status === 401 || response.status === 403) {
        // Not verified, need to redirect to checkpoint
        setStatus({
          isVerified: false,
          isLoading: false,
          error: 'Verification required'
        });
      } else {
        throw new Error('Verification check failed');
      }
    } catch (error) {
      setStatus({
        isVerified: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Verification check failed'
      });
    }
  };

  useEffect(() => {
    checkVerification();
  }, []);

  return { ...status, retry: checkVerification } as VerificationStatusWithRetry;
}

/**
 * Higher-Order Component for protecting React applications with Wayn Checkpoint
 */
export function withCheckpoint<P extends object>(
  WrappedComponent: ComponentType<P>,
  checkpointConfig: CheckpointWrapperProps
) {
  const CheckpointProtectedComponent: React.FC<P> = (props) => {
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
      return <ErrorComponent error={error || 'Unknown error'} onRetry={retry} />;
    }

    return <WrappedComponent {...props} />;
  };

  CheckpointProtectedComponent.displayName = `withCheckpoint(${WrappedComponent.displayName || WrappedComponent.name})`;

  return CheckpointProtectedComponent;
}

/**
 * React Hook for checkpoint verification
 */
export function useCheckpoint(config: Omit<CheckpointConfig, 'secret'>) {
  return useCheckpointVerification({ config });
}

/**
 * Checkpoint Provider component for React applications
 */
export const CheckpointProvider: React.FC<CheckpointWrapperProps & { children: React.ReactNode }> = ({
  children,
  config,
  ...rest
}) => {
  const { isVerified, isLoading, error, retry } = useCheckpointVerification({ config, ...rest });

  if (isLoading) {
    const LoadingComponent = rest.loadingComponent || DefaultLoading;
    return <LoadingComponent />;
  }

  if (!isVerified) {
    if (error === 'Verification required') {
      // Redirect to checkpoint page
      const checkpointUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
      window.location.href = checkpointUrl;
      return null;
    }

    const ErrorComponent = rest.errorComponent || DefaultError;
    return <ErrorComponent error={error || 'Unknown error'} onRetry={retry} />;
  }

  return <>{children}</>;
};

export default withCheckpoint;
