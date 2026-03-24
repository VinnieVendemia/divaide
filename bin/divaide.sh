#!/bin/bash

# Claude Code Launcher with Automatic Worktree Setup
# Usage: ./divaide.sh [branch-name] [base-branch]

# set -e removed to prevent terminal exit when sourced

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" >&2
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" >&2
}

# Function to get available worktrees for the current project
get_project_worktrees() {
    local repo_name="$1"
    local worktree_pattern="/.${repo_name}/trees/"

    # Get all worktrees and filter for this project
    local worktrees=()
    while IFS= read -r line; do
        if [[ "$line" == *"$worktree_pattern"* ]]; then
            # Extract branch name from brackets at end of line
            if [[ "$line" =~ \[([^\]]+)\]$ ]]; then
                worktrees+=("${BASH_REMATCH[1]}")
            fi
        fi
    done < <(git worktree list 2>/dev/null)
    printf '%s\n' "${worktrees[@]}"
}

# Function to display menu with current selection highlighted
display_menu() {
    local selected="$1"
    local repo_name="$2"
    shift 2
    local menu_options=("${@}")

    # Clear screen and move cursor to top
    clear >&2
    echo >&2
    echo "Available worktrees for $repo_name:" >&2
    echo "==================================" >&2
    echo >&2

    local i=0
    for option in "${menu_options[@]}"; do
        if [[ $i -eq $selected ]]; then
            echo -e "→ \033[7m$option\033[0m" >&2  # Highlighted (reverse video)
        else
            echo "  $option" >&2
        fi
        ((i++))
    done

    echo >&2
    echo "Use ↑/↓ arrows to navigate, Enter to select, or any other key to create new" >&2
}

# Function to read arrow keys
read_key() {
    local key
    read -rsn1 key
    case "$key" in
        $'\e')  # Escape sequence
            read -rsn2 key
            case "$key" in
                '[A') echo "up" ;;
                '[B') echo "down" ;;
                *) echo "other" ;;
            esac
            ;;
        '') echo "enter" ;;  # Enter key
        *) echo "other" ;;
    esac
}

