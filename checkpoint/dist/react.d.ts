import React, { ComponentType } from 'react';
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
    errorComponent?: React.ComponentType<{
        error: string;
        onRetry: () => void;
    }>;
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
 * Higher-Order Component for protecting React applications with Wayn Checkpoint
 */
export declare function withCheckpoint<P extends object>(WrappedComponent: ComponentType<P>, checkpointConfig: CheckpointWrapperProps): React.FC<P>;
/**
 * React Hook for checkpoint verification
 */
export declare function useCheckpoint(config: Omit<CheckpointConfig, 'secret'>): VerificationStatusWithRetry;
/**
 * Checkpoint Provider component for React applications
 */
export declare const CheckpointProvider: React.FC<CheckpointWrapperProps & {
    children: React.ReactNode;
}>;
export default withCheckpoint;
//# sourceMappingURL=react.d.ts.map