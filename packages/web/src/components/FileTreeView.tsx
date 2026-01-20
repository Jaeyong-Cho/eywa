import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Workspace } from '@eywa/core';

interface FileTreeViewProps {
  workspace: Workspace;
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  noteId?: string;
  path: string;
}

export function FileTreeView({
  workspace,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
}: FileTreeViewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  const notes = useLiveQuery(() =>
    db.notes.where('workspaceId').equals(workspace.id).toArray()
  );

  if (!notes) {
    return <div className="file-tree-loading">Loading...</div>;
  }

  function buildTree(): TreeNode {
    const root: TreeNode = {
      id: 'root',
      name: workspace.name,
      type: 'folder',
      children: [],
      path: '/',
    };

    const folderMap = new Map<string, TreeNode>();
    folderMap.set('/', root);

    for (const note of notes) {
      const pathParts = (note.filePath || note.title).split('/').filter(Boolean);
      let currentPath = '';
      let currentNode = root;

      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath += '/' + pathParts[i];

        if (!folderMap.has(currentPath)) {
          const folderNode: TreeNode = {
            id: `folder-${currentPath}`,
            name: pathParts[i],
            type: 'folder',
            children: [],
            path: currentPath,
          };
          currentNode.children = currentNode.children || [];
          currentNode.children.push(folderNode);
          folderMap.set(currentPath, folderNode);
        }

        currentNode = folderMap.get(currentPath)!;
      }

      const fileName = pathParts[pathParts.length - 1] || note.title;
      const fileNode: TreeNode = {
        id: note.id,
        name: fileName.replace(/\.md$/, ''),
        type: 'file',
        noteId: note.id,
        path: currentPath + '/' + fileName,
      };

      currentNode.children = currentNode.children || [];
      currentNode.children.push(fileNode);
    }

    function sortTree(node: TreeNode): void {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name);
          }
          return a.type === 'folder' ? -1 : 1;
        });
        node.children.forEach(sortTree);
      }
    }

    sortTree(root);
    return root;
  }

  function toggleFolder(path: string): void {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function renderTree(node: TreeNode, level: number = 0): JSX.Element {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = node.noteId === selectedNoteId;

    if (node.type === 'folder') {
      return (
        <div key={node.id} className="tree-folder">
          <div
            className="tree-item folder"
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            <span className="tree-icon chevron">
              {isExpanded ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              )}
            </span>
            <span className="tree-icon folder-icon">
              {isExpanded ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              )}
            </span>
            <span className="tree-label">{node.name}</span>
            {node.children && (
              <span className="tree-count">{node.children.length}</span>
            )}
          </div>
          {isExpanded && node.children && (
            <div className="tree-children">
              {node.children.map((child) => renderTree(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.id}
        className={`tree-item file ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 16 + 24}px` }}
        onClick={() => node.noteId && onSelectNote(node.noteId)}
      >
        <span className="tree-icon file-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
        </span>
        <span className="tree-label">{node.name}</span>
      </div>
    );
  }

  const tree = buildTree();

  return (
    <div className="file-tree-view">
      <div className="file-tree-header">
        <h3>Files</h3>
        <button className="create-note-btn" onClick={onCreateNote}>
          +
        </button>
      </div>
      <div className="file-tree-content">
        {tree.children && tree.children.length > 0 ? (
          tree.children.map((child) => renderTree(child, 0))
        ) : (
          <div className="empty-tree">
            <p>No files yet</p>
            <button onClick={onCreateNote}>Create your first note</button>
          </div>
        )}
      </div>
    </div>
  );
}
