#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "[1/2] Building web assets..."
npm run build

echo "[2/2] Packaging macOS arm64 DMG..."
npx electron-builder --mac --arm64 --publish never
