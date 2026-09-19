import StudentNavbar from '@/Components/StudentNavbar';
import { usePage } from '@inertiajs/react';
import { resolveDashboardTheme, shellBackground } from '@/utils/dashboardTheme';

export default function DashboardLayout({ header, children }) {
  const { dashboardTheme, studentTheme } = usePage().props;
  const palette = resolveDashboardTheme(dashboardTheme || studentTheme, studentTheme?.custom);

  // Single source of truth for the theme background: the full scene picture
  // kept vivid behind translucent cards, or the student's own colours.
  const shellStyle = shellBackground(palette);

  return (
    <div className="min-h-screen font-sans text-slate-900" style={shellStyle}>
      <StudentNavbar />

      {header && <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">{header}</div></header>}
      {children}
    </div>
  );
}
