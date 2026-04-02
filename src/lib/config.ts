import { execa } from 'execa';
import { execFileSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { getProjectInitPath, getDivaidePath } from './paths.js';

export type SetupConfigType = 'project-init' | 'divaide' | 'none';

export interface SetupConfig {
  type: SetupConfigType;
  commands: string[];
}

function parseCommands(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

export async function getSetupConfig(worktreePath: string): Promise<SetupConfig> {
  // Project init file takes precedence over .divaide
  const initFile = getProjectInitPath(worktreePath);
  try {
    const content = await fs.readFile(initFile, 'utf-8');
    return { type: 'project-init', commands: parseCommands(content) };
  } catch {
    // no init file
  }

  const divaideFile = getDivaidePath(worktreePath);
  try {
    const content = await fs.readFile(divaideFile, 'utf-8');
    return { type: 'divaide', commands: parseCommands(content) };
  } catch {
    // no .divaide file
  }

  return { type: 'none', commands: [] };
}

export async function runCommand(cmd: string, cwd: string): Promise<void> {
  await execa('bash', ['-c', cmd], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });
}

export async function openInitFile(repoRoot: string, repoName: string): Promise<void> {
  const initDir = path.resolve(repoRoot, '..', `.${repoName}`);
  const initPath = path.join(initDir, 'init');

  await fs.mkdir(initDir, { recursive: true });

  try {
    await fs.access(initPath);
  } catch {
    await fs.writeFile(
      initPath,
      `# Divaide init script
# This file runs when creating new worktrees for this project
# Add your setup commands below (one per line)
# Example: npm install
# Example: cp ../.env .env

`,
    );
  }

  // Use /dev/tty to bypass stdout capture by the shell wrapper
  const editor = process.env['EDITOR'] ?? 'vi';
  execFileSync(editor, [initPath], {
    stdio: ['inherit', process.stderr, process.stderr],
  });
}
