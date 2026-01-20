export interface FileSystemFile {
  name: string;
  path: string;
  content: string;
  lastModified: number;
}

export interface FileSystemDirectory {
  handle: FileSystemDirectoryHandle;
  path: string;
}

export async function requestDirectoryAccess(): Promise<FileSystemDirectory | null> {
  if (!('showDirectoryPicker' in window)) {
    alert('Your browser does not support File System Access API. Please use Chrome, Edge, or Opera.');
    return null;
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'read',
    });

    return {
      handle,
      path: handle.name,
    };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

export async function readMarkdownFiles(
  directory: FileSystemDirectory
): Promise<FileSystemFile[]> {
  const files: FileSystemFile[] = [];

  async function processDirectory(
    dirHandle: FileSystemDirectoryHandle,
    currentPath: string
  ): Promise<void> {
    for await (const entry of dirHandle.values()) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

      if (entry.kind === 'file' && entry.name.endsWith('.md')) {
        const fileHandle = await dirHandle.getFileHandle(entry.name);
        const file = await fileHandle.getFile();
        const content = await file.text();

        files.push({
          name: entry.name,
          path: entryPath,
          content,
          lastModified: file.lastModified,
        });
      } else if (entry.kind === 'directory') {
        const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
        await processDirectory(subDirHandle, entryPath);
      }
    }
  }

  await processDirectory(directory.handle, directory.path);
  return files;
}

export async function verifyDirectoryPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const options = { mode: 'read' } as const;
  
  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }

  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }

  return false;
}

export function saveDirectoryHandle(
  workspaceId: string,
  handle: FileSystemDirectoryHandle
): void {
  const key = `workspace_dir_${workspaceId}`;
  
  const handleData = {
    name: handle.name,
    kind: handle.kind,
  };
  
  localStorage.setItem(key, JSON.stringify(handleData));
  
  (window as any)[`__dir_handle_${workspaceId}`] = handle;
}

export function getDirectoryHandle(
  workspaceId: string
): FileSystemDirectoryHandle | null {
  return (window as any)[`__dir_handle_${workspaceId}`] || null;
}

export function extractTitleFromMarkdown(content: string): string {
  const lines = content.split('\n');
  
  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match) {
      return h1Match[1].trim();
    }
  }

  const firstLine = lines.find(line => line.trim().length > 0);
  if (firstLine) {
    return firstLine.trim().slice(0, 50);
  }

  return 'Untitled';
}
