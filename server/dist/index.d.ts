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
    private config;
    private challenges;
    constructor(config: WaynConfig);
    /**
     * Creates a new PoW challenge
     * @returns Challenge data with token and challenge array
     */
    createChallenge(): ChallengeData;
    /**
     * Redeems a challenge solution in exchange for a JWT
     * @param solution - The solution containing token and solved challenges
     * @returns Redemption response with success status and JWT if successful
     */
    redeemChallenge(solution: Solution): RedemptionResponse;
    /**
     * Validates a JWT token
     * @param token - The JWT token to validate
     * @returns True if the token is valid, false otherwise
     */
    validateToken(token: string): boolean;
    /**
     * Clean up expired challenges from memory
     * @private
     */
    private cleanExpiredChallenges;
}
