<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ThemeSettingsUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isChild() ?? false;
    }

    public function rules(): array
    {
        return [
            'dashboard_theme_id' => ['required', 'integer', 'exists:dashboard_themes,id'],
            'learning_space_card_theme_id' => ['required', 'integer', 'exists:dashboard_themes,id'],
        ];
    }
}
