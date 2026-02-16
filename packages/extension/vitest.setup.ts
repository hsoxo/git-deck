import { vi } from 'vitest';

// Mock vscode module
vi.mock('vscode', () => import('./src/__mocks__/vscode'));
