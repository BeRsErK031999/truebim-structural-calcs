#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SSH_USER="${SSH_USER:-admin_devops}"
SSH_HOST="${SSH_HOST:-192.168.22.37}"
SSH_TARGET="${SSH_USER}@${SSH_HOST}"

PROJECT_NAME="${PROJECT_NAME:-truebim-structural-calcs}"
SERVICE_NAME="${SERVICE_NAME:-truebim-structural-calcs}"
IMAGE_REF="${IMAGE_REF:-truebim-structural-calcs:latest}"
IMAGE_ARCHIVE="${IMAGE_ARCHIVE:-${SCRIPT_DIR}/.truebim-structural-calcs-image.tgz}"
REMOTE_IMAGE="${REMOTE_IMAGE:-/opt/apps/images/truebim-structural-calcs.tgz}"
REMOTE_PROJECT="${REMOTE_PROJECT:-truebim-structural-calcs}"
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-/opt/apps/projects/${REMOTE_PROJECT}}"
DEPLOY_MODE="${DEPLOY_MODE:-local-image}"
DEPLOY_DOCKERFILE="${DEPLOY_DOCKERFILE:-${SCRIPT_DIR}/docker/deploy-static.Dockerfile}"
RUN_DEPLOY_CHECKS="${RUN_DEPLOY_CHECKS:-0}"
REMOVE_LOCAL_IMAGE="${REMOVE_LOCAL_IMAGE:-0}"
PRUNE_LOCAL_IMAGES="${PRUNE_LOCAL_IMAGES:-0}"
PRUNE_REMOTE_IMAGES="${PRUNE_REMOTE_IMAGES:-0}"
VITE_BASE_PATH="${VITE_BASE_PATH:-/}"

PACKAGE_VERSION="$(node -p "require('./package.json').version")"
GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

cleanup() {
  rm -f "$IMAGE_ARCHIVE"
  if [[ "$REMOVE_LOCAL_IMAGE" == "1" ]]; then
    docker image rm "$IMAGE_REF" >/dev/null 2>&1 || true
  fi
  if [[ "$PRUNE_LOCAL_IMAGES" == "1" ]]; then
    docker image prune -f >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

upload_image_archive() {
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

    return
  fi

  echo "==> Uploading image archive with scp"
  scp "$IMAGE_ARCHIVE" "${SSH_TARGET}:${REMOTE_IMAGE}"
}

redeploy_uploaded_image() {
  if [[ -n "${TRUEBIM_DEPLOY_PASSWORD:-}" ]]; then
    echo "==> Redeploying ${REMOTE_PROJECT}"
    python - "$SSH_HOST" "$SSH_USER" "$TRUEBIM_DEPLOY_PASSWORD" "$REMOTE_IMAGE" "$REMOTE_PROJECT_DIR" "$SERVICE_NAME" "$PRUNE_REMOTE_IMAGES" <<'PY'
import shlex
import sys

import paramiko

host, user, password, remote_image, remote_project_dir, service_name, prune_remote_images = sys.argv[1:]
command = f"""
set -euo pipefail
cd {shlex.quote(remote_project_dir)}
docker load -i {shlex.quote(remote_image)}
docker compose up -d --no-build --force-recreate {shlex.quote(service_name)}
echo
docker compose ps
echo
docker compose logs --tail=50 {shlex.quote(service_name)}
if [ {shlex.quote(prune_remote_images)} = 1 ]; then
  docker image prune -f
fi
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

    return
  fi

  echo "==> Redeploying ${REMOTE_PROJECT}"
  ssh "$SSH_TARGET" << EOF
set -euo pipefail

REMOTE_IMAGE="${REMOTE_IMAGE}"
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR}"
SERVICE_NAME="${SERVICE_NAME}"
PRUNE_REMOTE_IMAGES="${PRUNE_REMOTE_IMAGES}"

cd "\${REMOTE_PROJECT_DIR}"
docker load -i "\${REMOTE_IMAGE}"
docker compose up -d --no-build --force-recreate "\${SERVICE_NAME}"
echo
docker compose ps
echo
docker compose logs --tail=50 "\${SERVICE_NAME}"
if [ "\${PRUNE_REMOTE_IMAGES}" = "1" ]; then
  docker image prune -f
fi
EOF
}

redeploy_remote_image() {
  if [[ -n "${TRUEBIM_DEPLOY_PASSWORD:-}" ]]; then
    echo "==> Pulling and recreating ${REMOTE_PROJECT} with password SSH"
    python - "$SSH_HOST" "$SSH_USER" "$TRUEBIM_DEPLOY_PASSWORD" "$REMOTE_PROJECT_DIR" "$SERVICE_NAME" "$PRUNE_REMOTE_IMAGES" <<'PY'
import shlex
import sys

import paramiko

host, user, password, remote_project_dir, service_name, prune_remote_images = sys.argv[1:]
command = f"""
set -euo pipefail
cd {shlex.quote(remote_project_dir)}
docker compose pull {shlex.quote(service_name)}
docker compose up -d --no-build --force-recreate {shlex.quote(service_name)}
echo
docker compose ps
echo
docker compose logs --tail=50 {shlex.quote(service_name)}
if [ {shlex.quote(prune_remote_images)} = 1 ]; then
  docker image prune -f
fi
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

    return
  fi

  echo "==> Pulling and recreating ${REMOTE_PROJECT}"
  ssh "$SSH_TARGET" << EOF
set -euo pipefail

REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR}"
SERVICE_NAME="${SERVICE_NAME}"
PRUNE_REMOTE_IMAGES="${PRUNE_REMOTE_IMAGES}"

cd "\${REMOTE_PROJECT_DIR}"
docker compose pull "\${SERVICE_NAME}"
docker compose up -d --no-build --force-recreate "\${SERVICE_NAME}"
echo
docker compose ps
echo
docker compose logs --tail=50 "\${SERVICE_NAME}"
if [ "\${PRUNE_REMOTE_IMAGES}" = "1" ]; then
  docker image prune -f
fi
EOF
}

