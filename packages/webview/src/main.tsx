import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 添加日志帮助调试
console.log('[Git GUI Webview] Starting initialization...');
console.log('[Git GUI Webview] React version:', React.version);
console.log('[Git GUI Webview] Root element:', document.getElementById('root'));

try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error('Root element not found');
    }

    console.log('[Git GUI Webview] Creating React root...');
    const root = ReactDOM.createRoot(rootElement);

    console.log('[Git GUI Webview] Rendering App component...');
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );

    console.log('[Git GUI Webview] App rendered successfully');

    // 隐藏 loading 界面
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
            console.log('[Git GUI Webview] Loading screen hidden');
        }
    }, 100);
} catch (error) {
    console.error('[Git GUI Webview] Initialization error:', error);
    const errorContainer = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const loading = document.getElementById('loading');

    if (loading) loading.style.display = 'none';
    if (errorContainer) errorContainer.style.display = 'flex';
    if (errorMessage) errorMessage.textContent = error instanceof Error ? error.message : String(error);
}
