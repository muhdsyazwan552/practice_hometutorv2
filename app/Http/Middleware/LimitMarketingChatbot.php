<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class LimitMarketingChatbot
{
    public function handle(Request $request, Closure $next)
    {
        // Original 20/minute limit, kept as private local rate-limit state (not an instruction cache).
        // Request::ip honours configured trusted proxies rather than arbitrary spoofable headers.
        $directory = config('chatbot.rate_limit_directory', storage_path('framework/chatbot-rate-limits'));
        File::ensureDirectoryExists($directory, 0750);
        $handle = @fopen($directory.'/'.hash('sha256', $request->ip()).'.json', 'c+');
        if ($handle === false) {
            return response()->json(['reply' => $request->input('locale') === 'ms'
                ? 'Maaf, HT Bot sedang tidak tersedia. Sila cuba lagi sebentar.'
                : 'Sorry, HT Bot is temporarily unavailable. Please try again shortly.'], 503);
        }
        try {
            if (!flock($handle, LOCK_EX)) {
                return response()->json(['reply' => 'HT Bot is temporarily unavailable.'], 503);
            }
            $record = json_decode(stream_get_contents($handle), true);
            $now = time();
            if (!is_array($record) || !is_numeric($record['start'] ?? null)
                || !is_numeric($record['count'] ?? null) || $now - $record['start'] >= 60) {
                $record = ['start' => $now, 'count' => 0];
            }
            $record['count']++;
            rewind($handle);
            ftruncate($handle, 0);
            fwrite($handle, json_encode($record));
            fflush($handle);
            $limited = $record['count'] > 20;
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
        if ($limited) {
            return response()->json(['reply' => $request->input('locale') === 'ms'
                ? 'Terlalu banyak mesej dihantar. Sila tunggu sebentar sebelum cuba lagi.'
                : 'Too many messages. Please wait a moment before trying again.'], 429)
                ->header('Retry-After', max(1, 60 - ($now - $record['start'])));
        }
        return $next($request);
    }
}
