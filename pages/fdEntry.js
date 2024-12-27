import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout'; // Ensure this component exists
import { db } from '@/Firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function fdEntry() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    customer1: '',
    customer2: '',
    product: '',
    depositDate: '',
    amountDeposited: '',
    maturityDate: '',
    interestRate: '',
    nominee1: '',
    nominee2: '',
    cifId: '',
    chequeNumber: '',
    chequeDate: '',
    bankName: '',
  });
  const [fdEntries, setFdEntries] = useState([]);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const fdCollectionRef = collection(db, 'fdEntries');

  const fetchFdEntries = async () => {
    try {
      const data = await getDocs(fdCollectionRef);
      const entries = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setFdEntries(entries);
    } catch (error) {
      console.error('Error fetching FD entries:', error);
    }
  };

  useEffect(() => {
    fetchFdEntries();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.customer1.trim() && !formData.customer2.trim()) {
      tempErrors.customers = 'At least one customer name is required.';
    }
    if (!formData.product.trim()) {
      tempErrors.product = 'Product is required.';
    }
    if (!formData.depositDate) {
      tempErrors.depositDate = 'Deposit date is required.';
    }
    if (!formData.amountDeposited) {
      tempErrors.amountDeposited = 'Amount deposited is required.';
    }
    if (!formData.maturityDate) {
      tempErrors.maturityDate = 'Maturity date is required.';
    }
    if (!formData.interestRate) {
      tempErrors.interestRate = 'Interest rate is required.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      if (editId) {
        const entryDoc = doc(db, 'fdEntries', editId);
        await updateDoc(entryDoc, formData);
      } else {
        await addDoc(fdCollectionRef, formData);
      }
      fetchFdEntries();

      setFormData({
        customer1: '',
        customer2: '',
        product: '',
        depositDate: '',
        amountDeposited: '',
        maturityDate: '',
        interestRate: '',
        nominee1: '',
        nominee2: '',
        cifId: '',
        chequeNumber: '',
        chequeDate: '',
        bankName: '',
      });
      setIsModalOpen(false);
      setCurrentStep(1);
      setEditId(null);
      setErrors({});
    } catch (error) {
      console.error('Error submitting FD entry:', error);
    }
  };

  const handleEdit = (entry) => {
    setFormData({
      customer1: entry.customer1 || '',
      customer2: entry.customer2 || '',
      product: entry.product || '',
      depositDate: entry.depositDate || '',
      amountDeposited: entry.amountDeposited || '',
      maturityDate: entry.maturityDate || '',
      interestRate: entry.interestRate || '',
      nominee1: entry.nominee1 || '',
      nominee2: entry.nominee2 || '',
      cifId: entry.cifId || '',
      chequeNumber: entry.chequeNumber || '',
      chequeDate: entry.chequeDate || '',
      bankName: entry.bankName || '',
    });
    setEditId(entry.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        const entryDoc = doc(db, 'fdEntries', id);
        await deleteDoc(entryDoc);
        fetchFdEntries();
      } catch (error) {
        console.error('Error deleting FD entry:', error);
      }
    }
  };

  // Export all data to Excel
  const exportToExcel = () => {
    const data = fdEntries.map((entry, index) => ({
      ID: index + 1,
      'Customer 1': entry.customer1 || '-',
      'Customer 2': entry.customer2 || '-',
      'Product': entry.product || '-',
      'Deposit Date': entry.depositDate || '-',
      'Amount Deposited': entry.amountDeposited || '-',
      'Maturity Date': entry.maturityDate || '-',
      'Interest Rate': entry.interestRate || '-',
      'Nominee 1': entry.nominee1 || '-',
      'Nominee 2': entry.nominee2 || '-',
      'CIF ID': entry.cifId || '-',
      'Cheque Number': entry.chequeNumber || '-',
      'Cheque Date': entry.chequeDate || '-',
      'Bank Name': entry.bankName || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FD Entries');
    XLSX.writeFile(workbook, 'FD_Entries.xlsx');
  };

  // Export all data to PDF
  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const tableColumn = [
      'ID',
      'Customer 1',
      'Customer 2',
      'Product',
      'Deposit Date',
      'Amount Deposited',
      'Maturity Date',
      'Interest Rate',
      'Nominee 1',
      'Nominee 2',
      'CIF ID',
      'Cheque Number',
      'Cheque Date',
      'Bank Name',
    ];
    const tableRows = [];

    fdEntries.forEach((entry, index) => {
      const entryData = [
        index + 1,
        entry.customer1 || '-',
        entry.customer2 || '-',
        entry.product || '-',
        entry.depositDate || '-',
        entry.amountDeposited || '-',
        entry.maturityDate || '-',
        entry.interestRate || '-',
        entry.nominee1 || '-',
        entry.nominee2 || '-',
        entry.cifId || '-',
        entry.chequeNumber || '-',
        entry.chequeDate || '-',
        entry.bankName || '-',
      ];
      tableRows.push(entryData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { halign: 'left', fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] },
    });

    doc.text('FD Entries', 14, 15);
    doc.save('FD_Entries.pdf');
  };

  const getCustomerNameForTable = (entry) => {
    return entry.customer1.trim() ? entry.customer1 : (entry.customer2.trim() ? entry.customer2 : '-');
  };

  const getNomineeNameForTable = (entry) => {
    return entry.nominee1.trim() ? entry.nominee1 : (entry.nominee2.trim() ? entry.nominee2 : '-');
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-black border-b border-gray-600">
        <h1 className="text-3xl font-semibold text-white mb-4 md:mb-0">FD Entry</h1>
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search FD Entries..."
              className="w-full md:w-64 px-4 py-2 bg-gray-800 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  strokeWidth={2} 
                  d="M12 14l9-5-9-5-9 5 9 5z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 14v7m0 0H5m7 0h7" 
                />
              </svg>
              PDF
            </button>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setEditId(null);
                setFormData({
                  customer1: '',
                  customer2: '',
                  product: '',
                  depositDate: '',
                  amountDeposited: '',
                  maturityDate: '',
                  interestRate: '',
                  nominee1: '',
                  nominee2: '',
                  cifId: '',
                  chequeNumber: '',
                  chequeDate: '',
                  bankName: '',
                });
                setErrors({});
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add FD
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 overflow-auto">
          <div className="bg-gray-800 text-white rounded-lg w-11/12 md:w-3/4 lg:w-2/3 p-8 mx-auto my-8 relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setCurrentStep(1);
                setEditId(null);
                setFormData({
                  customer1: '',
                  customer2: '',
                  product: '',
                  depositDate: '',
                  amountDeposited: '',
                  maturityDate: '',
                  interestRate: '',
                  nominee1: '',
                  nominee2: '',
                  cifId: '',
                  chequeNumber: '',
                  chequeDate: '',
                  bankName: '',
                });
                setErrors({});
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl mb-6">FD Entry Form</h2>
            <div className="space-y-6">
              {/* Step Indicators */}
              <div className="flex justify-center space-x-4 mb-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 1 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                  1
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                  2
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 3 ? 'bg-blue-600' : 'bg-gray-600'}`}>
                  3
                </div>
              </div>

              {currentStep === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  {errors.customers && (
                    <div className="col-span-2">
                      <p className="text-red-500">{errors.customers}</p>
                    </div>
                  )}
                  <div>
                    <input
                      type="text"
                      name="customer1"
                      value={formData.customer1}
                      onChange={handleChange}
                      placeholder="Customer 1 Name"
                      className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="customer2"
                      value={formData.customer2}
                      onChange={handleChange}
                      placeholder="Customer 2 Name (Optional)"
                      className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="product"
                      value={formData.product}
                      onChange={handleChange}
                      placeholder="Product Name"
                      className={`w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border ${
                        errors.product ? 'border-red-500' : 'border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                    {errors.product && <p className="text-red-500 mt-1">{errors.product}</p>}
                  </div>
                  <div>
                    <input
                      type="date"
                      name="depositDate"
                      value={formData.depositDate}
                      onChange={handleChange}
                      placeholder="Date of Deposit"
                      className={`w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border ${
                        errors.depositDate ? 'border-red-500' : 'border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                    {errors.depositDate && <p className="text-red-500 mt-1">{errors.depositDate}</p>}
                  </div>
                  <div>
                    <input
                      type="number"
                      name="amountDeposited"
                      value={formData.amountDeposited}
                      onChange={handleChange}
                      placeholder="Amount Deposited"
                      className={`w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border ${
                        errors.amountDeposited ? 'border-red-500' : 'border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                    {errors.amountDeposited && <p className="text-red-500 mt-1">{errors.amountDeposited}</p>}
                  </div>
                  <div>
                    <input
                      type="date"
                      name="maturityDate"
                      value={formData.maturityDate}
                      onChange={handleChange}
                      placeholder="Maturity Date"
                      className={`w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border ${
                        errors.maturityDate ? 'border-red-500' : 'border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                    {errors.maturityDate && <p className="text-red-500 mt-1">{errors.maturityDate}</p>}
                  </div>
                  <div>
                    <input
                      type="number"
                      name="interestRate"
                      value={formData.interestRate}
                      onChange={handleChange}
                      placeholder="Rate of Interest (%)"
                      className={`w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border ${
                        errors.interestRate ? 'border-red-500' : 'border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
                    />
                    {errors.interestRate && <p className="text-red-500 mt-1">{errors.interestRate}</p>}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="nominee1"
                      value={formData.nominee1}
                      onChange={handleChange}
                      placeholder="Nominee 1 Name"
                      className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="nominee2"
                      value={formData.nominee2}
                      onChange={handleChange}
                      placeholder="Nominee 2 Name (Optional)"
                      className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      name="cifId"
                      value={formData.cifId}
                      onChange={handleChange}
                      placeholder="CIF ID Number"
                      className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="chequeNumber"
                      value={formData.chequeNumber}
                      onChange={handleChange}
                      placeholder="Cheque Number"
                      className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      name="chequeDate"
                      value={formData.chequeDate}
                      onChange={handleChange}
                      placeholder="Cheque Date"
                      className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="Bank Name"
                      className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setCurrentStep(1);
                    setEditId(null);
                    setFormData({
                      customer1: '',
                      customer2: '',
                      product: '',
                      depositDate: '',
                      amountDeposited: '',
                      maturityDate: '',
                      interestRate: '',
                      nominee1: '',
                      nominee2: '',
                      cifId: '',
                      chequeNumber: '',
                      chequeDate: '',
                      bankName: '',
                    });
                    setErrors({});
                  }}
                  className="px-6 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
                <div>
                  {currentStep > 1 && (
                    <button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="px-6 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 transition mr-4"
                    >
                      Back
                    </button>
                  )}
                  {currentStep < 3 && (
                    <button
                      onClick={() => {
                        if (currentStep === 1 && !validate()) return;
                        setCurrentStep(currentStep + 1);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Next
                    </button>
                  )}
                  {currentStep === 3 && (
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="p-6 bg-black min-h-screen">
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-700 text-gray-400">
                <th className="px-4 py-3 border border-gray-600">ID</th>
                <th className="px-4 py-3 border border-gray-600">Customer Name</th>
                <th className="px-4 py-3 border border-gray-600">Product Name</th>
                <th className="px-4 py-3 border border-gray-600">Date of Deposit</th>
                <th className="px-4 py-3 border border-gray-600">Amount Deposited</th>
                <th className="px-4 py-3 border border-gray-600">Nominee Name</th>
                <th className="px-4 py-3 border border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fdEntries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">
                    No FD Entries Found.
                  </td>
                </tr>
              ) : (
                fdEntries.map((entry, index) => (
                  <tr key={entry.id} className="text-gray-300 hover:bg-gray-700 transition">
                    <td className="px-4 py-3 border border-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 border border-gray-600">{getCustomerNameForTable(entry)}</td>
                    <td className="px-4 py-3 border border-gray-600">{entry.product || '-'}</td>
                    <td className="px-4 py-3 border border-gray-600">{entry.depositDate || '-'}</td>
                    <td className="px-4 py-3 border border-gray-600">{entry.amountDeposited || '-'}</td>
                    <td className="px-4 py-3 border border-gray-600">{getNomineeNameForTable(entry)}</td>
                    <td className="px-4 py-3 border border-gray-600 flex space-x-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="flex items-center px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536M16.5 6.5a2.121 2.121 0 113 3L7.5 21.5H3v-4l13-13z"
                          />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default fdEntry;
