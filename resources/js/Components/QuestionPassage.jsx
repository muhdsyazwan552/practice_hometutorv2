import React from 'react';
import { addImagePathLabels } from '@/Components/ImagePathLabel';
import { useLanguage } from '@/Contexts/LanguageContext';

/**
 * Comprehension passage (CMCQ / CESSAY) shown above the question.
 * The passage is shared by several questions, so it scrolls on its own
 * instead of pushing the question and answers off screen.
 */
export default function QuestionPassage({ html }) {
    const { locale } = useLanguage();
    // Some passages are only an image, so an <img> counts as content.
    const hasContent = html && (/<img\b/i.test(html) || html.replace(/<[^>]*>|&nbsp;|\s/g, '') !== '');
    if (!hasContent) return null;

    const processedHtml = addImagePathLabels(html.replace(
        /<img([^>]*)>/g,
        '<img$1 class="max-w-full h-auto rounded-lg max-h-80 object-contain mx-auto my-3">',
    ));

    return (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">{locale === 'ms' ? 'Petikan' : 'Passage'}</p>
            <div
                className="max-h-80 overflow-y-auto pr-1 text-gray-800 leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: processedHtml }}
            />
        </div>
    );
}
