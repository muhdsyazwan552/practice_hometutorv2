import React, { useEffect, useRef } from 'react';

// Question images: click to zoom, plus a fallback to the legacy backup host.
// The names (ImagePathLabel / addImagePathLabels) are kept because every
// question view already calls them next to its images; they used to print the
// image URL, which is now hidden from students.

const LEGACY_PRIMARY_BASE = 'https://hometutor.com.my/main/simpana/images/';
const LEGACY_BACKUP_BASE = 'https://asset.cloudhub.my/files/simpana/images/';

// Shown only for images inside an answer option button, where clicking the
// image itself must still select the answer.
const ZOOM_TRIGGER_HTML = '<span data-image-zoom-trigger role="button" aria-label="Zoom image" title="Zoom image">'
    + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg></span>';

const STYLES = `
img[data-zoomable] { cursor: zoom-in; }
button img[data-zoomable], [role="button"] img[data-zoomable] { cursor: inherit; }
[data-image-zoom-trigger] { display: none; }
button [data-image-zoom-trigger] {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; margin: 0 4px; vertical-align: middle; flex-shrink: 0;
    border-radius: 9999px; background: rgba(15, 23, 42, .75); color: #fff; cursor: zoom-in;
}
button [data-image-zoom-trigger]:hover { background: rgba(15, 23, 42, .9); }
[data-image-zoom-overlay] {
    position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center;
    padding: 16px; background: rgba(15, 23, 42, .85); overflow: auto; cursor: zoom-out;
}
[data-image-zoom-overlay] img {
    max-width: 95vw; max-height: 88vh; object-fit: contain; border-radius: 12px;
    background: #fff; padding: 8px; box-shadow: 0 20px 50px rgba(0, 0, 0, .4); cursor: zoom-in;
}
[data-image-zoom-overlay][data-zoomed] { align-items: flex-start; justify-content: flex-start; }
[data-image-zoom-overlay][data-zoomed] img { max-width: none; max-height: none; margin: auto; cursor: zoom-out; }
[data-image-zoom-close] {
    position: fixed; top: 12px; right: 12px; width: 40px; height: 40px; border-radius: 9999px; border: 0;
    background: rgba(255, 255, 255, .95); color: #0f172a; font-size: 24px; line-height: 1; cursor: pointer;
}
`;

const getBackupPath = (source) => {
    if (!source?.startsWith(LEGACY_PRIMARY_BASE)) return null;

    const filename = source.split('/').pop();
    const digitMatch = filename?.match(/^(\d{6})-/);
    if (!digitMatch) return null;

    return `${LEGACY_BACKUP_BASE}${digitMatch[1].split('').join('/')}/${filename}`;
};

const tryLegacyBackup = (image) => {
    if (!image || image.dataset.legacyBackupTried === 'true') return false;

    const backupPath = getBackupPath(image.currentSrc || image.src);
    if (!backupPath) return false;

    image.dataset.legacyBackupTried = 'true';
    image.src = backupPath;

    return true;
};

const closeZoom = () => {
    document.querySelector('[data-image-zoom-overlay]')?.remove();
    document.removeEventListener('keydown', closeOnEscape);
};

function closeOnEscape(event) {
    if (event.key === 'Escape') closeZoom();
}

const openZoom = (image) => {
    closeZoom();

    const overlay = document.createElement('div');
    overlay.dataset.imageZoomOverlay = '';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const zoomed = document.createElement('img');
    zoomed.src = image.currentSrc || image.src;
    zoomed.alt = image.alt || 'Question image';

    const close = document.createElement('button');
    close.type = 'button';
    close.dataset.imageZoomClose = '';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';

    // Small images (e.g. 28px inline pictures) are scaled up to fill most of
    // the screen, up to 4x their real size so they don't turn to mush.
    let fitWidth = 0;
    const fitToScreen = () => {
        const scale = Math.min(
            (window.innerWidth * 0.9) / zoomed.naturalWidth,
            (window.innerHeight * 0.85) / zoomed.naturalHeight,
            4,
        );
        fitWidth = Math.round(zoomed.naturalWidth * scale);
        zoomed.style.width = `${fitWidth}px`;
    };
    zoomed.addEventListener('load', fitToScreen);

    // Clicking the image toggles between "fit to screen" and 2x that size;
    // clicking anywhere else closes the viewer.
    zoomed.addEventListener('click', (event) => {
        event.stopPropagation();
        if (overlay.hasAttribute('data-zoomed')) {
            overlay.removeAttribute('data-zoomed');
            zoomed.style.width = `${fitWidth}px`;
        } else {
            overlay.setAttribute('data-zoomed', '');
            zoomed.style.width = `${fitWidth * 2}px`;
        }
    });
    overlay.addEventListener('click', closeZoom);

    overlay.append(zoomed, close);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', closeOnEscape);
};

if (typeof document !== 'undefined' && !window.__questionImageListenersAdded) {
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    document.addEventListener('error', (event) => {
        if (event.target instanceof HTMLImageElement) tryLegacyBackup(event.target);
    }, true);

    // Capture phase so the zoom button wins over the answer button's onClick.
    document.addEventListener('click', (event) => {
        const trigger = event.target.closest?.('[data-image-zoom-trigger]');
        if (trigger) {
            const image = trigger.previousElementSibling;
            if (image instanceof HTMLImageElement) {
                event.preventDefault();
                event.stopPropagation();
                openZoom(image);
            }
            return;
        }

        const image = event.target.closest?.('img[data-zoomable]');
        if (image && !image.closest('button, [role="button"]')) {
            event.preventDefault();
            event.stopPropagation();
            openZoom(image);
        }
    }, true);

    window.__questionImageListenersAdded = true;
}

export const addImagePathLabels = (html) => {
    if (!html) return html;

    return html.replace(
        /<img\b([^>]*?\bsrc\s*=\s*(["'])[^"']+\2[^>]*)>/gi,
        (_imageTag, attributes) => `<img data-zoomable${attributes}>${ZOOM_TRIGGER_HTML}`,
    );
};

export default function ImagePathLabel({ path }) {
    const triggerRef = useRef(null);

    useEffect(() => {
        const image = triggerRef.current?.previousElementSibling;
        if (!(image instanceof HTMLImageElement)) return;

        image.dataset.zoomable = '';

        // The image may have failed before this effect ran.
        if (image.complete && image.naturalWidth === 0) tryLegacyBackup(image);
    }, [path]);

    if (!path) return null;

    return (
        <span ref={triggerRef} data-image-zoom-trigger role="button" aria-label="Zoom image" title="Zoom image">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
            </svg>
        </span>
    );
}
