// components/PostalEntry.js

import React, { useState, useEffect, useContext } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { db } from '@/Firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { FaEdit, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useProductMaster } from '@/context/ProductContext';
import { ClientContext } from '@/context/ClientContext';

export default function PostalEntry() {
  // Product Master Context
  const { data: productData, loading: loadingProducts } = useProductMaster() || {};
  const productList = productData ? Object.keys(productData) : [];

  // Clients from context
  const { clients, loading: loadingClients } = useContext(ClientContext);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form data (all optional)
  const [formData, setFormData] = useState({
    customer1: '',
    customer2: '',
    product: '',
    subProduct: '',

    depositDate: '',
    amount: '',
    maturityDate: '',
    interestRate: '',

    nomineeName: '',
    nomineeDob: '',
    nomineeRelation: '',
    isNomineeMinor: false,
    nomineeGuardianName: '',

    chequeNo: '',
    chequeDate: '',
    bankName: '',

    postOfficeName: '',
    agentCode: '',
    remark: '',

    cifId1: '',
    cifId2: '',
  });

  // Firestore data
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);

  const entriesCollectionRef = collection(db, 'postalEntries');

  // Fetch data on mount
  useEffect(() => {
    const fetchEntries = async () => {
      setLoadingEntries(true);
      try {
        const data = await getDocs(entriesCollectionRef);
        const fetchedData = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setEntries(fetchedData);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch entries.');
      } finally {
        setLoadingEntries(false);
      }
    };

    fetchEntries();
  }, []);

  // Open modal
  const openModal = () => {
    setIsModalOpen(true);
    setIsEditing(false);
    setEditingEntryId(null);
    // Reset form
    setFormData({
      customer1: '',
      customer2: '',
      product: '',
      subProduct: '',
      depositDate: '',
      amount: '',
      maturityDate: '',
      interestRate: '',
      nomineeName: '',
      nomineeDob: '',
      nomineeRelation: '',
      isNomineeMinor: false,
      nomineeGuardianName: '',
      chequeNo: '',
      chequeDate: '',
      bankName: '',
      postOfficeName: '',
      agentCode: '',
      remark: '',
      cifId1: '',
      cifId2: '',
    });
  };

  // Edit modal
  const openEditModal = (entry) => {
    setIsModalOpen(true);
    setIsEditing(true);
    setEditingEntryId(entry.id);

    setFormData({
      customer1: entry.customer1 || '',
      customer2: entry.customer2 || '',
      product: entry.product || '',
      subProduct: entry.subProduct || '',
      depositDate: entry.depositDate || '',
      amount: entry.amount || '',
      maturityDate: entry.maturityDate || '',
      interestRate: entry.interestRate || '',
      nomineeName: entry.nomineeName || '',
      nomineeDob: entry.nomineeDob || '',
      nomineeRelation: entry.nomineeRelation || '',
      isNomineeMinor: entry.isNomineeMinor || false,
      nomineeGuardianName: entry.nomineeGuardianName || '',
      chequeNo: entry.chequeNo || '',
      chequeDate: entry.chequeDate || '',
      bankName: entry.bankName || '',
      postOfficeName: entry.postOfficeName || '',
      agentCode: entry.agentCode || '',
      remark: entry.remark || '',
      cifId1: entry.cifId1 || '',
      cifId2: entry.cifId2 || '',
    });
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingEntryId(null);
    // Reset form
    setFormData({
      customer1: '',
      customer2: '',
      product: '',
      subProduct: '',
      depositDate: '',
      amount: '',
      maturityDate: '',
      interestRate: '',
      nomineeName: '',
      nomineeDob: '',
      nomineeRelation: '',
      isNomineeMinor: false,
      nomineeGuardianName: '',
      chequeNo: '',
      chequeDate: '',
      bankName: '',
      postOfficeName: '',
      agentCode: '',
      remark: '',
      cifId1: '',
      cifId2: '',
    });
  };

  // Create / Update entry (no required fields)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      // Update existing
      try {
        const entryDoc = doc(db, 'postalEntries', editingEntryId);
        await updateDoc(entryDoc, {
          ...formData,
          amount: formData.amount ? parseFloat(formData.amount) : '',
          interestRate: formData.interestRate ? parseFloat(formData.interestRate) : '',
          updatedAt: new Date(),
        });

        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === editingEntryId
              ? {
                  ...entry,
                  ...formData,
                  amount: formData.amount ? parseFloat(formData.amount) : '',
                  interestRate: formData.interestRate ? parseFloat(formData.interestRate) : '',
                  updatedAt: new Date(),
                }
              : entry
          )
        );
        closeModal();
      } catch (err) {
        console.error(err);
        alert('Failed to update entry. Please try again.');
      }
    } else {
      // Create new
      try {
        // (No duplicate checks, everything optional)
        const docRef = await addDoc(entriesCollectionRef, {
          ...formData,
          amount: formData.amount ? parseFloat(formData.amount) : '',
          interestRate: formData.interestRate ? parseFloat(formData.interestRate) : '',
          createdAt: new Date(),
        });

        const newEntry = {
          id: docRef.id,
          ...formData,
          amount: formData.amount ? parseFloat(formData.amount) : '',
          interestRate: formData.interestRate ? parseFloat(formData.interestRate) : '',
          createdAt: new Date(),
        };

        setEntries([newEntry, ...entries]);
        closeModal();
      } catch (err) {
        console.error(err);
        alert('Failed to add entry. Please try again.');
      }
    }
  };

  // Delete entry
  const handleDelete = async (id) => {
    const confirmDelete = confirm('Are you sure you want to delete this entry?');
    if (!confirmDelete) return;

    try {
      const entryDoc = doc(db, 'postalEntries', id);
      await deleteDoc(entryDoc);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete entry. Please try again.');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (entries.length === 0) {
      alert('No data available to export.');
      return;
    }

    const data = entries.map((entry, index) => ({
      'No.': index + 1,
      'CIF ID': entry.cifId1,
      'Customer 1': entry.customer1,
      'Customer 2': entry.customer2,
      Product: entry.product,
      'Sub-Product': entry.subProduct,
      'Date of Deposit': entry.depositDate,
      'Amount Deposited': entry.amount,
      'Interest Rate (%)': entry.interestRate,
      'Created At': entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '-',
      'Updated At': entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { 'Postal Entries': worksheet }, SheetNames: ['Postal Entries'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, 'postal_entries.xlsx');
  };

  // Export to PDF
  const exportToPDF = () => {
    if (entries.length === 0) {
      alert('No data available to export.');
      return;
    }

    const docPDF = new jsPDF();
    const tableColumn = [
      'No.',
      'CIF ID',
      'Customer 1',
      'Customer 2',
      'Product',
      'Sub-Product',
      'Date of Deposit',
      'Amount Deposited',
      'Interest Rate (%)',
    ];

    const tableRows = entries.map((entry, index) => [
      index + 1,
      entry.cifId1 || '-',
      entry.customer1 || '-',
      entry.customer2 || '-',
      entry.product || '-',
      entry.subProduct || '-',
      entry.depositDate || '-',
      entry.amount ? `$${entry.amount}` : '-',
      entry.interestRate ? `${entry.interestRate}%` : '-',
    ]);

    docPDF.text('Postal Entries', 14, 15);
    docPDF.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { top: 20 },
      pageBreak: 'auto',
    });

    docPDF.save('postal_entries.pdf');
  };

  // Filtered search
  const filteredEntries = entries.filter((entry) => {
    const term = searchTerm.toLowerCase();
    return (
      (entry.customer1 && entry.customer1.toLowerCase().includes(term)) ||
      (entry.customer2 && entry.customer2.toLowerCase().includes(term)) ||
      (entry.cifId1 && entry.cifId1.toLowerCase().includes(term)) ||
      (entry.cifId2 && entry.cifId2.toLowerCase().includes(term))
    );
  });

  return (
    <Layout>
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-600 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold">Postal Entry</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search by customer or CIF ID..."
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold"
          >
            <FaFileExcel className="mr-2" />
            Excel
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
          >
            <FaFilePdf className="mr-2" />
            PDF
          </button>
          <button
            onClick={openModal}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
          >
            Add
          </button>
        </div>
      </div>

      {/* Modal with a scrollable form (all fields optional) */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h2 className="text-xl mb-4 font-bold">
          {isEditing ? 'Edit Postal Entry' : 'Add New Postal Entry'}
        </h2>

        {/* Scrollable container for the entire form */}
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer 1 */}
              <div>
                <label className="block mb-1 font-semibold">Customer 1</label>
                {loadingClients ? (
                  <div className="text-gray-400">Loading clients...</div>
                ) : (
                  <select
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                    value={formData.customer1}
                    onChange={(e) => setFormData({ ...formData, customer1: e.target.value })}
                  >
                    <option value="">(Optional) Select Customer 1</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.name}>
                        {`${client.clientNumber} - ${client.name}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Customer 2 */}
              <div>
                <label className="block mb-1 font-semibold">Customer 2</label>
                {loadingClients ? (
                  <div className="text-gray-400">Loading clients...</div>
                ) : (
                  <select
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                    value={formData.customer2}
                    onChange={(e) => setFormData({ ...formData, customer2: e.target.value })}
                  >
                    <option value="">(Optional) Select Customer 2</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.name}>
                        {`${client.clientNumber} - ${client.name}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Product */}
              <div>
                <label className="block mb-1 font-semibold">Product</label>
                {loadingProducts ? (
                  <div className="text-gray-400">Loading products...</div>
                ) : (
                  <select
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                    value={formData.product}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        product: e.target.value,
                        subProduct: '',
                      })
                    }
                  >
                    <option value="">(Optional) Select Product</option>
                    {productList.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sub-Product */}
              <div>
                <label className="block mb-1 font-semibold">Sub-Product</label>
                {formData.product && productData?.[formData.product] ? (
                  <select
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                    value={formData.subProduct}
                    onChange={(e) => setFormData({ ...formData, subProduct: e.target.value })}
                  >
                    <option value="">(Optional) Select Sub-Product</option>
                    {productData[formData.product].map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    disabled
                    className="w-full px-3 py-2 bg-gray-800 text-gray-500 rounded border border-gray-600"
                  >
                    <option>No product selected</option>
                  </select>
                )}
              </div>

              {/* Deposit Date */}
              <div>
                <label className="block mb-1 font-semibold">Date of Deposit</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.depositDate}
                  onChange={(e) => setFormData({ ...formData, depositDate: e.target.value })}
                />
              </div>

              {/* Amount Deposited */}
              <div>
                <label className="block mb-1 font-semibold">Amount Deposited</label>
                <input
                  type="number"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              {/* Maturity Date */}
              <div>
                <label className="block mb-1 font-semibold">Maturity Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.maturityDate}
                  onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block mb-1 font-semibold">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                />
              </div>

              {/* Nominee Name */}
              <div>
                <label className="block mb-1 font-semibold">Nominee Name</label>
                <input
                  type="text"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.nomineeName}
                  onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                />
              </div>

              {/* Nominee DOB */}
              <div>
                <label className="block mb-1 font-semibold">Nominee DOB</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.nomineeDob}
                  onChange={(e) => setFormData({ ...formData, nomineeDob: e.target.value })}
                />
              </div>

              {/* Nominee Relation */}
              <div>
                <label className="block mb-1 font-semibold">Nominee Relation</label>
                <input
                  type="text"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.nomineeRelation}
                  onChange={(e) => setFormData({ ...formData, nomineeRelation: e.target.value })}
                />
              </div>

              {/* Is Nominee Minor */}
              <div className="flex items-center space-x-2 mt-6">
                <input
                  id="minor-checkbox"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-600 rounded"
                  checked={formData.isNomineeMinor}
                  onChange={(e) =>
                    setFormData({ ...formData, isNomineeMinor: e.target.checked })
                  }
                />
                <label htmlFor="minor-checkbox" className="text-white">
                  Is Nominee Minor?
                </label>
              </div>

              {/* Nominee Guardian Name */}
              {formData.isNomineeMinor && (
                <div className="md:col-span-2">
                  <label className="block mb-1 font-semibold">Nominee Guardian Name</label>
                  <input
                    type="text"
                    placeholder="(Optional)"
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                    value={formData.nomineeGuardianName}
                    onChange={(e) =>
                      setFormData({ ...formData, nomineeGuardianName: e.target.value })
                    }
                  />
                </div>
              )}

              {/* Cheque No */}
              <div>
                <label className="block mb-1 font-semibold">Cheque No.</label>
                <input
                  type="text"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.chequeNo}
                  onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
                />
              </div>

              {/* Cheque Date */}
              <div>
                <label className="block mb-1 font-semibold">Cheque Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.chequeDate}
                  onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                />
              </div>

              {/* Bank Name */}
              <div>
                <label className="block mb-1 font-semibold">Bank Name</label>
                <input
                  type="text"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>

              {/* Post Office Name */}
              <div>
                <label className="block mb-1 font-semibold">Post Office Name</label>
                <input
                  type="text"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.postOfficeName}
                  onChange={(e) =>
                    setFormData({ ...formData, postOfficeName: e.target.value })
                  }
                />
              </div>

              {/* Agent Code */}
              <div>
                <label className="block mb-1 font-semibold">Agent Code</label>
                <input
                  type="text"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.agentCode}
                  onChange={(e) => setFormData({ ...formData, agentCode: e.target.value })}
                />
              </div>

              {/* Remark */}
              <div className="md:col-span-2">
                <label className="block mb-1 font-semibold">Remark</label>
                <textarea
                  rows="2"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                />
              </div>

              {/* CIF ID 1 */}
              <div>
                <label className="block mb-1 font-semibold">CIF ID (Customer 1)</label>
                <input
                  type="text"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.cifId1}
                  onChange={(e) => setFormData({ ...formData, cifId1: e.target.value })}
                  disabled={isEditing}
                />
              </div>

              {/* CIF ID 2 */}
              <div>
                <label className="block mb-1 font-semibold">CIF ID (Customer 2)</label>
                <input
                  type="text"
                  placeholder="(Optional)"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
                  value={formData.cifId2}
                  onChange={(e) => setFormData({ ...formData, cifId2: e.target.value })}
                />
              </div>
            </div>

            {/* Form buttons */}
            <div className="flex justify-end mt-6 space-x-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded text-white font-semibold ${
                  isEditing
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isEditing ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Data Table */}
      <div className="p-4 overflow-x-auto">
        {loadingEntries ? (
          <div className="text-center text-gray-400">Loading entries...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <table className="min-w-full bg-gray-800">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-gray-600">No.</th>
               
                <th className="py-2 px-4 border-b border-gray-600">Customer Name</th>
                <th className="py-2 px-4 border-b border-gray-600">Product</th>
                <th className="py-2 px-4 border-b border-gray-600">Sub-Product</th>
                <th className="py-2 px-4 border-b border-gray-600">Date of Deposit</th>
                <th className="py-2 px-4 border-b border-gray-600">Amount Deposited</th>
                <th className="py-2 px-4 border-b border-gray-600">Interest Rate (%)</th>
                <th className="py-2 px-4 border-b border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry, index) => {
                  const combinedCustomer = entry.customer2
                    ? `${entry.customer1}, ${entry.customer2}`
                    : entry.customer1;

                  return (
                    <tr key={entry.id} className="text-center">
                      <td className="py-2 px-4 border-b border-gray-600">{index + 1}</td>
                  
                      <td className="py-2 px-4 border-b border-gray-600">
                        {combinedCustomer || '-'}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-600">{entry.product || '-'}</td>
                      <td className="py-2 px-4 border-b border-gray-600">
                        {entry.subProduct || '-'}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-600">
                        {entry.depositDate
                          ? new Date(entry.depositDate).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-600">
                        {entry.amount ? `$${entry.amount}` : '-'}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-600">
                        {entry.interestRate ? `${entry.interestRate}%` : '-'}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-600 space-x-2 flex justify-center">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="flex items-center px-2 py-1 bg-yellow-500 hover:bg-yellow-600 rounded text-white"
                        >
                          <FaEdit className="mr-1 h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 rounded text-white"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="py-4 px-4 border-b border-gray-600 text-center text-gray-400"
                  >
                    No entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
