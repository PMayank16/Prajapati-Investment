// pages/product-master.js
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { db } from '@/Firebase'
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid' // For generating unique IDs
import Spinner from '../components/Spinner' // Ensure you have this component

export default function ProductMaster() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true) // Global loading state
  const [operationLoading, setOperationLoading] = useState(false) // Operation-specific loading
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add', 'edit', 'addCategory', 'confirmDelete'
  const [currentCategory, setCurrentCategory] = useState(null)
  const [currentItem, setCurrentItem] = useState(null) // For edit mode
  const [form, setForm] = useState({ name: '' })
  const [deleteTarget, setDeleteTarget] = useState({ type: '', category: null, item: null }) // For delete confirmation

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
        setLoading(false)
      } catch (error) {
        console.error('Error fetching ProductMaster data:', error)
        toast.error('Failed to fetch data. Please try again.')
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Handle add button click for items
  const handleAddClick = (category) => {
    setModalMode('add')
    setCurrentCategory(category)
    setCurrentItem(null)
    setForm({ name: '' })
    setIsModalOpen(true)
  }

  // Handle edit button click for items
  const handleEditClick = (category, item) => {
    setModalMode('edit')
    setCurrentCategory(category)
    setCurrentItem(item)
    setForm({ name: item.name })
    setIsModalOpen(true)
  }

  // Handle modal form input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required.')
      return
    }

    setOperationLoading(true)

    try {
      if (modalMode === 'addCategory') {
        // Add new category
        const categoryName = form.name.trim()
        if (data.hasOwnProperty(categoryName)) {
          toast.error('Category already exists.')
          setOperationLoading(false)
          return
        }

        await updateDoc(productMasterDocRef, {
          [`data.${categoryName}`]: []
        })
        setData(prev => ({ ...prev, [categoryName]: [] }))
        toast.success(`Category "${categoryName}" added successfully.`)
      } else if (modalMode === 'add') {
        // Add item to category
        const newItem = { id: uuidv4(), name: form.name.trim() }
        const updatedCategory = [...(data[currentCategory] || []), newItem]
        await updateDoc(productMasterDocRef, {
          [`data.${currentCategory}`]: updatedCategory
        })
        setData(prev => ({
          ...prev,
          [currentCategory]: updatedCategory
        }))
        toast.success(`Item "${newItem.name}" added to "${currentCategory}".`)
      } else if (modalMode === 'edit') {
        // Edit item
        const updatedCategory = data[currentCategory].map(item =>
          item.id === currentItem.id ? { ...item, name: form.name.trim() } : item
        )
        await updateDoc(productMasterDocRef, {
          [`data.${currentCategory}`]: updatedCategory
        })
        setData(prev => ({
          ...prev,
          [currentCategory]: updatedCategory
        }))
        toast.success(`Item "${form.name.trim()}" updated successfully.`)
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error updating data:', error)
      toast.error('Failed to update data. Please try again.')
    } finally {
      setOperationLoading(false)
    }
  }

  // Handle delete operations
  const handleDelete = async () => {
    const { type, category, item } = deleteTarget
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
      } else if (type === 'item') {
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
      setIsModalOpen(false)
      setDeleteTarget({ type: '', category: null, item: null })
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Failed to delete. Please try again.')
    } finally {
      setOperationLoading(false)
    }
  }

  // Open delete confirmation modal
  const confirmDelete = (type, category, item = null) => {
    setDeleteTarget({ type, category, item })
    setModalMode('confirmDelete')
    setIsModalOpen(true)
  }

  // Render loading spinner if data is being fetched
  if (loading) {
    return (
      <Layout>
        <Head>
          <title>Product Master</title>
          <meta name="description" content="Product Master Page with CRUD operations" />
        </Head>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <Spinner />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Product Master</title>
        <meta name="description" content="Product Master Page with CRUD operations" />
      </Head>
      <div className="min-h-screen bg-black text-white p-8 relative">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-2xl font-extrabold text-left">Product Master</h1>
        </header>

        {/* Add Category Button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => {
              setModalMode('addCategory')
              setIsModalOpen(true)
              setForm({ name: '' })
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow transition duration-200 disabled:opacity-50"
            disabled={operationLoading}
          >
            Add Category
          </button>
        </div>

        {/* Categories Grid */}
        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.keys(data).length === 0 ? (
              <p className="text-center col-span-full">No categories available. Please add a category.</p>
            ) : (
              Object.keys(data).map(category => (
                <section key={category} className="mb-16">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold mb-4 md:mb-0">{category}</h2>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleAddClick(category)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition duration-200 disabled:opacity-50"
                        disabled={operationLoading}
                      >
                        Add Item
                      </button>
                      <button
                        onClick={() => confirmDelete('category', category)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition duration-200 disabled:opacity-50"
                        disabled={operationLoading}
                      >
                        Delete Category
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto bg-black rounded border border-gray-600">
                      <thead>
                        <tr className='bg-gray-800'>
                          <th className="px-6 py-3 border-b border-gray-600">Name</th>
                          <th className="px-6 py-3 border-b border-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data[category] && data[category].length > 0 ? (
                          data[category].map(item => (
                            <tr key={item.id} className="hover:bg-gray-700 transition text-center duration-200">
                              <td className="px-6 py-4 border-b border-gray-600">{item.name}</td>
                              <td className="px-6 py-4 border-b border-gray-600">
                                <button
                                  onClick={() => handleEditClick(category, item)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded mr-2 shadow transition duration-200 disabled:opacity-50"
                                  disabled={operationLoading}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => confirmDelete('item', category, item)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow transition duration-200 disabled:opacity-50"
                                  disabled={operationLoading}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2" className="text-center py-4">No items available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </div>
        </main>

        {/* Modal */}
        <Modal isOpen={isModalOpen} closeModal={() => setIsModalOpen(false)}>
          {modalMode === 'confirmDelete' ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold">Confirm Deletion</h2>
              <p>
                {deleteTarget.type === 'category'
                  ? `Are you sure you want to delete the entire category "${deleteTarget.category}"? This action cannot be undone.`
                  : deleteTarget.item
                    ? `Are you sure you want to delete the item "${deleteTarget.item.name}" from "${deleteTarget.category}"?`
                    : 'Are you sure you want to delete this item?'}
              </p>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded shadow transition duration-200"
                  disabled={operationLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition duration-200 flex items-center justify-center"
                  disabled={operationLoading}
                >
                  {operationLoading ? <Spinner size="small" /> : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold">
                {modalMode === 'addCategory'
                  ? 'Add Category'
                  : modalMode === 'add'
                    ? `Add to "${currentCategory}"`
                    : 'Edit Item'}
              </h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={form.name}
                  onChange={handleChange}
                  className="bg-gray-700 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={operationLoading}
                />
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded shadow transition duration-200"
                    disabled={operationLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition duration-200 flex items-center justify-center"
                    disabled={operationLoading}
                  >
                    {operationLoading ? <Spinner size="small" /> : modalMode === 'addCategory' ? 'Create' : modalMode === 'add' ? 'Save' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal>

        {/* Global Operation Spinner Overlay */}
        {operationLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Spinner />
          </div>
        )}
      </div>
    </Layout>
  )
}
