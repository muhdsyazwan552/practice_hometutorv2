import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import {
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  GiftIcon,
  PaintBrushIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
}

function rewardImage(reward) {
  return reward.theme_slug ? `/images/themes/${reward.theme_slug === 'robo-lab' ? `${reward.theme_slug}.png` : `${reward.theme_slug}.jpg`}` : null;
}

function PointBadge({ balance }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-extrabold text-amber-800">⭐ {balance.toLocaleString()} point</span>;
}

function ClaimCard({ reward, balance, claimingId, onClaim }) {
  const canClaim = balance >= reward.points_cost;
  const image = rewardImage(reward);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-sky-100 to-indigo-100">
        {image ? <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="flex h-full items-center justify-center text-5xl">{reward.icon || '🎁'}</span>}
        {image && <span className="absolute inset-0 bg-gradient-to-t from-slate-950/35 to-transparent" />}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{reward.type}</span>
      </div>
      <div className="p-4">
        <h3 className="font-extrabold text-slate-900">{reward.title}</h3>
        <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{reward.description || 'Tebus ganjaran ini menggunakan point Quiz Arena anda.'}</p>
        <div className="mt-4 flex items-center justify-between gap-3"><span className="font-extrabold text-amber-700">⭐ {reward.points_cost} point</span>{reward.owned ? <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-700"><CheckIcon className="h-4 w-4" /> Dimiliki</span> : <button type="button" onClick={() => onClaim(reward)} disabled={!canClaim || claimingId === reward.id} className="rounded-xl bg-[#061a3a] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#0b2c5d] disabled:cursor-not-allowed disabled:opacity-40">{claimingId === reward.id ? 'Menebus…' : canClaim ? 'Tebus' : 'Point tidak cukup'}</button>}</div>
      </div>
    </article>
  );
}

export default function QuizArenaRewards({ section, pointBalance = 0, rewards: initialRewards = [], pointLog = [] }) {
  const [balance, setBalance] = useState(pointBalance);
  const [rewards, setRewards] = useState(initialRewards);
  const [log, setLog] = useState(pointLog);
  const [claimingId, setClaimingId] = useState(null);
  const [message, setMessage] = useState(null);
  const isShop = section === 'shop';
  const visibleRewards = rewards.filter((reward) => isShop ? reward.type !== 'theme' : reward.type === 'theme');

  const claim = async (reward) => {
    setClaimingId(reward.id);
    setMessage(null);
    try {
      const response = await fetch(route('quiz-arena.rewards.claim', { reward: reward.id }), {
        method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() }, body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Tidak dapat menebus hadiah ini.');
      setBalance(data.balance);
      setRewards(data.rewards || []);
      setLog(data.log || log);
      setMessage({ type: 'success', text: `${reward.title} berjaya ditebus.` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Tidak dapat menebus hadiah ini.' });
    } finally {
      setClaimingId(null);
    }
  };

  const pageTitle = isShop ? 'Kedai Quiz Arena' : 'Hadiah & Tema';
  const subtitle = isShop ? 'Gunakan point anda untuk menebus ganjaran Quiz Arena.' : 'Buka tema baharu dan jadikan dashboard anda lebih peribadi.';

  return (
    <DashboardLayout>
      <Head title={pageTitle} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-[#061a3a] px-5 py-7 text-white shadow-xl shadow-slate-900/15 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><Link href={route('quiz-arena.index')} className="inline-flex items-center gap-2 text-sm font-bold text-cyan-200 transition hover:text-white"><ArrowLeftIcon className="h-4 w-4" /> Kembali ke Quiz Arena</Link><div className="mt-5 flex items-center gap-3"><span className="rounded-2xl bg-white/10 p-3 text-cyan-200">{isShop ? <ShoppingBagIcon className="h-6 w-6" /> : <PaintBrushIcon className="h-6 w-6" />}</span><div><h1 className="text-3xl font-extrabold tracking-tight">{pageTitle}</h1><p className="mt-1 max-w-xl text-sm leading-6 text-slate-300">{subtitle}</p></div></div></div><PointBadge balance={balance} /></div>
        </section>

        <nav className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Quiz Arena rewards navigation">
          <Link href={route('quiz-arena.shop')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${isShop ? 'bg-[#061a3a] text-white' : 'text-slate-600 hover:bg-sky-50'}`}><ShoppingBagIcon className="h-4 w-4" /> Kedai</Link>
          <Link href={route('quiz-arena.rewards')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${!isShop ? 'bg-[#061a3a] text-white' : 'text-slate-600 hover:bg-sky-50'}`}><GiftIcon className="h-4 w-4" /> Hadiah & Tema</Link>
        </nav>

        {message && <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100' : 'bg-rose-50 text-rose-800 ring-1 ring-rose-100'}`}>{message.text}</div>}

        <div className={`mt-6 grid gap-6 ${isShop ? '' : 'xl:grid-cols-[minmax(0,1fr)_21rem]'}`}>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-slate-900">{isShop ? 'Ganjaran tersedia' : 'Tema yang boleh ditebus'}</h2><p className="mt-1 text-sm text-slate-500">{isShop ? 'Item dan badge untuk pengalaman Quiz Arena anda.' : 'Tema yang dibeli akan terus tersedia dalam Theme Studio.'}</p></div><SparklesIcon className="h-6 w-6 text-amber-500" /></div>{visibleRewards.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleRewards.map((reward) => <ClaimCard key={reward.id} reward={reward} balance={balance} claimingId={claimingId} onClaim={claim} />)}</div> : <div className="rounded-2xl bg-slate-50 py-12 text-center text-sm text-slate-500">Tiada ganjaran tersedia buat masa ini.</div>}</section>

          {!isShop && <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><ClockIcon className="h-5 w-5 text-sky-600" /><h2 className="font-extrabold text-slate-900">Sejarah point</h2></div><p className="mt-1 text-sm text-slate-500">Rekod terbaru point Quiz Arena anda.</p><div className="mt-5 space-y-3">{log.length ? log.slice(0, 8).map((entry, index) => <div key={`${entry.created_at}-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${entry.points >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{entry.points >= 0 ? '+' : '−'}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-700">{entry.description}</p><p className="mt-1 text-xs text-slate-400">{entry.created_at ? new Date(entry.created_at).toLocaleString('ms-MY') : ''}</p></div><span className={`text-sm font-extrabold ${entry.points >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{entry.points >= 0 ? '+' : ''}{entry.points}</span></div>) : <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Belum ada sejarah point.</p>}</div></aside>}
        </div>
      </main>
    </DashboardLayout>
  );
}
