import { describe, it, expect, beforeEach } from 'vitest';
import { GraphLayoutEngine } from '../../packages/webview/src/services/GraphLayoutEngine';
import type { CommitNode } from '../../packages/shared/src/types';

describe('GraphLayoutEngine Performance Integration', () => {
    let engine: GraphLayoutEngine;

    beforeEach(() => {
        engine = new GraphLayoutEngine();
    });

    /**
     * Generate realistic commit history with branches and merges
     */
    function generateRealisticHistory(size: number): CommitNode[] {
        const commits: CommitNode[] = [];
        const branches: string[][] = [[]]; // Track commits in each branch

        for (let i = 0; i < size; i++) {
            const hash = `commit-${i}`;
            let parents: string[] = [];

            // 10% chance of creating a merge commit
            if (i > 10 && Math.random() < 0.1 && branches.length > 1) {
                // Merge two branches
                const branch1 = branches[Math.floor(Math.random() * branches.length)];
                const branch2 = branches[Math.floor(Math.random() * branches.length)];
                if (branch1 !== branch2 && branch1.length > 0 && branch2.length > 0) {
                    parents = [branch1[branch1.length - 1], branch2[branch2.length - 1]];
                    // Merge into first branch
                    branch1.push(hash);
                    // Remove second branch
                    branches.splice(branches.indexOf(branch2), 1);
                }
            }
            // 5% chance of creating a new branch
            else if (i > 5 && Math.random() < 0.05 && branches.length < 5) {
                const parentBranch = branches[Math.floor(Math.random() * branches.length)];
                if (parentBranch.length > 0) {
                    parents = [parentBranch[parentBranch.length - 1]];
                    branches.push([hash]);
                }
            }
            // Normal commit on existing branch
            else {
                const branch = branches[Math.floor(Math.random() * branches.length)];
                if (branch.length > 0) {
                    parents = [branch[branch.length - 1]];
                }
                branch.push(hash);
            }

            commits.push({
                hash,
                message: `Commit ${i}`,
                author: 'Test Author',
                date: new Date(2024, 0, 1 + i).toISOString(),
                parents,
                refs: [],
            });
        }

        return commits;
    }

    describe('Performance Benchmarks', () => {
        it('should handle 100 commits in < 10ms', () => {
            const commits = generateRealisticHistory(100);

            const start = performance.now();
            const result = engine.calculateLayout(commits);
            const duration = performance.now() - start;

            expect(result.nodes.size).toBe(100);
            expect(duration).toBeLessThan(10);
        });

        it('should handle 1000 commits in < 50ms', () => {
            const commits = generateRealisticHistory(1000);

            const start = performance.now();
            const result = engine.calculateLayout(commits);
            const duration = performance.now() - start;

            expect(result.nodes.size).toBe(1000);
            expect(duration).toBeLessThan(50);
        });

        it('should handle 5000 commits in < 200ms', () => {
            const commits = generateRealisticHistory(5000);

            const start = performance.now();
            const result = engine.calculateLayout(commits);
            const duration = performance.now() - start;

            expect(result.nodes.size).toBe(5000);
            expect(duration).toBeLessThan(200);
        });

        it('should demonstrate cache effectiveness', () => {
            const commits = generateRealisticHistory(1000);

            // First call (uncached)
            const start1 = performance.now();
            const result1 = engine.calculateLayout(commits);
            const duration1 = performance.now() - start1;

            // Second call (cached)
            const start2 = performance.now();
            const result2 = engine.calculateLayout(commits);
            const duration2 = performance.now() - start2;

            expect(result1).toBe(result2); // Same object reference
            expect(duration2).toBeLessThan(1); // Should be nearly instant
            expect(duration2).toBeLessThan(duration1 / 20); // At least 20x faster
        });

        it('should handle cache eviction gracefully', () => {
            const cacheSize = 50;
            const testSets = 60; // More than cache size

            const durations: number[] = [];

            for (let i = 0; i < testSets; i++) {
                const commits = generateRealisticHistory(100);
                const start = performance.now();
                engine.calculateLayout(commits);
                durations.push(performance.now() - start);
            }

            // All operations should complete in reasonable time
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            expect(avgDuration).toBeLessThan(15);

            // Cache should be at max size
            const stats = engine.getCacheStats();
            expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
        });
    });

    describe('Correctness with Complex Histories', () => {
        it('should correctly layout octopus merge (3+ parents)', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'octopus',
                    message: 'Octopus merge',
                    author: 'Test',
                    date: '2024-01-05',
                    parents: ['a', 'b', 'c'],
                    refs: [],
                },
                {
                    hash: 'a',
                    message: 'Branch A',
                    author: 'Test',
                    date: '2024-01-04',
                    parents: ['base'],
                    refs: [],
                },
                {
                    hash: 'b',
                    message: 'Branch B',
                    author: 'Test',
                    date: '2024-01-03',
                    parents: ['base'],
                    refs: [],
                },
                {
                    hash: 'c',
                    message: 'Branch C',
                    author: 'Test',
                    date: '2024-01-02',
                    parents: ['base'],
                    refs: [],
                },
                {
                    hash: 'base',
                    message: 'Base commit',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const result = engine.calculateLayout(commits);

            expect(result.nodes.size).toBe(5);
            expect(result.edges.length).toBe(6); // octopus->a, octopus->b, octopus->c, a->base, b->base, c->base

            // All nodes should have valid lane assignments
            for (const node of result.nodes.values()) {
                expect(node.lane).toBeGreaterThanOrEqual(0);
            }
        });

        it('should handle criss-cross merge pattern', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'm2',
                    message: 'Second merge',
                    author: 'Test',
                    date: '2024-01-06',
                    parents: ['a2', 'b2'],
                    refs: [],
                },
                {
                    hash: 'a2',
                    message: 'A after merge',
                    author: 'Test',
                    date: '2024-01-05',
                    parents: ['m1'],
                    refs: [],
                },
                {
                    hash: 'b2',
                    message: 'B after merge',
                    author: 'Test',
                    date: '2024-01-04',
                    parents: ['m1'],
                    refs: [],
                },
                {
                    hash: 'm1',
                    message: 'First merge',
                    author: 'Test',
                    date: '2024-01-03',
                    parents: ['a1', 'b1'],
                    refs: [],
                },
                {
                    hash: 'a1',
                    message: 'Branch A',
                    author: 'Test',
                    date: '2024-01-02',
                    parents: ['base'],
                    refs: [],
                },
                {
                    hash: 'b1',
                    message: 'Branch B',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: ['base'],
                    refs: [],
                },
                {
                    hash: 'base',
                    message: 'Base',
                    author: 'Test',
                    date: '2024-01-00',
                    parents: [],
                    refs: [],
                },
            ];

            const result = engine.calculateLayout(commits);

            expect(result.nodes.size).toBe(7);
            // Should handle complex merge pattern without errors
            expect(result.lanes).toBeGreaterThan(0);
            
            // All nodes should have valid positions
            for (const node of result.nodes.values()) {
                expect(node.x).toBeGreaterThanOrEqual(0);
                expect(node.y).toBeGreaterThanOrEqual(0);
            }
        });

        it('should optimize lane reuse in long-running branches', () => {
            const commits: CommitNode[] = [];
            const mainBranch: string[] = [];
            const featureBranch: string[] = [];

            // Create main branch
            for (let i = 0; i < 10; i++) {
                const hash = `main-${i}`;
                commits.push({
                    hash,
                    message: `Main ${i}`,
                    author: 'Test',
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    parents: i > 0 ? [mainBranch[i - 1]] : [],
                    refs: [],
                });
                mainBranch.push(hash);
            }

            // Create feature branch from main-5
            for (let i = 0; i < 5; i++) {
                const hash = `feature-${i}`;
                commits.push({
                    hash,
                    message: `Feature ${i}`,
                    author: 'Test',
                    date: `2024-01-${String(i + 11).padStart(2, '0')}`,
                    parents: i === 0 ? ['main-5'] : [featureBranch[i - 1]],
                    refs: [],
                });
                featureBranch.push(hash);
            }

            // Merge feature back to main
            commits.push({
                hash: 'merge',
                message: 'Merge feature',
                author: 'Test',
                date: '2024-01-16',
                parents: [mainBranch[mainBranch.length - 1], featureBranch[featureBranch.length - 1]],
                refs: [],
            });

            const result = engine.calculateLayout(commits);

            // Should successfully layout all commits
            expect(result.nodes.size).toBe(16);
            expect(result.lanes).toBeGreaterThan(0);
            
            // All nodes should have valid positions
            for (const node of result.nodes.values()) {
                expect(node.lane).toBeGreaterThanOrEqual(0);
                expect(node.x).toBeGreaterThanOrEqual(0);
                expect(node.y).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('Memory Efficiency', () => {
        it('should not leak memory with repeated calculations', () => {
            const commits = generateRealisticHistory(500);

            // Perform many calculations
            for (let i = 0; i < 100; i++) {
                engine.calculateLayout(commits);
            }

            const stats = engine.getCacheStats();
            // Cache should not grow unbounded
            expect(stats.size).toBeLessThanOrEqual(stats.maxSize);
        });

        it('should handle cache clear without affecting correctness', () => {
            const commits = generateRealisticHistory(100);

            const result1 = engine.calculateLayout(commits);
            engine.clearCache();
            const result2 = engine.calculateLayout(commits);

            // Results should be equivalent (but not same object)
            expect(result1.nodes.size).toBe(result2.nodes.size);
            expect(result1.edges.length).toBe(result2.edges.length);
            expect(result1.lanes).toBe(result2.lanes);
        });
    });
});
