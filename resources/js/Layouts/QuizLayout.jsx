// Layouts/QuestionLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import QuestionNavbar from './QuestionNavbar';
import ScientificCalculator from '@/Components/ScientificCalculator';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';

const QuizLayout = ({ 
  children, 
  title = "Quiz",
  firstAnswers = [],
  bgColor = "bg-white",
  footer = null 
}) => {
  const { studentTheme } = usePage().props;
  const palette = resolveDashboardTheme(studentTheme, studentTheme?.custom);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 8, y: 80 });
  const calculatorRef = useRef(null);
  const calculatorDrag = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
        setNavbarVisible(false);
      } else if (currentScrollY === 0) {
        setNavbarVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keep the calculator on screen, with its header always reachable.
  const clampCalculator = (x, y) => {
    const width = calculatorRef.current?.offsetWidth ?? 288;
    return {
      x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - width - 8)),
      y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - 56)),
    };
  };

  const toggleCalculator = () => {
    if (!calculatorVisible) setCalculatorPosition(clampCalculator(window.innerWidth - 304, 80));
    setCalculatorVisible(!calculatorVisible);
  };

  const QuizBanner = () => (
    <div className="sticky top-0 max-w-8xl mx-auto px-6 sm:px-6 lg:px-8 py-4 border-b border-gray-200 bg-white z-40">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-white p-2 rounded-full mr-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quiz</h1>
            <p className="text-gray-400">Test your knowledge!</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {/* Question progress dots */}
          <div className="flex space-x-3 mb-3">
            {firstAnswers.map((isCorrect, index) => (
              <div
                key={index}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium border-2 border-gray-300 ${
                  isCorrect === true
                    ? 'bg-green-500 text-white'
                    : isCorrect === false
                    ? 'bg-red-500 text-white'
                    : 'bg-transparent'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`student-theme-shell min-h-screen ${bgColor}`} data-theme-style={studentTheme?.slug} style={{ '--theme-page': palette.page, '--theme-card': palette.card, '--theme-accent': palette.accent, '--theme-hero': palette.hero, '--theme-ink': palette.ink }}>
      {/* Pass navbarVisible prop to QuestionNavbar */}
      {/* <QuestionNavbar title={title} visible={navbarVisible} /> */}
      
      {/* Floating Calculator Icon */}
      <div 
        className={`fixed z-50 transition-all duration-300 ${
          calculatorVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ 
          top: '80px', 
          right: '20px',
          cursor: 'pointer'
        }}
      >
        <button
          onClick={toggleCalculator}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
          title="Open Calculator"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Draggable Calculator: drag the header with a mouse or finger */}
      {calculatorVisible && (
        <div
          ref={calculatorRef}
          className="fixed z-50 overflow-hidden rounded-lg bg-slate-900 shadow-2xl ring-1 ring-black/20"
          style={{
            left: `${calculatorPosition.x}px`,
            top: `${calculatorPosition.y}px`,
          }}
        >
          {/* Calculator Header */}
          <div
            className="flex cursor-move items-center justify-between bg-slate-800 px-2.5 py-1"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              if (e.target.closest('button')) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              const rect = calculatorRef.current.getBoundingClientRect();
              calculatorDrag.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            }}
            onPointerMove={(e) => {
              if (!calculatorDrag.current) return;
              setCalculatorPosition(clampCalculator(e.clientX - calculatorDrag.current.x, e.clientY - calculatorDrag.current.y));
            }}
            onPointerUp={() => { calculatorDrag.current = null; }}
            onPointerCancel={() => { calculatorDrag.current = null; }}
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-white">Scientific Calculator</span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setCalculatorVisible(false)}
                className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Calculator Content - scrolls only when the screen is shorter than the calculator */}
          <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <ScientificCalculator />
          </div>
        </div>
      )}

      {/* Overlay when calculator is open */}
      {calculatorVisible && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-20"
          onClick={() => setCalculatorVisible(false)}
        />
      )}
      
      <QuizBanner />
      
      <main className="student-theme-content mx-auto">
        {children}
      </main>
      
      {footer}
    </div>
  );
};

export default QuizLayout;
