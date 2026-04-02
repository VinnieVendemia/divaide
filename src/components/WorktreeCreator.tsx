import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { StatusMessage } from './StatusMessage.js';
import { createWorktree } from '../lib/git.js';
import type { GitInfo } from '../lib/git.js';

interface WorktreeCreatorProps {
  gitInfo: GitInfo;
  initialBranch?: string;
  onCreated: (worktreePath: string) => void;
  onExisting: (worktreePath: string) => void;
  onError: (message: string) => void;
}

export function WorktreeCreator({
  gitInfo,
  initialBranch,
  onCreated,
  onExisting,
  onError,
}: WorktreeCreatorProps) {
  const [branchName, setBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // If initialBranch was provided via CLI arg, trigger creation immediately
  useEffect(() => {
    if (initialBranch) {
      void handleCreate(initialBranch);
    }
  }, []);

  async function handleCreate(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError('Branch name is required');
      return;
    }

    setValidationError(null);
    setIsCreating(true);

    try {
      const result = await createWorktree(
        trimmed,
        gitInfo.currentBranch,
        gitInfo.root,
        gitInfo.repoName,
      );

      if (result.existed) {
        onExisting(result.path);
      } else {
        onCreated(result.path);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setIsCreating(false);
      setBranchName('');
      onError(message);
    }
  }

  if (isCreating) {
    return (
      <Box>
        <StatusMessage type="info" text={`Creating worktree: ${branchName || initialBranch}`} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text>Please enter a tree name (e.g., PROJ-123-add-new-feature):</Text>
      <Box marginTop={1}>
        <TextInput
          value={branchName}
          onChange={value => {
            setValidationError(null);
            setBranchName(value);
          }}
          onSubmit={handleCreate}
        />
      </Box>
      {validationError && (
        <Box marginTop={1}>
          <StatusMessage type="error" text={validationError} />
        </Box>
      )}
    </Box>
  );
}
