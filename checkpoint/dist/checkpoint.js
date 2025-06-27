"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaynCheckpoint = void 0;
exports.createCheckpoint = createCheckpoint;
const server_1 = __importDefault(require("@usewayn/server"));
const template_1 = require("./template");
/**
 * Wayn Checkpoint - DDOS protection middleware
 */
class WaynCheckpoint {
    constructor(config) {
        this.rateLimitMap = new Map();
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
        this.waynServer = new server_1.default({
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
    middleware() {
        return (req, res, next) => {
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
    handleApiRequest(req, res) {
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
    handleChallengeRequest(req, res) {
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
            const response = {
                success: true,
                challenge: challengeData.challenge,
                token: challengeData.token
            };
            this.log('Challenge generated', { token: challengeData.token });
            res.json(response);
        }
        catch (error) {
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
    handleVerifyRequest(req, res) {
        try {
            if (req.method !== 'POST') {
                res.status(405).json({ success: false, message: 'Method not allowed' });
                return;
            }
            const solution = req.body;
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
                const response = {
                    success: true,
                    jwt: redemptionResult.jwt,
                    expires: redemptionResult.expires
                };
                this.log('Challenge verified successfully', {
                    token: solution.token,
                    ip: this.getClientIp(req)
                });
                res.json(response);
            }
            else {
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
        }
        catch (error) {
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
    handleStatusRequest(req, res) {
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
        }
        catch (error) {
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
    serveCheckpointPage(res) {
        const template = this.config.customTemplate || template_1.DEFAULT_TEMPLATE;
        const html = (0, template_1.renderTemplate)(template, this.config.apiEndpoint, this.config.jwtTtlHours, this.config.cookieName, this.config.questionCount, this.config.questionHardness);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.status(200).send(html);
    }
    /**
     * Get clearance token from request
     */
    getClearanceToken(req) {
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
    validateClearanceToken(token) {
        try {
            return this.waynServer.validateToken(token);
        }
        catch (error) {
            this.log('Token validation error', error);
            return false;
        }
    }
    /**
     * Check if path should be excluded from checkpoint
     */
    isExcludedPath(path) {
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
    checkRateLimit(req) {
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
    sendRateLimitResponse(res) {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
        });
    }
    /**
     * Get client IP address
     */
    getClientIp(req) {
        return (req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            'unknown');
    }
    /**
     * Clean old rate limit entries
     */
    cleanOldRateLimitEntries(windowStart) {
        for (const [ip, entry] of this.rateLimitMap.entries()) {
            if (entry.windowStart < windowStart) {
                this.rateLimitMap.delete(ip);
            }
        }
    }
    /**
     * Logging utility
     */
    log(message, data) {
        if (this.config.debug) {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] Wayn Checkpoint: ${message}`, data || '');
        }
    }
}
exports.WaynCheckpoint = WaynCheckpoint;
/**
 * Factory function to create checkpoint middleware
 */
function createCheckpoint(config) {
    const checkpoint = new WaynCheckpoint(config);
    return checkpoint.middleware();
}
/**
 * Default export
 */
exports.default = createCheckpoint;
//# sourceMappingURL=checkpoint.js.map