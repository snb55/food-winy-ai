/**
 * Hierarchical Page Selector Component
 *
 * Displays pages in a collapsible tree structure mimicking Notion's interface
 */

import { useState, useEffect } from 'react';
import type { NotionDatabase } from '../services/notion';
import { buildPageHierarchy, type PageNode } from '../utils/pageHierarchy';
import NotionPageIcon from './NotionPageIcon';
import './HierarchicalPageSelector.css';

interface HierarchicalPageSelectorProps {
  pages: NotionDatabase[];
  selectedPageId: string;
  onSelectPage: (pageId: string) => void;
}

export default function HierarchicalPageSelector({
  pages,
  selectedPageId,
  onSelectPage,
}: HierarchicalPageSelectorProps) {
  const [pageTree, setPageTree] = useState<PageNode[]>([]);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Build hierarchy when pages change
  useEffect(() => {
    const tree = buildPageHierarchy(pages);
    setPageTree(tree);

    // Expand root pages by default
    const rootIds = new Set(tree.map(node => node.id));
    setExpandedPages(rootIds);
  }, [pages]);

  const toggleExpand = (pageId: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleImageError = (pageId: string) => {
    setImageErrors(prev => new Set(prev).add(pageId));
  };

  const renderIcon = (node: PageNode) => {
    const hasImageError = imageErrors.has(node.id);

    // Tier 1: Emoji icon
    if (node.icon?.type === 'emoji' && node.icon.emoji) {
      return <span className="page-icon page-icon-emoji">{node.icon.emoji}</span>;
    }

    // Tier 2: External or file image (custom uploaded icon)
    if (!hasImageError && node.icon?.type === 'external' && node.icon.external?.url) {
      return (
        <img
          src={node.icon.external.url}
          alt=""
          className="page-icon page-icon-image"
          onError={() => handleImageError(node.id)}
        />
      );
    }

    if (!hasImageError && node.icon?.type === 'file' && node.icon.file?.url) {
      return (
        <img
          src={node.icon.file.url}
          alt=""
          className="page-icon page-icon-image"
          onError={() => handleImageError(node.id)}
        />
      );
    }

    // Tier 3: Notion default page icon (SVG)
    try {
      return (
        <span className="page-icon">
          <NotionPageIcon size={18} />
        </span>
      );
    } catch {
      // Tier 4: Text fallback (first letter)
      const firstLetter = node.title.charAt(0).toUpperCase() || 'P';
      return <span className="page-icon page-icon-text">{firstLetter}</span>;
    }
  };

  const renderPageNode = (node: PageNode) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedPages.has(node.id);
    const isSelected = node.id === selectedPageId;
    const indent = node.level * 20; // 20px per level

    return (
      <div key={node.id} className="page-node">
        <div
          className={`page-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${indent + 12}px` }}
          onClick={() => onSelectPage(node.id)}
        >
          {/* Expand/collapse arrow */}
          {hasChildren && (
            <span
              className="expand-arrow"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}

          {/* Page icon and title */}
          {renderIcon(node)}
          <span className="page-title" title={node.title}>
            {node.title.length > 40 ? `${node.title.substring(0, 40)}...` : node.title}
          </span>

          {/* Selected checkmark */}
          {isSelected && <span className="selected-check">✓</span>}
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="page-children">
            {node.children.map(renderPageNode)}
          </div>
        )}
      </div>
    );
  };

  if (pageTree.length === 0) {
    return (
      <div className="page-selector-empty">
        <p>No workspace pages found.</p>
        <p className="empty-hint">
          Create and share a page in Notion, then refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="hierarchical-page-selector">
      <div className="page-tree">
        {pageTree.map(renderPageNode)}
      </div>
    </div>
  );
}
