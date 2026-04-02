#!/usr/bin/env node
import { Command } from 'commander';
import { render } from 'ink';
import { execa } from 'execa';
import App from './app.js';
import { assertGitRepo, getGitInfo } from './lib/git.js';
import { openInitFile } from './lib/config.js';

// Printed when the user runs `divaide --shell-init`.
// They add `eval "$(divaide --shell-init)"` to their .zshrc / .bashrc once,
// and the shell function handles the --cd case by capturing stdout.
const SHELL_INIT = `
# divaide shell integration
# Enables \`divaide --cd\` by capturing the worktree path and cd-ing into it.
# Add to ~/.zshrc or ~/.bashrc:
#   eval "$(divaide --shell-init)"
divaide() {
  local has_cd=0
  for arg in "$@"; do
    [[ "$arg" == "--cd" ]] && has_cd=1 && break
  done

  if [[ $has_cd -eq 1 ]]; then
    local target
    target="$(command divaide "$@")"
    [[ -d "$target" ]] && cd "$target"
  else
    command divaide "$@"
  fi
}
`.trim();

const program = new Command();

program
  .name('divaide')
  .description('Git worktree manager for parallel AI coding sessions')
  .argument('[branch]', 'Branch name for the new worktree')
  .option('--init', 'Create or edit the project init script')
  .option('--cd', 'Enter the worktree directory instead of launching claude')
  .option('--shell-init', 'Print shell integration function (add to .zshrc/.bashrc)')
  .configureOutput({
    writeOut: str => process.stderr.write(str),
    writeErr: str => process.stderr.write(str),
  });

program.parse();

const options = program.opts<{ init?: boolean; cd?: boolean; shellInit?: boolean }>();
const [branch] = program.args;

async function main() {
  // Print shell function and exit — user pipes this into eval once during setup
  if (options.shellInit) {
    process.stdout.write(SHELL_INIT + '\n');
    return;
  }

  // Open project init script in $EDITOR before any Ink rendering
  if (options.init) {
    try {
      await assertGitRepo();
      const gitInfo = await getGitInfo();
      await openInitFile(gitInfo.root, gitInfo.repoName);
    } catch (err) {
      process.stderr.write(
        `Error: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      process.exit(1);
    }
    return;
  }

  try {
    await assertGitRepo();
  } catch {
    process.stderr.write(
      'Error: Not in a git repository. Please run from within a git repo.\n',
    );
    process.exit(1);
  }

  const cdMode = options.cd === true;

  // In --cd mode stdout is captured by the shell function, so Ink must render
  // to stderr. Force colors since stdout being a pipe would otherwise disable them.
  if (cdMode) {
    if (process.stderr.isTTY) process.env['FORCE_COLOR'] = '1';
  }

  let resolvedPath: string | undefined;

  const { waitUntilExit } = render(
    <App branch={branch} onDone={path => { resolvedPath = path; }} />,
    cdMode ? { stdout: process.stderr } : {},
  );

  await waitUntilExit();

  if (!resolvedPath) return;

  if (cdMode) {
    // Output path to stdout — the shell function captures this and runs `cd`
    process.stdout.write(resolvedPath);
  } else {
    // Spawn claude inside the worktree directory, inheriting the terminal.
    // When claude exits the user is returned to wherever they ran divaide from.
    try {
      await execa('claude', [], { cwd: resolvedPath, stdio: 'inherit' });
    } catch {
      // Non-zero exit from claude (e.g. ctrl+c) is not an error on our side
    }
  }
}

main().catch(err => {
  process.stderr.write(
    `Unexpected error: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
