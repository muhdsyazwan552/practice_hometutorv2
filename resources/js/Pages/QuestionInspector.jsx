import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
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

function Check({ label, value, note }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${value ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
        {value ? 'YA' : 'TIDAK'}
      </span>
      <div><p className="font-semibold text-slate-800">{label}</p>{note && <p className="text-xs text-slate-500">{note}</p>}</div>
    </div>
  );
}

export default function QuestionInspector({ search = '', details = null }) {
  const [query, setQuery] = useState(search);
  const diagnostic = details?.diagnostics;

  const submit = (event) => {
    event.preventDefault();
    router.get('/question-inspector', { q: query.trim() });
  };

  return (
    <>
      <Head title="Semak Soalan" />
      <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
            <h1 className="text-2xl font-bold">Semak Soalan</h1>
            <p className="mt-2 text-sm text-slate-300">Cari menggunakan ID atau kod soalan. Halaman ini hanya membaca data.</p>
            <form onSubmit={submit} className="mt-5 flex flex-wrap gap-2">
              <input aria-label="ID atau kod soalan" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Contoh: 990522 atau 00990522" maxLength={80} className="min-w-64 flex-1 rounded-lg border-0 px-4 py-3 text-slate-900" />
              <button type="submit" className="rounded-lg bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300">Cari</button>
            </form>
          </header>

          {search && !details && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">Soalan “{search}” tidak ditemui dalam pangkalan data.</div>}

          {details && <>
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">Soalan ditemui: {details.question.question_code} (ID {details.question.id})</h2>
              <p className="mt-1 text-sm text-slate-500">Jenis latihan mengikut bilangan rekod jawapan: <strong>{diagnostic.practice_type}</strong> · {diagnostic.answer_count} jawapan · {diagnostic.active_answer_count} jawapan aktif</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Check label="Rekod soalan wujud" value={diagnostic.exists} />
                <Check label="Soalan aktif" value={diagnostic.question_active} />
                <Check label="Soalan diterbitkan" value={diagnostic.question_published} />
                <Check label="Termasuk dalam kumpulan latihan" value={diagnostic.in_practice_pool} note="Mengikut jenis dan bilangan jawapan" />
                <Check label="Topik aktif dan diterbitkan" value={diagnostic.topic_visible} />
                <Check label="Topik ada kad latihan" value={diagnostic.practice_tile_visible} note={diagnostic.topic_has_children ? 'Topik ini mempunyai subtopik; halaman kursus memaparkan subtopik.' : 'Mengikut struktur halaman kursus'} />
              </div>
              <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Halaman latihan memilih maksimum <strong>{diagnostic.session_limit} soalan secara rawak</strong> setiap sesi. Soalan yang layak mungkin tidak terpilih dalam satu sesi. Keputusan di atas tidak menjamin pemilihan rawak.</p>
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
