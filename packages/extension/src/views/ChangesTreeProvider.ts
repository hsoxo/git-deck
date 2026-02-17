import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from '../git/GitService';
import type { FileChange } from '@git-gui/shared';

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
        public readonly label: string,
        public readonly filePath: string,
        public readonly section: 'unstaged' | 'staged',
        public readonly status: FileChange['status']
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = section === 'unstaged' ? 'unstagedFile' : 'stagedFile';
        this.resourceUri = vscode.Uri.file(filePath);
        this.command = {
            command: 'gitGui.openDiff',
            title: 'Open Diff',
            arguments: [filePath, section === 'staged']
        };

        // 根据状态设置颜色和装饰
        this.applyStatusDecoration();
    }

    private applyStatusDecoration(): void {
        // 设置颜色
        const colorMap: Record<FileChange['status'], string> = {
            'added': 'gitDecoration.addedResourceForeground',      // 绿色 - 新增
            'modified': 'gitDecoration.modifiedResourceForeground', // 橙色 - 修改
            'deleted': 'gitDecoration.deletedResourceForeground',   // 红色 - 删除
            'renamed': 'gitDecoration.renamedResourceForeground',   // 蓝色 - 重命名
            'untracked': 'gitDecoration.untrackedResourceForeground' // 绿色 - 未跟踪
        };

        this.iconPath = new vscode.ThemeIcon(
            'file',
            new vscode.ThemeColor(colorMap[this.status])
        );

        // 对于删除的文件，添加删除线
        if (this.status === 'deleted') {
            this.description = '(deleted)';
            // VS Code 不直接支持删除线，但我们可以通过 description 来标注
        }

        // 对于重命名的文件，显示旧路径
        if (this.status === 'renamed') {
            this.description = '(renamed)';
        }

        // 对于新增的文件，添加标注
        if (this.status === 'added' || this.status === 'untracked') {
            this.description = '(new)';
        }
    }
}
