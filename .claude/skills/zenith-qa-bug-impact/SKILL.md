---
name: zenith-qa-bug-impact
description: Assess whether a Zenith mobile QA bug/story ticket (Eko app, project QA on ekohealth.atlassian.net) impacts any test already filed in the Zenith E2E Repo. Understands the ticket's reproducible steps and the actual code fix (with optional source verification), then checks the ticket's linked QA test (Verification issue link) or its feature folder in Zephyr Squad for existing test steps that may now be stale. Every finding, including a "nothing existing is impacted" one, also recommends a QA follow-up action — smoke test only (crash fixes, telemetry/logging dedup, internal timing races with no user-visible behavior), a new test case warranted (a real, uncovered user-visible change), or no test needed (cosmetic/polish only — a string/copy fix is not automatically in this bucket). Read-only — never writes to Jira/Zephyr Squad. Packages findings as a Jira-comment-ready draft. Feeds /zenith-qa-test-case-gen, which drafts the acceptance criteria and test case content (including replacements for any flagged-stale steps), and /zenith-test-intake, which files the result. Use when the user wants to know what existing Zenith tests a bug/change impacts, wants a ticket checked against the Zenith repo before test-case work starts, or says things like "check this ticket against the Zenith repo", "what tests does this affect", "does this bug break any existing coverage".
---

# Zenith QA bug impact

## What this does

Given a Zenith mobile QA bug (or story/task) ticket, confirms you
understand what's actually broken and how it was fixed, then checks
whether that change makes any test step **already filed** in the Zenith
E2E Repo go stale — a step whose expected result no longer holds, a
precondition that no longer applies, a data value the change supersedes.

Every finding also answers a second question, regardless of whether
anything existing is affected: **does this fix need new manual QA
coverage, and how much?** A crash fix or a Crashlytics/logging
de-duplication doesn't need a scripted Zenith E2E test case — it needs a
smoke test against its specific trigger. A real, uncovered user-visible
change does warrant a new test case. Cosmetic polish usually warrants
neither. This triage call is part of the deliverable, not an afterthought
— see step 3b.

This is the triage pass: it decides *what's affected* and *what, if
anything, QA should do about it next* — not what new test content should
say. It never drafts acceptance criteria or test case content, and never
writes anything to Jira/Zephyr Squad — only reads and flags.

This is a conversational, iterative skill, not a one-shot generator. Check
your understanding, surface gaps, and revise based on real feedback and
real data, the same way a careful QA engineer would before signing off on
impact.

**Relationship to `/zenith-qa-test-case-gen` and `/zenith-test-intake`:**
once the impact findings here are confirmed (and posted, if asked),
`/zenith-qa-test-case-gen` drafts the acceptance criteria and the actual
test case / replacement-step content, which `/zenith-test-intake` then
files. Think of this skill as deciding "what's affected," `test-case-gen`
as deciding "what should it say," and `test-intake` as the pass that
"makes it so."

## Setup (first run per teammate)

Before step 1 of the workflow, confirm the two things this skill needs are
actually live for whoever is running it — don't assume they're already
configured just because they were configured once (this is per-person,
per-machine setup, not shared).

1. **Atlassian/Jira** — try `getAccessibleAtlassianResources` (or any
   `getJiraIssue` call). If it fails or the org isn't authorized, this
   session can't run the OAuth flow itself — tell the person to authorize
   it via their `claude mcp`/`/mcp` setup or claude.ai connector settings,
   then retry.
