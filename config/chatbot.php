<?php

return [
    'api_key' => env('OPENAI_LUNA_API_KEY', env('CHATBOT_OPENAI_API_KEY', env('OPENAI_API_KEY', ''))),
    'model' => env('CHATBOT_OPENAI_MODEL', 'gpt-5.6-luna'),
    'knowledge_file' => resource_path('data/chatbot-knowledge.json'),
    'rate_limit_directory' => storage_path('framework/chatbot-rate-limits'),
    'timeout' => 30,
    'attempts' => 3,
    'support_url' => env('CHATBOT_SUPPORT_URL', rtrim(env('APP_URL', 'https://practice.hometutor.com.my'), '/').'/faq?tab=accountSupport'),
];
