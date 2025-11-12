/**
 * Embed Layout Component
 *
 * Common layout optimized for iframe embedding.
 * Provides minimal styling, auto-refresh, and iframe-friendly dimensions.
 */

import type { ReactNode } from 'react';
import './EmbedLayout.css';

interface EmbedLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function EmbedLayout({ children, title }: EmbedLayoutProps) {
  return (
    <div className="embed-layout">
      <div className="embed-container">
        {title && <h1 className="embed-title">{title}</h1>}
        <div className="embed-content">{children}</div>
      </div>
    </div>
  );
}

