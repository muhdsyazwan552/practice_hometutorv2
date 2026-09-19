<?php

namespace App\Http\Requests;

use App\Support\ThemeCustomization;
use Illuminate\Foundation\Http\FormRequest;

class ThemeSettingsUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isChild() ?? false;
    }

    public function rules(): array
    {
        $unlockedSlugs = $this->user()->unlockedDashboardThemes()->pluck('dashboard_themes.slug')->all();

        return [
            'dashboard_theme_id' => ['required', 'integer', 'exists:dashboard_themes,id'],
            'learning_space_card_theme_id' => ['required', 'integer', 'exists:dashboard_themes,id'],
            // A card character is only offered for themes the student has unlocked.
            ...ThemeCustomization::rules($unlockedSlugs),
        ];
    }
}
