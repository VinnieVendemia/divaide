import { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { getGitInfo, listWorktrees } from './lib/git.js';
import type { GitInfo, Worktree } from './lib/git.js';
import { WorktreeSelector } from './components/WorktreeSelector.js';
import { WorktreeCreator } from './components/WorktreeCreator.js';
import { SetupProgress } from './components/SetupProgress.js';
import { StatusMessage } from './components/StatusMessage.js';

type AppState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'selecting'; gitInfo: GitInfo; worktrees: Worktree[] }
  | { phase: 'creating'; gitInfo: GitInfo; error?: string }
  | { phase: 'setup'; worktreePath: string }
  | { phase: 'done'; worktreePath: string };

interface AppProps {
  branch?: string;
  onDone: (worktreePath: string) => void;
}

export default function App({ branch, onDone }: AppProps) {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>({ phase: 'loading' });

  useEffect(() => {
    async function init() {
      try {
        const gitInfo = await getGitInfo();
        const worktrees = await listWorktrees(gitInfo.repoName);

        if (branch) {
          setState({ phase: 'creating', gitInfo });
        } else if (worktrees.length > 0) {
          setState({ phase: 'selecting', gitInfo, worktrees });
        } else {
          setState({ phase: 'creating', gitInfo });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState({ phase: 'error', message });
      }
    }
    void init();
  }, []);

  useEffect(() => {
    if (state.phase === 'done') {
      // Signal the resolved path to index.tsx, then unmount Ink.
      // index.tsx handles what happens next (spawn claude or output path for --cd).
      onDone(state.worktreePath);
      exit();
    }
    if (state.phase === 'error') {
      setImmediate(() => process.exit(1));
    }
  }, [state.phase]);

  if (state.phase === 'loading') {
    return <Text dimColor>Loading...</Text>;
  }

  if (state.phase === 'error') {
    return <StatusMessage type="error" text={state.message} />;
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>divaide</Text>
        <Text dimColor> · git worktree launcher</Text>
      </Box>

      {state.phase === 'selecting' && (
        <WorktreeSelector
          worktrees={state.worktrees}
          repoName={state.gitInfo.repoName}
          onSelect={wt => setState({ phase: 'done', worktreePath: wt.path })}
          onCreateNew={() => setState({ phase: 'creating', gitInfo: state.gitInfo })}
        />
      )}

      {state.phase === 'creating' && (
        <Box flexDirection="column">
          {state.error != null && (
            <Box marginBottom={1}>
              <StatusMessage type="error" text={state.error} />
            </Box>
          )}
          <WorktreeCreator
            gitInfo={state.gitInfo}
            initialBranch={branch}
            onCreated={worktreePath => setState({ phase: 'setup', worktreePath })}
            onExisting={worktreePath => setState({ phase: 'done', worktreePath })}
            onError={message =>
              setState({ phase: 'creating', gitInfo: state.gitInfo, error: message })
            }
          />
        </Box>
      )}

      {state.phase === 'setup' && (
        <SetupProgress
          worktreePath={state.worktreePath}
          onComplete={() =>
            setState({ phase: 'done', worktreePath: state.worktreePath })
          }
        />
      )}
    </Box>
  );
}
