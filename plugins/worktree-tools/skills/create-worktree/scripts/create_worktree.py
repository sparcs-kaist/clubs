#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shlex
import shutil
import subprocess
import sys
from pathlib import Path


IGNORED_COPY_CANDIDATES = [".env", ".clubs-secrets", ".claude"]
BOOTSTRAP_COMMANDS = [
    "source ~/.nvm/nvm.sh && (nvm use 22.22.1 || nvm install 22.22.1)",
    "pnpm install",
    "pnpm rebuild @prisma/client prisma",
    "pnpm --filter api prisma:generate",
]


def run(cmd: str, cwd: Path, dry_run: bool) -> None:
    print(f"$ (cd {cwd} && {cmd})")
    if dry_run:
        return
    subprocess.run(["/bin/zsh", "-lc", cmd], cwd=cwd, check=True)


def git_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
        check=True,
    )
    return Path(result.stdout.strip())


def primary_worktree_root(repo_root: Path) -> Path:
    result = subprocess.run(
        ["git", "worktree", "list", "--porcelain"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=True,
    )
    for line in result.stdout.splitlines():
        if line.startswith("worktree "):
            return Path(line.removeprefix("worktree ").strip())
    raise RuntimeError("Could not determine the primary worktree root.")


def remote_branch_exists(repo_root: Path, branch: str) -> bool:
    result = subprocess.run(
        ["git", "show-ref", "--verify", "--quiet", f"refs/remotes/origin/{branch}"],
        cwd=repo_root,
    )
    return result.returncode == 0


def local_branch_exists(repo_root: Path, branch: str) -> bool:
    result = subprocess.run(
        ["git", "show-ref", "--verify", "--quiet", f"refs/heads/{branch}"],
        cwd=repo_root,
    )
    return result.returncode == 0


def copy_candidate(src_root: Path, dest_root: Path, relative: str, dry_run: bool) -> bool:
    src = src_root / relative
    dest = dest_root / relative
    if not src.exists():
        return False
    print(f"$ copy {src} -> {dest}")
    if dry_run:
        return True
    if src.is_dir():
        shutil.copytree(src, dest, dirs_exist_ok=True)
    else:
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
    return True


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create and bootstrap a sibling worktree for ar-002-clubs."
    )
    parser.add_argument("--branch", required=True, help="Branch name to use in the worktree.")
    parser.add_argument(
        "--start-point",
        default="origin/dev",
        help="Git ref to branch from when creating a fresh branch. Default: origin/dev",
    )
    parser.add_argument(
        "--reuse-remote-branch",
        action="store_true",
        help="Reuse origin/<branch> if it already exists instead of branching from start-point.",
    )
    parser.add_argument(
        "--worktree-name",
        help="Override the target worktree directory name. Defaults to branch with '/' replaced by '-'.",
    )
    parser.add_argument(
        "--skip-bootstrap",
        action="store_true",
        help="Create and copy files only; skip install/rebuild/generate commands.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print actions without changing git state or files.",
    )

    args = parser.parse_args()

    repo_root = git_root()
    source_root = primary_worktree_root(repo_root)
    worktrees_root = source_root.parent / "clubs-worktrees"
    worktree_name = args.worktree_name or args.branch.replace("/", "-")
    target = worktrees_root / worktree_name

    print(f"Current repo root: {repo_root}")
    print(f"Source repo root: {source_root}")
    print(f"Worktrees root: {worktrees_root}")
    print(f"Target branch: {args.branch}")
    print(f"Target worktree: {target}")

    if target.exists():
        raise SystemExit(f"Target worktree already exists: {target}")

    if args.dry_run:
        print(f"$ mkdir -p {worktrees_root}")
    else:
        worktrees_root.mkdir(parents=True, exist_ok=True)

    if args.reuse_remote_branch and remote_branch_exists(source_root, args.branch):
        if local_branch_exists(source_root, args.branch):
            cmd = ["git", "worktree", "add", str(target), args.branch]
        else:
            cmd = ["git", "worktree", "add", "-b", args.branch, str(target), f"origin/{args.branch}"]
    else:
        cmd = ["git", "worktree", "add", "-b", args.branch, str(target), args.start_point]

    print("$ " + " ".join(shlex.quote(part) for part in cmd))
    if not args.dry_run:
        subprocess.run(cmd, cwd=source_root, check=True)

    copied = []
    for candidate in IGNORED_COPY_CANDIDATES:
        if copy_candidate(source_root, target, candidate, args.dry_run):
            copied.append(candidate)

    if copied:
        print("Copied ignored files:")
        for item in copied:
            print(f" - {item}")
    else:
        print("No ignored files were copied.")

    if not args.skip_bootstrap:
        for command in BOOTSTRAP_COMMANDS:
            run(command, target, args.dry_run)

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
