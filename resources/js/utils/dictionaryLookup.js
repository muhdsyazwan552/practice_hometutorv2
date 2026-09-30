// resources/js/utils/dictionaryLookup.js
//
// Free word lookups for the student kamus, from Wikimedia (CC BY-SA):
//   English word -> English Wiktionary (meaning) + English Wikipedia (explanation)
//   Malay word   -> Wikikamus Bahasa Melayu (maksud) + Wikipedia Bahasa Melayu (penerangan)
// The explanation is always in the same language as the word.

const SOURCES = {
  en: { wiktionary: 'https://en.wiktionary.org', wikipedia: 'https://en.wikipedia.org' },
  ms: { wiktionary: 'https://ms.wiktionary.org', wikipedia: 'https://ms.wikipedia.org' },
};

// Wikimedia content is HTML; read it as plain text (never inserted as HTML).
const plainText = (html = '') => new DOMParser().parseFromString(html, 'text/html').body.textContent.replace(/\s+/g, ' ').trim();

const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);

async function getJson(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  return response.json();
}

/** English meanings from English Wiktionary's definition API (English-language entries only). */
async function englishMeanings(word, signal) {
  const data = await getJson(`${SOURCES.en.wiktionary}/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`, signal);
  const entries = data?.en || [];
  return entries.slice(0, 3).map((entry) => ({
    partOfSpeech: entry.partOfSpeech,
    definitions: (entry.definitions || [])
      .map((definition) => plainText(definition.definition))
      .filter(Boolean)
      .slice(0, 3),
  })).filter((entry) => entry.definitions.length);
}

/**
 * Malay meanings from Wikikamus: the "Bahasa Melayu" section, one group per
 * word class heading (Kata nama, Kata kerja, ...).
 */
async function malayMeanings(word, signal) {
  const title = word.toLowerCase();
  const data = await getJson(`${SOURCES.ms.wiktionary}/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(title)}`, signal);
  const page = data && Object.values(data.query?.pages || {})[0];
  const text = page?.extract || '';
  const section = text.split(/\n== /).find((part) => part.startsWith('Bahasa Melayu'));
  if (!section) return [];

  const groups = [];
  let current = null;
  section.split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    const heading = line.match(/^=+\s*(.+?)\s*=+$/);
    if (heading) {
      // Only word-class sections hold meanings; skip Sebutan, Etimologi, Terjemahan, ...
      current = /^kata\b/i.test(heading[1]) ? { partOfSpeech: heading[1], definitions: [] } : null;
      if (current) groups.push(current);
      return;
    }
    // Skip blanks and the headword line ("rumah (jamak rumah-rumah)").
    if (!current || !line || line.toLowerCase().startsWith(title)) return;
    if (current.definitions.length < 3) current.definitions.push(line);
  });
  return groups.filter((group) => group.definitions.length).slice(0, 3);
}

/** A short explanation from Wikipedia in the chosen language, or null. */
async function explanation(word, language, signal) {
  const base = SOURCES[language].wikipedia;
  // The article must be about the word itself: "Mol (unit)" is fine for "mol",
  // but "Kecerunan elektrokimia" is not for "kecerunan", nor is a redirect from
  // "photosynthesis" to the Malay "Fotosintesis" (an English word explained in Malay).
  const aboutWord = (title) => title.replace(/\s*\(.*\)$/, '').toLowerCase() === word.toLowerCase();
  const summary = async (title) => {
    const data = await getJson(`${base}/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`, signal);
    return data && data.type === 'standard' && data.extract && aboutWord(data.title) ? data : null;
  };

  let page = await summary(capitalise(word));
  if (!page) {
    // No exact article: take the top search hit if it is about the word.
    const search = await getJson(`${base}/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=${encodeURIComponent(word)}`, signal);
    const hit = search?.query?.search?.[0]?.title;
    if (hit && aboutWord(hit)) page = await summary(hit);
  }
  if (!page) return null;

  const extract = page.extract.length > 600 ? `${page.extract.slice(0, 600).replace(/\s+\S*$/, '')}…` : page.extract;
  return { title: page.title, text: extract, url: page.content_urls?.desktop?.page };
}

/** Look a word up in one language. Returns null when nothing was found. */
export async function lookupInLanguage(word, language, signal) {
  const [meanings, about] = await Promise.all([
    (language === 'en' ? englishMeanings : malayMeanings)(word, signal).catch((error) => {
      if (error.name === 'AbortError') throw error;
      return [];
    }),
    explanation(word, language, signal).catch((error) => {
      if (error.name === 'AbortError') throw error;
      return null;
    }),
  ]);

  if (!meanings.length && !about) return null;
  return {
    word,
    language,
    meanings,
    about,
    dictionaryUrl: meanings.length ? `${SOURCES[language].wiktionary}/wiki/${encodeURIComponent(word.toLowerCase())}` : null,
  };
}

/**
 * Look a word up in the preferred language first; if it is not a word in that
 * language (e.g. "fotosintesis" searched as English), try the other one.
 */
export async function lookupWord(word, preferred = 'ms', signal) {
  const clean = word.trim();
  if (!clean) return null;
  const other = preferred === 'en' ? 'ms' : 'en';
  return (await lookupInLanguage(clean, preferred, signal)) || lookupInLanguage(clean, other, signal);
}
