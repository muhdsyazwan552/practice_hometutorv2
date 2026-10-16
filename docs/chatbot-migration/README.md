# HT Bot migration

The original owl HT Bot and supplied `chatbot_api.php` reply engine are installed in this Laravel project. The former `hometutor_new` knowledge JSON was copied into a local file. Runtime no longer fetches the knowledge API or writes/reads an instruction cache.

## Edit locations

- [Instructions, scope rules, keyword lists and all 15 reference topics](/var/www/practice_hometutorv2/resources/data/chatbot-knowledge.json). This JSON is read directly on each request; data edits do not need a frontend build.
- [PHP reply engine](/var/www/practice_hometutorv2/app/Services/MarketingChatbot.php). Ports the original normalization, greetings, topic scoring, top-two reference selection, Responses request, retry rules and output extraction.
- [Request validation](/var/www/practice_hometutorv2/app/Http/Controllers/Marketing/ChatbotController.php). Endpoint: `POST /api/marketing/chatbot` with `{message, locale}`. Stateless guest access; no account, session or chatbot database is needed.
- [Original 20-per-minute limit](/var/www/practice_hometutorv2/app/Http/Middleware/LimitMarketingChatbot.php). Private, locked rate-limit counters remain under `storage/framework/chatbot-rate-limits`; these are request limits, not an instruction cache.
- [Widget, animations and links](/var/www/practice_hometutorv2/resources/js/Components/LegacyMarketing/HomeTutorChatbot.jsx). Styling: `resources/css/marketing-chatbot.css`; original assets: `public/images/marketing-chatbot/`.
- [Settings](/var/www/practice_hometutorv2/config/chatbot.php). The original `gpt-5.6-luna` model, `reasoning.effort=none`, 500-token output ceiling and `store=false` are retained. Environment overrides: `OPENAI_LUNA_API_KEY` (also supports `CHATBOT_OPENAI_API_KEY` / `OPENAI_API_KEY`), `CHATBOT_OPENAI_MODEL`, and `CHATBOT_SUPPORT_URL`. The default fallback opens the local account/payment FAQ; no API credentials are sent to the browser.

The local instruction file remains private and is not bundled in public JavaScript. Frontend content and accessibility labels follow the shared ENG/BM setting. Model responses receive the selected language as a trusted server-side instruction. Existing chat messages remain as originally received. URL buttons safely render as text/links; old Products URLs are mapped to current local Products pages. Subscription/registration guidance uses this project’s registration and login pages. Existing issued codes are explained separately from standard online subscriptions.

Shared marketing navigation and bot package links preserve Inertia state so an open conversation survives navigation between these pages. Keyboard close/focus, desktop dragging, mobile sizing, typing/retry/rate-limit states and reduced-motion poster behavior are retained. The existing student/friend chat controller is unrelated and remains unchanged.

## Validation

13 backend tests passed with 65 assertions, using isolated configuration, in-memory test settings and mocked provider calls. Tests cover guest greetings in both languages without credentials; out-of-scope rejection without model calls; input validation; the original model request and local references; immediate local knowledge edits; missing credentials; transient retry and terminal errors; empty output; and the 20-per-minute limit, including spoofed forwarding headers. No production database migrations or test-provider requests occurred.

The production Vite build completed and all 104 manifest entries and referenced assets/imports passed validation. It was published at https://practice.hometutor.com.my with older hashed assets retained and the manifest switched atomically. Laravel configuration was refreshed to include the new settings. Source/manifest backup: `backups/marketing-before-chatbot-20261014/source-and-manifest.tar.gz`.

Live widget checks passed at 1440, 1024, 768, 390 and 320 pixels, including open/close/focus/Escape, dragging, package navigation without conversation loss, typing/errors/retry, both languages, URL buttons, HTML escaping and owl idle/hover/click plus reduced-motion states. Provider-return tests in that browser suite were intercepted. A separate live handler check verified actual greetings through the widget, stateless English/BM calls, out-of-scope behavior and length validation. No JavaScript or image errors occurred. Reports are saved alongside this file.

## Live activation

On 2026-10-14, `OPENAI_LUNA_API_KEY` was confirmed present without revealing its value, Laravel configuration was refreshed, and live English and Malay product questions both returned AI answers with HTTP 200. The key remains server-side; keep it private and out of source-controlled files and frontend variables.

## Reference

The source request/output structure was checked against [official OpenAI Responses documentation](https://developers.openai.com/api/docs/guides/migrate-to-responses). The original PHP handler is preserved as `original-chatbot_api.php.txt` for comparison.

## Subscription guidance revision — 14 October 2026

Replaced the old “buy an activation code, then register” instructions with the implemented flow: parent registration, six-digit email verification, package and 6/12-month duration selection, child details, checkout, then automatic child creation and subscription activation after payment confirmation. Renewal uses the existing child account. Removed historical promotional prices/scarcity and monthly billing assumptions; prices are shown in the parent checkout.

The 15 local topics now cover payment/receipt issues, renewal, support and registration alongside learning features. No old-site URLs remain in the active knowledge JSON. The owl greeting invites product and account questions; local registration/login/help URL buttons have meaningful labels. The default outage link opens the local support FAQ rather than the original placeholder WhatsApp number.

Revised FAQs contain 24 questions across five categories, including a separate account/payment help category. English answers are in `answerHtml`, BM answers in `answerHtmlMs` in `resources/js/Components/LegacyMarketing/faq-content.json`; question/category labels use `marketing-copy.json`. Existing refund-policy terms remain as supplied; no new refund promise was introduced. Footer Contact Us opens the local support category. Parent page helper text now matches automatic subscription fulfillment and confirmed payment.

Validation: 13 backend tests / 65 assertions; real English subscription, BM post-payment and English price/billing replies all returned HTTP 200 with the revised guidance. Browser checks passed for all 24 FAQs, five categories, search, greeting, support links and both languages at 1440 and 390 pixels, without overflow or JavaScript errors. No live registration or purchase was made. The staged Vite build completed in 61 seconds; all 104 manifest entries were validated before atomic publication with old hashed assets retained.

Backup: `backups/help-content-before-subscription-20261014/content.tar.gz` and its previous build manifest. Evidence: `subscription-live-replies.json` and `subscription-browser-check.json` alongside this document.
