// pages/location-and-area-master.js

import Layout from '@/components/Layout'
import React, { useState } from 'react'
import { useLocationArea } from '../context/LocationAreaContext'

const LocationAndAreaMaster = () => {
  // Consume the Context
  const {
    locations,
    areas,
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
  } = useLocationArea()

  // State for modals
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false)
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false)
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false)
  const [isEditAreaOpen, setIsEditAreaOpen] = useState(false)

  // State for form inputs
  const [newLocationName, setNewLocationName] = useState('')
  const [newAreaName, setNewAreaName] = useState('')
  const [editLocationId, setEditLocationId] = useState(null)
  const [editLocationName, setEditLocationName] = useState('')
  const [editAreaId, setEditAreaId] = useState(null)
  const [editAreaName, setEditAreaName] = useState('')

  // Handlers for opening modals
  const openAddLocationModal = () => {
    setNewLocationName('')
    setIsAddLocationOpen(true)
  }

  const openAddAreaModal = () => {
    setNewAreaName('')
    setIsAddAreaOpen(true)
  }

  const openEditLocationModal = (location) => {
    setEditLocationId(location.id)
    setEditLocationName(location.name)
    setIsEditLocationOpen(true)
  }

  const openEditAreaModal = (area) => {
    setEditAreaId(area.id)
    setEditAreaName(area.name)
    setIsEditAreaOpen(true)
  }

  // Handlers for closing modals
  const closeAddLocationModal = () => {
    setIsAddLocationOpen(false)
  }

  const closeAddAreaModal = () => {
    setIsAddAreaOpen(false)
  }

  const closeEditLocationModal = () => {
    setIsEditLocationOpen(false)
    setEditLocationId(null)
    setEditLocationName('')
  }

  const closeEditAreaModal = () => {
    setIsEditAreaOpen(false)
    setEditAreaId(null)
    setEditAreaName('')
  }

  // Handlers for form submissions
  const handleAddLocation = async (e) => {
    e.preventDefault()
    await addLocation(newLocationName)
    closeAddLocationModal()
  }

  const handleAddArea = async (e) => {
    e.preventDefault()
    await addArea(newAreaName)
    closeAddAreaModal()
  }

  const handleEditLocation = async (e) => {
    e.preventDefault()
    await editLocation(editLocationId, editLocationName)
    closeEditLocationModal()
  }

  const handleEditArea = async (e) => {
    e.preventDefault()
    await editArea(editAreaId, editAreaName)
    closeEditAreaModal()
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Location & Area</h1>
          <input
            type="text"
            placeholder="Search..."
            className="w-full md:w-1/3 px-4 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        {/* Display Loading or Error States */}
        {loading && (
          <div className="text-center text-gray-400">Loading...</div>
        )}
        {error && (
          <div className="text-center text-red-500">
            An error occurred: {error.message}
          </div>
        )}

        {/* Tables */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Table */}
            <div className="bg-gray-900 p-4 rounded-md border border-gray-600">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Locations</h2>
                <button
                  onClick={openAddLocationModal}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm"
                >
                  Add
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-2 border-b border-gray-600">
                      Location
                    </th>
                    <th className="text-left px-4 py-2 border-b border-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => (
                    <tr key={location.id}>
                      <td className="px-4 py-2 border-b border-gray-600">
                        {location.name}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-600">
                        <button
                          onClick={() => openEditLocationModal(location)}
                          className="text-blue-500 hover:underline mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLocation(location.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {locations.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-4 py-2 text-center">
                        No locations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Area Table */}
            <div className="bg-gray-900 p-4 rounded-md border border-gray-600">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Areas</h2>
                <button
                  onClick={openAddAreaModal}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm"
                >
                  Add
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-2 border-b border-gray-600">
                      Area
                    </th>
                    <th className="text-left px-4 py-2 border-b border-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area) => (
                    <tr key={area.id}>
                      <td className="px-4 py-2 border-b border-gray-600">
                        {area.name}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-600">
                        <button
                          onClick={() => openEditAreaModal(area)}
                          className="text-blue-500 hover:underline mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteArea(area.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {areas.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-4 py-2 text-center">
                        No areas found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Location Modal */}
        {isAddLocationOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 p-6 rounded-md w-11/12 md:w-1/3">
              <h3 className="text-xl font-semibold mb-4">Add New Location</h3>
              <form onSubmit={handleAddLocation}>
                <div className="mb-4">
                  <label className="block mb-2">Location Name</label>
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeAddLocationModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Area Modal */}
        {isAddAreaOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 p-6 rounded-md w-11/12 md:w-1/3">
              <h3 className="text-xl font-semibold mb-4">Add New Area</h3>
              <form onSubmit={handleAddArea}>
                <div className="mb-4">
                  <label className="block mb-2">Area Name</label>
                  <input
                    type="text"
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeAddAreaModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Location Modal */}
        {isEditLocationOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 p-6 rounded-md w-11/12 md:w-1/3">
              <h3 className="text-xl font-semibold mb-4">Edit Location</h3>
              <form onSubmit={handleEditLocation}>
                <div className="mb-4">
                  <label className="block mb-2">Location Name</label>
                  <input
                    type="text"
                    value={editLocationName}
                    onChange={(e) => setEditLocationName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeEditLocationModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Area Modal */}
        {isEditAreaOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 p-6 rounded-md w-11/12 md:w-1/3">
              <h3 className="text-xl font-semibold mb-4">Edit Area</h3>
              <form onSubmit={handleEditArea}>
                <div className="mb-4">
                  <label className="block mb-2">Area Name</label>
                  <input
                    type="text"
                    value={editAreaName}
                    onChange={(e) => setEditAreaName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeEditAreaModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default LocationAndAreaMaster
