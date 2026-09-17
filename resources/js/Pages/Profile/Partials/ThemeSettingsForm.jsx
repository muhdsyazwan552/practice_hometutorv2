import { useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { PaintBrushIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';

function ThemeOption({ theme, active, onSelect }) {
  const palette = resolveDashboardTheme(theme);
  return (
    <button type="button" onClick={() => onSelect(theme.id)} className={`group overflow-hidden rounded-2xl border-2 text-left transition ${active ? 'border-sky-500 ring-4 ring-sky-100' : 'border-slate-200 hover:-translate-y-0.5 hover:border-sky-300'}`}>
      <div className="h-16 p-3" style={{ background: palette.hero }}>
        <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold" style={{ color: palette.ink }}>{theme.config?.tier || 'Theme'}</span>
      </div>
      <div className="bg-white px-3 py-2.5">
        <p className="truncate text-sm font-bold text-slate-800">{theme.name}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-500">{theme.description}</p>
      </div>
    </button>
  );
}

export default function ThemeSettingsForm({ themes = {} }) {
  const available = themes.available || [];
  const initialTheme = themes.active_dashboard_theme_id || available[0]?.id || '';
  const initialCard = themes.learning_space_card_theme_id || initialTheme;
  const { data, setData, patch, processing, recentlySuccessful } = useForm({
    dashboard_theme_id: initialTheme,
    learning_space_card_theme_id: initialCard,
  });

  useEffect(() => {
    setData({ dashboard_theme_id: initialTheme, learning_space_card_theme_id: initialCard });
  }, [initialTheme, initialCard]);

  const selectedTheme = useMemo(() => available.find((theme) => theme.id === data.dashboard_theme_id), [available, data.dashboard_theme_id]);
  if (!available.length) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 px-5 py-5 sm:px-7">
        <div className="flex items-center gap-3"><span className="rounded-2xl bg-sky-600 p-2.5 text-white"><PaintBrushIcon className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-900">Theme Studio</h2><p className="mt-0.5 text-sm text-slate-600">Choose your dashboard look and your learning-space card separately.</p></div></div>
      </div>
      <div className="space-y-7 p-5 sm:p-7">
        <div><div className="mb-3 flex items-center gap-2"><PaintBrushIcon className="h-4 w-4 text-sky-600" /><h3 className="font-bold text-slate-800">Dashboard theme</h3></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{available.map((theme) => <ThemeOption key={`dashboard-${theme.id}`} theme={theme} active={data.dashboard_theme_id === theme.id} onSelect={(id) => setData('dashboard_theme_id', id)} />)}</div></div>
        <div><div className="mb-3 flex items-center gap-2"><RectangleStackIcon className="h-4 w-4 text-rose-500" /><h3 className="font-bold text-slate-800">Your learning-space card</h3></div><p className="mb-3 text-sm text-slate-500">Mix it with any theme you have unlocked.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{available.map((theme) => <ThemeOption key={`card-${theme.id}`} theme={theme} active={data.learning_space_card_theme_id === theme.id} onSelect={(id) => setData('learning_space_card_theme_id', id)} />)}</div></div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-600"><span className="font-bold text-slate-800">Selected dashboard:</span> {selectedTheme?.name}</p><button type="button" onClick={() => patch(route('profile.themes.update'))} disabled={processing} className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50">{recentlySuccessful ? 'Saved!' : processing ? 'Saving…' : 'Save theme choices'}</button></div>
      </div>
    </section>
  );
}
