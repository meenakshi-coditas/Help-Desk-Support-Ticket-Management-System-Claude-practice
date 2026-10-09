---
name: zenith-qa-test-case-gen
description: Derive user-perspective acceptance criteria and manual test cases for a Zenith mobile QA ticket (Eko app, project QA on ekohealth.atlassian.net), written in the same Test Step / Test Data-Use Case / Expected Result format already used for filed Zenith E2E Repo tests. When /zenith-qa-bug-impact has already flagged existing QA-nnnn tests/steps as stale for this ticket, drafts the specific replacement step content for them, not just net-new test cases — or, when the entire test is stale, drafts a brand-new test and flags the old one for deprecation (its Zenith_TC label swapped for Deprecated_Zenith and its execution removed from the Zenith E2E cycle); when only a few steps are stale, offers the choice between patching in place and replace-and-deprecate. Also handles findings categorized "Smoke test only" — these never get a permanent Zephyr test case, but still get the same comment-table verification steps posted so the ticket can actually be closed out, converting any engineering-authored QA verification notes already sitting in the ticket's comments into the standard table rather than authoring new steps from scratch. Packages everything as a Jira-comment-ready draft; never files or edits anything in Jira/Zephyr Squad — that's /zenith-test-intake's job once a draft is confirmed, and only applies when a permanent test case is actually warranted. Use when the user wants acceptance criteria or manual test cases drafted for a ticket, wants a bug/story ticket turned into QA-ready test content, wants verification steps posted so a smoke-test-only ticket can be closed, or says things like "write test cases for this", "draft the test steps", "post verification steps", "what should the updated test say".
---

# Zenith QA test case generation

## What this does

Turns a Zenith mobile QA ticket into drafted test content: acceptance
criteria from the end user's perspective, and manual test cases a human
tester could run — written in the exact Test Step / Test Data-Use Case /
Expected Result shape already used for filed tests in the Zenith E2E
Repo, so a confirmed draft can be handed to `/zenith-test-intake` nearly
verbatim. When `/zenith-qa-bug-impact` has already identified existing
`QA-nnnn` tests/steps this ticket makes stale, this skill drafts the
actual replacement content for those steps instead of just writing new
tests around them.

This is a conversational, iterative skill, not a one-shot generator. Check
your understanding, surface gaps, and revise based on real feedback and
real data, the same way a careful QA engineer would before signing off on
a ticket.

**Relationship to `/zenith-qa-bug-impact` and `/zenith-test-intake`:**
`zenith-qa-bug-impact` runs first and decides *what's affected* (which
existing tests are stale, if any, and why); this skill decides *what the
test content should say* — drafting both the replacement steps for
anything flagged stale and any genuinely new test cases;
`/zenith-test-intake` then *files* the result. This skill never writes to
Jira/Zephyr Squad — only drafts and flags.

**Picking up bug-impact's findings.** If `/zenith-qa-bug-impact` already
ran against this ticket earlier in the same session, reuse its findings
directly — don't re-run the Zephyr Squad impact scan yourself. If this
skill is invoked standalone or in a fresh session, check the ticket's own
Jira comments for an already-posted `zenith-qa-bug-impact` draft (its
"Zenith Repo impact" section) and parse the flagged `QA-nnnn` keys/steps
from there. If neither exists, say so explicitly and ask whether to run
`/zenith-qa-bug-impact` first or proceed treating everything as net-new
coverage with no existing test to reconcile against — don't silently
assume net-new without flagging that the impact scan was skipped.

## Setup (first run per teammate)

Before step 1 of the workflow, confirm Atlassian/Jira access is actually
live for whoever is running it — don't assume it's already configured just
because it was configured once (this is per-person, per-machine setup,
not shared).

1. **Atlassian/Jira** — try `getAccessibleAtlassianResources` (or any
   `getJiraIssue` call). If it fails or the org isn't authorized, this
   session can't run the OAuth flow itself — tell the person to authorize
   it via their `claude mcp`/`/mcp` setup or claude.ai connector settings,
   then retry.

