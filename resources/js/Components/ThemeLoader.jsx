import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';
import useThemedAlert from '@/utils/useThemedAlert';

/** Shows the shared themed SweetAlert while a student page is loading. */
export default function ThemeLoader({ message, detail, variant = 'inline' }) {
  const { studentTheme } = usePage().props;
  const palette = resolveDashboardTheme(studentTheme, studentTheme?.custom);
  const alert = useThemedAlert();
  const owner = useRef(`page-loader-${Math.random().toString(36).slice(2)}`);
  const title = {
    'Loading your course…': alert.tr('Loading your course…', 'Sedang memuatkan kursus…'),
    'Loading new questions…': alert.tr('Loading new questions…', 'Sedang memuatkan soalan baharu…'),
  }[message] || message || alert.tr('Loading…', 'Sedang memuatkan…');
  const description = detail === 'Preparing your quiz'
    ? alert.tr('Preparing your quiz', 'Sedang menyediakan kuiz anda')
    : detail;

  useEffect(() => {
    alert.loading({ title, text: description, owner: owner.current });
    return () => alert.closeLoading(owner.current);
  }, [title, description, palette.accent]);

  if (variant === 'page') {
    return <div className="min-h-screen" style={{ backgroundColor: palette.page, backgroundImage: palette.pageGradient || undefined }} />;
  }

  return null;
}
