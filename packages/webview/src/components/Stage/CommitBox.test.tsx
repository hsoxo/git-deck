import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommitBox } from './CommitBox';
import { useGitStore } from '../../store/gitStore';

vi.mock('../../store/gitStore');

describe('CommitBox', () => {
    const mockCommit = vi.fn();
    const mockAmendCommit = vi.fn();
    const mockFetchHistory = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useGitStore).mockReturnValue({
            commit: mockCommit,
            amendCommit: mockAmendCommit,
            fetchHistory: mockFetchHistory,
            status: {
                staged: ['file1.txt'],
                unstaged: [],
                untracked: [],
                current: 'main',
                tracking: null,
            },
            commits: [
                {
                    hash: 'abc123',
                    shortHash: 'abc123',
                    message: 'Previous commit',
                    author: 'Test',
                    email: 'test@example.com',
                    date: new Date(),
                    parents: [],
                    refs: [],
                    isHead: true,
                },
            ],
        } as any);
    });

    it('should render commit box', () => {
        render(<CommitBox />);
        expect(screen.getByPlaceholderText(/commit message/i)).toBeInTheDocument();
    });

    it('should disable commit button when no staged files', () => {
        vi.mocked(useGitStore).mockReturnValue({
            commit: mockCommit,
            amendCommit: mockAmendCommit,
            status: {
                staged: [],
                unstaged: [],
                untracked: [],
                current: 'main',
                tracking: null,
            },
            commits: [],
        } as any);

        render(<CommitBox />);
        const button = screen.getByRole('button', { name: /commit/i });
        expect(button).toBeDisabled();
    });

    it('should commit with message', async () => {
        mockCommit.mockResolvedValue(undefined);

        render(<CommitBox />);

        const textarea = screen.getByPlaceholderText(/commit message/i);
        const button = screen.getByRole('button', { name: /commit/i });

        fireEvent.change(textarea, { target: { value: 'Test commit' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockCommit).toHaveBeenCalledWith('Test commit');
        });
    });

    it('should clear message after commit', async () => {
        mockCommit.mockResolvedValue(undefined);

        render(<CommitBox />);

        const textarea = screen.getByPlaceholderText(/commit message/i) as HTMLTextAreaElement;
        const button = screen.getByRole('button', { name: /commit/i });

        fireEvent.change(textarea, { target: { value: 'Test commit' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(textarea.value).toBe('');
        });
    });

    it('should handle amend commit', async () => {
        mockAmendCommit.mockResolvedValue(undefined);

        render(<CommitBox />);

        const checkbox = screen.getByRole('checkbox', { name: /amend/i });
        const textarea = screen.getByPlaceholderText(/commit message/i);
        const button = screen.getByRole('button', { name: /commit/i });

        // Enable amend
        fireEvent.click(checkbox);

        // Should populate with previous commit message
        await waitFor(() => {
            expect((textarea as HTMLTextAreaElement).value).toBe('Previous commit');
        });

        // Change message
        fireEvent.change(textarea, { target: { value: 'Amended commit' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockAmendCommit).toHaveBeenCalledWith('Amended commit');
        });
    });

    it('should disable commit button when message is empty', () => {
        render(<CommitBox />);

        const button = screen.getByRole('button', { name: /commit/i });
        expect(button).toBeDisabled();
    });

    it('should enable commit button when message is not empty', () => {
        render(<CommitBox />);

        const textarea = screen.getByPlaceholderText(/commit message/i);
        const button = screen.getByRole('button', { name: /commit/i });

        fireEvent.change(textarea, { target: { value: 'Test' } });
        expect(button).not.toBeDisabled();
    });
});
