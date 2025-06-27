# Wayn Checkpoint

[![npm version](https://badge.fury.io/js/@usewayn%2Fcheckpoint.svg)](https://badge.fury.io/js/@usewayn%2Fcheckpoint)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)

DDOS protection middleware for Express.js and React applications using Proof-of-Work (PoW) challenges. Similar to Cloudflare's "Checking your browser" page, Wayn Checkpoint protects your applications from automated attacks and spam.

## Features

- 🛡️ **DDOS Protection**: Proof-of-Work challenges that are expensive for bots but easy for humans
- 🚀 **Easy Integration**: Works with Express.js and React applications
- ⚡ **Customizable**: Configurable difficulty, duration, and appearance
- 🔒 **Secure**: JWT-based verification with configurable expiration
- 📱 **Universal**: Works in all modern browsers
- 🎨 **Customizable UI**: Override the default checkpoint page template
- 🔧 **Rate Limiting**: Built-in rate limiting for additional protection

## Installation

```bash
npm install @usewayn/checkpoint
```

## Quick Start

### Express.js

```javascript
const express = require('express');
const { createCheckpoint } = require('@usewayn/checkpoint');

const app = express();

// Protect all routes with checkpoint
app.use(createCheckpoint({
  secret: 'your-secret-key-here',
  questionCount: 5,
  questionHardness: 5,
  jwtTtlHours: 24
}));

app.get('/', (req, res) => {
  res.send('Hello, verified human!');
});

app.listen(3000);
```

### React

```tsx
import React from 'react';
import { CheckpointProvider } from '@usewayn/checkpoint';

function App() {
  return (
    <CheckpointProvider
      config={{
        questionCount: 5,
        questionHardness: 5,
        jwtTtlHours: 24,
        apiEndpoint: '/__wayn_checkpoint'
      }}
    >
      <div>
        <h1>Protected App</h1>
        <p>Only verified users can see this content.</p>
      </div>
    </CheckpointProvider>
  );
}

export default App;
```

## How It Works

1. **Request Interception**: When a user visits your protected application, the middleware intercepts the request
2. **Token Check**: Checks for a valid verification token (JWT cookie)
3. **Challenge Page**: If no valid token exists, serves a PoW challenge page
4. **Proof-of-Work**: User's browser automatically solves computational puzzles
5. **Verification**: Solution is verified server-side and a JWT token is issued
6. **Access Granted**: User is redirected to the original destination with the verification token

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `secret` | `string` | **Required** | JWT secret key for signing tokens |
| `questionCount` | `number` | `5` | Number of PoW challenges to solve |
| `questionHardness` | `number` | `5` | Difficulty level (higher = more computation) |
| `jwtTtlHours` | `number` | `24` | JWT token validity in hours |
| `apiEndpoint` | `string` | `/__wayn_checkpoint` | API endpoint for challenges |
| `cookieName` | `string` | `__wayn-clarification` | Name of the verification cookie |
| `excludePaths` | `string[]` | `[]` | Paths to exclude from protection |
| `customTemplate` | `string` | `undefined` | Custom HTML template for checkpoint page |
| `debug` | `boolean` | `false` | Enable debug logging |
| `rateLimit` | `object` | See below | Rate limiting configuration |

### Rate Limiting Options

```typescript
rateLimit: {
  windowMs: 15 * 60 * 1000,  // Time window in milliseconds
  maxAttempts: 5             // Max attempts per window
}
```

## API Reference

### Express Middleware

#### `createCheckpoint(config: CheckpointConfig)`

Creates an Express middleware function that protects routes with PoW challenges.

```typescript
import { createCheckpoint } from '@usewayn/checkpoint';

const middleware = createCheckpoint({
  secret: 'your-secret-key',
  questionCount: 5,
  questionHardness: 5
});

app.use(middleware);
```

#### `WaynCheckpoint` Class

For more advanced usage, you can use the `WaynCheckpoint` class directly:

```typescript
import { WaynCheckpoint } from '@usewayn/checkpoint';

const checkpoint = new WaynCheckpoint({
  secret: 'your-secret-key',
  questionCount: 5,
  questionHardness: 5
});

app.use(checkpoint.middleware());
```

### React Components

#### `CheckpointProvider`

React context provider that protects child components:

```tsx
import { CheckpointProvider } from '@usewayn/checkpoint';

<CheckpointProvider config={config}>
  <App />
</CheckpointProvider>
```

#### `withCheckpoint(Component, config)`

Higher-order component that wraps a component with checkpoint protection:

```tsx
import { withCheckpoint } from '@usewayn/checkpoint';

const ProtectedApp = withCheckpoint(App, { config });
```

#### `useCheckpoint(config)`

React hook for checkpoint verification status:

```tsx
import { useCheckpoint } from '@usewayn/checkpoint';

function MyComponent() {
  const { isVerified, isLoading, error } = useCheckpoint(config);
  
  if (isLoading) return <div>Checking...</div>;
  if (!isVerified) return <div>Verification required</div>;
  
  return <div>Protected content</div>;
}
```

## Security Considerations

1. **Secret Key**: Use a strong, random secret key and keep it secure
2. **HTTPS**: Always use HTTPS in production to protect tokens in transit
3. **Rate Limiting**: Configure appropriate rate limits for your use case
4. **Difficulty Tuning**: Balance security vs. user experience when setting difficulty
5. **Token Expiration**: Set appropriate JWT expiration times

## Examples

See [examples.md](./examples.md) for more detailed usage examples.

## Architecture

Wayn Checkpoint consists of:

- **Server Component** (`@usewayn/server`): Generates and verifies PoW challenges
- **Widget Component** (`@usewayn/widget`): Browser-side PoW solver
- **Checkpoint Middleware**: Express middleware and React components

## Performance

- **Client Impact**: Minimal - challenges are solved using Web Workers
- **Server Impact**: Low - stateless verification with JWT tokens
- **Network**: Small overhead - only challenge data and solutions transmitted

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [`@usewayn/server`](../server) - Server-side PoW verification
- [`@usewayn/widget`](../widget) - Browser-side PoW solver widget

## Support

For support, please open an issue on GitHub or contact the maintainers.
