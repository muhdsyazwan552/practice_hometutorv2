import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { addImagePathLabels } from '@/Components/ImagePathLabel';
import QuestionPassage from '@/Components/QuestionPassage';

const labels = {
  id: 'ID', question_code: 'Kod soalan', question_text: 'Teks soalan (HTML)',
  question_file: 'Fail soalan', topic_id: 'ID topik', question_type_id: 'Jenis soalan (bank)',
  difficulty_type_id: 'Tahap kesukaran', parent_id: 'ID soalan induk', seq: 'Susunan',
  is_active: 'Aktif', is_published: 'Diterbitkan', approval_status: 'Status kelulusan',
  item_status: 'Status item', published_at: 'Tarikh diterbitkan', year_of_publishment: 'Tahun penerbitan',
  sample_answer: 'Contoh jawapan', answer_text: 'Teks jawapan', reason: 'Penjelasan',
};

function FieldTable({ data }) {
  if (!data) return <p className="text-slate-500">Tiada rekod.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <tbody>
          {Object.entries(data).map(([key, value]) => (
            <tr key={key} className="border-b border-slate-100 align-top last:border-0">
              <th className="w-56 min-w-44 bg-slate-50 px-4 py-2 font-semibold text-slate-700">
                {labels[key] || key}<span className="block text-xs font-normal text-slate-400">{key}</span>
              </th>
              <td className="max-w-3xl break-all px-4 py-2 text-slate-800">
                {value === null ? <span className="italic text-slate-400">NULL</span>
                  : typeof value === 'object' ? JSON.stringify(value)
                    : value === '' ? <span className="italic text-slate-400">Kosong</span> : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Preview({ details }) {
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const isObjective = details.diagnostics.practice_type === 'Objektif';
  const answers = details.preview.answers;
  const selectedAnswer = selected === null ? null : answers[selected];
  const schema = answers.find((answer) => answer.correct)?.schema || answers.find((answer) => answer.schema)?.schema;
  const questionHtml = addImagePathLabels((details.question_html || '')
    .replace(/<img([^>]*)>/g, '<img$1 class="max-w-full h-auto rounded-lg shadow-md max-h-96 object-contain mx-auto my-4">')
    .replace(/<p([^>]*)>/g, '<p$1 class="mb-4 leading-relaxed">'));

  return (
    <div className="rounded-xl bg-cover bg-center px-2 py-4 sm:px-6" style={{ backgroundImage: 'url(/images/background_classroom.jpg)' }}>
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        <p className="mb-4 border-b border-gray-200 pb-3 text-center text-lg font-semibold text-gray-800">Pratonton latihan · {isObjective ? 'Objektif' : 'Subjektif'}</p>
        <QuestionPassage html={details.preview.passage} />
        <div className="question-content mb-6 text-base leading-relaxed text-gray-800 sm:text-lg">
          {questionHtml ? <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: questionHtml }} />
            : <p className="text-gray-500">Tiada kandungan soalan.</p>}
        </div>

        {isObjective ? <>
          <span className="mb-4 block text-sm text-gray-600">Pilih 1 jawapan :</span>
          <div className="mb-5 space-y-3">
            {answers.map((answer, index) => <button
              key={answer.id}
              type="button"
              onClick={() => { setSelected(index); setShowAnswer(false); }}
              className={`w-full rounded-xl border-2 p-3 text-left transition-colors sm:p-4 ${selected === index ? 'border-slate-500 bg-slate-200' : 'border-gray-300 bg-white hover:border-slate-400 hover:bg-slate-50'}`}
            >
              <div className="flex items-start gap-3 text-gray-800">
                <span className="min-w-6 text-lg font-bold">{String.fromCharCode(65 + index)}.</span>
                <div className="min-w-0 flex-1 text-base sm:text-lg">
                  {answer.file && <img src={answer.file} alt={`Pilihan ${String.fromCharCode(65 + index)}`} className="mb-2 max-h-32 max-w-full rounded-lg object-contain" />}
                  {answer.text && <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: addImagePathLabels(answer.text) }} />}
                </div>
              </div>
            </button>)}
          </div>
          <button type="button" onClick={() => setShowAnswer(true)} disabled={selected === null} className="rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Semak Jawapan</button>
          {showAnswer && <div className={`mt-4 rounded-xl border p-4 ${selectedAnswer?.correct ? 'border-green-200 bg-green-50 text-green-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
            <p className="font-bold">{selectedAnswer?.correct ? 'Betul!' : 'Cuba lagi.'}</p>
            {schema && <div className="prose prose-sm mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: addImagePathLabels(schema) }} />}
          </div>}
        </> : <>
          <span className="mb-3 block text-sm text-gray-600">Type your answer below:</span>
          <textarea value={writtenAnswer} onChange={(event) => setWrittenAnswer(event.target.value)} rows={4} placeholder="Type your detailed answer with explanations and working here..." className="mb-4 w-full resize-none rounded-xl border-2 border-gray-300 bg-white p-4 text-base font-medium text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
          <button type="button" onClick={() => setShowAnswer(!showAnswer)} className="rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-white hover:bg-yellow-600">{showAnswer ? 'Hide Schema Answer' : 'Show Schema Answer'}</button>
          {showAnswer && <div className="mt-4 rounded-xl border-2 border-green-200 bg-green-50 p-4 text-green-800">
            <h3 className="mb-2 font-semibold">Schema Answer:</h3>
            {schema ? <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: addImagePathLabels(schema) }} /> : <p>Tiada skema jawapan.</p>}
          </div>}
        </>}
        <p className="mt-5 text-xs text-slate-500">Pratonton sahaja. Jawapan dan markah tidak disimpan.</p>
      </div>
    </div>
  );
}

const levelStyle = {
  pass: { badge: 'bg-emerald-100 text-emerald-800', text: 'LULUS', row: '', info: 'text-slate-600' },
  warn: { badge: 'bg-amber-100 text-amber-800', text: 'AMARAN', row: 'bg-amber-50/50', info: 'text-amber-800' },
  fail: { badge: 'bg-rose-100 text-rose-800', text: 'GAGAL', row: 'bg-rose-50/50', info: 'text-rose-700' },
  missing: { badge: 'bg-slate-200 text-slate-700', text: 'TIADA', row: 'bg-slate-50', info: 'text-slate-500' },
};

function StatusBadge({ level }) {
  const style = levelStyle[level] || levelStyle.missing;
  return <span className={`inline-flex min-w-16 justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${style.badge}`}>{style.text}</span>;
}

function VerdictBanner({ verdict }) {
  const tone = !verdict.available ? 'border-rose-300 bg-rose-50 text-rose-900'
    : verdict.level === 'pass' ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
      : verdict.level === 'warn' ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-orange-300 bg-orange-50 text-orange-900';
  const problems = verdict.issues.filter((issue) => issue.level === 'fail');
  const shown = problems.length ? problems : verdict.issues;

  return (
    <div className={`mt-4 rounded-xl border-2 p-4 ${tone}`} role="status">
      <p className="text-lg font-bold">{verdict.headline}</p>
      {shown.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
        {shown.map((issue) => <li key={issue.key}><strong>{issue.label}:</strong> {issue.info}</li>)}
      </ul>}
    </div>
  );
}

// Loads every image in the browser, so broken links show up here the same way a pupil would see them.
function useImageCheck(images, resetKey) {
  const [state, setState] = useState({ done: 0, broken: [] });

  useEffect(() => {
    setState({ done: 0, broken: [] });
    let cancelled = false;
    images.forEach((image) => {
      const probe = new Image();
      const finish = (ok) => {
        if (cancelled) return;
        setState((current) => ({ done: current.done + 1, broken: ok ? current.broken : [...current.broken, image] }));
      };
      probe.onload = () => finish(true);
      probe.onerror = () => finish(false);
      probe.src = image.url;
    });
    return () => { cancelled = true; };
  }, [resetKey]);

  return state;
}

function imageCheckRow(images, state) {
  if (images.length === 0) return { key: 'images', label: 'Gambar boleh dimuat', level: 'pass', info: 'Tiada gambar dalam soalan ini.' };
  if (state.done < images.length) return { key: 'images', label: 'Gambar boleh dimuat', level: 'pending', info: `Menyemak ${state.done}/${images.length} gambar…` };
  if (state.broken.length === 0) return { key: 'images', label: 'Gambar boleh dimuat', level: 'pass', info: `${images.length} gambar dimuat dengan baik.` };
  return {
    key: 'images', label: 'Gambar boleh dimuat', level: 'fail',
    info: <>{state.broken.length} daripada {images.length} gambar gagal dimuat: {state.broken.map((image) => <a key={image.url} href={image.url} target="_blank" rel="noreferrer" className="mr-2 underline">{image.where}</a>)}</>,
  };
}

function ChecksTable({ details }) {
  const imageState = useImageCheck(details.images, details.question.id);
  const rows = [...details.checks, imageCheckRow(details.images, imageState)];
  const failed = rows.filter((row) => row.level === 'fail').length;
  const warned = rows.filter((row) => row.level === 'warn').length;

  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-10 px-4 py-2">#</th>
            <th className="px-4 py-2">Semakan</th>
            <th className="w-28 px-4 py-2 text-center">Status</th>
            <th className="px-4 py-2">Maklumat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const style = levelStyle[row.level];
            return (
              <tr key={row.key} className={`border-t border-slate-100 align-top ${style?.row || ''}`}>
                <td className="px-4 py-2.5 text-slate-400">{index + 1}</td>
                <td className="px-4 py-2.5 text-slate-800">{row.label}</td>
                <td className="px-4 py-2.5 text-center">{row.level === 'pending' ? <span className="text-xs text-slate-400">…</span> : <StatusBadge level={row.level} />}</td>
                <td className={`px-4 py-2.5 ${style?.info || 'text-slate-500'}`}>{row.info}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-slate-100 bg-white px-4 py-2 text-xs text-slate-500">
        {failed === 0 && warned === 0 ? 'Semua semakan lulus.' : `${failed} gagal · ${warned} amaran.`} Gambar disemak dalam pelayar anda.
      </p>
    </div>
  );
}

function downloadCsv(rows) {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [['Input', 'ID', 'Kod', 'Topik', 'Status', 'Layak latihan', 'Masalah'].map(escape).join(',')];
  rows.forEach((row) => lines.push([
    row.input, row.id, row.code, row.topic, levelStyle[row.level].text, row.found ? (row.available ? 'Ya' : 'Tidak') : '',
    row.found ? row.issues.map((issue) => `[${levelStyle[issue.level].text}] ${issue.label}: ${issue.info}`).join(' ; ') : 'Tidak ditemui',
  ].map(escape).join(',')));
  const blob = new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `semakan-soalan-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function BatchResults({ batch, onOpen }) {
  const [filter, setFilter] = useState('all');
  const counts = { all: batch.rows.length, fail: 0, warn: 0, pass: 0, missing: 0 };
  batch.rows.forEach((row) => { counts[row.level] += 1; });
  const rows = filter === 'all' ? batch.rows : batch.rows.filter((row) => row.level === filter);
  const filters = [['all', 'Semua'], ['fail', 'Gagal'], ['warn', 'Amaran'], ['pass', 'Lulus'], ['missing', 'Tidak ditemui']];

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Keputusan batch ({batch.rows.length})</h2>
        <button type="button" onClick={() => downloadCsv(rows)} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Muat turun CSV{filter !== 'all' ? ' (tapisan semasa)' : ''}</button>
      </div>
      {batch.truncated && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Hanya {batch.limit} yang pertama disemak. Pecahkan senarai anda untuk baki.</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map(([key, label]) => <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-full border px-3 py-1 text-sm ${filter === key ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{label} ({counts[key]})</button>)}
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-2">Kod / ID</th><th className="px-4 py-2">Topik</th><th className="w-28 px-4 py-2 text-center">Status</th><th className="px-4 py-2">Masalah</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.input} className={`border-t border-slate-100 align-top ${levelStyle[row.level].row}`}>
                <td className="px-4 py-2.5">
                  {row.found
                    ? <button type="button" onClick={() => onOpen(row.code)} className="font-semibold text-blue-700 underline">{row.code}</button>
                    : <span className="font-semibold text-slate-700">{row.input}</span>}
                  {row.found && <span className="block text-xs text-slate-400">ID {row.id}</span>}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{row.topic || '—'}</td>
                <td className="px-4 py-2.5 text-center"><StatusBadge level={row.level} />{row.found && !row.available && <span className="mt-1 block text-xs font-semibold text-rose-700">Tak layak</span>}</td>
                <td className="px-4 py-2.5 text-slate-700">
                  {!row.found ? <span className="text-slate-500">Tidak ditemui dalam pangkalan data.</span>
                    : row.issues.length === 0 ? <span className="text-emerald-700">Tiada masalah.</span>
                      : <ul className="space-y-0.5">{row.issues.map((issue) => <li key={issue.label} className={levelStyle[issue.level].info}><strong>{issue.label}:</strong> {issue.info}</li>)}</ul>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Tiada baris untuk tapisan ini.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function QuestionInspector({ search = '', details = null, batch = null }) {
  const [mode, setMode] = useState(batch ? 'batch' : 'single');
  const [query, setQuery] = useState(search);
  const [codes, setCodes] = useState(batch?.input ?? '');

  const submit = (event) => {
    event.preventDefault();
    router.get('/question-inspector', { q: query.trim() });
  };
  const submitBatch = (event) => {
    event.preventDefault();
    if (codes.trim()) router.post('/question-inspector/batch', { codes }, { preserveScroll: true });
  };
  const tab = (key, label) => <button type="button" onClick={() => setMode(key)} className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${mode === key ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-300 hover:text-white'}`}>{label}</button>;

  return (
    <>
      <Head title="Semak Soalan" />
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
            <h1 className="text-2xl font-bold">Semak Soalan</h1>
            <p className="mt-2 text-sm text-slate-300">Cari menggunakan ID atau kod soalan. Halaman ini hanya membaca data.</p>
            <div className="mt-4 flex gap-1">{tab('single', 'Semak satu soalan')}{tab('batch', 'Semak banyak (batch)')}</div>
            {mode === 'single'
              ? <form onSubmit={submit} className="flex flex-wrap gap-2 rounded-b-lg rounded-tr-lg bg-white p-3">
                <input aria-label="ID atau kod soalan" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Contoh: 990522 atau 00990522" maxLength={80} className="min-w-64 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-900" />
                <button type="submit" className="rounded-lg bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300">Cari</button>
              </form>
              : <form onSubmit={submitBatch} className="rounded-b-lg rounded-tr-lg bg-white p-3">
                <textarea aria-label="Senarai ID atau kod soalan" value={codes} onChange={(event) => setCodes(event.target.value)} rows={5} placeholder={'Tampal ID atau kod, satu setiap baris (atau dipisahkan koma/ruang). Maksimum 200.\nContoh:\nQPT3SEJ000540\n59274'} className="w-full rounded-lg border border-slate-300 p-3 font-mono text-sm text-slate-900" />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">{codes.split(/[\s,;]+/).filter(Boolean).length} item</span>
                  <button type="submit" disabled={!codes.trim()} className="rounded-lg bg-cyan-400 px-6 py-2.5 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-40">Semak semua</button>
                </div>
              </form>}
          </header>

          {mode === 'batch' && batch && <BatchResults key={batch.rows.map((row) => row.input).join('|')} batch={batch} onOpen={(code) => { setQuery(code); setMode('single'); router.get('/question-inspector', { q: code }); }} />}

          {mode === 'single' && search && !details && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">Soalan “{search}” tidak ditemui dalam pangkalan data.</div>}

          {mode === 'single' && details && <>
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Soalan ditemui: {details.question.question_code} (ID {details.question.id})</h2>
              <p className="mt-1 text-sm text-slate-500">Jenis latihan mengikut bilangan rekod jawapan: <strong>{details.diagnostics.practice_type}</strong> · {details.diagnostics.answer_count} jawapan · {details.diagnostics.active_answer_count} jawapan aktif</p>
              <VerdictBanner verdict={details.verdict} />
              <ChecksTable details={details} />
              <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Halaman latihan memilih maksimum <strong>{details.diagnostics.session_limit} soalan secara rawak</strong> setiap sesi. Soalan yang layak mungkin tidak terpilih dalam satu sesi.</p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-4 text-xl font-bold">Pratonton soalan</h2><Preview key={details.question.id} details={details} /></section>
            <section className="space-y-4"><h2 className="text-xl font-bold">Semua medan soalan</h2><FieldTable data={details.question} /></section>
            <section className="space-y-4"><h2 className="text-xl font-bold">Jawapan ({details.answers.length})</h2>{details.answers.length ? details.answers.map((answer) => <div key={answer.id}><h3 className="mb-2 font-bold">Jawapan ID {answer.id}</h3><FieldTable data={answer} /></div>) : <p className="rounded-xl bg-white p-4 text-slate-500">Tiada rekod jawapan.</p>}</section>
            <section className="space-y-4"><h2 className="text-xl font-bold">Topik dan hubungan</h2><FieldTable data={details.topic} />{details.parent_topic && <><h3 className="font-bold">Topik induk</h3><FieldTable data={details.parent_topic} /></>}{details.child_topics.length > 0 && <><h3 className="font-bold">Subtopik ({details.child_topics.length})</h3>{details.child_topics.map((child) => <FieldTable key={child.id} data={child} />)}</>}</section>
            <section className="space-y-4"><h2 className="text-xl font-bold">Subjek</h2><FieldTable data={details.subject} /><h2 className="text-xl font-bold">Tahap</h2><FieldTable data={details.level} /></section>
          </>}
        </div>
      </main>
    </>
  );
}
