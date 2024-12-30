// pages/insurance.js

import React, { useContext, useState, useEffect } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaFilePdf,
  FaFileExcel,
} from 'react-icons/fa';
import Head from 'next/head';
import Layout from '@/components/Layout'; // Ensure you have a Layout component
import { ProductContext } from '@/context/ProductContext';
import { db } from '@/Firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';

const Insurance = () => {
  const { productList, loadingProducts, productError } = useContext(ProductContext);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [insuranceData, setInsuranceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);

  // Multi-step form states
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customer: '',
    product: '',
    policyDate: '',
    sumAssured: '',
    maturityDate: '',
    plan: '',
    terms: '',
    premiumMode: '',
    premiumAmount: '',
    nomineeName: '',
    nomineeDOB: '',
    nomineeAddress: '',
    chequeNumber: '',
    chequeDate: '',
    bankName: '',
  });

  // Handle input changes for form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Open form modal (resetting formData and steps)
  const handleAdd = () => {
    setFormData({
      customer: '',
      product: '',
      policyDate: '',
      sumAssured: '',
      maturityDate: '',
      plan: '',
      terms: '',
      premiumMode: '',
      premiumAmount: '',
      nomineeName: '',
      nomineeDOB: '',
      nomineeAddress: '',
      chequeNumber: '',
      chequeDate: '',
      bankName: '',
    });
    setEditId(null);
    setStep(1);
    setIsFormOpen(true);
  };

  // Close form modal
  const handleClose = () => setIsFormOpen(false);

  // Step navigation
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // Submit form data (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation: ensure all fields are filled
    for (const key in formData) {
      if (formData[key] === '') {
        alert('Please fill out all fields.');
        return;
      }
    }

    try {
      if (editId) {
        // Edit existing entry
        const insuranceDoc = doc(db, 'insurances', editId);
        await updateDoc(insuranceDoc, { ...formData });
        alert('Insurance entry updated successfully.');
      } else {
        // Add new entry
        await addDoc(collection(db, 'insurances'), { ...formData });
        alert('Insurance entry added successfully.');
      }

      setIsFormOpen(false);
      setEditId(null);
      setStep(1);
      // No need to update local state; onSnapshot will handle real-time updates
    } catch (error) {
      console.error('Error adding/updating insurance entry:', error);
      alert('Failed to add/update insurance entry.');
    }
  };

  // Delete entry
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        const insuranceDoc = doc(db, 'insurances', id);
        await deleteDoc(insuranceDoc);
        alert('Insurance entry deleted successfully.');
      } catch (error) {
        console.error('Error deleting insurance entry:', error);
        alert('Failed to delete insurance entry.');
      }
    }
  };

  // Edit entry
  const handleEdit = (id) => {
    const entry = insuranceData.find((item) => item.id === id);
    if (entry) {
      setFormData({ ...entry });
      setEditId(id);
      setStep(1); // Go to the first step of the form for editing
      setIsFormOpen(true);
    }
  };

  // Fetch insurance data from Firestore in real-time
  useEffect(() => {
    const insuranceCollection = collection(db, 'insurances');
    const unsubscribe = onSnapshot(insuranceCollection, (snapshot) => {
      const insurances = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInsuranceData(insurances);
    }, (error) => {
      console.error('Error fetching insurance data:', error);
      alert('Failed to fetch insurance data.');
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Filtered data based on search
  const filteredData = insuranceData.filter((item) =>
    [item.customer, item.product, item.nomineeName, item.bankName]
      .some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Placeholder functions for PDF and Excel export
  const handleExportPDF = () => {
    alert('PDF download functionality not implemented yet.');
  };

  const handleExportExcel = () => {
    alert('Excel download functionality not implemented yet.');
  };

  return (
    <Layout>
      <>
        <Head>
          <title>Insurance Entry</title>
        </Head>
        <div className="min-h-screen bg-black text-white p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Insurance Entry</h1>
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
              />
              {/* Add Button */}
              <button
                onClick={handleAdd}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-500 rounded transition duration-200"
              >
                <FaPlus className="mr-2" /> Add
              </button>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex justify-end space-x-4 mb-4">
            <button
              onClick={handleExportPDF}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-500 rounded transition duration-200"
            >
              <FaFilePdf className="mr-2" /> PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center px-4 py-2 bg-green-700 hover:bg-green-600 rounded transition duration-200"
            >
              <FaFileExcel className="mr-2" /> Excel
            </button>
          </div>

          {/* Insurance Data Table */}
          <div className="overflow-x-auto">
            <div className="min-w-full bg-black text-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white"
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white"
                    >
                      Customer Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white"
                    >
                      Policy Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white"
                    >
                      Nominee Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white"
                    >
                      Bank Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-white"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-black divide-y hover:text-black divide-gray-200">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr
                        key={item.id}
                        className="border border-gray-600 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white ">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white ">
                          {item.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white ">
                          {item.product}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white ">
                          {new Date(item.policyDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white ">
                          {item.nomineeName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white ">
                          {item.bankName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(item.id)}
                              className="text-yellow-500 hover:text-yellow-600"
                              aria-label={`Edit entry ${item.id}`}
                              title="Edit"
                            >
                              <FaEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-500 hover:text-red-600"
                              aria-label={`Delete entry ${item.id}`}
                              title="Delete"
                            >
                              <FaTrash size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500"
                      >
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add/Edit Form Modal (Multi-Step) */}
          {isFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
              <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl overflow-y-auto max-h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    {editId ? 'Edit Insurance Entry' : 'Add Insurance Entry'}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="text-red-500 hover:text-red-400"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  {step === 1 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1">Customer</label>
                        <select
                          name="customer"
                          value={formData.customer}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        >
                          <option value="">Select Customer</option>
                          <option value="Customer A">Customer A</option>
                          <option value="Customer B">Customer B</option>
                          <option value="Customer C">Customer C</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1">Product</label>
                        <select
                          name="product"
                          value={formData.product}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        >
                          <option value="">Select Product</option>
                          {loadingProducts ? (
                            <option disabled>Loading products...</option>
                          ) : productError ? (
                            <option disabled>Error loading products</option>
                          ) : (
                            productList.map((product) => (
                              <option key={product.id} value={product.name}>
                                {product.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1">Date of Policy</label>
                        <input
                          type="date"
                          name="policyDate"
                          value={formData.policyDate}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Sum Assured</label>
                        <input
                          type="number"
                          name="sumAssured"
                          value={formData.sumAssured}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                          min="0"
                        />
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1">Maturity Date</label>
                        <input
                          type="date"
                          name="maturityDate"
                          value={formData.maturityDate}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Plan</label>
                        <input
                          type="text"
                          name="plan"
                          value={formData.plan}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Terms</label>
                        <input
                          type="text"
                          name="terms"
                          value={formData.terms}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Mode of Premium</label>
                        <select
                          name="premiumMode"
                          value={formData.premiumMode}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        >
                          <option value="">Select Mode</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1">Premium Amount</label>
                        <input
                          type="number"
                          name="premiumAmount"
                          value={formData.premiumAmount}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Nominee Name</label>
                        <input
                          type="text"
                          name="nomineeName"
                          value={formData.nomineeName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Nominee DOB</label>
                        <input
                          type="date"
                          name="nomineeDOB"
                          value={formData.nomineeDOB}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Nominee Address</label>
                        <input
                          type="text"
                          name="nomineeAddress"
                          value={formData.nomineeAddress}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  )}
                  {step === 4 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1">Cheque Number</label>
                        <input
                          type="text"
                          name="chequeNumber"
                          value={formData.chequeNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block mb-1">Cheque Date</label>
                        <input
                          type="date"
                          name="chequeDate"
                          value={formData.chequeDate}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block mb-1">Bank Name</label>
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  )}
                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-4">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                      >
                        Back
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded"
                      >
                        Cancel
                      </button>
                    )}
                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded"
                      >
                        {editId ? 'Update' : 'Submit'}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </>
    </Layout>
  );
};

export default Insurance;
