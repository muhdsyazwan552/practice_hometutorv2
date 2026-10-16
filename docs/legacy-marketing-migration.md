# Public marketing pages — 13 October 2026

## Requested result

Use the original HomeTutor site's active content for four separate public pages. Preserve page copy, section order, statistics, testimonials, prices, and original images; improve responsive layout and navigation without rewriting the source. The previously developed practice-demo/screenshot landing page is backed up and remains in the source tree.

## Backup before replacement

`backups/landing-page-20261013T155355Z/landing-page.tar.gz`

SHA-256: `591ddf764a83eee7f6e1f2a09d90445ed9c09706db98c801cbd87212da1c59da`

The archive includes the previous marketing source and styles, images, routes, compiled assets and manifest, and build configuration. It excludes credentials and database content. The backup directory contains a README and checksum file. It is outside the public web root.

## Source of truth

Retrieved public source from `https://hometutor.com.my/portal_modules/`:

- `home.html`: seven sections — hero, four ecosystem products, six learning steps, four statistics, four benefits, three testimonials, four school-level package links.
- `products.html`: four school-level tabs with original banner, descriptions, features (where present), prices and subscription destinations.
- `about.html`: self-directed learning, learning readiness, three technology images, tutor skills images and tutor-team montage/caption.
- `faq.html`: all 15 original questions and answers across About HomeTutor, Purchase Issues, Content Provider and Return Policy.

Snapshots are kept in `docs/legacy-marketing-source/`. Original images are hosted locally under `public/legacy-site/` with their original paths. These are copied assets, not newly generated illustrations.

## Navigation and behavior

- `/`, `/products`, `/about`, `/faq` share `LegacyMarketing.jsx` and a responsive menu with actual page links.
- Signed-in visitors to `/` retain the existing redirect to their account's home route.
- Existing `/landing` redirects to `/`; `/landing/game` is unchanged.
- Original package links select `/products?target=productA` through `productD`; section hashes also work.
- Four dead `#` ecosystem product links now open `/products`.
- FAQ categories and keyword search work. `/faq?tab=returnPolicy` opens the full original return policy.
- All eight product enrollment links retain `https://new.hometutor.com.my/daftar?package_id=1` through `4`.
- Other existing contact, registration, teacher enrollment and legal destinations point to their original site; Login uses the current application's `/login`.
- Static source content is stripped of comments and executable scripts. Old JQuery/Slick dependencies, analytics, unsupported-browser notices and chatbot services are not imported.
- Motion respects reduced-motion preferences; content and final statistics do not depend on animation completing.

## Content decisions

The request is exact source content. Original pricing, testimonials, numerical claims, wording/typos, older exam references, support contact details and return-policy copy are preserved without independent verification or editorial changes. The source has differences between its marketing/FAQ numbers and a literal stray `>` in one Products sentence; those were not silently corrected.

The old Purchase Issues navigation label was commented out while its content remained in the source. This migration makes all four FAQ categories reachable. Text embedded in About images is preserved in those images and described through alt text. All original image panels remain visible on mobile instead of relying on the old Slick initializer.

## Validation

- Home source-to-output parity: seven sections, all active text (counter placeholders normalized to their displayed final values), 20 images and nine link mappings.
- Products source-to-output parity: 129 active text blocks, eight image occurrences and eight enrollment destinations.
- About source-to-output parity: all seven text blocks and nine image occurrences.
- FAQ: 15 original questions/answer blocks across four categories.
- Desktop and phone browser checks cover navigation, image loading, FAQ search, policy deep links, product tabs and keyboard access, mobile menu and horizontal overflow.

## Deployment completed

Published the staged Vite release and then activated the four Laravel routes on `https://practice.hometutor.com.my`. The manifest was replaced atomically after copying the new assets; older hashed assets were retained for existing browser sessions. PHP route syntax and manifest asset references passed validation. No database changes were needed.

Live Home/FAQ checks passed at 1440, 390 and 320 pixels. Live Products/About checks passed at 1440 and 390 pixels, including all four tab/deep-link targets and original enrollment links. No JavaScript errors, missing images, 404 assets or horizontal overflow were found. Local preview additionally checked Products at 320 and 768 pixels. Validation reports are in `docs/legacy-marketing-source/validation/`.


## Home banner update — 14 October 2026

At the user's request, replaced the first section with their supplied English eyebrow, headline and full description. Installed the original `HTV2_bannerBground.png` as `public/images/landing-practice/hometutor-hero-background.png` and the new closer student portrait as `public/images/landing-practice/hero-students-closeup.jpg`. The portrait attachment was JPEG data despite its `.PNG` filename; it is served with its actual format. Both source files are preserved byte for byte.

The desktop banner keeps the artwork visible beside the heading. Mobile stacks the text and student image with a stronger light overlay behind the copy. A CSS light zone and blend soften the JPEG's white background; skin, clothing and device content remain readable. Blue/violet gradients now colour the hero CTA and the lower Home sections more visibly. The other six Home sections retain their original content and imagery.

