import * as vscode from 'vscode';
import { GitService } from '../git/GitService';
import type { GitStatus, FileChange } from '@git-gui/shared';
import { logger } from '../utils/Logger';

export class ChangesView implements vscode.WebviewViewProvider {
    public static readonly viewType = 'gitGui.changesView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly gitService: GitService,
        private readonly onRefresh: () => void
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'stageFile':
                    await this.gitService.stageFiles([data.file]);
                    this.onRefresh();
                    break;
                case 'unstageFile':
                    await this.gitService.unstageFiles([data.file]);
                    this.onRefresh();
                    break;
                case 'stageAll':
                    const status = await this.gitService.getStatus();
                    const allFiles = [...status.unstaged, ...status.untracked].map(f => f.path);
                    if (allFiles.length > 0) {
                        await this.gitService.stageFiles(allFiles);
                        this.onRefresh();
                    }
                    break;
                case 'unstageAll':
                    const statusForUnstage = await this.gitService.getStatus();
                    if (statusForUnstage.staged.length > 0) {
                        await this.gitService.unstageFiles(statusForUnstage.staged.map(f => f.path));
                        this.onRefresh();
                    }
                    break;
                case 'discardFile':
                    const answer = await vscode.window.showWarningMessage(
                        `Are you sure you want to discard changes in ${data.file}?`,
                        { modal: true },
                        'Discard'
                    );
                    if (answer === 'Discard') {
                        await this.gitService.discardChanges([data.file]);
                        this.onRefresh();
                    }
                    break;
                case 'openDiff':
                    await vscode.commands.executeCommand('gitGui.openDiff', data.file, data.staged);
                    break;
            }
        });

        this.refresh();
    }

    public async refresh() {
        if (this._view) {
            const status = await this.gitService.getStatus();
            this._view.webview.postMessage({
                type: 'update',
                status: status
            });
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Changes</title>
    <style>
        body {
            padding: 0;
            margin: 0;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
        }
        .section {
            margin-bottom: 4px;
        }
        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 8px;
            cursor: pointer;
            user-select: none;
            background: var(--vscode-sideBar-background);
        }
        .section-header:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .section-title {
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section-count {
            opacity: 0.6;
            font-size: 11px;
            font-weight: normal;
        }
        .section-actions {
            display: flex;
            gap: 4px;
        }
        .icon-button {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            cursor: pointer;
            padding: 2px 4px;
            opacity: 0.6;
            font-size: 14px;
        }
        .icon-button:hover {
            opacity: 1;
            background: var(--vscode-toolbar-hoverBackground);
        }
        .tree-container {
            padding-left: 0;
        }
        .tree-item {
            display: flex;
            align-items: center;
            padding: 2px 8px;
            cursor: pointer;
            gap: 6px;
            user-select: none;
            line-height: 22px;
        }
        .tree-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        .tree-item.selected {
            background: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }
        .tree-indent {
            display: inline-block;
            width: 8px;
        }
        .tree-icon {
            width: 16px;
            height: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .folder-arrow {
            transition: transform 0.1s;
            opacity: 0.8;
        }
        .folder-arrow.collapsed {
            transform: rotate(-90deg);
        }
        .folder-arrow svg {
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .folder-icon {
            opacity: 0.8;
        }
        .folder-icon svg {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }
        .icon-button svg {
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .file-status-icon {
            font-weight: 600;
            font-size: 11px;
        }
        .status-added, .status-untracked {
            color: var(--vscode-gitDecoration-addedResourceForeground);
        }
        .status-modified {
            color: var(--vscode-gitDecoration-modifiedResourceForeground);
        }
        .status-deleted {
            color: var(--vscode-gitDecoration-deletedResourceForeground);
        }
        .status-renamed {
            color: var(--vscode-gitDecoration-renamedResourceForeground);
        }
        .tree-label {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .file-label.deleted {
            text-decoration: line-through;
            opacity: 0.7;
        }
        .tree-actions {
            display: none;
            gap: 2px;
            margin-left: auto;
        }
        .tree-item:hover .tree-actions {
            display: flex;
        }
        .collapsed > .tree-children {
            display: none;
        }
        .tree-children {
            padding-left: 0;
        }
        .arrow {
            transition: transform 0.1s;
            opacity: 0.8;
        }
        .collapsed .arrow {
            transform: rotate(-90deg);
        }
        .arrow svg {
            width: 12px;
            height: 12px;
            fill: currentColor;
        }
        .section.collapsed .tree-container {
            display: none;
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="section" id="unstaged-section">
            <div class="section-header" onclick="toggleSection('unstaged')">
                <div class="section-title">
                    <span class="arrow"><svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></span>
                    <span>Unstaged Changes</span>
                    <span class="section-count" id="unstaged-count">0</span>
                </div>
                <div class="section-actions">
                    <button class="icon-button" onclick="stageAll()" title="Stage All">
                        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="tree-container" id="unstaged-files"></div>
        </div>

        <div class="section" id="staged-section">
            <div class="section-header" onclick="toggleSection('staged')">
                <div class="section-title">
                    <span class="arrow"><svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></span>
                    <span>Staged Changes</span>
                    <span class="section-count" id="staged-count">0</span>
                </div>
                <div class="section-actions">
                    <button class="icon-button" onclick="unstageAll()" title="Unstage All">
                        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="tree-container" id="staged-files"></div>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let currentStatus = null;

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
                currentStatus = message.status;
                updateView(message.status);
            }
        });

        function updateView(status) {
            const unstagedFiles = [...status.unstaged, ...status.untracked];
            document.getElementById('unstaged-count').textContent = unstagedFiles.length;
            renderTree('unstaged-files', unstagedFiles, false);

            document.getElementById('staged-count').textContent = status.staged.length;
            renderTree('staged-files', status.staged, true);
        }

        function buildFileTree(files) {
            const root = { children: {}, files: [] };
            
            files.forEach(file => {
                const parts = file.path.split('/');
                let current = root;
                
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    if (!current.children[part]) {
                        current.children[part] = { children: {}, files: [], name: part };
                    }
                    current = current.children[part];
                }
                
                current.files.push({
                    name: parts[parts.length - 1],
                    path: file.path,
                    status: file.status
                });
            });
            
            return root;
        }

        function renderTree(containerId, files, staged) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            
            const tree = buildFileTree(files);
            renderTreeNode(container, tree, 0, staged);
        }

        function renderTreeNode(container, node, depth, staged, parentPath = '') {
            // Sort folders first, then files
            const folders = Object.keys(node.children).sort();
            const files = node.files.sort((a, b) => a.name.localeCompare(b.name));
            
            // Render folders
            folders.forEach(folderName => {
                const folder = node.children[folderName];
                const folderPath = parentPath ? parentPath + '/' + folderName : folderName;
                const folderId = 'folder-' + folderPath.replace(/[^a-zA-Z0-9]/g, '-');
                
                const folderItem = document.createElement('div');
                folderItem.className = 'tree-item folder-item';
                folderItem.dataset.path = folderPath;
                
                // Indentation
                for (let i = 0; i < depth; i++) {
                    const indent = document.createElement('span');
                    indent.className = 'tree-indent';
                    folderItem.appendChild(indent);
                }
                
                // Arrow
                const arrow = document.createElement('span');
                arrow.className = 'tree-icon folder-arrow';
                arrow.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
                folderItem.appendChild(arrow);
                
                // Folder icon
                const icon = document.createElement('span');
                icon.className = 'tree-icon folder-icon';
                icon.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 3h5l1.5 2h6a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 .5-.866z" fill="currentColor" opacity="0.6"/></svg>';
                folderItem.appendChild(icon);
                
                // Label
                const label = document.createElement('span');
                label.className = 'tree-label';
                label.textContent = folderName;
                folderItem.appendChild(label);
                
                folderItem.onclick = (e) => {
                    e.stopPropagation();
                    toggleFolder(folderId);
                };
                
                container.appendChild(folderItem);
                
                // Children container
                const childrenContainer = document.createElement('div');
                childrenContainer.id = folderId;
                childrenContainer.className = 'tree-children';
                container.appendChild(childrenContainer);
                
                renderTreeNode(childrenContainer, folder, depth + 1, staged, folderPath);
            });
            
            // Render files
            files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'tree-item file-item';
                fileItem.dataset.path = file.path;
                
                // Indentation
                for (let i = 0; i < depth; i++) {
                    const indent = document.createElement('span');
                    indent.className = 'tree-indent';
                    fileItem.appendChild(indent);
                }
                
                // Empty space for alignment (no arrow for files)
                const spacer = document.createElement('span');
                spacer.className = 'tree-icon';
                fileItem.appendChild(spacer);
                
                // Status icon
                const statusIcon = document.createElement('span');
                statusIcon.className = 'tree-icon file-status-icon status-' + file.status;
                statusIcon.textContent = getStatusIcon(file.status);
                fileItem.appendChild(statusIcon);
                
                // Label
                const label = document.createElement('span');
                label.className = 'tree-label file-label';
                if (file.status === 'deleted') {
                    label.classList.add('deleted');
                }
                label.textContent = file.name;
                fileItem.appendChild(label);
                
                // Actions
                const actions = document.createElement('div');
                actions.className = 'tree-actions';
                
                if (staged) {
                    const unstageBtn = document.createElement('button');
                    unstageBtn.className = 'icon-button';
                    unstageBtn.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
                    unstageBtn.title = 'Unstage';
                    unstageBtn.onclick = (e) => {
                        e.stopPropagation();
                        unstageFile(file.path);
                    };
                    actions.appendChild(unstageBtn);
                } else {
                    const stageBtn = document.createElement('button');
                    stageBtn.className = 'icon-button';
                    stageBtn.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
                    stageBtn.title = 'Stage';
                    stageBtn.onclick = (e) => {
                        e.stopPropagation();
                        stageFile(file.path);
                    };
                    actions.appendChild(stageBtn);
                    
                    const discardBtn = document.createElement('button');
                    discardBtn.className = 'icon-button';
                    discardBtn.textContent = '✕';
                    discardBtn.title = 'Discard';
                    discardBtn.onclick = (e) => {
                        e.stopPropagation();
                        discardFile(file.path);
                    };
                    actions.appendChild(discardBtn);
                }
                
                fileItem.appendChild(actions);
                
                fileItem.onclick = () => openDiff(file.path, staged);
                
                container.appendChild(fileItem);
            });
        }

        function getStatusIcon(status) {
            const icons = {
                'added': 'A',
                'modified': 'M',
                'deleted': 'D',
                'renamed': 'R',
                'untracked': 'U'
            };
            return icons[status] || '?';
        }

        function toggleFolder(folderId) {
            const folder = document.getElementById(folderId);
            const folderItem = folder.previousElementSibling;
            const arrow = folderItem.querySelector('.folder-arrow');
            
            if (folder.style.display === 'none') {
                folder.style.display = 'block';
                arrow.classList.remove('collapsed');
            } else {
                folder.style.display = 'none';
                arrow.classList.add('collapsed');
            }
        }

        function toggleSection(section) {
            const sectionEl = document.getElementById(section + '-section');
            sectionEl.classList.toggle('collapsed');
        }

        function stageFile(file) {
            vscode.postMessage({ type: 'stageFile', file });
        }

        function unstageFile(file) {
            vscode.postMessage({ type: 'unstageFile', file });
        }

        function stageAll() {
            vscode.postMessage({ type: 'stageAll' });
        }

        function unstageAll() {
            vscode.postMessage({ type: 'unstageAll' });
        }

        function discardFile(file) {
            vscode.postMessage({ type: 'discardFile', file });
        }

        function openDiff(file, staged) {
            vscode.postMessage({ type: 'openDiff', file, staged });
        }
    </script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