This skill doesn't call Zephyr Squad directly — it reuses
`/zenith-qa-bug-impact`'s findings from the same session, or reads them
from an already-posted Jira comment (step 1 below) — and doesn't need
Chrome or the `zenith_qa_automation` repo. Those are `/zenith-test-intake`'s
requirements, confirmed there instead.

Only proceed to step 1 once the check above passes.

## Site facts

- The Zenith E2E style guide — Test Name phrasing, the Test Step / Test
  Data-Use Case / Expected Result shape, size limits, the Device Required
  classification table, the glossary — lives in `/zenith-test-intake`'s
  skill directory, not duplicated here:
  `../zenith-test-intake/references/style_guide.md`. Read it once per
  session before drafting test cases (step 4 below); reuse it if this
  session already read it earlier. This is the single source of truth for
  the format — this skill never keeps its own copy, so the two never
  drift apart.
- Jira project key: `QA` (project name "TESTING"). Site:
  ekohealth.atlassian.net, cloudId `a616e435-56fe-4efb-a3f0-f6ab6d28f478`.
  Resolve fresh via `getAccessibleAtlassianResources` if a session doesn't
  have it cached — don't assume it's permanent.

## Workflow

### 1. Get the ticket and any prior impact findings

If `/zenith-qa-bug-impact` already fetched this ticket and ran its impact
scan earlier in the same session, reuse that context directly — don't
re-fetch the ticket or re-run the Zephyr Squad scan. Otherwise:

* Fetch the ticket with `getJiraIssue` (`summary`, `description`,
  `status`, `issuetype`, `priority`, `labels`, `components`, `issuelinks`,
  `comment`). If the cloudId isn't cached, try the site hostname first,
  falling back to `getAccessibleAtlassianResources`.
* Check the ticket's comments for an already-posted `zenith-qa-bug-impact`
  draft and parse its "Zenith Repo impact" findings (flagged `QA-nnnn`
  keys/steps, or "nothing existing is impacted") from there.
* If no prior impact findings exist either way, say so explicitly and ask
  whether to run `/zenith-qa-bug-impact` first, or proceed treating
  everything as net-new coverage.

### 2. Decide whether this needs a permanent Zephyr test case or just a verification comment

Check the `/zenith-qa-bug-impact` finding's QA follow-up category (either
reused from the same session, or parsed from its posted comment) before
drafting anything — the category decides how much of this skill actually
applies:

* **Smoke test only.** No permanent `QA-nnnn` test is ever warranted here
  — skip straight to step 7 and draft just the comment-table verification
  steps (steps 3–6 don't apply: no acceptance criteria, no Test Step /
  Test Data / Expected Result content, no replacement-strategy decision).
  Source the table's content from whatever engineering already posted —
  if a developer's own QA-verification comment already lists concrete
  steps (a named person's comment giving numbered repro/verification
  instructions), convert that content into the table almost verbatim
  (simplify wording, keep exact UI copy and button names) rather than
  inventing your own checks. Only author the steps yourself, clearly
  flagged in the draft as self-authored rather than engineering-provided,
  when no such comment exists. Once this comment is confirmed and posted,
  this ticket is done — **never hand it to `/zenith-test-intake`**; there
  is nothing to file, because nothing here becomes a standing Zephyr test.
* **Replacement content needed / Additional coverage needed / New test
  case warranted.** Continue through steps 3–7 as below — these are the
  categories that produce real Zephyr-shape test content, and the
  comment-table draft in step 7 sits alongside it. `/zenith-test-intake`
  is the right next step once the draft is confirmed, but only for these
  three categories.
* **No test needed / Pending.** Nothing for this skill to draft. Say so
  and stop rather than inventing a verification comment for a finding
  that doesn't call for manual QA execution (No test needed) or isn't
  resolved enough to test yet (Pending).

