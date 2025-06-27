# Examples

## Express.js Usage

```javascript
const express = require('express');
const { createCheckpoint } = require('@usewayn/checkpoint');

const app = express();

// Apply checkpoint middleware to all routes
app.use(createCheckpoint({
  secret: 'your-secret-key-here',
  questionCount: 5,
  questionHardness: 5,
  jwtTtlHours: 24,
  apiEndpoint: '/__wayn_checkpoint',
  debug: true,
  excludePaths: ['/health', '/static/*']
}));

// Your protected routes
app.get('/', (req, res) => {
  res.send('Hello, verified human!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## TypeScript Express Usage

```typescript
import express from 'express';
import { createCheckpoint, CheckpointConfig } from '@usewayn/checkpoint';

const app = express();

const checkpointConfig: CheckpointConfig = {
  secret: process.env.WAYN_SECRET || 'your-secret-key-here',
  questionCount: 5,
  questionHardness: 5,
  jwtTtlHours: 24,
  apiEndpoint: '/__wayn_checkpoint',
  debug: process.env.NODE_ENV !== 'production',
  excludePaths: ['/health', '/api/status', '/static/*'],
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5
  }
};

app.use(createCheckpoint(checkpointConfig));

app.get('/', (req, res) => {
  res.send('Hello, verified human!');
});

app.listen(3000);
```

## React Usage with HOC

```tsx
import React from 'react';
import { withCheckpoint } from '@usewayn/checkpoint';

const MyApp: React.FC = () => {
  return (
    <div>
      <h1>Protected React App</h1>
      <p>This content is only visible to verified users.</p>
    </div>
  );
};

export default withCheckpoint(MyApp, {
  config: {
    questionCount: 5,
    questionHardness: 5,
    jwtTtlHours: 24,
    apiEndpoint: '/__wayn_checkpoint'
  }
});
```

## React Usage with Provider

```tsx
import React from 'react';
import { CheckpointProvider } from '@usewayn/checkpoint';

const App: React.FC = () => {
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
        <h1>Protected React App</h1>
        <p>This content is only visible to verified users.</p>
      </div>
    </CheckpointProvider>
  );
};

export default App;
```

## React Usage with Hook

```tsx
import React from 'react';
import { useCheckpoint } from '@usewayn/checkpoint';

const MyComponent: React.FC = () => {
  const { isVerified, isLoading, error } = useCheckpoint({
    questionCount: 5,
    questionHardness: 5,
    jwtTtlHours: 24,
    apiEndpoint: '/__wayn_checkpoint'
  });

  if (isLoading) {
    return <div>Checking verification...</div>;
  }

  if (!isVerified) {
    return <div>Please complete verification first.</div>;
  }

  return (
    <div>
      <h1>Verified Content</h1>
      <p>You are verified!</p>
    </div>
  );
};

export default MyComponent;
```

## Advanced Configuration

```typescript
import { createCheckpoint } from '@usewayn/checkpoint';

const checkpoint = createCheckpoint({
  secret: process.env.WAYN_SECRET!,
  
  // Challenge configuration
  questionCount: 10,        // More questions = higher security
  questionHardness: 7,      // Higher difficulty = more computation required
  
  // JWT configuration
  jwtTtlHours: 1,          // Shorter TTL = more frequent verification
  
  // Custom paths
  apiEndpoint: '/security/checkpoint',
  
  // Rate limiting
  rateLimit: {
    windowMs: 10 * 60 * 1000,  // 10 minutes
    maxAttempts: 3             // Only 3 attempts per window
  },
  
  // Exclude certain paths
  excludePaths: [
    '/health',
    '/metrics',
    '/static/*',
    '/api/public/*'
  ],
  
  // Custom template
  customTemplate: `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Custom Security Check</title>
        <!-- Your custom styles -->
      </head>
      <body>
        <!-- Your custom checkpoint page -->
        <div id="wayn-challenge-container"></div>
        <!-- Required scripts -->
        <script>/* checkpoint logic */</script>
      </body>
    </html>
  `,
  
  // Debug logging
  debug: true
});
```
