---
description: "Clean up a completed Clubs task worktree for this ar-002-clubs repo. Use this when the user says 워크트리 종료, 워크트리 정리, 워크트리 삭제, 태스크 종료, TU 종료, 작업 종료, 작업 정리, or asks to clean up/delete/close a worktree, task, TU, or work item. Remove the sibling worktree under ../clubs-worktrees, delete its local branch, and clean up leftover directories. Never use it for the current worktree or primary checkout."
---

# Clubs Task Cleanup

Delete a completed worktree and its local branch to free local disk space.

## When to use

Use this skill when:

- the user says a task is complete and wants the worktree removed
- the user says 워크트리 종료, 워크트리 정리, or 워크트리 삭제
- the user says 태스크 종료, TU 종료, or 작업 종료
- the user asks to remove a TU worktree under `../clubs-worktrees`
- the user wants the local branch deleted after the worktree is no longer needed

Do not use this skill to remove:

- the current worktree you are actively editing in
- the primary repository checkout
- a worktree with uncommitted changes unless the user explicitly wants a forced delete

## Trigger aliases

Treat these natural-language aliases as this skill:

- 워크트리 종료 / 워크트리 정리 / 워크트리 삭제
- 태스크 종료 / 태스크 정리 / 태스크 삭제
- TU 종료 / TU 정리 / TU 삭제
- 작업 종료 / 작업 정리 / 작업 삭제 / 작업 마무리

## Inputs

Prefer one of these:

- branch name, for example `TU-408`
- worktree path, for example `/Users/kwonhyukwon/developer/clubs-worktrees/TU-408`

If the user gives only a TU number, convert it to `TU-<number>`.
If the user gives no target, `pnpm clubs-task-cleanup` must abort and ask for an explicit non-current worktree target.

## Safety rules

Before deleting:

1. Inspect `git worktree list`
2. Resolve which path belongs to the target branch
3. Run `git status --short --branch` in the target worktree
4. Refuse deletion if:
   - the target is the current worktree
   - the target is the primary repo root
   - the target has uncommitted changes and the user did not request force

## Preferred execution path

Use the helper command:

`pnpm clubs-task-cleanup -- --branch TU-408`

Optional modes:

- Path-based:
  - `pnpm clubs-task-cleanup -- --worktree-path /Users/kwonhyukwon/developer/clubs-worktrees/TU-408`
- Forced delete:
  - `pnpm clubs-task-cleanup -- --branch TU-408 --force`
- Preview only:
  - `pnpm clubs-task-cleanup -- --branch TU-408 --dry-run`
- No explicit target:
  - `pnpm clubs-task-cleanup`
  - abort and require `--branch` or `--worktree-path` for a non-current worktree

## Expected behavior

The helper should:

1. remove the git worktree registration
2. remove the local worktree directory if anything is left behind
3. delete the local branch
4. leave remote branches untouched
5. treat already-removed branch/worktree state as success instead of failing

## Validation

After deletion:

1. `git worktree list` should no longer show the target
2. the worktree directory should not exist
3. `git branch --list TU-408` should be empty

## Response expectations

When you finish:

- state which worktree was targeted
- state which local branch was deleted
- state whether force was used
- state whether the directory was fully removed