echo "==> Deploy mode: ${DEPLOY_MODE}"
echo "==> Project: ${PROJECT_NAME}"
echo "==> Service: ${SERVICE_NAME}"

case "$DEPLOY_MODE" in
  local-image)
    if [[ "$RUN_DEPLOY_CHECKS" == "1" ]]; then
      echo "==> Running deployment checks"
      npm run deploy:precheck
      npm run lint
      npm run typecheck
      npm run test
    else
      echo "==> Skipping deployment checks (set RUN_DEPLOY_CHECKS=1 to enable)"
    fi

    echo "==> Building ${PROJECT_NAME}"
    MSYS_NO_PATHCONV=1 \
      VITE_APP_VERSION="$PACKAGE_VERSION" \
      VITE_GIT_COMMIT="$GIT_COMMIT" \
      VITE_BUILD_TIME="$BUILD_TIME" \
      VITE_APP_ENV=production \
      VITE_BASE_PATH="$VITE_BASE_PATH" \
      npm run build

    echo "==> Packaging Docker image ${IMAGE_REF}"
    docker build \
      -f "$DEPLOY_DOCKERFILE" \
      -t "$IMAGE_REF" \
      "$SCRIPT_DIR"

    echo "==> Saving compressed Docker image archive"
    rm -f "$IMAGE_ARCHIVE"
    docker save "$IMAGE_REF" | gzip -1 > "$IMAGE_ARCHIVE"
    echo "Archive: ${IMAGE_ARCHIVE}"

    upload_image_archive
    redeploy_uploaded_image
    ;;
  remote-pull)
    redeploy_remote_image
    ;;
  *)
    echo "ERROR: unsupported DEPLOY_MODE: ${DEPLOY_MODE}" >&2
    echo "Use DEPLOY_MODE=local-image or DEPLOY_MODE=remote-pull." >&2
    exit 1
    ;;
esac

echo "==> Done"
echo "URL: https://structural-calcs.truebim-6d.ru/"
