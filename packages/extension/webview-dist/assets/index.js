var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { a as create, r as reactExports, j as jsxRuntimeExports, R as React, c as client } from "./vendor-cwqlfVzE.js";
import { g as getVsCodeApi, G as GitGraphView } from "./git-graph.js";
class RPCClient {
  // Request deduplication
  constructor() {
    __publicField(this, "vscode");
    __publicField(this, "requestId", 0);
    __publicField(this, "pending", /* @__PURE__ */ new Map());
    __publicField(this, "requestCache", /* @__PURE__ */ new Map());
    __publicField(this, "CACHE_TTL", 1e3);
    // 1 second cache
    __publicField(this, "MAX_CACHE_SIZE", 100);
    // Max cache entries
    __publicField(this, "REQUEST_TIMEOUT", 3e4);
    // 30 seconds
    __publicField(this, "inflightRequests", /* @__PURE__ */ new Map());
    console.log("[RPC Client] Initializing...");
    this.vscode = getVsCodeApi();
    if (this.vscode) {
      window.addEventListener("message", this.handleMessage.bind(this));
      console.log("[RPC Client] Initialized successfully");
      console.log("[RPC Client] VS Code API:", this.vscode);
    } else {
      console.error("[RPC Client] VS Code API is not available");
    }
  }
  async call(method, ...params) {
    if (!this.vscode) {
      console.error("[RPC Client] VS Code API not available, method:", method);
      throw new Error("VS Code API not available");
    }
    console.log("[RPC Client] Calling method:", method, "params:", params);
    if (this.isReadOnlyMethod(method)) {
      const cacheKey = this.getCacheKey(method, params);
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        cached.accessCount++;
        return cached.result;
      }
      const inflightKey = cacheKey;
      if (this.inflightRequests.has(inflightKey)) {
        return this.inflightRequests.get(inflightKey);
      }
      const promise = this.executeRequest(method, params, cacheKey);
      this.inflightRequests.set(inflightKey, promise);
      try {
        const result = await promise;
        return result;
      } finally {
        this.inflightRequests.delete(inflightKey);
      }
    }
    return this.executeRequest(method, params);
  }
  async executeRequest(method, params, cacheKey) {
    const id = ++this.requestId;
    const request = { id, method, params };
    console.log("[RPC Client] Executing request:", request);
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.error("[RPC Client] Request timeout:", method, "id:", id);
        this.pending.delete(id);
        reject(new Error(`RPC timeout: ${method}`));
      }, this.REQUEST_TIMEOUT);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeoutId);
          this.pending.delete(id);
          if (cacheKey && this.isReadOnlyMethod(method)) {
            this.evictCacheIfNeeded();
            this.requestCache.set(cacheKey, {
              result: value,
              timestamp: Date.now(),
              accessCount: 1
            });
          }
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          this.pending.delete(id);
          reject(error);
        }
      });
      console.log("[RPC Client] Posting message to extension:", request);
      this.vscode.postMessage(request);
    });
  }
  /**
   * Clear cache for specific method or all cache
   */
  clearCache(method) {
    if (method) {
      for (const key of this.requestCache.keys()) {
        if (key.startsWith(method)) {
          this.requestCache.delete(key);
        }
      }
    } else {
      this.requestCache.clear();
    }
  }
  /**
   * Evict cache entries using LFU (Least Frequently Used) strategy
   */
  evictCacheIfNeeded() {
    if (this.requestCache.size >= this.MAX_CACHE_SIZE) {
      let minAccessCount = Infinity;
      let leastUsedKey = null;
      for (const [key, entry] of this.requestCache.entries()) {
        if (entry.accessCount < minAccessCount) {
          minAccessCount = entry.accessCount;
          leastUsedKey = key;
        }
      }
      if (leastUsedKey) {
        this.requestCache.delete(leastUsedKey);
      }
    }
  }
  isReadOnlyMethod(method) {
    return method.startsWith("git.get") || method.startsWith("git.list") || method === "git.getStatus" || method === "git.getLog" || method === "git.getBranches";
  }
  getCacheKey(method, params) {
    return `${method}:${this.stableStringify(params)}`;
  }
  /**
   * Stable JSON stringify to avoid redundant serialization
   * Caches stringified params to reduce repeated stringify calls
   */
  stableStringify(obj) {
    if (obj === null || obj === void 0) {
      return String(obj);
    }
    if (typeof obj !== "object") {
      return String(obj);
    }
    if (Array.isArray(obj)) {
      return `[${obj.map((item) => this.stableStringify(item)).join(",")}]`;
    }
    const keys = Object.keys(obj).sort();
    const pairs = keys.map((k) => `"${k}":${this.stableStringify(obj[k])}`);
    return `{${pairs.join(",")}}`;
  }
  handleMessage(event) {
    const response = event.data;
    console.log("[RPC Client] Received message:", response);
    console.log("[RPC Client] Response details:", {
      id: response.id,
      hasError: !!response.error,
      hasResult: response.result !== void 0,
      resultType: typeof response.result
    });
    if (!response.id) {
      console.log("[RPC Client] Notification message received");
      return;
    }
    const pending = this.pending.get(response.id);
    if (!pending) {
      console.warn("[RPC Client] No pending request for id:", response.id);
      return;
    }
    if (response.error) {
      console.error("[RPC Client] Request failed:", response.error);
      pending.reject(new Error(response.error));
    } else {
      console.log("[RPC Client] Request succeeded, id:", response.id, "result:", response.result);
      pending.resolve(response.result);
    }
    this.pending.delete(response.id);
  }
}
const rpcClient = new RPCClient();
const useGitStore = create((set, get) => ({
  status: null,
  commits: [],
  branches: [],
  selectedCommits: [],
  loading: false,
  error: null,
  hasMore: true,
  searchQuery: null,
  currentBranch: null,
  remotes: [],
  fetchStatus: async () => {
    try {
      console.log("[GitStore] fetchStatus: starting...");
      set({ loading: true, error: null });
      const status = await rpcClient.call("git.getStatus");
      console.log("[GitStore] fetchStatus: received status:", status);
      set({ status, loading: false });
      console.log("[GitStore] fetchStatus: state updated");
    } catch (error) {
      console.error("[GitStore] fetchStatus: error:", error);
      set({ error: error.message, loading: false });
    }
  },
  fetchHistory: async (options = {}) => {
    try {
      console.log("[GitStore] fetchHistory: starting with options:", options);
      set({ loading: true, error: null });
      const commits = await rpcClient.call("git.getCommitLog", options);
      console.log("[GitStore] fetchHistory: received commits:", commits == null ? void 0 : commits.length, "commits");
      set({ commits, loading: false });
      console.log("[GitStore] fetchHistory: state updated");
    } catch (error) {
      console.error("[GitStore] fetchHistory: error:", error);
      set({ error: error.message, loading: false });
    }
  },
  fetchBranches: async () => {
    var _a;
    try {
      const branches = await rpcClient.call("git.getBranches");
      const currentBranch = ((_a = branches.find((b) => b.current)) == null ? void 0 : _a.name) || null;
      set({ branches, currentBranch });
    } catch (error) {
      set({ error: error.message });
    }
  },
  stageFiles: async (files) => {
    try {
      await rpcClient.call("git.stageFiles", files);
      await get().fetchStatus();
    } catch (error) {
      set({ error: error.message });
    }
  },
  unstageFiles: async (files) => {
    try {
      await rpcClient.call("git.unstageFiles", files);
      await get().fetchStatus();
    } catch (error) {
      set({ error: error.message });
    }
  },
  stageAll: async () => {
    try {
      await rpcClient.call("git.stageAll");
      await get().fetchStatus();
    } catch (error) {
      set({ error: error.message });
    }
  },
  unstageAll: async () => {
    try {
      await rpcClient.call("git.unstageAll");
      await get().fetchStatus();
    } catch (error) {
      set({ error: error.message });
    }
  },
  commit: async (message) => {
    try {
      await rpcClient.call("git.commit", message);
      await get().fetchStatus();
      await get().fetchHistory();
    } catch (error) {
      set({ error: error.message });
    }
  },
  discardFiles: async (files) => {
    try {
      await rpcClient.call("git.discard", files);
      await get().fetchStatus();
    } catch (error) {
      set({ error: error.message });
    }
  },
  selectCommit: (hash, multi) => {
    const { selectedCommits } = get();
    if (multi) {
      if (selectedCommits.includes(hash)) {
        set({ selectedCommits: selectedCommits.filter((h) => h !== hash) });
      } else {
        set({ selectedCommits: [...selectedCommits, hash] });
      }
    } else {
      set({ selectedCommits: [hash] });
    }
  },
  clearSelection: () => {
    set({ selectedCommits: [] });
  },
  amendCommit: async (message) => {
    try {
      await rpcClient.call("git.amendCommit", message);
      await get().fetchStatus();
      await get().fetchHistory();
    } catch (error) {
      set({ error: error.message });
    }
  },
  revertCommits: async (commits) => {
    try {
      await rpcClient.call("git.revert", commits);
      await get().fetchHistory();
    } catch (error) {
      set({ error: error.message });
    }
  },
  getFileDiff: async (file, staged = false) => {
    try {
      return await rpcClient.call("git.getFileDiff", file, staged);
    } catch (error) {
      set({ error: error.message });
      return "";
    }
  },
  searchCommits: async (query, type) => {
    try {
      set({ loading: true, error: null, searchQuery: query });
      let commits;
      if (type === "author") {
        commits = await rpcClient.call("git.getCommitsByAuthor", query, { maxCount: 100 });
      } else if (type === "hash") {
        const allCommits = get().commits;
        commits = allCommits.filter(
          (c) => c.hash.toLowerCase().includes(query.toLowerCase()) || c.shortHash.toLowerCase().includes(query.toLowerCase())
        );
      } else {
        commits = await rpcClient.call("git.searchCommits", query, { maxCount: 100 });
      }
      set({ commits, loading: false, hasMore: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  clearSearch: async () => {
    set({ searchQuery: null });
    await get().fetchHistory({ maxCount: 100 });
  },
  loadMore: async () => {
    const { commits, loading, hasMore, searchQuery } = get();
    if (loading || !hasMore || searchQuery) {
      return;
    }
    try {
      set({ loading: true });
      const newCommits = await rpcClient.call("git.getCommitLog", {
        maxCount: 50,
        skip: commits.length
      });
      if (newCommits.length === 0) {
        set({ hasMore: false, loading: false });
      } else {
        set({
          commits: [...commits, ...newCommits],
          loading: false,
          hasMore: newCommits.length === 50
        });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  startRebase: async (onto, interactive, commits) => {
    try {
      set({ loading: true, error: null });
      if (interactive && commits) {
        await rpcClient.call("git.interactiveRebase", onto, commits);
      } else {
        await rpcClient.call("git.rebase", onto, interactive);
      }
      await get().fetchHistory();
      await get().fetchStatus();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  continueRebase: async () => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.rebaseContinue");
      await get().fetchHistory();
      await get().fetchStatus();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  abortRebase: async () => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.rebaseAbort");
      await get().fetchHistory();
      await get().fetchStatus();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  skipRebase: async () => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.rebaseSkip");
      await get().fetchHistory();
      await get().fetchStatus();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  getRebaseState: async () => {
    try {
      return await rpcClient.call("git.getRebaseState");
    } catch (error) {
      set({ error: error.message });
      return { type: "idle" };
    }
  },
  isRebasing: async () => {
    try {
      return await rpcClient.call("git.isRebasing");
    } catch (error) {
      set({ error: error.message });
      return false;
    }
  },
  cherryPick: async (commits) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.cherryPick", commits);
      await get().fetchHistory();
      await get().fetchStatus();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  getStashes: async () => {
    try {
      return await rpcClient.call("git.stashList");
    } catch (error) {
      set({ error: error.message });
      return [];
    }
  },
  createStash: async (message, includeUntracked = false) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.stashPush", message, includeUntracked);
      await get().fetchStatus();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  applyStash: async (index) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.stashApply", index);
      await get().fetchStatus();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  popStash: async (index) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.stashPop", index);
      await get().fetchStatus();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  dropStash: async (index) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.stashDrop", index);
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  createBranch: async (name, startPoint) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.createBranch", name, startPoint);
      await get().fetchBranches();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  deleteBranch: async (name, force = false) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.deleteBranch", name, force);
      await get().fetchBranches();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  renameBranch: async (oldName, newName, force = false) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.renameBranch", oldName, newName, force);
      await get().fetchBranches();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  checkoutBranch: async (name, create2 = false) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.checkoutBranch", name, create2);
      await get().fetchBranches();
      await get().fetchStatus();
      await get().fetchHistory();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  mergeBranch: async (branch, noFastForward = false) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.mergeBranch", branch, noFastForward);
      await get().fetchHistory();
      await get().fetchStatus();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  // Remote operations
  fetchRemotes: async () => {
    try {
      set({ loading: true, error: null });
      const remotes = await rpcClient.call("git.listRemotes");
      set({ remotes, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  addRemote: async (name, url) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.addRemote", name, url);
      await get().fetchRemotes();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  removeRemote: async (name) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.removeRemote", name);
      await get().fetchRemotes();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  fetch: async (remote, prune) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.fetch", remote, prune);
      await get().fetchHistory();
      await get().fetchBranches();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  pull: async (remote, branch, rebase) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.pull", remote, branch, rebase);
      await get().fetchHistory();
      await get().fetchStatus();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  push: async (remote, branch, force, setUpstream) => {
    try {
      set({ loading: true, error: null });
      await rpcClient.call("git.push", remote, branch, force, setUpstream);
      await get().fetchBranches();
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
function DiffViewer({ file, staged = false, onClose }) {
  const [diff, setDiff] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(true);
  const { getFileDiff } = useGitStore();
  reactExports.useEffect(() => {
    loadDiff();
  }, [file, staged]);
  const loadDiff = async () => {
    setLoading(true);
    const result = await getFileDiff(file, staged);
    setDiff(result);
    setLoading(false);
  };
  const parseDiff = (diffText) => {
    const lines = diffText.split("\n");
    return lines.map((line, index) => {
      let className = "diff-line";
      if (line.startsWith("+") && !line.startsWith("+++")) {
        className += " diff-addition";
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        className += " diff-deletion";
      } else if (line.startsWith("@@")) {
        className += " diff-hunk";
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className, children: line || " " }, index);
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "diff-viewer-overlay", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "diff-viewer", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "diff-viewer-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: file }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "diff-viewer-badge", children: staged ? "Staged" : "Unstaged" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "diff-viewer-close", onClick: onClose, children: "×" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "diff-viewer-content", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "diff-viewer-loading", children: "Loading diff..." }) : diff ? /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "diff-viewer-pre", children: parseDiff(diff) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "diff-viewer-empty", children: "No changes" }) })
  ] }) });
}
function FileList({
  files,
  onAction,
  actionLabel,
  onDiscard,
  staged = false
}) {
  const [selectedFiles, setSelectedFiles] = reactExports.useState(/* @__PURE__ */ new Set());
  const [diffFile, setDiffFile] = reactExports.useState(null);
  const handleFileClick = (file, event) => {
    if (event.ctrlKey || event.metaKey) {
      const newSelection = new Set(selectedFiles);
      if (newSelection.has(file)) {
        newSelection.delete(file);
      } else {
        newSelection.add(file);
      }
      setSelectedFiles(newSelection);
    } else {
      setSelectedFiles(/* @__PURE__ */ new Set([file]));
    }
  };
  const handleFileDblClick = (file) => {
    setDiffFile(file);
  };
  const handleAction = (file) => {
    onAction([file]);
    setSelectedFiles(/* @__PURE__ */ new Set());
  };
  const handleActionSelected = () => {
    if (selectedFiles.size > 0) {
      onAction(Array.from(selectedFiles));
      setSelectedFiles(/* @__PURE__ */ new Set());
    }
  };
  const handleDiscard = (file) => {
    if (onDiscard) {
      onDiscard([file]);
      setSelectedFiles(/* @__PURE__ */ new Set());
    }
  };
  const handleDiscardSelected = () => {
    if (onDiscard && selectedFiles.size > 0) {
      onDiscard(Array.from(selectedFiles));
      setSelectedFiles(/* @__PURE__ */ new Set());
    }
  };
  if (files.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "file-list-empty", children: "No changes" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "file-list", children: [
      selectedFiles.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "file-list-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleActionSelected, children: [
          actionLabel,
          " ",
          selectedFiles.size,
          " file(s)"
        ] }),
        onDiscard && !staged && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "file-list-discard", onClick: handleDiscardSelected, children: [
          "Discard ",
          selectedFiles.size,
          " file(s)"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "file-list-items", children: files.map((file) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `file-item ${selectedFiles.has(file) ? "selected" : ""}`,
          onClick: (e) => handleFileClick(file, e),
          onDoubleClick: () => handleFileDblClick(file),
          title: "Double-click to view diff",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "file-name", children: file }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "file-actions", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "file-action",
                  onClick: (e) => {
                    e.stopPropagation();
                    handleAction(file);
                  },
                  children: actionLabel
                }
              ),
              onDiscard && !staged && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "file-action file-action-discard",
                  onClick: (e) => {
                    e.stopPropagation();
                    handleDiscard(file);
                  },
                  children: "Discard"
                }
              )
            ] })
          ]
        },
        file
      )) })
    ] }),
    diffFile && /* @__PURE__ */ jsxRuntimeExports.jsx(DiffViewer, { file: diffFile, staged, onClose: () => setDiffFile(null) })
  ] });
}
function CommitBox() {
  const [message, setMessage] = reactExports.useState("");
  const [isAmend, setIsAmend] = reactExports.useState(false);
  const [showMenu, setShowMenu] = reactExports.useState(false);
  const menuRef = reactExports.useRef(null);
  const { status, commit, amendCommit, commits } = useGitStore();
  reactExports.useEffect(() => {
    if (isAmend && commits.length > 0) {
      setMessage(commits[0].message);
    } else if (!isAmend) {
      setMessage("");
    }
  }, [isAmend, commits]);
  reactExports.useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);
  const handleCommit = async () => {
    if (message.trim()) {
      if (isAmend) {
        await amendCommit(message);
      } else {
        if (status && status.staged.length > 0) {
          await commit(message);
        }
      }
      setMessage("");
      setIsAmend(false);
    }
  };
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleCommit();
    }
  };
  const canCommit = message.trim().length > 0 && (isAmend || status && status.staged.length > 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-box", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Commit Message" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-options", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "commit-amend-label", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: isAmend,
              onChange: (e) => setIsAmend(e.target.checked),
              disabled: commits.length === 0
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Amend last commit" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-hint", children: "Ctrl+Enter to commit" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        className: "commit-message",
        placeholder: isAmend ? "Edit commit message..." : "Enter commit message...",
        value: message,
        onChange: (e) => setMessage(e.target.value),
        onKeyDown: handleKeyDown,
        rows: 4
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-footer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-info", children: isAmend ? "Amending last commit" : `${(status == null ? void 0 : status.staged.length) || 0} file(s) staged` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-button-group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "commit-button", onClick: handleCommit, disabled: !canCommit, children: isAmend ? "Amend Commit" : "Commit" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-menu-container", ref: menuRef, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "commit-menu-button",
              onClick: () => setShowMenu(!showMenu),
              disabled: !canCommit,
              "aria-label": "Commit options",
              children: "▼"
            }
          ),
          showMenu && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-dropdown-menu", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "commit-menu-item",
                onClick: () => {
                  handleCommit();
                  setShowMenu(false);
                },
                children: "Commit"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "commit-menu-item",
                onClick: () => {
                  setIsAmend(true);
                  setShowMenu(false);
                },
                children: "Commit & Amend"
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StagePanel() {
  const { status, stageFiles, unstageFiles, stageAll, unstageAll, discardFiles } = useGitStore();
  if (!status) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "stage-panel", children: "Loading..." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stage-panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stage-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "section-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Unstaged Changes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: stageAll, disabled: status.unstaged.length === 0, children: "Stage All" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FileList,
        {
          files: [...status.unstaged, ...status.untracked],
          onAction: stageFiles,
          onDiscard: discardFiles,
          actionLabel: "Stage",
          staged: false
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stage-section", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "section-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Staged Changes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: unstageAll, disabled: status.staged.length === 0, children: "Unstage All" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FileList,
        {
          files: status.staged,
          onAction: unstageFiles,
          actionLabel: "Unstage",
          staged: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CommitBox, {})
  ] });
}
function RevertDialog({ commits, onClose }) {
  const [loading, setLoading] = reactExports.useState(false);
  const { revertCommits } = useGitStore();
  const handleRevert = async () => {
    setLoading(true);
    try {
      await revertCommits(commits.map((c) => c.hash));
      onClose();
    } catch (error) {
      console.error("Revert failed:", error);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "revert-dialog-overlay", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "revert-dialog", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "revert-dialog-header", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { children: [
      "Revert Commit",
      commits.length > 1 ? "s" : ""
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "revert-dialog-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "Are you sure you want to revert the following commit",
        commits.length > 1 ? "s" : "",
        "?"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "revert-dialog-commits", children: commits.map((commit) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "revert-dialog-commit", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "revert-dialog-commit-hash", children: commit.shortHash }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "revert-dialog-commit-message", children: commit.message })
      ] }, commit.hash)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "revert-dialog-note", children: [
        "This will create new commit",
        commits.length > 1 ? "s" : "",
        " that undo",
        commits.length === 1 ? "es" : "",
        " these changes."
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "revert-dialog-footer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, disabled: loading, children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "revert-dialog-confirm",
          onClick: handleRevert,
          disabled: loading,
          children: loading ? "Reverting..." : "Revert"
        }
      )
    ] })
  ] }) });
}
const RebaseDialog = ({
  currentBranch,
  branches,
  onClose,
  onSuccess
}) => {
  const [selectedBranch, setSelectedBranch] = reactExports.useState("");
  const [commits, setCommits] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [interactive, setInteractive] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!selectedBranch) {
      setCommits([]);
      return;
    }
    const loadCommits = async () => {
      try {
        const rebaseCommits = await rpcClient.call("git.getRebaseCommits", selectedBranch);
        setCommits(rebaseCommits);
      } catch (err) {
        console.error("Failed to load rebase commits:", err);
        setCommits([]);
      }
    };
    loadCommits();
  }, [selectedBranch]);
  const handleRebase = async () => {
    if (!selectedBranch) {
      setError("Please select a branch");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (interactive && commits.length > 0) {
        await rpcClient.call("git.interactiveRebase", selectedBranch, commits);
      } else {
        await rpcClient.call("git.rebase", selectedBranch, false);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleActionChange = (index, action) => {
    const newCommits = [...commits];
    newCommits[index].action = action;
    setCommits(newCommits);
  };
  const moveCommitUp = (index) => {
    if (index === 0) {
      return;
    }
    const newCommits = [...commits];
    [newCommits[index - 1], newCommits[index]] = [newCommits[index], newCommits[index - 1]];
    setCommits(newCommits);
  };
  const moveCommitDown = (index) => {
    if (index === commits.length - 1) {
      return;
    }
    const newCommits = [...commits];
    [newCommits[index], newCommits[index + 1]] = [newCommits[index + 1], newCommits[index]];
    setCommits(newCommits);
  };
  const availableBranches = branches.filter((b) => !b.current);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rebase-dialog-overlay", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rebase-dialog", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rebase-dialog-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Rebase Branch" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "close-button", onClick: onClose, children: "×" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rebase-dialog-content", children: [
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "error-message", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "Current Branch:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "current-branch", children: currentBranch })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "Rebase onto:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: selectedBranch,
            onChange: (e) => setSelectedBranch(e.target.value),
            disabled: loading,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select a branch..." }),
              availableBranches.map((branch) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: branch.name, children: branch.name }, branch.name))
            ]
          }
        )
      ] }),
      commits.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "form-group", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: interactive,
              onChange: (e) => setInteractive(e.target.checked),
              disabled: loading
            }
          ),
          "Interactive Rebase"
        ] }) }),
        interactive && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commits-list", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commits-header", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Commits to rebase (",
            commits.length,
            ")"
          ] }) }),
          commits.map((commit, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-controls", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "move-button",
                  onClick: () => moveCommitUp(index),
                  disabled: index === 0 || loading,
                  title: "Move up",
                  children: "↑"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "move-button",
                  onClick: () => moveCommitDown(index),
                  disabled: index === commits.length - 1 || loading,
                  title: "Move down",
                  children: "↓"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                className: "action-select",
                value: commit.action,
                onChange: (e) => handleActionChange(
                  index,
                  e.target.value
                ),
                disabled: loading,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pick", children: "pick" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "reword", children: "reword" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "edit", children: "edit" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "squash", children: "squash" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fixup", children: "fixup" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "drop", children: "drop" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-hash", children: commit.shortHash }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-message", children: commit.message })
          ] }, commit.hash))
        ] }),
        !interactive && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "info-message", children: [
          commits.length,
          " commit",
          commits.length !== 1 ? "s" : "",
          " will be rebased"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rebase-dialog-footer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "button button-secondary",
          onClick: onClose,
          disabled: loading,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "button button-primary",
          onClick: handleRebase,
          disabled: !selectedBranch || loading,
          children: loading ? "Rebasing..." : "Start Rebase"
        }
      )
    ] })
  ] }) });
};
const CherryPickDialog = ({
  commits,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const handleCherryPick = async () => {
    setLoading(true);
    setError(null);
    try {
      const hashes = commits.map((c) => c.hash);
      await rpcClient.call("git.cherryPick", hashes);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "cherry-pick-dialog-overlay", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cherry-pick-dialog", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cherry-pick-dialog-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Cherry-pick Commits" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "close-button", onClick: onClose, children: "×" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cherry-pick-dialog-content", children: [
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "error-message", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "info-message", children: [
        "Cherry-pick will apply the following ",
        commits.length,
        " commit",
        commits.length !== 1 ? "s" : "",
        " to the current branch:"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commits-list", children: commits.map((commit) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-item", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-hash", children: commit.shortHash }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-message", children: commit.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-author", children: commit.author })
      ] }, commit.hash)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "warning-message", children: "Note: If conflicts occur, you will need to resolve them manually." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "cherry-pick-dialog-footer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "button button-secondary",
          onClick: onClose,
          disabled: loading,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "button button-primary",
          onClick: handleCherryPick,
          disabled: loading,
          children: loading ? "Cherry-picking..." : "Cherry-pick"
        }
      )
    ] })
  ] }) });
};
function CommitList({ commits, branches, currentBranch }) {
  const { selectedCommits, selectCommit } = useGitStore();
  const [showRevertDialog, setShowRevertDialog] = reactExports.useState(false);
  const [showRebaseDialog, setShowRebaseDialog] = reactExports.useState(false);
  const [showCherryPickDialog, setShowCherryPickDialog] = reactExports.useState(false);
  const [contextMenu, setContextMenu] = reactExports.useState(null);
  const handleCommitClick = (hash, event) => {
    const multi = event.ctrlKey || event.metaKey;
    selectCommit(hash, multi);
  };
  const handleContextMenu = (event, commit) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, commit });
  };
  const handleRevert = () => {
    setShowRevertDialog(true);
    setContextMenu(null);
  };
  const handleRebase = () => {
    setShowRebaseDialog(true);
    setContextMenu(null);
  };
  const handleCherryPick = () => {
    setShowCherryPickDialog(true);
    setContextMenu(null);
  };
  const formatDate = (date) => {
    const d = new Date(date);
    const now = /* @__PURE__ */ new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
    if (days === 0) {
      const hours = Math.floor(diff / (1e3 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1e3 * 60));
        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
      }
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else if (days === 1) {
      return "yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return d.toLocaleDateString();
    }
  };
  const getSelectedCommitObjects = () => {
    return commits.filter((c) => selectedCommits.includes(c.hash));
  };
  if (commits.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-list-empty", children: "No commits yet" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-list", onClick: () => setContextMenu(null), children: commits.map((commit) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `commit-item ${selectedCommits.includes(commit.hash) ? "selected" : ""} ${commit.isHead ? "head" : ""}`,
        onClick: (e) => handleCommitClick(commit.hash, e),
        onContextMenu: (e) => handleContextMenu(e, commit),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-graph", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-dot" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-line" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-content", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-message", children: commit.message }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-meta", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-author", children: commit.author }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-separator", children: "•" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-hash", children: commit.shortHash }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-separator", children: "•" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-date", children: formatDate(commit.date) })
            ] }),
            commit.refs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-refs", children: commit.refs.map((ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-ref", children: ref }, ref)) })
          ] })
        ]
      },
      commit.hash
    )) }),
    contextMenu && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "commit-context-menu",
        style: { top: contextMenu.y, left: contextMenu.x },
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-context-menu-item", onClick: handleCherryPick, children: [
            "Cherry-pick Commit",
            selectedCommits.length > 1 ? "s" : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-context-menu-item", onClick: handleRevert, children: [
            "Revert Commit",
            selectedCommits.length > 1 ? "s" : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-context-menu-item", onClick: handleRebase, children: "Rebase onto this Commit" })
        ]
      }
    ),
    showRevertDialog && /* @__PURE__ */ jsxRuntimeExports.jsx(
      RevertDialog,
      {
        commits: getSelectedCommitObjects(),
        onClose: () => setShowRevertDialog(false)
      }
    ),
    showRebaseDialog && /* @__PURE__ */ jsxRuntimeExports.jsx(
      RebaseDialog,
      {
        currentBranch,
        branches,
        onClose: () => setShowRebaseDialog(false),
        onSuccess: () => {
          setShowRebaseDialog(false);
        }
      }
    ),
    showCherryPickDialog && /* @__PURE__ */ jsxRuntimeExports.jsx(
      CherryPickDialog,
      {
        commits: getSelectedCommitObjects(),
        onClose: () => setShowCherryPickDialog(false),
        onSuccess: () => {
          setShowCherryPickDialog(false);
        }
      }
    )
  ] });
}
class GraphLayoutEngine {
  constructor() {
    __publicField(this, "ROW_HEIGHT", 50);
    // 每行高度
    __publicField(this, "COLUMN_WIDTH", 30);
    // 每列宽度
    __publicField(this, "NODE_RADIUS", 5);
    // 节点半径
    __publicField(this, "MAX_CACHE_SIZE", 50);
    // 最大缓存条目数
    __publicField(this, "CACHE_TTL", 6e4);
    // 缓存过期时间 (60秒)
    __publicField(this, "layoutCache", /* @__PURE__ */ new Map());
    __publicField(this, "colors", [
      "#4285F4",
      // Blue
      "#EA4335",
      // Red
      "#FBBC04",
      // Yellow
      "#34A853",
      // Green
      "#FF6D00",
      // Orange
      "#9C27B0",
      // Purple
      "#00BCD4",
      // Cyan
      "#E91E63"
      // Pink
    ]);
  }
  /**
   * 计算完整的图形布局（带缓存）
   */
  calculateLayout(commits) {
    if (commits.length === 0) {
      return { nodes: /* @__PURE__ */ new Map(), edges: [], lanes: 0, height: 0 };
    }
    const cacheKey = this.getCacheKey(commits);
    const cached = this.layoutCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      cached.accessCount++;
      return cached.result;
    }
    const result = this.calculateLayoutInternal(commits);
    this.cacheResult(cacheKey, result);
    return result;
  }
  /**
   * 内部布局计算（无缓存）
   */
  calculateLayoutInternal(commits) {
    const childrenMap = this.buildChildrenMap(commits);
    const laneAssignments = this.assignLanes(commits, childrenMap);
    const nodes = this.calculateNodePositions(commits, laneAssignments);
    const edges = this.calculateEdges(commits, nodes);
    const lanes = Math.max(...Array.from(laneAssignments.values())) + 1;
    const height = commits.length * this.ROW_HEIGHT;
    return { nodes, edges, lanes, height };
  }
  /**
   * 生成缓存键
   */
  getCacheKey(commits) {
    const start = commits.slice(0, Math.min(10, commits.length));
    const end = commits.slice(Math.max(0, commits.length - 10));
    const hashes = [...start, ...end].map((c) => c.hash);
    return `${commits.length}:${hashes.join(",")}`;
  }
  /**
   * 缓存结果（带LRU淘汰）
   */
  cacheResult(key, result) {
    if (this.layoutCache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRU();
    }
    this.layoutCache.set(key, {
      result,
      timestamp: Date.now(),
      accessCount: 1
    });
  }
  /**
   * LRU淘汰策略
   */
  evictLRU() {
    let oldestKey = null;
    let oldestScore = Infinity;
    for (const [key, entry] of this.layoutCache.entries()) {
      const score = entry.timestamp / Math.max(1, entry.accessCount);
      if (score < oldestScore) {
        oldestScore = score;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.layoutCache.delete(oldestKey);
    }
  }
  /**
   * 清除缓存
   */
  clearCache() {
    this.layoutCache.clear();
  }
  /**
   * 获取缓存统计
   */
  getCacheStats() {
    let totalAccess = 0;
    let totalHits = 0;
    for (const entry of this.layoutCache.values()) {
      totalAccess += entry.accessCount;
      if (entry.accessCount > 1) {
        totalHits += entry.accessCount - 1;
      }
    }
    return {
      size: this.layoutCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: totalAccess > 0 ? totalHits / totalAccess : 0
    };
  }
  /**
   * 构建父子关系映射 (O(n) 优化版本)
   */
  buildChildrenMap(commits) {
    const childrenMap = /* @__PURE__ */ new Map();
    for (const commit of commits) {
      for (const parent of commit.parents) {
        let children = childrenMap.get(parent);
        if (!children) {
          children = [];
          childrenMap.set(parent, children);
        }
        children.push(commit);
      }
    }
    return childrenMap;
  }
  /**
   * 为每个 commit 分配泳道 (优化版本)
   * 使用贪心算法，尽量复用泳道，避免 O(n²) 复杂度
   */
  assignLanes(commits, childrenMap) {
    const laneAssignments = /* @__PURE__ */ new Map();
    const activeLanes = /* @__PURE__ */ new Map();
    const commitIndex = /* @__PURE__ */ new Map();
    commits.forEach((commit, index) => {
      commitIndex.set(commit.hash, index);
    });
    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      let assignedLane = null;
      if (commit.parents.length > 0) {
        const firstParent = commit.parents[0];
        const parentLane = laneAssignments.get(firstParent);
        if (parentLane !== void 0 && !activeLanes.has(parentLane)) {
          assignedLane = parentLane;
        }
      }
      if (assignedLane === null) {
        assignedLane = 0;
        while (activeLanes.has(assignedLane)) {
          assignedLane++;
        }
      }
      laneAssignments.set(commit.hash, assignedLane);
      activeLanes.set(assignedLane, commit.hash);
      const children = childrenMap.get(commit.hash);
      if (children) {
        const allChildrenProcessed = children.every((child) => {
          const childIdx = commitIndex.get(child.hash);
          return childIdx !== void 0 && childIdx <= i;
        });
        if (allChildrenProcessed) {
          const laneCommit = activeLanes.get(assignedLane);
          if (laneCommit === commit.hash) {
            activeLanes.delete(assignedLane);
          }
        }
      } else {
        const laneCommit = activeLanes.get(assignedLane);
        if (laneCommit === commit.hash) {
          activeLanes.delete(assignedLane);
        }
      }
    }
    return laneAssignments;
  }
  /**
   * 计算节点位置
   */
  calculateNodePositions(commits, laneAssignments) {
    const nodes = /* @__PURE__ */ new Map();
    commits.forEach((commit, index) => {
      const lane = laneAssignments.get(commit.hash) || 0;
      const color = this.colors[lane % this.colors.length];
      nodes.set(commit.hash, {
        commit,
        x: lane * this.COLUMN_WIDTH + this.COLUMN_WIDTH / 2,
        y: index * this.ROW_HEIGHT + this.ROW_HEIGHT / 2,
        color,
        lane
      });
    });
    return nodes;
  }
  /**
   * 计算连接线路径
   */
  calculateEdges(commits, nodes) {
    const edges = [];
    for (const commit of commits) {
      const fromNode = nodes.get(commit.hash);
      if (!fromNode) {
        continue;
      }
      for (const parentHash of commit.parents) {
        const toNode = nodes.get(parentHash);
        if (!toNode) {
          continue;
        }
        const path = this.calculateEdgePath(fromNode, toNode);
        edges.push({
          from: commit.hash,
          to: parentHash,
          path,
          color: fromNode.color
        });
      }
    }
    return edges;
  }
  /**
   * 计算两个节点之间的连接线路径
   */
  calculateEdgePath(from, to) {
    const path = [];
    path.push({ x: from.x, y: from.y });
    if (from.x === to.x) {
      path.push({ x: to.x, y: to.y });
      return path;
    }
    const midY = (from.y + to.y) / 2;
    path.push({ x: from.x, y: midY });
    path.push({ x: to.x, y: midY });
    path.push({ x: to.x, y: to.y });
    return path;
  }
  /**
   * 获取节点颜色
   */
  getColor(lane) {
    return this.colors[lane % this.colors.length];
  }
  /**
   * 获取布局配置
   */
  getConfig() {
    return {
      rowHeight: this.ROW_HEIGHT,
      columnWidth: this.COLUMN_WIDTH,
      nodeRadius: this.NODE_RADIUS,
      colors: this.colors
    };
  }
}
const graphLayoutEngine = new GraphLayoutEngine();
class CanvasRenderer {
  constructor(canvas) {
    __publicField(this, "ctx");
    __publicField(this, "scale", 1);
    __publicField(this, "offsetX", 0);
    __publicField(this, "offsetY", 0);
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = ctx;
    this.setupCanvas();
  }
  /**
   * 设置 Canvas
   */
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }
  /**
   * 清空画布
   */
  clear() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }
  /**
   * 渲染完整的图形
   */
  render(nodes, edges, selectedHashes = /* @__PURE__ */ new Set(), hoveredHash = null) {
    this.clear();
    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);
    for (const edge of edges) {
      this.drawEdge(edge);
    }
    for (const node of nodes.values()) {
      const isSelected = selectedHashes.has(node.commit.hash);
      const isHovered = node.commit.hash === hoveredHash;
      this.drawNode(node, isSelected, isHovered);
    }
    this.ctx.restore();
  }
  /**
   * 绘制连接线
   */
  drawEdge(edge) {
    if (edge.path.length < 2) {
      return;
    }
    this.ctx.beginPath();
    this.ctx.strokeStyle = edge.color;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.moveTo(edge.path[0].x, edge.path[0].y);
    if (edge.path.length === 2) {
      this.ctx.lineTo(edge.path[1].x, edge.path[1].y);
    } else {
      for (let i = 1; i < edge.path.length - 2; i += 2) {
        const cp1 = edge.path[i];
        const cp2 = edge.path[i + 1];
        const end = edge.path[i + 2] || edge.path[edge.path.length - 1];
        this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
      }
    }
    this.ctx.stroke();
  }
  /**
   * 绘制节点
   */
  drawNode(node, isSelected, isHovered) {
    const radius = 5;
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = node.color;
    this.ctx.fill();
    if (node.commit.isHead) {
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius + 3, 0, Math.PI * 2);
      this.ctx.strokeStyle = node.color;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    if (isSelected) {
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
      this.ctx.strokeStyle = "#FFD700";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    if (isHovered) {
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius + 7, 0, Math.PI * 2);
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    if (node.commit.refs.length > 0) {
      this.drawRefs(node);
    }
  }
  /**
   * 绘制 refs 标签
   */
  drawRefs(node) {
    const refs = node.commit.refs;
    let offsetX = node.x + 15;
    const y = node.y;
    for (const ref of refs) {
      let bgColor = "#666";
      let textColor = "#fff";
      if (ref.includes("HEAD")) {
        bgColor = "#4285F4";
      } else if (ref.startsWith("tag:")) {
        bgColor = "#FBBC04";
        textColor = "#000";
      } else if (ref.includes("origin/")) {
        bgColor = "#EA4335";
      }
      const text = ref.replace("tag: ", "");
      this.ctx.font = "11px sans-serif";
      const metrics = this.ctx.measureText(text);
      const padding = 4;
      const width = metrics.width + padding * 2;
      const height = 16;
      this.ctx.fillStyle = bgColor;
      this.ctx.fillRect(offsetX, y - height / 2, width, height);
      this.ctx.fillStyle = textColor;
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(text, offsetX + padding, y);
      offsetX += width + 5;
    }
  }
  /**
   * 设置缩放
   */
  setScale(scale) {
    this.scale = Math.max(0.5, Math.min(2, scale));
  }
  /**
   * 设置偏移
   */
  setOffset(x, y) {
    this.offsetX = x;
    this.offsetY = y;
  }
  /**
   * 获取鼠标位置对应的节点
   */
  getNodeAtPosition(x, y, nodes) {
    const transformedX = (x - this.offsetX) / this.scale;
    const transformedY = (y - this.offsetY) / this.scale;
    const radius = 5;
    for (const node of nodes.values()) {
      const dx = transformedX - node.x;
      const dy = transformedY - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius + 5) {
        return node;
      }
    }
    return null;
  }
  /**
   * 调整 Canvas 大小
   */
  resize() {
    this.setupCanvas();
  }
  /**
   * 销毁渲染器
   */
  destroy() {
    this.clear();
  }
}
const CommitGraph = ({
  commits,
  selectedHashes,
  onCommitClick,
  onCommitDoubleClick
}) => {
  const canvasRef = reactExports.useRef(null);
  const rendererRef = reactExports.useRef(null);
  const [hoveredHash, setHoveredHash] = reactExports.useState(null);
  const [layout, setLayout] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (commits.length === 0) {
      setLayout(null);
      return;
    }
    const newLayout = graphLayoutEngine.calculateLayout(commits);
    setLayout(newLayout);
  }, [commits]);
  reactExports.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    rendererRef.current = new CanvasRenderer(canvasRef.current);
    const handleResize = () => {
      var _a;
      (_a = rendererRef.current) == null ? void 0 : _a.resize();
      renderGraph();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      var _a;
      window.removeEventListener("resize", handleResize);
      (_a = rendererRef.current) == null ? void 0 : _a.destroy();
    };
  }, []);
  const renderGraph = () => {
    if (!layout || !rendererRef.current) {
      return;
    }
    const selectedSet = new Set(selectedHashes);
    rendererRef.current.render(layout.nodes, layout.edges, selectedSet, hoveredHash);
  };
  reactExports.useEffect(() => {
    renderGraph();
  }, [layout, selectedHashes, hoveredHash]);
  const handleMouseMove = (e) => {
    if (!layout || !rendererRef.current) {
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = rendererRef.current.getNodeAtPosition(x, y, layout.nodes);
    setHoveredHash(node ? node.commit.hash : null);
    canvasRef.current.style.cursor = node ? "pointer" : "default";
  };
  const handleMouseLeave = () => {
    setHoveredHash(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "default";
    }
  };
  const handleClick = (e) => {
    if (!layout || !rendererRef.current) {
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = rendererRef.current.getNodeAtPosition(x, y, layout.nodes);
    if (node) {
      onCommitClick(node.commit.hash, e.ctrlKey || e.metaKey);
    }
  };
  const handleDoubleClick = (e) => {
    if (!layout || !rendererRef.current) {
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = rendererRef.current.getNodeAtPosition(x, y, layout.nodes);
    if (node) {
      onCommitDoubleClick(node.commit.hash);
    }
  };
  const config = graphLayoutEngine.getConfig();
  const width = layout ? (layout.lanes + 1) * config.columnWidth : 100;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-graph", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      className: "commit-graph-canvas",
      style: { width: `${width}px` },
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      onClick: handleClick,
      onDoubleClick: handleDoubleClick
    }
  ) });
};
const CommitDetails = ({ commit, onClose }) => {
  const [files, setFiles] = reactExports.useState([]);
  const [stats, setStats] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!commit) {
      setFiles([]);
      setStats(null);
      return;
    }
    const loadDetails = async () => {
      setLoading(true);
      try {
        const [commitFiles, commitStats] = await Promise.all([
          rpcClient.call("git.getCommitFiles", commit.hash),
          rpcClient.call("git.getCommitStats", commit.hash)
        ]);
        setFiles(commitFiles);
        setStats(commitStats);
      } catch (error) {
        console.error("Failed to load commit details:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [commit]);
  if (!commit) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-details empty", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Select a commit to view details" }) });
  }
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-details", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-details-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Commit Details" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "close-button", onClick: onClose, title: "Close", children: "×" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-details-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "detail-label", children: "Hash:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "detail-value monospace", children: commit.hash })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "detail-label", children: "Author:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "detail-value", children: commit.author })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "detail-label", children: "Email:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "detail-value", children: commit.email })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "detail-label", children: "Date:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "detail-value", children: formatDate(commit.date) })
        ] }),
        commit.refs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "detail-label", children: "Refs:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "refs-list", children: commit.refs.map((ref, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ref-tag", children: ref }, index)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "Message" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-message", children: commit.message })
      ] }),
      stats && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "Changes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-stats", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "stat-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-label", children: "Files:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-value", children: stats.files })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "stat-item stat-additions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-label", children: "+" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-value", children: stats.insertions })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "stat-item stat-deletions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-label", children: "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-value", children: stats.deletions })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { children: [
          "Files Changed (",
          files.length,
          ")"
        ] }),
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading", children: "Loading files..." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "files-list", children: files.map((file, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "file-item", children: file }, index)) })
      ] }),
      commit.parents.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "detail-section", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { children: "Parents" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "parents-list", children: commit.parents.map((parent, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "parent-item monospace", children: parent.substring(0, 7) }, index)) })
      ] })
    ] })
  ] });
};
const SearchBar = ({ onSearch, onClear }) => {
  const [query, setQuery] = reactExports.useState("");
  const [searchType, setSearchType] = reactExports.useState("message");
  const handleSearch = reactExports.useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim(), searchType);
    }
  }, [query, searchType, onSearch]);
  const handleClear = reactExports.useCallback(() => {
    setQuery("");
    onClear();
  }, [onClear]);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      handleClear();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "search-bar", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "search-input-group", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "text",
          className: "search-input",
          placeholder: `Search by ${searchType}...`,
          value: query,
          onChange: (e) => setQuery(e.target.value),
          onKeyDown: handleKeyDown
        }
      ),
      query && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "clear-button", onClick: handleClear, title: "Clear search", children: "×" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "select",
      {
        className: "search-type-select",
        value: searchType,
        onChange: (e) => setSearchType(e.target.value),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "message", children: "Message" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "author", children: "Author" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "hash", children: "Hash" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "search-button", onClick: handleSearch, disabled: !query.trim(), children: "Search" })
  ] });
};
const VirtualScroll = ({
  itemCount,
  itemHeight,
  height,
  overscan = 5,
  children,
  onLoadMore,
  hasMore = false
}) => {
  const containerRef = reactExports.useRef(null);
  const [scrollTop, setScrollTop] = reactExports.useState(0);
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + height) / itemHeight);
  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(itemCount, visibleEnd + overscan);
  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;
  const handleScroll = reactExports.useCallback(
    (e) => {
      const target = e.currentTarget;
      setScrollTop(target.scrollTop);
      if (onLoadMore && hasMore) {
        const scrollBottom = target.scrollTop + target.clientHeight;
        const threshold = totalHeight - itemHeight * 10;
        if (scrollBottom >= threshold) {
          onLoadMore();
        }
      }
    },
    [onLoadMore, hasMore, totalHeight, itemHeight]
  );
  const scrollToIndex = reactExports.useCallback(
    (index, behavior = "smooth") => {
      if (containerRef.current) {
        const scrollTop2 = index * itemHeight;
        containerRef.current.scrollTo({
          top: scrollTop2,
          behavior
        });
      }
    },
    [itemHeight]
  );
  reactExports.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollToIndex = scrollToIndex;
    }
  }, [scrollToIndex]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: containerRef,
      className: "virtual-scroll-container",
      style: { height: `${height}px`, overflow: "auto" },
      onScroll: handleScroll,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "virtual-scroll-spacer", style: { height: `${totalHeight}px` }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "virtual-scroll-content",
          style: { transform: `translateY(${offsetY}px)` },
          children: children(startIndex, endIndex)
        }
      ) })
    }
  );
};
function HistoryPanel() {
  const {
    commits,
    branches,
    status,
    loading,
    selectedCommits,
    hasMore,
    searchQuery,
    fetchHistory,
    fetchBranches,
    selectCommit,
    searchCommits,
    clearSearch,
    loadMore
  } = useGitStore();
  const [selectedCommit, setSelectedCommit] = reactExports.useState(null);
  const [showDetails, setShowDetails] = reactExports.useState(false);
  reactExports.useEffect(() => {
    fetchHistory({ maxCount: 100 });
    fetchBranches();
  }, [fetchHistory, fetchBranches]);
  const handleCommitClick = (hash, multi) => {
    selectCommit(hash, multi);
    if (!multi) {
      const commit = commits.find((c) => c.hash === hash);
      if (commit) {
        setSelectedCommit(commit);
        setShowDetails(true);
      }
    }
  };
  const handleCommitDoubleClick = (hash) => {
    const commit = commits.find((c) => c.hash === hash);
    if (commit) {
      setSelectedCommit(commit);
      setShowDetails(true);
    }
  };
  const handleSearch = (query, type) => {
    searchCommits(query, type);
  };
  const handleClearSearch = () => {
    clearSearch();
  };
  const handleCloseDetails = () => {
    setShowDetails(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "history-panel", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "history-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Commit History" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "commit-count", children: [
        commits.length,
        " commits",
        searchQuery && " (filtered)"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SearchBar, { onSearch: handleSearch, onClear: handleClearSearch }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "history-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "history-main", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CommitGraph,
          {
            commits,
            selectedHashes: selectedCommits,
            onCommitClick: handleCommitClick,
            onCommitDoubleClick: handleCommitDoubleClick
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-list-container", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            VirtualScroll,
            {
              itemCount: commits.length,
              itemHeight: 50,
              height: 600,
              overscan: 10,
              onLoadMore: loadMore,
              hasMore: hasMore && !searchQuery,
              children: (startIndex, endIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                CommitList,
                {
                  commits: commits.slice(startIndex, endIndex),
                  branches,
                  currentBranch: (status == null ? void 0 : status.current) || "main",
                  startIndex
                }
              )
            }
          ),
          loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-indicator", children: "Loading more commits..." })
        ] })
      ] }),
      showDetails && /* @__PURE__ */ jsxRuntimeExports.jsx(CommitDetails, { commit: selectedCommit, onClose: handleCloseDetails })
    ] })
  ] });
}
function App() {
  const { fetchStatus, fetchHistory } = useGitStore();
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [view, setView] = reactExports.useState("main");
  console.log("[Git GUI App] Component mounted");
  reactExports.useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;
      if (message.type === "setView") {
        setView(message.view);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);
  reactExports.useEffect(() => {
    console.log("[Git GUI App] useEffect triggered for data loading");
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("[Git GUI App] Starting to load data...");
        const results = await Promise.all([
          fetchStatus().catch((err) => {
            console.error("[Git GUI App] Failed to fetch status:", err);
            throw new Error(`Failed to load git status: ${err.message || err}`);
          }),
          fetchHistory().catch((err) => {
            console.error("[Git GUI App] Failed to fetch history:", err);
            throw new Error(`Failed to load git history: ${err.message || err}`);
          })
        ]);
        console.log("[Git GUI App] Data loaded successfully, results:", results);
        console.log("[Git GUI App] Setting loading to false");
        setLoading(false);
      } catch (err) {
        console.error("[Git GUI App] Failed to load data:", err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };
    if (view === "main") {
      loadData();
    }
  }, [fetchStatus, fetchHistory, view]);
  reactExports.useEffect(() => {
    if (!loading) {
      const loadingEl = document.getElementById("loading");
      if (loadingEl) {
        loadingEl.style.display = "none";
      }
    }
  }, [loading]);
  if (view === "graph") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(GitGraphView, {});
  }
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-error", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "error-icon", children: "⚠️" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "Failed to Load Git GUI" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "error-message", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "error-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => window.location.reload(), children: "Reload" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "error-help", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Possible causes:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Not in a Git repository" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Git is not installed or not in PATH" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "No permission to access the repository" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Check the Output panel (View → Output → Git GUI) for more details." })
      ] })
    ] });
  }
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-loading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-spinner" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Loading Git repository..." })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "app-header", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "Git GUI" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "panel-container", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StagePanel, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "panel-container", children: /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryPanel, {}) })
    ] })
  ] });
}
console.log("[Git GUI Webview] Starting initialization...");
console.log("[Git GUI Webview] React version:", React.version);
console.log("[Git GUI Webview] Root element:", document.getElementById("root"));
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  console.log("[Git GUI Webview] Creating React root...");
  const root = client.createRoot(rootElement);
  console.log("[Git GUI Webview] Rendering App component...");
  root.render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
  );
  console.log("[Git GUI Webview] App rendered successfully");
  setTimeout(() => {
    const loading = document.getElementById("loading");
    if (loading) {
      loading.style.display = "none";
      console.log("[Git GUI Webview] Loading screen hidden");
    }
  }, 100);
} catch (error) {
  console.error("[Git GUI Webview] Initialization error:", error);
  const errorContainer = document.getElementById("error");
  const errorMessage = document.getElementById("error-message");
  const loading = document.getElementById("loading");
  if (loading)
    loading.style.display = "none";
  if (errorContainer)
    errorContainer.style.display = "flex";
  if (errorMessage)
    errorMessage.textContent = error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=index.js.map
