import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Workspace } from '@eywa/core';
import { getDirectoryHandle } from '../services/fileSystemService';
import { syncWorkspaceFiles } from '../services/markdownImportService';

interface WorkspaceSelectorProps {
  currentWorkspace: Workspace;
  onSelectWorkspace: (workspace: Workspace) => void;
  onCreateWorkspace: () => void;
  onManageWorkspace: (workspace: Workspace) => void;
}

export function WorkspaceSelector({
  currentWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onManageWorkspace,
}: WorkspaceSelectorProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const workspaces = useLiveQuery(() =>
    db.workspaces.orderBy('lastAccessedAt').reverse().toArray()
  );

  async function handleSync(): Promise<void> {
    const dirHandle = getDirectoryHandle(currentWorkspace.id);
    if (!dirHandle) {
      setSyncMessage('No folder configured. Use settings to load a folder.');
      setTimeout(() => setSyncMessage(null), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const result = await syncWorkspaceFiles(currentWorkspace.id, {
        handle: dirHandle,
        path: currentWorkspace.path,
      });

      const total = result.imported + result.updated;
      if (total > 0) {
        setSyncMessage(`Synced: ${result.imported} new, ${result.updated} updated`);
      } else {
        setSyncMessage('All files are up to date');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncMessage(`Error: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  }

  if (!workspaces) {
    return <div className="workspace-selector">Loading...</div>;
  }

  return (
    <div className="workspace-selector">
      <div className="workspace-header">
        <select
          className="workspace-select"
          value={currentWorkspace.id}
          onChange={(e) => {
            const workspace = workspaces.find((w) => w.id === e.target.value);
            if (workspace) {
              onSelectWorkspace(workspace);
            }
          }}
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
        <button
          className="workspace-btn"
          onClick={handleSync}
          disabled={isSyncing}
          title="Sync markdown files from folder"
        >
          {isSyncing ? '⟳' : '↻'}
        </button>
        <button
          className="workspace-btn"
          onClick={onCreateWorkspace}
          title="Create new workspace"
        >
          +
        </button>
        <button
          className="workspace-btn"
          onClick={() => onManageWorkspace(currentWorkspace)}
          title="Manage workspace settings"
        >
          ⚙️
        </button>
      </div>
      {syncMessage && (
        <div className="sync-message">{syncMessage}</div>
      )}
    </div>
  );
}
