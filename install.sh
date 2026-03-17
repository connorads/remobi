#!/usr/bin/env bash
set -euo pipefail

# Run with: /bin/bash -c "$(curl -fsSL http://remobi.app/install.sh)"
# The $() substitution downloads the script first, so stdin stays as the terminal.
# This is the same pattern Homebrew uses — TUI apps like claude need real terminal stdin.

echo ""
echo "  remobi — your terminal, everywhere"
echo "  https://github.com/connorads/remobi"
echo ""
echo "  This script will:"
echo "    1. Install the remobi setup skill (via npx skills)"
echo "    2. Ask which coding agent you use"
echo "    3. Start an interactive agent session that walks you through setup"
echo ""
read -r -p "Press Enter to continue..."

# ── Install the remobi-setup skill ──────────────────────────────────────────

echo ""
echo "Installing the remobi setup skill..."
echo ""
npx skills add connorads/remobi
echo ""

# ── Pick a coding agent ─────────────────────────────────────────────────────

echo "Which coding agent do you use?"
echo "  1) Claude Code"
echo "  2) Codex"
printf "Choose [1-2]: "
read -r choice

case "$choice" in
  1) agent="claude" ;;
  2) agent="codex" ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

# ── Check the agent is installed ────────────────────────────────────────────

if ! command -v "$agent" > /dev/null 2>&1; then
  echo ""
  echo "Error: '$agent' is not installed."
  echo ""
  case "$agent" in
    claude) echo "  curl -fsSL https://claude.ai/install.sh | bash" ;;
    codex)  echo "  npm install -g @openai/codex" ;;
  esac
  echo ""
  echo "Install it, then re-run this script."
  exit 1
fi

# ── Launch interactive setup session ────────────────────────────────────────

echo ""
echo "Starting $agent with the remobi-setup skill..."
echo ""

# exec replaces this shell with the agent process, giving it full terminal control
exec "$agent" "Use the remobi-setup skill to onboard me."
