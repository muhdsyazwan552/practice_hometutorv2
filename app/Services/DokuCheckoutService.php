<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class DokuCheckoutService
{
    private const CREATE_PATH = '/v3/checkouts';

    public function isConfigured(): bool
    {
        return filled(config('services.doku.client_id'))
            && filled(config('services.doku.secret_key'))
            && filled(config('services.doku.api_key'));
    }

    public function createCheckout(array $payload): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('DOKU payment credentials are not configured.');
        }

        $body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $timestamp = now('UTC')->format('Y-m-d\TH:i:s.v\Z');

        $response = Http::acceptJson()
            ->withHeaders([
                'Authorization' => 'Basic '.base64_encode(config('services.doku.api_key').':'),
                'Client-Id' => config('services.doku.client_id'),
                'Request-Timestamp' => $timestamp,
                'Signature' => $this->signature($timestamp, self::CREATE_PATH, $body),
                'API-Version' => config('services.doku.api_version'),
                'Idempotency-Id' => data_get($payload, 'id'),
            ])
            ->withBody($body, 'application/json')
            ->timeout(20)
            ->retry(2, 250, throw: false)
            ->post($this->baseUrl().self::CREATE_PATH);

        if (! $response->successful()) {
            $detail = data_get($response->json(), 'error.message')
                ?? data_get($response->json(), 'message')
                ?? data_get($response->json(), 'error')
                ?? 'No error detail returned.';

            if (is_array($detail)) {
                $detail = json_encode($detail, JSON_UNESCAPED_SLASHES);
            }

            throw new RuntimeException(
                'DOKU rejected the checkout request (HTTP '.$response->status().'): '.Str::limit((string) $detail, 500, ''),
            );
        }

        $this->verifyResponse($response, self::CREATE_PATH);

        $data = $response->json();
        $checkoutUrl = is_array($data) ? data_get($data, 'payment.checkout_url') : null;
        if (blank($checkoutUrl) || ! $this->isTrustedCheckoutUrl((string) $checkoutUrl)) {
            throw new RuntimeException('DOKU returned an invalid checkout response.');
        }

        return $data;
    }

    public function retrieveCheckout(string $checkoutId): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('DOKU payment credentials are not configured.');
        }

        if (preg_match('/^[A-Za-z0-9\-_:]{1,128}$/D', $checkoutId) !== 1) {
            throw new RuntimeException('Invalid DOKU checkout ID.');
        }

        $path = '/v3/checkouts/'.rawurlencode($checkoutId);
        $response = Http::acceptJson()
            ->withHeaders([
                'Authorization' => 'Basic '.base64_encode(config('services.doku.api_key').':'),
                'Client-Id' => config('services.doku.client_id'),
                'Request-Timestamp' => now('UTC')->format('Y-m-d\TH:i:s.v\Z'),
                'API-Version' => config('services.doku.api_version'),
            ])
            ->timeout(20)
            ->retry(2, 250, throw: false)
            ->get($this->baseUrl().$path);

        if (! $response->successful()) {
            $detail = data_get($response->json(), 'error.message')
                ?? data_get($response->json(), 'message')
                ?? data_get($response->json(), 'error')
                ?? 'No error detail returned.';

            if (is_array($detail)) {
                $detail = json_encode($detail, JSON_UNESCAPED_SLASHES);
            }

            throw new RuntimeException(
                'DOKU checkout retrieval failed (HTTP '.$response->status().'): '.Str::limit((string) $detail, 500, ''),
            );
        }

        $this->verifyResponse($response, $path);
        $data = $response->json();

        if (! is_array($data) || ! hash_equals($checkoutId, (string) data_get($data, 'id'))) {
            throw new RuntimeException('DOKU returned an invalid checkout status response.');
        }

        return $data;
    }

    public function verifyWebhook(string $rawBody, array $headers, string $requestPath): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        $clientId = $this->header($headers, 'client-id');
        $timestamp = $this->header($headers, 'request-timestamp');
        $provided = $this->header($headers, 'signature');
        $authorization = $this->header($headers, 'authorization');

        if (! hash_equals((string) config('services.doku.client_id'), $clientId)
            || blank($timestamp)) {
            return false;
        }

        try {
            $sentAt = CarbonImmutable::parse($timestamp)->utc();
        } catch (\Throwable) {
            return false;
        }

        if (abs(now('UTC')->diffInSeconds($sentAt, false)) > config('services.doku.webhook_tolerance_seconds')) {
            return false;
        }

        if (filled($provided)) {
            return hash_equals($this->signature($timestamp, $requestPath, $rawBody), $provided);
        }

        $expectedAuthorization = 'Basic '.base64_encode(config('services.doku.api_key').':');

        return hash_equals($expectedAuthorization, $authorization);
    }

    public function signature(string $timestamp, string $requestPath, string $body): string
    {
        $digest = base64_encode(hash('sha256', $body, true));
        $component = implode("\n", [
            config('services.doku.client_id'), $timestamp, $requestPath, $digest,
        ]);

        return 'HMACSHA256='.base64_encode(hash_hmac(
            'sha256', $component, (string) config('services.doku.secret_key'), true,
        ));
    }

    private function verifyResponse(Response $response, string $requestPath): void
    {
        $timestamp = $response->header('Response-Timestamp');
        $provided = $response->header('Signature');
        $authorization = $response->header('Authorization');

        if (blank($provided) && Str::startsWith((string) $authorization, 'HMACSHA256=')) {
            $provided = $authorization;
        }

        // DOKU Malaysia's sandbox currently omits Signature on successful
        // Create Checkout responses. Validate it whenever supplied; the caller
        // separately restricts an unsigned response to an HTTPS doku.com URL.
        if (blank($provided)) {
            return;
        }

        if (blank($timestamp)) {
            throw new RuntimeException('DOKU response timestamp is missing.');
        }

        $digest = base64_encode(hash('sha256', $response->body(), true));
        $component = implode("\n", [config('services.doku.client_id'), $timestamp, $requestPath, $digest]);
        $expected = 'HMACSHA256='.base64_encode(hash_hmac(
            'sha256', $component, (string) config('services.doku.secret_key'), true,
        ));

        if (! hash_equals($expected, $provided)) {
            throw new RuntimeException('DOKU response signature is invalid.');
        }
    }

    private function isTrustedCheckoutUrl(string $url): bool
    {
        $scheme = Str::lower((string) parse_url($url, PHP_URL_SCHEME));
        $host = Str::lower((string) parse_url($url, PHP_URL_HOST));

        return $scheme === 'https'
            && ($host === 'doku.com' || Str::endsWith($host, '.doku.com'));
    }

    private function baseUrl(): string
    {
        return config('services.doku.environment') === 'production'
            ? 'https://api.doku.com'
            : 'https://api-sandbox.doku.com';
    }

    private function header(array $headers, string $name): string
    {
        foreach ($headers as $key => $values) {
            if (Str::lower($key) === Str::lower($name)) {
                return (string) (is_array($values) ? ($values[0] ?? '') : $values);
            }
        }

        return '';
    }
}
