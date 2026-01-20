import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FileTreeView } from './components/FileTreeView';
import { MarkdownEditor } from './components/MarkdownEditor';
import { RecommendationPanel } from './components/RecommendationPanel';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import { WorkspaceSettings } from './components/WorkspaceSettings';
import { ResizeIndicator } from './components/ResizeIndicator';
import { db } from './db/database';
import {
  createNote,
  updateNote,
  recordNoteView,
} from './services/noteService';
import { updateHeadingChunks } from './services/headingService';
import {
  getOrCreateDefaultWorkspace,
  updateWorkspaceSettings,
  createWorkspace,
  recordWorkspaceAccess,
} from './services/workspaceService';
import {
  initializeEmbeddingModel,
  type Workspace,
  type WorkspaceSettings as Settings,
} from '@eywa/core';
import { useResizable } from './hooks/useResizable';

export function App() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState('');
  const [viewStartTime, setViewStartTime] = useState<number>(Date.now());
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { width: sidebarWidth, isResizing: isSidebarResizing, handleMouseDown: handleSidebarResize } = useResizable({
    initialWidth: 280,
    minWidth: 200,
    maxWidth: 500,
    direction: 'right',
  });

  const workspace = useLiveQuery(
    async () => {
      if (!workspaceId) {
        return null;
      }
      return await db.workspaces.get(workspaceId);
    },
    [workspaceId]
  );

  const selectedNote = useLiveQuery(
    async () => {
      if (!selectedNoteId) {
        return null;
      }
      return await db.notes.get(selectedNoteId);
    },
    [selectedNoteId]
  );

  useEffect(() => {
    async function initialize(): Promise<void> {
      const ws = await getOrCreateDefaultWorkspace();
      setWorkspaceId(ws.id);
      await initializeEmbeddingModel(ws.settings.embeddingModel);
      setIsInitialized(true);
    }

    initialize();
  }, []);

  useEffect(() => {
    if (selectedNote) {
      setCurrentContent(selectedNote.content);
      setViewStartTime(Date.now());
    }
  }, [selectedNote?.id]);

  useEffect(() => {
    return () => {
      if (selectedNoteId) {
        const viewDuration = Date.now() - viewStartTime;
        recordNoteView(selectedNoteId, viewDuration);
      }
    };
  }, [selectedNoteId, viewStartTime]);

  async function handleCreateNote(): Promise<void> {
    if (!workspace) {
      return;
    }

    const note = await createNote(workspace.id, 'Untitled Note');
    setSelectedNoteId(note.id);
  }

  async function handleCreateWorkspace(): Promise<void> {
    const name = prompt('Enter workspace name:');
    if (!name) {
      return;
    }

    const newWorkspace = await createWorkspace(name, '/');
    setWorkspaceId(newWorkspace.id);
    setSelectedNoteId(null);
  }

  async function handleSelectWorkspace(newWorkspace: Workspace): Promise<void> {
    await recordWorkspaceAccess(newWorkspace.id);
    setWorkspaceId(newWorkspace.id);
    setSelectedNoteId(null);
  }

  async function handleSaveSettings(settings: Partial<Settings>): Promise<void> {
    if (!workspaceId) {
      return;
    }

    console.log('Saving workspace settings:', settings);
    await updateWorkspaceSettings(workspaceId, settings);
    console.log('Settings saved successfully');
  }

  function handleSelectNote(noteId: string): void {
    if (selectedNoteId) {
      const viewDuration = Date.now() - viewStartTime;
      recordNoteView(selectedNoteId, viewDuration);
    }
    setSelectedNoteId(noteId);
  }

  const handleContentChange = useCallback(
    async (content: string): Promise<void> => {
      if (!selectedNoteId) {
        return;
      }

      setCurrentContent(content);
      await updateNote(selectedNoteId, { content });
      await updateHeadingChunks(selectedNoteId, content);
    },
    [selectedNoteId]
  );

  const handleTitleChange = useCallback(
    async (title: string): Promise<void> => {
      if (!selectedNoteId) {
        return;
      }

      await updateNote(selectedNoteId, { title });
    },
    [selectedNoteId]
  );

  const handleAddTag = useCallback(
    async (tag: string): Promise<void> => {
      if (!selectedNote) {
        return;
      }

      const updatedTags = [...selectedNote.tags, tag];
      await updateNote(selectedNote.id, { tags: updatedTags });
    },
    [selectedNote]
  );

  const handleRemoveTag = useCallback(
    async (tag: string): Promise<void> => {
      if (!selectedNote) {
        return;
      }

      const updatedTags = selectedNote.tags.filter((t) => t !== tag);
      await updateNote(selectedNote.id, { tags: updatedTags });
    },
    [selectedNote]
  );

  if (!isInitialized || !workspace) {
    return (
      <div className="app">
        <div className="loading-screen">
          <h2>Initializing Eywa...</h2>
          <p>Loading semantic analysis model...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-layout">
        <aside className="sidebar" style={{ width: `${sidebarWidth}px` }}>
          <WorkspaceSelector
            currentWorkspace={workspace}
            onSelectWorkspace={handleSelectWorkspace}
            onCreateWorkspace={handleCreateWorkspace}
            onManageWorkspace={() => setShowSettings(true)}
          />
          <FileTreeView
            workspace={workspace}
            selectedNoteId={selectedNoteId}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
          />
          <div
            className={`resize-handle right ${isSidebarResizing ? 'resizing' : ''}`}
            onMouseDown={handleSidebarResize}
            title="Drag to resize"
          />
          <ResizeIndicator isResizing={isSidebarResizing} width={sidebarWidth} />
        </aside>
        <main className="main-content">
          {selectedNote ? (
            <MarkdownEditor
              note={selectedNote}
              onContentChange={handleContentChange}
              onTitleChange={handleTitleChange}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          ) : (
            <div className="empty-editor">
              <h2>Welcome to Eywa</h2>
              <p>Select a note or create a new one to get started</p>
            </div>
          )}
        </main>
        <aside className="recommendations">
          {selectedNoteId && selectedNote && (
            <RecommendationPanel
              currentNoteId={selectedNoteId}
              currentNote={selectedNote}
              workspace={workspace}
              onSelectNote={handleSelectNote}
            />
          )}
        </aside>
      </div>
      {showSettings && (
        <WorkspaceSettings
          workspace={workspace}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onFilesImported={() => {
            if (selectedNoteId) {
              setSelectedNoteId(null);
            }
          }}
        />
      )}
    </div>
  );
}
