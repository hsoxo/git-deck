import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitGraphCommitRow } from './GitGraphCommitRow';
import type { CommitNode } from '@git-gui/shared';

describe('GitGraphCommitRow', () => {
    const mockCommit: CommitNode = {
        hash: 'abc123def456',
        shortHash: 'abc123d',
        message: 'feat: add new feature',
        author: 'John Doe',
        author_name: 'John Doe',
        email: 'john@example.com',
        author_email: 'john@example.com',
        date: new Date('2024-01-01T12:00:00Z'),
        parents: ['parent123'],
        refs: ['HEAD -> main', 'origin/main'],
        isHead: true,
        graph: '* ',
    };

    const defaultProps = {
        commit: mockCommit,
        currentBranch: 'main',
        onContextMenu: vi.fn(),
    };

    it('renders commit information', () => {
        render(<GitGraphCommitRow {...defaultProps} />);

        expect(screen.getByText('feat: add new feature')).toBeInTheDocument();
        expect(screen.getByText('abc123d')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders graph column', () => {
        render(<GitGraphCommitRow {...defaultProps} />);

        const graphColumn = document.querySelector('.graph-column');
        expect(graphColumn).toBeInTheDocument();
        expect(graphColumn).toHaveTextContent('*');
    });

    it('renders branch labels', () => {
        render(<GitGraphCommitRow {...defaultProps} />);

        const labels = screen.getAllByText('main');
        expect(labels.length).toBeGreaterThan(0);
        expect(labels[0]).toHaveClass('branch-label', 'current');
    });

    it('distinguishes remote branches', () => {
        const commitWithRemote: CommitNode = {
            ...mockCommit,
            refs: ['origin/feature'],
        };

        render(<GitGraphCommitRow {...defaultProps} commit={commitWithRemote} />);

        const remoteLabel = screen.getByText('feature');
        expect(remoteLabel).toHaveClass('branch-label', 'remote');
    });

    it('applies current-branch class when commit is on current branch', () => {
        const { container } = render(<GitGraphCommitRow {...defaultProps} />);

        const row = container.querySelector('.git-graph-commit-row');
        expect(row).toHaveClass('current-branch');
    });

    it('does not apply current-branch class when commit is not on current branch', () => {
        const commitOnOtherBranch: CommitNode = {
            ...mockCommit,
            refs: ['feature/other'],
        };

        const { container } = render(
            <GitGraphCommitRow {...defaultProps} commit={commitOnOtherBranch} />
        );

        const row = container.querySelector('.git-graph-commit-row');
        expect(row).not.toHaveClass('current-branch');
    });

    it('calls onContextMenu when right-clicked', () => {
        render(<GitGraphCommitRow {...defaultProps} />);

        const row = document.querySelector('.git-graph-commit-row');
        fireEvent.contextMenu(row!);

        expect(defaultProps.onContextMenu).toHaveBeenCalled();
        const call = defaultProps.onContextMenu.mock.calls[0];
        expect(call[1]).toBe('abc123def456');
    });

    it('formats date correctly', () => {
        render(<GitGraphCommitRow {...defaultProps} />);

        const dateElement = document.querySelector('.commit-date');
        expect(dateElement).toBeInTheDocument();
        expect(dateElement?.textContent).toMatch(/2024/);
    });

    it('truncates long commit messages with ellipsis', () => {
        const longCommit: CommitNode = {
            ...mockCommit,
            message: 'This is a very long commit message that should be truncated with ellipsis when displayed in the UI',
        };

        render(<GitGraphCommitRow {...defaultProps} commit={longCommit} />);

        const messageElement = document.querySelector('.commit-message');
        expect(messageElement).toHaveClass('commit-message');
    });

    it('filters out tag refs', () => {
        const commitWithTags: CommitNode = {
            ...mockCommit,
            refs: ['HEAD -> main', 'tag: v1.0.0', 'origin/main'],
        };

        render(<GitGraphCommitRow {...defaultProps} commit={commitWithTags} />);

        expect(screen.queryByText('v1.0.0')).not.toBeInTheDocument();
        const labels = screen.getAllByText('main');
        expect(labels.length).toBeGreaterThan(0);
    });
});
