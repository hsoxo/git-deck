import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from '../git/GitService';
import type { FileChange } from '@git-gui/shared';

// 文件装饰提供者，用于设置文件颜色
class GitFileDecorationProvider implements vscode.FileDecorationProvider {
    private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    private decorations = new Map<string, FileChange['status']>();

    provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
        if (uri.scheme !== 'git-status') {
            return undefined;
        }

        const status = this.decorations.get(uri.fsPath);
        if (!status) {
            return undefined;
        }

        const colorMap: Record<FileChange['status'], vscode.ThemeColor> = {
            'added': new vscode.ThemeColor('gitDecoration.addedResourceForeground'),
            'modified': new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'),
            'deleted': new vscode.ThemeColor('gitDecoration.deletedResourceForeground'),
            'renamed': new vscode.ThemeColor('gitDecoration.renamedResourceForeground'),
            'untracked': new vscode.ThemeColor('gitDecoration.untrackedResourceForeground')
        };

        return {
            color: colorMap[status]
        };
    }

    setDecoration(filePath: string, status: FileChange['status']): void {
        this.decorations.set(filePath, status);
        const uri = vscode.Uri.file(filePath).with({ scheme: 'git-status' });
        this._onDidChangeFileDecorations.fire(uri);
    }

    clearDecorations(): void {
        const uris = Array.from(this.decorations.keys()).map(path =>
            vscode.Uri.file(path).with({ scheme: 'git-status' })
        );
        this.decorations.clear();
        this._onDidChangeFileDecorations.fire(uris);
    }
}

export const gitFileDecorationProvider = new GitFileDecorationProvider();

export class ChangesTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private gitService: GitService) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        if (!element) {
            // Root level: show Unstaged and Staged sections
            const status = await this.gitService.getStatus();
            const unstagedCount = status.unstaged.length + status.untracked.length;
            const stagedCount = status.staged.length;

            return [
                new SectionItem('Unstaged Changes', unstagedCount, 'unstaged'),
                new SectionItem('Staged Changes', stagedCount, 'staged')
            ];
        }

        if (element instanceof SectionItem) {
            const status = await this.gitService.getStatus();
            const files = element.section === 'unstaged'
                ? [...status.unstaged, ...status.untracked]
                : status.staged;

            return this.buildFileTree(files, element.section);
        }

        if (element instanceof FolderItem) {
            return element.children;
        }

        return [];
    }

    private buildFileTree(files: FileChange[], section: 'unstaged' | 'staged'): TreeItem[] {
        const tree: Map<string, FolderItem> = new Map();
        const rootItems: TreeItem[] = [];

        files.forEach(fileChange => {
            const filePath = fileChange.path;
            const parts = filePath.split('/');

            if (parts.length === 1) {
                // File in root
                rootItems.push(new FileItem(filePath, filePath, section, fileChange.status));
            } else {
                // File in folder(s)
                let currentPath = '';
                let parentFolder: FolderItem | null = null;

                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    currentPath = currentPath ? `${currentPath}/${part}` : part;

                    let folder = tree.get(currentPath);
                    if (!folder) {
                        folder = new FolderItem(part, currentPath);
                        tree.set(currentPath, folder);

                        if (parentFolder) {
                            parentFolder.children.push(folder);
                        } else {
                            rootItems.push(folder);
                        }
                    }

                    parentFolder = folder;
                }

                // Add the file
                const fileItem = new FileItem(parts[parts.length - 1], filePath, section, fileChange.status);
                if (parentFolder) {
                    parentFolder.children.push(fileItem);
                } else {
                    rootItems.push(fileItem);
                }
            }
        });

        // Sort root items and recursively sort all folder children
        this.sortTreeItemsRecursive(rootItems);
        return rootItems;
    }

    private sortTreeItemsRecursive(items: TreeItem[]): void {
        items.sort((a, b) => {
            // Folders first
            if (a instanceof FolderItem && !(b instanceof FolderItem)) return -1;
            if (!(a instanceof FolderItem) && b instanceof FolderItem) return 1;

            // Then alphabetically
            const labelA = typeof a.label === 'string' ? a.label : '';
            const labelB = typeof b.label === 'string' ? b.label : '';
            return labelA.localeCompare(labelB);
        });

        // Recursively sort children of folders
        items.forEach(item => {
            if (item instanceof FolderItem && item.children.length > 0) {
                this.sortTreeItemsRecursive(item.children);
            }
        });
    }
}

class TreeItem extends vscode.TreeItem { }

class SectionItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly count: number,
        public readonly section: 'unstaged' | 'staged'
    ) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.description = count > 0 ? `${count}` : '';
        this.contextValue = section;
        // 不设置图标
    }
}

class FolderItem extends TreeItem {
    public children: TreeItem[] = [];

    constructor(
        public readonly label: string,
        public readonly folderPath: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.contextValue = 'folder';
        // 使用文件夹图标
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}

class FileItem extends TreeItem {
    constructor(
        public readonly fileName: string,
        public readonly filePath: string,
        public readonly section: 'unstaged' | 'staged',
        public readonly status: FileChange['status']
    ) {
        super(fileName, vscode.TreeItemCollapsibleState.None);

        this.contextValue = section === 'unstaged' ? 'unstagedFile' : 'stagedFile';
        this.resourceUri = vscode.Uri.file(filePath);
        this.command = {
            command: 'gitGui.openDiff',
            title: 'Open Diff',
            arguments: [filePath, section === 'staged']
        };

        // 设置带颜色的图标和标签
        this.applyStatusDecoration();
    }

    private applyStatusDecoration(): void {
        // 使用 ThemeColor 设置图标颜色
        const colorMap: Record<FileChange['status'], vscode.ThemeColor> = {
            'added': new vscode.ThemeColor('gitDecoration.addedResourceForeground'),
            'modified': new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'),
            'deleted': new vscode.ThemeColor('gitDecoration.deletedResourceForeground'),
            'renamed': new vscode.ThemeColor('gitDecoration.renamedResourceForeground'),
            'untracked': new vscode.ThemeColor('gitDecoration.untrackedResourceForeground')
        };

        // 使用不同的图标表示不同状态
        const iconMap: Record<FileChange['status'], string> = {
            'added': 'diff-added',
            'modified': 'diff-modified',
            'deleted': 'diff-removed',
            'renamed': 'diff-renamed',
            'untracked': 'diff-added'
        };

        // 设置带颜色的图标
        this.iconPath = new vscode.ThemeIcon(iconMap[this.status], colorMap[this.status]);

        // 添加状态标签和前缀
        const statusPrefix: Record<FileChange['status'], string> = {
            'added': '[A] ',
            'modified': '[M] ',
            'deleted': '[D] ',
            'renamed': '[R] ',
            'untracked': '[U] '
        };

        // 修改 label 添加前缀
        this.label = statusPrefix[this.status] + this.fileName;

        // 添加描述标签
        if (this.status === 'deleted') {
            this.description = '(deleted)';
        } else if (this.status === 'renamed') {
            this.description = '(renamed)';
        } else if (this.status === 'added' || this.status === 'untracked') {
            this.description = '(new)';
        }
    }
}