# Interactive menu for selecting worktree
select_worktree() {
    local repo_name="$1"
    local options=()

    # Get available worktrees (compatible with older bash)
    while IFS= read -r line; do
        [[ -n "$line" ]] && options+=("$line")
    done < <(get_project_worktrees "$repo_name")

    if [ ${#options[@]} -eq 0 ]; then
        return 1
    fi

    # Arrow key navigation menu
    local selected=0
    local max_index=$((${#options[@]} - 1))

    # Initial display
    display_menu "$selected" "$repo_name" "${options[@]}"

    # Navigation loop
    while true; do
        local key
        key=$(read_key)

        case "$key" in
            "up")
                ((selected--))
                if [[ $selected -lt 0 ]]; then
                    selected=$max_index
                fi
                display_menu "$selected" "$repo_name" "${options[@]}"
                ;;
            "down")
                ((selected++))
                if [[ $selected -gt $max_index ]]; then
                    selected=0
                fi
                display_menu "$selected" "$repo_name" "${options[@]}"
                ;;
            "enter")
                # Selected an option - output the branch name
                echo "${options[$selected]}"
                return 0
                ;;
            "other")
                # Any other key - go to manual entry
                return 1
                ;;
        esac
    done
}

main() {
    local branch_name="$1"
    local base_branch="$2"
    
    echo "🚀 Claude Code Launcher with Worktree Setup" >&2
    echo "===========================================" >&2
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        echo "❌ Not in a git repository. Please run this from within a git repository." >&2
        return 1
    fi
    
    # Get the repository root and name
    local git_root
    git_root=$(git rev-parse --show-toplevel)
    local repo_name
    repo_name=$(basename "$git_root")
    
    # Use current branch if base_branch not provided
    if [ -z "$base_branch" ]; then
        base_branch=$(git rev-parse --abbrev-ref HEAD)
    fi
    
    log_info "Repository: $repo_name"
    log_info "Git root: $git_root"
    
    # Change to git root directory
    # cd "$git_root"
    
    # Loop until successful worktree creation
    while true; do
        # Prompt for branch name if not provided
        if [ -z "$branch_name" ]; then
            # Try to select from existing worktrees first
            if branch_name=$(select_worktree "$repo_name"); then
                log_info "Selected existing worktree: $branch_name"
            else
                # Fallback to manual entry if no worktrees or user chose to create new
                echo >&2
                echo "Please enter a tree name (e.g., PROJ-123-add-new-feature):" >&2
                read -r branch_name

                if [ -z "$branch_name" ]; then
                    echo "❌ Tree name is required" >&2
                    continue
                fi
            fi
        fi
        
        log_info "Tree name: $branch_name"
        log_info "Base branch: $base_branch"
        
        # Create worktree directory path (sibling to current repo)
        local worktree_path="../.${repo_name}/trees/${branch_name}"
        
        # Create parent directory structure if it doesn't exist
        mkdir -p "$(dirname "$worktree_path")"
        
        # Check if worktree already exists
        if [ -d "$worktree_path" ]; then
            log_warning "Worktree directory already exists: $worktree_path"
            log_info "Using existing worktree directory"
            cd "$worktree_path"
            log_success "Changed to worktree: $branch_name"
            break
        fi
        
        # Create the worktree
        log_info "Creating git worktree..."
        if git worktree add -b "$branch_name" "$worktree_path" "$base_branch" >&2; then
            log_success "Worktree created successfully"
            
            # Change to the worktree directory
            cd "$worktree_path"
            log_info "Changed to worktree directory: $(pwd)"

            # Determine which setup file to use (init takes precedence over .divaide)
            # From worktree at ../.repo/trees/branch, ../../init resolves to ../.repo/init
            local init_file="../../init"
            local setup_file=""

            if [[ -f "$init_file" ]]; then
                setup_file="$init_file"
                log_info "Running setup commands from init file..."
            elif [[ -f ".divaide" ]]; then
                setup_file=".divaide"
                log_info "Running setup commands from .divaide..."
            fi

            if [[ -n "$setup_file" ]]; then
                while IFS= read -r line; do
                    [[ -z "$line" || "$line" =~ ^# ]] && continue
                    log_info "Executing: $line"
                    (eval "$line" >&2)
                done < "$setup_file"
            else
                log_info "No init or .divaide file found, skipping setup."
            fi
            
            break
        else
            echo "❌ Failed to create worktree '$branch_name'" >&2
            echo "Please try a different tree name." >&2
            branch_name=""  # Reset to prompt again
        fi
    done

    echo "$worktree_path"
}

# Show help if requested
if [[ "$1" == "-h" || "$1" == "--help" || "$1" == "help" ]]; then
    cat >&2 << 'EOF'
Usage: divaide [branch-name] [base-branch]
       divaide --init

Creates a git worktree and launches Claude Code in it.
Works with any git repository - detects repo name and default branch automatically.

Arguments:
  branch-name    Branch name for the worktree (will prompt if not provided)
  base-branch    Base branch to branch from (auto-detected if not provided)
  --init         Create/show path to project init script

Examples:
  divaide                                        # Interactive mode
  divaide PROJ-123-add-new-feature             # Create worktree for specific branch
  divaide feature-auth main                      # Create worktree from main branch
  divaide --init                                 # Create project init script

The script must be run from within a git repository.
EOF
    exit 0
fi

# Handle --init to create/show project init script
if [[ "$1" == "--init" ]]; then
    repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
    if [[ -z "$repo_root" ]]; then
        echo "Error: Not in a git repository" >&2
        exit 1
    fi
    repo_name=$(basename "$repo_root")
    init_path="${repo_root}/../.${repo_name}/init"

    # Create directory if needed
    mkdir -p "$(dirname "$init_path")"

    # Resolve to clean canonical path
    init_path=$(cd "$(dirname "$init_path")" && pwd)/$(basename "$init_path")

    # Create file with template if it doesn't exist
    if [[ ! -f "$init_path" ]]; then
        cat > "$init_path" << 'EOF'
# Divaide init script
# This file runs when creating new worktrees for this project
# Add your setup commands below (one per line)
# Example: npm install
# Example: cp ../.env .env

EOF
    fi

    log_info "Creating init script at $init_path"
    ${EDITOR:-vi} "$init_path" < /dev/tty > /dev/tty
    exit 0
fi

main "$@"