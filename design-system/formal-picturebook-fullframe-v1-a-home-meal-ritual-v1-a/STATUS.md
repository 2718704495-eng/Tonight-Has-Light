# B8 H4 user visual approval status

- H1 `home-meal-h1-arrival-v1-a-r2`: `USER VISUAL PASS / FROZEN`；390 SHA-256 `b68c2dfd7bcf40a9d3bd77320faecdbeff517e2b2f7f160abbf4a7d4c6a836fe`；批准记录 SHA-256 `b3f6baca9190fa278e680613b58c37f25aac017f62e72ee54f3f104878fac4f6`。
- H1 负责人审查：`P0=0 / P1=0 / P2=0`。
- H1 独立零写入审查：`P0=0 / P1=0 / P2=0`。
- H2 `home-meal-h2-hang-outerwear-v1-a-r1`：`USER VISUAL PASS / FROZEN`；390 SHA-256 `ef11fcb38d1e515cb2f8702d7b4ea8734f0f92ac08f24c8e2a18bfad97ccc6dd`；批准记录见 `docs/HOME-H2-H3-VISUAL-APPROVAL-20260831.md`，不使用 r2。
- H2 预批准清单自身 SHA-256：`9b5b908aa26561ce51bacae789b971c4b604502f60736cad8976cf6c6cc36f1e`，清单内项目复算全部 `OK`。
- H3 `home-meal-h3-serve-hot-dish-v1-a-r1`：`USER VISUAL PASS / FROZEN`；390 SHA-256 `c582fa5e9ad5c0f465e307472ccfc6791ed78b2d1e81663669df9151819aab72`；195 SHA-256 `ce8e04691102079b2cea11b02c4e51cf52a752c3902433a07dd0481b0822b4c2`；批准记录见 `docs/HOME-H2-H3-VISUAL-APPROVAL-20260831.md`，不使用 r2。
- H3 预批准清单自身 SHA-256：`91d967150073566f1d9c34302bb3197a26fdf4ac2d45201a0fa13a9303eeb4ec`，清单内项目复算全部 `OK`。
- H4 `home-meal-h4-table-ritual-v1-a-r2` clean plate：负责人及独立零写入审查均已关闭 `P0/P1`；独立结论为 `PASS FOR RESPONSE LAYER PRODUCTION`，审查记录 SHA-256 `09059d0d2610a14a3b35850c22a694a7c3ce542aef8d0b76ee6ccb8369b3b558`。
- H4 当前：`USER VISUAL PASS / FROZEN`；用户原句为 `批准 HOME-H4-TABLE-RITUAL-V1-A-R2：H4 饭桌互动视觉通过`，批准记录见 `docs/HOME-H4-TABLE-RITUAL-V1-A-R2-APPROVAL.md`，SHA-256 `9337f3315a8c623597aa29da7f8edbdb3540b89bd72dd29767145663cc846579`。
- H4 response states：`none / ate / sipped / both` 已生成；`none` 与 clean plate 字节一致；最终 `ate` 为 `0a356ea97cc91afecc93c8c9a607583d63a40db0a6e0226ec224be4a47a450b5`，最终 `both` 为 `69a9ab2b2982cd83beec6430c9684940f2b9924c5a15beb29615eeaaf722a530`。`ate` 与 `sipped` 仅在声明 ROI 内改变，`both` 仅由两层合成；状态只写 `h4State`，不写完成、奖励或解锁。
- H4 quiet UI：独立零写入审查判定可见与交互合同 `PASS`；普通字号为低权重画中文字，120% 大字使用 `桌边暖纸`；触控区最小 `83×170px`，逻辑边缘间距 `9px`，360 宽实算 `8.31px`；像素对比采样最小 `10.84:1`。审查提出的旧哈希清单与会写证据的测试两项 P1 已在冻结前修复。
- H5：`REFERENCE HASH PASS`，canonical 390 SHA-256 `569a7b9b71d16d13ad311bdea9a29d6bc93a7dc68c99892faf8c416f38bc1c51`。
- Gate B 子包：`PASS / HOME-MEAL-RITUAL-V1-A / H1-H4 USER VISUAL PASS-FROZEN / H5 REFERENCE HASH PASS`。这只表示回家晚饭五镜视觉子包通过，不代表整个正式绘本 Gate B 通过。
- 权限：该子包仅冻结设计资产。Cocos、build、WeChat、upload、release、Git 和 remote write 仍为 false。
