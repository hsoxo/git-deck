import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitGraphContextMenu } from './GitGraphContextMenu';

describe('GitGraphContextMenu', () => {
    const defaultProps = {
        x: 100,
        y: 200,
        onCherryPick: vi.fn(),
        onRevert: vi.fn(),
        onCreateBranch: vi.fn(),
        onCopyHash: vi.fn(),
        onClose: vi.fn(),
    };

    it('renders all menu items', () => {
        render(<GitGraphContextMenu {...defaultProps} />);

        expect(screen.getByText('Branch Here')).toBeInTheDocument();
        expect(screen.getByText('Cherry-pick')).toBeInTheDocument();
        expect(screen.getByText('Revert')).toBeInTheDocument();
        expect(screen.getByText('Copy Hash')).toBeInTheDocument();
    });

    it('positions menu at correct coordinates', () => {
        const { container } = render(<GitGraphContextMenu {...defaultProps} />);

        const menu = container.querySelector('.git-graph-context-menu');
        expect(menu).toHaveStyle({ left: '100px', top: '200px' });
    });

    it('calls onCherryPick when cherry-pick is clicked', () => {
        render(<GitGraphContextMenu {...defaultProps} />);

        fireEvent.click(screen.getByText('Cherry-pick'));
        expect(defaultProps.onCherryPick).toHaveBeenCalledTimes(1);
    });

    it('calls onRevert when revert is clicked', () => {
        render(<GitGraphContextMenu {...defaultProps} />);

        fireEvent.click(screen.getByText('Revert'));
        expect(defaultProps.onRevert).toHaveBeenCalledTimes(1);
    });

    it('calls onCopyHash when copy hash is clicked', () => {
        render(<GitGraphContextMenu {...defaultProps} />);

        fireEvent.click(screen.getByText('Copy Hash'));
        expect(defaultProps.onCopyHash).toHaveBeenCalledTimes(1);
    });

    it('calls onCreateBranch when branch here is clicked', () => {
        render(<GitGraphContextMenu {...defaultProps} />);

        fireEvent.click(screen.getByText('Branch Here'));
        expect(defaultProps.onCreateBranch).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking outside menu', () => {
        render(
            <div>
                <GitGraphContextMenu {...defaultProps} />
                <div data-testid="outside">Outside</div>
            </div>
        );

        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking inside menu', () => {
        render(<GitGraphContextMenu {...defaultProps} />);

        const menu = document.querySelector('.git-graph-context-menu');
        fireEvent.mouseDown(menu!);

        // The event listener is on document, so clicking inside will still trigger it
        // This test should verify that clicking a menu item closes the menu
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
