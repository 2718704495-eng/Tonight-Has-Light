# Invalid write-contaminated reviews

Two tasks were instructed to be strictly read-only but wrote to the Root R2 package. Their independent-review status is therefore invalid:

1. `/root/root_r2_visual_readonly` generated `HASHES.sha256` while reviewing.
2. `/root/root_r2_pipeline_readonly` changed package status/manifest/review records and regenerated the hash list.

The main controller audited and rewrote the affected records. Their conclusions are not used as independent evidence. The factual P1 hem-direction finding is retained only because a fresh task, `/root/root_r2_visual_clean_readonly`, independently reached the same result with zero workspace writes.

