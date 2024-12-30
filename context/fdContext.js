// src/context/FdEntryContext.js

import React, { createContext, useState, useEffect } from 'react';
import { db } from '@/Firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';

// Create the context
export const FdEntryContext = createContext();

// Create the provider component
export const FdEntryProvider = ({ children }) => {
  const [fdEntries, setFdEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const fdCollectionRef = collection(db, 'fdEntries');

  // Fetch FD entries from Firestore
  const fetchFdEntries = async () => {
    setLoading(true);
    try {
      const data = await getDocs(fdCollectionRef);
      const entries = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setFdEntries(entries);
    } catch (error) {
      console.error('Error fetching FD entries:', error);
    }
    setLoading(false);
  };

  // Add a new FD entry
  const addFdEntry = async (newEntry) => {
    try {
      await addDoc(fdCollectionRef, newEntry);
      fetchFdEntries(); // Refresh the list
    } catch (error) {
      console.error('Error adding FD entry:', error);
      throw error;
    }
  };

  // Update an existing FD entry
  const updateFdEntry = async (id, updatedEntry) => {
    try {
      const entryDoc = doc(db, 'fdEntries', id);
      await updateDoc(entryDoc, updatedEntry);
      fetchFdEntries(); // Refresh the list
    } catch (error) {
      console.error('Error updating FD entry:', error);
      throw error;
    }
  };

  // Delete an FD entry
  const deleteFdEntry = async (id) => {
    try {
      const entryDoc = doc(db, 'fdEntries', id);
      await deleteDoc(entryDoc);
      fetchFdEntries(); // Refresh the list
    } catch (error) {
      console.error('Error deleting FD entry:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchFdEntries();
  }, []);

  return (
    <FdEntryContext.Provider
      value={{
        fdEntries,
        loading,
        addFdEntry,
        updateFdEntry,
        deleteFdEntry,
        fetchFdEntries,
      }}
    >
      {children}
    </FdEntryContext.Provider>
  );
};
