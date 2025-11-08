export default function InfoLogo({ size = 28, showBackground = true }: { size?: number; showBackground?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px', marginRight: '2px' }}
    >
      <defs>
        <radialGradient id="centerGradient" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffff56" stopOpacity="0.99609" />
          <stop offset="100%" stopColor="#999999" stopOpacity="0.99219" />
        </radialGradient>
      </defs>
      
      {/* Background rounded rectangle - conditionally rendered */}
      {showBackground && (
        <rect x="0" y="0" width="400" height="400" rx="30" ry="30" fill="#0f1829"/>
      )}
      
      
      <>
        <path d="M28.74982,62.99985l0,-34.25004l34.25004,0" stroke="#dc2626" strokeLinecap="round" fill="none" strokeWidth="10"/>
        <path d="M337.00014,28.74982l34.25004,0l0,34.25004" stroke="#dc2626" strokeLinecap="round" fill="none" strokeWidth="10"/>
        <path d="M62.99985,371.25018l-34.25004,0l0,-34.25004" stroke="#dc2626" strokeLinecap="round" fill="none" strokeWidth="10"/>
        <path d="M371.25018,337.00014l0,34.25004l-34.25004,0" stroke="#dc2626" strokeLinecap="round" fill="none" strokeWidth="10"/>
      </>
    
      {/* Main celestial body sphere */}
      <circle cx="200" cy="200" r="158.8" fill="#999999"/>
      
      {/* Shadow/terminator on the sphere */}
      <path d="M200.06015,358.83639c87.69524,0 158.80038,-71.10639 158.80038,-158.84848c0,-87.73085 -71.10513,-158.84848 -158.80038,-158.84848c49.97756,37.49777 79.39473,96.35219 79.39473,158.84848s-29.41717,121.33947 -79.39473,158.84848z" fill="#444444"/>
      
      {/* Crosshair/reticle */}
      <line x1="131.49992" y1="199.94811" x2="165.74996" y2="199.94811" stroke="#dc2626" strokeLinecap="round" strokeWidth="10"/>
      <line x1="234.25003" y1="199.94811" x2="268.50007" y2="199.94811" stroke="#dc2626" strokeLinecap="round" strokeWidth="10"/>
      <line x1="200.05188" y1="131.49993" x2="200.05188" y2="165.74996" stroke="#dc2626" strokeLinecap="round" strokeWidth="10"/>
      <line x1="200.05188" y1="234.25003" x2="200.05188" y2="268.50007" stroke="#dc2626" strokeLinecap="round" strokeWidth="10"/>
      
      {/* Center yellow element */}
      <ellipse cx="200" cy="200" rx="29.6875" ry="30" fill="url(#centerGradient)"/>
      
      {/* Center square frame */}
      <rect x="188.6352" y="188.53144" width="22.83336" height="22.83336" rx="2" ry="2" stroke="#dc2626" strokeWidth="10" fill="none"/>
    </svg>
  );
}