import { db } from '../db/database';
import {
  createWorkspace as createWorkspaceCore,
  updateWorkspaceSettings as updateWorkspaceSettingsCore,
  updateWorkspaceAccess,
  type Workspace,
  type WorkspaceSettings,
} from '@eywa/core';

export async function createWorkspace(
  name: string,
  path: string = '/'
): Promise<Workspace> {
  const workspace = createWorkspaceCore(name, path);
  await db.workspaces.add(workspace);
  return workspace;
}

export async function getAllWorkspaces(): Promise<Workspace[]> {
  return await db.workspaces
    .orderBy('lastAccessedAt')
    .reverse()
    .toArray();
}

export async function getWorkspace(
  id: string
): Promise<Workspace | undefined> {
  return await db.workspaces.get(id);
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  settings: Partial<WorkspaceSettings>
): Promise<void> {
  const workspace = await db.workspaces.get(workspaceId);
  if (!workspace) {
    throw new Error(`Workspace with id ${workspaceId} not found`);
  }

  console.log('Current workspace:', workspace);
  console.log('Settings to update:', settings);

  const updatedSettings = {
    ...workspace.settings,
    ...settings,
  };

  console.log('Updated settings:', updatedSettings);

  await db.workspaces.update(workspaceId, {
    settings: updatedSettings,
  });

  console.log('Workspace updated in DB');
}

export async function recordWorkspaceAccess(
  workspaceId: string
): Promise<void> {
  const workspace = await db.workspaces.get(workspaceId);
  if (!workspace) {
    throw new Error(`Workspace with id ${workspaceId} not found`);
  }

  const updatedWorkspace = updateWorkspaceAccess(workspace);
  await db.workspaces.update(workspaceId, {
    lastAccessedAt: updatedWorkspace.lastAccessedAt,
  });
}

export async function deleteWorkspace(id: string): Promise<void> {
  const workspace = await db.workspaces.get(id);
  if (!workspace) {
    throw new Error(`Workspace with id ${id} not found`);
  }

  await db.notes.where('workspaceId').equals(id).delete();
  await db.workspaces.delete(id);
}

export async function getOrCreateDefaultWorkspace(): Promise<Workspace> {
  const workspaces = await getAllWorkspaces();

  if (workspaces.length > 0) {
    return workspaces[0];
  }

  return await createWorkspace('Default Workspace', '/');
}
