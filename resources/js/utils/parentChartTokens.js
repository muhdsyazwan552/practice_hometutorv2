/**
 * Chart roles for the parent-facing views, kept in one place so every chart
 * reads from the same vocabulary rather than raw hex scattered through JSX.
 *
 * These are the app's own brand hues checked against the data-viz gates on the
 * white card surface the charts actually render on:
 *  - series + emphasis together: CVD ΔE 22.1, normal-vision ΔE 30.9, both ≥3:1
 *  - loginRamp as an ordinal ramp: monotone lightness, light end 2.12:1
 */
export const vizTokens = {
    surface: '#ffffff',
    series: '#0788c9',
    emphasis: '#d03b3b',
    grid: '#e2e8f0',
    axis: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    loginRamp: ['#63bde3', '#1f8fca', '#0a6199'],
};

/** Round an axis maximum up to a clean tick value. */
export function niceMax(value, minimum = 5) {
    const target = Math.max(value, minimum);
    const magnitude = 10 ** Math.floor(Math.log10(target));
    const step = target / magnitude <= 2 ? magnitude / 2 : magnitude;

    return Math.max(Math.ceil(target / step) * step, minimum);
}

/**
 * A bar with its data-end rounded and its baseline end square, per the mark
 * spec. `vertical` grows upward from the baseline; otherwise rightward.
 */
export function barPath(x, y, width, height, radius = 4, vertical = true) {
    if (width <= 0 || height <= 0) return '';

    if (vertical) {
        const r = Math.min(radius, width / 2, height);

        return `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
    }

    const r = Math.min(radius, height / 2, width);

    return `M${x},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height - r} Q${x + width},${y + height} ${x + width - r},${y + height} L${x},${y + height} Z`;
}
