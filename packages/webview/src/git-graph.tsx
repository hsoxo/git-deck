import React from 'react';
import ReactDOM from 'react-dom/client';
import { GitGraphView } from './components/GitGraph/GitGraphView';
import './index.css';

// IMPORTANT: Acquire VS Code API immediately at module level
// This must happen before any other code that might try to acquire it
import { getVsCodeApi } from './utils/vscodeApi';
getVsCodeApi(); // Call it immediately to cache it

console.log('[Git Graph] Starting initialization...');

try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error('Root element not found');
    }

    console.log('[Git Graph] Creating React root...');
    const root = ReactDOM.createRoot(rootElement);

    console.log('[Git Graph] Rendering GitGraphView component...');
    root.render(
        <React.StrictMode>
            <GitGraphView />
        </React.StrictMode>
    );

    console.log('[Git Graph] GitGraphView rendered successfully');
} catch (error) {
    console.error('[Git Graph] Initialization error:', error);
}
