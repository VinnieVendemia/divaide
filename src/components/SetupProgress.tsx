import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { StatusMessage } from './StatusMessage.js';
import { getSetupConfig, runCommand } from '../lib/config.js';

interface LogEntry {
  text: string;
  type: 'info' | 'success' | 'warning';
}

interface SetupProgressProps {
  worktreePath: string;
  onComplete: () => void;
}

export function SetupProgress({ worktreePath, onComplete }: SetupProgressProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentCommand, setCurrentCommand] = useState<string | null>(null);

  function addLog(entry: LogEntry) {
    setLogs(prev => [...prev, entry]);
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const config = await getSetupConfig(worktreePath);

      if (config.type === 'none' || config.commands.length === 0) {
        addLog({ type: 'info', text: 'No init or .divaide file found, skipping setup.' });
        if (!cancelled) onComplete();
        return;
      }

      addLog({
        type: 'info',
        text: `Running setup commands from ${config.type === 'project-init' ? 'init' : '.divaide'} file...`,
      });

      for (const cmd of config.commands) {
        if (cancelled) return;
        setCurrentCommand(cmd);
        try {
          await runCommand(cmd, worktreePath);
          addLog({ type: 'success', text: cmd });
        } catch {
          addLog({ type: 'warning', text: `Failed: ${cmd}` });
        }
      }

      if (!cancelled) {
        setCurrentCommand(null);
        onComplete();
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box flexDirection="column">
      {logs.map((log, i) => (
        <StatusMessage key={i} type={log.type} text={log.text} />
      ))}
      {currentCommand && (
        <Box>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text> {currentCommand}</Text>
        </Box>
      )}
    </Box>
  );
}
