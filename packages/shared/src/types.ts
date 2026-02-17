// Git 状态相关类型
export interface GitStatus {
    staged: string[];
    unstaged: string[];
    untracked: string[];
    current: string | null;
    tracking: string | null;
}

export interface FileChange {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
    oldPath?: string;
}

// Commit 相关类型
export interface CommitNode {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    email: string;
    date: Date;
    parents: string[];
    refs: string[];
    isHead: boolean;
    graph?: string;
    author_name?: string;
    author_email?: string;
}

export interface CommitDetails extends CommitNode {
    body: string;
    filesChanged: FileChange[];
}

// 分支相关类型
export interface BranchInfo {
    name: string;
    current: boolean;
    remote: boolean;
    tracking?: string;
    ahead?: number;
    behind?: number;
}

// 标签相关类型
export interface TagInfo {
    name: string;
    hash: string;
    date: Date;
    message?: string;
    tagger?: string;
}

// Remote 相关类型
export interface RemoteInfo {
    name: string;
    fetchUrl: string;
    pushUrl: string;
}

// Stash 相关类型
export interface StashInfo {
    index: number;
    message: string;
    hash: string;
    date: Date;
}

// 操作状态类型
export type RebaseState =
    | { type: 'idle' }
    | { type: 'in_progress'; current: number; total: number; onto: string }
    | { type: 'conflict'; files: string[] }
    | { type: 'completed' }
    | { type: 'aborted' };

export type CherryPickState =
    | { type: 'idle' }
    | { type: 'picking'; commits: string[]; current: number }
    | { type: 'conflict'; commit: string; files: string[] }
    | { type: 'completed' }
    | { type: 'aborted' };

export type GitOperationState = 'normal' | 'rebase' | 'cherry-pick' | 'merge';

// 图形渲染相关类型
export interface GraphNode {
    commit: CommitNode;
    x: number;
    y: number;
    color: string;
    lane: number;
}

export interface GraphEdge {
    from: string;
    to: string;
    path: Point[];
    color: string;
}

export interface Point {
    x: number;
    y: number;
}

// RPC 消息类型
export interface RPCRequest {
    id: number;
    method: string;
    params: any[];
}

export interface RPCResponse {
    id: number;
    result?: any;
    error?: string;
}

export interface RPCNotification {
    method: string;
    params: any[];
}

// Log 选项
export interface LogOptions {
    maxCount?: number;
    skip?: number;
    from?: string;
    to?: string;
    branch?: string;
}

// Diff 相关类型
export interface FileDiff {
    file: string;
    additions: number;
    deletions: number;
    changes: number;
    diff: string;
}

// Revert 状态类型
export type RevertState =
    | { type: 'idle' }
    | { type: 'in_progress'; commits: string[]; current: number }
    | { type: 'conflict'; commit: string; files: string[] }
    | { type: 'completed' }
    | { type: 'aborted' };
