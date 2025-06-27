/**
 * Configuration options for the Wayn Checkpoint middleware
 */
export interface CheckpointConfig {
  /** JWT secret key for signing and verifying tokens */
  secret: string;
  /** Number of questions in the challenge (default: 5) */
  questionCount?: number;
  /** Difficulty level of the questions (default: 5) */
  questionHardness?: number;
  /** TTL for JWT token in hours (default: 24) */
  jwtTtlHours?: number;
  /** API endpoint path for challenges (default: '/__wayn_checkpoint') */
  apiEndpoint?: string;
  /** Custom HTML template (optional) */
  customTemplate?: string;
  /** Cookie name for the clearance token (default: '__wayn-clarification') */
  cookieName?: string;
  /** Whether to enable debug logging (default: false) */
  debug?: boolean;
  /** Custom redirect URL after successful verification */
  redirectUrl?: string;
  /** Paths to exclude from checkpoint protection */
  excludePaths?: string[];
  /** Rate limiting options */
  rateLimit?: {
    windowMs: number;
    maxAttempts: number;
  };
}

/**
 * Extended Request interface with checkpoint-specific properties
 */
export interface CheckpointRequest {
  waynVerified?: boolean;
  waynChallenge?: any;
}

/**
 * Challenge response from the server
 */
export interface ChallengeResponse {
  success: boolean;
  challenge?: any;
  token?: string;
  message?: string;
}

/**
 * Solution submission structure
 */
export interface SolutionSubmission {
  token: string;
  solutions: [string, string, number][];
}

/**
 * Verification response
 */
export interface VerificationResponse {
  success: boolean;
  jwt?: string;
  expires?: number;
  message?: string;
}

/**
 * Rate limiting tracking
 */
export interface RateLimitEntry {
  attempts: number;
  windowStart: number;
}