This distinction is the whole reason the two skills stay separate:
`/zenith-qa-test-case-gen` posting a verification-steps comment closes out
a ticket's manual QA; it is never, by itself, evidence that a Zephyr test
case exists or should exist. Only `/zenith-test-intake` writes to Zephyr
Squad, and only for the three categories above.

### 3. Decide replacement strategy for anything flagged stale

Before drafting replacement content, decide — per flagged test — whether
to patch it in place or replace it outright. The two aren't
interchangeable: patching keeps the test's Jira key, history, and any
automation hooked to it; replacing starts a clean test and retires the
old one.

* **A few steps stale, the rest of the test still valid.** Offer the user
  both options explicitly — update the existing test's flagged steps in
  place, or spin off a new test and deprecate the old one — and let them
  choose. Don't default to either silently: a test with execution history
  or automation attached is a real cost to retiring unnecessarily, but a
  test patched into incoherence (remaining-valid steps that no longer sit
  well beside the replaced ones) has a real cost too.
* **The entire test is stale** — every step flagged, or the test's own
  premise (its Test Name, its core assertion) is exactly what the ticket
  reverses, as with QA-5813's "unaffected by" premise flipping to "scaled
  by" — **always draft a brand-new test and deprecate the old one; don't
  offer the patch-in-place option.** Rewriting every step of an existing
  test is a new test in substance, and leaving the old key active after
  its entire content changed meaning misleads anyone who finds it by key
  later.

**Deprecating a test** means four things, all still drafts at this stage
(applied later by `/zenith-test-intake`, per step 8): the new test is
filed as its own `QA-nnnn` normally; the superseded test's `Zenith_TC`
label is swapped for `Deprecated_Zenith` — removed, not kept alongside
the new label — so it stops surfacing in `Zenith_TC`-scoped searches and
folder counts; its execution is removed from the "Zenith E2E" cycle
(`DELETE /connect/public/rest/api/1.0/execution/{executionId}
?projectId=10017&issueId={numeric issue id}` — both query params are
required, the call 400s on `issueId` alone being missing) so it stops
showing up in that feature's folder listing and in cycle-wide counts,
while the issue itself stays in Jira for history and traceability; and a
comment reading exactly "Deprecated and replaced with QA-nnnn" (the new
test's key) is left on the superseded ticket so anyone landing on it by
key is pointed at its replacement. Call out all three actions explicitly
in the packaged draft (step 8), as their own lines: "`QA-nnnn`: swap
label `Zenith_TC` → `Deprecated_Zenith`", "`QA-nnnn`: remove its
execution from the Zenith E2E cycle (folder `<name>`)", and "`QA-nnnn`:
comment "Deprecated and replaced with QA-mmmm"" (the comment goes on the
old ticket, not the new one).

Then continue to step 4 with whichever path was chosen (or decided for
each flagged test, if more than one and they don't all take the same
path).

### 4. State your understanding before drafting anything

Before writing any acceptance criteria, say roughly how well you
understood the change (a percentage is a good shorthand) and ask about
anything genuinely unclear. Look specifically for:

* Test environment/data access
* Platform/device scope, if the change touches multiple platforms
* Which factor combinations to cover — don't ask this open-ended; run
  step 5's factor-and-boundary pass first and put the resulting matrix in
  front of the user to confirm or trim
* Any unresolved questions already sitting in the ticket's own comment
  thread — a signal that testing logistics were never nailed down

Use judgment about how much to ask up front versus after a first draft —
for a well-specified ticket, one round of questions is usually enough.
Don't ask what you can answer yourself from the ticket or from source.

### 5. Factor and boundary pass, then derive acceptance criteria

**Before writing any acceptance criteria**, enumerate the independent
inputs the change touches and how they interact. Testing each input on its
own, with the others left at default, misses the cases where two settings
interact — e.g. an OS font-size setting and an OS display-size setting
each tested alone never exercises both at their maximum at once, which is
where layouts break.

