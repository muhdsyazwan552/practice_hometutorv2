<?php

namespace App\Services;

use App\Mail\TemporaryPasswordIssued;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

/**
 * Forgot-password flow that emails a readable one-time password such as
 * "Kereta&$001". It is stored alongside (not instead of) the real password,
 * so a stranger who knows a parent's email can't lock them out, and it only
 * works once, within TTL_MINUTES. Signing in with it forces a password change.
 */
class TemporaryPasswordService
{
    public const TTL_MINUTES = 30;

    public const SESSION_FLAG = 'must_change_password';

    private const WORDS = [
        'Kereta', 'Kucing', 'Harimau', 'Rumah', 'Bunga', 'Pokok', 'Gajah', 'Buku',
        'Sekolah', 'Pensel', 'Bintang', 'Bulan', 'Pelangi', 'Sungai', 'Gunung', 'Pantai',
        'Durian', 'Manggis', 'Rambutan', 'Betik', 'Nanas', 'Epal', 'Ikan', 'Burung',
        'Arnab', 'Kancil', 'Penyu', 'Helang', 'Kapal', 'Basikal', 'Lori', 'Awan',
        'Hujan', 'Angin', 'Laut', 'Pulau', 'Taman', 'Meja', 'Kerusi', 'Pintu',
        'Jambatan', 'Payung', 'Kasut', 'Topi', 'Lampu', 'Cawan', 'Pinggan', 'Roti',
        'Kelapa', 'Pisang', 'Tembikai', 'Belon', 'Layang', 'Perahu', 'Kuda', 'Rusa',
        'Singa', 'Zirafah', 'Kasturi', 'Merpati', 'Mentari', 'Embun', 'Bukit', 'Tasik',
    ];

    private const SYMBOLS = ['!', '@', '#', '$', '%', '&', '*', '?'];

    /**
     * Capitalised Malay word + two different symbols + 2–3 digits,
     * e.g. "Kereta&$001" or "Kucing#@07".
     */
    public function generate(): string
    {
        $word = self::WORDS[random_int(0, count(self::WORDS) - 1)];

        $first = random_int(0, count(self::SYMBOLS) - 1);
        $second = (($first + random_int(1, count(self::SYMBOLS) - 1)) % count(self::SYMBOLS));

        $length = random_int(2, 3);
        $digits = str_pad((string) random_int(0, 10 ** $length - 1), $length, '0', STR_PAD_LEFT);

        return $word.self::SYMBOLS[$first].self::SYMBOLS[$second].$digits;
    }

    /**
     * Emails a new temporary password, replacing any earlier unused one.
     */
    public function issue(User $user): void
    {
        $password = $this->generate();

        Cache::put($this->cacheKey($user), Hash::make($password), now()->addMinutes(self::TTL_MINUTES));

        Mail::to($user->email)->send(new TemporaryPasswordIssued($user, $password, self::TTL_MINUTES));
    }

    /**
     * True (and the password is used up) when $password is this user's live
     * temporary password.
     */
    public function consume(User $user, string $password): bool
    {
        $hash = Cache::get($this->cacheKey($user));

        if (! is_string($hash) || ! Hash::check($password, $hash)) {
            return false;
        }

        $this->forget($user);

        return true;
    }

    public function forget(User $user): void
    {
        Cache::forget($this->cacheKey($user));
    }

    private function cacheKey(User $user): string
    {
        return 'temporary-password:'.$user->id;
    }
}
