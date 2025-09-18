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
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
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

    # Display menu to stderr so it doesn't interfere with command substitution
    echo >&2
    echo "Available worktrees for $repo_name:" >&2
    echo "==================================" >&2

    # Display numbered options
    local i=1
    for option in "${options[@]}"; do
        echo "$i) $option" >&2
        ((i++))
    done
    echo >&2

    # Custom menu with read
    while true; do
        echo -n "Select a worktree (1-${#options[@]}, or press Enter to create new): " >&2
        read -r choice

        # If empty (just pressed Enter), go to manual entry
        if [[ -z "$choice" ]]; then
            return 1
        fi

        # Check if valid number
        if [[ "$choice" =~ ^[0-9]+$ ]] && [[ "$choice" -ge 1 && "$choice" -le ${#options[@]} ]]; then
            # Valid selection - output the branch name
            echo "${options[$((choice-1))]}"
            return 0
        fi

        echo "Invalid selection. Please try again." >&2
    done
}

main() {
    local branch_name="$1"
    local base_branch="$2"
    
    echo "🚀 Claude Code Launcher with Worktree Setup"
    echo "==========================================="
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        echo "❌ Not in a git repository. Please run this from within a git repository."
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
                echo
                echo "Please enter a tree name (e.g., PROJ-123-add-new-feature):"
                read -r branch_name

                if [ -z "$branch_name" ]; then
                    echo "❌ Tree name is required"
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
            # echo "Do you want to remove it and create a new one? (y/N):"
            # read -r response
            # if [[ "$response" =~ ^[Yy]$ ]]; then
            #     log_info "Removing existing worktree..."
            #     git worktree remove "$worktree_path" 2>/dev/null || rm -rf "$worktree_path"
            # else
            log_info "Using existing worktree directory"
            cd "$worktree_path"
            log_success "Changed to worktree: $branch_name"
            claude
            return
            # fi
        fi
        
        # Create the worktree
        log_info "Creating git worktree..."
        if git worktree add -b "$branch_name" "$worktree_path" "$base_branch"; then
            log_success "Worktree created successfully"
            
            # Change to the worktree directory
            cd "$worktree_path"
            log_info "Changed to worktree directory: $(pwd)"

            # Run setup commands from .divaide if present
            if [[ -f ".divaide" ]]; then
                log_info "Running setup commands from .divaide..."
                while IFS= read -r line; do
                    [[ -z "$line" || "$line" =~ ^# ]] && continue
                    log_info "Executing: $line"
                    eval "$line"
                done < .divaide
            else
                log_info "No .divaide file found, skipping setup."
            fi
            
            # Start Claude Code
            log_info "Starting Claude Code..."
            echo
            
            # Set environment variables for Claude Code
            export CLAUDE_TICKET_NAME="$branch_name"
            export CLAUDE_WORKTREE_PATH="$(pwd)"
            
            # Launch Claude Code
            claude
            break
        else
            echo "❌ Failed to create worktree '$branch_name'"
            echo "Please try a different tree name."
            branch_name=""  # Reset to prompt again
        fi
    done
}

# Show help if requested
if [[ "$1" == "-h" || "$1" == "--help" || "$1" == "help" ]]; then
    echo "Usage: $0 [branch-name] [base-branch]"
    echo ""
    echo "Creates a git worktree and launches Claude Code in it."
    echo "Works with any git repository - detects repo name and default branch automatically."
    echo ""
    echo "Arguments:"
    echo "  branch-name    Branch name for the worktree (will prompt if not provided)"
    echo "  base-branch    Base branch to branch from (auto-detected if not provided)"
    echo ""
    echo "Examples:"
    echo "  $0                                        # Interactive mode"
    echo "  $0 PROJ-123-add-new-feature             # Create worktree for specific branch"
    echo "  $0 feature-auth main                      # Create worktree from main branch"
    echo ""
    echo "The script must be run from within a git repository."
    return 0
fi

main "$@"