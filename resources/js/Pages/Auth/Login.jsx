import AuthShell from '@/Components/Auth/AuthShell';

export default function Login({ status, canResetPassword }) {
    return <AuthShell initialMode="login" status={status} canResetPassword={canResetPassword} />;
}
