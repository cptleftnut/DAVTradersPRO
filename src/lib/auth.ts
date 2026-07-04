import { auth, db } from './firebase';
export { auth, db };
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');

let isSigningIn = false;
let cachedAccessToken: string | null = (() => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('google_access_token');
    } catch (e) {
      return null;
    }
  }
  return null;
})();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('google_access_token');
          } catch (e) {}
        }
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('google_access_token');
        } catch (e) {}
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('google_access_token', cachedAccessToken);
      } catch (e) {}
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('google_access_token');
    } catch (e) {}
  }
};

export const registerWithEmail = async (email: string, password: string): Promise<{ user: User } | null> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error: any) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string): Promise<{ user: User } | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};