Scoped styles are in `home-hero-update.css` and `home-atmosphere.css`. The current navigation and modern logo are retained. Pre-update source and manifest backup: `backups/landing-before-new-background-20261014/source-and-build.tar.gz` (SHA-256 `2481c71db88e6dbb1eaf4bdb7cff89e55b98548add98473499769c5759945e08`). Older compiled assets remain available for cached clients and rollback.

Published the update to `https://practice.hometutor.com.my/`. Production build and all 103 manifest entries passed validation. Live browser checks at 1440, 1024, 768, 390 and 320 pixels confirmed exact requested hero text, both new images, seven Home sections, no overlap or horizontal overflow, and zero JavaScript errors or bad HTTP responses. Evidence: `docs/legacy-marketing-source/validation/live-home-banner-oct14.json`.


## Transparent students and restored HomeTutor Play — 14 October 2026

Removed the visible white portrait matte using `hero-students-cutout.png`, generated with the built-in image editor in background-extraction mode. The output has actual alpha transparency (42% of its pixels fully transparent). The website uses only its alpha silhouette as a CSS mask over the original student JPEG, preserving the original faces, colours and device-screen content. Removed the previous white light-zone and multiply blending. A slight bottom fade softens the original waist-up crop. Exact edit prompt and mode: `docs/hero-student-cutout-prompt.txt`.

Restored the HomeTutor Play section from `backups/landing-page-20261013T155355Z/landing-page.tar.gz` into `HomeTutorPlaySection.jsx`. Preserved the original introduction, feature copy, five artwork assets, CTA and game-type labels. The section follows the learning process and precedes the statistics. The HomeTutor Play menu now points to `/#play`; the launch button still goes to `/games/play`. Motion and marquees respect reduced-motion preferences. All seven previous Home sections are retained, bringing the page to eight sections.

Pre-change source/manifest backup: `backups/landing-before-cutout-and-play-20261014/source-and-manifest.tar.gz`. The new image is a sibling asset; the original supplied photo is retained.

Published to `https://practice.hometutor.com.my/`. Live checks passed at 1440, 1024, 768, 390 and 320 pixels: actual alpha transparency, no white portrait backdrop, seven original Home sections plus one restored Play section, five Play images, original copy, working menu anchor and launch link, no overflow or JavaScript/network errors. Guest launch route returns HTTP 302 to `/login`. Evidence: `docs/legacy-marketing-source/validation/live-floating-students-and-play.json`.


## About redesign — 14 October 2026

Rebuilt `/about` in the landing page's blue/violet visual theme. Removed the old background bitmap, learning illustrations, text-in-image panels and combined tutor montage from the rendered page. Preserved the original self-directed-learning, readiness, technology and tutor-quality content as accessible text.

The page now includes a six-portrait introduction collage and a staggered wall of 24 distinct individual tutor portraits. Portraits are sourced from the user-supplied public Xoom tutor directory (`https://xoom.xcelearn.com.my/view-tutors`), whose public request uses `https://api-meet.xcelearn.com.my/tutor/list` with visibility filter 2. Local assets use neutral `tutor-01` through `tutor-24` filenames. The public component manifest contains only image paths; no names, member IDs, biographies, ratings or personal profile links are rendered.

Entrance blur/fade transitions, gentle collage parallax and portrait hover movement respect reduced-motion preferences. Styles are scoped to `.about-page` and `.legacy-shell-about`; the page uses CSS gradients only for its atmosphere. Current source and manifest were backed up to `backups/about-before-redesign-20261014/source-and-manifest.tar.gz` before replacement. Old assets remain available for the earlier backup.

Published the About redesign to `https://practice.hometutor.com.my/about`. Production build and all 103 manifest entries passed verification. Live browser checks at 1440, 1024, 768, 390 and 320 pixels confirmed 24 distinct tutor portraits, no old About imagery or bitmap backgrounds, no profile links, no overlap/overflow and no JavaScript or image-response errors. Normal-motion entrance/parallax/hover and reduced-motion presentation passed. Evidence: `docs/legacy-marketing-source/validation/live-about-redesign.json`. Home also returned HTTP 200 after deployment.


## About hero and layered tutors — 14 October 2026

Replaced the portrait-directory hero with the supplied `AboutUs_banner_img.png` (preserved as `public/images/landing-practice/about-students.png`). The introduction now follows the user's text-left/students-right reference, with dark headings and soft blue/violet circles and page gradients. Added the mission, vision and platform description from the supplied reference as accessible text. The earlier readiness, technology and teaching-quality paragraphs remain.

Replaced the 24-portrait wall with five individually animated, overlapping tutor cutouts. Selected formal portraits from the user-provided public directory to keep head-and-shoulder framing similar. Each uses original photograph pixels under an alpha silhouette; no regenerated faces, personal profile details, frames or tutor background shapes are rendered. The desktop group forms a shallow arch; phones use a layered arrangement with two portraits behind three. Added the requested “50 more tutors” note. The two circles belong only to the supplied student introduction, following its reference composition.

