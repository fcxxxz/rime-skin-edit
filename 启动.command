#!/bin/zsh
# Standalone mode: put the Rime config folder path (e.g. ~/Library/Rime) in
# Rime目录.txt next to this script. Without it, the parent folder is used.
cd "$(dirname "$0")" || exit 1
EDITOR_DIR="$PWD"

resolve_rime_root() {
  local config=""
  if [ -f "$EDITOR_DIR/Rime目录.txt" ]; then
    config="$EDITOR_DIR/Rime目录.txt"
  elif [ -f "$EDITOR_DIR/RimeRoot.txt" ]; then
    config="$EDITOR_DIR/RimeRoot.txt"
  fi
  if [ -n "$config" ]; then
    head -n 1 "$config" | tr -d '\r' | xargs
    return
  fi
  (cd "$EDITOR_DIR/.." && pwd)
}

RIME_ROOT="$(resolve_rime_root)"
HTML_PATH="$EDITOR_DIR/index.html"

open_static_editor() {
  echo "未找到可直接使用的 Python 3.7+，无法自动启动本地服务。"
  echo "将打开网页版；请使用 Chrome 或 Edge 选择 Rime 配置文件夹。"
  if open -a "Google Chrome" "$HTML_PATH" >/dev/null 2>&1; then
    return
  fi
  if open -a "Microsoft Edge" "$HTML_PATH" >/dev/null 2>&1; then
    return
  fi
  open "$HTML_PATH"
}

python_ok() {
  "$1" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)' >/dev/null 2>&1
}

PYTHON_BIN="$(command -v python3 2>/dev/null || true)"
if [ -n "$PYTHON_BIN" ] && [ "$PYTHON_BIN" != "/usr/bin/python3" ] && python_ok "$PYTHON_BIN"; then
  "$PYTHON_BIN" "$EDITOR_DIR/local/local_server.py" --root "$RIME_ROOT"
elif xcode-select -p >/dev/null 2>&1 && [ -x /usr/bin/python3 ] && python_ok /usr/bin/python3; then
  /usr/bin/python3 "$EDITOR_DIR/local/local_server.py" --root "$RIME_ROOT"
else
  open_static_editor
  read -r "unused?按回车关闭..."
fi
