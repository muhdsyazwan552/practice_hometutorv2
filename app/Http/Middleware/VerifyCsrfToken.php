<?php
// app/Http/Middleware/VerifyCsrfToken.php
namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Anda bisa exclude routes tertentu di sini jika perlu
        // '/stripe/webhook',
        // '/change-language', // JANGAN exclude ini, kita mau CSRF protection
        '/doku/notification', // DOKU server-to-server webhook, verified by HMAC signature instead of CSRF
        '/api/internal/game-sso/exchange', // hometutor-games server-to-server call, verified by client_id/secret instead of CSRF
    ];
}