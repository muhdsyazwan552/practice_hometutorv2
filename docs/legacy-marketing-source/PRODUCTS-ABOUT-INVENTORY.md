# Products and About source inventory

Fetched directly from the public site on 2026-10-13. Full raw HTML/CSS/JS and images are stored here using original URL paths.

## Products

Source: https://hometutor.com.my/portal_modules/products.html

Order: four school-level tabs, followed by their selectable panels. Each panel retains all active source HTML, text, inline feature SVG, imagery, and external enrollment links. Comments and executable legacy scripts are excluded from the React copy.

| Tab | Level | URL query | Hash/panel | Subscribe and register destination |
| --- | --- | --- | --- | --- |
| LEVEL 1 | Tahun 1–3 | target=productA | level1 | https://new.hometutor.com.my/daftar?package_id=1 |
| LEVEL 2 | Tahun 4–6 | target=productB | level2 | https://new.hometutor.com.my/daftar?package_id=2 |
| LOWER SECONDARY | Ting 1–3 | target=productC | lower-secondary | https://new.hometutor.com.my/daftar?package_id=3 |
| UPPER SECONDARY | Ting 4–5 | target=productD | upper-secondary | https://new.hometutor.com.my/daftar?package_id=4 |

Every panel: product banner; ecosystem badge; level/stage; heading; paragraph; Langgan Sekarang CTA; subject pills; monthly starting-price pill; subscription payment board with original RM700 strikeout, RM490 /tahun, *tertakluk promosi and Daftar Sekarang CTA. A five-item feature strip appears between hero and payment board in Level 1, Level 2 and Upper Secondary ONLY. Lower Secondary has no strip in source.

Shared ecosystem badge: Malaysia's AI-Ready Digital Learning Ecosystem

Shared monthly text: Bermula serendah RM58 / bulan

Shared feature-strip text (in order):
- Selaras dengan / Kurikulum KPM
- Akses 24/7 / Di Mana Saja
- AI Membantu / Anak Belajar
- 100,000+ / Pelajar Aktif
- Sokongan Pelanggan / Yang Pantas

Level 1:
- Asas Yang Kukuh / Untuk Masa Depan Anak
- Video pembelajaran, latihan interaktif, AI Tutor dan pemantauan ibu bapa semuanya dalam satu platform untuk membantu anak belajar dengan lebih berkesan.
- Bahasa Melayu; English; Matematik Moden; Sains & Sejarah
- Langgan Pakej Pembelajaran Level 1
- Akses tanpa had untuk semua subjek berserta video eksklusif & AI tutor panduan.

Level 2:
- Kemahiran Lebih Tinggi, / Keputusan Lebih Cemerlang
- Tingkatkan kefahaman dengan latihan berfokus, kelas interaktif, AI Tutor dan analitik pembelajaran untuk keputusan yang lebih baik.
- Bahasa Melayu; English; Matematik Moden; Sains & Sejarah
- Langgan Pakej Pembelajaran Level 2
- Akses tanpa had untuk semua subjek berserta video eksklusif & AI tutor panduan.

Lower Secondary:
- Bina Keyakinan, / Kuasai Asas Menengah
- Kandungan terstruktur, latihan intensif, AI Tutor pintar dan laporan kemajuan untuk membantu anak cemerlang di menengah rendah.
- Bahasa Melayu; English; Matematik Moden; Sains & Sejarah; Geografi
- Langgan Pakej Lower Secondary
- Akses komprehensif semua subjek PMR/PT3 dengan bimbingan AI Tutor yang pintar.

Upper Secondary:
- Kuasai SPM, / Capai Impian Anda
- Kandungan komprehensif, latihan strategik, >AI Tutor cerdas dan pemantauan prestasi untuk keputusan cemerlang.
- Bahasa Melayu; English; Matematik Moden; Matematik Tambahan; Fizik; Kimia; Biologi; Sejarah
- Langgan Pakej Upper Secondary (SPM)
- Eksklusif bank soalan ramalan akhir dan formula pecutan kecemerlangan gred A+.

The literal >AI Tutor typo is in the current source and preserved. The source monthly starting price and annual promotion are preserved independently; no billing assumptions are introduced. A commented-out Level 2 six-image grid and info images are intentionally not surfaced because they are not active page content.

## About

Source: https://hometutor.com.my/portal_modules/about.html

Four sections, in order:
1. Hero: Cultivate self-directed learning; We are committed to create a student with autodidact capability; metho_image1.png on metho_imagebground.png background.
2. Readiness: metho_image2.png; Assess readiness to learn; Involves students conducting a self-evaluation of their current situation, study habits, family situation, and support network both at school and at home and also involves evaluating past experiences with independent learning.
3. Leveraging Technology for Better Learning; learning01.png, learning02.png, learning03.png in this order.
4. Improve Achievement with Tutors HomeTutor; card1.png, card3.png, card2.png in this order; Tutor_5.png six-person montage; *Our team of tutors comprise 50 educators serving both primary and secondary levels.

Image-embedded copy:
- learning01.png: HOMETUTOR QUESTIONNAIRES — We use data from the platform’s questionnaires to track the student’s mastery level of the topics to tailor the learning experience to each student’s needs.
- learning02.png: XCELEARN ONLINE TUITION PLATFORM — Our state-of-the-art platform offers interactive lessons, real-time feedback, and a wealth of resources to support personalized learning.
- learning03.png: DATA-DRIVEN INSIGHTS — Our platform includes a variety of tools and resources to make learning interactive and fun
- card1.png: "Skilled in teaching using technology/ digital tools, proficient in using devices, and able to adapt technology according to students' needs."
- card3.png: "Exhibits high levels of commitment and dedication in fulfilling duties, with a focus on effective team communication and collaboration."
- card2.png: "Delivers engaging and effective lessons in the Dual Language Program (DLP), ensuring students remain interested and attentive."

About has no CTA anchors in its module.

## Source behavior/dependencies

Products source requires global loadFile(), loads products.css and products_revised2.css, Bootstrap Icons 1.11.1 CSS, and Plus Jakarta Sans via Google Fonts. The inline script toggles .active and panel opacity, supports query target productA–D. products.js is loaded twice and binds .btnOnlinePayment to https://hometutor.com.my/online_purchase/; no such CTA class occurs in the active module. React replaces these dependencies with controlled, keyboard-accessible tabs and scoped CSS; decorative Bootstrap icon-font icons become local inline SVG. Images are exact local copies.

About source requires loadFile(), jQuery, and Slick. about.js is an empty document-ready function. Two inline Slick initializers conflict: first activates one slide under 769px with dots/no arrows, second tries two slides but is usually skipped after the first initializes. React uses a static responsive grid on desktop and vertically stacked full images on mobile, ensuring all source content remains accessible; no carousel dependency. Tutor montage placement is in normal document flow so it cannot cover embedded text.

The CSS files are scoped to .legacy-products and .legacy-about. Source font imports are omitted in favor of the containing site's existing font. No general global selectors or legacy scripts are installed.

## Validation

React SSR versus source HTML, after whitespace normalization and excluding scripts/styles/comments:
- Products: all 129 visible text blocks identical, all 8 image occurrences in identical order, all 8 link destinations identical.
- About: all 7 HTML text blocks identical, all 9 image occurrences in identical order, no link destinations.
- All 15 active image/background assets copied byte-for-byte and SHA-256 verified.
- JSX compilation passed for both components.
- Browser interaction/responsiveness validation delegated to root before deployment.

Asset manifest: products-about-assets.json. SSR comparison results: products-about-preservation-check.json. Original asset source paths map to /legacy-site/<original path>.
