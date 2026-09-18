import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
}

async function refreshCsrfToken() {
  try {
    const response = await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function apiFetch(url, options = {}, retried = false) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      'X-CSRF-TOKEN': getCsrfToken(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 419 && !retried) {
    await refreshCsrfToken();
    return apiFetch(url, options, true);
  }

  return response;
}

function useCountdown(targetIso) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(targetIso).getTime() - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(targetIso).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const days = Math.floor(remaining / (24 * 3600 * 1000));
  const hours = Math.floor((remaining % (24 * 3600 * 1000)) / (3600 * 1000));
  const minutes = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return { remaining, days, hours, minutes, seconds };
}

function CountdownBadge({ targetIso, label }) {
  const { days, hours, minutes, seconds } = useCountdown(targetIso);

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-blue-500/40 bg-gray-800/80 px-5 py-3 text-white">
      <span className="text-sm font-semibold text-blue-300">{label}</span>
      <div className="flex items-center gap-1 font-mono text-lg font-bold">
        {days > 0 && <span>{days}h</span>}
        <span>{String(hours).padStart(2, '0')}j</span>:
        <span>{String(minutes).padStart(2, '0')}m</span>:
        <span>{String(seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  );
}

function Leaderboard({ rows, title }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-blue-500 bg-gray-800 shadow-2xl">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-blue-600">{rows.length} pemain</span>
        </div>
      </div>
      <div className="p-4">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-blue-200">
            <div className="mb-3 text-4xl">🏆</div>
            <p>Belum ada yang bermain lagi minggu ini. Jadi yang pertama!</p>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-700 text-xs uppercase text-blue-300">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Pelajar</th>
                  <th className="px-3 py-2 text-left">Skor</th>
                  <th className="px-3 py-2 text-left">Masa</th>
                  <th className="px-3 py-2 text-left">Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {rows.map((row) => (
                  <tr key={row.rank + row.name} className={row.is_me ? 'bg-blue-900/40' : ''}>
                    <td className="px-3 py-2 font-bold text-white">
                      {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                    </td>
                    <td className="px-3 py-2 text-white">{row.name}{row.is_me && <span className="ml-2 text-xs text-blue-300">(anda)</span>}</td>
                    <td className="px-3 py-2 text-emerald-400">{row.correct_answers}/{row.total_questions}</td>
                    <td className="px-3 py-2 font-mono text-gray-300">{row.total_time_seconds}s</td>
                    <td className="px-3 py-2 font-bold text-yellow-400">
                      {row.points_awarded !== null && row.points_awarded !== undefined ? `+${row.points_awarded}` : 'menunggu'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionRunner({ sessionUuid, onFinished }) {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(10);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startedAt, setStartedAt] = useState(Date.now());

  const loadNext = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    setFeedback(null);
    const response = await apiFetch(`${route('quiz-arena.question')}?session_uuid=${sessionUuid}`);
    const data = await response.json();

    if (data.completed) {
      onFinished();
      return;
    }

    setQuestion(data.question);
    setAnswers(data.answers || []);
    setCurrent(data.current_question);
    setTotal(data.total_questions);
    setStartedAt(Date.now());
    setLoading(false);
  }, [sessionUuid, onFinished]);

  useEffect(() => {
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUuid]);

  const submit = async (answerId) => {
    if (selected) return;
    setSelected(answerId);
    const timeTaken = Math.round((Date.now() - startedAt) / 1000);

    const response = await apiFetch(route('quiz-arena.answer'), {
      method: 'POST',
      body: JSON.stringify({
        session_uuid: sessionUuid,
        question_id: question.id,
        answer_id: answerId,
        time_taken: timeTaken,
      }),
    });
    const data = await response.json();
    setFeedback(data.is_correct ? 'correct' : 'wrong');

    setTimeout(() => {
      if (data.completed) {
        onFinished();
      } else {
        loadNext();
      }
    }, 900);
  };

  if (loading || !question) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between text-blue-300">
        <span className="font-bold">Soalan {current} / {total}</span>
        <div className="h-2 flex-1 mx-4 rounded-full bg-gray-700">
          <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all" style={{ width: `${(current / total) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border-2 border-blue-500 bg-gray-800 p-6 text-white shadow-2xl">
        {question.question_text && <div className="mb-5 text-lg font-semibold" dangerouslySetInnerHTML={{ __html: question.question_text }} />}
        {question.question_file && <img src={question.question_file} alt="Soalan" className="mb-5 max-h-64 rounded-lg" />}

        <div className="space-y-3">
          {answers.map((answer) => {
            const isSelected = selected === answer.id;
            const revealCorrect = feedback && answer.is_correct_answer;
            return (
              <button
                key={answer.id}
                type="button"
                disabled={!!selected}
                onClick={() => submit(answer.id)}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  revealCorrect
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : isSelected
                    ? 'border-rose-400 bg-rose-500/20'
                    : 'border-gray-600 bg-gray-700 hover:border-blue-400'
                }`}
                dangerouslySetInnerHTML={{ __html: answer.answer_text }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ShopModal({ onClose, balance, onBalanceChange }) {
  const [tab, setTab] = useState('shop');
  const [rewards, setRewards] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await apiFetch(route('quiz-arena.wallet'));
    const data = await response.json();
    setRewards(data.rewards || []);
    setLog(data.log || []);
    onBalanceChange(data.balance);
    setLoading(false);
  }, [onBalanceChange]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const claim = async (reward) => {
    setClaimingId(reward.id);
    setMessage(null);
    const response = await apiFetch(route('quiz-arena.rewards.claim', { reward: reward.id }), { method: 'POST', body: JSON.stringify({}) });
    const data = await response.json();
    if (!response.ok) {
      setMessage({ type: 'error', text: data.error || 'Tidak dapat menebus hadiah ini.' });
    } else {
      setRewards(data.rewards || []);
      onBalanceChange(data.balance);
      setMessage({ type: 'success', text: `Berjaya menebus ${reward.title}!` });
    }
    setClaimingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-blue-500 bg-gray-800 shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-600 p-5">
          <div>
            <h2 className="text-xl font-bold text-white">🛍️ Kedai Quiz Arena</h2>
            <p className="text-sm text-blue-100">Baki point anda: <span className="font-bold text-yellow-300">{balance}</span></p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex border-b border-gray-700">
          <button onClick={() => setTab('shop')} className={`flex-1 py-3 text-sm font-bold ${tab === 'shop' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>Hadiah &amp; Tema</button>
          <button onClick={() => setTab('log')} className={`flex-1 py-3 text-sm font-bold ${tab === 'log' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>Sejarah Point</button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-5">
          {message && (
            <div className={`mb-4 rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/20 text-emerald-200'}`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-blue-200">Memuatkan...</div>
          ) : tab === 'shop' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {rewards.map((reward) => (
                <div key={reward.id} className="rounded-xl border-2 border-gray-600 bg-gray-700/60 p-4">
                  <div className="mb-2 text-3xl">{reward.icon || '🎁'}</div>
                  <p className="font-bold text-white">{reward.title}</p>
                  {reward.description && <p className="mt-1 text-xs text-gray-300">{reward.description}</p>}
                  <p className="mt-2 font-bold text-yellow-400">{reward.points_cost} point</p>
                  {reward.owned ? (
                    <div className="mt-3 rounded-lg bg-emerald-500/20 py-2 text-center text-xs font-bold text-emerald-300">Sudah dimiliki</div>
                  ) : (
                    <button
                      onClick={() => claim(reward)}
                      disabled={claimingId === reward.id || balance < reward.points_cost}
                      className="mt-3 w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      {claimingId === reward.id ? 'Menebus...' : balance < reward.points_cost ? 'Point tidak cukup' : 'Tebus'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {log.length === 0 ? (
                <p className="py-10 text-center text-gray-400">Belum ada sejarah point.</p>
              ) : (
                log.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between rounded-xl bg-gray-700/60 p-3">
                    <div>
                      <p className="text-sm text-white">{entry.description}</p>
                      <p className="text-xs text-gray-400">{entry.created_at ? new Date(entry.created_at).toLocaleString('ms-MY') : ''}</p>
                    </div>
                    <span className={`font-bold ${entry.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {entry.points >= 0 ? '+' : ''}{entry.points}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuizArena({ hasLevel, isOpen, opensAt, closesAt, session, leaderboard, pointBalance }) {
  const [phase, setPhase] = useState(() => {
    if (!isOpen) return 'closed';
    if (session?.status === 'completed') return 'finished';
    if (session?.status === 'in_progress') return 'playing';
    return 'ready';
  });
  const [sessionUuid, setSessionUuid] = useState(session?.uuid ?? null);
  const [summary, setSummary] = useState(session?.status === 'completed' ? session : null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(pointBalance ?? 0);
  const [shopOpen, setShopOpen] = useState(false);

  const rows = useMemo(() => leaderboard || [], [leaderboard]);

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const response = await apiFetch(route('quiz-arena.start'), { method: 'POST', body: JSON.stringify({}) });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Tidak dapat mulakan Quiz Arena sekarang.');
        setStarting(false);
        return;
      }
      setSessionUuid(data.session_uuid);
      setPhase('playing');
    } catch (e) {
      setError('Ralat rangkaian. Sila cuba lagi.');
    }
    setStarting(false);
  };

  const finish = useCallback(async () => {
    const response = await apiFetch(`${route('quiz-arena.summary')}?session_uuid=${sessionUuid}`);
    const data = await response.json();
    setSummary(data);
    setPhase('finished');
  }, [sessionUuid]);

  return (
    <div className="min-h-screen bg-cover bg-center p-4 text-white" style={{ backgroundImage: 'url(/images/background.jpg)' }}>
      <div className="mx-auto max-w-5xl">
        <div className="relative mb-10 text-center">
          <Link href="/dashboard" className="absolute left-0 top-0 rounded-full bg-red-500 p-3 shadow-lg transition hover:scale-110 hover:bg-red-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          <div className="absolute right-0 top-0 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/40 bg-gray-800/90 px-4 py-2.5 font-bold text-yellow-300">
              ⭐ {balance}
            </div>
            <button
              onClick={() => setShopOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2.5 font-bold text-gray-900 shadow-lg transition hover:scale-105"
            >
              🛍️ Kedai
            </button>
          </div>

          <div className="inline-block rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-1">
            <h1 className="flex items-center gap-3 rounded-xl bg-gray-800 px-8 py-4 text-4xl font-bold text-white">
              <ApplicationLogo className="h-14 w-auto" /> QUIZ ARENA
            </h1>
          </div>
          <p className="mt-4 text-gray-300">Hanya dibuka setiap Sabtu &amp; Ahad · 10 soalan rawak ikut tahap anda</p>
        </div>

        {!hasLevel && (
          <div className="mb-6 rounded-2xl border-2 border-amber-500 bg-amber-500/10 p-5 text-center text-amber-200">
            Akaun anda belum ada tahap (level) ditetapkan. Sila hubungi ibu bapa/pentadbir.
          </div>
        )}

        {error && <div className="mb-6 rounded-xl border border-rose-500 bg-rose-500/10 p-4 text-center text-rose-200">{error}</div>}

        {phase === 'closed' && hasLevel && (
          <div className="space-y-8">
            <div className="rounded-2xl border-2 border-blue-500 bg-gray-800 p-8 text-center">
              <p className="mb-4 text-lg text-blue-200">Quiz Arena ditutup buat masa ini. Ia dibuka semula pada Sabtu.</p>
              <CountdownBadge targetIso={opensAt} label="Dibuka dalam" />
            </div>
            <Leaderboard rows={rows} title="Kedudukan Minggu Lepas" />
          </div>
        )}

        {phase === 'ready' && hasLevel && (
          <div className="space-y-8">
            <div className="rounded-2xl border-2 border-emerald-500 bg-gray-800 p-8 text-center">
              <p className="mb-4 text-lg text-emerald-200">Quiz Arena sedang dibuka! Tekan mula untuk terus jawab 10 soalan.</p>
              <div className="mb-6">
                <CountdownBadge targetIso={closesAt} label="Ditutup dalam" />
              </div>
              <button
                onClick={start}
                disabled={starting}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-400 bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-105 disabled:opacity-50"
              >
                ⚔️ {starting ? 'Memulakan...' : 'Mula Quiz'} 🎯
              </button>
            </div>
            <Leaderboard rows={rows} title="Kedudukan Semasa" />
          </div>
        )}

        {phase === 'playing' && sessionUuid && <QuestionRunner sessionUuid={sessionUuid} onFinished={finish} />}

        {phase === 'finished' && summary && (
          <div className="space-y-8">
            <div className="rounded-2xl border-2 border-blue-500 bg-gray-800 p-8 text-center">
              <div className="mb-3 text-5xl">🎉</div>
              <p className="text-xl font-bold text-white">Anda dapat {summary.correct_answers}/{summary.total_questions} betul!</p>
              <p className="mt-2 text-blue-300">Masa: {summary.total_time_seconds} saat</p>
              <p className="mt-4 text-lg text-yellow-400">
                {summary.points_awarded !== null && summary.points_awarded !== undefined
                  ? `Anda dapat ${summary.points_awarded} point (kedudukan #${summary.rank})`
                  : 'Point akan diberi selepas weekend tamat — semak semula selepas Ahad malam.'}
              </p>
            </div>
            <Leaderboard rows={rows} title="Kedudukan Semasa" />
          </div>
        )}
      </div>

      {shopOpen && <ShopModal onClose={() => setShopOpen(false)} balance={balance} onBalanceChange={setBalance} />}
    </div>
  );
}
