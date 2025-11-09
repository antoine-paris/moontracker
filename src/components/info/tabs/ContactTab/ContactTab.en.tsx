export default function ContactTabEn() {
  const platforms = [
    { name: 'X (Twitter)', slug: 'x', url: 'https://twitter.com/spaceview' },
    { name: 'Facebook', slug: 'facebook', url: 'https://facebook.com/spaceview' },
    { name: 'GitHub', slug: 'github', url: 'https://github.com/antoine-paris/spaceview' },
    { name: 'Instagram', slug: 'instagram', url: 'https://instagram.com' },
    { name: 'YouTube', slug: 'youtube', url: 'https://youtube.com' },
    { name: 'TikTok', slug: 'tiktok', url: 'https://tiktok.com' },
    ];

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
    listStyle: 'none',
    padding: 0,
    margin: '16px 0'
  };

  const tileStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    textDecoration: 'none',
    color: 'inherit',
    background: '#fff',
  };

  return (
    <article>
      <h1>Contact</h1>
      <p>Find SpaceView.me on the following social networks and sharing platforms. You can leave us messages there !</p>
      <ul style={gridStyle} className="info-content-margins">
        {platforms.map(p => (
          <li key={p.slug}>
            <a href={p.url} target="_blank" rel="noopener noreferrer" style={tileStyle} aria-label={p.name}>
              <img
                src={`https://cdn.simpleicons.org/${p.slug}`}
                alt={`${p.name} logo`}
                width={24}
                height={24}
                loading="lazy"
                style={{ flex: '0 0 auto' }}
              />
              <span>{p.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}