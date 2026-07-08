# Quest Template — Everden

Use when adding a quest after the vertical slice. Follows [VERTICAL_SLICE.md](VERTICAL_SLICE.md) and [CONTENT_PIPELINE.md](../systems/CONTENT_PIPELINE.md).

## 1. Outline (docs first)

```markdown
## Quest id: `snake_case_id`
**Title:** Display name
**Hook:** One sentence stakes
**Fail-forward:** What happens if every skill check fails?

### Stages
| id | Player-facing description | Objective type | target id |
|----|---------------------------|----------------|-----------|
| stage_a | ... | examine / talk / flag / council_choice | ... |
```

## 2. `public/data/quests.json`

```json
{
  "id": "quest_id",
  "title": "Quest Title",
  "description": "HUD summary.",
  "stages": [
    {
      "id": "stage_one",
      "description": "Short stage text for quest tracker.",
      "objectives": [{ "type": "examine", "target": "object_id" }],
      "next": "stage_two"
    }
  ],
  "rewards": { "gold": 0 },
  "outcomes": {}
}
```

**Rules:**
- `startQuest()` must not reset an active quest — wire **talk objectives** via dialogue `complete_objective`, not `onNpcTalk` on open.
- Branching endings use `quest_outcome` + `completeWithOutcome`, not auto-finish on flags alone.

## 3. World flags

Document every flag in the quest outline:

| Flag | Set by | Read by |
|------|--------|---------|
| `example_flag` | dialogue action / examine | `DialogueConditions`, `altText` |

## 4. Dialogue (`public/data/dialogue.json`)

Per skill-check choice:

```json
{
  "text": "Choice label",
  "next": "success_node",
  "failNext": "fail_forward_node",
  "skillCheck": { "stat": "wis", "dc": 12, "label": "Insight" }
}
```

Species-exclusive lines: `"condition": { "species": "frog" }`  
Motivation lines: `"condition": { "motivation": "investigator" }`

## 5. Journal (`public/data/journal.json`)

Add an entry if any examine is lore-worthy:

```json
{
  "id": "journal_entry_id",
  "title": "...",
  "unlock": { "type": "examine", "target": "object_id" }
}
```

## 6. Verification

- [ ] Unit test for new `DialogueConditions` or quest stage if logic is non-trivial
- [ ] `npm test && npm run typecheck && npm run build`
- [ ] QA harness: `completeExamine` / `talkTo` / `setQuestStage` smoke
- [ ] Optional: row in `e2e/vertical-slice.spec.ts` if mechanically automatable
- [ ] Manual row in [MANUAL_CHECKLIST.md](../playtests/MANUAL_CHECKLIST.md) if narrative/feel matters

## Reference — main quest pattern

**What the Water Remembers:** four examines → `council` stage → five `quest_outcome` branches. Copy that structure for any quest with a culminating choice.
