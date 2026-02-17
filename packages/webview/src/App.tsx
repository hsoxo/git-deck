import { useEffect, useState } from 'react';
import { StagePanel } from './components/Stage/StagePanel';
import { HistoryPanel } from './components/History/HistoryPanel';
import { GitGraphView } from './components/GitGraph/GitGraphView';
import { useGitStore } from './store/gitStore';
import './App.css';

function App() {
    const { fetchStatus, fetchHistory } = useGitStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'main' | 'graph'>('main');

    console.log('[Git GUI App] Component mounted');

    useEffect(() => {
        // 监听来自扩展的消息，判断显示哪个视图
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'setView') {
                setView(message.view);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    useEffect(() => {
        console.log('[Git GUI App] useEffect triggered for data loading');

        // 初始加载数据
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('[Git GUI App] Starting to load data...');

                // 并行加载数据
                const results = await Promise.all([
                    fetchStatus().catch(err => {
                        console.error('[Git GUI App] Failed to fetch status:', err);
                        throw new Error(`Failed to load git status: ${err.message || err}`);
                    }),
                    fetchHistory().catch(err => {
                        console.error('[Git GUI App] Failed to fetch history:', err);
                        throw new Error(`Failed to load git history: ${err.message || err}`);
                    })
                ]);

                console.log('[Git GUI App] Data loaded successfully, results:', results);
                console.log('[Git GUI App] Setting loading to false');
                setLoading(false);
            } catch (err) {
                console.error('[Git GUI App] Failed to load data:', err);
                setError(err instanceof Error ? err.message : String(err));
                setLoading(false);
            }
        };

        // 只在主视图加载数据
        if (view === 'main') {
            loadData();
        }
    }, [fetchStatus, fetchHistory, view]);

    // 隐藏初始加载动画
    useEffect(() => {
        if (!loading) {
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
        }
    }, [loading]);

    // Git Graph 视图
    if (view === 'graph') {
        return <GitGraphView />;
    }

    // 主视图
    if (error) {
        return (
            <div className="app-error">
                <div className="error-icon">⚠️</div>
                <h2>Failed to Load Git GUI</h2>
                <p className="error-message">{error}</p>
                <div className="error-actions">
                    <button onClick={() => window.location.reload()}>
                        Reload
                    </button>
                </div>
                <div className="error-help">
                    <p>Possible causes:</p>
                    <ul>
                        <li>Not in a Git repository</li>
                        <li>Git is not installed or not in PATH</li>
                        <li>No permission to access the repository</li>
                    </ul>
                    <p>Check the Output panel (View → Output → Git GUI) for more details.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner"></div>
                <p>Loading Git repository...</p>
            </div>
        );
    }

    return (
        <div className="app">
            <div className="app-header">
                <h1>Git GUI</h1>
            </div>
            <div className="app-content">
                <div className="panel-container">
                    <StagePanel />
                </div>
                <div className="panel-container">
                    <HistoryPanel />
                </div>
            </div>
        </div>
    );
}

export default App;
