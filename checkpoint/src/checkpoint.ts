import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import Wayn from '@usewayn/server';
import { 
  CheckpointConfig, 
  CheckpointRequest, 
  ChallengeResponse, 
  SolutionSubmission, 
  VerificationResponse,
  RateLimitEntry 
} from './types';
import { DEFAULT_TEMPLATE, renderTemplate } from './template';

/**
 * Wayn Checkpoint - DDOS protection middleware
 */
export class WaynCheckpoint {
  private config: Required<CheckpointConfig>;
  private waynServer: Wayn;
  private rateLimitMap: Map<string, RateLimitEntry> = new Map();

  constructor(config: CheckpointConfig) {
    if (!config.secret) {
      throw new Error('Wayn Checkpoint: secret is required');
    }

    this.config = {
      questionCount: 5,
      questionHardness: 5,
      jwtTtlHours: 24,
      apiEndpoint: '/__wayn_checkpoint',
      customTemplate: '',
      cookieName: '__wayn-clarification',
      debug: false,
      redirectUrl: '',
      excludePaths: [],
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5
      },
      ...config
    };

    // Initialize Wayn server with appropriate difficulty
    this.waynServer = new Wayn({
      secret: this.config.secret,
      challengeCount: this.config.questionCount,
      challengeDifficulty: this.config.questionHardness,
      jwtExpiresIn: `${this.config.jwtTtlHours}h`
    });

