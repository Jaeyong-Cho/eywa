export async function clearIndexedDB(): Promise<void> {
  const databases = await indexedDB.databases();
  
  for (const dbInfo of databases) {
    if (dbInfo.name) {
      indexedDB.deleteDatabase(dbInfo.name);
      console.log(`Deleted database: ${dbInfo.name}`);
    }
  }
  
  console.log('All IndexedDB databases cleared. Please refresh the page.');
}

export function addClearDBButton(): void {
  if (typeof window === 'undefined') {
    return;
  }

  (window as any).clearDB = async () => {
    await clearIndexedDB();
    window.location.reload();
  };

  console.log('To clear IndexedDB, run: clearDB()');
}
