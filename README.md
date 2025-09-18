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

divaide supports a configuration file for each git project.  Add a `.divaide` file
to your project root, and add any commands you wish to run when a tree is
initially created.  You'll need to check this file into your repo for this to work.

For example:

```
# .divaide
npm install
```

## Upgrading

```
brew update
brew upgrade divaide
```

## License

Available open-source under terms of the [MIT License](https://opensource.org/license/MIT)

