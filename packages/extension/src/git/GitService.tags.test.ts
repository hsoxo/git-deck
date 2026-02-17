import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitService } from './GitService';
import simpleGit, { SimpleGit } from 'simple-git';

vi.mock('simple-git');

describe('GitService - Tags', () => {
    let gitService: GitService;
    let mockGit: any;

    beforeEach(() => {
        mockGit = {
            raw: vi.fn(),
        };
        (simpleGit as any).mockReturnValue(mockGit);
        gitService = new GitService('/test/repo');
    });

    describe('getTags', () => {
        it('should return empty array when no tags exist', async () => {
            mockGit.raw.mockResolvedValue('');

            const tags = await gitService.getTags();

            expect(tags).toEqual([]);
            expect(mockGit.raw).toHaveBeenCalledWith([
                'tag',
                '-l',
                '--format=%(refname:short)%09%(objectname)%09%(creatordate:iso8601)%09%(subject)%09%(taggername)'
            ]);
        });

        it('should parse tags correctly', async () => {
            const mockOutput = `v1.0.0\tabc123\t2024-01-01T10:00:00+00:00\tRelease 1.0.0\tJohn Doe
v1.1.0\tdef456\t2024-02-01T10:00:00+00:00\tRelease 1.1.0\tJane Smith`;

            mockGit.raw.mockResolvedValue(mockOutput);

            const tags = await gitService.getTags();

            expect(tags).toHaveLength(2);
            expect(tags[0]).toEqual({
                name: 'v1.0.0',
                hash: 'abc123',
                date: new Date('2024-01-01T10:00:00+00:00'),
                message: 'Release 1.0.0',
                tagger: 'John Doe'
            });
            expect(tags[1]).toEqual({
                name: 'v1.1.0',
                hash: 'def456',
                date: new Date('2024-02-01T10:00:00+00:00'),
                message: 'Release 1.1.0',
                tagger: 'Jane Smith'
            });
        });

        it('should handle tags without tagger', async () => {
            const mockOutput = `v1.0.0\tabc123\t2024-01-01T10:00:00+00:00\tRelease 1.0.0\t`;

            mockGit.raw.mockResolvedValue(mockOutput);

            const tags = await gitService.getTags();

            expect(tags).toHaveLength(1);
            expect(tags[0].tagger).toBe('');
        });

        it('should handle tags without message', async () => {
            const mockOutput = `v1.0.0\tabc123\t2024-01-01T10:00:00+00:00\t\tJohn Doe`;

            mockGit.raw.mockResolvedValue(mockOutput);

            const tags = await gitService.getTags();

            expect(tags).toHaveLength(1);
            expect(tags[0].message).toBe('');
        });

        it('should handle malformed lines gracefully', async () => {
            const mockOutput = `v1.0.0\tabc123
v1.1.0\tdef456\t2024-02-01T10:00:00+00:00\tRelease 1.1.0\tJane Smith`;

            mockGit.raw.mockResolvedValue(mockOutput);

            const tags = await gitService.getTags();

            // Both lines have at least 2 fields (name and hash), so both should be parsed
            expect(tags).toHaveLength(2);
            expect(tags[0].name).toBe('v1.0.0');
            expect(tags[0].hash).toBe('abc123');
            expect(tags[1].name).toBe('v1.1.0');
        });

        it('should handle empty lines', async () => {
            const mockOutput = `v1.0.0\tabc123\t2024-01-01T10:00:00+00:00\tRelease 1.0.0\tJohn Doe

v1.1.0\tdef456\t2024-02-01T10:00:00+00:00\tRelease 1.1.0\tJane Smith`;

            mockGit.raw.mockResolvedValue(mockOutput);

            const tags = await gitService.getTags();

            expect(tags).toHaveLength(2);
        });

        it('should throw error on git command failure', async () => {
            mockGit.raw.mockRejectedValue(new Error('Git command failed'));

            await expect(gitService.getTags()).rejects.toThrow();
        });
    });
});
