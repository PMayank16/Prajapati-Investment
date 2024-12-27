// contexts/ProductMasterContext.js
import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '@/Firebase'
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'

const ProductMasterContext = createContext()

export const useProductMaster = () => {
  return useContext(ProductMasterContext)
}

export const ProductMasterProvider = ({ children }) => {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true) // Global loading state
  const [operationLoading, setOperationLoading] = useState(false) // Operation-specific loading

  const productMasterDocRef = doc(db, 'ProductMaster', 'masterData')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const docSnap = await getDoc(productMasterDocRef)
        if (docSnap.exists()) {
          setData(docSnap.data().data || {})
        } else {
          // Initialize the document if it doesn't exist
          await setDoc(productMasterDocRef, { data: {} })
          setData({})
        }
      } catch (error) {
        console.error('Error fetching ProductMaster data:', error)
        toast.error('Failed to fetch data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Add Category
  const addCategory = async (categoryName) => {
    if (data.hasOwnProperty(categoryName)) {
      toast.error('Category already exists.')
      return
    }
    setOperationLoading(true)
    try {
      await updateDoc(productMasterDocRef, {
        [`data.${categoryName}`]: []
      })
      setData(prev => ({ ...prev, [categoryName]: [] }))
      toast.success(`Category "${categoryName}" added successfully.`)
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Failed to add category. Please try again.')
    } finally {
      setOperationLoading(false)
    }
  }

  // Add Item
  const addItem = async (category, itemName) => {
    const newItem = { id: uuidv4(), name: itemName.trim() }
    const updatedCategory = [...(data[category] || []), newItem]
    setOperationLoading(true)
    try {
      await updateDoc(productMasterDocRef, {
        [`data.${category}`]: updatedCategory
      })
      setData(prev => ({
        ...prev,
        [category]: updatedCategory
      }))
      toast.success(`Item "${newItem.name}" added to "${category}".`)
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item. Please try again.')
    } finally {
      setOperationLoading(false)
    }
  }

  // Edit Item
  const editItem = async (category, itemId, newName) => {
    const updatedCategory = data[category].map(item =>
      item.id === itemId ? { ...item, name: newName.trim() } : item
    )
    setOperationLoading(true)
    try {
      await updateDoc(productMasterDocRef, {
        [`data.${category}`]: updatedCategory
      })
      setData(prev => ({
        ...prev,
        [category]: updatedCategory
      }))
      toast.success(`Item "${newName.trim()}" updated successfully.`)
    } catch (error) {
      console.error('Error editing item:', error)
      toast.error('Failed to edit item. Please try again.')
    } finally {
      setOperationLoading(false)
    }
  }

  // Delete Category or Item
  const deleteTarget = async (type, category, item = null) => {
    setOperationLoading(true)
    try {
      if (type === 'category') {
        // Delete entire category
        await updateDoc(productMasterDocRef, {
          [`data.${category}`]: deleteField()
        })
        const newData = { ...data }
        delete newData[category]
        setData(newData)
        toast.success(`Category "${category}" deleted successfully.`)
      } else if (type === 'item' && item) {
        // Delete single item
        const updatedCategory = data[category].filter(i => i.id !== item.id)
        await updateDoc(productMasterDocRef, {
          [`data.${category}`]: updatedCategory
        })
        setData(prev => ({
          ...prev,
          [category]: updatedCategory
        }))
        toast.success(`Item "${item.name}" deleted successfully.`)
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Failed to delete. Please try again.')
    } finally {
      setOperationLoading(false)
    }
  }

  const value = {
    data,
    loading,
    operationLoading,
    addCategory,
    addItem,
    editItem,
    deleteTarget
  }

  return (
    <ProductMasterContext.Provider value={value}>
      {children}
    </ProductMasterContext.Provider>
  )
}
