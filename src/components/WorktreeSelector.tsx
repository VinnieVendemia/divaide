import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Worktree } from '../lib/git.js';

interface WorktreeSelectorProps {
  worktrees: Worktree[];
  repoName: string;
  onSelect: (worktree: Worktree) => void;
  onCreateNew: () => void;
}

export function WorktreeSelector({
  worktrees,
  repoName,
  onSelect,
  onCreateNew,
}: WorktreeSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => (i - 1 + worktrees.length) % worktrees.length);
    } else if (key.downArrow) {
      setSelectedIndex(i => (i + 1) % worktrees.length);
    } else if (key.return) {
      onSelect(worktrees[selectedIndex]!);
    } else {
      onCreateNew();
    }
  });

  return (
    <Box flexDirection="column">
      <Text>Available worktrees for <Text bold>{repoName}</Text>:</Text>
      <Text>{'='.repeat(34)}</Text>
      <Box flexDirection="column" marginTop={1}>
        {worktrees.map((wt, index) => (
          <Text key={wt.branch}>
            {index === selectedIndex ? (
              <>
                <Text color="blue">{'→ '}</Text>
                <Text inverse>{wt.branch}</Text>
              </>
            ) : (
              <Text>{'  '}{wt.branch}</Text>
            )}
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>↑/↓ navigate · Enter select · any other key to create new</Text>
      </Box>
    </Box>
  );
}
