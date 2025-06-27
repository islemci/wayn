/**
 * Creates a Web Worker for solving PoW challenges
 */
export function createWorker() {
    const workerScript = `
    // PoW Worker for Wayn CAPTCHA
    let wasmModule = null;
    
    async function loadWasm(wasmUrl) {
      if (wasmModule) return wasmModule;
      
      try {
        // Import the WASM module
        const wasmImport = await import(wasmUrl);
        await wasmImport.default();
        wasmModule = wasmImport;
        return wasmModule;
      } catch (error) {
        console.error('Failed to load WASM:', error);
        throw error;
      }
    }
    
    async function solveChallenge(salt, target) {
      let nonce = 0;
      const maxIterations = 1000000; // Prevent infinite loops
      
      // Simple PoW implementation (you'll need to replace this with your actual WASM implementation)
      while (nonce < maxIterations) {
        const input = salt + nonce.toString();
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
        const hashArray = new Uint8Array(hash);
        
        // Check if hash meets target difficulty
        let leadingZeros = 0;
        for (let i = 0; i < hashArray.length; i++) {
          if (hashArray[i] === 0) {
            leadingZeros += 8;
          } else {
            leadingZeros += Math.clz32(hashArray[i]) - 24;
            break;
          }
        }
        
        if (leadingZeros >= target) {
          return nonce;
        }
        
        nonce++;
      }
      
      throw new Error('Failed to solve challenge within iteration limit');
    }
    
    self.onmessage = async function(e) {
      const { salt, target, wasmUrl } = e.data;
      
      try {
        if (wasmUrl) {
          await loadWasm(wasmUrl);
        }
        
        const nonce = await solveChallenge(salt, target);
        
        self.postMessage({
          found: true,
          nonce: nonce
        });
      } catch (error) {
        self.postMessage({
          found: false,
          error: error.message
        });
      }
    };
  `;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
}
/**
 * Solves PoW challenges using Web Workers
 */
export async function solveChallenges(challenges, workerCount = navigator.hardwareConcurrency || 4, onProgress, wasmUrl) {
    const workers = [];
    const results = [];
    let completed = 0;
    const total = challenges.length;
    // Create workers
    for (let i = 0; i < Math.min(workerCount, challenges.length); i++) {
        workers.push(createWorker());
    }
    const solveSingleChallenge = (challenge, workerId) => {
        return new Promise((resolve, reject) => {
            const worker = workers[workerId];
            const timeout = setTimeout(() => {
                worker.terminate();
                workers[workerId] = createWorker();
                reject(new Error('Worker timeout'));
            }, 30000);
            worker.onmessage = (event) => {
                const { found, nonce, error } = event.data;
                clearTimeout(timeout);
                if (found) {
                    completed++;
                    const progress = Math.round((completed / total) * 100);
                    onProgress?.(progress);
                    resolve([challenge.salt, challenge.target, nonce]);
                }
                else {
                    reject(new Error(error || 'Failed to solve challenge'));
                }
            };
            worker.onerror = (error) => {
                clearTimeout(timeout);
                reject(new Error(`Worker error: ${error.message}`));
            };
            worker.postMessage({
                salt: challenge.salt,
                target: challenge.target,
                wasmUrl
            });
        });
    };
    try {
        // Process challenges in batches
        for (let i = 0; i < challenges.length; i += workers.length) {
            const batch = challenges.slice(i, i + workers.length);
            const batchResults = await Promise.all(batch.map((challenge, index) => solveSingleChallenge(challenge, index)));
            results.push(...batchResults);
        }
        return results;
    }
    finally {
        // Clean up workers
        workers.forEach(worker => {
            try {
                worker.terminate();
            }
            catch (error) {
                console.error('Error terminating worker:', error);
            }
        });
    }
}
//# sourceMappingURL=worker.js.map