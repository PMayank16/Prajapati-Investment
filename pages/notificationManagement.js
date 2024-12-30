import React, { useContext, useState, useEffect } from 'react';
import { ClientContext } from '@/context/ClientContext';
import Layout from '@/components/Layout';
import { FaSearch, FaEnvelope } from 'react-icons/fa';

// Placeholder functions for sending WhatsApp notifications
const sendWhatsappNotification = (clientIds) => {
  console.log(`Sending WhatsApp wishes reminder to clients: ${clientIds.join(', ')}`);
};

const NotificationManagement = () => {
  const { clients, loading } = useContext(ClientContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState(null); // 'success', 'error', 'info'

  useEffect(() => {
    const filtered = clients.filter((client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchQuery]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle individual checkbox change
  const handleCheckboxChange = (e, clientId) => {
    if (e.target.checked) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter((id) => id !== clientId));
    }
  };

  // Handle "Select All" checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allClientIds = filteredClients.map((client) => client.id);
      setSelectedClients(allClientIds);
    } else {
      setSelectedClients([]);
    }
  };

  // Handle Send Message click (individual)
  const handleSendMessage = (client) => {
    setStatusMessage(`Prepare to send message to ${client.name}`);
    setStatusType('info');
  };

  // Handle sending wishes reminder (e.g., via WhatsApp)
  const handleSendWishesReminder = () => {
    if (selectedClients.length === 0) {
      setStatusMessage('No clients selected.');
      setStatusType('error');
      return;
    }
    sendWhatsappNotification(selectedClients);
    setStatusMessage(`WhatsApp wishes reminder sent to ${selectedClients.length} client(s).`);
    setStatusType('success');
  };

  const handleOpenEmailModal = () => {
    if (selectedClients.length === 0) {
      setStatusMessage('No clients selected.');
      setStatusType('error');
      return;
    }
    // Reset form and status
    setUserEmail('');
    setUserPassword('');
    setStatusMessage(null);
    setStatusType(null);
    setShowEmailModal(true);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
  };

  // Handle sending email notification via the modal form
  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!userEmail || !userPassword) {
      setStatusMessage('Please provide both email and password.');
      setStatusType('error');
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIds: selectedClients, userEmail, userPassword }),
      });

      if (response.ok) {
        const result = await response.json();
        setStatusMessage(`Emails sent successfully: ${result.message}`);
        setStatusType('success');
      } else {
        const errorData = await response.json();
        setStatusMessage(`Failed to send emails: ${errorData.error}`);
        setStatusType('error');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      setStatusMessage('An error occurred while sending the emails.');
      setStatusType('error');
    } finally {
      // Close the modal after attempting to send
      setShowEmailModal(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white p-6 relative">
        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-4 p-4 rounded ${
              statusType === 'success'
                ? 'bg-green-600'
                : statusType === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold mb-4 md:mb-0">Notification Management</h2>
          
          {/* Button group for reminders */}
          <div className="flex space-x-4 mb-4 md:mb-0 md:mr-4">
            <button
              onClick={handleSendWishesReminder}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded"
            >
              Wishes Reminder
            </button>
            <button
              onClick={handleOpenEmailModal}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
            >
              Send Email Notification
            </button>
          </div>

          <div className="relative w-full md:w-1/3">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="border border-gray-600 px-4 py-2">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedClients.length === filteredClients.length &&
                      filteredClients.length > 0
                    }
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                </th>
                <th className="border border-gray-600 px-4 py-2">ID</th>
                <th className="border border-gray-600 px-4 py-2">Image</th>
                <th className="border border-gray-600 px-4 py-2">Name</th>
                <th className="border border-gray-600 px-4 py-2">DOB</th>
                <th className="border border-gray-600 px-4 py-2">Email</th>
                <th className="border border-gray-600 px-4 py-2">Location</th>
                <th className="border border-gray-600 px-4 py-2">Send Message</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="border border-gray-600 px-4 py-2 text-center" colSpan="9">
                    Loading...
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client, index) => (
                  <tr key={client.id} className="hover:bg-gray-700 text-center">
                    <td className="border border-gray-600 px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={(e) => handleCheckboxChange(e, client.id)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                    </td>
                    <td className="border border-gray-600 px-4 py-2 text-center">{index + 1}</td>
                    <td className="border border-gray-600 px-4 py-2 text-center">
                      <img
                        src={client.profilePic || '/default-avatar.png'}
                        alt={client.name}
                        className="w-10 h-10 rounded-full mx-auto"
                      />
                    </td>
                    <td className="border border-gray-600 px-4 py-2">{client.name}</td>
                    <td className="border border-gray-600 px-4 py-2">{client.dob}</td>
                    <td className="border border-gray-600 px-4 py-2">{client.email}</td>
                    <td className="border border-gray-600 px-4 py-2">{client.location}</td>
                    <td className="border border-gray-600 px-4 py-2 text-center">
                      <FaEnvelope
                        className="inline-block cursor-pointer text-blue-500 hover:text-blue-300"
                        onClick={() => handleSendMessage(client)}
                        title="Send Message"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-gray-600 px-4 py-2 text-center" colSpan="9">
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Overlay and Form */}
        {showEmailModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-70" onClick={handleCloseEmailModal}></div>

            {/* Modal Content */}
            <div className="relative bg-gray-900 text-white p-6 rounded shadow-lg z-50 w-11/12 md:w-1/2 lg:w-1/3">
              <h3 className="mb-4 text-lg font-semibold">Enter Email Credentials</h3>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2" htmlFor="userEmail">Email</label>
                  <input
                    type="email"
                    id="userEmail"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2" htmlFor="userPassword">Password</label>
                  <input
                    type="password"
                    id="userPassword"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
                  >
                    Send Emails
                  </button>
                  <button
                    type="button"
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                    onClick={handleCloseEmailModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationManagement;
