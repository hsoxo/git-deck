import { describe, it, expect } from 'vitest';
import { LogParser } from './LogParser';

describe('LogParser', () => {
    describe('parseLog', () => {
        it('should parse valid log output', () => {
            const logOutput = `abc123|abc|def456 ghi789|HEAD -> main, origin/main|John Doe|john@example.com|1234567890|Initial commit
def456|def|ghi789||Jane Smith|jane@example.com|1234567891|Second commit`;

            const commits = LogParser.parseLog(logOutput, 'abc123');

            expect(commits).toHaveLength(2);
            expect(commits[0].hash).toBe('abc123');
            expect(commits[0].shortHash).toBe('abc');
            expect(commits[0].message).toBe('Initial commit');
            expect(commits[0].author).toBe('John Doe');
            expect(commits[0].email).toBe('john@example.com');
            expect(commits[0].parents).toEqual(['def456', 'ghi789']);
            expect(commits[0].refs).toEqual(['HEAD -> main', 'origin/main']);
            expect(commits[0].isHead).toBe(true);

            expect(commits[1].hash).toBe('def456');
            expect(commits[1].isHead).toBe(false);
        });

        it('should handle empty log output', () => {
            const commits = LogParser.parseLog('', 'abc123');
            expect(commits).toHaveLength(0);
        });

        it('should handle commit with no parents', () => {
            const logOutput =
                'abc123|abc||HEAD -> main|John Doe|john@example.com|1234567890|Initial commit';
            const commits = LogParser.parseLog(logOutput, 'abc123');

            expect(commits).toHaveLength(1);
            expect(commits[0].parents).toEqual([]);
        });

        it('should handle commit with no refs', () => {
            const logOutput =
                'abc123|abc|def456||John Doe|john@example.com|1234567890|Commit message';
            const commits = LogParser.parseLog(logOutput, 'abc123');

            expect(commits).toHaveLength(1);
            expect(commits[0].refs).toEqual([]);
        });

        it('should handle message with pipe character', () => {
            const logOutput =
                'abc123|abc|def456||John Doe|john@example.com|1234567890|Fix: issue | with | pipes';
            const commits = LogParser.parseLog(logOutput, 'abc123');

            expect(commits).toHaveLength(1);
            expect(commits[0].message).toBe('Fix: issue | with | pipes');
        });
    });

    describe('getLogFormat', () => {
        it('should return correct format string', () => {
            const format = LogParser.getLogFormat();
            expect(format).toBe('%H|%h|%P|%D|%an|%ae|%at|%s');
        });
    });

    describe('buildCommitGraph', () => {
        it('should build parent-child relationships', () => {
            const commits = [
                {
                    hash: 'abc',
                    shortHash: 'abc',
                    message: 'Commit 1',
                    author: 'John',
                    email: 'john@example.com',
                    date: new Date(),
                    parents: ['def'],
                    refs: [],
                    isHead: true,
                },
                {
                    hash: 'def',
                    shortHash: 'def',
                    message: 'Commit 2',
                    author: 'John',
                    email: 'john@example.com',
                    date: new Date(),
                    parents: [],
                    refs: [],
                    isHead: false,
                },
            ];

            const graph = LogParser.buildCommitGraph(commits);

            expect(graph.has('def')).toBe(true);
            expect(graph.get('def')).toHaveLength(1);
            expect(graph.get('def')![0].hash).toBe('abc');
        });
    });

    describe('findBranchPoints', () => {
        it('should find commits with multiple children', () => {
            const commits = [
                {
                    hash: 'abc',
                    shortHash: 'abc',
                    message: 'Commit 1',
                    author: 'John',
                    email: 'john@example.com',
                    date: new Date(),
                    parents: ['ghi'],
                    refs: [],
                    isHead: false,
                },
                {
                    hash: 'def',
                    shortHash: 'def',
                    message: 'Commit 2',
                    author: 'John',
                    email: 'john@example.com',
                    date: new Date(),
                    parents: ['ghi'],
                    refs: [],
                    isHead: false,
                },
                {
                    hash: 'ghi',
                    shortHash: 'ghi',
                    message: 'Commit 3',
                    author: 'John',
                    email: 'john@example.com',
                    date: new Date(),
                    parents: [],
                    refs: [],
                    isHead: false,
                },
            ];

            const branchPoints = LogParser.findBranchPoints(commits);

            expect(branchPoints.has('ghi')).toBe(true);
            expect(branchPoints.size).toBe(1);
        });
    });

    describe('findMergePoints', () => {
        it('should find commits with multiple parents', () => {
            const commits = [
                {
                    hash: 'abc',
                    shortHash: 'abc',
                    message: 'Merge commit',
                    author: 'John',
                    email: 'john@example.com',
                    date: new Date(),
                    parents: ['def', 'ghi'],
                    refs: [],
                    isHead: true,
                },
                {
                    hash: 'def',
                    shortHash: 'def',
                    message: 'Commit 2',
                    author: 'John',
                    email: 'john@example.com',
                    date: new Date(),
                    parents: [],
                    refs: [],
                    isHead: false,
                },
            ];

            const mergePoints = LogParser.findMergePoints(commits);

            expect(mergePoints.has('abc')).toBe(true);
            expect(mergePoints.size).toBe(1);
        });
    });
});
