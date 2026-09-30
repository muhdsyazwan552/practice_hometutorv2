<?php

namespace App\Support;

class QuestionContentNormalizer
{
    private const LEGACY_IMAGE_BASE = 'https://hometutor.com.my/main/simpana/images';

    private const QUESTION_FILE_BASE = 'https://ptrs-elearning.s3.ap-southeast-1.amazonaws.com/questions';

    private const S3_BASE = 'https://ptrs-elearning.s3.ap-southeast-1.amazonaws.com';

    private const IMAGE_EXTENSIONS = 'jpg|jpeg|png|gif|bmp|webp|svg';

    public static function questionFileUrl(?string $filename): ?string
    {
        return self::fileUrl($filename, 'questions');
    }

    public static function answerFileUrl(?string $filename): ?string
    {
        return self::fileUrl($filename, 'answers');
    }

    public static function sampleAnswerFileUrl(?string $filename): ?string
    {
        return self::fileUrl($filename, 'sample-answers');
    }

    /**
     * Return a URL only when the supplied value is an image file reference.
     * Text stored in *_file fields must stay text, rather than being mistaken
     * for a filename and sent to S3.
     */
    public static function imageFileUrl(?string $value, string $defaultFolder = 'questions'): ?string
    {
        $value = trim((string) $value);

        if ($value === '' || preg_match('/<[^>]+>/', $value)) {
            return null;
        }

        if (preg_match('#^data:image/#i', $value)) {
            return $value;
        }

        $path = parse_url($value, PHP_URL_PATH) ?? $value;

        if (! preg_match('/\.(' . self::IMAGE_EXTENSIONS . ')$/i', $path)) {
            return null;
        }

        return self::fileUrl($value, $defaultFolder);
    }

    private static function fileUrl(?string $filename, string $defaultFolder): ?string
    {
        $filename = trim((string) $filename);

        if ($filename === '') {
            return null;
        }

        if (preg_match('#^(?:https?://|data:|/)#i', $filename)) {
            return $filename;
        }

        if (
            str_starts_with($filename, 'questions/') ||
            str_starts_with($filename, 'answers/') ||
            str_starts_with($filename, 'sample-answers/')
        ) {
            return self::S3_BASE . '/' . ltrim($filename, '/');
        }

        return self::S3_BASE . '/' . trim($defaultFolder, '/') . '/' . ltrim($filename, '/');
    }

    public static function normalizeHtml(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        return preg_replace_callback(
            '/\[IMG_PATH_FILE\]((\d+)-[^"\'<>\s]+)/i',
            function (array $matches) {
                $filename = $matches[1];
                $digitPath = implode('/', str_split($matches[2]));

                return self::LEGACY_IMAGE_BASE . '/' . $digitPath . '/' . $filename;
            },
            $html
        );
    }

    /**
     * True when the value has visible text or an image, so blank editor
     * output such as "<p>&nbsp;</p>" counts as empty.
     */
    public static function hasContent(?string $value): bool
    {
        $value = trim((string) $value);

        if ($value === '') {
            return false;
        }

        if (preg_match('/<img\b/i', $value)) {
            return true;
        }

        $text = html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim(str_replace("\xC2\xA0", ' ', $text)) !== '';
    }

    /**
     * Resolve legacy [IMG_PATH_FILE] placeholders and bare filenames on a raw
     * answers row so its HTML and *_file fields can be rendered directly.
     */
    public static function answerRow(object $answer): object
    {
        foreach (['answer_text', 'reason', 'reason2'] as $field) {
            if (isset($answer->{$field})) {
                $answer->{$field} = self::normalizeHtml($answer->{$field});
            }
        }

        if (! empty($answer->answer_option_file)) {
            $answer->answer_option_file = self::answerFileUrl($answer->answer_option_file);
        }

        if (! empty($answer->reason_file)) {
            $answer->reason_file = self::imageFileUrl($answer->reason_file, 'answers')
                ?? self::normalizeHtml($answer->reason_file);
        }

        return $answer;
    }

    public static function questionHtml(?string $html, ?string $questionFile = null): ?string
    {
        $normalizedHtml = self::normalizeHtml($html) ?? '';
        $fileUrl = self::questionFileUrl($questionFile);

        if ($fileUrl && !str_contains($normalizedHtml, basename($fileUrl))) {
            $escapedUrl = htmlspecialchars($fileUrl, ENT_QUOTES, 'UTF-8');
            $normalizedHtml .= '<p><img src="' . $escapedUrl . '" alt="Question image" /></p>';
        }

        return $normalizedHtml !== '' ? $normalizedHtml : null;
    }
}
