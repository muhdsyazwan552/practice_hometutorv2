/** Small decorative shape that floats on the learning-space card when it has no character picture. */
export default function ThemeMotif({ shape, className = 'h-full w-full', fillOpacity = 0.5 }) {
  const common = { viewBox: '0 0 24 24', className, fill: 'white', fillOpacity, 'aria-hidden': true };
  switch (shape) {
    case 'star':
      return <svg {...common}><polygon points="12,2 14.9,8.6 22,9.3 16.7,14.1 18.2,21 12,17.3 5.8,21 7.3,14.1 2,9.3 9.1,8.6" /></svg>;
    case 'leaf':
      return <svg {...common}><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(45 12 12)" /></svg>;
    case 'bubble':
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
    case 'gem':
      return <svg {...common}><polygon points="12,2 20,9 12,22 4,9" /></svg>;
    case 'block':
      return <svg {...common}><rect x="3" y="6" width="18" height="12" rx="3" /></svg>;
    case 'paw':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="15" rx="6" ry="5" />
          <circle cx="5" cy="8" r="2.6" />
          <circle cx="11" cy="4.5" r="2.6" />
          <circle cx="17" cy="8" r="2.6" />
        </svg>
      );
    default:
      return <svg {...common}><polygon points="12,2 14,10 22,12 14,14 12,22 10,14 2,12 10,10" /></svg>;
  }
}
