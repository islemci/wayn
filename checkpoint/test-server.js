const express = require('express');
const { createCheckpoint } = require('../dist');

const app = express();

// Test checkpoint middleware
app.use(createCheckpoint({
  secret: 'test-secret-key-for-development-only',
  questionCount: 3,
  questionHardness: 3,
  jwtTtlHours: 1,
  debug: true,
  excludePaths: ['/health', '/status']
}));

// Test routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', excluded: true });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Test App</title></head>
      <body>
        <h1>Welcome to Protected App!</h1>
        <p>If you can see this, you have successfully passed the Wayn Checkpoint.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

app.get('/api/data', (req, res) => {
  res.json({
    message: 'This is protected API data',
    timestamp: new Date().toISOString(),
    verified: true
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Try accessing the root page to see the checkpoint in action!');
});
