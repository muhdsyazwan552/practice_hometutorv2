<?php

namespace App\Support;

/**
 * A student's Theme Studio choices layered over their unlocked themes.
 *
 * Stored on users.theme_customization and shared with the frontend, where
 * resources/js/utils/dashboardTheme.js turns it into colours for the dashboard
 * and the learning-space card.
 */
class ThemeCustomization
{
    /** Themes that ship a character picture under public/images/characters. */
    public const CHARACTERS = ['cat-club', 'sky-kingdom', 'dino-discovery', 'brick-builders', 'robo-lab', 'study-campus'];

    public const MOTIFS = ['auto', 'star', 'leaf', 'bubble', 'gem', 'block', 'paw', 'spark'];

    private const HEX = 'regex:/^#[0-9a-fA-F]{6}$/';

    public static function defaults(): array
    {
        return [
            'accent' => null,
            'background' => 'scene',
            'background_colours' => ['#dff4ff', '#fef6e4'],
            'card' => [
                'custom' => false,
                'colours' => ['#0788c9', '#7137b8'],
                'character' => null,
                'motif' => 'auto',
                'badge' => null,
            ],
        ];
    }

    /** Validation rules for a `customization` payload. */
    public static function rules(array $unlockedSlugs): array
    {
        $characters = array_values(array_intersect(self::CHARACTERS, $unlockedSlugs));

        return [
            'customization' => ['nullable', 'array'],
            'customization.accent' => ['nullable', 'string', self::HEX],
            'customization.background' => ['nullable', 'in:scene,colour'],
            'customization.background_colours' => ['nullable', 'array', 'size:2'],
            'customization.background_colours.*' => ['required', 'string', self::HEX],
            'customization.card' => ['nullable', 'array'],
            'customization.card.custom' => ['nullable', 'boolean'],
            'customization.card.colours' => ['nullable', 'array', 'size:2'],
            'customization.card.colours.*' => ['required', 'string', self::HEX],
            'customization.card.character' => ['nullable', 'string', 'in:'.implode(',', $characters ?: ['-'])],
            'customization.card.motif' => ['nullable', 'in:'.implode(',', self::MOTIFS)],
            'customization.card.badge' => ['nullable', 'string', 'max:30'],
        ];
    }

    /** Fill gaps with defaults and drop anything unknown, so the frontend always gets the full shape. */
    public static function normalize(?array $value): array
    {
        $defaults = self::defaults();
        $value ??= [];
        $card = is_array($value['card'] ?? null) ? $value['card'] : [];
        $badge = trim((string) ($card['badge'] ?? ''));

        return [
            'accent' => self::hex($value['accent'] ?? null),
            'background' => ($value['background'] ?? null) === 'colour' ? 'colour' : 'scene',
            'background_colours' => self::pair($value['background_colours'] ?? null, $defaults['background_colours']),
            'card' => [
                'custom' => (bool) ($card['custom'] ?? false),
                'colours' => self::pair($card['colours'] ?? null, $defaults['card']['colours']),
                'character' => in_array($card['character'] ?? null, self::CHARACTERS, true) ? $card['character'] : null,
                'motif' => in_array($card['motif'] ?? null, self::MOTIFS, true) ? $card['motif'] : 'auto',
                'badge' => $badge === '' ? null : mb_substr($badge, 0, 30),
            ],
        ];
    }

    private static function hex(mixed $value): ?string
    {
        return is_string($value) && preg_match('/^#[0-9a-fA-F]{6}$/', $value) ? strtolower($value) : null;
    }

    private static function pair(mixed $value, array $fallback): array
    {
        if (! is_array($value) || count($value) !== 2) return $fallback;
        $pair = array_map(fn ($colour) => self::hex($colour), array_values($value));

        return in_array(null, $pair, true) ? $fallback : $pair;
    }
}
