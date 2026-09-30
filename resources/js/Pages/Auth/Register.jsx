import AuthShell from '@/Components/Auth/AuthShell';

// /register opens the same page as /login, on the Register tab.
export default function Register() {
    return <AuthShell initialMode="register" canResetPassword />;
}
