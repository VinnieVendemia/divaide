# div-ai-de

Minimal wrapper tool for launching multiple AI Agents locally.  Originally designed
around Claude Code.

Built around the use of git worktrees.  Launching claude/codex in
a separate worktree gives you the ability to run multiple agents in parallel
on your local machine without them interfering with each other.

You could totally just setup git worktrees on your own, I hope that
this makes things slightly easier to manage.


## Installation

```
brew tap VinnieVendemia/tools
```

```
brew install vinnievendemia/tools/divaide
```

## Setup

After installing, add the following line to your shell config (~/.zshrc or ~/.bashrc):
```
source "$(brew --prefix)/etc/divaide.sh"
```

Reload your shell to activate.

## Usage

To startup a new session:

```
divaide
```

This will launch into an interactive menu to select from existing trees for your
project, or allow you to create a new tree.

Once a tree is selected, this will:

- Create a new git worktree from your projects current branch (or re-enter an existing one)
- cd into that directory
- run any commands defined in your `.divaide` file (on tree creation only)
- Launch a new claude code session

From here, you have a working copy of your application code separate from your main application code.

Tell claude to make changes, fix bugs, etc.  Exiting the claude console
leaves you in the current "worktree" directory, if manual intervention is
required. Restart your claude session and pickup where you left things off.

To startup a new session for an existing tree:

```
divaide my-feature-branch
```

## Configuration

### Project Init Script (Recommended)

Create a project-specific init script that runs when creating new worktrees:

```
divaide --init
```

This creates an init file at `.{repo-name}/init` (sibling to your repo, same location as your worktrees) and opens it in your editor. Add any setup commands you need:

```bash
# Example init file
npm install
cp ~/secrets/.env .
echo "Setup complete!"
```

The init file is **shared across all worktrees** for the project and lives outside your repo, so it won't be committed.

### .divaide Configuration File

Alternatively, add a `.divaide` file to your project root. This file gets copied into each worktree and must be checked into your repo.

**Precedence**: If both exist, the init file takes priority over `.divaide`.

The `.divaide` file is executed **only when creating a new worktree**, not when
entering an existing one. This allows for automatic project setup in the new
environment.

#### Basic Examples

```bash
# .divaide - Basic setup
npm install
cp .env.example .env
echo "Worktree setup complete!"
```

```bash
# .divaide - More complex setup
# Copy environment files
cp ~/code/shared-configs/.env .
cp ~/code/shared-configs/config.local.json .

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development services in background
docker-compose up -d redis postgres

echo "Development environment ready!"
```

#### Supported Features

- **Comments**: Lines starting with `#` are ignored
- **Empty lines**: Blank lines are skipped
- **Any shell commands**: Full bash command support
- **Environment variables**: Access to your shell environment
- **Relative paths**: Commands run in the worktree directory

#### Important Notes

⚠️ **Command Output**: All command output (stdout/stderr) from `.divaide` commands
is displayed during execution but doesn't interfere with divaide's operation.

✅ **Directory Safety**: Commands in `.divaide` run in isolated subshells, so
directory changes (like `cd` commands) won't affect divaide's final directory.

✅ **Clean Execution**: The script ensures you end up in the correct worktree
directory regardless of what commands are run in `.divaide`.

#### Troubleshooting

If you experience issues with `.divaide` commands:

1. **Check command syntax**: Test commands manually first
2. **Use absolute paths**: For files outside the repo, use full paths
3. **Check permissions**: Ensure commands have proper file/directory access
4. **Debug output**: All command output is visible during execution

## Development & Deployment

### For Contributors/Maintainers

This section covers how to release new versions of divaide.

#### Release Process

1. **Create and Push New Release**
   ```bash
   # Tag the release
   git tag -a v0.1.9 -m "Description of changes"
   git push origin v0.1.9
   ```

2. **Calculate SHA256 Hash**
   ```bash
   # Get the hash for the new release
   curl -sL "https://github.com/VinnieVendemia/divaide/archive/refs/tags/v0.1.9.tar.gz" | sha256sum
   ```

3. **Update Homebrew Formula**

   Update the formula in the `VinnieVendemia/homebrew-tools` repository:

   File: `Formula/divaide.rb`
   ```ruby
   class Divaide < Formula
     url "https://github.com/vinnievendemia/divaide/archive/refs/tags/v0.1.9.tar.gz"
     sha256 "NEW_SHA256_HASH_HERE"
     # ... rest of formula
   end
   ```

5. **Update Documentation**
   - Update `CHANGELOG.md` with new version details
   - Update any relevant README sections

#### Repository Structure

- **Main Repository**: `VinnieVendemia/divaide` - Contains the source code
- **Homebrew Tap**: `VinnieVendemia/homebrew-tools` - Contains the brew formula
- **Installation**: Users run `brew tap VinnieVendemia/tools && brew install vinnievendemia/tools/divaide`


## Upgrading

```
brew update
brew upgrade divaide
```

## License

Available open-source under terms of the [MIT License](https://opensource.org/license/MIT)