2. **Zephyr Squad** — try calling `zephyr_squad_raw_request` against one of
   this skill's own Site facts endpoints (e.g. `GET /connect/public/rest/api/1.0/folders`).
   If the tool isn't there at all, the person hasn't registered the
   `zephyr-squad-mcp` server yet. That registration (their own Zephyr Squad
   access key, secret key, and Atlassian account id, generated from their
   own Jira profile → Zephyr Squad → API Keys — never someone else's key)
   is the same walkthrough `/zenith-test-intake`'s own Setup section
   covers; point them there rather than duplicating it here.

Chrome and the `zenith_qa_automation` repo — both required by
`/zenith-test-intake` — are **not** needed for this skill. The optional
source-verification step below falls back to asking for a local repo path,
or to skipping verification entirely, if neither is available.

Only proceed to step 1 once both checks above pass.

## Site facts

Only what's needed to look up existing coverage — this skill never writes
to any of these.

- Jira project key: `QA` (project name "TESTING"), Zephyr Squad project id
  `10017`. Site: ekohealth.atlassian.net, cloudId
  `a616e435-56fe-4efb-a3f0-f6ab6d28f478`. Resolve fresh via
  `getAccessibleAtlassianResources` if a session doesn't have it cached —
  don't assume it's permanent.
- All currently-filed v2 tests live in one Zephyr Squad cycle, "Zenith E2E"
  (id `385b9845-30f1-4741-91f5-51da6caf83da`), under the "Zenith E2E Repo
  v2" version (id `16543`) — organized into **folders inside that one
  cycle**, one per feature, named to match the consolidation workbook's
  module names (e.g. "Audio Warning Modal"). Don't hardcode these ids
  across sessions without reconfirming with `/zenith-test-intake`'s own
  Site facts — Ryan restructures this occasionally.
- Reads go through `zephyr_squad_raw_request` (the `zephyr-squad-mcp` MCP
  server), **not** SmartBear MCP's `zephyr_*` tools (those hit Zephyr
  *Scale*, a different product this org doesn't run). Prepend `/connect`
  to every path below:
  - `GET /connect/public/rest/api/1.0/folders {projectId, versionId, cycleId}`
    — lists the feature folders in the "Zenith E2E" cycle (`id`, `name`).
  - `GET /connect/public/rest/api/1.0/executions/search/folder/{folderId} {projectId, versionId, cycleId, offset, size}`
    — lists the tests filed in a folder.
  - `GET /connect/public/rest/api/1.0/teststep/{issueId} {projectId}` — a
    test's steps in order, `{issueId}` being the test's numeric Jira issue
    id (not its `QA-nnnn` key — resolve via `getJiraIssue` first).
- A product ticket that already has QA coverage is typically linked to its
  test via a **`Verification` issue link**, with the ticket as the
  *inward* issue ("is verified by" the `QA-nnnn` test) — same link type
  and direction `/zenith-test-intake` creates when it files a test against
  a ticket. This is the fast, authoritative way to find existing coverage;
  don't fall back to folder-name search unless this link is absent.

## Workflow

### 1. Fetch the ticket

Given a Jira key (e.g. `CONS-243`) or a `https://ekohealth.atlassian.net/browse/*`
URL, fetch it with the Jira/Atlassian MCP tools (`getJiraIssue`). Pull
`summary`, `description`, `status`, `issuetype`, `priority`, `labels`,
`components`, `assignee`, `reporter`, `issuelinks`, and `comment` — the
comment thread often contains context the description doesn't (open
questions, disagreements about scope, prior QA attempts), and
`issuelinks` feeds step 3's fast path below. If the cloudId isn't cached,
try the site hostname first, falling back to `getAccessibleAtlassianResources`.

**Never drop `comment` to save a call, including when running this
across a batch of tickets.** Confirmed costly in practice (2026-10-05, a
29-ticket batch run without it): comments are frequently where the real
story lives that the description doesn't carry — engineering's own
QA-verification steps for the exact fix, a scope correction after a
follow-up PR changed what shipped, an explicit "this is gated on live
verification, don't treat it as settled yet," or a direct confirmation
(or refutation) of a hypothesis the description alone only lets you
guess at. Skipping it to cut one field off a batch of calls is a false
economy — the whole batch had to be re-read, and several findings
changed, some from "no impact" to a confirmed stale test. If a batch is
large enough that re-reading every full thread is genuinely impractical,
say so and ask, rather than silently fetching a thinner record.

### 1b. Optional source verification

Ticket descriptions go stale, especially on technical tickets with
implementation detail — a five-minute check against the real code fix
beats propagating a wrong assumption into an impact assessment. Don't
assume any particular repo location, since this skill may run for
different people on different machines. If a relevant repo isn't already
accessible this session:

* Ask whether to verify the fix against source, and if so, ask for the
  local path to the clone.
* If they'd rather not set up local access, offer browsing it via Claude
  in Chrome as a lighter-weight alternative.
* If neither is set up, don't block on it — proceed with the ticket text
  as the source of truth, and flag in your response when something
  couldn't be verified against source.

Reuse a repo already accessible from earlier in the session rather than
re-asking.

### 2. State your understanding of the bug and fix before assessing impact

Before scanning for impacted tests, say roughly how well you understood
the reported bug, its root cause, and the fix (a percentage is a good
shorthand), and ask about anything genuinely unclear. Look specifically
for:

