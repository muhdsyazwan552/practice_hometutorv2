import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { ArrowPathIcon, CheckIcon, PaintBrushIcon, PhotoIcon, RectangleStackIcon, SparklesIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/Contexts/LanguageContext';
import ThemeMotif from '@/Components/ThemeMotif';
import { MOTIFS, THEME_CHARACTERS, resolveDashboardTheme, resolveLearningCard, shellBackground, themePreviewBackground, themeSceneImage } from '@/utils/dashboardTheme';

const ACCENTS = ['#0788c9', '#8d4cff', '#188b50', '#af7000', '#c53f91', '#dc3d36', '#00aeca', '#f97316'];
const BACKGROUND_PRESETS = [['#dff4ff', '#fef6e4'], ['#fde2f3', '#e0e7ff'], ['#dcfce7', '#fef9c3'], ['#1e1b4b', '#0f766e'], ['#fff1e6', '#fde68a'], ['#0b1a32', '#312e81']];
const CARD_PRESETS = [['#0788c9', '#7137b8'], ['#f97316', '#db2777'], ['#059669', '#0ea5e9'], ['#7c3aed', '#ec4899'], ['#1e3a8a', '#0891b2'], ['#b45309', '#dc2626']];

const copy = {
  en: {
    eyebrow: 'Personalise your space', title: 'Theme Studio', intro: 'Pick a scene, then make the colours and your learning-space card your own.',
    preview: 'Live preview', previewNote: 'This is how your dashboard will look.',
    sceneTitle: 'Dashboard theme', sceneHelp: 'This sets the scene and mood of your dashboard.', selected: 'Selected',
    customTitle: 'Customise the theme', accent: 'Accent colour', accentHelp: 'Used for buttons, highlights and progress.', themeDefault: 'Theme colour',
    background: 'Background', useScene: 'Scene picture', useColours: 'My colours', from: 'Top', to: 'Bottom',
    cardTitle: 'Your learning-space card', cardHelp: 'The big welcome card at the top of your dashboard.',
    follow: 'Follow dashboard', followHelp: 'Same look as your dashboard theme.', otherTheme: 'Another theme', otherThemeHelp: 'Use a different theme’s look.',
    design: 'Design my own', designHelp: 'Your colours, character and label.',
    cardColours: 'Card colours', character: 'Character', none: 'None', motif: 'Floating shapes', auto: 'Auto', badge: 'Card label', badgeHelp: 'Up to 30 characters.',
    badgeDefault: 'Your learning space', greeting: 'Good morning', reset: 'Reset to theme defaults', save: 'Save theme', saving: 'Saving…', saved: 'Saved!',
    fallbackDescription: 'A fresh look for your learning space.', progress: 'Learning progress', points: 'Total points',
  },
  ms: {
    eyebrow: 'Peribadikan ruang anda', title: 'Studio Tema', intro: 'Pilih pemandangan, kemudian jadikan warna dan kad ruang pembelajaran milik anda.',
    preview: 'Pratonton langsung', previewNote: 'Beginilah rupa papan pemuka anda.',
    sceneTitle: 'Tema papan pemuka', sceneHelp: 'Ini menetapkan pemandangan dan suasana papan pemuka anda.', selected: 'Dipilih',
    customTitle: 'Ubah suai tema', accent: 'Warna aksen', accentHelp: 'Untuk butang, sorotan dan kemajuan.', themeDefault: 'Warna tema',
    background: 'Latar belakang', useScene: 'Gambar pemandangan', useColours: 'Warna saya', from: 'Atas', to: 'Bawah',
    cardTitle: 'Kad ruang pembelajaran anda', cardHelp: 'Kad aluan besar di bahagian atas papan pemuka.',
    follow: 'Ikut papan pemuka', followHelp: 'Rupa sama seperti tema papan pemuka.', otherTheme: 'Tema lain', otherThemeHelp: 'Guna rupa tema yang berbeza.',
    design: 'Reka sendiri', designHelp: 'Warna, watak dan label anda.',
    cardColours: 'Warna kad', character: 'Watak', none: 'Tiada', motif: 'Bentuk terapung', auto: 'Auto', badge: 'Label kad', badgeHelp: 'Maksimum 30 aksara.',
    badgeDefault: 'Ruang pembelajaran anda', greeting: 'Selamat pagi', reset: 'Set semula ke asal tema', save: 'Simpan tema', saving: 'Menyimpan…', saved: 'Disimpan!',
    fallbackDescription: 'Rupa baharu untuk ruang pembelajaran anda.', progress: 'Kemajuan', points: 'Jumlah mata',
  },
};

const DEFAULT_CUSTOM = {
  accent: null,
  background: 'scene',
  background_colours: ['#dff4ff', '#fef6e4'],
  card: { custom: false, colours: ['#0788c9', '#7137b8'], character: null, motif: 'auto', badge: null },
};

function Panel({ icon: Icon, title, help, children }) {
  return (
    <div className="border-t border-slate-100 pt-7 first:border-0 first:pt-0">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-2xl bg-sky-50 p-2.5 text-sky-600"><Icon className="h-5 w-5" /></span>
        <div><h3 className="font-extrabold text-slate-900">{title}</h3>{help && <p className="mt-1 text-sm text-slate-500">{help}</p>}</div>
      </div>
      {children}
    </div>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button key={option.value} type="button" onClick={() => onChange(option.value)} aria-pressed={active} className={`rounded-2xl border-2 p-3 text-left transition ${active ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 bg-white hover:border-sky-300'}`}>
            <span className="block text-sm font-extrabold text-slate-800">{option.label}</span>
            {option.help && <span className="mt-0.5 block text-xs text-slate-500">{option.help}</span>}
          </button>
        );
      })}
    </div>
  );
}

