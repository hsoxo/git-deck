import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileList } from './FileList';

describe('FileList', () => {
    const mockOnAction = vi.fn();

    it('should render empty state', () => {
        render(<FileList files={[]} onAction={mockOnAction} actionLabel="Stage" />);

        expect(screen.getByText('No changes')).toBeInTheDocument();
    });

    it('should render file list', () => {
        const files = ['file1.ts', 'file2.ts', 'file3.ts'];

        render(<FileList files={files} onAction={mockOnAction} actionLabel="Stage" />);

        expect(screen.getByText('file1.ts')).toBeInTheDocument();
        expect(screen.getByText('file2.ts')).toBeInTheDocument();
        expect(screen.getByText('file3.ts')).toBeInTheDocument();
    });

    it('should call onAction when clicking action button', () => {
        const files = ['file1.ts'];

        render(<FileList files={files} onAction={mockOnAction} actionLabel="Stage" />);

        const actionButtons = screen.getAllByText('Stage');
        fireEvent.click(actionButtons[0]);

        expect(mockOnAction).toHaveBeenCalledWith(['file1.ts']);
    });

    it('should select file on click', () => {
        const files = ['file1.ts', 'file2.ts'];

        render(<FileList files={files} onAction={mockOnAction} actionLabel="Stage" />);

        const file1 = screen.getByText('file1.ts').parentElement;
        fireEvent.click(file1!);

        expect(file1).toHaveClass('selected');
    });
});
