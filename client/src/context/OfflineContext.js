import React, { createContext, useContext, useState, useEffect } from 'react';
import { openDB } from 'idb';

const OfflineContext = createContext(null);

const DB_NAME = 'BuildingManagementDB';
const DB_VERSION = 1;

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('visitors')) {
        db.createObjectStore('visitors', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('attendance')) {
        db.createObjectStore('attendance', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('payments')) {
        db.createObjectStore('payments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    }
  });
}

export function OfflineProvider({ children }) {
  const [db, setDb] = useState(null);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    initDB().then(setDb);
  }, []);

  const saveOffline = async (store, data) => {
    if (!db) return;
    await db.put(store, { ...data, synced: false, offlineCreated: new Date().toISOString() });
    await db.add('syncQueue', { store, data, action: 'create', timestamp: new Date().toISOString() });
    updatePendingCount();
  };

  const getOfflineData = async (store) => {
    if (!db) return [];
    return db.getAll(store);
  };

  const updatePendingCount = async () => {
    if (!db) return;
    const count = await db.count('syncQueue');
    setPendingSync(count);
  };

  const syncData = async (apiCall) => {
    if (!db || !navigator.onLine) return { success: false };
    
    const queue = await db.getAll('syncQueue');
    const results = [];
    
    for (const item of queue) {
      try {
        await apiCall(item.store, item.data, item.action);
        await db.delete('syncQueue', item.id);
        results.push({ id: item.id, success: true });
      } catch (error) {
        results.push({ id: item.id, success: false, error: error.message });
      }
    }
    
    updatePendingCount();
    return { success: true, results };
  };

  const clearOfflineData = async (store) => {
    if (!db) return;
    const tx = db.transaction(store, 'readwrite');
    await tx.objectStore(store).clear();
  };

  return (
    <OfflineContext.Provider value={{ db, saveOffline, getOfflineData, syncData, clearOfflineData, pendingSync }}>
      {children}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext);
