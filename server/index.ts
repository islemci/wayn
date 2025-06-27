import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

/**
 * Configuration options for the Wayn PoW captcha system
 */
export interface WaynConfig {
  /** JWT secret key for signing and verifying tokens */
  secret: string;
  /** Number of challenges to generate per request (default: 50) */
  challengeCount?: number;
  /** Size of each challenge in bytes (default: 32) */
  challengeSize?: number;
  /** Difficulty level - number of leading zeros required (default: 4) */
  challengeDifficulty?: number;
  /** Challenge expiration time in milliseconds (default: 10 minutes) */
  challengeExpiresMs?: number;
  /** JWT expiration time (default: '1h') */
  jwtExpiresIn?: string;
}

/**
 * A single challenge tuple [salt, target]
 */
export type ChallengeTuple = [string, string];

/**
 * Challenge data structure
 */
export interface ChallengeData {
  /** Array of [salt, target] tuples */
  challenge: ChallengeTuple[];
  /** Expiration timestamp */
  expires: number;
  /** Challenge token (SHA256 hash) */
  token: string;
}

/**
 * Solution structure for redeeming challenges
 */
export interface Solution {
  /** Challenge token (SHA256 hash) */
  token: string;
  /** Array of [salt, target, nonce] tuples */
  solutions: [string, string, number][];
}

/**
 * Response from challenge redemption
 */
export interface RedemptionResponse {
  /** Whether the redemption was successful */
  success: boolean;
  /** Error message if unsuccessful */
  message?: string;
  /** JWT token if successful */
  jwt?: string;
  /** JWT expiration timestamp if successful */
  expires?: number;
}

/**
 * Wayn PoW captcha backend module
 */
export default class Wayn {
  private config: Required<WaynConfig>;
  private challenges: Map<string, ChallengeData> = new Map();

  constructor(config: WaynConfig) {
    this.config = {
      challengeCount: 50,
      challengeSize: 32,
      challengeDifficulty: 4,
      challengeExpiresMs: 10 * 60 * 1000, // 10 minutes
      jwtExpiresIn: '1h',
      ...config
    };
  }

  /**
   * Creates a new PoW challenge
   * @returns Challenge data with token and challenge array
   */
  createChallenge(): ChallengeData {
    this.cleanExpiredChallenges();

    // Generate challenge tuples
    const challenge: ChallengeTuple[] = Array.from(
      { length: this.config.challengeCount },
      () => [
        // Generate random salt
        crypto.randomBytes(Math.ceil(this.config.challengeSize / 2))
          .toString('hex')
          .slice(0, this.config.challengeSize),
        // Generate target (required leading zeros)
        '0'.repeat(this.config.challengeDifficulty) +
        crypto.randomBytes(Math.ceil((32 - this.config.challengeDifficulty) / 2))
          .toString('hex')
          .slice(0, 32 - this.config.challengeDifficulty)
      ]
    );

    // Create challenge token (SHA256 hash of challenge data)
    const challengeString = JSON.stringify(challenge);
    const token = crypto.createHash('sha256').update(challengeString).digest('hex');
    
    const expires = Date.now() + this.config.challengeExpiresMs;

    const challengeData: ChallengeData = {
      challenge,
      expires,
      token
    };

    // Store challenge for later validation
    this.challenges.set(token, challengeData);

    return challengeData;
  }

  /**
   * Redeems a challenge solution in exchange for a JWT
   * @param solution - The solution containing token and solved challenges
   * @returns Redemption response with success status and JWT if successful
   */
  redeemChallenge(solution: Solution): RedemptionResponse {
    if (!solution.token || !solution.solutions) {
      return { success: false, message: 'Invalid solution format' };
    }

    this.cleanExpiredChallenges();

    // Find the challenge
    const challengeData = this.challenges.get(solution.token);
    if (!challengeData) {
      return { success: false, message: 'Challenge not found or expired' };
    }

    // Check if challenge has expired
    if (challengeData.expires < Date.now()) {
      this.challenges.delete(solution.token);
      return { success: false, message: 'Challenge expired' };
    }

    // Remove challenge (single use)
    this.challenges.delete(solution.token);

    // Validate all solutions
    const isValid = challengeData.challenge.every(([salt, target]) => {
      const solutionTuple = solution.solutions.find(([s, t]) => s === salt && t === target);
      if (!solutionTuple) {
        return false;
      }

      const [, , nonce] = solutionTuple;
      const hash = crypto.createHash('sha256')
        .update(salt + nonce.toString())
        .digest('hex');

      return hash.startsWith(target.substring(0, this.config.challengeDifficulty));
    });

    if (!isValid) {
      return { success: false, message: 'Invalid solution' };
    }

    // Generate JWT
    try {
      const payload = {
        type: 'wayn_pow',
        issued: Date.now(),
        challenge_token: solution.token
      };

      const jwtToken = jwt.sign(payload, this.config.secret, {
        expiresIn: this.config.jwtExpiresIn
      } as jwt.SignOptions);

      // Calculate expiration timestamp
      const decoded = jwt.decode(jwtToken) as any;
      const expires = decoded.exp * 1000; // Convert to milliseconds

      return {
        success: true,
        jwt: jwtToken,
        expires
      };
    } catch (error) {
      return { success: false, message: 'Failed to generate JWT' };
    }
  }

  /**
   * Validates a JWT token
   * @param token - The JWT token to validate
   * @returns True if the token is valid, false otherwise
   */
  validateToken(token: string): boolean {
    try {
      const decoded = jwt.verify(token, this.config.secret) as any;
      
      // Verify it's a wayn token
      if (decoded.type !== 'wayn_pow') {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired challenges from memory
   * @private
   */
  private cleanExpiredChallenges(): void {
    const now = Date.now();
    for (const [token, challengeData] of this.challenges.entries()) {
      if (challengeData.expires < now) {
        this.challenges.delete(token);
      }
    }
  }
}