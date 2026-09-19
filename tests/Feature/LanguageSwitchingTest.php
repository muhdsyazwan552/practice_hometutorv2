<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Tests\TestCase;

class LanguageSwitchingTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authenticated_user_can_switch_between_english_and_bahasa_melayu(): void
    {
        $user = User::factory()->create(['language' => 'en']);

        $response = $this->actingAs($user)->post(route('language.change'), ['locale' => 'ms']);

        $response->assertRedirect();
        $response->assertSessionHas('locale', 'ms');
        $this->assertDatabaseHas('users', ['id' => $user->id, 'language' => 'ms']);
    }

    public function test_the_next_page_is_served_in_the_chosen_language(): void
    {
        // A parent account: the probe page then skips the student-only theme lookup.
        $user = User::factory()->create(['language' => 'en', 'role_id' => User::ROLE_PARENT]);

        // Any page in the web group; SetLocale has to run before HandleInertiaRequests shares the locale.
        Route::middleware('web')->get('/_locale-probe', fn () => Inertia::render('Welcome'));

        $this->actingAs($user)->from('/_locale-probe')->post(route('language.change'), ['locale' => 'ms']);

        $this->actingAs($user->fresh())->get('/_locale-probe')->assertInertia(fn ($page) => $page
            ->where('locale', 'ms')
            ->where('translations.common', trans('common', [], 'ms')));
    }

    public function test_an_invalid_language_is_rejected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->from('/dashboard')->post(route('language.change'), ['locale' => 'fr']);

        $response->assertRedirect('/dashboard');
        $response->assertSessionHasErrors('locale');
    }
}