function ColourPair({ value, onChange, presets, labels }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((pair) => {
          const active = pair[0] === value[0] && pair[1] === value[1];
          return <button key={pair.join()} type="button" onClick={() => onChange(pair)} aria-label={pair.join(' → ')} aria-pressed={active} className={`h-10 w-14 rounded-xl border-2 shadow-sm transition ${active ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-white hover:scale-105'}`} style={{ background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})` }} />;
        })}
      </div>
      <div className="flex flex-wrap gap-4">
        {value.map((colour, index) => (
          <label key={index} className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input type="color" value={colour} onChange={(event) => onChange(value.map((c, i) => (i === index ? event.target.value : c)))} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5" />
            {labels[index]} <span className="font-mono font-normal text-slate-400">{colour}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ThemeTile({ theme, active, onSelect, selectedLabel, fallbackDescription }) {
  const character = THEME_CHARACTERS[theme.slug];
  return (
    <button type="button" onClick={() => onSelect(theme.id)} aria-pressed={active} className={`group relative overflow-hidden rounded-2xl border-2 bg-white text-left transition ${active ? 'border-cyan-400 ring-4 ring-cyan-100' : 'border-slate-200 hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg'}`}>
      <div className="relative h-28 overflow-hidden bg-slate-100">
        {themeSceneImage(theme)
          ? <img src={themeSceneImage(theme)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <div className="h-full w-full" style={{ background: themePreviewBackground(theme) }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
        {character && <img src={character} alt="" className="absolute bottom-0 right-2 h-[6.5rem] max-w-[58%] object-contain object-bottom drop-shadow-lg transition duration-300 group-hover:-translate-y-1" />}
        {active && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#061a3a] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm"><CheckIcon className="h-3.5 w-3.5 text-cyan-200" /> {selectedLabel}</span>}
      </div>
      <div className="px-3.5 py-3">
        <p className="truncate text-sm font-extrabold text-slate-800">{theme.name}</p>
        <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{theme.description || fallbackDescription}</p>
      </div>
    </button>
  );
}

function Preview({ dashboardTheme, cardTheme, custom, name, text }) {
  const palette = resolveDashboardTheme(dashboardTheme, custom);
  const card = resolveLearningCard({ dashboardTheme, cardTheme, custom });
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-lg">
      <div className="flex items-center gap-1.5 bg-[#061a3a] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-rose-400" /><span className="h-2 w-2 rounded-full bg-amber-300" /><span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="ml-2 h-1.5 w-16 rounded-full bg-white/20" /><span className="ml-auto h-1.5 w-8 rounded-full" style={{ background: palette.accent }} />
      </div>
      <div className="space-y-3 p-3.5" style={{ ...shellBackground(palette), backgroundAttachment: 'scroll' }}>
        <div className="relative overflow-hidden rounded-2xl px-4 py-5 text-white shadow-md" style={{ background: card.background, ...(card.glass ? { backdropFilter: 'blur(10px)' } : {}) }}>
          {card.character
            ? <img src={card.character} alt="" className="absolute -bottom-1 right-1 h-[88%] max-h-28 object-contain drop-shadow-lg" />
            : [['14%', '62%', 18], ['62%', '74%', 13], ['30%', '84%', 11]].map(([top, left, size]) => <span key={left} className="absolute" style={{ top, left, width: size, height: size }}><ThemeMotif shape={card.motif} /></span>)}
          <span className="relative inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[10px] font-medium"><SparklesIcon className="h-3 w-3" />{card.badge || text.badgeDefault}</span>
          <p className="relative mt-2 max-w-[65%] text-lg font-semibold leading-tight">{text.greeting}, {name}.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[[text.progress, '68%'], [text.points, '1,250']].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/60 bg-white/80 p-2.5 backdrop-blur">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-0.5 text-base font-semibold text-slate-900">{value}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-2/3 rounded-full" style={{ background: palette.accent }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ThemeSettingsForm({ themes = {} }) {
  const { locale } = useLanguage();
  const text = copy[locale] || copy.en;
  const name = (usePage().props.auth?.user?.name || 'Learner').split(' ')[0];
  const available = themes.available || [];
  const characters = themes.characters || [];
  const initial = useMemo(() => {
    const dashboard = themes.active_dashboard_theme_id || available[0]?.id || '';
    const custom = { ...DEFAULT_CUSTOM, ...(themes.customization || {}), card: { ...DEFAULT_CUSTOM.card, ...(themes.customization?.card || {}) } };
    return { dashboard_theme_id: dashboard, learning_space_card_theme_id: themes.learning_space_card_theme_id || dashboard, customization: custom };
  }, [themes]);
  const { data, setData, patch, processing, recentlySuccessful, errors } = useForm(initial);

  useEffect(() => setData(initial), [initial]);

  const custom = data.customization;
  const cardMode = custom.card.custom ? 'custom' : data.learning_space_card_theme_id === data.dashboard_theme_id ? 'follow' : 'theme';
  const dashboardTheme = available.find((theme) => theme.id === data.dashboard_theme_id);
  const cardTheme = available.find((theme) => theme.id === data.learning_space_card_theme_id);
  if (!available.length) return null;

  const setCustom = (change) => setData('customization', { ...custom, ...change });
  const setCard = (change) => setCustom({ card: { ...custom.card, ...change } });

  const selectDashboardTheme = (id) => setData((current) => ({
    ...current,
    dashboard_theme_id: id,
    // A card that follows the dashboard keeps following it.
    learning_space_card_theme_id: cardMode === 'follow' ? id : current.learning_space_card_theme_id,
  }));
  const selectCardMode = (mode) => setData((current) => {
    const card = { ...current.customization.card, custom: mode === 'custom' };
    const otherTheme = available.find((theme) => theme.id !== current.dashboard_theme_id)?.id ?? current.dashboard_theme_id;
    return {
      ...current,
      customization: { ...current.customization, card },
      learning_space_card_theme_id: mode === 'follow' || mode === 'custom' ? current.dashboard_theme_id
        : current.learning_space_card_theme_id !== current.dashboard_theme_id ? current.learning_space_card_theme_id : otherTheme,
    };
  });
  const reset = () => setData((current) => ({ ...current, learning_space_card_theme_id: current.dashboard_theme_id, customization: structuredClone(DEFAULT_CUSTOM) }));
  const save = () => patch(route('profile.themes.update'), { preserveScroll: true });

  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-[#061a3a] px-5 py-6 text-white sm:px-7">
        {dashboardTheme && (themeSceneImage(dashboardTheme)
          ? <img src={themeSceneImage(dashboardTheme)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          : <div className="absolute inset-0 opacity-40" style={{ background: themePreviewBackground(dashboardTheme) }} />)}
        <div className="absolute inset-0 bg-gradient-to-r from-[#061a3a] via-[#061a3a]/90 to-[#061a3a]/50" />
        <div className="relative flex items-start gap-3"><span className="rounded-2xl bg-white/10 p-2.5 text-cyan-200 ring-1 ring-white/15"><PaintBrushIcon className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">{text.eyebrow}</p><h2 className="mt-1 text-xl font-extrabold">{text.title}</h2><p className="mt-1 text-sm text-slate-300">{text.intro}</p></div></div>
      </div>

      <div className="grid gap-7 p-5 sm:p-7 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        <aside className="2xl:order-2">
          <div className="2xl:sticky 2xl:top-24">
            <p className="text-sm font-extrabold text-slate-900">{text.preview}</p>
            <p className="mb-3 text-xs text-slate-500">{text.previewNote}</p>
            <Preview dashboardTheme={dashboardTheme} cardTheme={cardMode === 'theme' ? cardTheme : null} custom={custom} name={name} text={text} />
          </div>
        </aside>

        <div className="space-y-7 2xl:order-1">
          <Panel icon={PhotoIcon} title={text.sceneTitle} help={text.sceneHelp}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{available.map((theme) => <ThemeTile key={`dashboard-${theme.id}`} theme={theme} active={data.dashboard_theme_id === theme.id} onSelect={selectDashboardTheme} selectedLabel={text.selected} fallbackDescription={text.fallbackDescription} />)}</div>
          </Panel>

          <Panel icon={SwatchIcon} title={text.customTitle}>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-800">{text.accent}</p>
                <p className="mb-2 text-xs text-slate-500">{text.accentHelp}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setCustom({ accent: null })} aria-pressed={!custom.accent} className={`rounded-xl border-2 px-3 py-2 text-xs font-bold ${!custom.accent ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-600 hover:border-sky-300'}`}>{text.themeDefault}</button>
                  {ACCENTS.map((colour) => <button key={colour} type="button" onClick={() => setCustom({ accent: colour })} aria-label={colour} aria-pressed={custom.accent === colour} className={`h-9 w-9 rounded-full border-2 shadow-sm transition ${custom.accent === colour ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-300' : 'border-white hover:scale-110'}`} style={{ background: colour }} />)}
                  <input type="color" value={custom.accent || resolveDashboardTheme(dashboardTheme).accent} onChange={(event) => setCustom({ accent: event.target.value })} aria-label={text.accent} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-800">{text.background}</p>
                <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-1">
                  {[['scene', text.useScene], ['colour', text.useColours]].map(([value, label]) => <button key={value} type="button" onClick={() => setCustom({ background: value })} aria-pressed={custom.background === value} className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${custom.background === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}
                </div>
                {custom.background === 'colour' && <ColourPair value={custom.background_colours} onChange={(pair) => setCustom({ background_colours: pair })} presets={BACKGROUND_PRESETS} labels={[text.from, text.to]} />}
              </div>
            </div>
          </Panel>

          <Panel icon={RectangleStackIcon} title={text.cardTitle} help={text.cardHelp}>
            <Segmented value={cardMode} onChange={selectCardMode} options={[
              { value: 'follow', label: text.follow, help: text.followHelp },
              { value: 'theme', label: text.otherTheme, help: text.otherThemeHelp },
              { value: 'custom', label: text.design, help: text.designHelp },
            ]} />

            {cardMode === 'theme' && <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{available.map((theme) => <ThemeTile key={`card-${theme.id}`} theme={theme} active={data.learning_space_card_theme_id === theme.id} onSelect={(id) => setData('learning_space_card_theme_id', id)} selectedLabel={text.selected} fallbackDescription={text.fallbackDescription} />)}</div>}

            {cardMode === 'custom' && (
              <div className="mt-5 space-y-6 rounded-2xl bg-slate-50 p-4 sm:p-5">
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-800">{text.cardColours}</p>
                  <ColourPair value={custom.card.colours} onChange={(pair) => setCard({ colours: pair })} presets={CARD_PRESETS} labels={['1', '2']} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-slate-800">{text.character}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setCard({ character: null })} aria-pressed={!custom.card.character} className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 bg-white text-xs font-bold ${!custom.card.character ? 'border-cyan-500 text-cyan-800' : 'border-slate-200 text-slate-500 hover:border-sky-300'}`}>{text.none}</button>
                    {characters.map((slug) => <button key={slug} type="button" onClick={() => setCard({ character: slug })} aria-pressed={custom.card.character === slug} title={available.find((theme) => theme.slug === slug)?.name} className={`h-16 w-16 overflow-hidden rounded-2xl border-2 p-1 ${custom.card.character === slug ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-sky-300'}`}><img src={THEME_CHARACTERS[slug]} alt="" className="h-full w-full object-contain" /></button>)}
                  </div>
                </div>
                {!custom.card.character && (
                  <div>
                    <p className="mb-2 text-sm font-bold text-slate-800">{text.motif}</p>
                    <div className="flex flex-wrap gap-2">
                      {['auto', ...MOTIFS].map((shape) => <button key={shape} type="button" onClick={() => setCard({ motif: shape })} aria-pressed={custom.card.motif === shape} aria-label={shape} className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-[10px] font-bold ${custom.card.motif === shape ? 'border-cyan-500' : 'border-transparent hover:border-sky-300'}`} style={{ background: `linear-gradient(135deg, ${custom.card.colours[0]}, ${custom.card.colours[1]})` }}>{shape === 'auto' ? <span className="text-white">{text.auto}</span> : <span className="h-5 w-5"><ThemeMotif shape={shape} fillOpacity={0.9} /></span>}</button>)}
                    </div>
                  </div>
                )}
                <label className="block">
                  <span className="text-sm font-bold text-slate-800">{text.badge}</span>
                  <input type="text" maxLength={30} value={custom.card.badge || ''} placeholder={text.badgeDefault} onChange={(event) => setCard({ badge: event.target.value })} className="mt-2 w-full max-w-sm rounded-xl border-slate-300 text-sm focus:border-sky-400 focus:ring-sky-200" />
                  <span className="mt-1 block text-xs text-slate-500">{text.badgeHelp}</span>
                </label>
              </div>
            )}
          </Panel>

          {Object.keys(errors).length > 0 && <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{Object.values(errors)[0]}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white"><ArrowPathIcon className="h-4 w-4" />{text.reset}</button>
            <button type="button" onClick={save} disabled={processing} className="rounded-xl bg-[#061a3a] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b2c5d] disabled:opacity-50">{recentlySuccessful ? text.saved : processing ? text.saving : text.save}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
