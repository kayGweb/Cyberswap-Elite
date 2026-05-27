import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { 
  getFirestore,
  doc as realDoc,
  getDoc as realGetDoc,
  setDoc as realSetDoc,
  updateDoc as realUpdateDoc,
  collection as realCollection,
  addDoc as realAddDoc,
  onSnapshot as realOnSnapshot,
  query as realQuery,
  orderBy as realOrderBy,
  serverTimestamp as realServerTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize real Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const isMockActive = () => {
  return localStorage.getItem('firebase_mock_active') === 'true';
};

export const setMockActive = (active: boolean) => {
  localStorage.setItem('firebase_mock_active', active ? 'true' : 'false');
};

// --- MOCK IMPLEMENTATION ---

// Simple pub-sub for mock onSnapshot
type MockListener = (snapshot: any) => void;
const mockListeners = new Map<string, Set<MockListener>>();

export function triggerMockPath(path: string) {
  const listeners = mockListeners.get(path);
  if (!listeners) return;

  let docs: any[] = [];
  if (path.endsWith('/transactions')) {
    const txsJson = localStorage.getItem(path);
    const txsList = txsJson ? JSON.parse(txsJson) : [];
    docs = txsList.map((tx: any) => ({
      id: tx.id,
      data: () => ({
        ...tx,
        createdAt: {
          toDate: () => new Date(tx.createdAt || Date.now())
        }
      })
    }));
  }

  const snapshot = {
    docs,
    forEach: (cb: any) => docs.forEach(cb)
  };

  listeners.forEach(cb => cb(snapshot));
}

// Mock Firestore Methods
export function doc(database: any, ...pathSegments: string[]): any {
  if (isMockActive()) {
    return { type: 'doc', path: pathSegments.join('/') };
  }
  return realDoc(database, pathSegments[0], ...pathSegments.slice(1));
}

export function collection(database: any, ...pathSegments: string[]): any {
  if (isMockActive()) {
    return { type: 'collection', path: pathSegments.join('/') };
  }
  return realCollection(database, pathSegments[0], ...pathSegments.slice(1));
}

export function query(collectionRef: any, ...constraints: any[]): any {
  if (isMockActive()) {
    return { type: 'query', collectionRef };
  }
  return realQuery(collectionRef, ...constraints);
}

export function orderBy(field: string, direction?: 'asc' | 'desc'): any {
  if (isMockActive()) {
    return { type: 'orderBy', field, direction };
  }
  return realOrderBy(field, direction);
}

export function serverTimestamp(): any {
  if (isMockActive()) {
    return new Date().toISOString();
  }
  return realServerTimestamp();
}

export async function getDoc(docRef: any): Promise<any> {
  if (isMockActive() && docRef?.type === 'doc') {
    const path = docRef.path;
    const dataJson = localStorage.getItem(path);
    const data = dataJson ? JSON.parse(dataJson) : null;
    return {
      exists: () => data !== null,
      data: () => data
    };
  }
  return realGetDoc(docRef);
}

export async function setDoc(docRef: any, data: any): Promise<any> {
  if (isMockActive() && docRef?.type === 'doc') {
    const path = docRef.path;
    localStorage.setItem(path, JSON.stringify(data));
    return;
  }
  return realSetDoc(docRef, data);
}

export async function updateDoc(docRef: any, data: any): Promise<any> {
  if (isMockActive() && docRef?.type === 'doc') {
    const path = docRef.path;
    const existingJson = localStorage.getItem(path);
    const existing = existingJson ? JSON.parse(existingJson) : {};
    const updated = { ...existing, ...data };
    localStorage.setItem(path, JSON.stringify(updated));

    const transactionsMatch = path.match(/^(.+\/transactions)\/[^/]+$/);
    if (transactionsMatch) {
      const collectionPath = transactionsMatch[1];
      const txsJson = localStorage.getItem(collectionPath);
      const txsList = txsJson ? JSON.parse(txsJson) : [];
      const docId = path.split('/').pop();
      const index = txsList.findIndex((tx: any) => tx.id === docId);
      if (index >= 0) {
        txsList[index] = { ...txsList[index], ...data };
        localStorage.setItem(collectionPath, JSON.stringify(txsList));
      }
      triggerMockPath(collectionPath);
    } else {
      triggerMockPath(path);
    }
    return;
  }
  return realUpdateDoc(docRef, data);
}

export async function addDoc(collectionRef: any, data: any): Promise<any> {
  if (isMockActive() && collectionRef?.type === 'collection') {
    const path = collectionRef.path;
    const existingJson = localStorage.getItem(path);
    const list = existingJson ? JSON.parse(existingJson) : [];
    const newDoc = {
      id: Math.random().toString(36).substring(2, 11),
      ...data,
      createdAt: data.createdAt || new Date().toISOString()
    };
    list.unshift(newDoc); // add to start of array
    localStorage.setItem(path, JSON.stringify(list));
    
    // Trigger listeners
    triggerMockPath(path);
    return { id: newDoc.id };
  }
  return realAddDoc(collectionRef, data);
}

export function onSnapshot(queryOrRef: any, callback: any): any {
  if (isMockActive()) {
    const path = queryOrRef?.type === 'query' 
      ? queryOrRef.collectionRef.path 
      : queryOrRef?.path;
    
    if (!path) return () => {};

    if (!mockListeners.has(path)) {
      mockListeners.set(path, new Set());
    }
    mockListeners.get(path)!.add(callback);

    // Trigger once immediately
    triggerMockPath(path);

    return () => {
      mockListeners.get(path)?.delete(callback);
    };
  }
  return realOnSnapshot(queryOrRef, callback);
}

export const signInWithGoogle = () => {
  if (isMockActive()) {
    throw new Error("Cannot sign in with Google in Mock Mode.");
  }
  return signInWithPopup(auth, googleProvider);
};

export const signOut = async () => {
  if (isMockActive()) {
    setMockActive(false);
    localStorage.removeItem('mock_user');
    window.location.reload();
    return;
  }
  return fbSignOut(auth);
};
