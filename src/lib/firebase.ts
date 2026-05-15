import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const messaging = async () => (await isSupported()) ? getMessaging(app) : null;
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
async function testConnection() {
  try {
    console.log('Attempting Firestore connection test...');
    const connDoc = doc(db, 'system', 'trading_session');
    await getDocFromServer(connDoc);
    console.log('Firestore connection test: SUCCESS (or permission denied, which is interactive)');
  } catch (error) {
    console.error('Firestore connection test FAILED:', error);
    if(error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("CRITICAL: Firestore backend unreachable. Check internet or Firebase project state.");
      }
      if (error.message.includes('permission-denied')) {
        console.log("Firestore connection test: Permission Denied (this is expected for guest users)");
      }
    }
  }
}
testConnection();

export const login = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
