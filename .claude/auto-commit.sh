#!/bin/bash
cd /home/user/Lenzly
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git add -A
  git commit -m "Auto-commit: save work in progress"
  git push -u origin "$(git rev-parse --abbrev-ref HEAD)" 2>&1 || true
fi
