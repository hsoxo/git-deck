import { r as reactExports, j as jsxRuntimeExports, c as client, R as React } from "./vendor-cwqlfVzE.js";
function getVsCodeApi() {
  if (window.__vscodeApi) {
    return window.__vscodeApi;
  }
  const acquireVsCodeApi = window.acquireVsCodeApi;
  if (acquireVsCodeApi) {
    try {
      window.__vscodeApi = acquireVsCodeApi();
    } catch (error) {
      console.warn("[vscodeApi] Failed to acquire, checking if already available:", error);
      if (window.__vscodeApi) {
        return window.__vscodeApi;
      }
      throw error;
    }
  }
  return window.__vscodeApi;
}
const GitGraphToolbar = reactExports.memo(function GitGraphToolbar2({
  branches,
  currentBranch,
  selectedBranch,
  onRefresh,
  onBranchChange,
  onCheckout,
  onMerge,
  onRebase
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "git-graph-toolbar", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onRefresh, className: "toolbar-button", children: "Refresh" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "select",
      {
        className: "branch-selector",
        value: selectedBranch,
        onChange: (e) => onBranchChange(e.target.value),
        children: branches.map((branch) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: branch.name, children: [
          branch.name,
          branch.name === currentBranch ? " (current)" : ""
        ] }, branch.name))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onCheckout, className: "toolbar-button", children: "Checkout" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onMerge, className: "toolbar-button", children: "Merge" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onRebase, className: "toolbar-button", children: "Rebase" })
  ] });
});
const GitGraphCommitRow = reactExports.memo(function GitGraphCommitRow2({
  commit,
  currentBranch,
  onContextMenu,
  style
}) {
  var _a;
  const branchRefs = ((_a = commit.refs) == null ? void 0 : _a.filter((r) => !r.includes("tag:"))) || [];
  const isCurrentBranch = branchRefs.some((b) => b.includes(currentBranch || ""));
  const graphDisplay = commit.graph || "* ";
  const handleContextMenu = reactExports.useCallback((e) => {
    onContextMenu(e, commit.hash);
  }, [onContextMenu, commit.hash]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `git-graph-commit-row ${isCurrentBranch ? "current-branch" : ""}`,
      "data-hash": commit.hash,
      onContextMenu: handleContextMenu,
      style,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "graph-column", children: graphDisplay }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "commit-refs", children: branchRefs.map((ref, index) => {
            const isRemote = ref.includes("/");
            const displayName = ref.replace("HEAD -> ", "").replace("origin/", "");
            const isCurrent = ref.includes(currentBranch || "");
            const labelClass = isCurrent ? "current" : isRemote ? "remote" : "";
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `branch-label ${labelClass}`,
                title: ref,
                children: displayName
              },
              index
            );
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-message", title: commit.message, children: commit.message }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-hash", children: commit.hash.substring(0, 7) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-author", children: commit.author_name || commit.author }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-date", children: new Date(commit.date).toLocaleString() })
        ] })
      ]
    }
  );
});
const GitGraphCommitList = reactExports.memo(function GitGraphCommitList2({
  commits,
  currentBranch,
  onContextMenu
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "git-graph-commit-list", children: commits.map((commit) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    GitGraphCommitRow,
    {
      commit,
      currentBranch,
      onContextMenu
    },
    commit.hash
  )) });
});
const GitGraphContextMenu = reactExports.memo(function GitGraphContextMenu2({
  x,
  y,
  onCherryPick,
  onRevert,
  onCopyHash,
  onClose
}) {
  const menuRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: menuRef,
      className: "git-graph-context-menu",
      style: { left: `${x}px`, top: `${y}px` },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "context-menu-item", onClick: onCherryPick, children: "Cherry-pick" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "context-menu-item", onClick: onRevert, children: "Revert" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "context-menu-item", onClick: onCopyHash, children: "Copy Hash" })
      ]
    }
  );
});
function useGitGraphLogic(props) {
  const [commits, setCommits] = reactExports.useState([]);
  const [branches, setBranches] = reactExports.useState([]);
  const [currentBranch, setCurrentBranch] = reactExports.useState(null);
  const [selectedBranch, setSelectedBranch] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [contextMenu, setContextMenu] = reactExports.useState(null);
  const vscode = getVsCodeApi();
  const loadData = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      vscode == null ? void 0 : vscode.postMessage({ type: "getGraphData" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }, [vscode]);
  reactExports.useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;
      switch (message.type) {
        case "graphData":
          setCommits(message.commits || []);
          setBranches(message.branches || []);
          setCurrentBranch(message.currentBranch || null);
          setSelectedBranch(message.currentBranch || "");
          setLoading(false);
          break;
        case "error":
          setError(message.message);
          setLoading(false);
          break;
      }
    };
    window.addEventListener("message", handleMessage);
    loadData();
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [loadData]);
  const handleRefresh = reactExports.useCallback(() => {
    var _a;
    loadData();
    (_a = props.onRefresh) == null ? void 0 : _a.call(props);
  }, [loadData, props]);
  const handleBranchChange = reactExports.useCallback((branch) => {
    setSelectedBranch(branch);
  }, []);
  const handleCheckout = reactExports.useCallback(() => {
    var _a;
    if (selectedBranch) {
      vscode == null ? void 0 : vscode.postMessage({ type: "checkout", branch: selectedBranch });
      (_a = props.onCheckout) == null ? void 0 : _a.call(props, selectedBranch);
    }
  }, [selectedBranch, vscode, props]);
  const handleMerge = reactExports.useCallback(() => {
    var _a;
    if (selectedBranch) {
      vscode == null ? void 0 : vscode.postMessage({ type: "merge", branch: selectedBranch });
      (_a = props.onMerge) == null ? void 0 : _a.call(props, selectedBranch);
    }
  }, [selectedBranch, vscode, props]);
  const handleRebase = reactExports.useCallback(() => {
    var _a;
    if (selectedBranch) {
      vscode == null ? void 0 : vscode.postMessage({ type: "rebase", branch: selectedBranch });
      (_a = props.onRebase) == null ? void 0 : _a.call(props, selectedBranch);
    }
  }, [selectedBranch, vscode, props]);
  const handleContextMenu = reactExports.useCallback((e, hash) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      hash
    });
  }, []);
  const handleCherryPick = reactExports.useCallback((hash) => {
    var _a;
    vscode == null ? void 0 : vscode.postMessage({ type: "cherryPick", commits: [hash] });
    (_a = props.onCherryPick) == null ? void 0 : _a.call(props, [hash]);
    setContextMenu(null);
  }, [vscode, props]);
  const handleRevert = reactExports.useCallback((hash) => {
    var _a;
    vscode == null ? void 0 : vscode.postMessage({ type: "revert", commit: hash });
    (_a = props.onRevert) == null ? void 0 : _a.call(props, hash);
    setContextMenu(null);
  }, [vscode, props]);
  const handleCopyHash = reactExports.useCallback((hash) => {
    var _a;
    navigator.clipboard.writeText(hash);
    (_a = props.onCopyHash) == null ? void 0 : _a.call(props, hash);
    setContextMenu(null);
  }, [props]);
  const closeContextMenu = reactExports.useCallback(() => {
    setContextMenu(null);
  }, []);
  return {
    commits,
    branches,
    currentBranch,
    selectedBranch,
    loading,
    error,
    contextMenu,
    handleRefresh,
    handleBranchChange,
    handleCheckout,
    handleMerge,
    handleRebase,
    handleContextMenu,
    handleCherryPick,
    handleRevert,
    handleCopyHash,
    closeContextMenu
  };
}
const GitGraphView = reactExports.memo(function GitGraphView2(props) {
  const {
    commits,
    branches,
    currentBranch,
    loading,
    error,
    contextMenu,
    selectedBranch,
    handleRefresh,
    handleBranchChange,
    handleCheckout,
    handleMerge,
    handleRebase,
    handleContextMenu,
    handleCherryPick,
    handleRevert,
    handleCopyHash,
    closeContextMenu
  } = useGitGraphLogic(props);
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "git-graph-error", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "error-icon", children: "⚠️" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "Failed to Load Git Graph" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleRefresh, children: "Retry" })
    ] });
  }
  if (loading && commits.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "git-graph-loading", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-spinner" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Loading git graph..." })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "git-graph-view", onClick: closeContextMenu, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GitGraphToolbar,
      {
        branches,
        currentBranch,
        selectedBranch,
        onRefresh: handleRefresh,
        onBranchChange: handleBranchChange,
        onCheckout: handleCheckout,
        onMerge: handleMerge,
        onRebase: handleRebase
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      GitGraphCommitList,
      {
        commits,
        currentBranch,
        onContextMenu: handleContextMenu
      }
    ),
    contextMenu && /* @__PURE__ */ jsxRuntimeExports.jsx(
      GitGraphContextMenu,
      {
        x: contextMenu.x,
        y: contextMenu.y,
        onCherryPick: () => handleCherryPick(contextMenu.hash),
        onRevert: () => handleRevert(contextMenu.hash),
        onCopyHash: () => handleCopyHash(contextMenu.hash),
        onClose: closeContextMenu
      }
    )
  ] });
});
getVsCodeApi();
console.log("[Git Graph] Starting initialization...");
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  console.log("[Git Graph] Creating React root...");
  const root = client.createRoot(rootElement);
  console.log("[Git Graph] Rendering GitGraphView component...");
  root.render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(GitGraphView, {}) })
  );
  console.log("[Git Graph] GitGraphView rendered successfully");
} catch (error) {
  console.error("[Git Graph] Initialization error:", error);
}
export {
  GitGraphView as G,
  getVsCodeApi as g
};
//# sourceMappingURL=git-graph.js.map
