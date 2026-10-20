import React from 'react';
import { usePage } from '@inertiajs/react';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';
import useThemedAlert from '@/utils/useThemedAlert';

import StandardFooter from '@/Components/StandardFooter';
import QuestionHeader from '@/Components/QuestionHeader';

const ObjectiveQuestionLayout = ({
  children,
  subject,
  standard,
  currentTopic,
  questionStatuses = [],
  currentIndex = 0,
  timeElapsed,
  getTimeColor,
  sectionTitle,
  formatTime,
  footerContent,
  answeredQuestions,
  selectedAnswer,
  handleExitQuiz,
  handleBackNavigation,
  onExitWithResults
}) => {
  const { studentTheme } = usePage().props;
  const alert = useThemedAlert();
  const palette = resolveDashboardTheme(studentTheme, studentTheme?.custom);

  const formatSubjectName = (subject) => {
    if (!subject) return "Subject";
    return subject.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

   // Handle back/exit logic
  const handleBackButtonClick = async () => {
    if (answeredQuestions && answeredQuestions.size > 0) {
      if (onExitWithResults) {
        // Use custom exit handler that shows results
        onExitWithResults();
      } else {
        const result = await alert.confirm({
          title: alert.tr('Exit practice?', 'Keluar daripada latihan?'),
          text: alert.tr('Answered questions will be saved. Remaining questions will be marked as skipped.', 'Soalan yang telah dijawab akan disimpan. Soalan selebihnya ditanda sebagai dilangkau.'),
          confirmText: alert.tr('Save & exit', 'Simpan & keluar'),
          cancelText: alert.tr('Continue practice', 'Teruskan latihan'),
          icon: 'warning',
        });
        if (result.isConfirmed) handleExitQuiz?.();
      }
    } else {
      handleBackNavigation ? handleBackNavigation() : window.history.back();
    }
  };

  return (
    <div className="student-theme-shell flex min-h-screen flex-col" data-theme-style={studentTheme?.slug} style={{ '--theme-page': palette.page, '--theme-card': palette.card, '--theme-accent': palette.accent, '--theme-hero': palette.hero, '--theme-ink': palette.ink }}>
      <QuestionHeader
        title={sectionTitle}
        topic={currentTopic}
        statuses={questionStatuses}
        current={currentIndex}
        timeText={formatTime(timeElapsed)}
        timeClass={getTimeColor()}
        onBack={handleBackButtonClick}
        backLabel={answeredQuestions && answeredQuestions.size > 0 ? alert.tr('Exit & save', 'Keluar & simpan') : alert.tr('Back', 'Kembali')}
      />

      <div className="student-theme-content relative pb-0 pt-0">
        {children}
      </div>

      {/* ✅ Footer */}
      <footer className="student-theme-footer bg-white border-t border-gray-200 shadow-lg p-3 z-30">
        {footerContent}
      </footer>

      <StandardFooter />
    </div>
  );
};

export default ObjectiveQuestionLayout;
