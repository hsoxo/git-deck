import { describe, it, expect } from 'vitest';
import { ErrorHandler } from './ErrorHandler';

describe('ErrorHandler', () => {
    describe('createUserMessage', () => {
        it('should handle conflict errors', () => {
            const error = new Error('CONFLICT (content): Merge conflict in file.txt');
            const message = ErrorHandler.createUserMessage(error, 'Merge');
            expect(message).toContain('conflict');
        });

        it('should handle network errors', () => {
            const error = new Error('network error');
            const message = ErrorHandler.createUserMessage(error, 'Fetch');
            expect(message).toContain('network');
        });

        it('should handle generic errors', () => {
            const error = new Error('Something went wrong');
            const message = ErrorHandler.createUserMessage(error, 'Operation');
            expect(message).toContain('Operation');
        });

        it('should handle non-Error objects', () => {
            const error = 'String error';
            const message = ErrorHandler.createUserMessage(error, 'Test');
            expect(message).toContain('Test');
        });
    });

    describe('isConflictError', () => {
        it('should detect conflict errors', () => {
            const error = new Error('CONFLICT (content): Merge conflict');
            expect(ErrorHandler.isConflictError(error)).toBe(true);
        });

        it('should return false for non-conflict errors', () => {
            const error = new Error('Some other error');
            expect(ErrorHandler.isConflictError(error)).toBe(false);
        });

        it('should handle non-Error objects', () => {
            expect(ErrorHandler.isConflictError('conflict')).toBe(false);
        });
    });

    describe('isNetworkError', () => {
        it('should detect network errors', () => {
            const error = new Error('network error occurred');
            expect(ErrorHandler.isNetworkError(error)).toBe(true);
        });

        it('should detect connection errors', () => {
            const error = new Error('Connection refused');
            expect(ErrorHandler.isNetworkError(error)).toBe(true);
        });

        it('should detect timeout errors', () => {
            const error = new Error('Request timeout');
            expect(ErrorHandler.isNetworkError(error)).toBe(true);
        });

        it('should return false for non-network errors', () => {
            const error = new Error('Some other error');
            expect(ErrorHandler.isNetworkError(error)).toBe(false);
        });
    });
});
