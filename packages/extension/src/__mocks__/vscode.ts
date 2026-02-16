import { vi } from 'vitest';

export class TreeItem {
    label: string | any;
    collapsibleState?: number;
    contextValue?: string;
    description?: string;
    iconPath?: any;
    resourceUri?: any;
    command?: any;

    constructor(label: string | any, collapsibleState?: number) {
        this.label = label;
        this.collapsibleState = collapsibleState;
    }
}

export const TreeItemCollapsibleState = {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
};

export class ThemeIcon {
    id: string;
    constructor(id: string) {
        this.id = id;
    }

    static File = new ThemeIcon('file');
    static Folder = new ThemeIcon('folder');
}

export const Uri = {
    file: vi.fn((path) => ({ fsPath: path, path, scheme: 'file', with: vi.fn() })),
    parse: vi.fn((str) => ({ toString: () => str, with: vi.fn() })),
    joinPath: vi.fn((base, ...paths) => ({
        fsPath: `${base.fsPath}/${paths.join('/')}`,
        path: `${base.path}/${paths.join('/')}`,
        scheme: base.scheme,
        with: vi.fn(),
    })),
};

export class EventEmitter {
    private listeners: any[] = [];

    get event() {
        return (listener: any) => {
            this.listeners.push(listener);
            return { dispose: () => { } };
        };
    }

    fire(data?: any) {
        this.listeners.forEach(listener => listener(data));
    }

    dispose() {
        this.listeners = [];
    }
}

export const window = {
    createOutputChannel: vi.fn(() => ({
        appendLine: vi.fn(),
        append: vi.fn(),
        show: vi.fn(),
        dispose: vi.fn(),
    })),
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showInputBox: vi.fn(),
    registerTreeDataProvider: vi.fn(),
    registerWebviewViewProvider: vi.fn(),
};

export const workspace = {
    workspaceFolders: [],
    createFileSystemWatcher: vi.fn(() => ({
        onDidChange: vi.fn(),
        onDidCreate: vi.fn(),
        onDidDelete: vi.fn(),
        dispose: vi.fn(),
    })),
};

export const commands = {
    registerCommand: vi.fn(),
    executeCommand: vi.fn(),
};
