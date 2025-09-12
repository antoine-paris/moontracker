import React, { useEffect, useState } from 'react';
import appLogo from '../../assets/applogos/android-chrome-192x192.png';

export default function SidebarLocations() {
  const [collapsed, setCollapsed] = useState(false);

  // Synchronise l'état avec le body pour piloter la top bar (texte masqué quand réduit)
  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [collapsed]);

  const width = collapsed ? 64 : 260;

  // Règles locales en !important pour neutraliser un éventuel 28x28 global
  const overrideCss = `
    .mt-sidebar-logo {
      width: 384px !important;
      height: 384px !important;
    }
    .mt-sidebar-brand {
      font-size: 2em !important;
    }
  `;

  const styles: Record<string, React.CSSProperties> = {
    aside: {
      width,
      transition: 'width 160ms ease',
      borderRight: '1px solid var(--mt-border, #e5e7eb)',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'var(--mt-sidebar-bg, #fafafa)',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      height: 96, 
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 8px',
      borderBottom: '1px solid var(--mt-border, #e5e7eb)',
    },
    logo: {
      width: 96,
      height: 96, // doubled from 192
      borderRadius: 6,
      flex: '0 0 auto',
    },
    brandText: {
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: collapsed ? 'none' : 'inline',
      fontSize: '2em', // doubled text height
    },
    toggle: {
      marginLeft: 'auto',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: 18,
      lineHeight: 1,
      padding: 6,
    },
    content: {
      padding: 8,
      overflow: 'auto',
      flex: 1,
    },
  };

  return (
    <aside style={styles.aside} aria-label="Barre latérale des lieux">
      <style dangerouslySetInnerHTML={{ __html: overrideCss }} />
      <div style={styles.header}>
        <img
          src={appLogo}
          alt="MoonTracker logo"
          className="mt-sidebar-logo"
          width={96}
          height={96}
          style={styles.logo}
        />
        <span className="mt-sidebar-brand" style={styles.brandText}>MoonTracker</span>
        <button
          type="button"
          aria-label={collapsed ? 'Développer la barre latérale' : 'Réduire la barre latérale'}
          title={collapsed ? 'Développer' : 'Réduire'}
          onClick={() => setCollapsed(v => !v)}
          style={styles.toggle}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <div style={styles.content}>
        {/* ...existing code... */}
      </div>
    </aside>
  );
}