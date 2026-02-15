import { useGitStore } from '../../store/gitStore';
import { FileList } from './FileList';
import { CommitBox } from './CommitBox';
import './StagePanel.css';

export function StagePanel() {
    const { status, stageFiles, unstageFiles, stageAll, unstageAll, discardFiles } = useGitStore();

    if (!status) {
        return <div className="stage-panel">Loading...</div>;
    }

    return (
        <div className="stage-panel">
            <div className="stage-section">
                <div className="section-header">
                    <h3>Unstaged Changes</h3>
                    <button onClick={stageAll} disabled={status.unstaged.length === 0}>
                        Stage All
                    </button>
                </div>
                <FileList
                    files={[...status.unstaged, ...status.untracked]}
                    onAction={stageFiles}
                    onDiscard={discardFiles}
                    actionLabel="Stage"
                    staged={false}
                />
            </div>

            <div className="stage-section">
                <div className="section-header">
                    <h3>Staged Changes</h3>
                    <button onClick={unstageAll} disabled={status.staged.length === 0}>
                        Unstage All
                    </button>
                </div>
                <FileList
                    files={status.staged}
                    onAction={unstageFiles}
                    actionLabel="Unstage"
                    staged={true}
                />
            </div>

            <CommitBox />
        </div>
    );
}
