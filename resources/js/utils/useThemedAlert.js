import { usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { useLanguage } from '@/Contexts/LanguageContext';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';

export default function useThemedAlert() {
  const { studentTheme } = usePage().props;
  const { locale } = useLanguage();
  const accent = resolveDashboardTheme(studentTheme, studentTheme?.custom).accent;
  const tr = (english, malay) => locale === 'ms' ? malay : english;

  const options = {
    background: '#fff',
    color: '#172033',
    iconColor: accent,
    confirmButtonColor: accent,
    cancelButtonColor: '#e8edf3',
    buttonsStyling: false,
    customClass: {
      popup: 'ht-alert-popup',
      title: 'ht-alert-title',
      htmlContainer: 'ht-alert-content',
      actions: 'ht-alert-actions',
      confirmButton: 'ht-alert-confirm',
      cancelButton: 'ht-alert-cancel',
      loader: 'ht-alert-spinner',
    },
    didOpen: (popup) => popup.style.setProperty('--alert-accent', accent),
  };

  return {
    tr,
    confirm: ({ title, text, confirmText, cancelText, icon = 'question' }) => Swal.fire({
      ...options,
      icon,
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText || tr('Continue', 'Teruskan'),
      cancelButtonText: cancelText || tr('Cancel', 'Batal'),
      reverseButtons: true,
      focusCancel: true,
    }),
    message: ({ title, text, icon = 'info' }) => Swal.fire({
      ...options,
      icon,
      title,
      text,
      confirmButtonText: tr('OK', 'OK'),
    }),
    loading: ({ title, text, owner }) => Swal.fire({
      ...options,
      title: title || tr('Please wait', 'Sila tunggu'),
      text,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      willOpen: (popup) => { if (owner) popup.dataset.loadingOwner = owner; },
      didOpen: (popup) => {
        options.didOpen(popup);
        Swal.showLoading();
      },
    }),
    closeLoading: (owner) => {
      if (Swal.getPopup()?.dataset.loadingOwner === owner) Swal.close();
    },
    close: () => Swal.close(),
  };
}
