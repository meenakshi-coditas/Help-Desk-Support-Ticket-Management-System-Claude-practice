---
name: zenith-test-intake
description: Standardize Zenith mobile QA test cases (Eko app, Jira project QA on ekohealth.atlassian.net) against the Zenith E2E style guide, file each one into its feature folder (inside the single "Zenith E2E" cycle, under the "Zenith E2E Repo v2" version) and, once a suite cycle exists for the active release, the matching automation suite cycle — then, for a test labelled `no_device` or `any_single_device` only, generate or update the matching Cucumber `.feature` file in the local `zenith_qa_automation` repo. Source can be a Zephyr Squad folder, a Zephyr Squad test cycle, one or more individual test case IDs, a local file, an Excel sheet, or a story/bug/task Jira ticket whose comments contain test steps. Use whenever the user wants to bring newly written test cases up to the Zenith v2 standard, migrate more of the existing Zenith E2E Repo tests into the v2 structure, or generate/refresh BDD feature files for already-filed tests — triggers on "standardize this folder/sheet of tests", "run intake on <folder/cycle/test ID>", "file these into the feature folder", "move these into the suite cycles", "BDD only" (skips straight to feature-file generation for already-filed tests), "generate/update the feature file for <test ID>".
---

# Zenith test intake and cycle filing

## What this does

Takes a batch of test cases that aren't yet in the standardized Zenith v2
form — either genuinely new tests someone wrote, or older tests still
sitting in their pre-consolidation shape — and:

1. Rewrites each one to match `references/style_guide.md`.
2. Checks whether it's actually a new step on a test that's already filed,
   rather than a genuinely new workflow — and if so, adds it there instead
   of creating a sibling issue.