Cutouts were extracted using the built-in image generation tool. Prompt, file links and alpha-only integration details are in `docs/about-tutor-cutout-prompts.md`. The five silhouette masks total 108KB; the source portraits remain unmodified. New source/previous live manifest backup: `backups/about-before-stack-20261014/source-and-manifest.tar.gz`. Old portrait assets remain for rollback.

Published to `https://practice.hometutor.com.my/about`. All 103 production manifest entries and referenced assets passed validation. Live browser checks at 1440, 1024, 768, 390 and 320 pixels confirmed five distinct overlapping portraits, transparent masks, no frames or bitmap backgrounds, correct student asset, mission/vision content, the requested tutor note, dark headline colour, no hero/header collisions or horizontal overflow, and zero JavaScript/network errors. Normal-motion hero parallax, staggered tutor entrances and reduced-motion presentation passed. Home also returned HTTP 200 after deployment. Evidence: `docs/legacy-marketing-source/validation/live-about-stacked-tutors.json`.


## Compact Home banner and larger students — 14 October 2026

Reduced the first Home section's desktop minimum height from 780px to 680px, tightened its top padding from 124px to 100px, and reduced the lower and inner padding. At 1440px and 1920px viewport widths the resulting banner measures 693px, approximately 87px shorter than before. The student's original image and alpha mask remain unchanged; the rendered image grows from 580px to 700px wide (21%). Responsive sizes keep the entire image within the viewport. Smaller screens also receive tighter top/gap/bottom spacing and a modestly larger student portrait. Source changes are limited to `resources/css/home-hero-update.css`.

Pre-change CSS and live manifest backup: `backups/home-before-compact-hero-20261014/source-and-manifest.tar.gz`. Published to `https://practice.hometutor.com.my/` after a successful production build and verification of all 103 manifest entries. Live checks passed at 1920, 1440, 1400, 1280, 1024, 820, 768, 390 and 320 pixels, confirming reduced desktop height, larger students, intact hero copy/artwork/mask, all eight content sections, no header/content/image overlap or horizontal overflow, and zero JavaScript/network errors. Evidence: `docs/legacy-marketing-source/validation/live-compact-home-hero.json`.


## English default and shared ENG/BM switching — 14 October 2026

Connected Home, Products, About and FAQ to the application's existing `LanguageProvider` and guest session locale. Extracted the login page's pill control into the shared `Components/Auth/LanguageSwitch.jsx`; authentication retains its EN/BM labels and marketing passes ENG/BM. Both invoke the same `/change-language` endpoint and disable the control during a request. Existing English defaults, guest-session persistence and authenticated preferences remain in the existing middleware/controller. No server routes or database structures were changed. The provider now keeps the document language synchronized during Inertia visits and switches.

Added 288 bilingual entries in `marketing-copy.json`. Localized menu labels, metadata, headings, calls to action, all Home sections including HomeTutor Play, testimonials, package details/subject labels, About text, all 15 FAQs, category/search controls, footer and accessibility labels. Trusted static markup is translated at text nodes and alt/aria labels only; URLs, SVGs, numeric prices and panel/category identifiers remain unchanged. The audit found only numbers, icons, brand names and contact details outside the translation table. The source content and policy terms remain preserved.

Replaced school-package headings baked into promotional images with native headings and year/form labels so they switch language too. Cropped the same illustration assets beneath their original embedded labels. The illustrations, enrolment destinations, package prices, current branding, compact hero and five-tutor About composition are retained.

Backup: `backups/marketing-before-languages-20261014/source-and-manifest.tar.gz`; the previous provider is stored alongside it as `LanguageContext.jsx`. Vite reported build completion in 42.02 seconds; the execution wrapper subsequently returned exit 143. Before publication, verified all 104 generated manifest entries and every asset/import reference, plus the compiled bilingual copy and ENG control. Older hashed assets were retained when the live manifest was atomically updated.

Published to `https://practice.hometutor.com.my/`. Live browser checks passed for both languages across four pages at 1440, 1024, 390 and 320 pixels (32 combinations): no navigation collisions or horizontal overflow, working phone menu, correct default English, session persistence and reload persistence, four package panels and all 15 searchable FAQs, preserved prices/links, eight Home sections and five About tutors, and zero JavaScript/network errors. Separately verified BM from marketing to login, EN from login back to marketing, and language switching while preserving the FAQ refund-policy deep link. Evidence: `live-marketing-languages.json` and `live-shared-login-language.json` under `docs/legacy-marketing-source/validation/`.

## Subscription help revision — 14 October 2026

Revised the FAQ and HT Bot to explain the current parent registration → email verification → package/duration/child details → checkout → automatic subscription access flow. FAQ now has 24 questions in five English/BM categories and the footer contact link opens its local support category. Current prices are referred to checkout rather than historical promotions. Updated parent dashboard/package/empty-child helper text to match actual gateway confirmation and fulfillment. Details, edit locations, tests and live browser/model evidence are in `docs/chatbot-migration/README.md`.
