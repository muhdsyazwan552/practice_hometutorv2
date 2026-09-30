const themes = {
  // The free theme every student owns: no scene picture and no animation, just
  // a clean indigo-to-cyan gradient look.
  default: { page: '#f4f6fd', pageGradient: 'linear-gradient(160deg, #eef2ff 0%, #f0f9ff 55%, #fdf4ff 100%)', hero: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', accent: '#4f46e5', ink: '#1e1b4b', card: '#ffffff', background: null },
  'ocean-blue': { page: '#eaf9ff', hero: 'linear-gradient(135deg, #027fc4, #61d0ec)', accent: '#0788c9', ink: '#073f72', card: '#ffffff', background: '/images/themes/ocean-blue.jpg' },
  'space-explorer': { page: '#111238', hero: 'linear-gradient(135deg, #111a4a, #7137b8)', accent: '#8d4cff', ink: '#f7f3ff', card: '#f7f2ff', background: '/images/themes/space-explorer.jpg' },
  'jungle-adventure': { page: '#edf9ec', hero: 'linear-gradient(135deg, #075d47, #4d9f28)', accent: '#188b50', ink: '#083e32', card: '#fffef4', background: '/images/themes/jungle-adventure.jpg' },
  // Metallic gold: brushed dark-to-light gold for the hero, a deep gold accent
  // that stays readable as text, and a muted champagne page (not bright yellow).
  'gold-champion': { page: '#efe9dc', hero: 'linear-gradient(135deg, #3f2d06 0%, #7d5e16 35%, #b08a2a 55%, #7d5e16 75%, #3f2d06 100%)', accent: '#8f6b12', ink: '#3d2c05', card: '#fffdf8', background: '/images/themes/gold-champion.jpg' },
  'candy-garden': { page: '#fff2fa', hero: 'linear-gradient(135deg, #ba3a82, #8e57cd)', accent: '#c53f91', ink: '#6e2156', card: '#fffaff', background: '/images/themes/candy-garden.jpg' },
  'sky-kingdom': { page: '#edf9ff', hero: 'linear-gradient(135deg, #1478c8, #80d7f3)', accent: '#258dcc', ink: '#124c7b', card: '#ffffff', background: '/images/themes/sky-kingdom.jpg' },
  'brick-builders': { page: '#fff7df', hero: 'linear-gradient(135deg, #e33436, #f1ae18)', accent: '#dc3d36', ink: '#173e79', card: '#fffdf6', background: '/images/themes/brick-builders.jpg' },
  'robo-lab': { page: '#0b1a32', hero: 'linear-gradient(135deg, #102f4b, #0a929d)', accent: '#00aeca', ink: '#e8fbff', card: '#f2fdff', background: '/images/themes/robo-lab.png' },
  'dino-discovery': { page: '#f4fae9', hero: 'linear-gradient(135deg, #2f784e, #e69c30)', accent: '#317a51', ink: '#24462f', card: '#fffdf1', background: '/images/themes/dino-discovery.jpg' },
  'study-campus': { page: '#f3f8ff', hero: 'linear-gradient(135deg, #1d6fc6, #7cb3ec)', accent: '#286fc1', ink: '#183f72', card: '#ffffff', background: '/images/themes/study-campus.jpg' },
  'cat-club': { page: '#fff4ec', hero: 'linear-gradient(135deg, #bc5e61, #f0a660)', accent: '#c76259', ink: '#663c4d', card: '#fffdf9', background: '/images/themes/cat-club.jpg' },
};

// Themes with a real illustrated mascot under public/images/characters.
// Any other theme falls back to a floating motif shape instead.
export const THEME_CHARACTERS = {
  'cat-club': '/images/characters/cat-club.png',
  'sky-kingdom': '/images/characters/sky-kingdom.png',
  'dino-discovery': '/images/characters/dino-discovery.png',
  'brick-builders': '/images/characters/brick-builders.png',
  'robo-lab': '/images/characters/robo-lab.png',
  'study-campus': '/images/characters/study-campus.png',
};

export const MOTIFS = ['star', 'leaf', 'bubble', 'gem', 'block', 'paw', 'spark'];

export function themeMotifShape(slug = '') {
  if (/space|sky|campus/.test(slug)) return 'star';
  if (/jungle|dino/.test(slug)) return 'leaf';
  if (/ocean/.test(slug)) return 'bubble';
  if (/candy|gold/.test(slug)) return 'gem';
  if (/brick/.test(slug)) return 'block';
  if (/cat/.test(slug)) return 'paw';
  if (slug === 'default') return 'gem';
  return 'spark';
}

/**
 * The bundled scene picture for a theme; the DB preview_image_path points at files that are not shipped.
 * Null for a theme without a picture (Default), which previews as its gradient instead.
 */
export function themeSceneImage(theme) {
  return (themes[theme?.slug] || themes['ocean-blue']).background;
}

/** CSS background for a theme preview: its scene picture, or its hero gradient when it has none. */
export function themePreviewBackground(theme) {
  const palette = themes[theme?.slug] || themes['ocean-blue'];
  return palette.background ? `url(${palette.background}) center / cover` : palette.hero;
}

/**
 * Colours for the dashboard shell. `custom` is the student's Theme Studio
 * choice (users.theme_customization): an accent override and, optionally,
 * their own two background colours instead of the scene picture.
 */
export function resolveDashboardTheme(theme, custom = null) {
  const palette = { ...(themes[theme?.slug] || themes['ocean-blue']) };
  if (!custom) return palette;

  if (custom.accent) palette.accent = custom.accent;
  if (custom.background === 'colour' && custom.background_colours?.length === 2) {
    const [from, to] = custom.background_colours;
    palette.background = null;
    palette.page = from;
    palette.pageGradient = `linear-gradient(160deg, ${from}, ${to})`;
  }
  return palette;
}

/**
 * How the "Your learning space" hero card looks: a custom design, another
 * theme's look, or the dashboard theme's look.
 */
export function resolveLearningCard({ dashboardTheme, cardTheme, custom }) {
  const dashboardPalette = resolveDashboardTheme(dashboardTheme, custom);
  const design = custom?.card;

  if (design?.custom) {
    const [from, to] = design.colours;
    return {
      background: `linear-gradient(135deg, ${from}, ${to})`,
      glass: false,
      character: design.character ? THEME_CHARACTERS[design.character] : null,
      motif: design.motif && design.motif !== 'auto' ? design.motif : themeMotifShape(dashboardTheme?.slug),
      badge: design.badge,
    };
  }

  const theme = cardTheme || dashboardTheme;
  const followsDashboard = !cardTheme || cardTheme.id === dashboardTheme?.id;
  const palette = followsDashboard ? dashboardPalette : resolveDashboardTheme(theme);
  return {
    // Over a scene picture the card is frosted glass tinted with its theme colours.
    background: dashboardPalette.background
      ? `linear-gradient(135deg, color-mix(in srgb, ${palette.accent} 68%, transparent), color-mix(in srgb, ${palette.ink} 55%, transparent))`
      : palette.hero,
    glass: Boolean(dashboardPalette.background),
    character: THEME_CHARACTERS[theme?.slug] || null,
    motif: themeMotifShape(theme?.slug),
    badge: null,
  };
}

/** Background style for the page shell behind the dashboard. */
export function shellBackground(palette) {
  if (palette.background) {
    return {
      backgroundImage: `url(${palette.background})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      backgroundColor: palette.page,
    };
  }
  return palette.pageGradient
    ? { backgroundImage: palette.pageGradient, backgroundAttachment: 'fixed', backgroundColor: palette.page }
    : { backgroundColor: palette.page };
}
