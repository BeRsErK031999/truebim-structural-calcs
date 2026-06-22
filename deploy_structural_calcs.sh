#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SSH_USER="${SSH_USER:-admin_devops}"
SSH_HOST="${SSH_HOST:-192.168.22.37}"
SSH_TARGET="${SSH_USER}@${SSH_HOST}"

PROJECT_NAME="${PROJECT_NAME:-truebim-structural-calcs}"
IMAGE_REF="${IMAGE_REF:-truebim-structural-calcs:latest}"
IMAGE_ARCHIVE="${IMAGE_ARCHIVE:-${SCRIPT_DIR}/.truebim-structural-calcs-image.tar}"
REMOTE_IMAGE="${REMOTE_IMAGE:-/opt/apps/images/truebim-structural-calcs.tar}"
REMOTE_PROJECT="${REMOTE_PROJECT:-truebim-structural-calcs}"
REMOVE_LOCAL_IMAGE="${REMOVE_LOCAL_IMAGE:-0}"
VITE_BASE_PATH="${VITE_BASE_PATH:-/}"

PACKAGE_VERSION="$(node -p "require('./package.json').version")"
GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

cleanup() {
  rm -f "$IMAGE_ARCHIVE"
  docker image prune -f >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> Building ${PROJECT_NAME}"
npm run deploy:precheck
npm run lint
npm run typecheck
npm run test
VITE_BASE_PATH="$VITE_BASE_PATH" npm run build

echo "==> Building Docker image ${IMAGE_REF}"
docker build \
  --build-arg VITE_APP_VERSION="$PACKAGE_VERSION" \
  --build-arg VITE_GIT_COMMIT="$GIT_COMMIT" \
  --build-arg VITE_BUILD_TIME="$BUILD_TIME" \
  --build-arg VITE_APP_ENV=production \
  --build-arg VITE_BASE_PATH="$VITE_BASE_PATH" \
  -t "$IMAGE_REF" \
  .

echo "==> Saving Docker image archive"
docker save "$IMAGE_REF" -o "$IMAGE_ARCHIVE"

if [[ -n "${TRUEBIM_DEPLOY_PASSWORD:-}" ]]; then
  echo "==> Uploading image archive with password SSH"
  python - "$SSH_HOST" "$SSH_USER" "$TRUEBIM_DEPLOY_PASSWORD" "$IMAGE_ARCHIVE" "$REMOTE_IMAGE" <<'PY'
import os
import posixpath
import sys

import paramiko

host, user, password, local_path, remote_path = sys.argv[1:]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=host, username=user, password=password, look_for_keys=False, allow_agent=False)
try:
    remote_dir = posixpath.dirname(remote_path)
    stdin, stdout, stderr = client.exec_command(f"mkdir -p {remote_dir!r}")
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise SystemExit(stderr.read().decode("utf-8", "replace"))
    with client.open_sftp() as sftp:
        sftp.put(local_path, remote_path)
finally:
    client.close()
PY

  echo "==> Redeploying ${REMOTE_PROJECT}"
  python - "$SSH_HOST" "$SSH_USER" "$TRUEBIM_DEPLOY_PASSWORD" "$REMOTE_IMAGE" "$REMOTE_PROJECT" <<'PY'
import sys

import paramiko

host, user, password, remote_image, remote_project = sys.argv[1:]
command = f"""
set -e
cd /opt/apps
./scripts/load-image.sh {remote_image}
./scripts/deploy-project.sh {remote_project}
docker image prune -f
"""

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=host, username=user, password=password, look_for_keys=False, allow_agent=False)
try:
    stdin, stdout, stderr = client.exec_command(command)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    if out:
        print(out, end="")
    if err:
        print(err, end="", file=sys.stderr)
    if code != 0:
        raise SystemExit(code)
finally:
    client.close()
PY
else
  echo "==> Uploading image archive with scp"
  scp "$IMAGE_ARCHIVE" "${SSH_TARGET}:${REMOTE_IMAGE}"

  echo "==> Redeploying ${REMOTE_PROJECT}"
  ssh "$SSH_TARGET" "bash -lc 'set -e; cd /opt/apps; ./scripts/load-image.sh ${REMOTE_IMAGE}; ./scripts/deploy-project.sh ${REMOTE_PROJECT}; docker image prune -f'"
fi

if [[ "$REMOVE_LOCAL_IMAGE" == "1" ]]; then
  echo "==> Removing local image ${IMAGE_REF}"
  docker image rm "$IMAGE_REF" >/dev/null || true
fi

echo "==> Done"
echo "URL: https://truebim-structural-calcs.truebim-6d.ru/"
