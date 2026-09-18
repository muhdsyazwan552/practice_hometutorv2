<!DOCTYPE html>
<html lang="en">
<body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;padding:32px">
    <h1 style="margin:0;color:#082c58">Verify your email</h1>
    <p style="line-height:1.7">Hi {{ $name }},</p>
    <p style="line-height:1.7">Use this code to finish creating your HomeTutor parent account.</p>
    <div style="margin:24px 0;padding:20px;border-radius:14px;background:#e0f2fe;text-align:center;font-size:34px;font-weight:700;letter-spacing:10px;color:#075985">{{ $code }}</div>
    <p style="line-height:1.7">The code expires in <strong>{{ $ttlMinutes }} minutes</strong> and can only be used once.</p>
    <p style="font-size:13px;color:#64748b">Never share this code with anyone. If you did not try to register at HomeTutor, you can ignore this email — no account will be created.</p>
</div>
</body>
</html>
