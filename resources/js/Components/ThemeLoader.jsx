import { usePage } from '@inertiajs/react';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';

/**
 * The one loading indicator for student screens, coloured by the student's
 * theme so every wait looks the same.
 *
 * variant:
 *  - "inline"  (default) centred in the page content, inside a layout
 *  - "overlay" fixed over the whole screen while a request is running
 *  - "page"    a full screen on its own, for pages rendered without a layout
 */
export default function ThemeLoader({ message = 'Loading…', detail = null, variant = 'inline' }) {
  const { studentTheme } = usePage().props;
  const palette = resolveDashboardTheme(studentTheme, studentTheme?.custom);
  const themeVars = { '--loader-accent': palette.accent };

  // Styled inline rather than with rounded-/border/bg-white/shadow classes, so
  // the theme card decorations in app.css never match it: the loader must look
  // the same inside page content as it does in the overlay.
  const card = (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3.5 px-5 py-4"
      style={{
        ...themeVars,
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid color-mix(in srgb, var(--loader-accent) 22%, white)',
        boxShadow: '0 18px 40px -12px color-mix(in srgb, var(--loader-accent) 40%, transparent)',
      }}
    >
      <span
        className="h-6 w-6 flex-none animate-spin rounded-full border-[3px]"
        style={{
          borderColor: 'color-mix(in srgb, var(--loader-accent) 18%, white)',
          borderTopColor: 'var(--loader-accent)',
        }}
      />
      <div>
        <p className="text-sm font-semibold text-slate-700">{message}</p>
        {detail && <p className="mt-0.5 text-xs text-slate-500">{detail}</p>}
      </div>
    </div>
  );

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/20 p-4 backdrop-blur-sm">
        {card}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div
        className="grid min-h-screen place-items-center p-6"
        style={{ backgroundColor: palette.page, backgroundImage: palette.pageGradient || undefined }}
      >
        {card}
      </div>
    );
  }

  return <div className="flex h-96 items-center justify-center px-4">{card}</div>;
}
