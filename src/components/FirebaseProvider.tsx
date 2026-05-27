import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, isMockActive, setMockActive, doc, getDoc, setDoc } from '../lib/firebase';

interface UserProfile {
  userId: string;
  fullName: string;
  isKycVerified: boolean;
  favoriteCoins: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  signInMock: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
  signInMock: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const activeUser = user || auth.currentUser;
    if (!activeUser) return;
    const docRef = doc(db, 'users', activeUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setProfile(docSnap.data() as UserProfile);
    }
  };

  const signInMock = async () => {
    setLoading(true);
    setMockActive(true);
    const mockUser = {
      uid: 'sandbox-user-id',
      displayName: 'Sandbox User',
      email: 'sandbox@example.com',
    };
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    setUser(mockUser as any);
    
    const docRef = doc(db, 'users', mockUser.uid);
    const docSnap = await getDoc(docRef);
    let newProfile: UserProfile;
    if (!docSnap.exists()) {
      newProfile = {
        userId: mockUser.uid,
        fullName: mockUser.displayName,
        isKycVerified: false,
        favoriteCoins: ['btc', 'eth', 'usdt'],
      };
      await setDoc(docRef, newProfile);
    } else {
      newProfile = docSnap.data() as UserProfile;
    }
    setProfile(newProfile);
    setLoading(false);
  };

  useEffect(() => {
    if (isMockActive()) {
      const mockUserJson = localStorage.getItem('mock_user');
      const mockUser = mockUserJson ? JSON.parse(mockUserJson) : null;
      if (mockUser) {
        setUser(mockUser);
        const fetchProfile = async () => {
          const docRef = doc(db, 'users', mockUser.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const newProfile: UserProfile = {
              userId: mockUser.uid,
              fullName: mockUser.displayName || 'Sandbox User',
              isKycVerified: false,
              favoriteCoins: ['btc', 'eth', 'usdt'],
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(docSnap.data() as UserProfile);
          }
          setLoading(false);
        };
        fetchProfile();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          const newProfile: UserProfile = {
            userId: u.uid,
            fullName: u.displayName || '',
            isKycVerified: false,
            favoriteCoins: ['btc', 'eth', 'usdt'],
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        } else {
          setProfile(docSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, profile, refreshProfile, signInMock }}>
      {children}
    </AuthContext.Provider>
  );
};
