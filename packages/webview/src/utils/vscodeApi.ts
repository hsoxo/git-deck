// VS Code API can only be acquired once per webview
// Store it at window level to ensure it works across module reloads
declare global {
    interface Window {
        __vscodeApi?: any;
        acquireVsCodeApi?: () => any;
    }
}

// Acquire the API immediately when this module loads (before any React rendering)
let vscodeApi: any = null;

if (typeof window !== 'undefined') {
    // Check if already stored
    if (window.__vscodeApi) {
        vscodeApi = window.__vscodeApi;
    } else if (window.acquireVsCodeApi) {
        // Acquire it once and store it
        try {
            vscodeApi = window.acquireVsCodeApi();
            window.__vscodeApi = vscodeApi;
        } catch (error) {
            // Already acquired - this shouldn't happen but handle it gracefully
            console.warn('[vscodeApi] API already acquired, using cached version');
            vscodeApi = window.__vscodeApi;
        }
    }
}

export function getVsCodeApi() {
    return vscodeApi;
}
