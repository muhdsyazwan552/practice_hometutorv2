<!DOCTYPE html>
<html lang="en">
<body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;padding:32px">
    <h1 style="margin:0;color:#082c58">Your temporary password</h1>
    <p style="line-height:1.7">Hi {{ $user->name }},</p>
    <p style="line-height:1.7">We received a request to reset your HomeTutor password. Sign in with this temporary password:</p>
    <div style="margin:24px 0;padding:20px;border-radius:14px;background:#e0f2fe;text-align:center;font-size:26px;font-weight:700;letter-spacing:2px;color:#075985;font-family:'Courier New',monospace">{{ $temporaryPassword }}</div>
    <ul style="line-height:1.8;padding-left:20px">
        <li>It works <strong>once</strong> and expires in <strong>{{ $ttlMinutes }} minutes</strong>.</li>
        <li>You will be asked to choose a new password right after signing in.</li>
        <li>Your current password still works until you change it.</li>
    </ul>
    <p style="margin:28px 0">
        <a href="{{ route('login') }}" style="display:inline-block;background:#0788c9;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">Sign in to HomeTutor</a>
    </p>
    <p style="font-size:13px;color:#64748b">If you did not ask for this, you can ignore this email — your account is unchanged.</p>
</div>
</body>
</html>
