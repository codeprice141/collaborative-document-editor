#!/usr/bin/env bash
set -e

echo "=== Running Backend Automated Test Suite ==="
export PYTHONPATH=backend
.venv/bin/pytest backend/tests -v
