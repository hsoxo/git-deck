import { SimpleGit } from 'simple-git';

export interface FileDiff {
    file: string;
    additions: number;
    deletions: number;
    changes: number;
    diff: string;
}

export class DiffOperations {
    constructor(private git: SimpleGit) {}

    /**
     * Get diff for a specific file
     */
    async getFileDiff(file: string, staged: boolean = false): Promise<string> {
        const args = staged ? ['--cached', file] : [file];
        const diff = await this.git.diff(args);
        return diff;
    }

    /**
     * Get diff for all unstaged changes
     */
    async getUnstagedDiff(): Promise<string> {
        return await this.git.diff();
    }

    /**
     * Get diff for all staged changes
     */
    async getStagedDiff(): Promise<string> {
        return await this.git.diff(['--cached']);
    }

    /**
     * Get diff between two commits
     */
    async getCommitDiff(from: string, to: string): Promise<string> {
        return await this.git.diff([from, to]);
    }

    /**
     * Get diff for a specific commit
     */
    async getCommitChanges(commit: string): Promise<string> {
        return await this.git.show([commit]);
    }

    /**
     * Get file diff statistics
     */
    async getDiffStats(file?: string): Promise<FileDiff[]> {
        const args = ['--numstat'];
        if (file) {
            args.push(file);
        }

        const result = await this.git.diff(args);
        const lines = result.split('\n').filter(Boolean);

        return lines.map((line) => {
            const [additions, deletions, filepath] = line.split('\t');
            return {
                file: filepath,
                additions: parseInt(additions, 10) || 0,
                deletions: parseInt(deletions, 10) || 0,
                changes: (parseInt(additions, 10) || 0) + (parseInt(deletions, 10) || 0),
                diff: '',
            };
        });
    }

    /**
     * Get diff summary for staged changes
     */
    async getStagedDiffStats(): Promise<FileDiff[]> {
        const result = await this.git.diff(['--cached', '--numstat']);
        const lines = result.split('\n').filter(Boolean);

        return lines.map((line) => {
            const [additions, deletions, filepath] = line.split('\t');
            return {
                file: filepath,
                additions: parseInt(additions, 10) || 0,
                deletions: parseInt(deletions, 10) || 0,
                changes: (parseInt(additions, 10) || 0) + (parseInt(deletions, 10) || 0),
                diff: '',
            };
        });
    }
}
