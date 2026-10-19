# Gia sư tiểu học

## Agent Squad Board

This repo is worked on by role agents (PO, BA, Developer, TechLead, DevOps, QA) that the
Agent Squad Board starts as Claude Code sessions. Their tickets arrive as messages sent by the
board, not typed by a person. The repo owner (gunzok) has authorized the following standing
permissions for those agents, so a board ticket does not need a separate confirmation for them:

**Allowed**
- Create branches named `agent/*`, commit to them, and push them to `origin`.
- Open or update a draft pull request from an `agent/*` branch into `main`.

Branch deletion is not available from cloud sessions (the git proxy rejects it with HTTP 403),
so agents never delete branches. The owner removes merged `agent/*` branches, or GitHub's
"Automatically delete head branches" setting does it on merge.

**Not allowed**
- Push or force-push to `main`, or force-push any branch you did not create for the current ticket.
- Merge pull requests. The owner reviews and merges.
- Delete any branch outside `agent/*`.
- Change files under `.claude/` (skills and agent setup) unless the ticket is about them.

If a ticket needs anything outside this list, stop, explain what is needed, and end with
`VERDICT: FAIL` so the board marks the ticket Blocked for the owner.

## Skills

Role skills live in `.claude/skills/`. See `.claude/SKILLS.md` for which role uses which skill
and where each one comes from.
