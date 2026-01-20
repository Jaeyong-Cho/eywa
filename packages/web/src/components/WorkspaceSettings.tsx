import { useState } from 'react';
import type { Workspace, WorkspaceSettings as Settings } from '@eywa/core';
import {
  requestDirectoryAccess,
  saveDirectoryHandle,
} from '../services/fileSystemService';
import {
  importMarkdownFiles,
  type ImportResult,
} from '../services/markdownImportService';

interface WorkspaceSettingsProps {
  workspace: Workspace;
  onSave: (settings: Partial<Settings>) => void;
  onClose: () => void;
  onFilesImported?: () => void;
}

export function WorkspaceSettings({
  workspace,
  onSave,
  onClose,
  onFilesImported,
}: WorkspaceSettingsProps) {
  const [settings, setSettings] = useState(workspace.settings);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  function handleSave(): void {
    onSave(settings);
    onClose();
  }

  function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ): void {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleLoadFromFolder(): Promise<void> {
    setIsImporting(true);
    setImportResult(null);

    try {
      const directory = await requestDirectoryAccess();
      if (!directory) {
        setIsImporting(false);
        return;
      }

      saveDirectoryHandle(workspace.id, directory.handle);

      const result = await importMarkdownFiles(workspace.id, directory);
      setImportResult(result);

      if (onFilesImported) {
        onFilesImported();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setImportResult({
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [errorMessage],
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Workspace Settings</h2>
        <div className="settings-section">
          <h3>{workspace.name}</h3>
          <div className="setting-item">
            <label>Workspace Path</label>
            <div className="path-input-group">
              <input
                type="text"
                value={workspace.path}
                disabled
                placeholder="No folder selected"
              />
              <button
                className="btn-secondary"
                onClick={handleLoadFromFolder}
                disabled={isImporting}
              >
                {isImporting ? 'Loading...' : 'Load from Folder'}
              </button>
            </div>
            <small>Import markdown files from a local folder</small>
          </div>
          {importResult && (
            <div className="import-result">
              <h4>Import Results:</h4>
              <ul>
                <li>Imported: {importResult.imported} new files</li>
                <li>Updated: {importResult.updated} files</li>
                <li>Skipped: {importResult.skipped} files</li>
                {importResult.errors.length > 0 && (
                  <li className="error-list">
                    Errors:
                    <ul>
                      {importResult.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            </div>
          )}
          <div className="setting-item">
            <label>Max Recommendations</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.maxRecommendations}
              onChange={(e) =>
                updateSetting('maxRecommendations', parseInt(e.target.value))
              }
            />
          </div>
          <div className="setting-item">
            <label>Semantic Threshold</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={settings.semanticThreshold}
              onChange={(e) =>
                updateSetting('semanticThreshold', parseFloat(e.target.value))
              }
            />
            <small>Minimum similarity score to show recommendations</small>
          </div>
          <div className="setting-item">
            <label>Auto-save Delay (ms)</label>
            <input
              type="number"
              min="0"
              step="100"
              value={settings.autoSaveDelay}
              onChange={(e) =>
                updateSetting('autoSaveDelay', parseInt(e.target.value))
              }
            />
            <small>Delay before auto-saving changes</small>
          </div>
          <div className="setting-item">
            <label>Embedding Model</label>
            <input
              type="text"
              value={settings.embeddingModel}
              onChange={(e) => updateSetting('embeddingModel', e.target.value)}
              disabled
            />
            <small>Model used for semantic analysis</small>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
