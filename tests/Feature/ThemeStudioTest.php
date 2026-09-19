<?php

namespace Tests\Feature;

use App\Models\DashboardTheme;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ThemeStudioTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private DashboardTheme $ocean;
    private DashboardTheme $cats;

    protected function setUp(): void
    {
        parent::setUp();

        // The dashboard theme tables were created outside this repo's migrations; build the parts these tests need.
        if (! Schema::hasTable('dashboard_themes')) {
            Schema::create('dashboard_themes', function (Blueprint $table) {
                $table->id();
                $table->string('slug')->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->unsignedInteger('points_cost')->default(0);
                $table->string('preview_image_path')->nullable();
                $table->json('config')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
            Schema::create('student_dashboard_theme_unlocks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id');
                $table->foreignId('dashboard_theme_id');
                $table->string('source')->nullable();
                $table->timestamp('unlocked_at')->nullable();
                $table->timestamps();
            });
        }
        foreach (['active_dashboard_theme_id', 'learning_space_card_theme_id'] as $column) {
            if (! Schema::hasColumn('users', $column)) {
                Schema::table('users', fn (Blueprint $table) => $table->unsignedBigInteger($column)->nullable());
            }
        }

        $this->ocean = DashboardTheme::create(['slug' => 'ocean-blue', 'name' => 'Ocean Blue', 'sort_order' => 1]);
        $this->cats = DashboardTheme::create(['slug' => 'cat-club', 'name' => 'Cat Club', 'sort_order' => 2]);
        $locked = DashboardTheme::create(['slug' => 'robo-lab', 'name' => 'Robo Lab', 'sort_order' => 3]);
        $this->student = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        $this->student->unlockedDashboardThemes()->attach([$this->ocean->id, $this->cats->id]);
        $this->assertNotNull($locked);
    }

    private function payload(array $customization): array
    {
        return ['dashboard_theme_id' => $this->ocean->id, 'learning_space_card_theme_id' => $this->ocean->id, 'customization' => $customization];
    }

    public function test_a_student_can_save_a_custom_theme_and_card(): void
    {
        $this->actingAs($this->student)->patch(route('profile.themes.update'), $this->payload([
            'accent' => '#F97316',
            'background' => 'colour',
            'background_colours' => ['#fde2f3', '#e0e7ff'],
            'card' => ['custom' => true, 'colours' => ['#7c3aed', '#ec4899'], 'character' => 'cat-club', 'motif' => 'paw', 'badge' => '  Ruang Aisyah  '],
        ]))->assertSessionHasNoErrors()->assertRedirect(route('profile.edit'));

        $this->assertSame([
            'accent' => '#f97316',
            'background' => 'colour',
            'background_colours' => ['#fde2f3', '#e0e7ff'],
            'card' => ['custom' => true, 'colours' => ['#7c3aed', '#ec4899'], 'character' => 'cat-club', 'motif' => 'paw', 'badge' => 'Ruang Aisyah'],
        ], $this->student->fresh()->theme_customization);
    }

    public function test_settings_and_every_page_receive_the_saved_choices(): void
    {
        $this->student->update(['active_dashboard_theme_id' => $this->cats->id, 'theme_customization' => ['accent' => '#f97316', 'card' => ['custom' => true]]]);

        $this->actingAs($this->student)->get('/profile')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Profile/Edit')
            ->where('themes.active_dashboard_theme_id', $this->cats->id)
            ->where('themes.customization.accent', '#f97316')
            ->where('themes.customization.card.custom', true)
            ->where('themes.customization.card.colours', ['#0788c9', '#7137b8'])
            ->where('themes.characters', ['cat-club'])
            // Shared with every page so layouts can apply the accent and background.
            ->where('studentTheme.slug', 'cat-club')
            ->where('studentTheme.custom.accent', '#f97316'));
    }

    public function test_invalid_choices_are_rejected(): void
    {
        $this->actingAs($this->student);
        $this->patch(route('profile.themes.update'), $this->payload(['accent' => 'red']))->assertSessionHasErrors('customization.accent');
        $this->patch(route('profile.themes.update'), $this->payload(['background_colours' => ['#ffffff']]))->assertSessionHasErrors('customization.background_colours');
        $this->patch(route('profile.themes.update'), $this->payload(['card' => ['badge' => str_repeat('a', 31)]]))->assertSessionHasErrors('customization.card.badge');
        // Robo Lab exists but is still locked for this student.
        $this->patch(route('profile.themes.update'), $this->payload(['card' => ['character' => 'robo-lab']]))->assertSessionHasErrors('customization.card.character');
    }

    public function test_saving_without_customization_restores_theme_defaults(): void
    {
        $this->student->update(['theme_customization' => ['accent' => '#000000']]);

        $this->actingAs($this->student)->patch(route('profile.themes.update'), [
            'dashboard_theme_id' => $this->cats->id, 'learning_space_card_theme_id' => $this->cats->id,
        ])->assertSessionHasNoErrors();

        $user = $this->student->fresh();
        $this->assertSame($this->cats->id, (int) $user->active_dashboard_theme_id);
        $this->assertNull($user->theme_customization['accent']);
        $this->assertFalse($user->theme_customization['card']['custom']);
    }
}
