import React from 'react';
import { usePage } from '@inertiajs/react';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';
import StandardFooter from '@/Components/StandardFooter';
import QuestionHeader from '@/Components/QuestionHeader';
import { useLanguage } from '@/Contexts/LanguageContext';

const SubjectiveQuestionLayout = ({
  children,
  currentTopic,
  questionStatuses = [],
  currentIndex = 0,
  timeElapsed,
  getTimeColor,
  sectionTitle,
  formatTime,
  footerContent,
  onBack,
}) => {
  const { studentTheme } = usePage().props;
  const { locale } = useLanguage();
  const palette = resolveDashboardTheme(studentTheme, studentTheme?.custom);

  return (
    <div className="student-theme-shell flex min-h-screen flex-col" data-theme-style={studentTheme?.slug} style={{ '--theme-page': palette.page, '--theme-card': palette.card, '--theme-accent': palette.accent, '--theme-hero': palette.hero, '--theme-ink': palette.ink }}>
      <QuestionHeader
        title={sectionTitle}
        topic={currentTopic}
        statuses={questionStatuses}
        current={currentIndex}
        timeText={formatTime(timeElapsed)}
        timeClass={getTimeColor()}
        onBack={onBack}
        backLabel={locale === 'ms' ? 'Keluar latihan' : 'Exit practice'}
      />

      <div className="student-theme-content relative pb-0 pt-0">
        {children}
      </div>

      {/* ✅ Footer */}
      <footer className="student-theme-footer bg-white border-t border-gray-200 shadow-lg p-2 z-30">
        {footerContent}
      </footer>

      <StandardFooter />
    </div>
  );
};

export default SubjectiveQuestionLayout;