1. **List the factors.** Every independent input, setting, state, or
   condition the ticket's behavior depends on (OS font size, OS display
   size, orientation, account type, device, platform, ...).
2. **List each factor's boundary values.** Minimum, default, maximum, and
   every threshold the ticket or a developer comment states (a cap at
   1.5x, a 96dp floor, a character limit). Note where a boundary doesn't
   exist on a platform (e.g. iOS has no display size below standard) so it
   isn't silently dropped.
3. **Build a coverage matrix** crossing the factors, and decide per cell
   whether a use case covers it. Defaults:
   * Each factor at each boundary on its own, others at default.
   * **Same-direction extremes together** (all factors at max; all at
     min/standard) — always included.
   * **Opposing extremes** (one factor at max, another at min) — propose
     them, but list them in Open questions as optional rather than
     including them silently, since they roughly double the cost.
   * With three or more factors, say explicitly that you're proposing a
     pairwise subset instead of the full cross, and why.
4. **Run the edge-case checklist** and add a row (or an explicit "not
   applicable" note) for each that fits the change: orientation; small vs.
   large device; change-while-running vs. change-then-relaunch;
   persistence across relaunch; platform differences; stacking with other
   accessibility settings (bold text, reduce motion, ...); behavior just
   above and below a stated cap or limit.
5. **Show the matrix to the user** (factors × values, which use case
   covers each cell, which cells are deliberately dropped and why) before
   drafting test content, and fold their trims in. Any cell dropped goes
   in the posted comment's Open questions so the gap is visible, not
   silent.

**Re-run this pass on every revision**, not just the first draft — a
follow-up ticket comment or a retest is exactly when a patch-only update
skips the matrix and leaves an interaction case uncovered. Check the
existing filed test's use cases against the matrix too, not just the new
content.

Then write acceptance criteria as an end user would experience them, not as a
restatement of the implementation. A useful test: could someone with no
knowledge of the code read this criterion and know what to check? Frame
each around observable behavior rather than internal mechanics.

Cover, where applicable: default/unconfigured/baseline behavior, each
distinct mode or scenario the ticket introduces, independence between
those modes **and the combined behavior when several are set at once
(per the matrix above)**, and graceful failure on bad/missing/malformed
input.

### 6. Derive manual test cases (QA tester's perspective)

Read `../zenith-test-intake/references/style_guide.md` once per session
before drafting test cases here (reuse it if this session already read it
earlier). Format every test case exactly like a test that's ready to file
into the Zenith E2E Repo — the same shape `/zenith-test-intake` produces,
not a looser prose write-up:

* **Test Name** — workflow-phrased, no "Verify"/"Check"/"Test"/"Validate"
  prefix, still makes sense after the bug is fixed.
* **Description** — `Device Required: <value>` on its own line (one of the
  seven classification terms in that style guide — `none`, `any single
  device`, a named device, or `manual only`), then a blank line, then
  `Precondition: <setup prose the test assumes but doesn't exercise>`.
* **Per step, a Test Step / Test Data-Use Case / Expected Result table**:
  numbered sub-steps where every sub-step ends in something to check,
  numbered Expected Results matching 1:1 with no gaps, lettered
  `(a)/(b)/(c)` data variants each on their own line (never run together
  on one line), and a `Use Case N:` sentence closing the Test Data cell
  (or a plain "Continue from the previous step..." when the step is part
  of a sequential chain — see that file's "Sequential step groups" rule).
* **Variants vs. separate use cases** — a lettered `(a)/(b)/(c)` variant
  is only for data that produces the *same* expected behavior (the same
  flow on several devices or OS versions). When two conditions have
  different expected results (cancel vs. device turned off, one outcome
  vs. another), write them as separate steps with their own Use Case, not
  as variants with per-letter results. Check every drafted variant list
  against this before showing the draft.
* **Platform** — `iOS`, `Android`, or "iOS, Android" when the workflow is
  shared.
* The same size limits apply here as at intake time (8 substeps per step;
  10 steps per test, or 6–8 if `Device Required` is `manual only`) — split
  into a new test rather than cramming past them.
* Use the glossary in that same file for terminology (exact feature names,
  device names, account-state terms).

**If existing tests/steps were flagged stale**, how to draft replacement
content depends on the strategy decided in step 3:

* **Patch in place** — draft the specific Test Step / Test Data /
  Expected Result text that replaces what's there, called out explicitly
  as "`QA-nnnn`, step N — replacement" alongside what it replaces, so the
  discrepancy between old and new is obvious at a glance.
* **Replace and deprecate** — draft a complete, self-contained new test
  case in the same shape as any net-new test below (Test Name, `Device
  Required:`/`Precondition:`, the full Test Step / Test Data-Use Case /
  Expected Result table, Platform) rather than a per-step diff against
  the old test, since the old test is being retired rather than edited.
  Note in the draft which test it replaces (e.g. "Replaces QA-nnnn") so
  the relationship is traceable once both tests exist side by side in
  Jira until the old one is deprecated.

* **Platform sibling of an already-filed test** — if step 1's findings
  show this ticket is the other platform's half of a bug whose sibling
  ticket already has a `Verification`-linked QA test, don't draft a new
  test: draft the added `Platform:` Test Data variant (and any
  platform-specific wording in Expected Result) for the *existing* steps,
  called out as "`QA-nnnn`, steps N–M — add platform variant", and hand
  that to `/zenith-test-intake` as an in-place edit.

This is still a draft, not an edit — `/zenith-test-intake` is what
actually files the new test and applies both the deprecation label swap
and any in-place patch.

**Coverage self-check before finalizing.** Re-read step 5's matrix and
confirm every cell not deliberately dropped is covered by a numbered use
case; an uncovered cell is a gap to fix, or to surface in Open questions,
before the draft is shown or posted.

One test case per acceptance criterion, unless several criteria are
really the same workflow walked once (style guide's "one test per
workflow" rule) — merge those rather than writing redundant parallel
tests. Check how rigorous verification needs to be:

* **Relative/comparative** (fast, no special tools): run the same input
  back-to-back across the conditions being tested and confirm ordering
  and rough proportionality look right. Good default for most manual QA.
* **Measured** (slower, more rigorous): capture a baseline, then measure
  the actual change and check it against an expected value within a
  tolerance. Suggest — don't assume — this when the change is
  clinically/financially/safety sensitive; let the user decide the
  tradeoff.

Favor relative comparison as the default. Organize test cases into clear
sections when the change involves both default and modified/edge-case
values — in style-guide terms, separate Test Data variants or separate
steps within the same test, rather than separate tests. If a test case
needs a repeatable/controlled input to make a fair comparison, say so
explicitly and explain why.

This step only drafts the content — it doesn't resolve a destination
feature folder, file anything, or assign the `Device Required` value as a
Jira label. That's `/zenith-test-intake`'s job once the draft is
confirmed; this step just needs to hand it something already in the right
shape.

### 7. Reconcile against real data, if the user provides it

If the user shares real config values, screenshots, logs, or other ground
truth, treat it as authoritative over the ticket's example values — but
don't silently substitute it in. Explicitly compare it to what the ticket
described and call out anything that doesn't match. For each discrepancy,
say what you think is going on (stale description vs. an actual latent
bug) and let the user confirm which.

When real data changes the shape of things, update the acceptance
criteria and test cases to match reality, not just append a footnote.

### 8. Package as a Jira-comment-ready draft

Once everything above has converged, assemble it into a single block
formatted the way it would look as a Jira comment, in this order:

1. A short callout of any discrepancies/open questions (engineers reading
   it want to know what's uncertain before the rest).
2. **Content for anything flagged stale**, per the strategy decided in
   step 3 — either per-step replacement content, or a complete new test
   case plus its own `QA-nnnn: swap label Zenith_TC → Deprecated_Zenith`,
   `QA-nnnn: remove its execution from the Zenith E2E cycle`, and
   `QA-nnnn: comment "Deprecated and replaced with QA-mmmm"` lines
   for the test it replaces. Use the comment table format below for
   either case.
3. Acceptance criteria.
4. Manual test cases (net-new coverage), in the same comment table format.

**A Smoke test only finding (step 2 above) skips 2–4 entirely** — there's
no replacement/new Zephyr content and no acceptance criteria to draft, so
the posted comment is just the `Build:` line and the Use Case/iOS/Android
table, built from whatever engineering already posted as verification
steps (or self-authored and flagged as such, per step 2).

**Comment table format.** The style guide's Test Step / Test Data-Use
Case / Expected Result columns are Zephyr Squad's own field shape —
`/zenith-test-intake` still files tests into those three fields
unchanged. The *comment* posted here uses a different presentation,
readable by non-QA teams (engineers, PMs) without Zephyr Squad context,
built from the same style-guide language and facts, matching the layout
of existing Zenith comment tables other teams already read (bold,
underlined use-case names; plain numbered steps; one consolidated
Expected Result written as prose, not a second numbered list).

**What the user sees in-session vs. what gets posted differ.** Show the
user the full draft while converging (step 3 above) — Test Name, `Device
Required:`, `Precondition:`, Platform, and any deprecation note all
included, so they can confirm the metadata `/zenith-test-intake` will
need before filing. **The posted Jira comment itself drops all of that
front matter.** Everything before the `Build:` line is cut except Open
Questions — no Test Name, no `Device Required:`/`Precondition:`/Platform,
no narrative lead-in, no deprecation label-swap line. Those fields aren't
lost — they still go to `/zenith-test-intake` at filing time — they just
don't clutter a comment meant for a quick dev read. If a deprecation swap
is part of this draft, call it out to the user in your own reply (not in
the posted comment) so it isn't forgotten before intake runs.

A posted comment is therefore, in order:

    **Open questions**
    <only if there are any — omit this block entirely otherwise>

    **Build:**

    | **Use Case** | **iOS** | **Android** |
    |---|---|---|
    | <row 1> | | |
    | <row 2> | | |

    **Acceptance criteria**
    <unchanged from step 4>

  - **`Build:`** is its own bold line directly above the table, always
    left blank — the tester fills in which build they ran it against.
  - **One table row per Use Case** (the style guide's own per-step Use
    Case granularity, one row instead of one Test Step/Test Data/Expected
    Result column triple).
  - **The `iOS` and `Android` columns are always left blank** — for the
    executing tester to fill in per platform, never populated when
    drafting.
  - **The `Use Case` column**, built as real block content (a heading
    paragraph, then an ordered list, then a prose paragraph — not a
    single paragraph with literal `<br>` line breaks stuffed in, which
    reads as a dense, hard-to-scan blob once Jira renders it):
    - A short **bold, underlined** use-case name as its own line — no
      "Use Case:" label. Name it the way a tester would recognize the
      scenario at a glance ("Font size at OS maximum", not a full
      sentence restating the whole configuration).
    - A **plain numbered list of steps** directly below the name — no
      "Test Steps:" label. Strip out the style guide's embedded
      observations (its "every sub-step ends in something to check" rule
      governs the Zephyr Squad fields `/zenith-test-intake` files, not
      this comment); these are actions only. Simplify the wording but
      keep exact UI labels and screen names.
    - **`Expected Result:`** bold, inline at the start of a prose
      paragraph (not its own numbered list) — the critical-path outcome
      after all steps complete, consolidated into flowing sentences, not
      one line per screen or per original sub-step.
    - An optional trailing **italicized parenthetical note**, its own
      paragraph, for a known gap or a genuine open question specific to
      that one use case (a tester's own uncertainty belongs here too, not
      folded into Expected Result's prose).
  - When posting through `addCommentToJiraIssue`, prefer `contentFormat:
    "adf"` with hand-built ADF for this table — the ordered list and the
    bold+underline name need real ADF nodes (`orderedList`/`listItem`,
    marks `strong`+`underline`), which plain CommonMark can't express
    (`__text__` maps to bold, not underline, and a markdown ordered list
    inside a table cell is unreliable through the converter). Markdown
    tables still render with bordered cells by default once Jira converts
    them — borders were never the gap; the `<br>`-stuffed single paragraph
    was.

  Worked example (one Use Case row, shown in the posted-comment shape —
  no Test Name/Device Required/Precondition/Platform front matter):

    **Open questions**
    The Expected Results below call out a known, unfixed gap inline (Login/Account text-field clipping) so a tester doesn't log it as a new defect. Worth confirming with eng this is tracked as follow-up work before QA runs this.

    **Build:**

    | **Use Case** | **iOS** | **Android** |
    |---|---|---|
    | **Font size at OS maximum** (bold+underlined)<br>1. Set the system font size to maximum in device Settings.<br>2. Fresh-install and launch the app.<br>3. Navigate through the Landing screen, Login screen, Encounters list, Listen screen (Freeform, device connected), Guided Exam (device connected), and Account settings.<br><br>**Expected Result:** Text on every screen enlarges to match the system font size, and all buttons remain legible and tappable — including the Guided Exam header and footer, which wrap instead of truncating. Landing auto-scrolls to keep "Create account" reachable if the content now overflows.<br><br>*(Known gap, not a new defect: Login and Account settings text fields may still clip at this size.)* | | |

  (The `<br>` above is this reference file's own way of showing line
  breaks in prose — the actual posted comment uses real ADF block nodes
  for the name/list/paragraph structure, per the `contentFormat: "adf"`
  note above, not literal `<br>` text.)

  This is cosmetic restructuring only — the underlying facts (exact screen
  names, exact button labels, exact assertions) must stay intact so
  `/zenith-test-intake` can translate the confirmed draft back into the
  style guide's Test Step/Test Data/Expected Result fields without losing
  anything.

Show this draft to the user in-session first — treat every version as a
draft for review while the acceptance criteria and test content are still
converging (steps 3–7). Iterate on feedback by making the specific change
asked for and re-showing the complete draft, not just the diff.

### 9. Post the comment — this skill's invocation is the authorization

**Invoking `/zenith-qa-test-case-gen` is itself the request to post.** Once
the draft has converged (the user isn't actively mid-iteration on it),
post it with `addCommentToJiraIssue` without a separate "should I post
this?" round-trip — don't hold a finished draft back waiting for a second
confirmation that was never going to come. This applies the same way to a
Smoke test only verification comment (step 2) as to a drafted
replacement/new-test comment: this skill's whole job is to get the
comment onto the ticket, not just produce it for approval.

This is narrower than it sounds — it covers *posting the comment*, never
*filing anything in Zephyr Squad*. Never invoke `/zenith-test-intake` on
the user's behalf without being explicitly asked; that boundary doesn't
move. What to surface instead depends on step 2's category:

* **Replacement content needed / Additional coverage needed / New test
  case warranted** — surface what `/zenith-test-intake` should be run
  against (the flagged existing tests and their replacement content or
  their new-test-plus-deprecation pair, the net-new test cases) and let
  the user kick that off. The label swap and the cycle removal on a
  deprecated test are both Zephyr Squad state, same as filing the new test
  itself — this skill never applies either directly, regardless of how
  confident the draft is.
* **Smoke test only** — once this comment is posted, say so plainly and
  stop. Don't surface `/zenith-test-intake` as a next step at all; there
  is no Zephyr content from this finding for it to file.

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
