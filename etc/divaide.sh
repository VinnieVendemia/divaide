# etc/divaide.sh
divaide() {
  local target
  target="$("$(brew --prefix divaide)/libexec/divaide.sh" "$@")"
    
  if [ -d "$target" ]; then
    cd "$target" || return

    claude
  fi
}