3. Creates or updates it as a Jira `Test` issue (project `QA`) with the
   `Device Required:` and `Precondition:` lines in the description, and the
   right labels. The test is tracked solely by its Jira key (`QA-nnnn`) —
   there is no separate internal ID scheme layered on top. **When the
   source itself is an existing `QA-nnnn` ticket (step 1's third shape),
   standardizing it means rewriting that same ticket in place — never
   creating a new sibling ticket for it** (step 6 has the exact rule and
   the one exception: step 4 finding it's really a duplicate of a
   *different* existing test).
4. Carries over any `CONS-*` tickets linked to its source(s), so the new
   issue keeps the same traceability to the product ticket(s) it verifies.
5. Links directly back to the pre-consolidation `QA-XXXX` source test
   case(s) it replaces, so both sides are traceable to each other.
6. Links it into its feature folder, and into a suite cycle if a live one
   exists for the current release.
7. Reports what changed and flags anything that needed a judgment call
   instead of silently deciding it.
8. For a test labelled `no_device` or `any_single_device`, generates or
   updates the matching Cucumber `.feature` file for the test in the local
   `zenith_qa_automation` repo, per `references/bdd_style_guide.md` —
   flagging (never writing) any assertion whose matching step definition
   is a stub or a poor fit. A line with no matching step definition at all
   is left unflagged. A test labelled `manual`, `core_500`, `core_300`,
   `core_2`, or `duo` skips this step entirely (step 12's gate).

This is the recurring counterpart to the one-time Zenith E2E Repo
consolidation: that pass built the feature cycles and the style guide this
skill applies; this skill is how individual tests get in and stay in
compliance afterward.

**Modes.** By default, a run does all of the above in order (Workflow
steps 1–13): standardize and file in Zephyr/Jira, then generate/update the
BDD feature file, then log everything to the shared sheet. When the
invocation says **"BDD only"** (or clearly means just that — e.g. "generate
the feature file for QA-5744"), skip straight to step 12: use step 1's
source-shape logic only to identify which already-filed `QA-nnnn` test(s)
to target, skip steps 2–11 entirely (no standardization, no Zephyr/Jira
writes, no automation-labels update), and still run step 13 to log the BDD
work.

**Steps 12–13 only run for a test whose automation label is `no_device` or
`any_single_device`** (step 12's gate) — this applies identically in both
modes. A test labelled `manual`, `core_500`, `core_300`, `core_2`, or `duo`
has nothing for steps 12–13 to do, including a "BDD only" invocation aimed
directly at one — note that in the report rather than silently doing
nothing.

## Setup (first run per teammate)

Before step 1 of the workflow, confirm the four things this skill needs
are actually live for whoever is running it — don't assume they're already
configured just because they were configured once (this is a per-person,
per-machine setup, not shared).

1. **Atlassian/Jira** — try `getAccessibleAtlassianResources` (or any
   `getJiraIssue` call). If it fails or the org isn't authorized, this
   session can't run the OAuth flow itself — tell the person to authorize
   it via their `claude mcp`/`/mcp` setup or claude.ai connector settings,
   then retry.
2. **Zephyr Squad** — try calling `zephyr_squad_raw_request` (e.g.
   `GET /public/rest/api/1.0/cycles/search`). If the tool isn't there at
   all, the person hasn't registered the `zephyr-squad-mcp` server yet.
   Walk them through it rather than stopping:
   - Ask them for their own Zephyr Squad **access key**, **secret key**,
     and Atlassian **account id** — generated from their own Jira profile
     → Zephyr Squad → API Keys (never use someone else's key; it's tied to
     that person's account and every write is attributed to whoever's key
     signed it).
   - Confirm `zephyr-squad-mcp` is on their machine and its dependencies
     are installed (`npm install` in that project if `node_modules` is
     missing).
   - Register it for them (with their go-ahead, since this edits their
     Claude Code config):
     ```
     claude mcp add zephyr-squad --scope user \
       -e ZEPHYR_SQUAD_ACCESS_KEY=<their access key> \
       -e ZEPHYR_SQUAD_SECRET_KEY=<their secret key> \
       -e ZEPHYR_SQUAD_ACCOUNT_ID=<their account id> \
       -- node <path to zephyr-squad-mcp>/src/index.js
     ```
   - Verify with `claude mcp get zephyr-squad` (expect `Status: ✔ Connected`).
3. **Chrome, for the Zenith Intake Log** — try
   `list_connected_browsers` (`claude-in-chrome`). If it comes back empty
   or the tools aren't available, this person hasn't connected their
   Chrome yet. This one can't be silently skipped in favor of some other
   format if it's missing — it's the only way step 10 can append to the
   shared log (Site facts, and step 10) — so tell them to connect Chrome to
   Claude before their run needs to write anything, and confirm they're
   logged into a Google account with edit access to the Zenith Intake Log
   sheet (step 10).
4. **The `zenith_qa_automation` repo, for BDD feature files (step 12)** —
   this needs to be cloned locally; it's not something this session can
   clone on its own initiative (that's a real git operation on the
   person's machine). Locate it fresh each run rather than trusting a
   cached path from a prior session — check a few common locations first
   (home directory, `~/Developer`, `~/repos`, `~/code`, or wherever local
   repos tend to live for this teammate), then fall back to a bounded
   filesystem search for a directory literally named
   `zenith_qa_automation` (e.g. `find ~ -maxdepth 6 -type d -name
   zenith_qa_automation`, or Spotlight's `mdfind -name
   zenith_qa_automation` on macOS, which is faster). If it's not found, or
   more than one match turns up, ask the person running the skill for the
   path rather than guessing — don't clone it for them.

Only proceed to step 1 once all four checks pass.

## Site facts

- Jira project key: `QA` (project name "TESTING"). Site:
  ekohealth.atlassian.net, cloudId `a616e435-56fe-4efb-a3f0-f6ab6d28f478`.
  Resolve fresh via `getAccessibleAtlassianResources` if a session doesn't
  have it cached — don't assume it's permanent.
- Zephyr Squad issue type for test cases is `Test` (id `10020` in project
  `QA`). A "test case" in Zephyr Squad *is* this Jira issue — there's no
  separate test-case entity or key to track, unlike some other test
  management tools.
- **Issue CRUD, labels, and issue links** (including the `CONS-*` links in
  step 7) go through the standard Atlassian/Jira MCP tools —
  `createJiraIssue`, `editJiraIssue`, `createIssueLink`, `getJiraIssue`,
  `getIssueLinkTypes`. This is a plain Jira issue; none of it touches
  Zephyr Squad's own API.
  - Confirmed call shapes (2026-08-17), since both tools reject the more
    "obvious" nested-`fields`-object shape you'd expect from the raw Jira
    API: `createJiraIssue` takes flat top-level params —
    `{cloudId, projectKey, issueTypeName, summary, description}`, not a
    `fields: {...}` object. `createIssueLink` likewise takes flat params —
    `{cloudId, type, inwardIssue, outwardIssue}`, where `type` is the link
    type's plain name (e.g. `"Verification"`, `"Duplicate"`) as a string,
    and `inwardIssue`/`outwardIssue` are issue keys — not a nested `type:
    {name: ...}` object. Both success responses are minimal (an id/key
    echo for `createJiraIssue`, just `{"message": "Issue link created"}`
    for `createIssueLink` with no key echoed at all) — for
    `createIssueLink` especially, follow up with a `getJiraIssue` read on
    the inward issue's `issuelinks` to confirm which issue it actually
    landed on, since there's nothing in the write response itself to check
    against the cross-delivery risk above.
  - **`editJiraIssue` is the exception — it takes a nested `fields` object**
    (confirmed 2026-08-19): `{cloudId, issueIdOrKey, fields: {labels: [...]}}`,
    not flat top-level params like the two tools above. Passing `labels` as
    a flat top-level param 400s with "Required at fields".
- **Never run concurrent requests against the Atlassian MCP connector.**
  Observed live (2026-08-17): with background subagents calling it at the
  same time as the main session, responses are **cross-delivered between
  sessions** — a `createJiraIssue` call came back with another session's
  `getJiraIssue` payload, and a subagent received the main session's
  create response. The `context.toolName` field in the response reveals
  the mismatch. The *writes* still landed correctly; only the responses
  were misrouted, so the danger is silently recording the wrong issue key,
  not corrupting Jira.
  - Issue one Atlassian tool call at a time. Do not fan out subagents
    against it, and do not call it from the main session while a subagent
    is using it.
  - After any write, verify the response's `summary`/`key` matches what
    you sent. If it doesn't, re-query by JQL to find out what actually
    happened rather than trusting either response.
  - If a batch is suspect, verify with a narrow
    `searchJiraIssuesUsingJql` on the specific key range — the writes are
    usually fine even when the responses were scrambled.
  - The Zephyr Squad path (`zephyr_squad_raw_request` / a direct
    `zephyr.py` client) is a *separate* server and auth path, and is not
    affected — it is safe to run a Zephyr script while an Atlassian call
    is in flight.
- **Everything else** — test steps, cycles, folders, cycle links — is
  Zephyr Squad Cloud's own REST API
  (`https://prod-api.zephyr4jiracloud.com/connect`, Atlassian Connect
  JWT + QSH auth), reached through the `zephyr-squad-mcp` MCP server (tool:
  `zephyr_squad_raw_request`) — **not** through SmartBear MCP. SmartBear
  MCP's `zephyr_*` tools are Zephyr **Scale**'s API
  (`api.zephyrscale.smartbear.com`), a different SmartBear product this org
  doesn't run — they won't reach this org's data no matter how they're
  called. Don't use them for anything Squad-related.
- Confirmed working Zephyr Squad Cloud endpoints (all need `projectId` as a
  query param — `10017` for `QA` — or the call 400s):
  - **Prepend `/connect` to every path below, not just `teststep`.** The
    2026-08-18 note below this list said `cycles/search`, `folders`,
    `folder`, and `executions/search/...` all worked *without* `/connect`
    in that session. Re-confirmed 2026-08-19: all four now 404 without it
    and only succeed with `/connect` prepended — same symptom as the
    `teststep` finding, just arriving a day later for these paths too.
    Whatever changed, don't trust the "these don't need `/connect`" half of
    the old note anymore — use `/connect/public/rest/api/1.0/...` for
    every endpoint in this section unless a fresh 404 says otherwise.
  - `GET /public/rest/api/1.0/cycles/search {projectId, versionId}` — lists
    the cycles under a release version. The pre-v2 tests are migrated
    *from* the cycles under the "Zenith E2E Repo" version (id `14313`),
    one cycle per old feature folder. They're migrated *to* a single cycle,
    "Zenith E2E" (id `385b9845-30f1-4741-91f5-51da6caf83da`), under the
    "Zenith E2E Repo v2" version (id `16543`) — v2 doesn't use one cycle per
    feature; it uses **folders inside that one cycle**, one folder per
    feature, matching the module names in the consolidation workbook (e.g.
    "Audio Warning Modal"). Don't hardcode these ids across sessions without
    reconfirming — Ryan restructures this occasionally (this is already the
    second layout).
  - `GET /public/rest/api/1.0/folders {projectId, versionId, cycleId}` —
    lists the folders in a cycle (no folder id in the path — the plural
    `/folders` with these three as query params is the whole call). Returns
    each folder's `id`, `name`, `cycleId`, `cycleName`.
  - `POST /public/rest/api/1.0/folder` with body
    `{name, description, projectId, versionId, cycleId}` — creates a folder
    in a cycle. Returns the new folder's `id`. Note the **singular**
    `/folder` here versus the plural `/folders` for listing.
  - `POST /public/rest/api/1.0/executions/add/folder/{folderId}` with body
    `{issues: ["QA-1234"], method: 1, versionId, projectId, cycleId}` —
    files a test into that folder. Note `issues` takes **issue keys**
    (`"QA-1234"`), not the numeric issue id used everywhere else in this
    skill, and the field is `method` (confirmed value `1`), not `status`.
    Captured directly from the Zephyr Squad web UI's own network request
    (POST to `prod-play.zephyr4jiracloud.com`, same path, same body shape)
    after several guesses at `/executions` with a `status` field returned
    500s — the real endpoint is a different path with a different body
    entirely, not a variation on that guess.
  - `GET /public/rest/api/1.0/executions/search/folder/{folderId} {projectId, versionId, cycleId, offset, size}`
    — lists what's actually filed in a folder (what confirms the `POST`
    above worked). `executions/search/cycle/{cycleId}` (no folder) does
    **not** show folder-filed tests — use the `.../search/folder/{folderId}`
    form to verify anything folder-specific.
  - `GET /public/rest/api/1.0/executions/search/cycle/{cycleId} {projectId, versionId, offset, size}`
    — paginated list of the tests linked to a cycle.
  - **`teststep` calls need a `/connect` prefix that the other endpoints
    above don't.** Confirmed 2026-08-18: `GET /public/rest/api/1.0/teststep/{issueId}`
    404s outright — including against the `89543` (`QA-5661`) reference id
    already documented below, so this isn't a bad-id problem. The working
    path is `GET /connect/public/rest/api/1.0/teststep/{issueId}`. This
    appears to be specific to `teststep` — `cycles/search`, `folders`,
    `folder`, and both `executions/search/...` forms above all worked
    without the `/connect` prefix in the same session. Prepend `/connect`
    to every `teststep` call (`GET`/`POST`/`PUT`/`DELETE` alike) until
    someone confirms otherwise; don't assume a bare `/public/...` path
    works there just because it works everywhere else in this skill.
  - `GET /connect/public/rest/api/1.0/teststep/{issueId} {projectId}` — a
    test's steps, in order.
  - `POST /connect/public/rest/api/1.0/teststep/{issueId} {projectId}` with
    body `{step, data, result}` — appends one step at the end. Use this
    only for a genuinely new step; it never dedupes or replaces anything.
  - **`PUT` and `DELETE` are both live and confirmed working** (added to
    `zephyr-squad-mcp`'s `zephyr_squad_raw_request` tool 2026-08-19 —
    `method` now accepts `GET`/`POST`/`PUT`/`DELETE`). `PUT
    /connect/public/rest/api/1.0/teststep/{issueId}/{id}` with body `{step, data, result}` rewrites an
    existing step's content in place — the body fully replaces those three
    fields, so always fetch the step first and include its full intended
    text, not just the part that's changing. `DELETE
    /teststep/{issueId}/{id}` removes a step outright. This means a
    genuine incremental assertion (Site facts substep-level comparison in
    step 4) can now land as a real in-place edit to an existing step's
    `data`/`result` instead of always becoming a new sibling step — use
    judgment on which reads better for a given case. Any `PUT` that changes
    what an existing, already-reviewed step asserts, or any `DELETE`, gets
    described and confirmed with the user per step 5 before it's issued.
  - **What `PUT`/`DELETE` do *not* give you: reordering.** There is no
    move/reorder endpoint — `POST .../move/{index}` 404s, and sending
    `orderId` in a `PUT` body is silently ignored. Reordering steps still
    requires a human dragging them in the Jira/Zephyr web UI.
  - `{issueId}` throughout is the same numeric Jira issue id used
    everywhere else (e.g. `89543` for `QA-5661`) — there's no separate
    step-level key to resolve.
- **Removing a test from the "Zenith E2E" cycle** (the deprecation case,
  step 9 below): `DELETE /connect/public/rest/api/1.0/execution/{executionId}
  ?projectId=10017&issueId={numeric issue id}` (confirmed 2026-10-02).
  Both query params are required — `issueId` alone missing 400s with
  `"Missing parameter: issueId"` (error code 151) even though the
  execution id in the path already uniquely identifies the row. Get
  `{executionId}` from `GET /executions/search/folder/{folderId}` (its
  `execution.id` field, not the issue's own id or key). This removes the
  execution from its folder and from the cycle's counts; it does not
  touch the Jira issue itself, its labels, or its test steps — pair it
  with the `Zenith_TC` → `Deprecated_Zenith` label swap (`editJiraIssue`),
  not a substitute for it. There is no corresponding "remove" call for
  cycle-folder membership outside Zephyr Squad's execution object — this
  is the one way to detach a test from the cycle.
- Adding a test to a cycle (the write side of "File into cycles," step 9)
  works, but hasn't been re-documented here against one specific confirmed
  request shape — nail down the exact endpoint/body against a live call
  before scripting it across a whole batch, rather than assuming it mirrors
  the read-side endpoints above.
- Credentials: a personal Zephyr Squad API key (access key + secret key),
  generated per-user from Jira profile → Zephyr Squad → API Keys.
  Configure each teammate's own key as environment variables
  (`ZEPHYR_SQUAD_ACCESS_KEY` / `ZEPHYR_SQUAD_SECRET_KEY` /
  `ZEPHYR_SQUAD_ACCOUNT_ID`) in their own MCP registration — never hardcode
  a key value into a shared script or into this skill.
- **`zenith_qa_automation` repo layout** (step 12, `references/bdd_style_guide.md`):
  - `tests/pre-feature/QA-nnnn.feature` — one file per Zephyr test, named
    exactly by its Jira issue key, no other decoration (not the feature
    folder name, not a ZEN- style ID — this project doesn't use one).
  - `tests/steps/*.steps.ts` — Cucumber step definitions, TypeScript,
    wdio's `@wdio/cucumber-framework`, matched by regex (e.g.
    `When(/^I navigate to app settings$/, async () => {...})`). Confirm
    this is still the shape in use before relying on it — it's a real repo
    the automation team maintains independently of this skill, so its
    conventions can drift.
  - No automated way to run/lint the suite from within this skill — step
    12 only reads `tests/steps/` to check for matches and writes
    `tests/pre-feature/*.feature`; it never touches `tests/steps/` itself
    and never executes anything in the repo.

## Workflow

### 1. Get the source

Ask (unless the invocation already specifies it) which of these the source
is — six valid shapes, don't assume it's a folder just because that was
the first one this skill supported:

- A Zephyr Squad **folder** of un-standardized test cases in project `QA` —
  the organizational grouping (this is what feature cycles are built from).
- A Zephyr Squad **test cycle** — not the same thing as a folder. A cycle
  is an execution-oriented grouping (see Site facts on feature vs. suite
  cycles); this option means "take whatever's linked to this specific
  cycle" rather than "take this folder's contents."
- **One or more individual test case identifiers** — a Jira key (`QA-5655`),
  or a short list of them. Process just those, not an entire folder or
  cycle. **Standardizing an existing `QA-nnnn` ticket fed this way means
  updating that same ticket in place once step 5 is confirmed (`editJiraIssue`
  plus `PUT`/`POST`/`DELETE` on its steps) — do not call `createJiraIssue`
  for it.** The only exception is when step 4 finds the content actually
  belongs on a *different* already-filed test (a genuine duplicate/merge);
  short of that, this ticket's own key is the destination, full stop. See
  step 6's rule for the exact mechanics.
- A **local file/directory** of newly authored tests (JSON, doc, whatever
  format the author used).
- An **Excel/.xlsx sheet** — either a copy of the Zenith E2E Repo Proposal
  workbook (one row per step, columns for Test Case ID, Test Name,
  Precondition, Step #, Test Step, Test Data / Use Case, Expected Result,
  Platform, Automation, Source Test Key(s), and Disposition, cells merged
  down the per-test columns for a multi-step test), **or** a workbook of
  brand-new tests laid out **one sheet tab per originating `CONS-*` ticket**
  (sheet tab name = the CONS key, e.g. a tab literally named `CONS-911`),
  with a simpler per-tab layout (Sr No, Test case, Test Step, Test Data,
  Test Result, merged down for multi-row tests). Either shape needs
  reconstructing into the same per-test/per-step shape the other four
  source types produce before moving on to step 2. **When the sheet uses
  the tab-per-CONS-ticket layout, the tab name *is* the source's CONS
  ticket** — apply the same "carry over linked CONS tickets" rule from step
  6 using that tab name directly as the ticket to link, rather than looking
  it up via a pre-existing source test's issuelinks (there usually isn't
  one — these are brand-new tests, not migrated pre-consolidation ones).
- A **story, bug, or task Jira ticket** — not itself a QA `Test` issue,
  typically in the `CONS` project (e.g. `CONS-243`) but any Story/Bug/Task
  works the same way — whose **comments** carry ad hoc test steps someone
  wrote up over time, rather than a dedicated test case. **Only the single
  most recent comment that reads as test steps** (numbered steps with an
  expected result, a Use Case list, Given/When/Then, or similar structured
  content) is the source — don't walk further back through earlier
  test-step-shaped comments even if this ticket has several. An earlier one
  is presumed superseded by the latest, the same way a revised draft
  supersedes an older one; if the ticket's most recent test-step comment
  turns out to depend on context only an older comment has (a table row
  left blank, a "same as above" reference), that's a case to flag rather
  than going and pulling the older comment in yourself. This kind of ticket
  often already has a QA test linked to it that covers most of the content,
  with only the latest comment adding a few incremental use cases — step 4
  has a fast path for finding that existing test directly, without
  searching feature folders by name. If the ticket has no linked test yet,
  treat the latest comment's content as genuinely new and continue with the
  rest of the workflow exactly as written for any other source.

Also confirm which established feature folder these tests belong to — the
folders inside the single "Zenith E2E" cycle (under the "Zenith E2E Repo
v2" version, Site facts), one per feature, named to match the consolidation
workbook's module names. If a test's feature doesn't obviously match one of
the existing folders, ask rather than creating a new one — that's a
structural decision for Ryan, not something to infer from one batch of
tests.

### 2. Pull the raw tests

- **Folder** (a cycle under the pre-v2 "Zenith E2E Repo" version) →
  `zephyr_squad_raw_request` GET `/public/rest/api/1.0/executions/search/cycle/{cycleId}`
  (paginated) — returns real issue keys/ids directly, sidestepping the
  Jira free-text search problem below.
- **Cycle** → the same call, against whichever cycle id is actually meant —
  a source cycle to pull from and a destination feature cycle to file into
  are different ids, don't conflate them.
- **Individual ID(s)** → `getJiraIssue` directly on each one named; no
  folder/cycle listing needed.
- **Local file** → read it directly.
- **Excel sheet** → open it and parse per the column layout in step 1.
- **Story/bug/task ticket** → `getJiraIssue` with
  `fields: ["summary", "issuelinks", "comment"]` — the `comment` field
  returns `fields.comment.comments` in chronological order. Walk it
  **backward from the newest comment** and stop at the first one that
  reads as test steps — that single comment is the source, full stop; do
  not keep going further back to collect others even if this ticket has
  several test-step-shaped comments over its history. Reconstruct that one
  comment into the same per-test/per-step shape the other source types
  produce (same idea as the Excel-sheet reconstruction above — a comment's
  formatting is whatever its author happened to use, not a fixed layout)
  before moving on to step 3. Log a flag rather than guessing when it's
  unclear whether the newest comment actually reads as test steps, or when
  it reads as test steps but is incomplete without an older comment's
  context. Pulling
  `issuelinks` here too feeds step 4's fast path below.

### 3. Standardize each test

Apply every rule in `references/style_guide.md`: workflow-phrased name, no
Verify/Check/Test/Validate prefix, one test per workflow (merge UI +
functional assertions rather than splitting them), numbered sub-steps with
1:1 numbered expected results, exact quoted copy, Precondition vs.
step-level Configuration separated, glossary terms and device names
normalized (`CORE 300 (CORAL)` on first mention, `CORE 300` after), and each
data type in a step's Test Data (Device, Filter, Account type, etc.) on its
own line, separated by a blank line, when a step lists more than one.
**Every lettered (a)/(b)/(c)... variant within a data type also gets its
own line** — never run them together on one line separated by spaces
(`references/style_guide.md`'s "Test Data / Use Case" section has the
worked examples).

**Sequential step groups.** Before finalizing a multi-step test, check
whether any run of consecutive steps can only be reached by continuing
from the previous step's UI state (a modal chain, a wizard, a multi-screen
flow) rather than being independently entered. **This is not about
whether steps repeat an identical variant list — a step counts as a
continuation whenever its instruction assumes an action or state only the
previous step established, even if its Test Data text is completely
different from the step before it.** A step is independent, not a
continuation, only when it explicitly re-establishes its own starting
state (its own fresh "Start a...", "Record an encounter that...", "Open
the... screen and..."). If a chain is found, per the style guide's
"Sequential step groups" rule:

- State the group's variant (account type, device, etc.) once, on the
  group's first step (the anchor), which keeps its own Use Case number.
- Every later step in that same chain drops its "Use Case *N*:" label
  entirely (not just the variant list) and reads "Continue from the
  previous step (Use Case *N*'s walkthrough)." followed by a blank line
  and a plain, capitalized description sentence — don't restate the full
  variant list, and don't keep a Use Case number alongside the
  continuation phrasing. For a test that uses free-text "Configuration:"
  labels instead of numbered "Use Case N:" labels, drop the "(Use Case
  *N*'s walkthrough)" parenthetical too, since there's no numbering scheme
  to reference — just "Continue from the previous step."
- Renumber every independent (non-continuation) step that comes after the
  chain so the Use Case sequence stays gapless — a continuation step
  never consumes a number. This includes a second chain's own anchor: it
  simply takes the next number in sequence, not a fresh restart.
- Reword any prose that names another step by its old Use Case number
  (e.g. "Extends Use Case 4/7/8's timing...") to match the renumbering —
  or, if the referenced step lost its number entirely, reference it by
  physical step number instead ("Use Case 1's walkthrough (step 4)").
- **Skip this fix entirely if the chain is the whole test** — one anchor,
  no independent steps, nothing standing apart from it. The rule exists to
  stop flat numbering from hiding which steps are genuinely independent
  versus continuing state; a test that is honestly one continuous
  walkthrough end to end doesn't have that confusion, so leave its
  numbering as-is.
- If the chain isn't already at the front of the test (some independent
  step currently precedes it), it should be moved there so it reads as
  the test's primary use case. **This reorder must be done by hand in the
  Jira/Zephyr web UI** — Zephyr Squad's API has no reorder/move endpoint
  (confirmed: `POST .../move/{index}` 404s, and `orderId` in a `PUT` is
  silently ignored), so flag it in the report for manual reordering rather
  than attempting an API workaround.

**Automation classification and the `Device Required:` line.** This is a
closed vocabulary, not free text — the `Device Required:` value and the
Jira label are both derived from the same one of these seven terms. (This
table is a reconstruction from a chat with Ryan, not recovered from a saved
file — a prior pass used a looser `auto_ok`/`auto_device_static` pair of
labels instead, e.g. QA-5656/QA-5657/QA-5658 in the Patient folder and the
original QA-5661. If Ryan has a different version of this table on hand,
that one wins.)

| Term | `Device Required:` value | Automatable? | Label |
|---|---|---|---|
| No Device | `none` | Yes — no hardware needed | `no_device` |
| Any Single Device | `any single device` | Yes — needs a device connected, but the workflow doesn't care which model | `any_single_device` |
| CORE 500 | `CORE 500` | Yes — needs that specific device | `core_500` |
| CORE 300 | `CORE 300 (CORAL)` on first mention, `CORE 300` after | Yes — needs that specific device | `core_300` |
| CORE 2 | `CORE 2` | Yes — needs that specific device | `core_2` |
| DUO | `DUO 2` | Yes — needs that specific device | `duo` |
| Manual | `manual only` | No — not automatable regardless of device | `manual` |

Five situations fall outside the seven terms and all resolve to `Manual`,
full stop — even if a physical device is also involved (e.g. a test that
needs both a device *and* an admin-dashboard flag flip is still `Manual`,
not `any_single_device` or a specific device term):
- **Admin dashboard** — any test whose `Device Required:` or precondition
  mentions the admin dashboard.
- **Dynamic device swap** — any test that swaps devices mid-run or
  otherwise needs dynamic device interaction, rather than one device
  connected for the whole test.
- **Real signal capture** — a test that needs an actual captured
  physiological signal (a real recorded heart/lung sound, ECG, etc.), not
  just a device connected. Harder to automate than any named-device test:
  it needs a live signal source, not just pairing.
- **External system dependency** — a test that depends on something
  outside the app entirely: an email inbox, the admin dashboard, or
  similar. Broader than the admin-dashboard case above — email access
  alone (no admin dashboard involved) also qualifies.
- **Concurrent multi-device** — a test that needs two mobile devices
  active *at the same time* (e.g. confirming a logout on one device is
  reflected live on another). Distinct from dynamic device swap (one
  device replacing another mid-test, not two at once).

None of these five are automatable in practice with a typical single-device
mobile harness, and none fit `any_single_device` or a named device, so
don't split the difference — classify as `Manual` and move on rather than
flagging it as an open question.

**Mapping from the original consolidation pass's labels**, if a test still
carries one of these instead of the seven terms above (none of this was
written down anywhere before now — reconstructed from a chat with Ryan and
from reading example tests, since the original reasoning wasn't saved):
- `auto_ok` → `No Device`
- `auto_device_static` → needs a per-test read, not a blanket mapping: this
  old label covered both "any device works" and "this specific named
  device is required" without distinguishing them. Check the test's actual
  content — if the assertions would come out the same on any of the listed
  devices, it's `Any Single Device`; if the test exists specifically to
  check a named device's own image/copy/behavior, it's that named device.
- `auto_device_dynamic` → `Manual` (dynamic device swap, above)
- `auto_device_signal` → `Manual` (real signal capture, above)
- `auto_blocked_external` → `Manual` (external system dependency, above)
- `auto_blocked_multidevice` → `Manual` (concurrent multi-device, above)

The description has two labelled parts, each its own paragraph (blank line
between them — a single `\n` gets swallowed into the following sentence
when Jira renders the markdown, so it needs the blank line to show as its
own line): `Device Required: <value>` first, then `Precondition: <the rest
of the setup prose>`. Both labels are literal text in the description, not
separate Jira fields — and they're the *only* two things that go in the
description. Platform goes on as labels (`zenith_ios`/`zenith_android`),
not description text; the test's ID goes in the summary (step 6), not the
description.

**Log a flag** (don't silently resolve) whenever: source copy conflicts
with itself or another test, asserted copy looks like a typo but you're not
certain, or a device/config detail contradicts what the glossary says is
shipped. Collect these for the end-of-run report.

### 4. Check whether this fits into an existing test instead

Before treating the standardized test as its own issue, check whether it's
really just a new step on a test that's already filed in the target
feature cycle — the "one test per workflow" judgment the original
consolidation pass made constantly (e.g. QA-5326 and QA-5377 were merged
into one test) doesn't stop applying once that pass is done.

- **Fast path for a story/bug/task ticket source (step 1's sixth shape):**
  check the ticket's own `issuelinks` (already pulled in step 2) for a
  `Verification` link where the ticket is the outward issue — the ticket
  "is verified by" an existing QA test (same link type and direction as
  step 7). If one exists, that test is the match: skip straight to the
  substep-level cross-check below against it, skip the folder-name search
  entirely, and don't worry about whether it happens to sit in the feature
  folder you'd otherwise expect — the link is the authority here, not
  folder membership. If the ticket carries no such link, there's no
  existing test to fast-path to — fall through to the folder-name search
  below like any other source.
- **Platform-sibling fast path.** If the source ticket is the other
  platform's half of a bug (a `Relates` link to a sibling ticket) and
  that sibling carries a `Verification`-linked QA test, that test is the
  match — add this platform as a new `Platform:` Test Data variant on
  its existing steps (in-place `PUT`, per the substep-level cross-check
  below) rather than creating a sibling test.
- Pull the tests already filed in the target feature folder
  (`GET /public/rest/api/1.0/executions/search/folder/{folderId}` — Site
  facts) and compare the incoming test's standardized **Name** — the
  workflow phrase, not its raw source title — against theirs.
- A genuine match walks the *same screens for the same core action*, and
  the incoming test is really just another Test Data / Use Case variant of
  it — a different entry point, device, account type, or configuration —
  not a different action or a different end state. That belongs in the
  existing test's Test Data list (labelled (a)/(b)/(c)) or as a new step,
  per `references/style_guide.md` — not a sibling issue.
- Don't merge on folder membership alone. Two tests in the same feature
  folder that exercise different actions, or land on a different outcome,
  are still two tests even if they touch the same screen.
- Ambiguous — plausibly the same workflow, but not confident? Log it as a
  flag and ask Ryan rather than deciding either way. Merging the wrong two
  tests is as much a defect as needlessly duplicating one.
- **Once a test-level match is found, cross-check down to the substep
  level before writing anything new.** A step-level "this looks like the
  same workflow" verdict is not enough — fetch the matched test's steps
  (`GET /public/rest/api/1.0/teststep/{issueId}`) and read every numbered
  substep and its numbered expected result, not just the step's Use Case
  line. Incoming content commonly turns out to be one of three things, and
  the three need different treatment:
  - **Fully covered already** — every assertion the incoming test makes is
    already stated, at the same specificity, by an existing substep. Don't
    write anything; note it in the report as "already covered by
    `QA-nnnn` step *n*, no action" rather than silently dropping it — it
    should be visible in the report that it was checked, not just that
    it's missing.
  - **Partially covered, with a genuine incremental assertion** — the
    existing step establishes the general case, but the incoming content
    adds a specific value, device, timing, or nuance the existing substeps
    never state (an exact duration, a combined-label transient state, a
    boundary configuration, coverage extended to more devices or more
    positions than the existing step exercises). This is a real substep
    worth adding — and now that `zephyr_squad_raw_request` supports PUT
    (Site facts), this is a genuine **in-place edit**: `PUT
    /teststep/{issueId}/{id}` with the step's `data`/`result` fields
    updated to append the new numbered substep and its numbered expected
    result to what's already there, not a new sibling step. Word the
    appended substep's Use Case line to name which existing case it
    extends, e.g. "Extends Use Case 2's generic transition coverage with
    the specific ~3-second hold-to-good timing" — so a human reading the
    test later understands it's a deliberate addition, not an oversight.
    Fetch the step first (`GET /public/rest/api/1.0/teststep/{issueId}`) so
    the PUT body carries forward the existing `step`/`data`/`result` text
    with the addition appended, not just the new substep alone — a PUT
    replaces the field content, it doesn't append server-side.
  - **Genuinely new** — no existing substep addresses it even partially.
    Treat as a normal new step (`POST`, Site facts) (or, if nothing in the
    target feature area matches at all, a new sibling test per the "No
    match" path below).
  - When several incoming test-sheet rows each contribute a partial overlap
    against the *same* existing test, combine them into as few new
    substeps/steps as sensible (per the style guide's one-step-per-
    configuration and same-labelled-variant rules) rather than posting one
    new step per incoming row — the goal is the minimum set of changes that
    closes the gap between what's already filed and what the incoming
    content proves, not a 1:1 transcription of the source rows.

**Size limits — don't let a test grow without bound.** A test that quietly
absorbs merge after merge stops being readable, no matter how each
individual addition was justified. Before writing a substep or step edit
from this section, check the target test against these caps:

- **Substeps per step: 8 max.** A step already at 8 numbered substeps
  cannot take a 9th via in-place edit — the incoming content becomes a
  *new step* on the same test instead (subject to the step cap below), or
  a flag if that would also blow the step cap.
- **Steps per test: 10 max for `no_device`/`any_single_device`, 6–8 max
  for `manual`.** Manual tests take meaningfully longer to execute by
  hand than an equivalent `no_device` test, so keep them tighter. Check
  the test's current automation label (Site facts table) to know which
  ceiling applies.
- **Test Data / Use Case variants per step: 4–5 max**, independent of
  substep count — a step can be well under its substep cap and still be
  bloated by an ever-growing (a)/(b)/(c)... variant list. A variant beyond
  that belongs in its own step.
- **When adding the incremental content would breach any of these caps,
  don't force it in and don't unilaterally spin off a new sibling test
  either.** Stop and log it as a flag for Ryan to decide: name the test,
  which cap it would breach, and what the incoming content was going to
  add. This is the same "ambiguous, ask rather than decide"
  posture as the rest of this section, just triggered by size instead of
  by uncertain matching.
- **A gap that needs more than 2 new steps or substeps to close is itself
  a signal, not just a size problem.** If closing the incremental gap
  would take 3+ new steps/substeps, that's usually a sign the incoming
  content is not really "the same workflow with an extra variant" — flag
  it for Ryan rather than mechanically adding all of them.

**No match** → continue to step 5 to describe the changes and confirm with
the user, then step 6 to create/update it as its own issue.

**Match found** → skip issue creation. Instead:

- Use the existing test's numeric Jira issue id (the same one used
  everywhere else) — there's no separate step-level key to resolve.
- Fetch the test's current steps first (`GET /connect/public/rest/api/1.0/teststep/{issueId}`)
  so you know what's already filed, and to check the size limits above
  before deciding whether this lands as a substep edit (`PUT`), a new step
  (`POST`), or a flag. Map new-step fields: `step` = Test Step, `data` =
  Test Data / Use Case (with its `Use Case <n>:` line, `n` = this step's
  own number — not the step number it's being appended after), `result` =
  Expected Result, numbered sub-steps with 1:1 numbered expected results.
  When the new step is a sibling of an existing one — same underlying
  workflow, different trigger (a different entry-point card, button, or
  configuration) rather than a different action or end state — write its
  Use Case line per `references/style_guide.md`'s "Similar Use Cases
  across separate steps" rule: mirror the existing step's Use Case
  sentence structure and let the specific configuration named in each one
  carry the difference, rather than wording the new one from scratch or
  cross-referencing the sibling by number ("...instead of Use Case
  *n*'s..."). Don't fold the sibling's own already-reviewed step into this
  rewrite just because the two are related — a genuinely distinct trigger
  stays its own step (and its own `POST`), leaving the original step's
  `step`/`data`/`result` untouched, unless the incoming content is truly a
  reword of what the existing step already asserts rather than a separate
  entry path worth preserving on its own.
- Add the new source ticket to whatever this project uses to track a
  test's originating tickets, so the merge stays auditable — the same way
  the consolidation pass tracked which QA-XXXX tickets fed each
  destination test.
- The existing test keeps its `QA-nnnn` key. Don't create a new issue for
  a workflow that got merged in, and don't touch its cycle links — it's
  already filed.

### 5. Describe the changes and confirm before writing

Before writing anything to Jira or Zephyr Squad (step 6 onward), lay out
what this test's standardized form actually changes and get the user's
explicit go-ahead. This is a gate before the writes happen, not a
substitute for the end-of-run report (step 10) — that report is a record
of what already happened; this step is where the user can still redirect
before anything is written.

- **Always present the step-by-step content as a markdown table**, not
  prose or bullets — columns `#` | `Test Step` | `Test Data / Use Case` |
  `Expected Result`, one row per step, mirroring how the content actually
  sits in Zephyr. Drafts are far easier to review this way. Put the Test
  Name, `Device Required:`/Precondition (and any classification change),
  and flags as plain text above the table; the step-by-step content itself
  always goes in the table. This applies to both cases below.
- **New test** (step 4 found no match) — show the drafted Test Name,
  `Device Required:`/Precondition, and the full step-by-step content (Test
  Step, Test Data / Use Case, Expected Result) that step 6 would create,
  in the table format above.
- **Existing test being updated, or a new test merging into one** (step 4
  found a match) — show a concise diff, one table row per changed step:
  which steps are being added, edited in place, or deleted. For an
  in-place edit, state what the step currently asserts and what it will
  assert after (e.g. adjacent "before"/"after" rows, or both noted in the
  same row) so the user is approving the actual change, not just the fact
  that a change is coming. Leave unchanged steps out of the table.
- Include any flags step 3 or step 4 raised alongside the diff — those are
  exactly the judgment calls the user needs to weigh before approving, not
  something to save for the step 10 report.
- Wait for an explicit go-ahead on that test before proceeding to step 6
  for it. If the user asks for a change, revise the draft and confirm
  again — one approval doesn't carry over to a materially different draft
  later in the same run.
- For a multi-test run (a folder, cycle, or sheet), this can be one
  consolidated message covering every test in the batch rather than a
  separate round-trip per test — as long as each test's changes are
  described distinctly enough that approving the batch means approving
  each one individually. Don't let a flagged or ambiguous test ride along
  on the same approval as a clean one.

### 6. Find or create the Jira issue

Only for tests that step 4 didn't fold into an existing one. Prefer
finding the existing issue (for an update, not a merge) via the Zephyr
folder/cycle listing from step 2 (it hands you the real key). Only fall
back to Jira JQL search if that listing isn't available — search on a
distinctive phrase from the test name (`summary ~ "some phrase from the
name"`).

**Check these three cases in order — the middle one is the one most
often missed, so don't skip straight from "no step-4 match" to "create a
new issue":**
1. Is this test already sitting in the v2 destination (the folder/cycle
   listing from step 2 already handed you its real `QA-nnnn` key)? →
   "Existing issue" below.
2. **Was the run's own source (step 1) a single `QA-nnnn` ticket ID fed
   directly** — not a folder, cycle, sheet, or story/bug/task ticket? →
   rewrite that same ticket in place, below. **This is the case to catch:
   if the user named an existing QA test as the thing to standardize, the
   standardized result lands back on that exact ticket. Calling
   `createJiraIssue` here produces an unwanted duplicate and leaves the
   named ticket stale — treat that as a mistake to avoid, not a
   judgment call.**
3. Neither of the above → "New test" below.

- **Existing issue** → `editJiraIssue`: summary `<Test Name>`, description
  as built in step 3, labels = existing labels ∪
  `{Zenith_TC, zenith_ios/zenith_android as applicable, <automation label>}`
  (labels is a full replace, not additive — always read current labels
  first and union in the new one, don't drop the others). If the step
  content changed, fetch current steps first — with `PUT` now available
  (Site facts), rewrite each existing step's `step`/`data`/`result` in
  place to match the standardized content rather than leaving stale text
  behind, `POST` any additional new steps the standardized version needs
  beyond what already exists, and `DELETE` any old steps the standardized
  version no longer needs — this whole rewrite is exactly what step 5
  already described and confirmed with the user before reaching this
  point.
- **A `QA-nnnn` ticket was fed directly as the run's source, and step 4
  found no match for it anywhere else** → **rewrite that same ticket in
  place rather than creating a new one.** This only applies when the run's
  source (step 1) is one individual test identifier, not a folder/cycle/sheet
  where several old tests could be merging into one new destination — with a
  single source there's no risk of losing another source's traceability,
  so there's no reason to leave the original ticket dangling while a
  fresh one gets created next to it. Treat it exactly like the "Existing
  issue" case above (`editJiraIssue` for summary/description/labels, then
  `PUT`/`POST`/`DELETE` its own steps into the standardized shape) using
  the ticket's own key — **do not call `createJiraIssue`.** Since it's the
  same ticket, not a new destination, **steps 6 and 7 are unnecessary
  here**: whatever `CONS-*` links and source-test links it already carries
  stay exactly where they are, because there is no separate destination to
  carry them onto.
- **New test** → create the `Test` issue via `createJiraIssue` (issue type
  `Test`, summary `<Test Name>`), then add its steps one at
  a time via `zephyr_squad_raw_request` POST to
  `/public/rest/api/1.0/teststep/{issueId}` (Site facts), then set labels
  as above. This is for every other case: a folder/cycle/sheet source
  where the new content doesn't match any existing v2 test, or where
  multiple old sources are merging into one new destination.

Either way, get the **numeric** Jira issue id (the `id` field, e.g. `89543`
— not the `QA-XXXX` key) off the `createJiraIssue`/`editJiraIssue`
response — step 9's cycle-link call takes this same numeric id, and so
does every Zephyr Squad Cloud call in this skill.

### 7. Carry over linked CONS tickets

`CONS` is a separate Jira project — the actual product/dev tickets a QA
test case was written to verify or regression-test (e.g. `QA-5633`'s
description cites "Regression test for CONS-653 / CONS-654 / CONS-706").
When a source ticket's content lands in a QA test issue — whether
that's a brand-new issue, an update to an existing one (step 6), or a step
merged onto an already-filed test (step 4) — any `CONS-*` ticket(s) linked
to that source need to end up linked to the destination issue too, not
left behind on the retired source.

This runs across **every** ticket in the test's `sources` list, not just
one — a merged test (step 4, or the original consolidation's own "Merge"
disposition) can pull in CONS links from more than one source, and all of
them need to land on the destination, not just whichever source you happen
to check first.

- For each source ticket, `getJiraIssue` with `fields: ["issuelinks"]` and
  filter to links whose linked issue key starts with `CONS-` — a source
  ticket may carry other issue links (duplicates, blocks, relates-to
  another QA ticket) that aren't CONS tickets and shouldn't be copied.
- Check the destination issue's own `issuelinks` first, so you don't create
  a duplicate link for a CONS ticket that's already there — from an
  earlier intake run, or because two merged sources happened to cite the
  same CONS ticket.
- **Always use the `Verification` link type, reading "the QA test *verifies*
  the CONS ticket."** Do **not** carry over whatever link type the old
  source ticket happened to use — the pre-consolidation tests use an
  inconsistent mix (`Relates`, `Risk Verification`, `Downstream/Upstream`),
  and part of the point of v2 is that this relationship is uniform. The
  reference test `QA-5656` shows the correct shape.
  - Direction: for `createIssueLink`, `inwardIssue` performs the outward
    verb on `outwardIssue`. The outward verb here is "verifies", so
    `inwardIssue` = the destination QA test, `outwardIssue` = the `CONS-`
    ticket. Getting this backwards makes the CONS ticket claim to verify
    the test.
  - If a source ticket links the same CONS ticket twice (some do, via two
    links in opposite directions), the destination still gets exactly one
    `Verification` link.
- **There is no delete-issue-link tool** on the Atlassian connector. A link
  created with the wrong type can only be removed by hand in the Jira UI,
  so get the type right the first time rather than planning to fix it up
  afterwards.
- Note which CONS tickets got linked in the report, per test, so it's
  visible without having to open every issue to check.
- **When the source itself is a story/bug/task ticket (step 1's sixth
  shape) and step 4's fast path found no existing linked test** — that
  ticket *is* the product ticket step 6's new test needs to verify; link it
  directly via `Verification` (destination test as `inwardIssue`, the
  ticket as `outwardIssue`), the same way a tab-per-CONS-ticket Excel
  sheet's tab name gets linked (step 1). There's no separate source test
  whose `issuelinks` need walking to *find* the ticket to link, because the
  ticket you already have *is* it.
- **When this run is the filing step of the chained `/zenith-qa-bug-impact`
  → `/zenith-qa-test-case-gen` → `/zenith-test-intake` pipeline** — link
  the `CONS-*` ticket that originated the whole run (the one `bug-impact`
  was pointed at) via `Verification`, even though the content handed to
  *this* skill is a drafted comment/table, not that ticket itself as a
  step 1 source type. Carrying over an old test's own `CONS-*` links
  (the bullets above) and linking the ticket that drove this run are
  **not the same thing and not mutually exclusive** — a test replacing a
  deprecated one often needs both. Concretely: a deprecated test can carry
  a `Verification` link to the *older* ticket whose behavior is being
  reversed (e.g. the ticket that introduced a pin), while the *new* test
  it's replaced by also needs its own `Verification` link to the ticket
  that actually reverses it, which is the one this pipeline ran against
  start to finish. Don't assume the old test's carried-over CONS link is
  the only one the new test needs — check whether the run itself started
  from a named ticket and link that too if so.

### 8. Link back to the source test case(s)

Beyond the `CONS-*` product tickets (step 7), also link the destination QA
test issue directly to every pre-consolidation `QA-XXXX` test
case in its `sources` list — so anyone on either issue can trace straight
to the other, in Zephyr's own link graph, without going through the
workbook. This is a plain Jira operation (`createIssueLink`) — no Zephyr
Squad API involved, same as step 7.

Doesn't apply when the source was a story/bug/task ticket (step 1's sixth
shape) with no matching pre-consolidation `QA-XXXX` test — there's nothing
old to trace back to, since the ticket's comments are the origin, not a
retiring Zephyr test. Skip straight to step 9 for that test.

- Default link type: `Duplicate`, with the new issue as `inwardIssue` and
  the old source as `outwardIssue` — reads "the new test duplicates the
  old one" / "the old one is duplicated by the new one." This is a
  reasonable default, not a fixed rule — confirm with the user if a
  different type reads better for a given migration (e.g. `Cloners` for
  "derived from" instead of "duplicates").
- One link per source ticket — a merged test can have more than one.
- Check the destination's existing `issuelinks` first (same check as step
  7) so re-running intake on an already-linked test doesn't create
  duplicates.
- Note which source tickets got linked in the report, alongside the CONS
  tickets from step 7.

### 9. File into cycles

- Feature folder: look up the target folder's id via `GET /public/rest/api/1.0/folders`
  (Site facts) filtered to the "Zenith E2E" cycle (id
  `385b9845-30f1-4741-91f5-51da6caf83da`, version `16543`), matching by
  name to the module. If no folder matches, create one with
  `POST /public/rest/api/1.0/folder` (Site facts) named after the module —
  match the workbook's module name, and check the existing folder list
  first so you don't create a near-duplicate of a folder that's already
  there under slightly different capitalization. Then
  `POST /public/rest/api/1.0/executions/add/folder/{folderId}` with the
  issue **key** (Site facts) to file it in. Verify with
  `GET /public/rest/api/1.0/executions/search/folder/{folderId}`.
- Suite cycle: only if a live suite cycle already exists for the current
  release matching this test's automation label + device (check
  `zephyr_squad_raw_request` GET `cycles/search` for a name like
  `Zenith v<release> – <device>`); if so, link the same way. If none
  exists, note it as "pending a suite cycle for this release" in the
  report rather than skipping silently.
- **Deprecating a superseded test** (per `/zenith-qa-test-case-gen`'s
  replace-and-deprecate draft): do all three, none is optional.
  - `editJiraIssue` on the old test: replace `Zenith_TC` with
    `Deprecated_Zenith` in its labels (read current labels first and
    union in the rest, same as any other label edit in this skill —
    don't drop `zenith_ios`/`zenith_android`/the automation label).
  - Find its execution in the "Zenith E2E" cycle
    (`GET /executions/search/folder/{folderId}` for the folder it's
    filed in — or walk folders if the folder isn't already known) and
    `DELETE` it per the Site facts entry above, so it stops appearing in
    that feature's folder listing and in cycle-wide counts.
  - `addCommentToJiraIssue` on the old test (`contentFormat: "markdown"`):
    the body is exactly `Deprecated and replaced with QA-nnnn`, where
    `QA-nnnn` is the replacement test's key (an in-place standardization
    has no replacement key — this only applies when a *different* new
    test supersedes the old one). Comment on the **old** ticket, not the
    new one. Atlassian calls stay one at a time (Site facts), and this
    comment is a write like any other — it's covered by the same step 5
    approval that described the deprecation. Check the old ticket's
    existing comments first so a re-run doesn't post a second copy.
  - Verify all three: re-`getJiraIssue` for the label and the comment, and re-`GET
    /executions/search/folder/{folderId}` to confirm the execution is
    gone. Note all three actions and their verification in the report
    (step 10) — a deprecation that only swapped the label but left the
    test sitting in the cycle's active folder, or never pointed the old
    ticket at its replacement, is a half-finished deprecation, not a
    complete one.

### 10. Report

Per test: created / updated / merged into an existing test (by its
`QA-nnnn` key) as a new step / unchanged, which cycles/folders it's now
linked to, which CONS tickets and source tickets it now carries links to,
and its final `QA-nnnn` key. Then a separate Flags section for anything
from step 3 or step 4 that
needed a human call. Keep it scannable — a list, not prose — this is the
same shape as the Flags sheet from the consolidation workbook.

**Whenever this run actually wrote anything to Zephyr or Jira** (created a
test, added a step, edited or deleted an existing step in place, edited a
field like the description/labels, added a link, filed into a folder — not
a dry run or a run that found nothing to do), also append a new tab to the
team's shared intake log — a single Google Sheet at a permanent URL:

> **Zenith Intake Log:**
> https://docs.google.com/spreadsheets/d/1dG98kS59M_0m6-U7QNPPG1Ar9IBJp860AY8cWmWpAEs/edit

This log has no API to write to directly — there is no Google Sheets
connector registered in this org (checked 2026-08-19; only a generic Drive
connector exists, and it can create/read/copy/share files and update their
metadata, but has no operation to edit an existing file's content or add a
sheet tab). The only way to add a tab to one permanent, shared file is by
driving the real Google Sheets UI through the `claude-in-chrome` browser
tools, using the human's actual logged-in Google session — not the sandboxed
`Claude_Browser` preview pane, which has no Google login of its own.

- Confirm a Chrome browser is connected (`list_connected_browsers`) before
  starting — if none is, tell the person running the skill rather than
  failing partway through a half-written tab.
- Navigate to the Zenith Intake Log URL above and check the tab list first
  (the "All Sheets" button, bottom-left, lists every tab without having to
  scroll the tab strip). **If a tab for today's date (`DD-MMM-YYYY`)
  already exists, append this run's rows to that same tab** — one row per
  test touched, added after whatever's already there, keeping the
  Test/Action/Notes columns and the trailing Flags block intact rather
  than starting a second Flags block. Only when no tab for today exists,
  right-click any existing sheet tab at the bottom and choose "Duplicate"
  (or use the `+` button), then rename the new tab to today's date as
  `DD-MMM-YYYY` (e.g. `17-Aug-2026`).
- Keep the tab's data as simple as possible — nothing fancy, this is a
  log, not a report. Three columns only: **Test** (`QA-nnnn`),
  **Action** (`Created, n steps` / `+n steps (UCx-y)` /
  `Updated`), **Notes** (one line folding together whatever's worth
  knowing — folder, CONS link, what the addition covers — instead of
  separate columns for each). One row per test touched, then a blank row,
  then a `Flags` row, then one short line per flag underneath it. Don't
  reproduce the full multi-clause chat report verbatim; a terser version
  is fine here since the detail still lives in Jira and in the chat
  history.
  - **Confirmed 2026-08-19, do not use embedded `\t`/`\n` inside one `type`
    call** — that was the first thing tried, and it fails silently: Sheets
    treats them as literal whitespace typed into whatever cell currently
    has focus, not as navigation, so an entire row lands crammed into one
    cell instead of spreading across columns. The working pattern is a
    separate `key` press between every cell: `type` the cell's text, then
    `key: "Tab"` to move to the next column, and `key: "Return"` after the
    last column of a row — Return correctly snaps back to the column you
    started Tab-ing from on the next row, the same as a real paste would.
  - **Also confirmed the same day:** any cell value starting with `+`,
    `-`, or `=` needs a literal leading apostrophe (`'`) typed in front of
    it, or Sheets parses it as the start of a formula and the cell shows
    `#ERROR!` instead of the text — this bit two cells on the first real
    run (`+4 steps (UC4-7)` and `+ CONS-980 (Verification)` both came back
    `#ERROR!` until re-typed as `'+4 steps (UC4-7)` /
    `'+ CONS-980 (Verification)`). The apostrophe itself never shows in the
    rendered cell, only in the formula bar, so it's safe to prepend
    whenever a value's first character is one of those three — check every
    cell's content against this before typing it, not just the ones that
    "look like" they start with a sign.
- This is UI automation against a live shared document, not a sandboxed
  action — go slowly, verify each tab actually landed correctly (read the
  page back) before moving on, and never run it concurrently with another
  session also mid-write to the same file, for the same reason the
  Atlassian-connector concurrency warning above exists: two sessions
  editing the same live UI at once can clobber each other silently.
  - **Confirmed 2026-08-19: don't fire clicks/types immediately after
    `navigate`.** A whole batch of actions run right after navigating to
    the sheet URL silently no-op'd once — the grid hadn't finished
    attaching its click handlers yet, so every click/type/delete in that
    batch landed on nothing, and the tool's own action log still happily
    echoed back "typed X", "pressed Return" for all of it, because that log
    only confirms the action was *sent*, not that anything in the page
    actually changed. Do one throwaway click plus a `zoom` read-back right
    after navigating, confirm the cell reference box updates and the
    content matches what's expected, and only then start the real
    type/Tab/Return sequence. More generally: after any batch that's
    supposed to change the sheet's content, `zoom` back into the edited
    range before reporting success — the action log is not evidence the
    edit happened.
- Whoever runs this skill needs their own `claude-in-chrome` connector set
  up and logged into a Google account with edit access to the sheet — this
  is a per-teammate setup requirement, the same way the Zephyr Squad API
  key is (Setup section above). If it's missing, walk them through
  connecting Chrome rather than falling back to some other format silently.

### 11. Update the Automation Labels tab

The Zenith Intake Log (step 10) has a standing **"Automation Labels"** tab —
not a per-run dated tab, one single tab kept current — tracking how many
tests in the Zenith E2E cycle currently carry each of the seven automation
labels (Site facts, step 3's classification table). Whenever a run creates
a test, changes a test's automation label, or merges/removes one, update
this tab's counts before finishing:

| Device Category | Automation Label | # Tests |
|---|---|---|
| No Device | `no_device` | |
| Any Single Device | `any_single_device` | |
| CORE 500 | `core_500` | |
| CORE 300 (CORAL) | `core_300` | |
| CORE 2 | `core_2` | |
| DUO 2 | `duo` | |
| Manual | `manual` | |
| Total | | |

plus a `Last updated: DD-MMM-YYYY` line below the table. Recompute counts by
walking every folder in the "Zenith E2E" cycle
(`GET /public/rest/api/1.0/folders`, then
`GET /public/rest/api/1.0/executions/search/folder/{folderId}` per folder —
Site facts) and tallying each test's automation label from its
`issueLabel` field — don't recompute from a static local spreadsheet
(e.g. a copy of the original proposal workbook), since older copies may
still use a pre-standard vocabulary (e.g. "physical device") that doesn't
map cleanly onto the seven current terms. Edit the existing tab's cells
in place via `claude-in-chrome` the same way step 10 writes a new tab, and
sanity-check that the total still equals the cycle's total test count
before finishing.

### 12. Generate or update the BDD feature file

For every test touched this run (default mode), or for the test(s) named
by the source (**"BDD only"** mode — see "Modes" above). Apply
`references/bdd_style_guide.md` in full; this section only covers the
control flow around it.

**Automation-label gate.** Only generate or update a `.feature` file for a
test whose automation label (the step 3 classification table) is
`no_device` or `any_single_device` — check this first, before the repo
location or anything else, from the test's Jira labels (or its
`Device Required:` line if labels aren't loaded yet). A test labelled
`manual`, `core_500`, `core_300`, `core_2`, or `duo` skips step 12 and
step 13 entirely for that test — report it as "BDD skipped (label
`<label>`)" rather than silently doing nothing, so it's visible that the
skip was deliberate. This gate applies the same way in default mode and in
"BDD only" mode: a "BDD only" invocation naming a manual or device-specific
test has nothing to do.

- Confirm the `zenith_qa_automation` repo location (Setup, prerequisite 4)
  before starting.
- For each test that passes the gate above:
  - Fetch its current Zephyr steps (`GET /connect/public/rest/api/1.0/teststep/{issueId}`
    — same call as step 4) — this is the source of truth for what the
    `.feature` file should contain, whether this run just wrote those
    steps (default mode) or they were already sitting there from an
    earlier run ("BDD only" mode).
  - If the test's description doesn't have the standardized
    `Device Required:`/`Precondition:` shape (style_guide.md) — it isn't
    actually in v2 form yet, most likely because "BDD only" was invoked
    against a test that hasn't been through steps 1–9. Flag it and ask
    whether to run full intake on it first rather than generating a
    `.feature` file from non-standard content.
  - Check `tests/pre-feature/QA-nnnn.feature` in the local clone. Follow
    `references/bdd_style_guide.md`'s "New file vs. updating an existing
    one" section — draft a fresh file, or a diff against the existing one.
  - Search `tests/steps/*.steps.ts` for matching step definitions per the
    style guide, reusing matches verbatim and flagging a stub or poor-fit
    match with the two fixed labels — a line with no matching step
    definition at all is left unflagged. Do not write anything to
    `tests/steps/` — ever.
  - **Confirm with the user before writing**, the same gate as step 5: show
    the drafted or diffed `.feature` content (and any gap flags) and wait
    for an explicit go-ahead before writing the file. For a multi-test
    run this can be one consolidated message, same rule as step 5.
  - Write the file to `tests/pre-feature/QA-nnnn.feature` once confirmed.
  - Commit and push it. This repo's actual convention (confirmed with
    Ryan 2026-08-26, from the existing commit history — `feat: qa-5698`,
    `feat: qa-5732`, etc.) is to commit **directly onto the shared
    `pre-feature` branch and push straight to `origin/pre-feature`** — no
    per-test topic branch, no PR. `main` is the eventual PR target once
    `pre-feature` is ready to ship, but that's a separate, manual decision
    of Ryan's, not something this skill triggers per test. Two stale
    per-ticket branches (`QA-5698`, `QA-5732`) exist on the remote from an
    earlier convention — don't branch off those or revive that pattern
    unless Ryan says otherwise.
    - Stage only the specific `tests/pre-feature/QA-nnnn.feature` file(s)
      this run touched — never a broad `git add -A`/`git add .` — and
      commit with a message in the shape `feat(QA-nnnn): add/update BDD
      feature file for <short description>` (matches the existing log,
      e.g. `feat(QA-5785): add BDD feature file for recording playback
      expand view`).
    - `git push` to `origin/pre-feature`. If `pre-feature` has moved
      upstream since this session last synced, `git pull --rebase` (or
      fetch and check) before pushing rather than force-pushing over
      someone else's commits.
    - This confirm-before-write gate above covers the commit + push too —
      don't treat writing the file and pushing it as two separately
      approved actions.

### 13. Log the BDD changes

Same shared Google Sheet as step 10
(`https://docs.google.com/spreadsheets/d/1dG98kS59M_0m6-U7QNPPG1Ar9IBJp860AY8cWmWpAEs/edit`),
same tab-per-date / three-column (Test, Action, Notes) / Flags-block
mechanics, same caveats (apostrophe-escape leading `+`/`-`/`=`, `Tab`/
`Return` between cells not embedded `\t`/`\n`, don't act immediately after
`navigate`, zoom-verify before reporting success) — all identical to step
10, just run again for the BDD work instead of duplicating those
instructions here.

- **If step 10 already ran for this test in this same run** (default
  mode touched both Zephyr and BDD for it), fold the BDD action into that
  test's *same row* rather than adding a second row — e.g. Action
  `Updated; BDD: created (8 scenarios)` — since the row hasn't left the
  session yet. If step 10's row already landed and this step is running
  later (or in a separate "BDD only" run), append a new row instead; don't
  go back and edit an already-written row from a prior session.
- Action column for BDD work: `BDD created, n scenarios` /
  `BDD updated, +n scenarios` / `BDD unchanged`. Note the flag count too if
  any lines were flagged as a stub or poor fit, e.g. `BDD updated, +2
  scenarios (3 flagged)` — a line with no matching step definition at all
  doesn't count toward this, since it isn't flagged.
- Only append/update anything here if step 12 actually wrote a file — a
  dry run or a run where the user didn't confirm the draft doesn't touch
  the sheet.

## Bundled resources

- `references/style_guide.md` — the full Zenith E2E style guide and
  glossary. Read this before standardizing the first test in a run; you
  don't need to re-read it per test.
- `references/bdd_style_guide.md` — the BDD/Gherkin conversion rules for
  step 12 (Feature/Scenario mapping, bracket placeholders, no Background/
  Scenario Outline, verbatim step-definition reuse, the two fixed gap
  flags, new-file-vs-diff handling), plus a worked example. Read this
  before generating the first `.feature` file in a run.

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
