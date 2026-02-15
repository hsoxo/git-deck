import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock VS Code API
(global as any).acquireVsCodeApi = vi.fn(() => ({
    postMessage: vi.fn(),
    setState: vi.fn(),
    getState: vi.fn(),
}));
