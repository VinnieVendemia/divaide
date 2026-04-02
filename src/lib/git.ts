import { execa } from 'execa';
import path from 'path';
import fs from 'fs/promises';
import { getWorktreePath } from './paths.js';

export interface GitInfo {
  root: string;
  repoName: string;
  currentBranch: string;
}

export interface Worktree {
  path: string;
  branch: string;
}

export async function assertGitRepo(): Promise<void> {
  await execa('git', ['rev-parse', '--git-dir']);
}

export async function getGitInfo(): Promise<GitInfo> {
  const { stdout: root } = await execa('git', ['rev-parse', '--show-toplevel']);
  const { stdout: branch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  const trimmedRoot = root.trim();
  return {
    root: trimmedRoot,
    repoName: path.basename(trimmedRoot),
    currentBranch: branch.trim(),
  };
}

export async function listWorktrees(repoName: string): Promise<Worktree[]> {
  const { stdout } = await execa('git', ['worktree', 'list']);
  const pattern = new RegExp(`/\\.${repoName}/trees/`);

  return stdout
    .split('\n')
    .filter(line => pattern.test(line))
    .map(line => {
      const branchMatch = line.match(/\[([^\]]+)\]$/);
      const pathMatch = line.match(/^(\S+)/);
      return {
        path: pathMatch?.[1] ?? '',
        branch: branchMatch?.[1] ?? '',
      };
    })
    .filter(wt => wt.branch && wt.path);
}

export async function createWorktree(
  branchName: string,
  baseBranch: string,
  gitRoot: string,
  repoName: string,
): Promise<{ path: string; existed: boolean }> {
  const worktreePath = getWorktreePath(gitRoot, repoName, branchName);

  try {
    await fs.access(worktreePath);
    return { path: worktreePath, existed: true };
  } catch {
    // doesn't exist, create it
  }

  await fs.mkdir(path.dirname(worktreePath), { recursive: true });

  await execa('git', ['worktree', 'add', '-b', branchName, worktreePath, baseBranch], {
    cwd: gitRoot,
  });

  return { path: worktreePath, existed: false };
}
