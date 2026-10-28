import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useLanguage } from '@/Contexts/LanguageContext';

const reasons = [
    ['incorrect_answer', 'Answer is incorrect', 'Jawapan tidak betul'],
    ['unclear_question', 'Question is unclear', 'Soalan tidak jelas'],
    ['broken_image', 'Image is missing or broken', 'Imej hilang atau rosak'],
    ['incorrect_content', 'Content or spelling problem', 'Masalah kandungan atau ejaan'],
    ['technical_issue', 'Technical problem', 'Masalah teknikal'],
    ['other', 'Other', 'Lain-lain'],
];

export default function ReportQuestionButton({ questionId, context, className = '', onOpen }) {
    const { locale } = useLanguage();
    const tr = (en, ms) => locale === 'ms' ? ms : en;
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setOpen(false);
        setReason('');
        setDetails('');
        setMessage('');
        setError('');
    }, [questionId]);

    if (!questionId) return null;

    const close = () => {
        if (!submitting) setOpen(false);
    };

    const closeFromBackdrop = (event) => {
        if (event.target === event.currentTarget) close();
    };

    const submit = async (event) => {
        event.preventDefault();
        setError('');

        if (!reason) {
            setError(tr('Please choose a reason.', 'Sila pilih sebab.'));
            return;
        }

        if (reason === 'other' && !details.trim()) {
            setError(tr('Please describe the problem.', 'Sila jelaskan masalah tersebut.'));
            return;
        }

        setSubmitting(true);
        try {
            // Refresh Laravel's XSRF cookie because login regenerates the session token
            // while an Inertia page can retain an older token in the document meta tag.
            await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
            const response = await axios.post(
                route('question-reports.store'),
                {
                    question_id: questionId,
                    context,
                    reason,
                    details: details.trim() || null,
                    page_url: window.location.href,
                },
                {
                    withCredentials: true,
                    headers: { 'Accept': 'application/json' },
                },
            );

            setMessage(tr('Report submitted. Thank you.', 'Laporan berjaya dihantar. Terima kasih.'));
        } catch (submitError) {
            const data = submitError.response?.data;
            const validationError = data?.errors ? Object.values(data.errors).flat()[0] : null;
            setError(validationError || data?.message || submitError.message || tr('Unable to submit the report.', 'Laporan tidak dapat dihantar.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={(event) => { event.stopPropagation(); onOpen?.(); setOpen(true); }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 ${className}`}
                aria-label={tr('Report a problem with this question', 'Laporkan masalah pada soalan ini')}
            >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4m0 0h11l-2 4 2 4H5" /></svg>
                <span className="hidden sm:inline">{tr('Report question', 'Lapor soalan')}</span>
                <span className="sm:hidden">{tr('Report', 'Lapor')}</span>
            </button>

            {open && typeof document !== 'undefined' && createPortal(<div className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={closeFromBackdrop}>
                <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="report-question-title">
                    <div className="flex items-start justify-between gap-4">
                        <div><p className="text-xs font-black uppercase tracking-widest text-rose-500">{tr('Help us improve', 'Bantu kami menambah baik')}</p><h2 id="report-question-title" className="mt-1 text-xl font-black text-slate-900">{tr('Report question', 'Lapor soalan')} #{questionId}</h2></div>
                        <button type="button" onClick={close} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 hover:bg-slate-200" aria-label={tr('Close', 'Tutup')}>×</button>
                    </div>

                    {message ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center"><div className="text-3xl">✓</div><p className="mt-2 text-sm font-bold leading-6 text-emerald-800">{message}</p><button type="button" onClick={close} className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white">{tr('Done', 'Selesai')}</button></div> : <form onSubmit={submit} className="mt-5 space-y-5">
                        <fieldset><legend className="mb-2 text-sm font-bold text-slate-700">{tr('What is the problem?', 'Apakah masalahnya?')}</legend><div className="grid gap-2 sm:grid-cols-2">{reasons.map(([value, en, ms]) => <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${reason === value ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><input type="radio" name="report-reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="text-rose-500 focus:ring-rose-400" />{tr(en, ms)}</label>)}</div></fieldset>
                        <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{tr('More details', 'Butiran lanjut')} <span className="font-normal text-slate-400">{tr('(optional)', '(pilihan)')}</span></span><textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={4} maxLength={2000} placeholder={tr('Tell us what should be corrected...', 'Beritahu kami perkara yang perlu dibetulkan...')} className="w-full rounded-xl border-slate-200 text-sm focus:border-rose-400 focus:ring-rose-300" /><span className="mt-1 block text-right text-[10px] text-slate-400">{details.length}/2000</span></label>
                        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={close} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">{tr('Cancel', 'Batal')}</button><button type="submit" disabled={submitting} className="rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-rose-100 transition hover:bg-rose-600 disabled:cursor-wait disabled:opacity-60">{submitting ? tr('Sending…', 'Sedang menghantar…') : tr('Submit report', 'Hantar laporan')}</button></div>
                    </form>}
                </div>
            </div>, document.body)}
        </>
    );
}
