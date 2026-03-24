# Changelog

All notable changes to divaide will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.9] - 2026-03-24

### Added
- **Project-level init script**: New `--init` flag creates a project-specific init file at `.{repo-name}/init` (sibling to the repo)
- **Init file precedence**: The init file runs instead of `.divaide` when creating new worktrees, allowing shared setup across all worktrees
- **Editor integration**: Running `divaide --init` opens the init file in your `$EDITOR` (falls back to `vi`)

### Fixed
- **Help/flags not working**: Fixed bug where `--help` and other flags would attempt to create a worktree instead of showing help. Changed top-level `return` to `exit` for proper script termination.

## [0.1.8] - 2026-01-19

### Fixed
- **Critical Directory Handling Issue**: Fixed problem where terminal would exit back to original location after running `.divaide` commands
- **Stdout Pollution**: Commands in `.divaide` files (like `echo ".env copied"`) were outputting to stdout, contaminating the worktree path capture
- **Directory Changes**: Commands in `.divaide` that changed directories could affect the main script's working directory

### Changed
- **Subshell Isolation**: All `.divaide` commands now run in isolated subshells using `(eval "$line" >&2)`
- **Output Redirection**: All `.divaide` command output is properly redirected to stderr to prevent interference
- **Enhanced Logging**: Added "Setup commands completed" success message after `.divaide` execution

### Technical Details
- Changed `eval "$line"` to `(eval "$line" >&2)` in bin/divaide.sh:227
- This ensures clean worktree path capture for the wrapper function
- Terminal now reliably stays in correct worktree directory after setup commands

## [0.1.7] - Previous Release

### Added
- Improved interactive menu system with arrow key navigation
- Enhanced worktree selection and management
- Better error handling for worktree creation failures

### Changed
- Refactored to not require sourcing script directly
- Cleaner tree selector interface
- Updated README documentation

## [0.1.6] - Previous Release

### Added
- Enhanced error handling and user experience improvements
- Better validation for branch names and directory paths

## [0.1.5] - Previous Release

### Added
- Support for custom base branches
- Improved git worktree management
- Basic `.divaide` configuration file support

## [0.1.0] - Initial Release

### Added
- Basic git worktree creation and management
- Claude Code integration
- Interactive branch selection
- Shell wrapper for seamless directory changes