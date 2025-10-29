/**
 * Page Hierarchy Utilities
 *
 * Builds tree structure from flat list of Notion pages
 */

import type { NotionDatabase } from '../services/notion';

/**
 * Page node with children for tree structure
 */
export interface PageNode extends NotionDatabase {
  children: PageNode[];
  level: number;
  isExpanded?: boolean;
}

/**
 * Check if a page is a root page (workspace-level)
 */
function isRootPage(page: NotionDatabase): boolean {
  return page.parent?.type === 'workspace';
}

/**
 * Find all children of a given page
 */
function findChildren(pageId: string, allPages: NotionDatabase[]): NotionDatabase[] {
  return allPages.filter(page =>
    page.parent?.type === 'page_id' && page.parent?.page_id === pageId
  );
}

/**
 * Build hierarchical tree structure from flat list of pages
 * @param pages - Flat list of pages/databases from Notion
 * @returns Tree structure with root pages and their children
 */
export function buildPageHierarchy(pages: NotionDatabase[]): PageNode[] {
  // Filter to only pages (not databases)
  const pagesOnly = pages.filter(p => p.type === 'page');

  // Find root pages (workspace-level)
  const rootPages = pagesOnly.filter(isRootPage);

  // Recursive function to build tree
  function buildNode(page: NotionDatabase, level: number = 0): PageNode {
    const children = findChildren(page.id, pagesOnly);

    return {
      ...page,
      children: children.map(child => buildNode(child, level + 1)),
      level,
      isExpanded: level === 0, // Expand only root level by default
    };
  }

  // Build tree starting from root pages
  return rootPages.map(page => buildNode(page, 0));
}

/**
 * Flatten tree back to list (for searching/filtering)
 */
export function flattenPageTree(nodes: PageNode[]): PageNode[] {
  const result: PageNode[] = [];

  function traverse(node: PageNode) {
    result.push(node);
    node.children.forEach(traverse);
  }

  nodes.forEach(traverse);
  return result;
}

/**
 * Find a specific page in the tree by ID
 */
export function findPageInTree(nodes: PageNode[], pageId: string): PageNode | null {
  for (const node of nodes) {
    if (node.id === pageId) return node;
    const found = findPageInTree(node.children, pageId);
    if (found) return found;
  }
  return null;
}

/**
 * Get the path from root to a specific page (for breadcrumbs)
 */
export function getPagePath(nodes: PageNode[], pageId: string): PageNode[] {
  function findPath(nodes: PageNode[], targetId: string, currentPath: PageNode[] = []): PageNode[] | null {
    for (const node of nodes) {
      const newPath = [...currentPath, node];
      if (node.id === targetId) return newPath;
      const found = findPath(node.children, targetId, newPath);
      if (found) return found;
    }
    return null;
  }

  return findPath(nodes, pageId) || [];
}
