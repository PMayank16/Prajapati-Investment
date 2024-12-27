// File: context/auth.js

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, db } from '@/Firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

// Custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Sign in
  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign out
  const signOutUser = () => {
    setCurrentUser(null);
    setLoading(false);
    setUserRole(null);
    return firebaseSignOut(auth);
  };

  // Create a new user doc in Firestore (your "myEmployee" collection)
  const createUser = async (uid, data) => {
    const userRef = doc(db, 'myEmployee', uid);
    await setDoc(userRef, data, { merge: true });
  };

  // Get Admin data from Firestore
  const getAdminData = async () => {
    const userRef = doc(db, 'Admin', 'data');
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? snapshot.data() : null;
  };

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);

        const adminData = await getAdminData();
        if (adminData && adminData.email === user.email) {
          setUserRole('Admin');
          setAdmin(adminData);
        } else {
          // Default non-admin user
          setUserRole('myEmployee');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    admin,
    signIn,
    signOut: signOutUser,
    loading,
    newUser: createUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