    this.log('Wayn Checkpoint initialized', {
      questionCount: this.config.questionCount,
      questionHardness: this.config.questionHardness,
      jwtTtlHours: this.config.jwtTtlHours,
      apiEndpoint: this.config.apiEndpoint
    });
  }

  /**
   * Main middleware function
   */
  public middleware() {
    return (req: Request & CheckpointRequest, res: Response, next: NextFunction) => {
      // Skip excluded paths
      if (this.isExcludedPath(req.path)) {
        return next();
      }

      // Handle API endpoints
      if (req.path.startsWith(this.config.apiEndpoint)) {
        return this.handleApiRequest(req, res);
      }

      // Check if user has valid clearance token
      const clearanceToken = this.getClearanceToken(req);
      if (clearanceToken && this.validateClearanceToken(clearanceToken)) {
        req.waynVerified = true;
        return next();
      }

      // Check rate limiting
      if (!this.checkRateLimit(req)) {
        return this.sendRateLimitResponse(res);
      }

      // Serve checkpoint page
      this.serveCheckpointPage(res);
    };
  }

  /**
   * Handle API requests (challenge generation and verification)
   */
  private handleApiRequest(req: Request & CheckpointRequest, res: Response): void {
    const path = req.path.replace(this.config.apiEndpoint, '');

    switch (path) {
      case '/challenge':
        this.handleChallengeRequest(req, res);
        break;
      case '/verify':
        this.handleVerifyRequest(req, res);
        break;
      case '/status':
        this.handleStatusRequest(req, res);
        break;
      default:
        res.status(404).json({ success: false, message: 'Endpoint not found' });
    }
  }

  /**
   * Generate new challenge
   */
  private handleChallengeRequest(req: Request & CheckpointRequest, res: Response): void {
    try {
      if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
      }

      // Check rate limiting for challenge requests
      if (!this.checkRateLimit(req)) {
        this.sendRateLimitResponse(res);
        return;
      }

      const challengeData = this.waynServer.createChallenge();
      
      const response: ChallengeResponse = {
        success: true,
        challenge: challengeData.challenge,
        token: challengeData.token
      };

      this.log('Challenge generated', { token: challengeData.token });
      res.json(response);
    } catch (error) {
      this.log('Error generating challenge', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate challenge' 
      });
    }
  }

  /**
   * Verify solution and issue JWT
   */
  private handleVerifyRequest(req: Request & CheckpointRequest, res: Response): void {
    try {
      if (req.method !== 'POST') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
      }

      const solution: SolutionSubmission = req.body;
      
      if (!solution || !solution.token || !solution.solutions) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid solution format' 
        });
        return;
      }

      // Check rate limiting for verification requests
      if (!this.checkRateLimit(req)) {
        this.sendRateLimitResponse(res);
        return;
      }

      const redemptionResult = this.waynServer.redeemChallenge(solution);
      
      if (redemptionResult.success && redemptionResult.jwt) {
        const response: VerificationResponse = {
          success: true,
          jwt: redemptionResult.jwt,
          expires: redemptionResult.expires
        };

        this.log('Challenge verified successfully', { 
          token: solution.token,
          ip: this.getClientIp(req)
        });

        res.json(response);
      } else {
        this.log('Challenge verification failed', { 
          token: solution.token,
          message: redemptionResult.message,
          ip: this.getClientIp(req)
        });

        res.status(400).json({
          success: false,
          message: redemptionResult.message || 'Verification failed'
        });
      }
    } catch (error) {
      this.log('Error verifying solution', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Handle status check requests
   */
  private handleStatusRequest(req: Request & CheckpointRequest, res: Response): void {
    try {
      if (req.method !== 'GET') {
        res.status(405).json({ success: false, message: 'Method not allowed' });
        return;
      }

      const clearanceToken = this.getClearanceToken(req);
      const isVerified = clearanceToken && this.validateClearanceToken(clearanceToken);

      res.json({
        verified: isVerified,
        timestamp: Date.now()
      });
    } catch (error) {
      this.log('Error checking status', error);
      res.status(500).json({ 
        verified: false,
        error: 'Status check failed' 
      });
    }
  }

  /**
   * Serve the checkpoint challenge page
   */
  private serveCheckpointPage(res: Response): void {
    const template = this.config.customTemplate || DEFAULT_TEMPLATE;
    const html = renderTemplate(
      template,
      this.config.apiEndpoint,
      this.config.jwtTtlHours,
      this.config.cookieName,
      this.config.questionCount,
      this.config.questionHardness
    );

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200).send(html);
  }

  /**
   * Get clearance token from request
   */
  private getClearanceToken(req: Request): string | null {
    // Check cookies first
    if (req.headers.cookie && typeof req.headers.cookie === 'string') {
      const cookies = req.headers.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === this.config.cookieName && value) {
          return value;
        }
      }
    }

    // Check Authorization header as fallback
    const authHeader = req.headers.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Validate clearance token
   */
  private validateClearanceToken(token: string): boolean {
    try {
      return this.waynServer.validateToken(token);
    } catch (error) {
      this.log('Token validation error', error);
      return false;
    }
  }

  /**
   * Check if path should be excluded from checkpoint
   */
  private isExcludedPath(path: string): boolean {
    return this.config.excludePaths.some(excludePath => {
      if (excludePath.endsWith('*')) {
        return path.startsWith(excludePath.slice(0, -1));
      }
      return path === excludePath;
    });
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(req: Request): boolean {
    if (!this.config.rateLimit) {
      return true;
    }

    const clientIp = this.getClientIp(req);
    const now = Date.now();
    const windowStart = now - this.config.rateLimit.windowMs;

    // Clean old entries
    this.cleanOldRateLimitEntries(windowStart);

    const entry = this.rateLimitMap.get(clientIp);
    
    if (!entry) {
      this.rateLimitMap.set(clientIp, {
        attempts: 1,
        windowStart: now
      });
      return true;
    }

    if (entry.windowStart < windowStart) {
      // Reset window
      entry.attempts = 1;
      entry.windowStart = now;
      return true;
    }

    entry.attempts++;
    return entry.attempts <= this.config.rateLimit.maxAttempts;
  }

  /**
   * Send rate limit response
   */
  private sendRateLimitResponse(res: Response): void {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.'
    });
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Clean old rate limit entries
   */
  private cleanOldRateLimitEntries(windowStart: number): void {
    for (const [ip, entry] of this.rateLimitMap.entries()) {
      if (entry.windowStart < windowStart) {
        this.rateLimitMap.delete(ip);
      }
    }
  }

  /**
   * Logging utility
   */
  private log(message: string, data?: any): void {
    if (this.config.debug) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Wayn Checkpoint: ${message}`, data || '');
    }
  }
}

/**
 * Factory function to create checkpoint middleware
 */
export function createCheckpoint(config: CheckpointConfig) {
  const checkpoint = new WaynCheckpoint(config);
  return checkpoint.middleware();
}

/**
 * Default export
 */
export default createCheckpoint;
