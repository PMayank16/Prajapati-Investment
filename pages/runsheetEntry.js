// components/RunsheetEntry.js

import React, { useContext, useState, useMemo, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { ClientContext } from "@/context/ClientContext";
import Image from "next/image";
import { useEmployee } from "@/context/EmployeeContext";

export default function RunsheetEntry() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { employees, isLoading } = useEmployee();
  const { clients, loading, exportToPDF } = useContext(ClientContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClients, setSelectedClients] = useState([]);


  const [isPopupOpen, setIsPopupOpen] = useState(false);
const [popupClientId, setPopupClientId] = useState(null);
const [popupDetails, setPopupDetails] = useState("");

const handlePopupClose = () => {
  setIsPopupOpen(false);
  setPopupClientId(null);
  setPopupDetails("");
};

const handlePopupSave = () => {
  setPickupDeliveryDetails((prevDetails) => ({
    ...prevDetails,
    [popupClientId]: popupDetails,
  }));
  handlePopupClose();
};

  // State variables for global export details
  const [exportName, setExportName] = useState("");
  const [exportDate, setExportDate] = useState("");

  // State variable for Pick Up & Delivery per client
  const [pickupDeliveryDetails, setPickupDeliveryDetails] = useState({});

  const selectAllRef = useRef(null);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const searchValue = searchTerm.toLowerCase();
      return (
        client.name?.toLowerCase().includes(searchValue) ||
        client.number?.toLowerCase().includes(searchValue)
      );
    });
  }, [clients, searchTerm]);

  // Update the indeterminate state of the select all checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      const isIndeterminate =
        selectedClients.length > 0 &&
        selectedClients.length < filteredClients.length;
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedClients, filteredClients]);

  // Handle individual checkbox toggle
  const handleCheckboxChange = (clientId) => {
    setSelectedClients((prevSelected) => {
      if (prevSelected.includes(clientId)) {
        // Remove the client from selected
        const updatedSelected = prevSelected.filter((id) => id !== clientId);
        // Remove their pickupDeliveryDetail if exists
        const updatedPickup = { ...pickupDeliveryDetails };
        delete updatedPickup[clientId];
        setPickupDeliveryDetails(updatedPickup);
        return updatedSelected;
      } else {
        // Add the client to selected
        return [...prevSelected, clientId];
      }
    });
  };

  // Handle "Select All" checkbox toggle
  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
      setPickupDeliveryDetails({});
    } else {
      const allClientIds = filteredClients.map((client) => client.id);
      setSelectedClients(allClientIds);
      // Initialize pickupDeliveryDetails for all selected clients
      const initialPickupDelivery = {};
      allClientIds.forEach((id) => {
        if (!pickupDeliveryDetails[id]) {
          initialPickupDelivery[id] = "";
        }
      });
      setPickupDeliveryDetails(initialPickupDelivery);
    }
  };

  // Handle Pick Up & Delivery input change
  const handlePickupDeliveryChange = (clientId, value) => {
    setPickupDeliveryDetails((prevDetails) => ({
      ...prevDetails,
      [clientId]: value,
    }));
  };

  // Export selected clients to PDF with the new format
  const exportSelectedClientsPDF = () => {
    const clientsToExport = clients.filter((client) =>
      selectedClients.includes(client.id)
    );
    exportToPDF(clientsToExport, exportName, exportDate, pickupDeliveryDetails);
    // Optionally, clear selections and inputs after export
    setSelectedClients([]);
    setExportName("");
    setExportDate("");
    setPickupDeliveryDetails({});
  };

  // Export single client's data to PDF (optional, you can customize this if needed)
  const exportSingleClientPDF = (client) => {
    exportToPDF([client], "", "", {});
  };

  // Export all filtered clients to PDF with the new format
  const exportFilteredClientsPDF = () => {
    exportToPDF(filteredClients, "", "", {});
    // Optionally, clear selections after export
    setSelectedClients([]);
    setPickupDeliveryDetails({});
  };

  return (
    <Layout>
      <div className="bg-black min-h-screen text-white p-4">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Runsheet Entry</h1>
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <input
              type="text"
              placeholder="Search by name or number..."
              className="border border-gray-600 bg-black text-white px-4 py-2 rounded-md focus:outline-none focus:border-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              onClick={() => alert("Add client functionality")}
            >
              Add
            </button>
            <button
              className={`bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 ${
                filteredClients.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={exportFilteredClientsPDF}
              disabled={filteredClients.length === 0}
              title={
                filteredClients.length === 0
                  ? "No clients to export"
                  : "Download PDF for all filtered clients"
              }
            >
              Download PDF
            </button>
            {selectedClients.length > 0 && (
              <button
                className="bg-green-600 border border-green-500 text-white px-4 py-2 rounded-md hover:bg-green-500"
                onClick={exportSelectedClientsPDF}
              >
                Download Runsheet PDF
              </button>
            )}
          </div>
        </div>

        {/* Additional Options for Export (Name and Date) */}
        {selectedClients.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 p-4 bg-gray-800 rounded-md">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Name:
                </label>
                <div className="relative">
                  <button
                    className="mt-1 border border-gray-600 bg-black text-white px-4 py-2 rounded-md w-full text-left focus:outline-none focus:border-gray-400 flex justify-between items-center"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                  >
                    {exportName || "Select Name"}
                    <span className="ml-2 text-xs">▼</span>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute border border-gray-600 z-10 mt-1 w-full bg-black rounded-md shadow-lg max-h-40 overflow-y-auto">
                      <ul className="py-1 text-white">
                        {isLoading ? (
                          <li className="px-4 py-2 text-center">Loading...</li>
                        ) : employees.length === 0 ? (
                          <li className="px-4 py-2 text-center">
                            No employees found
                          </li>
                        ) : (
                          employees.map((employee) => (
                            <li
                              key={employee.id}
                              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                              onClick={() => {
                                setExportName(employee.name); // Set the selected name
                                setIsDropdownOpen(false); // Close the dropdown
                              }}
                            >
                              {employee.name}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Date:
                </label>
                <input
                  type="date"
                  className="mt-1 border border-gray-600 bg-black text-white px-4 py-2 rounded-md focus:outline-none focus:border-gray-400"
                  value={exportDate}
                  onChange={(e) => setExportDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="overflow-x-auto w-full border border-gray-600 rounded-md">
          <table className="min-w-full border-collapse divide-y divide-gray-600">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-2">
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    checked={
                      filteredClients.length > 0 &&
                      selectedClients.length === filteredClients.length
                    }
                    onChange={handleSelectAll}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </th>
                {/* Updated ID Header */}
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider border-b border-gray-600">
                  ID
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider border-b border-gray-600">
                  Image
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider border-b border-gray-600">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider border-b border-gray-600">
                  Number
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider border-b border-gray-600">
                  DOB
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider border-b border-gray-600">
                  Family Name
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider border-b border-gray-600">
                  City
                </th>
                {/* New Pick Up & Delivery Header */}
                <th className="px-4 py-2 text-left text-sm font-medium uppercase tracking-wider border-b border-gray-600">
                  Pick Up & Delivery
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium uppercase tracking-wider border-b border-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client, index) => (
                  <tr key={client.id} className="hover:bg-gray-900">
                    <td className="px-4 py-2 whitespace-nowrap border-b border-gray-600">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={() => handleCheckboxChange(client.id)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                    </td>
                    {/* Displaying Sequential Number */}
                    <td className="px-4 py-2 whitespace-nowrap border-b border-gray-600 text-sm">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap border-b border-gray-600">
                      {client.profilePic ? (
                        <div className="relative w-12 h-12">
                          <Image
                            src={client.profilePic}
                            alt={client.name}
                            fill
                            className="object-cover rounded-full"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-sm text-gray-300">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap border-b border-gray-600 text-sm">
                      {client.name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap border-b border-gray-600 text-sm">
                      {client.number}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap border-b border-gray-600 text-sm">
                      {client.dob}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap border-b border-gray-600 text-sm">
                      {client.familyName}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap border-b border-gray-600 text-sm">
                      {client.city}
                    </td>
                    {/* New Pick Up & Delivery Cell */}
                    <td className="px-4 py-2 whitespace-nowrap border-b border-gray-600 text-sm">
      {selectedClients.includes(client.id) ? (
        <button
          className="border border-gray-600 bg-black text-white px-2 py-1 rounded-md focus:outline-none focus:border-gray-400"
          onClick={() => {
            setPopupClientId(client.id);
            setPopupDetails(pickupDeliveryDetails[client.id] || "");
            setIsPopupOpen(true);
          }}
        >
          {pickupDeliveryDetails[client.id] || "Enter pick up & delivery details"}
        </button>
      ) : (
        "-"
      )}
    </td>

    {/* Modal Popup for Input */}
    {isPopupOpen && (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-gray-800 p-6 rounded-md max-w-lg w-full">
          <h2 className="text-xl text-white mb-4">Enter Pick Up & Delivery Details</h2>
          <textarea
            className="w-full h-32 border border-gray-600 bg-black text-white p-2 rounded-md focus:outline-none focus:border-gray-400"
            value={popupDetails}
            onChange={(e) => setPopupDetails(e.target.value)}
            placeholder="Enter details here..."
          />
          <div className="mt-4 flex justify-between">
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500"
              onClick={handlePopupClose}
            >
              Cancel
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-500"
              onClick={handlePopupSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}
                    <td className="px-4 py-2 whitespace-nowrap border-b border-gray-600 text-right text-sm">
                      <button
                        className="bg-gray-800 border border-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700"
                        onClick={() => exportSingleClientPDF(client)}
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-6">
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
