<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class MarketingChatbot
{
    public function reply(string $message, string $locale): array
    {
        $normalized = $this->normalize($message);
        if ($this->isGreeting($normalized)) {
            return ['reply' => $locale === 'ms'
                ? "Hi! 👋 Saya HT Bot, pembantu HomeTutor anda.\n\nTanya saya tentang pembelajaran, pendaftaran, langganan atau akses akaun. Bagaimanakah saya boleh membantu?"
                : "Hi! 👋 I'm HT Bot, your HomeTutor assistant.\n\nAsk me about learning, registration, subscriptions or account access. How can I help?"];
        }

        // Read the local source on every request. No knowledge API or instruction cache.
        try {
            $knowledge = json_decode(file_get_contents(config('chatbot.knowledge_file')), true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable $exception) {
            Log::warning('HT Bot local knowledge could not be loaded.', ['type' => get_class($exception)]);
            return $this->unavailable($locale);
        }
        if (!is_array($knowledge) || !is_array($knowledge['topics'] ?? null) || !is_string($knowledge['instructions'] ?? null) || trim($knowledge['instructions']) === '') {
            return $this->unavailable($locale);
        }

        $scores = [];
        foreach ($knowledge['topics'] as $topic => $section) {
            $scores[$topic] = 0;
            if (!is_array($section) || !is_array($section['keywords'] ?? null)) {
                continue;
            }
            foreach ($section['keywords'] as $keyword) {
                if (!$this->containsKeyword($normalized, (string) $keyword)) {
                    continue;
                }
                $scores[$topic] += str_starts_with($keyword, '/') ? 10
                    : (in_array($this->normalize($keyword), ['hello', 'hi', 'hai', 'salam', 'hometutor'], true) ? 0.1 : 1);
            }
        }
        arsort($scores);
        $matched = array_slice(array_keys(array_filter($scores, fn ($score) => $score > 0)), 0, 2);
        $outOfScope = $locale === 'ms'
            ? (trim((string) ($knowledge['out_of_scope_reply'] ?? '')) ?: 'Sila masukkan soalan berkaitan HomeTutor.')
            : 'Please ask a question about HomeTutor.';
        if (!$matched) {
            return ['reply' => $outOfScope];
        }
        $key = trim((string) config('chatbot.api_key'));
        if ($key === '') {
            return $this->unavailable($locale);
        }

        $references = [];
        foreach ($matched as $topic) {
            if (is_string($knowledge['topics'][$topic]['content'] ?? null)) {
                $references[] = strtoupper($topic).":\n".$knowledge['topics'][$topic]['content'];
            }
        }
        $language = $locale === 'ms' ? 'friendly Malaysian Malay' : 'English';
        $instructions = (string) $knowledge['instructions']
            ."\n\nLANDING PAGE LANGUAGE: For customer enquiries that pass the scope gate, reply in {$language}. "
            .'For out-of-scope enquiries, use exactly this localized sentence and nothing else: '.$outOfScope;
        $input = "RELEVANT REFERENCE:\n".implode("\n\n", $references)."\n\nCUSTOMER MESSAGE:\n".$message;
        $body = [
            'model' => config('chatbot.model'),
            'instructions' => $instructions,
            'input' => $input,
            'reasoning' => ['effort' => 'none'],
            'max_output_tokens' => 500,
            'store' => false,
        ];

        $attempts = min(3, max(1, (int) config('chatbot.attempts', 3)));
        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            try {
                $response = Http::withToken($key)->acceptJson()->asJson()
                    ->connectTimeout(10)->timeout((int) config('chatbot.timeout', 30))
                    ->post('https://api.openai.com/v1/responses', $body);
                if ($response->successful()) {
                    $reply = $this->outputText($response->json());
                    if ($reply !== '') {
                        return ['reply' => $reply];
                    }
                    Log::warning('HT Bot response did not contain output text.');
                    return $this->unavailable($locale);
                }
                // Never log credentials, customer messages or raw model responses.
                Log::warning('HT Bot OpenAI request failed.', ['status' => $response->status(), 'attempt' => $attempt]);
                if (!in_array($response->status(), [408, 429, 500, 502, 503, 504], true)) {
                    break;
                }
            } catch (ConnectionException $exception) {
                Log::warning('HT Bot OpenAI connection failed.', ['attempt' => $attempt]);
            }
            if ($attempt < $attempts) {
                usleep(250000 * $attempt);
            }
        }
        return $this->unavailable($locale);
    }

    private function normalize(string $message): string
    {
        $message = mb_strtolower($message, 'UTF-8');
        $message = preg_replace('/[^\p{L}\p{N}\/]+/u', ' ', $message);
        return trim(preg_replace('/\s+/u', ' ', $message));
    }

    private function containsKeyword(string $message, string $keyword): bool
    {
        $keyword = $this->normalize($keyword);
        if ($keyword === '') {
            return false;
        }
        return mb_strlen($keyword) <= 2
            ? in_array($keyword, preg_split('/\s+/u', $message, -1, PREG_SPLIT_NO_EMPTY), true)
            : str_contains($message, $keyword);
    }

    private function isGreeting(string $message): bool
    {
        $words = preg_split('/\s+/u', $message, -1, PREG_SPLIT_NO_EMPTY);
        return count($words) > 0 && count($words) <= 2
            && array_diff($words, ['hi', 'hello', 'hai', 'hey', 'hye', 'salam', 'assalam', 'assalamualaikum', 'waalaikumsalam']) === [];
    }

    private function outputText(mixed $data): string
    {
        if (!is_array($data)) {
            return '';
        }
        if (is_string($data['output_text'] ?? null)) {
            return trim($data['output_text']);
        }
        $text = '';
        foreach ((is_array($data['output'] ?? null) ? $data['output'] : []) as $item) {
            if (($item['type'] ?? null) !== 'message' || !is_array($item['content'] ?? null)) {
                continue;
            }
            foreach ($item['content'] as $part) {
                if (($part['type'] ?? null) === 'output_text' && is_string($part['text'] ?? null)) {
                    $text .= $part['text'];
                }
            }
        }
        return trim($text);
    }

    private function unavailable(string $locale): array
    {
        $reply = $locale === 'ms'
            ? 'Maaf, HT Bot sedang tidak tersedia. Sila cuba lagi sebentar.'
            : 'Sorry, HT Bot is temporarily unavailable. Please try again shortly.';
        $support = config('chatbot.support_url');
        if (is_string($support) && str_starts_with($support, 'https://')) {
            $reply .= ($locale === 'ms' ? "\nBantuan HomeTutor: " : "\nHomeTutor help: ").$support;
        }
        return ['reply' => $reply, 'unavailable' => true];
    }
}
