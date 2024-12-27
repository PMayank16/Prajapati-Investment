// pages/index.js
import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Layout from '@/components/Layout';

// Firebase imports
import { db } from '@/Firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

export default function PostOffice() {
  // State variables
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // To differentiate between Add and Edit
  const [currentChequeId, setCurrentChequeId] = useState(null); // To track which cheque is being edited
  const [cheques, setCheques] = useState([]);
  const [formData, setFormData] = useState({
    rdChequeEntry: '',
    chequeFrom: '',
    chequeTo: '',
    bankName: '',
    dueDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firestore collection reference
  const chequesCollectionRef = collection(db, 'cheques');

  // Ref for modal content
  const modalRef = useRef(null);

  // Fetch cheques from Firestore with real-time updates
  useEffect(() => {
    // Create a query to order cheques by dueDate (ascending)
    const q = query(chequesCollectionRef, orderBy('dueDate', 'asc'));

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chequesData = [];
        snapshot.forEach((doc) => {
          chequesData.push({ id: doc.id, ...doc.data() });
        });
        setCheques(chequesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching cheques: ', error);
        setError('Failed to fetch cheques.');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission to add or edit cheque in Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditMode && currentChequeId) {
      // Edit existing cheque
      try {
        const chequeDoc = doc(db, 'cheques', currentChequeId);
        await updateDoc(chequeDoc, formData);

        // Reset form and states
        setFormData({
          rdChequeEntry: '',
          chequeFrom: '',
          chequeTo: '',
          bankName: '',
          dueDate: '',
        });
        setIsEditMode(false);
        setCurrentChequeId(null);
        setIsModalOpen(false);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Error updating cheque: ', error);
        setError('Failed to update cheque. Please try again.');
      }
    } else {
      // Add new cheque
      try {
        await addDoc(chequesCollectionRef, formData);

        // Reset form
        setFormData({
          rdChequeEntry: '',
          chequeFrom: '',
          chequeTo: '',
          bankName: '',
          dueDate: '',
        });
        setIsModalOpen(false);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Error adding cheque: ', error);
        setError('Failed to add cheque. Please try again.');
      }
    }
  };

  // Handle Delete Cheque
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this cheque entry?'
    );
    if (confirmDelete) {
      try {
        const chequeDoc = doc(db, 'cheques', id);
        await deleteDoc(chequeDoc);
      } catch (error) {
        console.error('Error deleting cheque: ', error);
        setError('Failed to delete cheque. Please try again.');
      }
    }
  };

  // Handle Edit Cheque
  const handleEdit = (cheque) => {
    setIsEditMode(true);
    setCurrentChequeId(cheque.id);
    setFormData({
      rdChequeEntry: cheque.rdChequeEntry,
      chequeFrom: cheque.chequeFrom,
      chequeTo: cheque.chequeTo,
      bankName: cheque.bankName,
      dueDate: cheque.dueDate,
    });
    setIsModalOpen(true);
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Cheque Collection', 14, 22);
    const tableColumn = [
      'No.',
      'RD Entry',
      'Cheque From',
      'Cheque To',
      'Bank Name',
      'Due Date',
      'Actions',
    ];
    const tableRows = [];

    cheques.forEach((cheque, index) => {
      const chequeData = [
        index + 1,
        cheque.rdChequeEntry,
        cheque.chequeFrom,
        cheque.chequeTo,
        cheque.bankName,
        cheque.dueDate,
        'Edit/Delete',
      ];
      tableRows.push(chequeData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      styles: { halign: 'left' },
    });

    doc.save('cheque_collection.pdf');
  };

  // Export to Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      cheques.map((cheque, index) => ({
        No: index + 1,
        'RD Entry': cheque.rdChequeEntry,
        'Cheque From': cheque.chequeFrom,
        'Cheque To': cheque.chequeTo,
        'Bank Name': cheque.bankName,
        'Due Date': cheque.dueDate,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cheques');
    XLSX.writeFile(workbook, 'cheque_collection.xlsx');
  };

  // Filter cheques based on search term
  const filteredCheques = cheques.filter((cheque) =>
    Object.values(cheque).some((value) =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Handle click outside modal to close it
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        // Reset edit mode when closing the modal
        setIsEditMode(false);
        setCurrentChequeId(null);
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isModalOpen]);

  return (
    <>
      <Layout>
        <Head>
          <title>Post Office Cheque Management</title>
          <meta name="description" content="Manage cheques efficiently" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="min-h-screen bg-black text-white p-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">Post Office</h1>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              <input
                type="text"
                placeholder="Search by any field..."
                className="px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setFormData({
                    rdChequeEntry: '',
                    chequeFrom: '',
                    chequeTo: '',
                    bankName: '',
                    dueDate: '',
                  });
                  setIsModalOpen(true);
                }}
                className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-600 text-white rounded">
              {error}
            </div>
          )}

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
              <div
                ref={modalRef}
                className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
              >
                <h2 className="text-2xl mb-4">
                  {isEditMode ? 'Edit Cheque Entry' : 'Add Cheque Entry'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block mb-1">RD Cheque Entry</label>
                    <input
                      type="text"
                      name="rdChequeEntry"
                      value={formData.rdChequeEntry}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Entry #12345"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1">Cheque From</label>
                      <input
                        type="number"
                        name="chequeFrom"
                        value={formData.chequeFrom}
                        onChange={handleChange}
                        required
                        placeholder="e.g., 1000"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Cheque To</label>
                      <input
                        type="number"
                        name="chequeTo"
                        value={formData.chequeTo}
                        onChange={handleChange}
                        required
                        placeholder="e.g., 2000"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      required
                      placeholder="e.g., State Bank of India"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Due Date</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditMode(false);
                        setCurrentChequeId(null);
                        setIsModalOpen(false);
                      }}
                      className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors"
                    >
                      {isEditMode ? 'Update' : 'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Export Buttons */}
          {cheques.length > 0 && (
            <div className="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4 mb-4">
              <button
                onClick={exportPDF}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={exportExcel}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors"
              >
                Download Excel
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-600">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-4 py-2 border border-gray-600 text-left">No.</th>
                  <th className="px-4 py-2 border border-gray-600 text-left">RD Cheque Entry</th>
                  <th className="px-4 py-2 border border-gray-600 text-left">Cheque From</th>
                  <th className="px-4 py-2 border border-gray-600 text-left">Cheque To</th>
                  <th className="px-4 py-2 border border-gray-600 text-left">Bank Name</th>
                  <th className="px-4 py-2 border border-gray-600 text-left">Due Date</th>
                  <th className="px-4 py-2 border border-gray-600 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-2 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : filteredCheques.length > 0 ? (
                  filteredCheques.map((cheque, index) => (
                    <tr
                      key={cheque.id}
                      className="hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-2 border border-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {cheque.rdChequeEntry}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {cheque.chequeFrom}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {cheque.chequeTo}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {cheque.bankName}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        {cheque.dueDate}
                      </td>
                      <td className="px-4 py-2 border border-gray-600">
                        <button
                          onClick={() => handleEdit(cheque)}
                          className="mr-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cheque.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-2 text-center">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
    </>
  );
}