* Whether the reproducible steps in the ticket (or its most recent
  comment) actually match the described root cause — a mismatch here
  means the impact scan below would be checking the wrong thing.
* Any unresolved questions already sitting in the ticket's own comment
  thread — a signal the fix or its scope was never fully nailed down.
* Whether the ticket names (or your source check found) a specific
  screen/workflow the fix touches — this is what step 3 matches against
  the Zephyr Squad folder names, if the fast path below doesn't apply.
* Why this ticket exists as its own unit, if it says so — a ticket split
  out of a parent, or explicitly scoped differently from sibling items
  the parent also lists, is telling you something directly about urgency
  or follow-up expectations. Confirmed on CONS-1273 (2026-10-05): it was
  split out of CONS-1272 specifically *because* it needed near-term
  verification, unlike CONS-1272's other items, which really were
  deferred to the next translation pass. A generic pattern for "tickets
  of this type" (e.g. "localization fixes get caught by the screenshot
  pass") does not override what the ticket's own text says about itself
  — read that text before reaching for the pattern.

Use judgment about how much to ask — for a well-documented fix (one with
its own validation notes, for instance), a quick gut-check is enough.
Don't ask what you can answer yourself from the ticket or from source.

### 3. Assess impact on existing Zenith Repo tests

Check whether the change described in the ticket makes any **already-filed**
test go stale — a step whose expected result no longer holds, a
precondition that no longer applies, a data value the change supersedes.
This is a read-only assessment; don't edit anything here.

- **Fast path — linked test.** Check the ticket's `issuelinks` (pulled in
  step 1) for a `Verification` link where the ticket is the inward issue.
  If one exists, that `QA-nnnn` test is the ticket's existing coverage —
  fetch its steps (`getJiraIssue` for the numeric issue id, then
  `GET /connect/public/rest/api/1.0/teststep/{issueId}`) and skip the
  folder search below.
- **Platform-sibling ticket.** If the ticket is one platform's half of a
  bug (a `Relates` link to a sibling ticket for the other platform,
  often titled "iOS: ..."/"Android: ..."), check whether that sibling
  already has a `Verification`-linked QA test. If it does, that test is
  the existing coverage: the follow-up is **Additional coverage needed**
  — add this platform as a new Test Data variant (a `Platform:` data
  type, with its own lettered variants) on the existing steps — not a
  new sibling test.
- **No link — folder search.** Identify the likely feature folder by
  matching the ticket's component/summary against the folder names in the
  "Zenith E2E" cycle (`GET /folders`), then pull what's filed there
  (`GET /executions/search/folder/{folderId}`). Skim test names for ones
  that plausibly walk the same screens/workflow the ticket touches. This
  is a lighter-weight judgment call than a merge decision — the goal is
  "does anything here look affected," not an exhaustive substep-level
  audit.
- **For each candidate test found (either path):** read its steps and
  compare against the ticket's actual change. Three outcomes:
  - **Stale** — an existing step's data or expected result will no longer
    hold once this ships (e.g. a value the change replaces, a flow the
    change removes or reorders). Flag it: `QA-nnnn`, which step, and what
    about it the ticket's change invalidates — this is exactly what
    `/zenith-qa-test-case-gen` needs to draft the replacement content.
  - **Still valid, unaffected** — note it briefly in the draft so it's
    clear it was checked, not just silently skipped.
  - **Unclear** — plausibly affected but you're not confident. Flag it as
    a question rather than guessing either way; a wrong guess here means
    `/zenith-qa-test-case-gen` drafts a replacement for the wrong step.
- **Nothing existing looks impacted?** Say so explicitly — that means any
  test content `/zenith-qa-test-case-gen` drafts next is net-new coverage
  with no existing test to reconcile against.
- **Never skip this search because the fix looks small, low-risk, or
  like "a type of change that's never impacted anything before."**
  Confirmed costly in practice (2026-10-05, CONS-1273): a six-locale
  string swap was marked "no impact" without ever running the folder
  search, on the reasoning that a one-string fix is inherently too
  trivial to affect existing coverage. The folder search would have
  surfaced QA-5791 immediately — the diff's size has no bearing on
  whether an existing test exercises the changed surface, and a string
  change is exactly the kind of thing a localization test asserts
  directly. At batch scale especially, resist giving the Nth ticket a
  lighter evidentiary bar than the first just because a pattern across
  earlier tickets in the batch made this one look safe to wave through.
