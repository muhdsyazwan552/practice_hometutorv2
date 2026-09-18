<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'website_b' => [
        'base_url' => env('WEBSITE_B_API_URL'),
        'client_id' => env('WEBSITE_B_CLIENT_ID'),
        'client_secret' => env('WEBSITE_B_CLIENT_SECRET'),
        'timeout' => (int) env('WEBSITE_B_API_TIMEOUT', 15),
    ],

    'doku' => [
        'environment' => env('DOKU_ENVIRONMENT', 'sandbox'),
        'client_id' => env('DOKU_CLIENT_ID'),
        'secret_key' => env('DOKU_SECRET_KEY'),
        'api_key' => env('DOKU_API_KEY'),
        'api_version' => env('DOKU_API_VERSION', 'arabica.2025-12-01'),
        'webhook_tolerance_seconds' => (int) env('DOKU_WEBHOOK_TOLERANCE_SECONDS', 300),
    ],

    'game_sso' => [
        'games_url' => rtrim((string) env('GAME_SSO_GAMES_URL', ''), '/'),
        'audience' => env('GAME_SSO_AUDIENCE', 'hometutor-games'),
        'client_id' => env('GAME_SSO_CLIENT_ID'),
        'client_secret' => env('GAME_SSO_CLIENT_SECRET'),
        'code_ttl' => (int) env('GAME_SSO_CODE_TTL', 60),
        'require_https' => filter_var(env('GAME_SSO_REQUIRE_HTTPS', true), FILTER_VALIDATE_BOOL),
        'allowed_roles' => array_filter(array_map('trim', explode(',', (string) env('GAME_SSO_ALLOWED_ROLES', 'child')))),
    ],

];
