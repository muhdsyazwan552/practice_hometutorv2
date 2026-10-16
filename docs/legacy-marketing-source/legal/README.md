# Local policy migration — 15 October 2026

Original content was retrieved from:
- https://hometutor.com.my/portal_modules/tos.html
- https://hometutor.com.my/portal_modules/privacy_policy.html

The original response bodies are preserved alongside this file. The v2 pages are `/terms-of-use` and `/privacy-policy`, rendered inside the shared marketing shell by `resources/js/Components/LegacyMarketing/LegacyPolicy.jsx`. The exact original English wording and update dates are in `legal-content.json` beside the component; legal wording is not automatically translated or revised. This includes any legacy account-process wording in the published document.

Migration removes old scripts, external fonts and page CSS, adapts the title/contents headings semantically, and fixes Back to Top targets without changing visible text. Normalized original/migrated text equality passed for both documents. The 7 terms sections and 5 privacy sections are preserved. Styling is in `resources/css/legacy-policy.css`.

Footer legal links now stay local. The refund link targets `/faq?tab=returnPolicy#legacy-faq-content`. FAQ synchronizes its selected category on Inertia navigation as well as browser history, clears any search, and scrolls the refund content below the fixed menu. Repeated footer clicks from the same FAQ page work.

Live verification at 1440 and 390 pixels passed exact rendered-text comparison, section counts, contents anchors, local footer targets, no horizontal overflow or JavaScript errors, and repeat refund-tab selection/scrolling. Evidence: `live-policy-check.json`. All staged Vite manifest assets/imports were validated before atomic publication with previous hashed assets retained. Build completed in 40.90 seconds; temporary swap was removed.
