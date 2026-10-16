# Landing page content sources

Reviewed 13 October 2026 for the Practice v2 landing page.

- HomeTutor public site: https://hometutor.com.my/
- Products: https://hometutor.com.my/?page=portal_modules/products
- About / independent learning approach: https://hometutor.com.my/?page=portal_modules/about
- FAQ / support address: https://hometutor.com.my/?page=portal_modules/faq
- Those pages load their content from `/portal_modules/products.html`, `/portal_modules/about.html` and `/portal_modules/faq.html`.
- The user's supplied product reference provides the Practice, Live, AI and Parent grouping. Live and AI link to the existing product site and are not represented as included features of a Practice subscription.

## Tutor portraits

The user supplied https://xoom.xcelearn.com.my/view-tutors as the source for tutor profiles and images. The page's public `/tutor/list` request, with `filters[visibility]=2`, supplied the names, headlines, public profile identifiers and avatar URLs. Four original 400px portraits are stored in `public/images/landing-practice/tutors/`; their public profile links and copy are in `resources/js/Components/PracticeLanding/tutors.json`.

- Afrina Maryam: https://xoom.xcelearn.com.my/user/overview/9510611038
- Aleeya Thahirah: https://xoom.xcelearn.com.my/user/overview/6438739410
- Amirah Aina Azlan: https://xoom.xcelearn.com.my/user/overview/8931778722
- Aqida Adawiyah: https://xoom.xcelearn.com.my/user/overview/5644904284

Photos are original source files, unmodified. The page attributes profiles to Xcelearn Xoom and directs visitors there for current teaching information; it does not invent qualifications, availability or ratings.

## Adaptation

The hero is a self-contained illustrative maths demo, not a screenshot or a saved student session. Product illustrations do not represent real student results. FAQs reflect the v2 parent registration and learning flow. Historical activation-code instructions, retired exam labels, inconsistent user/question totals, prices, ratings and unverified testimonials have not been carried into the new sections. No changes to payment or refund policies are part of this update.

## Product screenshot gallery

The user supplied four original screenshots on 13 October 2026: student progress/calendar, Bahasa Melayu subject workspace, Practice Arena/mastery, and the HomeTutor Play game library. They are stored under `public/images/landing-practice/screens/` as lossless WebP images. All decoded pixels were compared with the supplied PNGs and verified identical. The moving cards use CSS clipping for composition; the image viewer displays each full screenshot. These are example views of the system, not real-time activity or aggregate performance claims.

The gallery provides pause/resume, pause on pointer hover or keyboard focus, four fixed image selectors, and a dialog with Escape/previous/next controls. Reduced-motion preferences show stationary, scrollable screenshot rows.
