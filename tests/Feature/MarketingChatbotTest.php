<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MarketingChatbotTest extends TestCase
{
    private string $rateDirectory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->rateDirectory = sys_get_temp_dir().'/ht-chatbot-test-'.bin2hex(random_bytes(8));
        config(['chatbot.rate_limit_directory' => $this->rateDirectory, 'chatbot.api_key' => 'test-only-key', 'chatbot.support_url' => null]);
        Http::preventStrayRequests();
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->rateDirectory);
        parent::tearDown();
    }

    public function test_greetings_work_locally_in_both_languages_without_an_api_key(): void
    {
        config(['chatbot.api_key' => '']);
        $this->postJson('/api/marketing/chatbot', ['message' => 'Hello!', 'locale' => 'en'])
            ->assertOk()->assertJsonPath('reply', fn ($reply) => str_contains($reply, "I'm HT Bot"));
        $this->postJson('/api/marketing/chatbot', ['message' => 'Salam', 'locale' => 'ms'])
            ->assertOk()->assertJsonPath('reply', fn ($reply) => str_contains($reply, 'Saya HT Bot'));
        Http::assertNothingSent();
    }

    public function test_unrelated_questions_are_rejected_without_calling_openai(): void
    {
        $this->postJson('/api/marketing/chatbot', ['message' => 'What is the weather in London?', 'locale' => 'en'])
            ->assertOk()->assertExactJson(['reply' => 'Please ask a question about HomeTutor.']);
        Http::assertNothingSent();
    }

    public function test_the_reply_endpoint_is_accessible_without_login_or_session_cookies(): void
    {
        $this->postJson('/api/marketing/chatbot', ['message' => 'Hi'])->assertOk();
        Http::assertNothingSent();
    }

    public function test_messages_and_locales_are_validated(): void
    {
        foreach ([[], ['message' => '   '], ['message' => ['invalid']], ['message' => str_repeat('a', 2001)], ['message' => 'Hi', 'locale' => 'fr']] as $payload) {
            $this->postJson('/api/marketing/chatbot', $payload)->assertStatus(422);
        }
        Http::assertNothingSent();
    }

    public function test_relevant_questions_use_local_references_and_the_original_responses_request(): void
    {
        Http::fake(['https://api.openai.com/v1/responses' => Http::response(['output' => [
            ['type' => 'reasoning', 'content' => []],
            ['type' => 'message', 'content' => [['type' => 'output_text', 'text' => 'The annual package is RM490.']]],
        ]])]);
        $this->postJson('/api/marketing/chatbot', ['message' => 'What is the annual package price?', 'locale' => 'en'])
            ->assertOk()->assertExactJson(['reply' => 'The annual package is RM490.']);
        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => $request->url() === 'https://api.openai.com/v1/responses'
            && $request['model'] === 'gpt-5.6-luna' && $request['store'] === false
            && $request['reasoning']['effort'] === 'none' && $request['max_output_tokens'] === 500
            && str_contains($request['input'], '6- and 12-month')
            && str_contains($request['input'], 'CUSTOMER MESSAGE:')
            && str_contains($request['instructions'], 'reply in English')
            && $request->hasHeader('Authorization', 'Bearer test-only-key'));
    }

    public function test_subscription_guidance_uses_registration_then_automatic_activation_after_payment(): void
    {
        Http::fake(['https://api.openai.com/v1/responses' => Http::response(['output_text' => 'Start by registering a parent account.'])]);
        $this->postJson('/api/marketing/chatbot', ['message' => 'How do I subscribe?', 'locale' => 'en'])->assertOk();
        Http::assertSent(fn ($request) => str_contains($request['instructions'], '/register')
            && str_contains($request['input'], 'six-digit')
            && str_contains($request['input'], '6- or 12-month')
            && str_contains($request['input'], 'After confirmed payment')
            && !str_contains($request['input'], 'index_portal.html')
            && !str_contains($request['instructions'], 'purchase an activation code'));
    }

    public function test_payment_help_does_not_claim_to_confirm_a_transaction_or_require_an_activation_email(): void
    {
        Http::fake(['https://api.openai.com/v1/responses' => Http::response(['output_text' => 'Check Payment Log before paying again.'])]);
        $this->postJson('/api/marketing/chatbot', ['message' => 'My payment is pending', 'locale' => 'en'])->assertOk();
        Http::assertSent(fn ($request) => str_contains($request['input'], 'Payment Log')
            && str_contains($request['input'], 'Do not pay again')
            && str_contains($request['input'], 'cannot check transactions')
            && !str_contains($request['input'], 'index_portal.html'));
    }

    public function test_knowledge_edits_are_read_directly_without_a_cache_or_knowledge_api(): void
    {
        File::ensureDirectoryExists($this->rateDirectory);
        $file = $this->rateDirectory.'/knowledge.json';
        config(['chatbot.knowledge_file' => $file]);
        Http::fake(['https://api.openai.com/v1/responses' => Http::response(['output_text' => 'A response'])]);
        foreach (['First local reference', 'Updated local reference'] as $reference) {
            file_put_contents($file, json_encode(['instructions' => 'Local scope rules', 'topics' => ['price' => ['keywords' => ['price'], 'content' => $reference]]]));
            $this->postJson('/api/marketing/chatbot', ['message' => 'price', 'locale' => 'en'])->assertOk();
        }
        $requests = Http::recorded();
        $this->assertStringContainsString('First local reference', $requests[0][0]['input']);
        $this->assertStringContainsString('Updated local reference', $requests[1][0]['input']);
        Http::assertSentCount(2);
    }

    public function test_missing_credentials_fail_gracefully_without_exposing_configuration(): void
    {
        config(['chatbot.api_key' => '']);
        $this->postJson('/api/marketing/chatbot', ['message' => 'HomeTutor price', 'locale' => 'en'])
            ->assertOk()->assertJsonPath('unavailable', true)
            ->assertJsonPath('reply', fn ($reply) => str_contains($reply, 'temporarily unavailable') && !str_contains($reply, 'API_KEY'));
        Http::assertNothingSent();
    }

    public function test_transient_provider_errors_are_retried(): void
    {
        Http::fake(['https://api.openai.com/v1/responses' => Http::sequence()->push([], 503)->push(['output_text' => 'Recovered'])]);
        $this->postJson('/api/marketing/chatbot', ['message' => 'HomeTutor price'])->assertOk()->assertJsonPath('reply', 'Recovered');
        Http::assertSentCount(2);
    }

    public function test_invalid_provider_credentials_are_not_retried_and_are_not_exposed(): void
    {
        Http::fake(['https://api.openai.com/v1/responses' => Http::response(['error' => 'secret provider details'], 401)]);
        $this->postJson('/api/marketing/chatbot', ['message' => 'HomeTutor price'])->assertOk()->assertJsonPath('unavailable', true);
        Http::assertSentCount(1);
    }

    public function test_empty_model_output_is_handled_gracefully(): void
    {
        Http::fake(['https://api.openai.com/v1/responses' => Http::response(['output' => []])]);
        $this->postJson('/api/marketing/chatbot', ['message' => 'HomeTutor price'])->assertOk()->assertJsonPath('unavailable', true);
        Http::assertSentCount(1);
    }

    public function test_the_original_twenty_messages_per_minute_limit_is_preserved(): void
    {
        for ($n = 0; $n < 20; $n++) {
            $this->postJson('/api/marketing/chatbot', ['message' => 'Hi'])->assertOk();
        }
        $this->withHeader('X-Forwarded-For', '203.0.113.99')->postJson('/api/marketing/chatbot', ['message' => 'Hi', 'locale' => 'en'])
            ->assertStatus(429)->assertHeader('Retry-After');
        Http::assertNothingSent();
    }
}
