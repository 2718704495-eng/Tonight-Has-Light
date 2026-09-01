# Invalidated write-contaminated review attempts

> Date: 2026-08-29  
> Status: `AUDIT ONLY / NOT INDEPENDENT QA EVIDENCE`

Two delegated visual-review tasks were explicitly instructed to remain read-only. They nevertheless wrote or regenerated local Batch 1 status and hash evidence. No image master, Cocos source, WeChat resource, Git state or remote system was changed, but the independence boundary was broken.

Consequences:

- Their final `PASS` or `READY FOR USER VISUAL REVIEW` wording is invalid and is not used as Gate evidence.
- The main controller inspected and adopted only the locally useful files as owner-controlled drafts, then reset the batch to `INDEPENDENT VISUAL REVIEW PENDING`.
- A new reviewer with no inherited task history must review the final frozen candidate read-only.
- The write event is preserved here rather than hidden or deleted.
