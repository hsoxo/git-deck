import { useEffect } from 'react';
import { StagePanel } from './components/Stage/StagePanel';
import { HistoryPanel } from './components/History/HistoryPanel';
import { useGitStore } from './store/gitStore';
import './App.css';

function App() {
    const { fetchStatus, fetchHistory } = useGitStore();

    useEffect(() => {
        // 初始加载数据
        fetchStatus();
        fetchHistory();
    }, [fetchStatus, fetchHistory]);

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
