import React, { useState, useEffect } from "react";
import ResultChallenge from '@/Components/ResultChallenge';
import ReportQuestionButton from '@/Components/ReportQuestionButton';
import ImagePathLabel, { addImagePathLabels } from '@/Components/ImagePathLabel';
import useThemedAlert from '@/utils/useThemedAlert';
import ThemeLoader from '@/Components/ThemeLoader';
import Swal from 'sweetalert2';
import ObjectiveQuestionLayout from '@/Layouts/ObjectiveQuestionLayout';

export default function SubtopicMission({ isOpen, onClose, subjectId, levelId, subjectKey, topicId, topicName, asPage = false, initialSessionId = null }) {
    const alert = useThemedAlert();
    const [sessionId, setSessionId] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [summary, setSummary] = useState(null);
    // The modal renders once before its start request runs in useEffect.
    const [loading, setLoading] = useState(true);
    const [answerHistory, setAnswerHistory] = useState([]);
    const [showExplanation, setShowExplanation] = useState(false);

    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [sessionTimer, setSessionTimer] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showResultModal, setShowResultModal] = useState(false);
    const [missionResults, setMissionResults] = useState(null);
    const [leaving, setLeaving] = useState(false);

    // Helper function to get CSRF token
    const getCsrfToken = () => {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    };

    // Function to refresh CSRF token
    const refreshCsrfToken = async () => {
        try {
            const response = await fetch('/sanctum/csrf-cookie', {
                credentials: 'same-origin'
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to refresh CSRF token:', error);
            return false;
        }
    };

    // Load existing session progress
    const loadSessionProgress = async (sid) => {
        try {
            console.log('Loading session progress for session:', sid);
            const response = await fetch(route('mission.challenge.progress', { session_id: sid }));
            const data = await response.json();

            console.log('Session progress data:', data);

            if (data.answers && data.answers.length > 0) {
                const history = data.answers.map((ans, idx) => ({
                    questionNumber: idx + 1,
                    isCorrect: ans.is_correct === 1
                }));
                setAnswerHistory(history);
                console.log('Loaded answer history:', history);
            }
        } catch (error) {
            console.error('Error loading session progress:', error);
        }
    };

    // Format time from seconds to MM:SS or HH:MM:SS
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Start session timer
    const startSessionTimer = () => {
        // Clear any existing timer
        if (sessionTimer) {
            clearInterval(sessionTimer);
        }

        // Reset elapsed time
        setElapsedTime(0);
        setSessionStartTime(Date.now());

        // Start new timer
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        setSessionTimer(timer);
        return timer;
    };

    // Stop session timer
    const stopSessionTimer = () => {
        if (sessionTimer) {
            clearInterval(sessionTimer);
            setSessionTimer(null);
        }
    };

    useEffect(() => {
        if (isOpen && !sessionId) {
            console.log('Modal opened, starting new mission session');
            console.log('Mission topic:', { topicId, topicName });
            // The list page already created the session; just resume it here.
            initialSessionId ? resumeSession(initialSessionId) : startMission();
        }

        // Cleanup timer on unmount
        return () => {
            if (sessionTimer) {
                clearInterval(sessionTimer);
            }
        };
    }, [isOpen]);

    // The list page shows a "preparing" alert while the mission is created; drop it once the first question is ready.
    useEffect(() => {
        if (asPage && !loading) alert.close();
    }, [asPage, loading]);

    const resumeSession = async (sid) => {
        setLoading(true);
        setSessionId(sid);
        startSessionTimer();
        // Independent requests: run them together instead of one after the other.
        await Promise.all([loadSessionProgress(sid), loadNextQuestion(sid)]);
    };

    const startMission = async () => {
        setLoading(true);
        try {
            await refreshCsrfToken();

            const csrfToken = getCsrfToken();

            console.log('Starting mission with data:', {
                subject_id: subjectId,
                level_id: levelId,
                topic_id: topicId
            });

            const response = await fetch(route('mission.subtopic.start'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    subject_id: subjectId,
                    level_id: levelId,
                    topic_id: topicId
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (response.status === 419) {
                console.log('CSRF token expired, refreshing and retrying...');
                await refreshCsrfToken();
                return startMission();
            }

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage += ` - ${JSON.stringify(errorData)}`;
                } catch (e) {
                    const text = await response.text();
                    errorMessage += ` - ${text}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Mission started successfully:', data);
            setSessionId(data.session_id);
            setTotalQuestions(data.total_questions);

            // Start session timer
            startSessionTimer();

            // If continuing existing session, load progress
            if (data.message && data.message.includes('Continuing')) {
                console.log('Continuing existing session, loading progress...');
                await loadSessionProgress(data.session_id);
            } else {
                // New session, reset history
                setAnswerHistory([]);
            }

            loadNextQuestion(data.session_id);
        } catch (error) {
            console.error('Full error details:', error);
            void alert.message({ title: alert.tr('Cannot start mission', 'Tidak dapat memulakan misi'), text: alert.tr('Please try again.', 'Sila cuba lagi.'), icon: 'error' });
            setLoading(false);
        }
    };

    const loadNextQuestion = async (sid) => {
    setLoading(true);
    setShowResult(false);
    setSelectedAnswer(null);
    setShowExplanation(false);
    
    try {
        // Validate session ID
        if (!sid) {
            console.error('No session ID provided');
            setLoading(false);
            return;
        }
        
        console.log('Loading next question for session:', sid);
        const response = await fetch(route('mission.challenge.question', { session_id: sid || sessionId }));
        
        if (!response.ok) {
            console.error('Failed to load question:', response.status);
            if (response.status === 400) {
                // Session might be completed
                await loadSummary(sid);
            }
            setLoading(false);
            return;
        }
        
        const data = await response.json();
        console.log('Mission question data received:', data);
        
        // Check if the API says mission is completed
        if (data.completed) {
            console.log('Mission completed (API), loading summary...');
            stopSessionTimer();
            await loadSummary(sid);
        } else {
            // Always show the next question if available
            setCurrentQuestion({
                ...data.question,
                answers: data.answers
            });
            // Update question number from API response
            setQuestionNumber(data.current_question || questionNumber + 1);
            setTotalQuestions(data.total_questions || totalQuestions);
        }
    } catch (error) {
        console.error('Error loading question:', error);
    } finally {
        setLoading(false);
    }
};

    const handleAnswerSelect = (answerId) => {
        if (!showResult) {
            setSelectedAnswer(answerId);
        }
    };

    const handleSubmit = async () => {
    if (!selectedAnswer || isSubmitting) return;

    setIsSubmitting(true);
    
    // Calculate time taken
    const currentElapsed = elapsedTime;
    const previousElapsed = answerHistory.length > 0 
        ? answerHistory.reduce((sum, ans) => sum + (ans.timeTaken || 0), 0)
        : 0;
    const timeTaken = currentElapsed - previousElapsed;

    try {
        await refreshCsrfToken();
        
        const response = await fetch(route('mission.subtopic.answer'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
                'Accept': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                session_id: sessionId,
                question_id: currentQuestion.id,
                answer_id: selectedAnswer,
                time_taken: Math.max(1, timeTaken)
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Answer submission error:', response.status, errorText);
            
            if (response.status === 419) {
                console.log('CSRF token expired, refreshing and retrying...');
                await refreshCsrfToken();
                setIsSubmitting(false);
                return handleSubmit();
            }
            
            throw new Error(`Failed to submit answer: ${response.status}`);
        }

        const data = await response.json();
        console.log('Answer submitted:', data);
        
        setIsCorrect(data.is_correct);
        setShowResult(true);

        // Add to history
        setAnswerHistory(prev => [...prev, {
            questionNumber: questionNumber,
            isCorrect: data.is_correct,
            timeTaken: Math.max(1, timeTaken)
        }]);

        // Check if this was the last question
        const isLastQuestion = questionNumber >= totalQuestions;
        
        if (isLastQuestion || data.mission_complete) {
            console.log('Last question answered, loading summary...');
            // Stop timer
            stopSessionTimer();
            // Load summary immediately - NO delay
            await loadSummary(sessionId);
        }
        // Don't auto-load next question - wait for user to click "Next"
    } catch (error) {
        console.error('Error submitting answer:', error);
        void alert.message({ title: alert.tr('Answer not submitted', 'Jawapan tidak dihantar'), text: alert.tr('Please try again.', 'Sila cuba lagi.'), icon: 'error' });
    } finally {
        setIsSubmitting(false);
    }
};

    const loadSummary = async (sid) => {
        try {
            console.log('Loading summary for session:', sid);
            const response = await fetch(route('mission.subtopic.summary', { session_id: sid }));
            const data = await response.json();
            console.log('Mission summary loaded:', data);

            // Prepare results for ResultChallenge
            setMissionResults({
                correctAnswers: data.correct_answers || 0,
                totalQuestions: data.total_questions || 0,
                skippedAnswers: 0,
                timeElapsed: elapsedTime,
                score: data.correct_answers || 0,
                mastery: data.progress || []
            });

            console.log('Setting showResultModal to true');
            // Show result modal
            setShowResultModal(true);

            // Also hide current question
            setCurrentQuestion(null);
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    };

    

    const handleTryAgain = () => {
        setShowResultModal(false);
        setMissionResults(null);
        setSummary(null);
        setCurrentQuestion(null);
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(false);
        setQuestionNumber(0);
        setAnswerHistory([]);
        setShowExplanation(false);
        setElapsedTime(0);

        // Restart mission
        startMission();
    };

    // Handle close result modal
    const handleCloseResultModal = () => {
        setShowResultModal(false);
        setMissionResults(null);
        handleClose(); // Close entire modal
    };

    const handleNext = () => {
    // Only proceed if not the last question
    if (questionNumber < totalQuestions) {
        loadNextQuestion(sessionId);
    } else {
        // If it's the last question, load summary
        console.log('Last question completed, loading summary...');
        stopSessionTimer();
        loadSummary(sessionId);
    }
};

    const handleClose = () => {
        // Full page: keep the page as it is and show a loader until the list page arrives.
        // Resetting the mission state here used to leave an empty screen while that page loaded.
        if (asPage) {
            if (sessionTimer) clearInterval(sessionTimer);
            setLeaving(true);
            onClose();
            return;
        }
        setLoading(true);
        // Clean up timer
        if (sessionTimer) {
            clearInterval(sessionTimer);
        }

        setSessionId(null);
        setCurrentQuestion(null);
        setSelectedAnswer(null);
        setShowResult(false);
        setSummary(null);
        setQuestionNumber(0);
        setAnswerHistory([]);
        setShowExplanation(false);
        setSessionStartTime(null);
        setElapsedTime(0);
        setSessionTimer(null);
        setShowResultModal(false);
        setMissionResults(null);
        onClose();
    };

    const handleContinue = () => {
        handleClose();
    };

    const confirmClose = async () => {
        if (isSubmitting) return;
        if (!sessionId || summary) return handleClose();
        const hasAnswers = answerHistory.length > 0;
        const result = await alert.confirm({
            title: alert.tr('Leave mission?', 'Tinggalkan misi?'),
            text: hasAnswers
                ? alert.tr('Your mission progress will be recorded. You can start a new mission later.', 'Kemajuan misi anda akan direkodkan. Anda boleh mulakan misi baharu kemudian.')
                : alert.tr('No answers have been submitted, so this visit will not appear in your report.', 'Tiada jawapan dihantar, jadi sesi ini tidak akan muncul dalam laporan anda.'),
            confirmText: alert.tr('Leave mission', 'Tinggalkan misi'),
            cancelText: alert.tr('Continue mission', 'Teruskan misi'),
            icon: 'warning',
        });
        if (!result.isConfirmed) return;

        alert.loading({ title: hasAnswers ? alert.tr('Saving mission progress…', 'Sedang menyimpan kemajuan misi…') : alert.tr('Leaving mission…', 'Sedang keluar daripada misi…') });
        try {
            await refreshCsrfToken();
            const response = await fetch(route('mission.subtopic.save-progress'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ session_id: sessionId }),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            alert.close();
            handleClose();
        } catch (error) {
            console.error('Error saving mission progress:', error);
            alert.close();
            void alert.message({ title: alert.tr('Progress not saved', 'Kemajuan tidak disimpan'), text: alert.tr('Please try leaving again.', 'Sila cuba keluar sekali lagi.'), icon: 'error' });
        }
    };

    // Render HTML content safely
    const renderContent = (content) => {
        if (!content) return null;
        return <div dangerouslySetInnerHTML={{ __html: addImagePathLabels(content) }} />;
    };

    // Get correct answer and its explanation
    const getCorrectAnswerInfo = () => {
        if (!currentQuestion?.answers) {
            console.log('getCorrectAnswerInfo: No answers array');
            return null;
        }

        console.log('getCorrectAnswerInfo - All answers:', currentQuestion.answers);
        console.log('getCorrectAnswerInfo - Looking for answer with is_correct_answer === 1');

        const correctAnswer = currentQuestion.answers.find(a => {
            console.log(`Checking answer ${a.id}: is_correct_answer = ${a.is_correct_answer}, type = ${typeof a.is_correct_answer}`);
            return a.is_correct_answer === 1;
        });

        console.log('getCorrectAnswerInfo - Found:', correctAnswer);
        return correctAnswer;
    };

    if (!isOpen) return null;

    // console.log('Render state:', {
    //     answerHistory,
    //     remainingProblems,
    //     totalQuestions,
    //     questionNumber,
    //     topicName,
    //     elapsedTime,
    //     showResultModal,
    //     missionResults: !!missionResults
    // });

    // If result modal is shown, don't render the mission modal
    if (showResultModal) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[200] overflow-y-auto">
      {/* Centering container - this is the key change */}
      <div className="min-h-full flex items-center justify-center p-4">
        {/* Modal container with max width */}
        <div className="w-full max-w-3xl">
          <ResultChallenge
            results={missionResults}
            onTryAgain={handleTryAgain}
            subject={subjectKey}
            topic={topicName}
            topic_id={topicId}
            subject_id={subjectId}
            level_id={levelId}
            isModal={true}
            onCloseModal={handleCloseResultModal}
          />
        </div>
      </div>
    </div>
  );
}

    const actionButtons = (
        <div className="flex w-full space-x-3 sm:w-auto">
        {!showResult ? (
            <button
                onClick={handleSubmit}
                disabled={!selectedAnswer || isSubmitting}
                className={`w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 sm:w-auto`}
            >
                {isSubmitting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{alert.tr('Submitting…', 'Sedang menghantar…')}</span>
                    </>
                ) : (
                    <>
                        <span>{alert.tr('Submit Answer', 'Hantar Jawapan')}</span>
                    </>
                )}
            </button>
        ) : (
            // Show "Next" button if not the last question, "See Results" if last
            questionNumber < totalQuestions ? (
                <button
                    onClick={handleNext}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 sm:w-auto"
                >
                    <span>{alert.tr('Next Question', 'Soalan Seterusnya')}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            ) : (
                <button
                    onClick={() => {
                        stopSessionTimer();
                        loadSummary(sessionId);
                    }}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 sm:w-auto"
                >
                    <span>{alert.tr('See Results', 'Lihat Keputusan')}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )
        )}
        </div>
    );

    const missionBody = (
        <>
                {loading && !currentQuestion ? (
                    <ThemeLoader message={alert.tr('Loading mission session…', 'Sedang memuatkan sesi misi…')} />
                ) : summary ? (
                    <ThemeLoader message={alert.tr('Preparing your results…', 'Sedang menyediakan keputusan anda…')} />
                ) : currentQuestion ? (
                    <div>
                        {!asPage && (
                        <>
                        {/* Header with Progress Circles */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 relative sm:p-6">
                            {/* Close button - positioned absolutely */}
                            <button
                                onClick={confirmClose}
                                className="absolute top-3 right-3 text-white/80 hover:text-white text-2xl sm:top-4 sm:right-4"
                            >
                                ×
                            </button>

                            <div className="flex flex-col gap-3 pr-8 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <h3 className="text-base font-semibold sm:text-lg">{alert.tr('Mission', 'Misi')}: {topicName}</h3>
                                    <p className="text-xs text-green-100 mt-1 sm:text-sm">
                                        {alert.tr('Question', 'Soalan')} {questionNumber} {alert.tr('of', 'daripada')} {totalQuestions}
                                    </p>
                                </div>

                                {/* Session Timer + Progress Circles */}
                                <div className="flex flex-col gap-2 sm:items-end">
                                    <div className="inline-flex self-start bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg sm:self-auto sm:px-4 sm:py-2">
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4 text-white sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="font-mono font-bold text-base sm:text-lg">
                                                {formatTime(elapsedTime)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="sm:text-right">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end sm:gap-2">
                                            {Array.from({ length: totalQuestions }).map((_, index) => {
                                                const answered = answerHistory.find(h => h.questionNumber === index + 1);
                                                const isCurrent = index + 1 === questionNumber && !showResult;

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`h-6 w-6 rounded-full flex items-center justify-center transition-all sm:h-8 sm:w-8 ${answered?.isCorrect
                                                                ? 'bg-green-500'
                                                                : answered && !answered.isCorrect
                                                                    ? 'bg-gray-400'
                                                                    : isCurrent
                                                                        ? 'bg-white/30 border-2 border-white'
                                                                        : 'bg-white/20 border-2 border-white/40'
                                                            }`}
                                                    >
                                                        {answered?.isCorrect && (
                                                            <svg className="h-3.5 w-3.5 text-white sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                        {answered && !answered.isCorrect && (
                                                            <svg className="h-3.5 w-3.5 text-white sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 bg-gray-200">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                            ></div>
                        </div>

                        </>
                        )}

                        {/* Question Content */}
                        <div className="p-4 sm:p-6 md:p-8">
                            <div className="mb-3 flex justify-end">
                                <ReportQuestionButton questionId={currentQuestion.id} context="mission_subtopic" />
                            </div>
                            <div className="mb-6">
                                {/* Question Text or Image */}
                                {currentQuestion.question_text ? (
                                    <div className={asPage ? "prose max-w-none text-sm font-semibold leading-relaxed text-gray-900 md:text-lg xl:text-xl" : "prose max-w-none"}>
                                        {renderContent(currentQuestion.question_text)}
                                    </div>
                                ) : currentQuestion.question_file ? (
                                    <div className="flex flex-col items-center">
                                        <img 
                                            src={currentQuestion.question_file} 
                                            alt={alert.tr('Question', 'Soalan')}
                                            className="max-w-full h-auto rounded-lg shadow"
                                        />
                                        <ImagePathLabel path={currentQuestion.question_file} />
                                    </div>
                                ) : (
                                    <p className="text-lg text-gray-800 leading-relaxed">
                                        {currentQuestion.question}
                                    </p>
                                )}
                            </div>


                            {/* Answer Options */}
                            <div className="space-y-3">
                                {currentQuestion.answers && currentQuestion.answers.length > 0 ? (
                                    currentQuestion.answers.map((answer, index) => {
                                        const isSelected = selectedAnswer === answer.id;
                                        const showCorrect = showResult && answer.is_correct_answer === "1";
                                        const showWrong = showResult && isSelected && answer.is_correct_answer === "0";

                                        return (
                                            <button
                                                key={answer.id}
                                                onClick={() => handleAnswerSelect(answer.id)}
                                                disabled={showResult}
                                                className={`w-full ${asPage ? 'p-4 md:p-5 rounded-xl' : 'p-4 rounded-lg'} text-left border-2 transition-all ${showCorrect
                                                        ? 'border-green-500 bg-green-50'
                                                        : showWrong
                                                            ? 'border-red-500 bg-red-50'
                                                            : isSelected
                                                                ? 'border-green-500 bg-green-50'
                                                                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                                                    } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex flex-1 items-start gap-2">
                                                        <span className={`mt-0.5 flex flex-none items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500 ${asPage ? 'h-7 w-7 text-xs' : 'h-5 w-5 text-[10px]'}`}>
                                                            {String.fromCharCode(65 + index)}
                                                        </span>
                                                        <div className="flex-1">
                                                            {answer.answer_text ? (
                                                                <div className={`prose max-w-none ${asPage ? 'prose-base md:prose-lg' : 'prose-sm'}`}>
                                                                    {renderContent(answer.answer_text)}
                                                                </div>
                                                            ) : answer.answer_option_file ? (
                                                                <div className="inline-block max-w-full">
                                                                    <img
                                                                        src={answer.answer_option_file}
                                                                        alt={alert.tr('Answer option', 'Pilihan jawapan')}
                                                                        className="max-w-xs h-auto rounded"
                                                                    />
                                                                    <ImagePathLabel path={answer.answer_option_file} />
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-800">{answer.answer_option}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="ml-3 flex-shrink-0">
                                                        {showCorrect && (
                                                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                        {showWrong && (
                                                            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-500">{alert.tr('No answers available', 'Tiada jawapan tersedia')}</p>
                                )}
                            </div>

                            {/* Result and Explanation */}
                            {showResult && (
                                <div className="mt-6 space-y-4">
                                    <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                                        <div className="flex items-center space-x-2">
                                            {isCorrect ? (
                                                <>
                                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-green-800">{alert.tr('Good work!', 'Syabas!')}</p>
                                                        <p className="text-sm text-green-700">{alert.tr("That's the right answer.", 'Itulah jawapan yang betul.')}</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-red-800">{alert.tr('Incorrect', 'Salah')}</p>
                                                        <p className="text-sm text-red-700">{alert.tr('Review the correct answer above.', 'Semak jawapan yang betul di atas.')}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Show "Answer Description" button ONLY if correct */}
                                    {isCorrect && (() => {
                                        const correctAnswer = getCorrectAnswerInfo();
                                        const hasExplanation = correctAnswer && (correctAnswer.reason || correctAnswer.reason2 || correctAnswer.reason_file);

                                        if (hasExplanation) {
                                            return (
                                                <>
                                                    {!showExplanation && (
                                                        <button
                                                            onClick={() => setShowExplanation(true)}
                                                            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                                                        >
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                            </svg>
                                                            <span>{alert.tr('Answer Explanation', 'Penerangan Jawapan')}</span>
                                                        </button>
                                                    )}

                                                    {showExplanation && (
                                                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                                            <div className="flex items-start space-x-2">
                                                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="font-semibold text-blue-900 mb-2">{alert.tr('Answer Explanation', 'Penerangan Jawapan')}</p>
                                                                    {correctAnswer.reason && (
                                                                        <div className="prose prose-sm max-w-none text-blue-800 mb-2">
                                                                            {renderContent(correctAnswer.reason)}
                                                                        </div>
                                                                    )}
                                                                    {correctAnswer.reason2 && (
                                                                        <div className="prose prose-sm max-w-none text-blue-800 mb-2">
                                                                            {renderContent(correctAnswer.reason2)}
                                                                        </div>
                                                                    )}
                                                                    {correctAnswer.reason_file && (
                                                                        <div className="mt-2">
                                                                            <img
                                                                                src={correctAnswer.reason_file}
                                                                                alt={alert.tr('Answer explanation', 'Penerangan jawapan')}
                                                                                className="max-w-full h-auto rounded shadow"
                                                                            />
                                                                            <ImagePathLabel path={correctAnswer.reason_file} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}

                            {!asPage && (
                                <div className="mt-8 flex justify-end">{actionButtons}</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-gray-500">{alert.tr('No question data available', 'Tiada data soalan tersedia')}</p>
                    </div>
                )}
        </>
    );

    const questionStatuses = Array.from({ length: totalQuestions }, (_, index) => {
        const answered = answerHistory.find(h => h.questionNumber === index + 1);
        return answered ? !!answered.isCorrect : null;
    });
    const getTimeColor = () => (elapsedTime < 300 ? 'text-green-600' : elapsedTime < 600 ? 'text-yellow-600' : 'text-red-600');

    // Full page: same shell as practice (header with back button, dots and timer; classroom background).
    if (asPage) {
        if (leaving) {
            return <ThemeLoader variant="page" message={alert.tr('Returning to missions…', 'Kembali ke senarai misi…')} />;
        }
        // Nothing of the mission page shows until the first question is ready.
        // While the list page's "preparing" alert is still open it is the only loader; a refresh has no alert, so show one.
        if (loading && !currentQuestion && !summary && initialSessionId && Swal.isVisible()) {
            return <div className="min-h-screen" />;
        }
        if ((loading && !currentQuestion) || summary) {
            return <ThemeLoader variant="page" message={summary ? alert.tr('Preparing your results…', 'Sedang menyediakan keputusan anda…') : alert.tr('Loading mission session…', 'Sedang memuatkan sesi misi…')} />;
        }

        return (
            <ObjectiveQuestionLayout
                subject={subjectKey}
                currentTopic={topicName}
                sectionTitle={alert.tr('Mission', 'Misi')}
                questionStatuses={questionStatuses}
                currentIndex={Math.max(0, questionNumber - 1)}
                timeElapsed={elapsedTime}
                getTimeColor={getTimeColor}
                formatTime={formatTime}
                answeredQuestions={new Set()}
                handleBackNavigation={confirmClose}
                footerContent={currentQuestion ? <div className="mx-auto flex w-full max-w-6xl justify-end">{actionButtons}</div> : <div />}
            >
                <div className="bg-cover bg-center bg-no-repeat py-2 sm:py-4" style={{ backgroundImage: 'url(/images/background_classroom.jpg)' }}>
                    <div className="relative mx-auto max-w-full px-4 sm:px-0 md:px-4 lg:px-10 xl:max-w-5xl 2xl:max-w-6xl">
                        <div className="mb-10 mt-6 overflow-hidden rounded-2xl bg-white shadow-xl">
                            {missionBody}
                        </div>
                    </div>
                </div>
            </ObjectiveQuestionLayout>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                {missionBody}
            </div>
        </div>
    );
}