- Don't call `editJiraIssue`, `zephyr_squad_raw_request` writes, or
  anything else that changes Zephyr Squad state in this step — flagging
  is the deliverable.

### 3b. Recommend QA follow-up coverage

Every ticket gets this call. For most tickets it's independent of step
3's existing-test finding — "nothing existing is impacted" is not the
same question as "does this need new coverage," and both need an answer.
**The one exception is a confirmed-stale finding from step 3: that case
is always "Replacement content needed," never "New test case
warranted."** The two categories below sound similar but answer different
questions — don't reach for the net-new one just because the fix is
substantial:

- **Replacement content needed** — step 3 found an existing `QA-nnnn`
  test (or specific steps) actually stale: what it currently asserts is
  now wrong. The workflow already has coverage; what's needed is updated
  step content for what's already filed, which is exactly what
  `/zenith-qa-test-case-gen` drafts for a confirmed-stale finding. Name
  the test and the specific steps. Never label this "New test case
  warranted" — that phrasing implies nothing exists yet, which isn't true
  here and invites writing a redundant sibling test instead of fixing the
  stale one.
- **Additional coverage needed** — an existing test walks the same
  workflow and nothing it currently asserts is wrong, but it never
  exercised the *specific configuration* this ticket changes — a
  particular value, a boundary case, a data variant the existing Test
  Data never named. Confirmed on CONS-1335/QA-5819: the test's tied-weight
  scenario used an ordinary named weight level ("High"), while the fix
  was specifically about weight 5, a value explicitly outside the normal
  0-4 range per the ticket's own text — so the existing steps never
  actually exercised the one configuration that was broken. This is a
  real gap, but it's additive: per `/zenith-test-intake`'s own merge
  logic, a genuine incremental assertion on an already-covered workflow
  becomes a new Test Data variant or a new step on the *existing* test,
  not a new sibling test and not a rewrite of what's already there. Don't
  default to "No test needed" just because the existing test's own
  assertions remain technically true — check what specific value or
  configuration the fix actually touches before concluding that.
- **New test case warranted** — the fix changes real user-visible
  behavior that step 3 found **nothing existing covers at all** — not
  stale, not a missing variant on a covered workflow, genuinely absent —
  and it's substantial enough to deserve its own scripted coverage: a new
  workflow, a fixed data-integrity bug a user could actually hit, a newly
  correct edge case with no existing test anywhere near it. Name the
  workflow/screen it should cover, so `/zenith-qa-test-case-gen` has a
  concrete starting point.
- **Smoke test only** — the fix is a crash fix, a Crashlytics/analytics/
  telemetry de-duplication, a logging change, or an internal timing/race
  condition with no observable workflow change. **A race, lifecycle, or
  background-state *cause* does not by itself make a fix smoke-only** —
  what matters is the outcome the user sees. If the fix changes whether
  a user-visible workflow succeeds or fails (a firmware update completes,
  a recording saves, a sync finishes), it has an observable outcome and
  belongs in one of the categories above, whatever the mechanism. Name the concrete smoke
  check (the specific screen, action, or condition that should no longer
  crash or misfire) rather than recommending a scripted Zenith E2E test
  case — a full regression test is the wrong weight for something with no
  user-visible behavior to write steps against.
- **No test needed** — cosmetic/polish changes (animation timing,
  easing) that aren't meaningfully verifiable by a scripted assertion.
  **A string/copy fix is not automatically in this category.** "The next
  localization screenshot pass covers it" is an impact claim like any
  other in this skill — it needs the same evidence step 3 demands
  everywhere else: did the search actually find a test exercising the
  changed string, and does whatever automated pass you're citing
  actually catch *this specific* change, rather than localization in
  general? If the ticket names concrete, enumerable values (specific
  translated strings, specific named options, specific devices), that's
  a signal toward **Smoke test only** — naming exactly those values as
  the check — not toward "No test needed." Confirmed costly on CONS-1273
  (2026-10-05): a six-language translation table, listed verbatim in the
  ticket, was waved off this way — skipping both the folder search above
  and the ticket's own statement (see step 2) that it was split out
  because it needed near-term verification, not deferred like its
  siblings.
- **Pending** — step 2's or step 3's open questions aren't resolved yet.
  Don't guess at a follow-up recommendation until the ticket's own scope,
  or an unclear existing-test finding, is settled.

