// pages/clientManagement.js

import React, { useState, useContext, useMemo, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { CSVLink } from "react-csv";
import Layout from "@/components/Layout";
import { CiEdit } from "react-icons/ci";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { ClientContext } from "@/context/ClientContext";
import { useLocationArea } from "@/context/LocationAreaContext";

function ClientManagement() {
  const {
    clients,
    addClient,
    updateClient,
    deleteClient,
    exportToExcel,
    exportToPDF,
    addFamilyMember,
  } = useContext(ClientContext);
  const {
    locations,
    areas,
    loading: locAreaLoading,
    error: locAreaError,
  } = useLocationArea(); // Use the custom hook

  const [isLoading, setIsLoading] = useState(false);

  // Existing State Variables
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedArea, setSelectedArea] = useState(""); // New state for Area

  const [formStep, setFormStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editClientId, setEditClientId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false); // loading state for add/edit
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const [clientForm, setClientForm] = useState({
    name: "",
    familyName: "",
    dob: "",
    email: "",
    number: "",
    address: "",
    birthCity: "",
    maritalStatus: "No",
    spouseName: "",
    panCard: "",
    aadhaarCard: "",
    passportNumber: "",
    voterNumber: "",
    canteenCardNumber: "",
    profilePic: "",
    city: "",
    state: "",
    location: "",
    area: "", // New field for Area
  });

  // **New State Variables for Detail Modal**
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // **New States for Family Members**
  const [showFamilyMemberForm, setShowFamilyMemberForm] = useState(false);
  const [showFamilyMembersList, setShowFamilyMembersList] = useState(false);
  const [familyMemberForm, setFamilyMemberForm] = useState({
    relation: "",
    name: "",
    dob: "",
    birthCity: "",
    aadhaarCard: "",
    panCard: "",
    passportNumber: "",
    number: "",
    email: "",
  });

  const handleSearch = (e) => setSearch(e.target.value);

  // Get unique cities and locations from clients
  const uniqueCities = useMemo(() => {
    const citySet = new Set(
      clients.map((client) => client.city || "").filter(Boolean)
    );
    return ["", ...Array.from(citySet)];
  }, [clients]);

  const uniqueLocations = useMemo(() => {
    const locationSet = new Set(
      clients.map((client) => client.location || "").filter(Boolean)
    );
    return ["", ...Array.from(locationSet)];
  }, [clients]);

  const uniqueAreas = useMemo(() => {
    const areaSet = new Set(
      clients.map((client) => client.area || "").filter(Boolean)
    );
    return ["", ...Array.from(areaSet)];
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter(
      (client) =>
        client.name &&
        client.name.toLowerCase().includes(search.toLowerCase()) && // Ensure client.name exists
        (selectedCity ? client.city === selectedCity : true) &&
        (selectedLocation ? client.location === selectedLocation : true) &&
        (selectedArea ? client.area === selectedArea : true) // Filter by Area as well
    );
  }, [clients, search, selectedCity, selectedLocation, selectedArea]);

  const requestDelete = (client) => {
    // Show confirmation modal before delete
    setClientToDelete(client);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete.id);
    }
    setShowDeleteConfirm(false);
    setClientToDelete(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientForm((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setClientForm((prevState) => ({
        ...prevState,
        profilePic: reader.result,
      }));
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const openAddForm = () => {
    setIsEditing(false);
    setEditClientId(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (client) => {
    setIsEditing(true);
    setEditClientId(client.id);
    const updatedClient = { ...client };
    setClientForm({ ...updatedClient });
    setShowForm(true);
  };

  const resetForm = () => {
    setClientForm({
      name: "",
      familyName: "",
      dob: "",
      email: "",
      number: "",
      address: "",
      birthCity: "",
      maritalStatus: "No",
      spouseName: "",
      panCard: "",
      aadhaarCard: "",
      passportNumber: "",
      voterNumber: "",
      canteenCardNumber: "",
      profilePic: "",
      city: "",
      state: "",
      location: "",
      area: "",
    });
    setFormStep(1);
    setErrorMessage("");
    setSuccessMessage("");
  };

  function generateClientCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      if (isEditing && editClientId) {
        await updateClient(editClientId, { ...clientForm });
        setShowForm(false);
        resetForm();
        setIsEditing(false);
        setEditClientId(null);
        setSuccessMessage("Client updated successfully!");
      } else {
        const clientNumber = generateClientCode();
        await addClient({ ...clientForm, clientNumber });
        setShowForm(false);
        resetForm();
        setSuccessMessage("Client added successfully!");
      }
    } catch (error) {
      console.error("Error while saving client:", error);
      setErrorMessage("An error occurred while saving the client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = () => {
    const requiredFields = ["name", "familyName", "dob", "number"];
    return requiredFields.every((field) => clientForm[field]?.trim() !== "");
  };

  const goToStep2 = () => {
    if (!canProceedToStep2()) {
      setErrorMessage("Please fill in all required fields before proceeding.");
      return;
    }
    setErrorMessage("");
    setFormStep(2);
  };

  useEffect(() => {
    let timer;
    if (successMessage) {
      // Clear the success message after 3 seconds
      timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Handle Family Member Form Changes
  const handleFamilyMemberInputChange = (e) => {
    const { name, value } = e.target;
    setFamilyMemberForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openFamilyMemberForm = () => {
    setFamilyMemberForm({
      relation: "",
      name: "",
      dob: "",
      birthCity: "",
      aadhaarCard: "",
      panCard: "",
      passportNumber: "",
      number: "",
      email: "",
    });
    setShowFamilyMemberForm(true);
  };

  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;

    // Add family member to the client
    try {
      await addFamilyMember(selectedClient.id, familyMemberForm);
      // Refresh the selected client data from clients context
      const updatedClient = clients.find((c) => c.id === selectedClient.id);
      setSelectedClient(updatedClient || selectedClient);
      setShowFamilyMemberForm(false);
      setSuccessMessage("Family member added successfully!");
    } catch (error) {
      console.error("Error adding family member:", error);
    }
  };

  const toggleFamilyMembersList = () => {
    setShowFamilyMembersList(!showFamilyMembersList);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 text-white">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
          <h1 className="text-3xl font-semibold">Client Management</h1>
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search clients..."
              className="p-2 rounded-lg border border-gray-300 text-white bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={openAddForm}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Clients
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 text-green-400 font-semibold">
            {successMessage}
          </div>
        )}

        {/* Add/Edit Client Modal Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="relative bg-black text-white border border-gray-700 p-6 rounded-lg shadow-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="absolute top-3 right-3 text-xl text-gray-300 hover:text-gray-400 focus:outline-none"
              >
                &times;
              </button>

              <h2 className="text-2xl text-center font-semibold mb-4 text-white">
                {isEditing ? "Edit Client" : "Add New Client"}
              </h2>

              <form onSubmit={handleFormSubmit}>
                <div className="flex justify-center items-center mb-4">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      formStep === 1 ? "bg-blue-600" : "bg-gray-500"
                    } text-sm mr-2 text-white`}
                  >
                    1
                  </div>
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      formStep === 2 ? "bg-blue-600" : "bg-gray-500"
                    } text-sm text-white`}
                  >
                    2
                  </div>
                </div>

                {formStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {errorMessage && (
                      <div className="md:col-span-2 text-red-400 text-sm mb-2">
                        {errorMessage}
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block font-medium mb-1">
                        Profile Picture
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="text-sm p-1 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {clientForm.profilePic && (
                        <img
                          src={clientForm.profilePic}
                          alt="Profile"
                          className="mt-2 w-12 h-12 rounded-full object-cover"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Name *</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter client's first name"
                        value={clientForm.name}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">
                        Family Name *
                      </label>
                      <input
                        type="text"
                        name="familyName"
                        placeholder="Enter client's family name"
                        value={clientForm.familyName}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">D.O.B *</label>
                      <input
                        type="date"
                        name="dob"
                        placeholder="Select Date of Birth"
                        value={clientForm.dob}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        name="number"
                        placeholder="Enter phone number"
                        value={clientForm.number}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">
                        WhatsApp Number (Optional)
                      </label>
                      <input
                        type="text"
                        name="whatsappNumber"
                        placeholder="Enter WhatsApp number"
                        value={clientForm.whatsappNumber}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-medium mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={clientForm.email}
                        placeholder="example@mail.com"
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={goToStep2}
                        className="bg-blue-600 text-white px-4 py-2 text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="md:col-span-2">
                      <label className="block font-medium mb-1">Address</label>
                      <input
                        type="text"
                        name="address"
                        placeholder="Enter address"
                        value={clientForm.address}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">
                        Birth City
                      </label>
                      <input
                        type="text"
                        name="birthCity"
                        placeholder="Enter birth city"
                        value={clientForm.birthCity}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={clientForm.city}
                        placeholder="Enter city"
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Area</label>
                      {/* Dropdown for Area */}
                      {locAreaLoading ? (
                        <p>Loading Areas...</p>
                      ) : locAreaError ? (
                        <p className="text-red-500">Error loading areas.</p>
                      ) : (
                        <select
                          name="area"
                          value={clientForm.area}
                          onChange={handleInputChange}
                          className="text-white p-2 rounded border border-gray-300 w-full bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Area</option>
                          {areas.map((area) => (
                            <option key={area.id} value={area.name}>
                              {area.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Location</label>
                      {/* Dropdown for Location */}
                      {locAreaLoading ? (
                        <p>Loading Locations...</p>
                      ) : locAreaError ? (
                        <p className="text-red-500">Error loading locations.</p>
                      ) : (
                        <select
                          name="location"
                          value={clientForm.location}
                          onChange={handleInputChange}
                          className="text-white p-2 rounded border border-gray-300 w-full bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Location</option>
                          {locations.map((location) => (
                            <option key={location.id} value={location.name}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block font-medium mb-1">
                        Marital Status
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="maritalStatus"
                            value="No"
                            checked={clientForm.maritalStatus === "No"}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-1 text-white">No</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="maritalStatus"
                            value="Yes"
                            checked={clientForm.maritalStatus === "Yes"}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-1 text-white">Yes</span>
                        </label>
                      </div>
                    </div>

                    {clientForm.maritalStatus === "Yes" && (
                      <div>
                        <label className="block font-medium mb-1">
                          Husband/Wife Name
                        </label>
                        <input
                          type="text"
                          name="spouseName"
                          value={clientForm.spouseName}
                          placeholder="Enter spouse name"
                          onChange={handleInputChange}
                          className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-medium mb-1">PAN Card</label>
                      <input
                        type="text"
                        name="panCard"
                        placeholder="Enter PAN card number"
                        value={clientForm.panCard}
                        onChange={(e) => {
                          const upperCaseValue = e.target.value.toUpperCase();
                          setClientForm((prev) => ({
                            ...prev,
                            panCard: upperCaseValue,
                          }));
                        }}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">
                        Aadhaar Card
                      </label>
                      <input
                        type="text"
                        name="aadhaarCard"
                        placeholder="Enter Aadhaar number"
                        value={clientForm.aadhaarCard}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">
                        Passport Number
                      </label>
                      <input
                        type="text"
                        name="passportNumber"
                        placeholder="Enter Passport number"
                        value={clientForm.passportNumber}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Voter ID</label>
                      <input
                        type="text"
                        name="voterNumber"
                        placeholder="Enter Voter ID"
                        value={clientForm.voterNumber}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">
                        Canteen Card No.
                      </label>
                      <input
                        type="text"
                        name="canteenCardNumber"
                        placeholder="Enter Canteen Card number"
                        value={clientForm.canteenCardNumber}
                        onChange={handleInputChange}
                        className="text-sm p-2 border border-gray-600 rounded w-full bg-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-between mt-4">
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className="bg-gray-600 text-white px-4 py-2 text-sm rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`bg-green-600 text-white px-4 py-2 text-sm rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      >
                        {isSubmitting
                          ? "Processing..."
                          : isEditing
                          ? "Save Changes"
                          : "Add Client"}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-black text-white border border-gray-700 p-6 rounded-lg shadow-lg w-full max-w-sm">
              <h3 className="text-xl mb-4">Confirm Deletion</h3>
              <p className="mb-6">
                Are you sure you want to delete this client?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Download Buttons and Filters */}
        <div className="mb-4 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={exportToExcel}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Download Excel
            </button>
            <CSVLink
              data={filteredClients}
              filename="clients.csv"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Download CSV
            </CSVLink>
            <button
              onClick={() => exportToPDF(filteredClients)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Download PDF
            </button>
          </div>

          {/* Filter Section */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            {/* City Filter */}
            <div>
              <label className="block mb-1 text-sm text-gray-200">
                Filter by City
              </label>
              <select
                className="text-black p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                {uniqueCities.map((cityOption, idx) => (
                  <option key={idx} value={cityOption}>
                    {cityOption || "All Cities"}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block mb-1 text-sm text-gray-200">
                Filter by Location
              </label>
              <select
                className="text-black p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                {uniqueLocations.map((locationOption, idx) => (
                  <option key={idx} value={locationOption}>
                    {locationOption || "All Locations"}
                  </option>
                ))}
              </select>
            </div>

            {/* Area Filter */}
            <div>
              <label className="block mb-1 text-sm text-gray-200">
                Filter by Area
              </label>
              <select
                className="text-black p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                <option value="">All Areas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.name}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="min-w-full bg-gray-900 text-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  No.
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Profile
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Client Code
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Number
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  W-Number
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  DOB
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  City
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Area
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Location
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, index) => (
                <tr
                  key={client.id}
                  className="border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                  onClick={() => {
                    setSelectedClient(client);
                    setShowDetailModal(true);
                    setShowFamilyMembersList(false);
                  }}
                >
                  <td className="px-4 py-2 text-sm">{index + 1}</td>
                  <td className="px-4 py-2">
                    {client.profilePic ? (
                      <img
                        src={client.profilePic}
                        alt={client.name}
                        className="w-12 h-12 border border-gray-600 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-300">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">{client.name}</td>
                  <td className="px-4 py-2 text-sm">{client.clientNumber}</td>
                  <td className="px-4 py-2 text-sm">{client.number}</td>
                  <td className="px-4 py-2 text-sm">{client.whatsappNumber}</td>
                  <td className="px-4 py-2 text-sm">{client.dob}</td>
                  <td className="px-4 py-2 text-sm">{client.city}</td>
                  <td className="px-4 py-2 text-sm">{client.area}</td>
                  <td className="px-4 py-2 text-sm">{client.location}</td>
                  <td
                    className="px-4 py-2 text-xl flex space-x-2"
                    onClick={(e) => e.stopPropagation()} // Prevent row click when clicking on actions
                  >
                    <button
                      onClick={() => openEditForm(client)}
                      className="text-blue-400 hover:text-blue-300"
                      title="Edit Client"
                    >
                      <CiEdit />
                    </button>
                    <button
                      onClick={() => requestDelete(client)}
                      className="text-red-400 hover:text-red-300"
                      title="Delete Client"
                    >
                      <MdOutlineDeleteOutline />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td className="px-4 py-2 text-center" colSpan="11">
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* **Client Detail Modal** */}
      {showDetailModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="relative bg-gray-900 text-white border border-gray-700 p-8 rounded-lg shadow-lg w-full max-w-4xl overflow-y-auto max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 text-3xl text-gray-300 hover:text-gray-400 focus:outline-none"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-center mb-8">
              {/* Profile Picture */}
              {selectedClient.profilePic ? (
                <img
                  src={selectedClient.profilePic}
                  alt={`${selectedClient.name} ${selectedClient.familyName}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-gray-300 text-2xl border-4 border-blue-500 shadow-lg">
                  N/A
                </div>
              )}
              {/* Basic Info */}
              <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
                <h2 className="text-2xl font-semibold">
                  {selectedClient.name} {selectedClient.familyName}
                </h2>
                <p className="text-gray-400">
                  Client ID: {selectedClient.clientNumber}
                </p>
                <p className="text-gray-400">Phone: {selectedClient.number}</p>
                <p className="text-gray-400">
                  Email: {selectedClient.email || "N/A"}
                </p>
              </div>
            </div>

            {/* Buttons for Family Members */}
            <div className="flex space-x-4 mb-8">
              <button
                onClick={openFamilyMemberForm}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Family Member
              </button>
              <button
                onClick={toggleFamilyMembersList}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                See Family Members
              </button>
            </div>

            {/* Detailed Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Details */}
              <div>
                <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
                  Personal Details
                </h3>
                <div className="space-y-2">
                  <p>
                    <strong>Date of Birth:</strong> {selectedClient.dob}
                  </p>
                  <p>
                    <strong>Birth City:</strong>{" "}
                    {selectedClient.birthCity || "N/A"}
                  </p>
                  <p>
                    <strong>Address:</strong> {selectedClient.address || "N/A"}
                  </p>
                  <p>
                    <strong>City:</strong> {selectedClient.city || "N/A"}
                  </p>
                  <p>
                    <strong>Area:</strong> {selectedClient.area || "N/A"}
                  </p>
                  <p>
                    <strong>Location:</strong>{" "}
                    {selectedClient.location || "N/A"}
                  </p>
                  <p>
                    <strong>Marital Status:</strong>{" "}
                    {selectedClient.maritalStatus}
                  </p>
                  {selectedClient.maritalStatus === "Yes" && (
                    <p>
                      <strong>Spouse Name:</strong>{" "}
                      {selectedClient.spouseName || "N/A"}
                    </p>
                  )}
                </div>
              </div>

              {/* Identification Details */}
              <div>
                <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
                  Identification Details
                </h3>
                <div className="space-y-2">
                  <p>
                    <strong>PAN Card:</strong> {selectedClient.panCard || "N/A"}
                  </p>
                  <p>
                    <strong>Aadhaar Card:</strong>{" "}
                    {selectedClient.aadhaarCard || "N/A"}
                  </p>
                  <p>
                    <strong>Passport Number:</strong>{" "}
                    {selectedClient.passportNumber || "N/A"}
                  </p>
                  <p>
                    <strong>Voter ID:</strong>{" "}
                    {selectedClient.voterNumber || "N/A"}
                  </p>
                  <p>
                    <strong>Canteen Card Number:</strong>{" "}
                    {selectedClient.canteenCardNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Family Members List */}
            {showFamilyMembersList && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
                  Family Members
                </h3>
                <div className="space-y-4">
                  {selectedClient.familyMembers &&
                  selectedClient.familyMembers.length > 0 ? (
                    selectedClient.familyMembers.map((fm, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-700 p-4 rounded"
                      >
                        <p>
                          <strong>Relation:</strong> {fm.relation}
                        </p>
                        <p>
                          <strong>Name:</strong> {fm.name}
                        </p>
                        <p>
                          <strong>DOB:</strong> {fm.dob}
                        </p>
                        <p>
                          <strong>Birth City:</strong> {fm.birthCity || "N/A"}
                        </p>
                        <p>
                          <strong>Mobile:</strong> {fm.number || "N/A"}
                        </p>
                        <p>
                          <strong>Email:</strong> {fm.email || "N/A"}
                        </p>
                        <p>
                          <strong>Aadhaar:</strong> {fm.aadhaarCard || "N/A"}
                        </p>
                        <p>
                          <strong>PAN:</strong> {fm.panCard || "N/A"}
                        </p>
                        <p>
                          <strong>Passport:</strong>{" "}
                          {fm.passportNumber || "N/A"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p>No family members added yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Family Member Form Modal */}
      {showFamilyMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
          <div className="relative bg-gray-900 text-white border border-gray-700 p-8 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowFamilyMemberForm(false)}
              className="absolute top-4 right-4 text-3xl text-gray-300 hover:text-gray-400 focus:outline-none"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Add Family Member
            </h2>
            <form onSubmit={handleAddFamilyMember} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Relation */}
                <div>
                  <label htmlFor="relation" className="block mb-1">
                    Relation <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="relation"
                    name="relation"
                    value={familyMemberForm.relation}
                    onChange={handleFamilyMemberInputChange}
                    className="text-black w-full p-2 rounded bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="" disabled>
                      Select relation
                    </option>
                    <option value="Wife">Wife</option>
                    <option value="Husband">Husband</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Children">Children</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter full name"
                    value={familyMemberForm.name}
                    onChange={handleFamilyMemberInputChange}
                    className="text-black w-full p-2 rounded bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* DOB */}
                <div>
                  <label htmlFor="dob" className="block mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={familyMemberForm.dob}
                    onChange={handleFamilyMemberInputChange}
                    className="text-black w-full p-2 rounded bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Birth City */}
                <div>
                  <label htmlFor="birthCity" className="block mb-1">
                    Birth City
                  </label>
                  <input
                    type="text"
                    id="birthCity"
                    name="birthCity"
                    placeholder="Enter birth city"
                    value={familyMemberForm.birthCity}
                    onChange={handleFamilyMemberInputChange}
                    className="text-black w-full p-2 rounded bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Aadhaar Card */}
                <div>
                  <label htmlFor="aadhaarCard" className="block mb-1">
                    Aadhaar Card
                  </label>
                  <input
                    type="text"
                    id="aadhaarCard"
                    name="aadhaarCard"
                    placeholder="Enter Aadhaar number"
                    value={familyMemberForm.aadhaarCard}
                    onChange={handleFamilyMemberInputChange}
                    className="text-black w-full p-2 rounded bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* PAN Card */}
                <div>
                  <label htmlFor="panCard" className="block mb-1">
                    PAN Card
                  </label>
                  <input
                    type="text"
                    id="panCard"
                    name="panCard"
                    placeholder="Enter PAN number"
                    value={familyMemberForm.panCard}
                    onChange={(e) => {
                      const upperCaseValue = e.target.value.toUpperCase();
                      setFamilyMemberForm((prev) => ({
                        ...prev,
                        panCard: upperCaseValue,
                      }));
                    }}
                    className="text-black w-full p-2 rounded bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Passport Number */}
                <div>
                  <label htmlFor="passportNumber" className="block mb-1">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    id="passportNumber"
                    name="passportNumber"
                    placeholder="Enter passport number"
                    value={familyMemberForm.passportNumber}
                    onChange={handleFamilyMemberInputChange}
                    className="text-black w-full p-2 rounded bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label htmlFor="number" className="block mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="number"
                    name="number"
                    placeholder="Enter mobile number"
                    value={familyMemberForm.number}
                    onChange={handleFamilyMemberInputChange}
                    className="text-black w-full p-2 rounded bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter email address"
                    value={familyMemberForm.email}
                    onChange={handleFamilyMemberInputChange}
                    className="text-black w-full p-2 rounded bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowFamilyMemberForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <ClipLoader size={20} color="#ffffff" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ClientManagement;
