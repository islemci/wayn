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
const crypto = __importStar(require("crypto"));
const jwt = __importStar(require("jsonwebtoken"));
/**
 * Wayn PoW captcha backend module
 */
class Wayn {
    constructor(config) {
        this.challenges = new Map();
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
    createChallenge() {
        this.cleanExpiredChallenges();
        // Generate challenge tuples
        const challenge = Array.from({ length: this.config.challengeCount }, () => [
            // Generate random salt
            crypto.randomBytes(Math.ceil(this.config.challengeSize / 2))
                .toString('hex')
                .slice(0, this.config.challengeSize),
            // Generate target (required leading zeros)
            '0'.repeat(this.config.challengeDifficulty) +
                crypto.randomBytes(Math.ceil((32 - this.config.challengeDifficulty) / 2))
                    .toString('hex')
                    .slice(0, 32 - this.config.challengeDifficulty)
        ]);
        // Create challenge token (SHA256 hash of challenge data)
        const challengeString = JSON.stringify(challenge);
        const token = crypto.createHash('sha256').update(challengeString).digest('hex');
        const expires = Date.now() + this.config.challengeExpiresMs;
        const challengeData = {
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
    redeemChallenge(solution) {
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
            });
            // Calculate expiration timestamp
            const decoded = jwt.decode(jwtToken);
            const expires = decoded.exp * 1000; // Convert to milliseconds
            return {
                success: true,
                jwt: jwtToken,
                expires
            };
        }
        catch (error) {
            return { success: false, message: 'Failed to generate JWT' };
        }
    }
    /**
     * Validates a JWT token
     * @param token - The JWT token to validate
     * @returns True if the token is valid, false otherwise
     */
    validateToken(token) {
        try {
            const decoded = jwt.verify(token, this.config.secret);
            // Verify it's a wayn token
            if (decoded.type !== 'wayn_pow') {
                return false;
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Clean up expired challenges from memory
     * @private
     */
    cleanExpiredChallenges() {
        const now = Date.now();
        for (const [token, challengeData] of this.challenges.entries()) {
            if (challengeData.expires < now) {
                this.challenges.delete(token);
            }
        }
    }
}
exports.default = Wayn;
