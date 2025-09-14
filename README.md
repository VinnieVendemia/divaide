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
brew install divaide
```

## Setup

After installing, add the following line to your shell config (~/.zshrc or ~/.bashrc):
```
source "$(brew --prefix)/etc/divaide.sh"
```

Reload your shell to activate.

## Usage

To startup a new session for a feature branch:

```
divaide my-feature-branch
```

This will

- Create a new git worktree from your projects current branch (or re-enter an existing one)
- cd into that directory
- run `npm i`
- Launch a new claude code session

From here, you have a working copy of your application code separate from your main application code.

Tell claude to make changes, fix bugs, etc.  Exiting the claude console
leaves you in the current "worktree" directory, if you want to manually
intervene in anyway. Restart your claude session and pickup where you
left things off.

## Upgrading

```
brew update
brew upgrade divaide
```

## License

Available open-source under terms of the [MIT License](https://opensource.org/license/MIT)

