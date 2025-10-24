export default function InfoLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="g" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f5f7ff" />
          <stop offset="70%" stopColor="#cfd8ff" />
          <stop offset="100%" stopColor="#a8b4ff" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#g)" />
      <path
        d="M34 18c-6 0-11-5-11-11 0-1 .1-2 .3-3A17 17 0 1 0 41 30c-1 .2-2 .3-3 .3-2 0-4-.4-5.8-1.3"
        fill="#000"
        fillOpacity="0.08"
      />
    </svg>
  );
}