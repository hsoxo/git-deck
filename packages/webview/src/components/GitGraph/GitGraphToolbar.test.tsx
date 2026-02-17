import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitGraphToolbar } from './GitGraphToolbar';
import type { BranchInfo } from '@git-gui/shared';

describe('GitGraphToolbar', () => {
    const mockBranches: BranchInfo[] = [
        { name: 'main', current: true, remote: false },
        { name: 'feature/test', current: false, remote: false },
        { name: 'origin/main', current: false, remote: true },
    ];

    const defaultProps = {
        branches: mockBranches,
        currentBranch: 'main',
        selectedBranch: 'main',
        onRefresh: vi.fn(),
        onBranchChange: vi.fn(),
        onCheckout: vi.fn(),
        onMerge: vi.fn(),
        onRebase: vi.fn(),
    };

    it('renders all buttons', () => {
        render(<GitGraphToolbar {...defaultProps} />);

        expect(screen.getByText('Refresh')).toBeInTheDocument();
        expect(screen.getByText('Checkout')).toBeInTheDocument();
        expect(screen.getByText('Merge')).toBeInTheDocument();
        expect(screen.getByText('Rebase')).toBeInTheDocument();
    });

    it('renders branch selector with all branches', () => {
        render(<GitGraphToolbar {...defaultProps} />);

        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();

        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(3);
        expect(options[0]).toHaveTextContent('main (current)');
        expect(options[1]).toHaveTextContent('feature/test');
        expect(options[2]).toHaveTextContent('origin/main');
    });

    it('calls onRefresh when refresh button is clicked', () => {
        render(<GitGraphToolbar {...defaultProps} />);

        fireEvent.click(screen.getByText('Refresh'));
        expect(defaultProps.onRefresh).toHaveBeenCalledTimes(1);
    });

    it('calls onBranchChange when branch is selected', () => {
        render(<GitGraphToolbar {...defaultProps} />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'feature/test' } });

        expect(defaultProps.onBranchChange).toHaveBeenCalledWith('feature/test');
    });

    it('calls onCheckout when checkout button is clicked', () => {
        render(<GitGraphToolbar {...defaultProps} />);

        fireEvent.click(screen.getByText('Checkout'));
        expect(defaultProps.onCheckout).toHaveBeenCalledTimes(1);
    });

    it('calls onMerge when merge button is clicked', () => {
        render(<GitGraphToolbar {...defaultProps} />);

        fireEvent.click(screen.getByText('Merge'));
        expect(defaultProps.onMerge).toHaveBeenCalledTimes(1);
    });

    it('calls onRebase when rebase button is clicked', () => {
        render(<GitGraphToolbar {...defaultProps} />);

        fireEvent.click(screen.getByText('Rebase'));
        expect(defaultProps.onRebase).toHaveBeenCalledTimes(1);
    });

    it('displays selected branch correctly', () => {
        render(<GitGraphToolbar {...defaultProps} selectedBranch="feature/test" />);

        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('feature/test');
    });
});