**Check before settling on Smoke test only or No test needed.** Ask, in
order:

1. Does the fix change whether a user-visible workflow succeeds or fails,
   or what the user sees at the end of it? If yes, it is not smoke-only,
   even when the cause is a race, a lifecycle event, or app
   backgrounding.
2. Did step 3's search actually come back empty for that workflow? Name
   the tests found nearby and say what they do and don't exercise — "no
   existing test is impacted" is not the same finding as "the workflow
   is covered." A search hit on a neighboring test (an interruption or
   recovery test, an unrelated prompt test) is not coverage of the happy
   path or the specific configuration the fix touches.
3. If nothing covers it, the answer is **New test case warranted** (or
   **Additional coverage needed** when a covered workflow merely lacks
   this configuration) — not smoke.

Hard-to-automate (specific hardware, specific OS versions, precise
timing) is a `Device Required:`/`manual` classification matter for
`/zenith-test-intake`, not a reason to downgrade the recommendation to
smoke; a manual E2E test is still the right way to keep the workflow
covered. Confirmed costly on CONS-1314 (2026-10-06): an Android fix that
makes a firmware update complete with the app backgrounded was labeled
Smoke test only because the cause was a service-lifecycle race and the
repro needed exact timing; the search (run on the OTA folder, not just a
"firmware" keyword — QA-5695's title never says it) would have shown the
firmware tests cover the update prompt, forced-update bypass, deferral
and install (QA-5695 step 4 completes a foreground update), and
interrupted-update recovery — all with the app in the foreground; none
runs an update with the app backgrounded. The finding was first stated
as "nothing covers an update completing", which was wrong: search by
feature folder and read the steps before claiming a workflow is
uncovered.

This is a recommendation for the user to confirm, not a decision to act
on — never invoke `/zenith-qa-test-case-gen` off the back of it without
being asked (step 5 still applies).

### 4. Package as a Jira-comment-ready draft

Once the above has converged, assemble it into a single block formatted
the way it would look as a Jira comment, in this order:

1. A short callout of any discrepancies/open questions about the bug or
   fix itself (engineers reading it want to know what's uncertain before
   the rest).
2. **Zenith Repo impact** — which existing `QA-nnnn` tests (if any) look
   stale and why (naming the specific step), which look
   checked-and-unaffected, and an explicit "nothing existing is impacted"
   when that's the finding. This is the section `/zenith-qa-test-case-gen`
   reads to know what to draft replacement content for.
3. **QA follow-up recommendation** (step 3b) — smoke test only / new test
   case warranted / no test needed / pending, with the one-line,
   ticket-specific reason. Always present, even alongside "nothing
   existing is impacted" — the two questions are independent.

Show this draft to the user before posting anything — treat every version
as a draft for review. Iterate on feedback by making the specific change
asked for and re-showing the complete draft, not just the diff.

### 5. Post only when asked

Never post the comment automatically. After the user confirms a draft
looks right, use `addCommentToJiraIssue` to post it. If they haven't
explicitly said to post it, ask. Likewise, never invoke
`/zenith-qa-test-case-gen` or `/zenith-test-intake` on their behalf
without being asked — surface what the next step should look at (the
ticket, and the flagged `QA-nnnn` keys/steps) and let the user kick it
off.

## Keeping the plugin zip current

These three skills ship together as the `zenith-qa-plugin` folder, which is
also distributed as `zenith-qa-plugin.zip` at the folder's root. **Any time
this run edits a file inside the plugin folder** (any `SKILL.md`, anything
under a skill's `references/`, `README.md`, `.claude-plugin/`, or
`zephyr-squad-mcp/`), rebuild the zip before finishing so it never lags
behind the files it's meant to mirror:

```bash
cd <path to zenith-qa-plugin> && rm -f zenith-qa-plugin.zip && \
  zip -rq zenith-qa-plugin.zip .claude-plugin skills zephyr-squad-mcp README.md \
  -x "*/node_modules/*" "*.DS_Store"
```

Then confirm with `unzip -l zenith-qa-plugin.zip` that the edited file's
timestamp is current. The folder to zip is the one the three skills are
symlinked from (`readlink ~/.claude/skills/<skill-name>`, up two levels).
The zip is untracked in git (don't `git add` it unless asked), and a run
that edits nothing inside the plugin folder doesn't need to rezip.
