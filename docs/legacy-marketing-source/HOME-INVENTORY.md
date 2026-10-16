# Legacy Home source inventory

Source: https://hometutor.com.my/portal_modules/home.html, inspected 2026-10-13.
Live shell: https://hometutor.com.my/ (loads module via AJAX).

## Seven active main sections, exact order

1. Hero: badge “⭐ Era Baru Pembelajaran Digital”; heading “Anak Belajar Sendiri, Ibu Bapa Tenang.”; full paragraph beginning “Platform pembelajaran lengkap untuk Tahun 1 hingga Tingkatan 5.”; registration CTA “Langgan Sekarang →”; “100K+ Pelajar” and “Akses 24/7” trust pills. Two responsive banner images.
2. Four product cards: heading “Empat pengalaman pembelajaran dalam satu ekosistem lengkap.”; HomeTutor Practice, Live, AI, Parent. Three bullets each, original images, and “Terokai …” CTAs. Practice bullets: Latih Tubi Interaktif; Assessment & Kuiz; Mastery Learning. Live: Live Teaching Class; Recorded Class; Tutor Interaction. AI: AI Tutor; AI Study Coach; AI Learning Assistant. Parent: Parent Dashboard; Learning Analytics; Progress Tracking.
3. “Bagaimana Pembelajaran Berfungsi?” six steps with original illustrations and description under each: Video Pembelajaran → Nota Interaktif → Latihan & Kuiz → Penilaian → Laporan Prestasi → Peningkatan Keyakinan.
4. Statistics: 1,500+ Video HD Interaktif; 80,000+ Bank Soalan Latihan; 120K+ Pengguna Aktif; 4.9/5 Rating Ibu Bapa. Source initial zeroes count upward once scrolled into view; live values confirmed in browser. Imported component shows final values immediately, including reduced motion.
5. “Kenapa Ibu Bapa Memilih HomeTutor?” Four image/description cards: Jimat Masa, Jimat Kos, Belajar Fleksibel, Pantau Prestasi.
6. “Dipercayai Oleh Ribuan Ibu Bapa” with three 5-star testimonials, exact source quotations, names, and parent labels: Puan Farah Liyana / Ibu Pelajar Tingkatan 3; En. Azman Hashim / Bapa Pelajar Tahun 6; Puan Siti Sarah / Ibu Pelajar Tingkatan 5.
7. “Terokai Pakej Hometutor”: four original grade-card PNGs linking to productA, productB, productC, productD. The shell maps them to level1, level2, level3, level4 product tabs.

## Assets

All 20 active Home PNGs downloaded byte-for-byte and copied into public/legacy-site/img/img_revised/. Manifest: home-assets.json. Total original images are around 31 MB. Original font downloaded to public/legacy-site/css/fonts/muli/Muli-Regular.ttf. Home JSX adds intrinsic dimensions and lazy loading on below-hero images without modifying the artwork. Browser confirmed all original source images load.

## Functionality and source defects

- No Home content API is needed. All seven main sections and claims are static source content.
- Only visible Home-specific animated behavior is CSS hover/floating decorations and the once-in-view count-up. home.js contains an older six-second slider targeting absent .sec-slider markup, so that interval has no effect on the current visible page.
- Recognition/KPM bar, recognition trust badge, WhatsApp widget, FAB and AI modal in home.html are COMMENTED OUT. Do not add them to the seven-section import.
- Despite these commented widgets, home.html executes toggle.addEventListener against a missing element. The old browser throws “Cannot read properties of null (reading 'addEventListener')”. A separate early Slick import causes “jQuery is not defined”. Neither broken script is ported.
- Four original product feature CTAs have href="#" and no actual click handlers. Imported component maps them to /products; text remains exact.
- Original enrollment CTA remains https://hometutor.com.my/index_portal.html?page=portal_modules/registration.
- Package links are /products?target=productA through productD in the import.

## Shared shell / APIs (root responsibility)

Old shell includes register notification bar, activation/login/teacher menu, desktop/mobile navigation, footer descriptive copy, About/Support links, © 2025 and legal/social links. An Internet Explorer browser warning exists in markup but is conditional.

The shell also contains an active owl-based “HT Bot” widget, distinct from the commented Home FAB. This widget offers open/close, desktop drag, preset grade quick-select, and sends user messages as POST JSON {message} to https://hometutor.com.my/chatbot_api.php. No chatbot API call was made during inspection. Login/session shell checks use /main_lp/prx/session.php and /main_lp/prx/process.php?f=main_user_details. These APIs do not supply any Home marketing content.

## Screenshot comparison

The user's old-site four-product, statistics and three-testimonial screenshots match live Home exactly, including all statistics and named quotations. The first supplied “Satu platform. Setiap potensi bersinar.” geometric hero belongs to v2 and does NOT match the old site's current hero. Old Home does not include tutor portraits, the new practice demo, or v2 internal-system screenshot reels.

## Implementation files and verification

- resources/js/Components/LegacyMarketing/LegacyHome.jsx
- resources/css/legacy-home.css
- Top wrapper .legacy-home; internal ht- selectors renamed lh- to avoid v2 CSS clashes.
- Original source scripts/comments/shared empty header stripped. No external source scripts execute.
- Source parity check: every active text token matches after normalizing counters to their final rendered values; 7 sections, 20 images, 9 links. Evidence: home-parity.json.
- JSX transformed by esbuild and CSS parsed by PostCSS; no CSS rules leak outside .legacy-home.
- Original live rendered DOM/text/image/network/error observations: home-rendered.json.
- Original full-page screenshot: home-live-desktop.png.
