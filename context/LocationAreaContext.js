// context/LocationAreaContext.js

import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '@/Firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'

// Create the Context
const LocationAreaContext = createContext()

// Create a custom hook for easy access to the context
export const useLocationArea = () => {
  return useContext(LocationAreaContext)
}

// Create the Provider Component
export const LocationAreaProvider = ({ children }) => {
  // Firestore collections
  const locationsCollection = collection(db, 'locations')
  const areasCollection = collection(db, 'areas')

  // State for data
  const [locations, setLocations] = useState([])
  const [areas, setAreas] = useState([])

  // State for search
  const [searchTerm, setSearchTerm] = useState('')

  // State for loading
  const [loading, setLoading] = useState(true)

  // State for errors
  const [error, setError] = useState(null)

  // Fetch Locations and Areas from Firestore in real-time
  useEffect(() => {
    const unsubscribeLocations = onSnapshot(
      locationsCollection,
      (snapshot) => {
        const locs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setLocations(locs)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching locations: ', err)
        setError(err)
        setLoading(false)
      }
    )

    const unsubscribeAreas = onSnapshot(
      areasCollection,
      (snapshot) => {
        const ars = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setAreas(ars)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching areas: ', err)
        setError(err)
        setLoading(false)
      }
    )

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeLocations()
      unsubscribeAreas()
    }
  }, [])

  // Handle Search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  // Filtered data based on search term
  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Add Location
  const addLocation = async (name) => {
    if (name.trim() === '') return
    try {
      await addDoc(locationsCollection, { name: name.trim() })
    } catch (err) {
      console.error('Error adding location: ', err)
      setError(err)
    }
  }

  // Add Area
  const addArea = async (name) => {
    if (name.trim() === '') return
    try {
      await addDoc(areasCollection, { name: name.trim() })
    } catch (err) {
      console.error('Error adding area: ', err)
      setError(err)
    }
  }

  // Edit Location
  const editLocation = async (id, newName) => {
    if (newName.trim() === '') return
    try {
      const locationDoc = doc(db, 'locations', id)
      await updateDoc(locationDoc, { name: newName.trim() })
    } catch (err) {
      console.error('Error updating location: ', err)
      setError(err)
    }
  }

  // Edit Area
  const editArea = async (id, newName) => {
    if (newName.trim() === '') return
    try {
      const areaDoc = doc(db, 'areas', id)
      await updateDoc(areaDoc, { name: newName.trim() })
    } catch (err) {
      console.error('Error updating area: ', err)
      setError(err)
    }
  }

  // Delete Location
  const deleteLocation = async (id) => {
    if (!confirm('Are you sure you want to delete this location?')) return
    try {
      const locationDoc = doc(db, 'locations', id)
      await deleteDoc(locationDoc)
    } catch (err) {
      console.error('Error deleting location: ', err)
      setError(err)
    }
  }

  // Delete Area
  const deleteArea = async (id) => {
    if (!confirm('Are you sure you want to delete this area?')) return
    try {
      const areaDoc = doc(db, 'areas', id)
      await deleteDoc(areaDoc)
    } catch (err) {
      console.error('Error deleting area: ', err)
      setError(err)
    }
  }

  // Context value to be provided to consumers
  const value = {
    locations: filteredLocations,
    areas: filteredAreas,
    searchTerm,
    handleSearch,
    addLocation,
    addArea,
    editLocation,
    editArea,
    deleteLocation,
    deleteArea,
    loading,
    error,
  }

  return (
    <LocationAreaContext.Provider value={value}>
      {children}
    </LocationAreaContext.Provider>
  )
}
