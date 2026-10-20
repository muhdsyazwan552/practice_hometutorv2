// resources/js/Components/ProfileDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import avatars from '@/Data/avatars';
import { useLanguage } from '@/Contexts/LanguageContext';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';
import useThemedAlert from '@/utils/useThemedAlert';

export default function ProfileDropdown({ user, student, variant = 'default' }) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [browseMode, setBrowseMode] = useState(false);
  const dropdownRef = useRef(null);
  const { studentTheme } = usePage().props;
  const { locale } = useLanguage();
  const alert = useThemedAlert();
  const accent = resolveDashboardTheme(studentTheme, studentTheme?.custom).accent;
  const menuText = locale === 'ms' ? { settings: 'Tetapan', signOut: 'Log keluar', photo: 'Tukar gambar profil' } : { settings: 'Settings', signOut: 'Sign out', photo: 'Change profile picture' };

  const handleLogout = async () => {
    setOpen(false);
    const result = await alert.confirm({
      title: alert.tr('Sign out?', 'Log keluar?'),
      text: alert.tr('You will need to sign in again to continue learning.', 'Anda perlu log masuk semula untuk meneruskan pembelajaran.'),
      confirmText: alert.tr('Sign out', 'Log keluar'),
      icon: 'warning',
    });
    if (result.isConfirmed) {
      alert.loading({ title: alert.tr('Signing out…', 'Sedang log keluar…') });
      router.post(route('logout'), {}, { onFinish: alert.close });
    }
  };

  // Debug logging - updated to use the student prop
  // useEffect(() => {
  //   console.log('ProfileDropdown debug:');
  //   console.log('User data:', user);
  //   console.log('Student prop:', student);
  //   console.log('User.student relationship:', user?.student);
  //   console.log('Profile picture path:', student?.profile_picture || user?.student?.profile_picture);
  //   console.log('Full URL would be:', `/storage/${student?.profile_picture || user?.student?.profile_picture}`);
  // }, [user, student]);

  // Use student prop if available, otherwise use user.student
  const studentData = student || user?.student;
  const compact = variant === 'compact';

  const { data, setData, post, processing, progress, errors, reset } = useForm({
    profile_picture: null,
    avatar_filename: null,
  });

  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setData('profile_picture', file);
      setData('avatar_filename', null);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('profile.picture.update'), {
      onSuccess: () => {
        setModalOpen(false);
        reset();
        setPreview(null);
        setBrowseMode(false);
        setOpen(false);
      },
      preserveScroll: true,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition focus:outline-none ${compact ? 'border border-white/25 bg-white/10 text-white hover:bg-white/20 hover:ring-2 hover:ring-white/30' : 'bg-gray-200 text-gray-500 hover:text-black hover:ring-2 hover:ring-black'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </button>

      {/* Dropdown Menu: compact account card tinted with the student's theme */}
      {open && (
        <div
          className="absolute right-0 z-50 mt-2.5 w-[min(17rem,calc(100vw-1.5rem))] origin-top-right overflow-hidden rounded-2xl border bg-white shadow-2xl shadow-slate-950/25"
          style={{ borderColor: `color-mix(in srgb, ${accent} 25%, white)` }}
        >
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 16%, white), color-mix(in srgb, ${accent} 6%, white))` }}>
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white text-lg font-semibold text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 55%, #061a3a))` }}>
                {studentData?.profile_picture ? (
                  <img
                    src={`/storage/${studentData.profile_picture}`}
                    alt={user?.name}
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() ?? 'U'
                )}
              </div>
              <button
                type="button"
                onClick={() => { setModalOpen(true); setOpen(false); }}
                aria-label={menuText.photo}
                title={menuText.photo}
                className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-1 shadow ring-1 ring-slate-200 transition hover:scale-110"
              >
                <svg className="h-3 w-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h3l2-3h8l2 3h3v11H3V7z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </button>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{user?.name ?? 'Student'}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              href={route('profile.edit')}
              onClick={() => setOpen(false)}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--menu-accent)_10%,white)]"
              style={{ '--menu-accent': accent }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${accent} 12%, white)`, color: accent }}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.38.138.751.43.992l1.003.827a1.125 1.125 0 0 1 .26 1.431l-1.297 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.127c-.331.184-.582.495-.644.87l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.643-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.127.332-.184.582-.495.645-.87l.213-1.281Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </span>
              <span className="mr-auto">{menuText.settings}</span>
              <span className="text-slate-300 transition group-hover:translate-x-0.5">›</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
              </span>
              <span className="mr-auto">{menuText.signOut}</span>
              <span className="text-rose-200 transition group-hover:translate-x-0.5">›</span>
            </button>
          </div>
        </div>
      )}

      {/* Change Profile Picture Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-80 px-4 pb-8 pt-20 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-gray-900 sm:rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  reset();
                  setPreview(null);
                  setBrowseMode(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-white">{menuText.photo}</h3>
              <div className="w-8" />
            </div>

            {/* Preview */}
            <div className="flex justify-center my-8">
              <div className="relative">
                <div className="w-48 h-48 rounded-full overflow-hidden ring-4 ring-gray-800">
                  {preview ? (
                    <img src={preview} alt={alert.tr('Preview', 'Pratonton')} className="w-full h-full object-cover" />
                  ) : studentData?.profile_picture ? (
                    <img
                      src={`/storage/${studentData.profile_picture}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load profile picture in modal:', studentData.profile_picture);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-6xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                </div>
                {preview && (
                  <div className="absolute bottom-2 right-2 bg-gray-800 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-8">
              <input type="file" id="profile-upload-input" accept="image/*" onChange={handleFileChange} className="hidden" />

              {!browseMode ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setBrowseMode(true)}
                      className="flex flex-col items-center py-5 bg-gray-800 rounded-2xl hover:bg-gray-700 transition"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-300">{alert.tr('Choose Avatar', 'Pilih Avatar')}</span>
                    </button>

                    <label
                      htmlFor="profile-upload-input"
                      className="flex flex-col items-center py-5 bg-gray-800 rounded-2xl hover:bg-gray-700 transition cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-300">{alert.tr('Upload Photo', 'Muat Naik Foto')}</span>
                    </label>
                  </div>

                  {/* Save button for Upload Photo */}
                  {(data.profile_picture || data.avatar_filename) && (
                    <div className="mt-6">
                      {(errors.profile_picture || errors.avatar_filename) && (
                        <p className="text-red-400 text-sm text-center mb-4">
                          {errors.profile_picture || errors.avatar_filename}
                        </p>
                      )}
                      {progress && (
                        <div className="mb-4 text-center">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress.percentage}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{progress.percentage}%</p>
                        </div>
                      )}
                      <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="w-full py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {processing ? alert.tr('Saving…', 'Sedang menyimpan…') : alert.tr('Save', 'Simpan')}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setBrowseMode(false)}
                    className="mb-4 text-sm text-gray-400 hover:text-white flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {alert.tr('Back', 'Kembali')}
                  </button>

                  {/* Avatars Grid */}
                  <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto pb-4">
                    {avatars.map((filename, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const url = `/avatars/${filename}`;
                          setPreview(url);
                          setData('avatar_filename', filename);
                          setData('profile_picture', null);
                        }}
                        className="aspect-square rounded-xl overflow-hidden ring-2 ring-transparent hover:ring-blue-500 transition shadow-lg"
                      >
                        <img
                          src={`/avatars/${filename}`}
                          alt={`Avatar ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Save button for Choose Avatar */}
                  {data.avatar_filename && (
                    <div className="mt-6">
                      {errors.avatar_filename && (
                        <p className="text-red-400 text-sm text-center mb-4">{errors.avatar_filename}</p>
                      )}
                      <button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="w-full py-3 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {processing ? alert.tr('Saving…', 'Sedang menyimpan…') : alert.tr('Save', 'Simpan')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
