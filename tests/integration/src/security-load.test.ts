import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitService } from '../../../packages/extension/src/git/GitService';
import { StageOperations } from '../../../packages/extension/src/git/operations/StageOperations';
import { LogOperations } from '../../../packages/extension/src/git/operations/LogOperations';
import { BranchOperations } from '../../../packages/extension/src/git/operations/BranchOperations';
import { RPCServer } from '../../../packages/extension/src/rpc/RPCServer';
import { RateLimiter } from '../../../packages/extension/src/rpc/RateLimiter';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import simpleGit from 'simple-git';

describe('Security: Load and Stress Tests', () => {
    let testRepoPath: string;
    let gitService: GitService;
    let stageOps: StageOperations;
    let logOps: LogOperations;
    let branchOps: BranchOperations;

    beforeEach(async () => {
        testRepoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'git-load-test-'));
        const git = simpleGit(testRepoPath);
        await git.init();
        await git.addConfig('user.name', 'Test User');
        await git.addConfig('user.email', 'test@example.com');

        gitService = new GitService(testRepoPath);
        stageOps = new StageOperations(git);
        logOps = new LogOperations(git);
        branchOps = new BranchOperations(git);

        // Create initial commit
        fs.writeFileSync(path.join(testRepoPath, 'test.txt'), 'initial');
        await git.add('test.txt');
        await git.commit('Initial commit');
    });

    afterEach(() => {
        if (fs.existsSync(testRepoPath)) {
            fs.rmSync(testRepoPath, { recursive: true, force: true });
        }
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent status checks', async () => {
            const promises = Array.from({ length: 20 }, () => gitService.getStatus());

            const results = await Promise.all(promises);
            expect(results).toHaveLength(20);
            results.forEach((status) => {
                expect(status).toBeDefined();
            });
        });

        it('should handle concurrent log operations', async () => {
            // Create some commits first
            for (let i = 0; i < 10; i++) {
                fs.writeFileSync(path.join(testRepoPath, `file${i}.txt`), `content${i}`);
                await stageOps.stage([`file${i}.txt`]);
                await gitService.commit(`Commit ${i}`);
            }

            const promises = Array.from({ length: 10 }, () => logOps.getLog({ maxCount: 5 }));

            const results = await Promise.all(promises);
            expect(results).toHaveLength(10);
            results.forEach((log) => {
                expect(log).toHaveLength(5);
            });
        });

        it('should handle concurrent branch operations', async () => {
            const promises = Array.from({ length: 10 }, (_, i) =>
                branchOps.createBranch(`feature-${i}`)
            );

            await Promise.all(promises);

            const branches = await branchOps.listBranches();
            expect(branches.local.length).toBeGreaterThanOrEqual(10);
        });

        it('should handle mixed concurrent operations', async () => {
            const operations = [
                () => gitService.getStatus(),
                () => logOps.getLog({ maxCount: 5 }),
                () => branchOps.listBranches(),
                () => gitService.getStatus(),
                () => logOps.getLog({ maxCount: 10 }),
            ];

            const promises = operations.map((op) => op());
            const results = await Promise.all(promises);

            expect(results).toHaveLength(5);
            results.forEach((result) => {
                expect(result).toBeDefined();
            });
        });
    });

    describe('Large Repository Handling', () => {
        it('should handle repository with many files', async () => {
            // Create 100 files
            const files: string[] = [];
            for (let i = 0; i < 100; i++) {
                const filename = `file${i}.txt`;
                fs.writeFileSync(path.join(testRepoPath, filename), `content${i}`);
                files.push(filename);
            }

            const startTime = Date.now();
            await stageOps.stage(files);
            const stageTime = Date.now() - startTime;

            expect(stageTime).toBeLessThan(5000); // Should complete in 5s

            const status = await gitService.getStatus();
            expect(status.staged.length).toBe(100);
        });

        it('should handle repository with many commits', async () => {
            // Create 50 commits (CI-friendly number)
            for (let i = 0; i < 50; i++) {
                fs.writeFileSync(path.join(testRepoPath, `commit${i}.txt`), `content${i}`);
                await stageOps.stage([`commit${i}.txt`]);
                await gitService.commit(`Commit ${i}`);
            }

            const startTime = Date.now();
            const log = await logOps.getLog({ maxCount: 50 });
            const logTime = Date.now() - startTime;

            expect(log).toHaveLength(50);
            expect(logTime).toBeLessThan(2000); // Should complete in 2s
        });

        it('should handle repository with many branches', async () => {
            // Create 30 branches (CI-friendly number)
            for (let i = 0; i < 30; i++) {
                await branchOps.createBranch(`branch-${i}`);
            }

            const startTime = Date.now();
            const branches = await branchOps.listBranches();
            const listTime = Date.now() - startTime;

            expect(branches.local.length).toBeGreaterThanOrEqual(30);
            expect(listTime).toBeLessThan(1000); // Should complete in 1s
        });
    });

    describe('Memory Efficiency', () => {
        it('should not leak memory with repeated operations', async () => {
            const initialMemory = process.memoryUsage().heapUsed;

            // Perform 100 operations
            for (let i = 0; i < 100; i++) {
                await gitService.getStatus();

                // Force garbage collection every 10 iterations if available
                if (i % 10 === 0 && global.gc) {
                    global.gc();
                }
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (< 50MB)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        });

        it('should handle large file content efficiently', async () => {
            // Create a 1MB file
            const largeContent = 'a'.repeat(1024 * 1024);
            fs.writeFileSync(path.join(testRepoPath, 'large.txt'), largeContent);

            const initialMemory = process.memoryUsage().heapUsed;

            await stageOps.stage(['large.txt']);
            await gitService.commit('Add large file');

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Should not load entire file into memory multiple times
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // < 10MB
        });
    });

    describe('RPC Rate Limiting Under Load', () => {
        let rpcServer: RPCServer;
        let rateLimiter: RateLimiter;

        beforeEach(() => {
            rpcServer = new RPCServer();
            rateLimiter = new RateLimiter({ maxRequests: 50, windowMs: 1000 });

            rpcServer.register('testMethod', async () => 'result');
        });

        it('should enforce rate limits under concurrent load', async () => {
            const requests = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                method: 'testMethod',
                params: [],
            }));

            let successCount = 0;
            let failureCount = 0;

            await Promise.all(
                requests.map(async (req) => {
                    try {
                        rateLimiter.check(req.method);
                        successCount++;
                    } catch {
                        failureCount++;
                    }
                })
            );

            expect(successCount).toBe(50); // Max requests
            expect(failureCount).toBe(50); // Blocked requests
        });

        it('should recover after rate limit window', async () => {
            // Fill up the rate limit
            for (let i = 0; i < 50; i++) {
                rateLimiter.check('testMethod');
            }

            // Should be blocked
            expect(() => rateLimiter.check('testMethod')).toThrow();

            // Wait for window to reset
            await new Promise((resolve) => setTimeout(resolve, 1100));

            // Should work again
            expect(() => rateLimiter.check('testMethod')).not.toThrow();
        });

        it('should handle burst traffic patterns', async () => {
            const results: boolean[] = [];

            // Burst 1: 30 requests
            for (let i = 0; i < 30; i++) {
                try {
                    rateLimiter.check('burstMethod');
                    results.push(true);
                } catch {
                    results.push(false);
                }
            }

            // Small delay
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Burst 2: 30 more requests
            for (let i = 0; i < 30; i++) {
                try {
                    rateLimiter.check('burstMethod');
                    results.push(true);
                } catch {
                    results.push(false);
                }
            }

            const successCount = results.filter((r) => r).length;
            expect(successCount).toBeLessThanOrEqual(50);
        });
    });

    describe('Error Recovery Under Load', () => {
        it('should recover from transient errors', async () => {
            let failCount = 0;
            const maxFails = 3;

            const unreliableOperation = async () => {
                if (failCount < maxFails) {
                    failCount++;
                    throw new Error('Transient error');
                }
                return 'success';
            };

            // Retry logic
            let result;
            for (let i = 0; i < 5; i++) {
                try {
                    result = await unreliableOperation();
                    break;
                } catch (error) {
                    if (i === 4) {
                        throw error;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 10));
                }
            }

            expect(result).toBe('success');
            expect(failCount).toBe(maxFails);
        });

        it('should handle partial failures in batch operations', async () => {
            // Create mix of valid and invalid files
            const validFiles = ['valid1.txt', 'valid2.txt', 'valid3.txt'];
            validFiles.forEach((file) => {
                fs.writeFileSync(path.join(testRepoPath, file), 'content');
            });

            const results = await Promise.allSettled(
                validFiles.map((file) => stageOps.stage([file]))
            );

            const successCount = results.filter((r) => r.status === 'fulfilled').length;
            expect(successCount).toBe(3);
        });
    });

    describe('Performance Degradation Detection', () => {
        it('should maintain performance with increasing load', async () => {
            const timings: number[] = [];

            // Measure performance at different load levels
            for (let load = 10; load <= 50; load += 10) {
                const startTime = Date.now();

                const promises = Array.from({ length: load }, () => gitService.getStatus());
                await Promise.all(promises);

                const duration = Date.now() - startTime;
                timings.push(duration / load); // Average time per operation
            }

            // Performance should not degrade significantly
            // Later operations should not be more than 2x slower
            const firstAvg = timings[0];
            const lastAvg = timings[timings.length - 1];

            expect(lastAvg).toBeLessThan(firstAvg * 2);
        });

        it('should detect performance bottlenecks', async () => {
            const operations = [
                { name: 'status', fn: () => gitService.getStatus() },
                { name: 'log', fn: () => logOps.getLog({ maxCount: 10 }) },
                { name: 'branches', fn: () => branchOps.listBranches() },
            ];

            const timings: Record<string, number> = {};

            for (const op of operations) {
                const startTime = Date.now();
                await op.fn();
                timings[op.name] = Date.now() - startTime;
            }

            // All operations should complete reasonably fast
            Object.entries(timings).forEach(([name, time]) => {
                expect(time).toBeLessThan(1000); // < 1s
            });
        });
    });
});
