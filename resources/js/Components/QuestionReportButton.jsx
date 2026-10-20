import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '@/Contexts/LanguageContext';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  PhotoIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const reportTypes = [
  {
    value: 'incorrect_answer',
    label: 'Answer seems incorrect',
    msLabel: 'Jawapan mungkin salah',
    description: 'The answer key or explanation may be wrong.',
    msDescription: 'Jawapan betul atau penerangan mungkin tidak tepat.',
    icon: ExclamationTriangleIcon,
  },
  {
    value: 'broken_image',
    label: 'Image problem',
    msLabel: 'Masalah imej',
    description: 'An image is missing, unclear, or incorrect.',
    msDescription: 'Imej hilang, tidak jelas atau tidak betul.',
    icon: PhotoIcon,
  },
  {
    value: 'text_issue',
    label: 'Text problem',
    msLabel: 'Masalah teks',
    description: 'There is a typo, formatting issue, or unclear wording.',
    msDescription: 'Terdapat kesilapan ejaan, format atau ayat yang tidak jelas.',
    icon: DocumentTextIcon,
  },
  {
    value: 'not_understood',
    label: "I don't understand",
    msLabel: 'Saya tidak faham',
    description: 'This question or explanation needs more clarity.',
    msDescription: 'Soalan atau penerangan ini perlu diperjelas.',
    icon: QuestionMarkCircleIcon,
  },
  {
    value: 'other',
    label: 'Something else',
    msLabel: 'Masalah lain',
    description: 'Tell us about another issue with this question.',
    msDescription: 'Beritahu kami masalah lain pada soalan ini.',
    icon: FlagIcon,
  },
];

export default function QuestionReportButton({
  questionId,
  questionCode = null,
  subjectId = null,
  topicId = null,
  context = 'question',
  questionNumber = null,
  selectedAnswerId = null,
  className = '',
}) {
  const { locale } = useLanguage();
  const tr = (en, ms) => locale === 'ms' ? ms : en;
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [reportReference, setReportReference] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const reset = () => {
    setReportType('');
    setDetails('');
    setError('');
    setSent(false);
    setReportReference(null);
  };

  const close = () => {
    if (submitting) return;
    setOpen(false);
    window.setTimeout(reset, 200);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!reportType || !questionId) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post(route('question-reports.store'), {
        question_id: questionId,
        question_code: questionCode || null,
        subject_id: subjectId || null,
        topic_id: topicId || null,
        report_type: reportType,
        details: details.trim() || null,
        context,
        page_url: window.location.href,
        metadata: {
          question_number: questionNumber || null,
          selected_answer_id: selectedAnswerId || null,
        },
      });
      setReportReference(response.data);
      setSent(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || tr('The report could not be sent. Please try again.', 'Laporan tidak dapat dihantar. Sila cuba lagi.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!questionId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 ${className}`}
        title={tr('Report a problem with this question', 'Laporkan masalah pada soalan ini')}
      >
        <FlagIcon className="h-4 w-4" />
        {tr('Report question', 'Lapor soalan')}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <div role="dialog" aria-modal="true" aria-labelledby="question-report-title" className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">{tr('Help us improve', 'Bantu kami menambah baik')}</p>
                <h2 id="question-report-title" className="mt-1 text-xl font-semibold text-slate-900">{tr('Report this question', 'Laporkan soalan ini')}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {questionCode && <span>{tr('Code', 'Kod')} {questionCode} · </span>}
                  {tr('Question ID', 'ID soalan')} #{questionId}
                </p>
              </div>
              <button type="button" onClick={close} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label={tr('Close report form', 'Tutup borang laporan')}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {sent ? (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircleIcon className="h-8 w-8" /></span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{tr('Report received', 'Laporan diterima')}</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{tr('Thank you. The content team can now review this question and your feedback.', 'Terima kasih. Pasukan kandungan akan menyemak soalan dan maklum balas anda.')}</p>
                <div className="mx-auto mt-4 flex w-fit flex-wrap items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  {reportReference?.question_code && <span>{tr('Code', 'Kod')}: {reportReference.question_code}</span>}
                  <span>ID: #{reportReference?.question_id || questionId}</span>
                  {reportReference?.report_id && <span>{tr('Report', 'Laporan')}: #{reportReference.report_id}</span>}
                </div>
                <button type="button" onClick={close} className="mt-6 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">{tr('Done', 'Selesai')}</button>
              </div>
            ) : (
              <form onSubmit={submit} className="px-5 py-5 sm:px-6">
                <fieldset>
                  <legend className="text-sm font-semibold text-slate-800">{tr('What is the problem?', 'Apakah masalahnya?')}</legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {reportTypes.map((type) => {
                      const Icon = type.icon;
                      const active = reportType === type.value;
                      return (
                        <label key={type.value} className={`cursor-pointer rounded-xl border p-3 transition ${active ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                          <input type="radio" name="report_type" value={type.value} checked={active} onChange={() => setReportType(type.value)} className="sr-only" />
                          <span className="flex gap-2.5"><Icon className={`mt-0.5 h-5 w-5 flex-none ${active ? 'text-indigo-600' : 'text-slate-400'}`} /><span><span className="block text-sm font-semibold text-slate-800">{locale === 'ms' ? type.msLabel : type.label}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{locale === 'ms' ? type.msDescription : type.description}</span></span></span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-slate-800">{tr('More details', 'Butiran lanjut')} <span className="font-normal text-slate-400">{tr('(optional)', '(pilihan)')}</span></span>
                  <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1500} rows={3} className="mt-2 w-full resize-none rounded-xl border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500" placeholder={tr('Tell us what looks wrong or what you did not understand…', 'Beritahu kami perkara yang salah atau tidak difahami…')} />
                  <span className="mt-1 block text-right text-[10px] text-slate-400">{details.length}/1500</span>
                </label>

                {error && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}

                <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button type="button" onClick={close} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">{tr('Cancel', 'Batal')}</button>
                  <button type="submit" disabled={!reportType || submitting} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? tr('Sending…', 'Sedang menghantar…') : tr('Send report', 'Hantar laporan')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
