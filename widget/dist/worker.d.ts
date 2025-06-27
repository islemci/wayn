import { WaynChallenge } from './types';
/**
 * Creates a Web Worker for solving PoW challenges
 */
export declare function createWorker(): Worker;
/**
 * Solves PoW challenges using Web Workers
 */
export declare function solveChallenges(challenges: WaynChallenge[], workerCount?: number, onProgress?: (progress: number) => void, wasmUrl?: string): Promise<Array<[string, number, number]>>;
//# sourceMappingURL=worker.d.ts.map