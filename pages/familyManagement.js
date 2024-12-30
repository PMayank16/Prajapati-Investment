import React, { useContext, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { ClientContext } from '@/context/ClientContext';
import { useAuth } from '@/context/auth'; // <-- import our Auth hook
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import debounce from 'lodash.debounce';

const FamilyManagement = () => {
  const { clients, loading, addClient } = useContext(ClientContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState('');
  const itemsPerPage = 10;

  // Get user role from Auth
  const { userRole } = useAuth(); // "Admin", "read", or "write"

  // Extract all family members from clients
  const familyMembers = useMemo(() => {
    let members = [];
    clients.forEach((client) => {
      if (client.familyMembers && Array.isArray(client.familyMembers)) {
        client.familyMembers.forEach((member) => {
          members.push({
            ...member,
            clientCode: client.clientNumber,
          });
        });
      }
    });
    return members;
  }, [clients]);

  // Handle Search with Debounce
  const handleSearch = debounce((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, 300);

  const onSearchChange = (e) => {
    handleSearch(e.target.value);
  };

  // Filter family members based on search term
  const filteredFamilyMembers = useMemo(() => {
    if (!searchTerm) return familyMembers;
    return familyMembers.filter((member) =>
      Object.values(member).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [familyMembers, searchTerm]);

  // Sort family members
  const sortedFamilyMembers = useMemo(() => {
    if (!sortConfig.key) return filteredFamilyMembers;
    const sorted = [...filteredFamilyMembers].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [filteredFamilyMembers, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedFamilyMembers.length / itemsPerPage);
  const paginatedFamilyMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedFamilyMembers.slice(start, start + itemsPerPage);
  }, [sortedFamilyMembers, currentPage]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-white" />;
    return <FaSortDown className="text-white" />;
  };

  const handleAddToClient = async (member) => {
    // Only proceed if userRole is "write" or "Admin"
    if (userRole === 'write' || userRole === 'Admin') {
      const clientData = {
        name: member.name,
        dob: member.dob,
        email: member.email,
        phoneNumber: member.number,
        familyMembers: [], // Clear familyMembers for the new client
      };

      await addClient(clientData); // Add to clients
      setMessage(`Family member ${member.name} has been added as a new client!`);
      setTimeout(() => setMessage(''), 3000);
    } else {
      // If userRole is "read", show a restricted message
      setMessage('You do not have permission to add a new client.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white p-6">
        {/* Role-Specific Header Message */}
        {userRole === 'read' && (
          <div className="mb-4 p-4 text-sm text-yellow-500 bg-gray-800 rounded-lg" role="alert">
            You have <strong>read-only</strong> access. You cannot modify the data.
          </div>
        )}
        {userRole === 'write' && (
          <div className="mb-4 p-4 text-sm text-green-400 bg-gray-800 rounded-lg" role="alert">
            You have <strong>write</strong> access. You can modify data!
          </div>
        )}
        {userRole === 'Admin' && (
          <div className="mb-4 p-4 text-sm text-blue-400 bg-gray-800 rounded-lg" role="alert">
            You are an <strong>Admin</strong>. Full access granted!
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Family Management</h1>
          <input
            type="text"
            placeholder="Search family members..."
            className="w-full md:w-1/3 px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={onSearchChange}
            aria-label="Search family members"
          />
        </div>

        {/* Message Section */}
        {message && (
          <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
            {message}
          </div>
        )}

        {/* Table Section */}
        <div className="overflow-x-auto bg-gray-900 rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <SortableHeader
                  label="ID"
                  sortKey="id"
                  requestSort={requestSort}
                  getSortIcon={getSortIcon}
                />
                <SortableHeader
                  label="Name"
                  sortKey="name"
                  requestSort={requestSort}
                  getSortIcon={getSortIcon}
                />
                <SortableHeader
                  label="Client Code"
                  sortKey="clientCode"
                  requestSort={requestSort}
                  getSortIcon={getSortIcon}
                />
                <SortableHeader
                  label="Relation"
                  sortKey="relation"
                  requestSort={requestSort}
                  getSortIcon={getSortIcon}
                />
                <SortableHeader
                  label="DOB"
                  sortKey="dob"
                  requestSort={requestSort}
                  getSortIcon={getSortIcon}
                />
                <SortableHeader
                  label="Email"
                  sortKey="email"
                  requestSort={requestSort}
                  getSortIcon={getSortIcon}
                />
                <SortableHeader
                  label="Number"
                  sortKey="number"
                  requestSort={requestSort}
                  getSortIcon={getSortIcon}
                />
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : paginatedFamilyMembers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No family members found.
                  </td>
                </tr>
              ) : (
                paginatedFamilyMembers.map((member, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.clientCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.relation}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{member.dob}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`mailto:${member.email}`} className="text-blue-400 hover:underline">
                        {member.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={`tel:${member.number}`} className="text-blue-400 hover:underline">
                        {member.number}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Disable the button for read-only role */}
                      <button
                        onClick={() => handleAddToClient(member)}
                        disabled={userRole === 'read'}
                        className={`px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          userRole === 'read' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Add to Client
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {!loading && paginatedFamilyMembers.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedFamilyMembers.length)} of{' '}
              {sortedFamilyMembers.length} entries
            </span>
            <div className="inline-flex -space-x-px">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 ml-0 leading-tight text-gray-400 bg-gray-800 border border-gray-700 rounded-l-lg hover:bg-gray-700 hover:text-white ${
                  currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''
                }`}
                aria-label="Previous Page"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 leading-tight border border-gray-700 hover:bg-gray-700 hover:text-white ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                  aria-label={`Page ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 leading-tight text-gray-400 bg-gray-800 border border-gray-700 rounded-r-lg hover:bg-gray-700 hover:text-white ${
                  currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''
                }`}
                aria-label="Next Page"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// SortableHeader Component
const SortableHeader = ({ label, sortKey, requestSort, getSortIcon }) => (
  <th
    scope="col"
    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
    onClick={() => requestSort(sortKey)}
    style={{ cursor: 'pointer' }}
  >
    <div className="flex items-center">
      {label}
      {getSortIcon(sortKey)}
    </div>
  </th>
);

export default FamilyManagement;
