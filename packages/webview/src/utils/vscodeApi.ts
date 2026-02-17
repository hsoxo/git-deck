// VS Code API can only be acquired once per webview
// Store it at window level to ensure it works across module reloads
declare global {
    interface Window {
        __vscodeApi?: any;
    }
}

export function getVsCodeApi() {
    // Check if we already have the API stored on window
    if (window.__vscodeApi) {
        return window.__vscodeApi;
    }

    // Try to acquire it
    const acquireVsCodeApi = (window as any).acquireVsCodeApi;
    if (acquireVsCodeApi) {
        try {
            window.__vscodeApi = acquireVsCodeApi();
        } catch (error) {
            // If it was already acquired, it might be stored elsewhere
            // In VS Code, after acquisition, the API is available but acquireVsCodeApi throws
            console.warn('[vscodeApi] Failed to acquire, checking if already available:', error);

            // The API might already be on window from a previous call
            if (window.__vscodeApi) {
                return window.__vscodeApi;
            }

            throw error;
        }
    }

    return window.__vscodeApi;
}
