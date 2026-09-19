import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
  LanguageIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  SwatchIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/Contexts/LanguageContext';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import ThemeSettingsForm from './Partials/ThemeSettingsForm';

const copy = {
  en: {
    title: 'Settings', eyebrow: 'Account centre', intro: 'Manage your profile, personalise your learning space, and choose your display language.',
    profile: ['Manage profile', 'Your details and security'], theme: ['Manage theme', 'Personalise your learning space'], language: ['Language', 'English or Bahasa Melayu'],
    heading: 'Display language', subheading: 'Choose the language used across your dashboard and courses.',
    saving: 'Saving your language…', saved: 'Your preference is saved to your account and applies immediately.',
  },
  ms: {
    title: 'Tetapan', eyebrow: 'Pusat akaun', intro: 'Urus profil anda, peribadikan ruang pembelajaran dan pilih bahasa paparan.',
    profile: ['Urus profil', 'Butiran dan keselamatan anda'], theme: ['Urus tema', 'Peribadikan ruang pembelajaran anda'], language: ['Bahasa', 'English atau Bahasa Melayu'],
    heading: 'Bahasa paparan', subheading: 'Pilih bahasa yang digunakan di papan pemuka dan kursus anda.',
    saving: 'Menyimpan bahasa anda…', saved: 'Pilihan anda disimpan dalam akaun dan terus digunakan.',
  },
};

const tabs = [
  { id: 'profile', icon: UserCircleIcon },
  { id: 'theme', icon: PaintBrushIcon },
  { id: 'language', icon: LanguageIcon },
];

function LanguageSettings() {
  const { locale, changeLanguage, isChangingLanguage } = useLanguage();
  const text = copy[locale] || copy.en;
  const options = [
    { id: 'en', code: 'EN', title: 'English', description: 'Use English across the student portal.' },
    { id: 'ms', code: 'BM', title: 'Bahasa Melayu', description: 'Gunakan Bahasa Melayu di seluruh portal pelajar.' },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-[#061a3a] p-2.5 text-cyan-200"><LanguageIcon className="h-5 w-5" /></span>
          <div><h2 className="font-extrabold text-slate-900">{text.heading}</h2><p className="mt-0.5 text-sm text-slate-600">{text.subheading}</p></div>
        </div>
      </div>
      <div className="p-5 sm:p-7">
        <div className="grid gap-4 md:grid-cols-2">
          {options.map((option) => {
            const active = locale === option.id;
            return (
              <button key={option.id} type="button" onClick={() => changeLanguage(option.id)} disabled={active || isChangingLanguage} className={`group relative rounded-2xl border-2 p-5 text-left transition disabled:cursor-default ${active ? 'border-cyan-400 bg-cyan-50 shadow-sm' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md'}`}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold ${active ? 'bg-[#061a3a] text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700'}`}>{option.code}</span>
                <p className="mt-4 font-bold text-slate-900">{option.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{option.description}</p>
                <span className={`absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-full border ${active ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 bg-white text-transparent'}`}>✓</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"><ShieldCheckIcon className="h-5 w-5 shrink-0 text-emerald-600" /><span aria-live="polite">{isChangingLanguage ? text.saving : text.saved}</span></div>
      </div>
    </section>
  );
}

export default function Edit({ mustVerifyEmail, status, student, themes }) {
  const [activeTab, setActiveTab] = useState('profile');
  const { locale } = useLanguage();
  const text = copy[locale] || copy.en;

  return (
    <DashboardLayout>
      <Head title={text.title} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
        <section className="overflow-hidden rounded-3xl bg-[#061a3a] px-5 py-7 text-white shadow-xl shadow-slate-900/15 sm:px-8 sm:py-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">{text.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{text.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{text.intro}</p>
            </div>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-cyan-200"><SwatchIcon className="h-7 w-7" /></span>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:block lg:space-y-1" aria-label="Settings sections">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-left transition lg:w-full ${active ? 'bg-[#061a3a] text-white shadow-sm' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-800'}`}>
                <span className={`rounded-xl p-2 ${active ? 'bg-white/10 text-cyan-200' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-5 w-5" /></span>
                <span><span className="block text-sm font-bold">{text[tab.id][0]}</span><span className={`mt-0.5 hidden text-xs lg:block ${active ? 'text-slate-300' : 'text-slate-400'}`}>{text[tab.id][1]}</span></span>
              </button>;
            })}
          </nav>

          <div>
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} student={student} className="max-w-xl" /></section>
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><UpdatePasswordForm className="max-w-xl" /></section>
                <section className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm sm:p-7"><DeleteUserForm className="max-w-xl" /></section>
              </div>
            )}
            {activeTab === 'theme' && <ThemeSettingsForm themes={themes} />}
            {activeTab === 'language' && <LanguageSettings />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
