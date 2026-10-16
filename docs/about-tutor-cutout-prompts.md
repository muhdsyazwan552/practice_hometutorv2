# Tutor silhouette extraction — 14 October 2026

Used the built-in image generation tool in background-extraction mode, once per selected original portrait. Source: the user-provided public tutor directory, locally preserved as `public/images/about-tutors/formal-01.webp` through `formal-05.webp`.

Identical prompt for each portrait:

> Use case: background-extraction. Edit target: the single supplied real tutor portrait. Remove ONLY the white background and return the same single tutor as a clean cutout with actual alpha transparency. Preserve the original face, expression, head covering or hair, exact pose, clothing, accessories, original 400 by 400 composition, scale and crop. Do not change identity, repaint the person, add objects, add shadows or add any background shapes. This output will provide only an alpha silhouette over the untouched original photograph on a website; do not invent missing body parts.

The website renders the untouched original photographs. Only generated alpha silhouettes are used as CSS masks. For efficiency, each mask is stored as a 400px alpha-only PNG (`formal-01-mask.png` through `formal-05-mask.png`, 108KB combined). Faces, clothing and expressions are original image pixels. CSS fades the waist-up crops, and each silhouette animates independently. No frames or background shapes are attached to the tutor portraits.

Saved masks:

- [formal-01-mask.png](/var/www/practice_hometutorv2/public/images/about-tutors/formal-01-mask.png)
- [formal-02-mask.png](/var/www/practice_hometutorv2/public/images/about-tutors/formal-02-mask.png)
- [formal-03-mask.png](/var/www/practice_hometutorv2/public/images/about-tutors/formal-03-mask.png)
- [formal-04-mask.png](/var/www/practice_hometutorv2/public/images/about-tutors/formal-04-mask.png)
- [formal-05-mask.png](/var/www/practice_hometutorv2/public/images/about-tutors/formal-05-mask.png)
