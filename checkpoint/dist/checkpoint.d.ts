import { Request, Response, NextFunction } from 'express';
import { CheckpointConfig, CheckpointRequest } from './types';
/**
 * Wayn Checkpoint - DDOS protection middleware
 */
export declare class WaynCheckpoint {
    private config;
    private waynServer;
    private rateLimitMap;
    constructor(config: CheckpointConfig);
    /**
     * Main middleware function
     */
    middleware(): (req: Request & CheckpointRequest, res: Response, next: NextFunction) => void;
    /**
     * Handle API requests (challenge generation and verification)
     */
    private handleApiRequest;
    /**
     * Generate new challenge
     */
    private handleChallengeRequest;
    /**
     * Verify solution and issue JWT
     */
    private handleVerifyRequest;
    /**
     * Handle status check requests
     */
    private handleStatusRequest;
    /**
     * Serve the checkpoint challenge page
     */
    private serveCheckpointPage;
    /**
     * Get clearance token from request
     */
    private getClearanceToken;
    /**
     * Validate clearance token
     */
    private validateClearanceToken;
    /**
     * Check if path should be excluded from checkpoint
     */
    private isExcludedPath;
    /**
     * Rate limiting check
     */
    private checkRateLimit;
    /**
     * Send rate limit response
     */
    private sendRateLimitResponse;
    /**
     * Get client IP address
     */
    private getClientIp;
    /**
     * Clean old rate limit entries
     */
    private cleanOldRateLimitEntries;
    /**
     * Logging utility
     */
    private log;
}
/**
 * Factory function to create checkpoint middleware
 */
export declare function createCheckpoint(config: CheckpointConfig): (req: Request & CheckpointRequest, res: Response, next: NextFunction) => void;
/**
 * Default export
 */
export default createCheckpoint;
//# sourceMappingURL=checkpoint.d.ts.map