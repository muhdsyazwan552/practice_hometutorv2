<!DOCTYPE html>
<html lang="en">
<body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;padding:32px">
    <h1 style="margin:0;color:#082c58">Welcome to HomeTutor, {{ $parent->name }}!</h1>
    <p style="line-height:1.7">Your parent account is ready and your email <strong>{{ $parent->email }}</strong> has been verified.</p>
    <p style="margin:24px 0 8px;font-weight:700;color:#082c58">Next steps</p>
    <ol style="line-height:1.9;margin:0;padding-left:20px">
        <li>Choose a learning package for your child.</li>
        <li>Create your child's login.</li>
        <li>Follow their progress from your parent dashboard.</li>
    </ol>
    <p style="margin:28px 0">
        <a href="{{ route('login') }}" style="display:inline-block;background:#0788c9;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">Go to HomeTutor</a>
    </p>
    <p style="font-size:13px;color:#64748b">You can sign in any time with this email address. If you did not create this account, contact HomeTutor support.</p>
</div>
</body>
</html>
