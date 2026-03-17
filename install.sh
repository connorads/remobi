#!/usr/bin/env bash
set -euo pipefail

# Run with: /bin/bash -c "$(curl -fsSL http://remobi.app/install.sh)"
# The $() substitution downloads the script first, so stdin stays as the terminal.
# This is the same pattern Homebrew uses — TUI apps like claude need real terminal stdin.

# ── Colours ───────────────────────────────────────────────────────────────────

setup_colours() {
  if [[ -n "${NO_COLOR:-}" ]] || [[ ! -t 1 ]]; then
    GREEN="" BLUE="" RED="" YELLOW="" DIM="" BOLD="" RESET=""
  elif [[ "${COLORTERM:-}" == "truecolor" ]] || [[ "${COLORTERM:-}" == "24bit" ]]; then
    GREEN=$'\033[38;2;166;227;161m'
    BLUE=$'\033[38;2;137;180;250m'
    RED=$'\033[38;2;243;139;168m'
    YELLOW=$'\033[38;2;249;226;175m'
    DIM=$'\033[38;2;108;112;134m'
    BOLD=$'\033[1m'
    RESET=$'\033[0m'
  elif command -v tput >/dev/null 2>&1 && [[ "$(tput colors 2>/dev/null || echo 0)" -ge 256 ]]; then
    GREEN=$'\033[38;5;151m'
    BLUE=$'\033[38;5;111m'
    RED=$'\033[38;5;211m'
    YELLOW=$'\033[38;5;223m'
    DIM=$'\033[38;5;243m'
    BOLD=$'\033[1m'
    RESET=$'\033[0m'
  else
    GREEN=$'\033[32m'
    BLUE=$'\033[34m'
    RED=$'\033[31m'
    YELLOW=$'\033[33m'
    DIM=$'\033[2m'
    BOLD=$'\033[1m'
    RESET=$'\033[0m'
  fi
}

# ── Formatting ────────────────────────────────────────────────────────────────

info()    { printf "  %s>%s %s\n" "$BLUE" "$RESET" "$1"; }
success() { printf "  %s✓%s %s\n" "$GREEN" "$RESET" "$1"; }
error()   { printf "  %s✗%s %s\n" "$RED" "$RESET" "$1" >&2; }
step()    { printf "\n  %s[%s/%s]%s %s\n" "$BOLD" "$1" "$2" "$RESET" "$3"; }

# ── Logo ──────────────────────────────────────────────────────────────────────

print_logo() {
  local g="$GREEN" b="$BLUE" r="$RESET"
  printf "    %s██████╗ %s    %s██╗%s\n"  "$g" "$r" "$b" "$r"
  printf "    %s██╔══██╗%s    %s╚██╗%s\n" "$g" "$r" "$b" "$r"
  printf "    %s██████╔╝%s     %s╚██╗%s\n" "$g" "$r" "$b" "$r"
  printf "    %s██╔══██╗%s     %s██╔╝%s\n" "$g" "$r" "$b" "$r"
  printf "    %s██║  ██║%s    %s██╔╝%s\n"  "$g" "$r" "$b" "$r"
  printf "    %s╚═╝  ╚═╝%s    %s╚═╝%s\n"  "$g" "$r" "$b" "$r"
}

# ── Main ──────────────────────────────────────────────────────────────────────

setup_colours

echo ""
print_logo
echo ""
printf "    %sremobi%s %s— your terminal, everywhere%s\n" "$BOLD" "$RESET" "$DIM" "$RESET"
printf "    %shttps://github.com/connorads/remobi%s\n" "$DIM" "$RESET"
echo ""
echo "    This script will:"
echo "      1. Install the remobi setup skill"
echo "      2. Ask which coding agent you use"
echo "      3. Start an interactive setup session"
echo ""
read -r -p "    Press Enter to continue..."

# ── Step 1: Install the remobi setup skill ────────────────────────────────────

step 1 3 "Installing the remobi setup skill"
echo ""
npx skills add connorads/remobi
echo ""
success "Skill installed"

# ── Step 2: Pick a coding agent ───────────────────────────────────────────────

step 2 3 "Choosing a coding agent"
echo ""
echo "    Which coding agent do you use?"
echo ""
printf "      %s1)%s Claude Code\n" "$BOLD" "$RESET"
printf "      %s2)%s Codex\n" "$BOLD" "$RESET"
echo ""
printf "    Choose %s[1-2]%s: " "$YELLOW" "$RESET"
read -r choice

case "$choice" in
  1) agent="claude"; agent_name="Claude Code" ;;
  2) agent="codex";  agent_name="Codex" ;;
  *)
    echo ""
    error "Invalid choice — please enter 1 or 2"
    exit 1
    ;;
esac

echo ""
success "Selected $agent_name"

# ── Step 3: Launch setup session ──────────────────────────────────────────────

step 3 3 "Launching setup session"

if ! command -v "$agent" > /dev/null 2>&1; then
  echo ""
  error "'$agent' is not installed"
  echo ""
  info "Install it first:"
  echo ""
  case "$agent" in
    claude) echo "      curl -fsSL https://claude.ai/install.sh | bash" ;;
    codex)  echo "      npm install -g @openai/codex" ;;
  esac
  echo ""
  info "Then re-run this script."
  exit 1
fi

echo ""
info "Starting $agent with the remobi-setup skill..."
echo ""

# exec replaces this shell with the agent process, giving it full terminal control
exec "$agent" "Use the remobi-setup skill to onboard me."
