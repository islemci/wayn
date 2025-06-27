# @usewayn/server

A Proof of Work (PoW) captcha backend module that generates SHA256-based challenges, validates solutions, and issues JWTs for authentication.

## Features

- **PoW Challenge Generation**: Creates cryptographic challenges that require computational work to solve
- **JWT Integration**: Issues JSON Web Tokens upon successful challenge completion
- **Configurable Difficulty**: Adjustable challenge difficulty and parameters
- **Memory Efficient**: Automatic cleanup of expired challenges
- **TypeScript Support**: Full TypeScript definitions included

## Installation

```bash
npm install @usewayn/server
```

## Quick Start

```typescript
import Wayn from "@usewayn/server";

const wayn = new Wayn({
  secret: "your-jwt-secret-key"
});

// Generate a new challenge
const challenge = wayn.createChallenge();
console.log(challenge);

// Validate solutions and get JWT
const result = wayn.redeemChallenge({ token, solutions });
console.log(result);

// Validate JWT for future requests
const isValid = wayn.validateToken(jwt);
console.log(isValid);
```

## API Reference

### Constructor

```typescript
new Wayn(config: WaynConfig)
```

#### WaynConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `secret` | `string` | **required** | JWT secret key for signing tokens |
| `challengeCount` | `number` | `50` | Number of challenges per request |
| `challengeSize` | `number` | `32` | Size of challenge salt in bytes |
| `challengeDifficulty` | `number` | `4` | Number of leading zeros required |
| `challengeExpiresMs` | `number` | `600000` | Challenge expiration time (10 min) |
| `jwtExpiresIn` | `string` | `'1h'` | JWT expiration time |

### Methods

#### `createChallenge(): ChallengeData`

Generates a new PoW challenge.

**Returns:**
```typescript
{
  challenge: Array<[string, string]>, // [salt, target] tuples
  token: string,                      // Challenge identifier
  expires: number                     // Expiration timestamp
}
```

#### `redeemChallenge(solution: Solution): RedemptionResponse`

Validates challenge solutions and issues a JWT.

**Parameters:**
```typescript
{
  token: string,                           // Challenge token
  solutions: Array<[string, string, number]>  // [salt, target, nonce] tuples
}
```

**Returns:**
```typescript
{
  success: boolean,
  message?: string,  // Error message if unsuccessful
  jwt?: string,      // JWT token if successful
  expires?: number   // JWT expiration timestamp
}
```

#### `validateToken(token: string): boolean`

Validates a JWT token.

**Parameters:**
- `token`: JWT string to validate

**Returns:** `true` if valid, `false` otherwise

## Challenge Format

Each challenge consists of:
- **Salt**: Random hex string
- **Target**: Hex string with required leading zeros
- **Solution**: A nonce that, when combined with the salt and hashed with SHA256, produces a hash starting with the target's leading zeros

### Example Challenge
```javascript
{
  challenge: [
    ["fa45ffaf37b605332b14795ac5064732", "00a0e31dbea3f30b870070a746192cd8"]
  ],
  token: "22a69edc45bc516295a3080d3d4d5a9d1fd4c8167e0d402b5c5e6a7be8e1a073",
  expires: 1751045699638
}
```

To solve: Find a nonce where `SHA256(salt + nonce)` starts with `00` (2 leading zeros).

## Security Considerations

- Use a strong, unique JWT secret in production
- Set appropriate challenge difficulty based on your security requirements
- Consider rate limiting challenge generation
- Challenges are single-use and automatically expire

## Example Integration

```typescript
import express from 'express';
import Wayn from '@usewayn/server';

const app = express();
const wayn = new Wayn({ secret: process.env.JWT_SECRET });

// Generate challenge endpoint
app.get('/challenge', (req, res) => {
  const challenge = wayn.createChallenge();
  res.json(challenge);
});

// Submit solution endpoint
app.post('/verify', (req, res) => {
  const { token, solutions } = req.body;
  const result = wayn.redeemChallenge({ token, solutions });
  res.json(result);
});

// Protected endpoint
app.get('/protected', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !wayn.validateToken(token)) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  res.json({ message: 'Access granted' });
});
```

## License

AGPL-3.0
