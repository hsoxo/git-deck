import { describe, it, expect, beforeEach } from 'vitest';
import { GraphLayoutEngine } from './GraphLayoutEngine';
import type { CommitNode } from '@git-deck/shared';

describe('GraphLayoutEngine', () => {
    let engine: GraphLayoutEngine;

    beforeEach(() => {
        engine = new GraphLayoutEngine();
    });

    describe('calculateLayout', () => {
        it('should return empty result for empty commits', () => {
            const result = engine.calculateLayout([]);
            expect(result.nodes.size).toBe(0);
            expect(result.edges.length).toBe(0);
            expect(result.lanes).toBe(0);
            expect(result.height).toBe(0);
        });

        it('should calculate layout for single commit', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'a1',
                    message: 'Initial commit',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const result = engine.calculateLayout(commits);
            expect(result.nodes.size).toBe(1);
            expect(result.edges.length).toBe(0);
            expect(result.lanes).toBe(1);
            expect(result.height).toBe(50);

            const node = result.nodes.get('a1');
            expect(node).toBeDefined();
            expect(node?.lane).toBe(0);
        });

        it('should calculate layout for linear history', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'c3',
                    message: 'Third commit',
                    author: 'Test',
                    date: '2024-01-03',
                    parents: ['c2'],
                    refs: [],
                },
                {
                    hash: 'c2',
                    message: 'Second commit',
                    author: 'Test',
                    date: '2024-01-02',
                    parents: ['c1'],
                    refs: [],
                },
                {
                    hash: 'c1',
                    message: 'First commit',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const result = engine.calculateLayout(commits);
            expect(result.nodes.size).toBe(3);
            expect(result.edges.length).toBe(2);
            expect(result.lanes).toBe(1);

            // All commits should be in the same lane
            expect(result.nodes.get('c1')?.lane).toBe(0);
            expect(result.nodes.get('c2')?.lane).toBe(0);
            expect(result.nodes.get('c3')?.lane).toBe(0);
        });

        it('should calculate layout for branching history', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'c4',
                    message: 'Merge branch',
                    author: 'Test',
                    date: '2024-01-04',
                    parents: ['c3', 'c2'],
                    refs: [],
                },
                {
                    hash: 'c3',
                    message: 'Branch commit',
                    author: 'Test',
                    date: '2024-01-03',
                    parents: ['c1'],
                    refs: [],
                },
                {
                    hash: 'c2',
                    message: 'Main commit',
                    author: 'Test',
                    date: '2024-01-02',
                    parents: ['c1'],
                    refs: [],
                },
                {
                    hash: 'c1',
                    message: 'Base commit',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const result = engine.calculateLayout(commits);
            expect(result.nodes.size).toBe(4);
            expect(result.edges.length).toBe(4); // c4->c3, c4->c2, c3->c1, c2->c1
            expect(result.lanes).toBeGreaterThan(0);

            // Verify all nodes have lane assignments
            for (const node of result.nodes.values()) {
                expect(node.lane).toBeGreaterThanOrEqual(0);
            }
        });

        it('should handle multiple parents correctly', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'merge',
                    message: 'Merge commit',
                    author: 'Test',
                    date: '2024-01-03',
                    parents: ['a', 'b'],
                    refs: [],
                },
                {
                    hash: 'a',
                    message: 'Commit A',
                    author: 'Test',
                    date: '2024-01-02',
                    parents: [],
                    refs: [],
                },
                {
                    hash: 'b',
                    message: 'Commit B',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const result = engine.calculateLayout(commits);
            expect(result.nodes.size).toBe(3);
            expect(result.edges.length).toBe(2); // merge->a, merge->b

            const mergeNode = result.nodes.get('merge');
            expect(mergeNode).toBeDefined();
        });
    });

    describe('caching', () => {
        it('should cache layout results', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'c1',
                    message: 'Test commit',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const result1 = engine.calculateLayout(commits);
            const result2 = engine.calculateLayout(commits);

            // Should return the same cached result
            expect(result1).toBe(result2);
        });

        it('should return different results for different commits', () => {
            const commits1: CommitNode[] = [
                {
                    hash: 'c1',
                    message: 'Test commit 1',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const commits2: CommitNode[] = [
                {
                    hash: 'c2',
                    message: 'Test commit 2',
                    author: 'Test',
                    date: '2024-01-02',
                    parents: [],
                    refs: [],
                },
            ];

            const result1 = engine.calculateLayout(commits1);
            const result2 = engine.calculateLayout(commits2);

            expect(result1).not.toBe(result2);
        });

        it('should clear cache', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'c1',
                    message: 'Test commit',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const result1 = engine.calculateLayout(commits);
            engine.clearCache();
            const result2 = engine.calculateLayout(commits);

            // Should recalculate after cache clear
            expect(result1).not.toBe(result2);
            expect(result1.nodes.size).toBe(result2.nodes.size);
        });

        it('should provide cache statistics', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'c1',
                    message: 'Test commit',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            engine.calculateLayout(commits);
            engine.calculateLayout(commits); // Cache hit

            const stats = engine.getCacheStats();
            expect(stats.size).toBe(1);
            expect(stats.maxSize).toBe(50);
            expect(stats.hitRate).toBeGreaterThan(0);
        });
    });

    describe('edge calculation', () => {
        it('should create edges between parent and child commits', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'c2',
                    message: 'Child commit',
                    author: 'Test',
                    date: '2024-01-02',
                    parents: ['c1'],
                    refs: [],
                },
                {
                    hash: 'c1',
                    message: 'Parent commit',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const result = engine.calculateLayout(commits);
            expect(result.edges.length).toBe(1);

            const edge = result.edges[0];
            expect(edge.from).toBe('c2');
            expect(edge.to).toBe('c1');
            expect(edge.path.length).toBeGreaterThan(0);
        });

        it('should create straight path for same-lane edges', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'c2',
                    message: 'Child commit',
                    author: 'Test',
                    date: '2024-01-02',
                    parents: ['c1'],
                    refs: [],
                },
                {
                    hash: 'c1',
                    message: 'Parent commit',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const result = engine.calculateLayout(commits);
            const edge = result.edges[0];

            // Same lane should have 2 points (straight line)
            expect(edge.path.length).toBe(2);
            expect(edge.path[0].x).toBe(edge.path[1].x);
        });

        it('should create curved path for cross-lane edges', () => {
            const commits: CommitNode[] = [
                {
                    hash: 'c3',
                    message: 'Merge commit',
                    author: 'Test',
                    date: '2024-01-03',
                    parents: ['c2', 'c1'],
                    refs: [],
                },
                {
                    hash: 'c2',
                    message: 'Branch commit',
                    author: 'Test',
                    date: '2024-01-02',
                    parents: [],
                    refs: [],
                },
                {
                    hash: 'c1',
                    message: 'Main commit',
                    author: 'Test',
                    date: '2024-01-01',
                    parents: [],
                    refs: [],
                },
            ];

            const result = engine.calculateLayout(commits);
            
            // Find cross-lane edge
            const crossLaneEdge = result.edges.find((edge) => {
                const fromNode = result.nodes.get(edge.from);
                const toNode = result.nodes.get(edge.to);
                return fromNode && toNode && fromNode.x !== toNode.x;
            });

            if (crossLaneEdge) {
                // Cross-lane should have 4 points (curved path)
                expect(crossLaneEdge.path.length).toBe(4);
            }
        });
    });

    describe('performance', () => {
        it('should handle 100 commits efficiently', () => {
            const commits: CommitNode[] = [];
            const count = 100;

            // Create linear history
            for (let i = 0; i < count; i++) {
                commits.push({
                    hash: `c${i}`,
                    message: `Commit ${i}`,
                    author: 'Test',
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    parents: i > 0 ? [`c${i - 1}`] : [],
                    refs: [],
                });
            }

            const start = performance.now();
            const result = engine.calculateLayout(commits);
            const duration = performance.now() - start;

            expect(result.nodes.size).toBe(count);
            expect(duration).toBeLessThan(20); // Should complete in < 20ms
        });

        it('should handle 1000 commits efficiently', () => {
            const commits: CommitNode[] = [];
            const count = 1000;

            // Create linear history
            for (let i = 0; i < count; i++) {
                commits.push({
                    hash: `c${i}`,
                    message: `Commit ${i}`,
                    author: 'Test',
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    parents: i > 0 ? [`c${i - 1}`] : [],
                    refs: [],
                });
            }

            const start = performance.now();
            const result = engine.calculateLayout(commits);
            const duration = performance.now() - start;

            expect(result.nodes.size).toBe(count);
            expect(duration).toBeLessThan(100); // Should complete in < 100ms
        });

        it('should handle 5000 commits efficiently', () => {
            const commits: CommitNode[] = [];
            const count = 5000;

            // Create linear history
            for (let i = 0; i < count; i++) {
                commits.push({
                    hash: `c${i}`,
                    message: `Commit ${i}`,
                    author: 'Test',
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    parents: i > 0 ? [`c${i - 1}`] : [],
                    refs: [],
                });
            }

            const start = performance.now();
            const result = engine.calculateLayout(commits);
            const duration = performance.now() - start;

            expect(result.nodes.size).toBe(count);
            expect(duration).toBeLessThan(500); // Should complete in < 500ms
        });

        it('should handle branching history with 1000 commits', () => {
            const commits: CommitNode[] = [];
            const count = 1000;

            // Create branching history (every 10th commit creates a branch)
            for (let i = 0; i < count; i++) {
                const parents: string[] = [];
                if (i > 0) {
                    parents.push(`c${i - 1}`);
                    // Create merge commits every 10 commits
                    if (i % 10 === 0 && i > 10) {
                        parents.push(`c${i - 10}`);
                    }
                }

                commits.push({
                    hash: `c${i}`,
                    message: `Commit ${i}`,
                    author: 'Test',
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    parents,
                    refs: [],
                });
            }

            const start = performance.now();
            const result = engine.calculateLayout(commits);
            const duration = performance.now() - start;

            expect(result.nodes.size).toBe(count);
            expect(duration).toBeLessThan(150); // Branching is slightly slower
        });

        it('should benefit from caching on repeated calls', () => {
            const commits: CommitNode[] = [];
            for (let i = 0; i < 100; i++) {
                commits.push({
                    hash: `c${i}`,
                    message: `Commit ${i}`,
                    author: 'Test',
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    parents: i > 0 ? [`c${i - 1}`] : [],
                    refs: [],
                });
            }

            // First call (uncached)
            const start1 = performance.now();
            engine.calculateLayout(commits);
            const duration1 = performance.now() - start1;

            // Second call (cached)
            const start2 = performance.now();
            engine.calculateLayout(commits);
            const duration2 = performance.now() - start2;

            // Cached call should be significantly faster
            expect(duration2).toBeLessThan(duration1 / 10);
        });

        it('should have O(n) complexity for buildChildrenMap', () => {
            const sizes = [100, 500, 1000];
            const durations: number[] = [];

            for (const size of sizes) {
                const commits: CommitNode[] = [];
                for (let i = 0; i < size; i++) {
                    commits.push({
                        hash: `c${i}`,
                        message: `Commit ${i}`,
                        author: 'Test',
                        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                        parents: i > 0 ? [`c${i - 1}`] : [],
                        refs: [],
                    });
                }

                engine.clearCache();
                const start = performance.now();
                engine.calculateLayout(commits);
                durations.push(performance.now() - start);
            }

            // Check that complexity is roughly linear
            // duration[1] / duration[0] should be close to sizes[1] / sizes[0]
            const ratio1 = durations[1] / durations[0];
            const ratio2 = sizes[1] / sizes[0];
            
            // Allow 2x variance for linear complexity
            expect(ratio1).toBeLessThan(ratio2 * 2);
        });
    });

    describe('configuration', () => {
        it('should provide layout configuration', () => {
            const config = engine.getConfig();
            expect(config.rowHeight).toBe(50);
            expect(config.columnWidth).toBe(30);
            expect(config.nodeRadius).toBe(5);
            expect(config.colors.length).toBeGreaterThan(0);
        });

        it('should provide color for lane', () => {
            const color0 = engine.getColor(0);
            const color1 = engine.getColor(1);
            expect(color0).toBeTruthy();
            expect(color1).toBeTruthy();
            expect(color0).not.toBe(color1);
        });

        it('should cycle colors for many lanes', () => {
            const config = engine.getConfig();
            const colorCount = config.colors.length;

            const color0 = engine.getColor(0);
            const colorCycle = engine.getColor(colorCount);
            expect(color0).toBe(colorCycle);
        });
    });
});
