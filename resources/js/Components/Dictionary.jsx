import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/Contexts/LanguageContext';
import { lookupWord } from '@/utils/dictionaryLookup';

const COPY = {
  ms: {
    placeholder: 'Taip perkataan…',
    search: 'Cari',
    searching: 'Mencari…',
    meaning: 'Maksud',
    about: 'Penerangan',
    readMore: 'Baca lagi',
    notFound: 'Tiada maksud dijumpai. Semak ejaan atau cuba bahasa lain.',
    offline: 'Kamus tidak dapat dihubungi. Semak sambungan internet dan cuba lagi.',
    foundIn: { ms: 'Dijumpai dalam Bahasa Melayu', en: 'Dijumpai dalam Bahasa Inggeris' },
    recent: 'Carian terkini',
    hint: 'Perkataan Inggeris diterangkan dalam Bahasa Inggeris, perkataan Melayu dalam Bahasa Melayu.',
    source: 'Sumber',
  },
  en: {
    placeholder: 'Type a word…',
    search: 'Search',
    searching: 'Searching…',
    meaning: 'Meaning',
    about: 'Explanation',
    readMore: 'Read more',
    notFound: 'No meaning found. Check the spelling or try the other language.',
    offline: 'The dictionary could not be reached. Check your internet connection and try again.',
    foundIn: { ms: 'Found in Malay', en: 'Found in English' },
    recent: 'Recent searches',
    hint: 'English words are explained in English, Malay words in Malay.',
    source: 'Source',
  },
};

const LANGUAGES = [['ms', 'BM'], ['en', 'English']];
const HISTORY_KEY = 'dictionary-history';

const readHistory = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((item) => typeof item?.word === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
};

/**
 * Student kamus: explains a word in its own language (English -> English,
 * Malay -> Malay) using free Wikimedia sources. See utils/dictionaryLookup.js.
 */
export default function Dictionary() {
  const { locale } = useLanguage();
  const text = COPY[locale === 'en' ? 'en' : 'ms'];
  const [language, setLanguage] = useState(locale === 'en' ? 'en' : 'ms');
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ status: 'idle' }); // idle | loading | found | notFound | error
  const [history, setHistory] = useState(readHistory);
  const request = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    return () => request.current?.abort();
  }, []);

  const remember = (word, foundLanguage) => {
    const next = [{ word, language: foundLanguage }, ...history.filter((item) => item.word.toLowerCase() !== word.toLowerCase())].slice(0, 8);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // History is a convenience only.
    }
  };

  const search = async (word = query, preferred = language) => {
    const clean = word.trim();
    if (!clean) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setQuery(clean);
    setState({ status: 'loading' });

    try {
      const result = await lookupWord(clean, preferred, controller.signal);
      if (controller.signal.aborted) return;
      if (!result) {
        setState({ status: 'notFound' });
        return;
      }
      setState({ status: 'found', result });
      remember(clean, result.language);
    } catch (error) {
      if (error.name !== 'AbortError') setState({ status: 'error' });
    }
  };

  const changeLanguage = (next) => {
    setLanguage(next);
    if (query.trim() && state.status !== 'idle') search(query, next);
  };

  const result = state.result;

  return (
    <div className="w-[min(20rem,calc(100vw-1rem))] bg-white p-3 text-slate-800">
      <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-0.5">
        {LANGUAGES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => changeLanguage(key)}
            className={`h-7 rounded-md text-xs font-semibold transition ${language === key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        className="flex gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={text.placeholder}
          maxLength={60}
          autoComplete="off"
          className="h-9 min-w-0 flex-1 rounded-lg border-0 bg-slate-100 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button type="submit" disabled={state.status === 'loading'} className="h-9 flex-none rounded-lg bg-amber-500 px-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60">
          {state.status === 'loading' ? text.searching : text.search}
        </button>
      </form>

      <div className="mt-2 max-h-[min(22rem,calc(100dvh-14rem))] overflow-y-auto">
        {state.status === 'idle' && <p className="py-2 text-xs leading-5 text-slate-500">{text.hint}</p>}

        {state.status === 'loading' && (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />
            {text.searching}
          </div>
        )}

        {state.status === 'notFound' && <p className="py-3 text-sm text-slate-600">{text.notFound}</p>}
        {state.status === 'error' && <p className="py-3 text-sm text-rose-700">{text.offline}</p>}

        {state.status === 'found' && result && (
          <article className="space-y-3 py-1" lang={result.language}>
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-lg font-bold">{result.word}</h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                {result.language === 'ms' ? 'Bahasa Melayu' : 'English'}
              </span>
            </div>
            {result.language !== language && <p className="-mt-2 text-[11px] text-slate-500">{text.foundIn[result.language]}</p>}

            {result.meanings.length > 0 && (
              <section>
                <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">{COPY[result.language].meaning}</h4>
                <div className="space-y-2">
                  {result.meanings.map((group, index) => (
                    <div key={index}>
                      <p className="text-xs font-semibold italic text-slate-500">{group.partOfSpeech}</p>
                      <ol className="ml-4 list-decimal space-y-1 text-sm leading-5">
                        {group.definitions.map((definition, definitionIndex) => <li key={definitionIndex}>{definition}</li>)}
                      </ol>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.about && (
              <section>
                <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">{COPY[result.language].about}: {result.about.title}</h4>
                <p className="text-sm leading-5 text-slate-700">{result.about.text}</p>
                {result.about.url && (
                  <a href={result.about.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-amber-700 hover:underline">
                    {COPY[result.language].readMore} ↗
                  </a>
                )}
              </section>
            )}

            {/* Wikimedia content is CC BY-SA: credit the source. */}
            <p className="border-t border-slate-100 pt-2 text-[10px] leading-4 text-slate-400">
              {text.source}:{' '}
              {result.dictionaryUrl && (
                <a href={result.dictionaryUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                  {result.language === 'ms' ? 'Wikikamus' : 'Wiktionary'}
                </a>
              )}
              {result.dictionaryUrl && result.about?.url && ', '}
              {result.about?.url && (
                <a href={result.about.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Wikipedia</a>
              )}
              {' '}(CC BY-SA)
            </p>
          </article>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{text.recent}</p>
          <div className="flex flex-wrap gap-1">
            {history.map((item) => (
              <button
                key={item.word}
                type="button"
                onClick={() => search(item.word, item.language || language)}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
              >
                {item.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
