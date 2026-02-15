import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from './Logger';

describe('Logger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('setDebugMode', () => {
        it('should set debug mode', () => {
            logger.setDebugMode(true);
            // Logger should output debug messages when debug mode is enabled
        });
    });

    describe('debug', () => {
        it('should log debug messages when debug mode is enabled', () => {
            logger.setDebugMode(true);
            const consoleSpy = vi.spyOn(console, 'log');
            logger.debug('Debug message');
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should not log when debug mode is disabled', () => {
            logger.setDebugMode(false);
            const consoleSpy = vi.spyOn(console, 'log');
            logger.debug('Debug message');
            expect(consoleSpy).not.toHaveBeenCalled();
        });
    });

    describe('info', () => {
        it('should log info messages', () => {
            const consoleSpy = vi.spyOn(console, 'log');
            logger.info('Info message');
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should log with additional arguments', () => {
            const consoleSpy = vi.spyOn(console, 'log');
            logger.info('Info', { key: 'value' });
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('warn', () => {
        it('should log warning messages', () => {
            const consoleSpy = vi.spyOn(console, 'warn');
            logger.warn('Warning message');
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('error', () => {
        it('should log error messages', () => {
            const consoleSpy = vi.spyOn(console, 'error');
            logger.error('Error message');
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should log error objects', () => {
            const consoleSpy = vi.spyOn(console, 'error');
            const error = new Error('Test error');
            logger.error('Error occurred', error);
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('time and timeEnd', () => {
        it('should measure execution time when debug mode is enabled', () => {
            logger.setDebugMode(true);
            const consoleSpy = vi.spyOn(console, 'time');
            logger.time('operation');
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should handle nested timers', () => {
            logger.setDebugMode(true);
            logger.time('outer');
            logger.time('inner');
            logger.timeEnd('inner');
            logger.timeEnd('outer');
        });
    });
});
