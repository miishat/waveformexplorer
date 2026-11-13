import type {Shape} from '../content/reference';
export function SymbolGlyph({
  shape,
  label = '',
  inactive = false,
}: {
  shape: Shape;
  label?: string;
  inactive?: boolean;
}) {
  const common = {fill: 'none', stroke: 'currentColor', strokeWidth: 1.8};
  return (
    <svg
      viewBox="0 0 110 66"
      aria-hidden="true"
      className={`symbol-glyph ${inactive ? 'inactive' : ''}`}
    >
      {shape === 'mux' ? (
        <>
          <path d="M35 10 L70 20 V46 L35 56 Z" {...common} />
          <path d="M12 20H35 M12 46H35 M70 33H98 M52 51V65" {...common} />
        </>
      ) : shape === 'internal' ? (
        <path d="M22 14H88L100 26V40L88 52H22L10 40V26Z" {...common} />
      ) : shape === 'group' ? (
        <>
          <rect x="10" y="8" width="90" height="50" rx="4" {...common} />
          <rect x="20" y="20" width="26" height="26" {...common} />
          <rect x="64" y="20" width="26" height="26" {...common} />
        </>
      ) : shape === 'pin' ? (
        <>
          <path d="M10 33H93" {...common} />
          <circle cx="35" cy="33" r="6" fill="currentColor" />
        </>
      ) : shape === 'control' ? (
        <>
          <path d="M55 55V25 M40 25H70" {...common} />
          <circle cx="55" cy="55" r="5" fill="currentColor" />
        </>
      ) : shape === 'dot' ? (
        <>
          <rect x="25" y="18" width="65" height="34" {...common} />
          <circle cx="21" cy="13" r="5" fill="#ed777e" />
        </>
      ) : shape === 'time' || shape === 'dash' ? (
        <>
          <path d="M55 22V64" strokeDasharray={shape === 'dash' ? '4 4' : undefined} {...common} />
          <text x="55" y="14" textAnchor="middle" fill="currentColor" fontSize="12">
            20 ns
          </text>
        </>
      ) : shape === 'wire' ? (
        <>
          <path d="M8 48H50V20H98 M91 15L99 20L91 25" {...common} />
        </>
      ) : shape === 'marker' ? (
        <>
          <rect x="23" y="20" width="64" height="35" {...common} />
          <text x="82" y="18" fill="#d9ac48" fontSize="24" fontWeight="bold">
            !
          </text>
        </>
      ) : shape === 'role' || shape === 'value' ? (
        <text
          x="55"
          y="40"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="monospace"
          fontSize="22"
        >
          {shape === 'role' ? 'C · D' : '[7:0]'}
        </text>
      ) : (
        <>
          <rect x="22" y="14" width="66" height="40" rx={shape === 'memory' ? 5 : 1} {...common} />
          {shape === 'register' && <path d="M22 42L30 47L22 52" {...common} />}
          <text
            x="55"
            y="40"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="monospace"
            fontSize="23"
          >
            {label ||
              (shape === 'function'
                ? 'f'
                : shape === 'analog'
                  ? 'SP'
                  : shape === 'memory'
                    ? 'M'
                    : '')}
          </text>
        </>
      )}
    </svg>
  );
}
