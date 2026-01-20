import { nanoid } from 'nanoid';
import { Workspace, WorkspaceSettings } from '../types/note';

const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  embeddingModel: 'Xenova/all-MiniLM-L6-v2',
  maxRecommendations: 5,
  semanticThreshold: 0.1,
  autoSaveDelay: 500,
};

export function createWorkspace(
  name: string,
  path: string,
  settings?: Partial<WorkspaceSettings>
): Workspace {
  if (!name.trim()) {
    throw new Error('Workspace name cannot be empty');
  }

  if (!path.trim()) {
    throw new Error('Workspace path cannot be empty');
  }

  const now = Date.now();

  return {
    id: nanoid(),
    name,
    path,
    createdAt: now,
    lastAccessedAt: now,
    settings: {
      ...DEFAULT_WORKSPACE_SETTINGS,
      ...settings,
    },
  };
}

export function updateWorkspaceSettings(
  workspace: Workspace,
  settings: Partial<WorkspaceSettings>
): Workspace {
  if (Object.keys(settings).length === 0) {
    return workspace;
  }

  return {
    ...workspace,
    settings: {
      ...workspace.settings,
      ...settings,
    },
  };
}

export function updateWorkspaceAccess(workspace: Workspace): Workspace {
  return {
    ...workspace,
    lastAccessedAt: Date.now(),
  };
}

export function validateWorkspaceSettings(
  settings: Partial<WorkspaceSettings>
): boolean {
  if (settings.maxRecommendations !== undefined) {
    if (settings.maxRecommendations < 1 || settings.maxRecommendations > 20) {
      return false;
    }
  }

  if (settings.semanticThreshold !== undefined) {
    if (settings.semanticThreshold < 0 || settings.semanticThreshold > 1) {
      return false;
    }
  }

  if (settings.autoSaveDelay !== undefined) {
    if (settings.autoSaveDelay < 0) {
      return false;
    }
  }

  return true;
}
