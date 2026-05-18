---
name: create-branch-pr
description: Create a branch or pull request for this ar-002-clubs repo when the user gives a TU task, Notion spec link, task DB link, or GitHub PR link. Use it to confirm the task document first, create a Notion task page when one does not exist, extract the TU number, create or reuse the correct branch, and open a correctly titled PR against dev with the Notion context attached.
metadata:
  short-description: Create TU branches and PRs from task context
---

# Create Branch PR

Standardize branch and pull request creation for this repo from task context.

## When to use

Use this skill when:

- the user wants to start a new TU task and needs a branch
- the user wants a PR created from the current branch
- the user gives a Notion task/spec page and wants the matching branch or PR
- the user gives a PR link and wants to inspect or reuse its branch

## Task source is mandatory

Before creating a branch or PR, confirm the task document.

### Supported starting states

1. Existing Notion task page link
2. Existing task number when the task page already exists in Notion
3. No task page yet, but the user gives the task contents so a new Notion task page can be created first

Always resolve these into a confirmed TU number before you create the branch or PR.

### If the user gives a Notion task/spec page

1. Fetch the page if Notion tools are available.
2. Extract:
   - TU number
   - task title
   - task summary
   - acceptance criteria
3. Save the Notion page URL for PR context.

### If the user gives only a task number

1. Treat the task number as the source of truth for branch naming.
2. If Notion tools are available, fetch the matching task page and pull the summary from there.
3. If Notion tools are unavailable, ask the user for the task title and summary before creating the PR body.

### If the user gives a PR link

1. Use `gh pr view` to inspect:
   - PR number
   - title
   - body
   - `headRefName`
   - `baseRefName`
2. If the task page is linked in the PR body, keep using that Notion page as the task source.
3. Reuse the PR head branch instead of inventing a new branch.

### If the user needs a new task page

1. Use the Notion task DB:
   - `https://www.notion.so/sparcs/19cc25603b0b8050bc8ff9d4807e5f3a?v=19cc25603b0b8001a7e4000cfc41151a&source=copy_link`
2. Create a new task page in that DB when Notion tools are available.
3. Store the task summary there and obtain the task number.
4. If Notion tools are unavailable, stop and ask the user for:
   - TU number
   - task title
   - one-line summary

## Repo conventions

### Branch naming

- Fresh TU task: `TU-<number>`
- Existing PR: reuse `headRefName`
- If a non-TU branch already exists for the task, prefer the existing branch over inventing a new one

### PR title naming

- Default format: `[TU-405] short task title`
- Reuse the existing PR title if the PR already exists

### PR base branch

- Default base is `dev`

### PR body and patch note

Every PR body must include a `## Patch Note` section with this machine-readable block:

```md
<!-- clubs:patch-note:start -->
category: feature | fix | design | docs | internal | none
text: 사용자에게 보여도 자연스러운 한국어 패치노트 문장
<!-- clubs:patch-note:end -->
```

- Use `feature` for user-visible features.
- Use `fix` for user-visible bug fixes.
- Use `design` for UI, wording, or visual changes.
- Use `docs` for documentation-only changes.
- Use `internal` or `none` for refactors, tests, CI, tooling, or other changes that should not appear in the app patch note.
- Write `text` from the user's point of view, not as implementation details or filenames.
- If you use `--body-file`, confirm that the file already contains a valid `clubs:patch-note` block.

## Preferred execution path

Use the helper command:

`pnpm create-branch-pr -- <subcommand> ...`

### Branch creation

Examples:

- Fresh task:
  - `pnpm create-branch-pr -- branch --task-id TU-405 --start-point origin/dev`
- Existing remote branch:
  - `pnpm create-branch-pr -- branch --task-id TU-405 --reuse-remote-branch`

### PR creation

Examples:

- Auto body:
  - `pnpm create-branch-pr -- pr --task-id TU-405 --title "add clubs-task-start and clubs-task-cleanup skills" --notion-url <url> --summary "add project-local Codex and Claude Code skills" --patch-note-category internal --patch-note-text "사용자에게 직접 보이는 변경은 없습니다."`
- With explicit summary bullets:
  - `pnpm create-branch-pr -- pr --task-id TU-405 --title "add clubs-task-start and clubs-task-cleanup skills" --notion-url <url> --summary "add project-local Codex and Claude Code skills" --summary "add a shared Node helper" --patch-note-category internal --patch-note-text "사용자에게 직접 보이는 변경은 없습니다."`
- Existing task number without page URL:
  - `pnpm create-branch-pr -- pr --task-id TU-405 --title "add clubs-task-start and clubs-task-cleanup skills" --summary "add project-local Codex and Claude Code skills" --patch-note-category internal --patch-note-text "사용자에게 직접 보이는 변경은 없습니다."`

The helper does not create Notion task pages by itself. It assumes the task page already exists or the task summary is already known when you run the command.

## Validation

After branch creation:

1. Run `git status --short --branch`
2. Confirm the branch name matches the TU number or reused PR branch

After PR creation:

1. Run `gh pr view --json number,title,headRefName,baseRefName,url,body`
2. Confirm:
   - base is `dev`
   - title includes the TU number
   - Notion URL is present in the body
   - `## Patch Note` and the `clubs:patch-note` block are present
   - non-`none` categories have user-facing Korean `text`

## Response expectations

When you finish:

- state which task source you used
- state whether a Notion task page already existed or had to be created
- state the TU number
- state the branch name
- state whether you reused an existing branch or created a new one
- state the PR URL if one was created
