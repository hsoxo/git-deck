var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { r as reactExports, j as jsxRuntimeExports, c as client, R as React } from "./vendor-cwqlfVzE.js";
let vscodeApi = null;
if (typeof window !== "undefined") {
  if (window.__vscodeApi) {
    vscodeApi = window.__vscodeApi;
  } else if (window.acquireVsCodeApi) {
    try {
      vscodeApi = window.acquireVsCodeApi();
      window.__vscodeApi = vscodeApi;
    } catch (error) {
      console.warn("[vscodeApi] API already acquired, using cached version");
      vscodeApi = window.__vscodeApi;
    }
  }
}
function getVsCodeApi() {
  return vscodeApi;
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
  graphCommit,
  currentBranch,
  onContextMenu,
  style,
  columnWidth,
  rowHeight,
  dotRadius
}) {
  var _a, _b;
  const { commit, x, columns } = graphCommit;
  const branches = [];
  const tags = [];
  (_a = commit.refs) == null ? void 0 : _a.forEach((ref) => {
    if (ref.includes("tag:")) {
      const tagName = ref.replace("tag:", "").trim();
      tags.push(tagName);
    } else {
      branches.push(ref);
    }
  });
  const isCurrentBranch = branches.some(
    (b) => b.includes(`HEAD -> ${currentBranch}`) || b === currentBranch
  );
  const handleContextMenu = reactExports.useCallback((e) => {
    onContextMenu(e, commit.hash);
  }, [onContextMenu, commit.hash]);
  const svgWidth = Math.max(columns.length * columnWidth, (x + 1) * columnWidth);
  const dotX = x * columnWidth + columnWidth / 2;
  const dotY = rowHeight / 2;
  const dotColor = ((_b = columns[x]) == null ? void 0 : _b.color) || "#4285f4";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `git-graph-commit-row ${isCurrentBranch ? "current-branch" : ""}`,
      "data-hash": commit.hash,
      onContextMenu: handleContextMenu,
      style,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "graph-column", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "svg",
          {
            width: svgWidth,
            height: rowHeight,
            style: { display: "block" },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: dotX,
                cy: dotY,
                r: dotRadius,
                fill: dotColor,
                stroke: dotColor,
                strokeWidth: "2"
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "commit-refs", children: [
            branches.map((ref, index) => {
              const isRemote = ref.includes("origin/") || ref.includes("remotes/");
              const displayName = ref.replace("HEAD -> ", "").replace("origin/", "").replace("remotes/", "").trim();
              const isCurrent = ref.includes(`HEAD -> ${currentBranch}`) || ref === currentBranch;
              const labelClass = isCurrent ? "current" : isRemote ? "remote" : "local";
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `branch-label ${labelClass}`,
                  title: ref,
                  children: displayName
                },
                `branch-${index}`
              );
            }),
            tags.map((tag, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "tag-label",
                title: `tag: ${tag}`,
                children: tag
              },
              `tag-${index}`
            ))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-message", title: commit.message, children: commit.message }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-hash", children: commit.hash.substring(0, 7) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-author", children: commit.author_name || commit.author }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "commit-date", children: new Date(commit.date).toLocaleString() })
        ] })
      ]
    }
  );
});
const COLORS = [
  "#4285f4",
  // 蓝色
  "#ea4335",
  // 红色
  "#fbbc04",
  // 黄色
  "#34a853",
  // 绿色
  "#ff6d00",
  // 橙色
  "#46bdc6",
  // 青色
  "#7baaf7",
  // 浅蓝
  "#f07b72",
  // 浅红
  "#fdd663",
  // 浅黄
  "#81c995"
  // 浅绿
];
class GitGraphRenderer {
  constructor() {
    __publicField(this, "columnWidth", 20);
    __publicField(this, "rowHeight", 32);
    __publicField(this, "dotRadius", 4);
  }
  /**
   * 计算 git graph 的布局
   */
  calculateLayout(commits) {
    const result = [];
    const columns = /* @__PURE__ */ new Map();
    const activeColumns = [];
    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const routes = [];
      let columnIndex = columns.get(commit.hash);
      if (columnIndex === void 0) {
        columnIndex = activeColumns.findIndex((h) => h === null);
        if (columnIndex === -1) {
          columnIndex = activeColumns.length;
          activeColumns.push(commit.hash);
        } else {
          activeColumns[columnIndex] = commit.hash;
        }
        columns.set(commit.hash, columnIndex);
      }
      const currentY = i;
      const currentX = columnIndex;
      const color = COLORS[columnIndex % COLORS.length];
      if (commit.parents && commit.parents.length > 0) {
        commit.parents.forEach((parentHash, idx) => {
          let parentColumn = columns.get(parentHash) ?? -1;
          if (parentColumn === -1) {
            if (idx === 0) {
              parentColumn = columnIndex;
              columns.set(parentHash, parentColumn);
              activeColumns[parentColumn] = parentHash;
            } else {
              const newColumn = activeColumns.findIndex((h) => h === null);
              if (newColumn === -1) {
                parentColumn = activeColumns.length;
                activeColumns.push(parentHash);
              } else {
                parentColumn = newColumn;
                activeColumns[parentColumn] = parentHash;
              }
              columns.set(parentHash, parentColumn);
            }
          }
          routes.push({
            from: { x: currentX, y: currentY },
            to: { x: parentColumn, y: currentY + 1 },
            color: idx === 0 ? color : COLORS[parentColumn % COLORS.length]
          });
        });
      }
      if (!commit.parents || commit.parents.length === 0 || columns.get(commit.parents[0]) !== columnIndex) {
        activeColumns[columnIndex] = null;
      }
      const currentColumns = activeColumns.map((hash, idx) => ({
        color: COLORS[idx % COLORS.length],
        branch: hash || void 0
      }));
      result.push({
        commit,
        x: currentX,
        columns: currentColumns,
        routes
      });
    }
    return result;
  }
  /**
   * 生成 SVG 路径
   */
  generateSVGPath(route) {
    const fromX = route.from.x * this.columnWidth + this.columnWidth / 2;
    const fromY = route.from.y * this.rowHeight + this.rowHeight / 2;
    const toX = route.to.x * this.columnWidth + this.columnWidth / 2;
    const toY = route.to.y * this.rowHeight + this.rowHeight / 2;
    if (route.from.x === route.to.x) {
      return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    } else {
      const controlPointY = fromY + (toY - fromY) / 2;
      return `M ${fromX} ${fromY} C ${fromX} ${controlPointY}, ${toX} ${controlPointY}, ${toX} ${toY}`;
    }
  }
  getColumnWidth() {
    return this.columnWidth;
  }
  getRowHeight() {
    return this.rowHeight;
  }
  getDotRadius() {
    return this.dotRadius;
  }
}
const GitGraphCommitList = reactExports.memo(function GitGraphCommitList2({
  commits,
  currentBranch,
  onContextMenu
}) {
  const renderer = reactExports.useMemo(() => new GitGraphRenderer(), []);
  const graphCommits = reactExports.useMemo(() => renderer.calculateLayout(commits), [renderer, commits]);
  const columnWidth = renderer.getColumnWidth();
  const rowHeight = renderer.getRowHeight();
  const dotRadius = renderer.getDotRadius();
  const maxColumns = Math.max(...graphCommits.map((gc) => gc.columns.length), 1);
  const svgWidth = maxColumns * columnWidth;
  const svgHeight = graphCommits.length * rowHeight;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "git-graph-commit-list", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "svg",
      {
        className: "git-graph-lines",
        width: svgWidth,
        height: svgHeight,
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 0
        },
        children: graphCommits.map(
          (graphCommit, index) => graphCommit.routes.map((route, routeIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              d: renderer.generateSVGPath(route),
              stroke: route.color,
              strokeWidth: "2",
              fill: "none"
            },
            `${index}-${routeIndex}`
          ))
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { position: "relative", zIndex: 1 }, children: graphCommits.map((graphCommit) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      GitGraphCommitRow,
      {
        graphCommit,
        currentBranch,
        onContextMenu,
        columnWidth,
        rowHeight,
        dotRadius
      },
      graphCommit.commit.hash
    )) })
  ] });
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
  const [tags, setTags] = reactExports.useState([]);
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
          setTags(message.tags || []);
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
    tags,
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
