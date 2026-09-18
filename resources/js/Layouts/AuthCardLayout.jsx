import { Head, Link } from '@inertiajs/react';

// Branded single-card shell for the smaller auth steps (email code, forgot
// password, new password) so they match the Login page.
export default function AuthCardLayout({ title, eyebrow, heading, intro, children }) {
    return (
        <>
            <Head title={title} />
            <main className="flex min-h-screen items-center justify-center bg-[#061f42] px-4 py-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(36,190,241,.25),transparent_30%),radial-gradient(circle_at_90%_85%,rgba(242,194,55,.18),transparent_30%)]" />
                <div className="relative w-full max-w-md">
                    <Link href="/" className="mb-6 flex justify-center">
                        <img src="/images/HT_Rectangle_3D.png" alt="HomeTutor" className="h-14 w-auto rounded-xl bg-white p-2 object-contain" />
                    </Link>
                    <div className="rounded-[1.75rem] bg-white p-7 shadow-2xl sm:p-9">
                        {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0788c9]">{eyebrow}</p>}
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#082c58] sm:text-3xl">{heading}</h1>
                        {intro && <div className="mt-3 leading-7 text-slate-500">{intro}</div>}
                        <div className="mt-7">{children}</div>
                    </div>
                </div>
            </main>
        </>
    );
}
