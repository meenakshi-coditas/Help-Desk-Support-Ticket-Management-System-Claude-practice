---
name: register
description: Register a skill in this repo from a name and a pasted skill definition. Use when the user says "register this skill as <name>", "register a skill", or pastes a SKILL.md (frontmatter plus process) and gives it a name. Saves the skill verbatim to .claude/skills/<name>/SKILL.md, commits, and pushes to the session branch.
---

# Register a skill

## Inputs

- **Skill name** — the quoted/stated name (e.g. `zenith-qa-bug-impact`). Use it as the directory name and as the `name:` frontmatter value.
- **Skill process** — the pasted skill body (frontmatter + instructions). If the user pasted only part of it, or gave a name with no content, ask for the content; don't invent it.

## Steps

1. Check `.claude/skills/<name>/` in the primary working directory. If it already exists, read it and confirm with the user before overwriting.
2. Write the pasted content verbatim to `.claude/skills/<name>/SKILL.md`. Do not rewrite, summarize, or "improve" it.
3. Frontmatter: if the pasted text has none, add `name` and a one-sentence `description` derived from the content. If its `name:` differs from the requested name, use the requested name and say so.
4. Include any supporting files the user provided under the same directory (e.g. `scripts/`, `references/`); never fabricate them.
5. Commit only the skill directory, then push with `git push -u origin <session branch>` (retry on network errors only, 2s/4s/8s/16s). Use the branch and commit attribution the session specifies. Do not open a PR unless asked.
6. Report in a few lines: the path, the branch pushed, and anything in the skill that depends on tools/servers not available in this session (e.g. MCP servers, local paths). Don't claim it works without verifying those.

## Notes

- Registered skills are project-level (this repo only), not installed in the user's local `~/.claude/skills`; say so in the report.
- Don't execute the registered skill as part of registering it.
