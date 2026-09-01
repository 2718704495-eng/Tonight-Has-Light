# HOME-MEAL-RITUAL-V1-A Gate B production container

This isolated container holds source provenance and deterministic review exports for the HOME-MEAL-RITUAL-V1-A picture-book pages. It is not a Cocos asset package and does not authorize image generation, builds, WeChat operations, Git, or remote writes.

At B8, H1, H2 r1, H3 r1 and H4 r2 are frozen as `USER VISUAL PASS`. H2 and H3 are bound to `docs/HOME-H2-H3-VISUAL-APPROVAL-20260831.md`; H4 is bound to `docs/HOME-H4-TABLE-RITUAL-V1-A-R2-APPROVAL.md`, its pre-approval manifest, exact clean plate, four response states, standard UI board, 120% large-text paper and reduced-motion sample. H4's owner and independent review closed P0/P1/P2, and the evidence-chain remediation converted its UI tests to read-only hash checks. The canonical approved H5 is referenced by path and hash only; it is never copied or modified here. This makes the `HOME-MEAL-RITUAL-V1-A` five-shot visual subpackage a Gate B visual pass, but does not pass the project's remaining formal picture-book pages or authorize Cocos, build, WeChat, Git, or remote work.

## Verification working directory

Run hash verification from this package root, because `HASHES.sha256` intentionally contains package-relative paths:

```sh
cd design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a
shasum -a 256 -c HASHES.sha256
```

Running that command from the repository root is expected to fail to resolve its relative paths.
