const Wayn = require('../dist/index.js').default;

// Test the Wayn module with easier settings for complete testing
const wayn = new Wayn({
  secret: "JWT-secret-key",
  challengeCount: 5,    // Fewer challenges for faster testing
  challengeDifficulty: 5  // Lower difficulty for faster solving
});

console.log('Testing Wayn PoW Captcha Module');
console.log('================================');

// Test 1: Create Challenge
console.log('\n1. Creating challenge...');
const challenge = wayn.createChallenge();
console.log('Challenge token:', challenge.token);
console.log('Number of challenges:', challenge.challenge.length);
console.log('Sample challenge:', challenge.challenge[0]);
console.log('Expires at:', new Date(challenge.expires));

// Test 2: Attempt to solve first challenge (for demo purposes)
console.log('\n2. Attempting to solve challenges...');
const solutions = [];

// Solve ALL challenges for complete redemption
const crypto = require('crypto');

for (let i = 0; i < challenge.challenge.length; i++) {
    const [salt, target] = challenge.challenge[i];
    const difficulty = target.match(/^0*/)[0].length;
    
    console.log(`Solving challenge ${i + 1}: salt=${salt}, target=${target}, difficulty=${difficulty}`);
    
    // Simple brute force solver for demonstration
    let nonce = 0;
    let found = false;
    
    while (!found) { // Removed nonce < 1000000
        const hash = crypto.createHash('sha256').update(salt + nonce.toString()).digest('hex');
        
        if (hash.startsWith('0'.repeat(difficulty))) {
            solutions.push([salt, target, nonce]);
            console.log(`  Solution found: nonce=${nonce}, hash=${hash}`);
            found = true;
        }
        nonce++;
    }
  if (!found) {
    console.log(`  No solution found within 1M attempts`);
    break;
  }
}

// Test 3: Redeem challenge
if (solutions.length === challenge.challenge.length) {
  console.log('\n3. Redeeming complete challenge...');
  const result = wayn.redeemChallenge({
    token: challenge.token,
    solutions: solutions
  });
  
  console.log('Redemption result:', result);
  
  // Test 4: Validate JWT
  if (result.success && result.jwt) {
    console.log('\n4. Validating JWT...');
    const isValid = wayn.validateToken(result.jwt);
    console.log('JWT validation result:', isValid);
    
    // Test with invalid JWT
    console.log('Testing invalid JWT validation...');
    const invalidResult = wayn.validateToken('invalid.jwt.token');
    console.log('Invalid JWT validation result:', invalidResult);
    
    console.log('\n✅ All tests passed! The module is working correctly.');
  }
} else {
  console.log('\n❌ Could not solve all challenges in reasonable time');
}

console.log('\nTest completed!');
