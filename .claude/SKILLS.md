# Agent skills

Skills in `.claude/skills/` are loaded automatically by Claude Code sessions in this repo.
They are assigned per role on the Agent Squad Board. Anthropic-published skills come first;
third-party skills only fill gaps Anthropic does not cover.

| Role | Skill | Source | License |
|---|---|---|---|
| PO | write-spec, roadmap-update, product-brainstorming | anthropics/knowledge-work-plugins@33eeda1 (product-management) | Apache-2.0 |
| BA | write-spec | anthropics/knowledge-work-plugins (product-management) | Apache-2.0 |
| Developer | debug | anthropics/knowledge-work-plugins (engineering) | Apache-2.0 |
| Developer | frontend-design | anthropics/skills@dbd4588 | Apache-2.0 (LICENSE.txt in folder) |
| Developer | test-driven-development, verification-before-completion | obra/superpowers@bb92a77 | MIT |
| TechLead | architecture (+ built-in /code-review, /security-review) | anthropics/knowledge-work-plugins (engineering) | Apache-2.0 |
| DevOps | deploy-checklist | anthropics/knowledge-work-plugins (engineering) | Apache-2.0 |
| DevOps | ci-cd-and-automation | addyosmani/agent-skills@aeac41d | MIT |
| DevOps | eas-release (viết riêng cho dự án: EAS + Supabase, thay ci-cd-and-automation) | dự án | — |
| QA | webapp-testing (chỉ bản web / bảng Kanban; app iOS/Android kiểm thử trên máy giả lập) | anthropics/skills | Apache-2.0 (LICENSE.txt in folder) |
| QA | testing-strategy, accessibility-review | anthropics/knowledge-work-plugins (engineering, design) | Apache-2.0 |

Files are copied unmodified. License texts are in `.claude/licenses/`.
Lines such as `~~project tracker` in the knowledge-work skills refer to optional connectors and are skipped when none is connected.

## Ghi chú cho app Gia sư Tiểu học (Expo / React Native, 19/10/2026)

- frontend-design: chỉ lấy nguyên tắc thẩm mỹ; giao diện theo `src/constants/theme.ts` và thiết kế Stitch.
- test-driven-development: dùng khi dự án đã có `npm test` (ticket GSTH-033 cài jest-expo).
- ci-cd-and-automation: chỉ tham khảo; dự án không dùng GitHub Actions. Dùng `eas-release`.
- webapp-testing: không dùng cho app iOS/Android; QA kiểm thử bằng công cụ máy giả lập iOS của Claude.
- accessibility-review: áp dụng cho React Native (cỡ chữ, tương phản, vùng bấm 44pt, accessibilityLabel).
