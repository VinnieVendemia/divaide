import path from 'path';

export function getWorktreePath(
  gitRoot: string,
  repoName: string,
  branchName: string,
): string {
  return path.resolve(gitRoot, '..', `.${repoName}`, 'trees', branchName);
}

// From worktree at ../.repo/trees/branch, ../../init = ../.repo/init
export function getProjectInitPath(worktreePath: string): string {
  return path.resolve(worktreePath, '..', '..', 'init');
}

export function getDivaidePath(worktreePath: string): string {
  return path.join(worktreePath, '.divaide');
}
