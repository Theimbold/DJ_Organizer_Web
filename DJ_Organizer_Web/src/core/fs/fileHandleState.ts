// This is a simple in-memory state manager to hold file handles during a session.
// It is not persistent across page reloads. A more robust solution might involve
// asking for directory access permissions again on app startup.

export const fileHandleStore = new Map<number, FileSystemFileHandle>();

export const addFileHandle = (trackId: number, handle: FileSystemFileHandle) => {
  fileHandleStore.set(trackId, handle);
};

export const getFileHandle = (trackId: number): FileSystemFileHandle | undefined => {
  return fileHandleStore.get(trackId);
};
