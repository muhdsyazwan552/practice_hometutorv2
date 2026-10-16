<?php

return [
    'activation_code_expiry_days' => (int) env('ACTIVATION_CODE_EXPIRY_DAYS', 90),

    // Usernames or emails (comma separated) that can open every level and
    // subject, e.g. demo or QA accounts. FULL_ACCESS_USERS=demo01,qa@hometutor.com.my
    'full_access_users' => array_values(array_filter(array_map(
        fn ($value) => strtolower(trim($value)),
        explode(',', (string) env('FULL_ACCESS_USERS', ''))
    ))),
];
