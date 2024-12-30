import React, { useState, useEffect, useContext } from 'react';
import Layout from '@/components/Layout';
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
import { ClientContext } from '@/context/ClientContext';
import { useProductMaster } from '@/context/ProductContext';

// 1) Import the ProductMaster context

function FdEntry() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const { clients, loading } = useContext(ClientContext);

  // 2) Destructure product data and loading from the product context
  const { data: productData, loading: productLoading } = useProductMaster();

  // Form data structure
  const [formData, setFormData] = useState({
    // New fields for product category & sub-product
    productCategory: '',      // <-- for the selected Category from ProductMaster
    product: '',              // <-- for the selected Sub-Product

    // Step 1 fields (merged old Step 1 + Step 2)
    customer1: '',            // required dropdown
    customer2: '',            // optional dropdown

    depositDate: '',          // date of submission
    interestRate: '',         // number
    tds: '',                  // number (TDS)

    chequeDate: '',
    chequeNumber: '',
    chequeAmount: '',
    bankName: '',
    bankBranch: '',
    bankAccountNumber: '',
    ifscCode: '',
    micrCode: '',
    nomineeName: '',
    nomineeDOB: '',
    nomineeRelation: '',
    isNomineeMinor: false,    // checkbox
    guardianName: '',
    guardianDOB: '',
    guardianRelation: '',

    // Step 2 fields (old Step 3)
    cifId1: '',         // optional
    cifId2: '',         // optional
    dateOfInterest: '',
    fdNumber: '',
    dateOfMaturity: '',
    maturityAmount: '',
    interestAmount: '',
    fileNumber: '',
    remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [fdEntries, setFdEntries] = useState([]);
  const [editId, setEditId] = useState(null);

  const fdCollectionRef = collection(db, 'fdEntries');

  // Fetch FD entries on mount
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

  // Input change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // If changing the productCategory, reset the product (sub-product)
    if (name === 'productCategory') {
      setFormData({
        ...formData,
        productCategory: value,
        product: '', // reset sub-product
      });
      return;
    }

    if (type === 'checkbox') {
      // For the checkbox (isNomineeMinor)
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Basic validation (adjust as needed)
  const validateStep = (step) => {
    let tempErrors = {};

    // Step 1 validations (combined old Step 1 + Step 2)
    if (step === 1) {
      if (!formData.customer1.trim()) {
        tempErrors.customer1 = 'Customer 1 is required.';
      }
      // We now want to ensure the user has selected a productCategory
      if (!formData.productCategory) {
        tempErrors.productCategory = 'Product category is required.';
      }
      // Also ensure a sub-product is chosen
      if (!formData.product) {
        tempErrors.product = 'Sub-Product is required.';
      }
      if (!formData.depositDate) {
        tempErrors.depositDate = 'Deposit date is required.';
      }
      if (!formData.interestRate) {
        tempErrors.interestRate = 'Interest rate is required.';
      }
      // If nominee is minor, guardian details can be required
      if (formData.isNomineeMinor) {
        if (!formData.guardianName.trim()) {
          tempErrors.guardianName = 'Guardian name is required for a minor nominee.';
        }
        if (!formData.guardianDOB) {
          tempErrors.guardianDOB = 'Guardian DOB is required for a minor nominee.';
        }
        if (!formData.guardianRelation.trim()) {
          tempErrors.guardianRelation = 'Guardian relation is required for a minor nominee.';
        }
      }
    }

    // Step 2 validations (old Step 3)
    if (step === 2) {
      // For example, require FD number or dateOfMaturity if you wish
      // if (!formData.fdNumber.trim()) {
      //   tempErrors.fdNumber = 'FD Number is required.';
      // }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  // Submit final form (on Step 2)
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      if (editId) {
        const entryDoc = doc(db, 'fdEntries', editId);
        await updateDoc(entryDoc, formData);
      } else {
        await addDoc(fdCollectionRef, formData);
      }
      fetchFdEntries();

      // Reset form
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting FD entry:', error);
    }
  };

  // Edit FD entry
  const handleEdit = (entry) => {
    setFormData({
      // Pull existing entry data
      productCategory: entry.productCategory || '',
      product: entry.product || '',

      customer1: entry.customer1 || '',
      customer2: entry.customer2 || '',
      depositDate: entry.depositDate || '',
      interestRate: entry.interestRate || '',
      tds: entry.tds || '',

      chequeDate: entry.chequeDate || '',
      chequeNumber: entry.chequeNumber || '',
      chequeAmount: entry.chequeAmount || '',
      bankName: entry.bankName || '',
      bankBranch: entry.bankBranch || '',
      bankAccountNumber: entry.bankAccountNumber || '',
      ifscCode: entry.ifscCode || '',
      micrCode: entry.micrCode || '',
      nomineeName: entry.nomineeName || '',
      nomineeDOB: entry.nomineeDOB || '',
      nomineeRelation: entry.nomineeRelation || '',
      isNomineeMinor: entry.isNomineeMinor || false,
      guardianName: entry.guardianName || '',
      guardianDOB: entry.guardianDOB || '',
      guardianRelation: entry.guardianRelation || '',

      cifId1: entry.cifId1 || '',
      cifId2: entry.cifId2 || '',
      dateOfInterest: entry.dateOfInterest || '',
      fdNumber: entry.fdNumber || '',
      dateOfMaturity: entry.dateOfMaturity || '',
      maturityAmount: entry.maturityAmount || '',
      interestAmount: entry.interestAmount || '',
      fileNumber: entry.fileNumber || '',
      remarks: entry.remarks || '',
    });
    setEditId(entry.id);
    setIsModalOpen(true);
    setCurrentStep(1);
  };

  // Delete FD entry
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

  // Close modal & reset states
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setCurrentStep(1);
    setFormData({
      productCategory: '',
      product: '',

      customer1: '',
      customer2: '',
      depositDate: '',
      interestRate: '',
      tds: '',

      chequeDate: '',
      chequeNumber: '',
      chequeAmount: '',
      bankName: '',
      bankBranch: '',
      bankAccountNumber: '',
      ifscCode: '',
      micrCode: '',
      nomineeName: '',
      nomineeDOB: '',
      nomineeRelation: '',
      isNomineeMinor: false,
      guardianName: '',
      guardianDOB: '',
      guardianRelation: '',

      cifId1: '',
      cifId2: '',
      dateOfInterest: '',
      fdNumber: '',
      dateOfMaturity: '',
      maturityAmount: '',
      interestAmount: '',
      fileNumber: '',
      remarks: '',
    });
    setErrors({});
  };

  // ====== Export to Excel ======
  const exportToExcel = () => {
    const data = fdEntries.map((entry, index) => ({
      'ID': index + 1,
      'Category': entry.productCategory || '-',
      'Sub-Product': entry.product || '-',
      'Customer 1': entry.customer1 || '-',
      'Customer 2': entry.customer2 || '-',
      'Deposit Date': entry.depositDate || '-',
      'Interest Rate': entry.interestRate || '-',
      'TDS': entry.tds || '-',
      'Cheque Date': entry.chequeDate || '-',
      'Cheque Number': entry.chequeNumber || '-',
      'Cheque Amount': entry.chequeAmount || '-',
      'Bank Name': entry.bankName || '-',
      'Bank Branch': entry.bankBranch || '-',
      'Account Number': entry.bankAccountNumber || '-',
      'IFSC Code': entry.ifscCode || '-',
      'MICR Code': entry.micrCode || '-',
      'Nominee Name': entry.nomineeName || '-',
      'Nominee DOB': entry.nomineeDOB || '-',
      'Nominee Relation': entry.nomineeRelation || '-',
      'Is Minor?': entry.isNomineeMinor ? 'Yes' : 'No',
      'Guardian Name': entry.guardianName || '-',
      'Guardian DOB': entry.guardianDOB || '-',
      'Guardian Relation': entry.guardianRelation || '-',
      'CIF ID 1': entry.cifId1 || '-',
      'CIF ID 2': entry.cifId2 || '-',
      'Date of Interest': entry.dateOfInterest || '-',
      'FD Number': entry.fdNumber || '-',
      'Date of Maturity': entry.dateOfMaturity || '-',
      'Maturity Amount': entry.maturityAmount || '-',
      'Interest Amount': entry.interestAmount || '-',
      'File Number': entry.fileNumber || '-',
      'Remarks': entry.remarks || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FD Entries');
    XLSX.writeFile(workbook, 'FD_Entries.xlsx');
  };

  // ====== Export to PDF ======
  const exportToPDF = () => {
    const docPDF = new jsPDF({ orientation: 'landscape' });
    const tableColumn = [
      'ID',
      'Category',
      'Sub-Product',
      'Customer 1',
      'Deposit Date',
      'Interest Rate',
      'Nominee',
    ];
    const tableRows = [];

    fdEntries.forEach((entry, index) => {
      const entryData = [
        index + 1,
        entry.productCategory || '-',
        entry.product || '-',
        entry.customer1 || '-',
        entry.depositDate || '-',
        entry.interestRate || '-',
        entry.nomineeName || '-',
      ];
      tableRows.push(entryData);
    });

    docPDF.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { halign: 'left', fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] },
    });

    docPDF.text('FD Entries', 14, 15);
    docPDF.save('FD_Entries.pdf');
  };

  // Helper for table
  const getPrimaryCustomerName = (entry) => {
    return entry.customer1?.trim()
      ? entry.customer1
      : entry.customer2?.trim()
      ? entry.customer2
      : '-';
  };

  // ====== JSX for Steps ======

  // Step 1: Basic FD + Bank/Nominee Details
  const renderStep1 = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Customer 1 (Required) */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Customer 1 (Required)
        </label>
        <select
          name="customer1"
          value={formData.customer1}
          onChange={handleChange}
          className={`w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border ${
            errors.customer1 ? 'border-red-500' : 'border-gray-600'
          } focus:outline-none`}
          disabled={loading || clients.length === 0}
        >
          <option value="">-- Select Customer 1 --</option>
          {clients.map((client) => (
            <option
              key={client.id}
              value={`${client.name} (${client.clientNumber})`}
            >
              {client.name} ({client.clientNumber})
            </option>
          ))}
        </select>
        {errors.customer1 && (
          <p className="text-red-500 text-xs mt-1">{errors.customer1}</p>
        )}
      </div>

      {/* Customer 2 (Optional) */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Customer 2 (Optional)
        </label>
        <select
          name="customer2"
          value={formData.customer2}
          onChange={handleChange}
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
          disabled={loading || clients.length === 0}
        >
          <option value="">-- Select Customer 2 --</option>
          {clients.map((client) => (
            <option
              key={client.id}
              value={`${client.name} (${client.clientNumber})`}
            >
              {client.name} ({client.clientNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Product Category */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Product Category
        </label>
        <select
          name="productCategory"
          value={formData.productCategory}
          onChange={handleChange}
          className={`w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border ${
            errors.productCategory ? 'border-red-500' : 'border-gray-600'
          } focus:outline-none`}
          disabled={productLoading}
        >
          <option value="">-- Select Category --</option>
          {Object.keys(productData).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.productCategory && (
          <p className="text-red-500 text-xs mt-1">{errors.productCategory}</p>
        )}
      </div>

      {/* Sub-Product */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Sub-Product
        </label>
        <select
          name="product"
          value={formData.product}
          onChange={handleChange}
          className={`w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border ${
            errors.product ? 'border-red-500' : 'border-gray-600'
          } focus:outline-none`}
          disabled={productLoading || !formData.productCategory}
        >
          <option value="">-- Select Sub-Product --</option>
          {formData.productCategory &&
            productData[formData.productCategory]?.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
        </select>
        {errors.product && (
          <p className="text-red-500 text-xs mt-1">{errors.product}</p>
        )}
      </div>

      {/* Date of Submission (Deposit Date) */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Date of Submission
        </label>
        <input
          type="date"
          name="depositDate"
          value={formData.depositDate}
          onChange={handleChange}
          className={`w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border ${
            errors.depositDate ? 'border-red-500' : 'border-gray-600'
          } focus:outline-none`}
        />
        {errors.depositDate && (
          <p className="text-red-500 text-xs mt-1">{errors.depositDate}</p>
        )}
      </div>

      {/* Interest Rate */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Interest Rate (%)
        </label>
        <input
          type="number"
          name="interestRate"
          value={formData.interestRate}
          onChange={handleChange}
          placeholder="e.g., 6.5"
          className={`w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border ${
            errors.interestRate ? 'border-red-500' : 'border-gray-600'
          } focus:outline-none`}
        />
        {errors.interestRate && (
          <p className="text-red-500 text-xs mt-1">{errors.interestRate}</p>
        )}
      </div>

      {/* TDS */}
      <div>
        <label className="block text-xs font-semibold mb-1">TDS (%)</label>
        <input
          type="number"
          name="tds"
          value={formData.tds}
          onChange={handleChange}
          placeholder="e.g., 10"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Cheque Date */}
      <div>
        <label className="block text-xs font-semibold mb-1">Cheque Date</label>
        <input
          type="date"
          name="chequeDate"
          value={formData.chequeDate}
          onChange={handleChange}
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Cheque Number */}
      <div>
        <label className="block text-xs font-semibold mb-1">Cheque Number</label>
        <input
          type="text"
          name="chequeNumber"
          value={formData.chequeNumber}
          onChange={handleChange}
          placeholder="e.g., 123456"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Cheque Amount */}
      <div>
        <label className="block text-xs font-semibold mb-1">Cheque Amount</label>
        <input
          type="number"
          name="chequeAmount"
          value={formData.chequeAmount}
          onChange={handleChange}
          placeholder="e.g., 50000"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Bank Name */}
      <div>
        <label className="block text-xs font-semibold mb-1">Bank Name</label>
        <input
          type="text"
          name="bankName"
          value={formData.bankName}
          onChange={handleChange}
          placeholder="e.g., ABC Bank"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Bank Branch */}
      <div>
        <label className="block text-xs font-semibold mb-1">Branch Name</label>
        <input
          type="text"
          name="bankBranch"
          value={formData.bankBranch}
          onChange={handleChange}
          placeholder="e.g., MG Road Branch"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Account Number */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Account Number
        </label>
        <input
          type="text"
          name="bankAccountNumber"
          value={formData.bankAccountNumber}
          onChange={handleChange}
          placeholder="e.g., 0123456789"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* IFSC Code */}
      <div>
        <label className="block text-xs font-semibold mb-1">IFSC Code</label>
        <input
          type="text"
          name="ifscCode"
          value={formData.ifscCode}
          onChange={handleChange}
          placeholder="e.g., ABCD0123456"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* MICR Code */}
      <div>
        <label className="block text-xs font-semibold mb-1">MICR Code</label>
        <input
          type="text"
          name="micrCode"
          value={formData.micrCode}
          onChange={handleChange}
          placeholder="e.g., 400002345"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Nominee Name */}
      <div>
        <label className="block text-xs font-semibold mb-1">Nominee Name</label>
        <input
          type="text"
          name="nomineeName"
          value={formData.nomineeName}
          onChange={handleChange}
          placeholder="e.g., John Doe"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Nominee DOB */}
      <div>
        <label className="block text-xs font-semibold mb-1">Nominee DOB</label>
        <input
          type="date"
          name="nomineeDOB"
          value={formData.nomineeDOB}
          onChange={handleChange}
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Nominee Relation */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Nominee Relation
        </label>
        <input
          type="text"
          name="nomineeRelation"
          value={formData.nomineeRelation}
          onChange={handleChange}
          placeholder="e.g., Son"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Checkbox: Is Nominee Minor? */}
      <div className="flex items-center space-x-2 mt-2">
        <input
          type="checkbox"
          name="isNomineeMinor"
          checked={formData.isNomineeMinor}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="text-xs font-semibold">Nominee is Minor</label>
      </div>

      {/* Guardian details (show only if nominee is minor) */}
      {formData.isNomineeMinor && (
        <>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Guardian Name
            </label>
            <input
              type="text"
              name="guardianName"
              value={formData.guardianName}
              onChange={handleChange}
              placeholder="e.g., Jane Doe"
              className={`w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border ${
                errors.guardianName ? 'border-red-500' : 'border-gray-600'
              } focus:outline-none`}
            />
            {errors.guardianName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.guardianName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Guardian DOB
            </label>
            <input
              type="date"
              name="guardianDOB"
              value={formData.guardianDOB}
              onChange={handleChange}
              className={`w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border ${
                errors.guardianDOB ? 'border-red-500' : 'border-gray-600'
              } focus:outline-none`}
            />
            {errors.guardianDOB && (
              <p className="text-red-500 text-xs mt-1">
                {errors.guardianDOB}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold mb-1">
              Guardian Relation
            </label>
            <input
              type="text"
              name="guardianRelation"
              value={formData.guardianRelation}
              onChange={handleChange}
              placeholder="e.g., Mother"
              className={`w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border ${
                errors.guardianRelation ? 'border-red-500' : 'border-gray-600'
              } focus:outline-none`}
            />
            {errors.guardianRelation && (
              <p className="text-red-500 text-xs mt-1">
                {errors.guardianRelation}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );

  // Step 2: Additional FD Info (old Step 3)
  const renderStep2 = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* CIF ID 1 */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          CIF ID Number (1)
        </label>
        <input
          type="text"
          name="cifId1"
          value={formData.cifId1}
          onChange={handleChange}
          placeholder="Optional"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* CIF ID 2 */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          CIF ID Number (2)
        </label>
        <input
          type="text"
          name="cifId2"
          value={formData.cifId2}
          onChange={handleChange}
          placeholder="Optional"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Date of Interest */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Date of Interest
        </label>
        <input
          type="date"
          name="dateOfInterest"
          value={formData.dateOfInterest}
          onChange={handleChange}
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* FD Number */}
      <div>
        <label className="block text-xs font-semibold mb-1">FD Number</label>
        <input
          type="text"
          name="fdNumber"
          value={formData.fdNumber}
          onChange={handleChange}
          placeholder="e.g., 9876543210"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Date of Maturity */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Date of Maturity
        </label>
        <input
          type="date"
          name="dateOfMaturity"
          value={formData.dateOfMaturity}
          onChange={handleChange}
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Maturity Amount */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Maturity Amount
        </label>
        <input
          type="number"
          name="maturityAmount"
          value={formData.maturityAmount}
          onChange={handleChange}
          placeholder="e.g., 60000"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Interest Amount */}
      <div>
        <label className="block text-xs font-semibold mb-1">
          Interest Amount
        </label>
        <input
          type="number"
          name="interestAmount"
          value={formData.interestAmount}
          onChange={handleChange}
          placeholder="e.g., 10000"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* File Number */}
      <div>
        <label className="block text-xs font-semibold mb-1">File Number</label>
        <input
          type="text"
          name="fileNumber"
          value={formData.fileNumber}
          onChange={handleChange}
          placeholder="e.g., 00112233"
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none"
        />
      </div>

      {/* Remarks */}
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold mb-1">Remarks</label>
        <textarea
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          placeholder="Any notes or remarks..."
          className="w-full px-2 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none h-20"
        />
      </div>
    </div>
  );

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-black border-b border-gray-600">
        <h1 className="text-2xl font-semibold text-white mb-4 md:mb-0">
          FD Entry
        </h1>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search FD Entries..."
              className="w-full md:w-64 px-3 py-2 text-sm bg-gray-800 text-white placeholder-gray-400 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportToExcel}
              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              PDF
            </button>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setEditId(null);
                setFormData({
                  productCategory: '',
                  product: '',

                  customer1: '',
                  customer2: '',
                  depositDate: '',
                  interestRate: '',
                  tds: '',

                  chequeDate: '',
                  chequeNumber: '',
                  chequeAmount: '',
                  bankName: '',
                  bankBranch: '',
                  bankAccountNumber: '',
                  ifscCode: '',
                  micrCode: '',
                  nomineeName: '',
                  nomineeDOB: '',
                  nomineeRelation: '',
                  isNomineeMinor: false,
                  guardianName: '',
                  guardianDOB: '',
                  guardianRelation: '',

                  cifId1: '',
                  cifId2: '',
                  dateOfInterest: '',
                  fdNumber: '',
                  dateOfMaturity: '',
                  maturityAmount: '',
                  interestAmount: '',
                  fileNumber: '',
                  remarks: '',
                });
                setErrors({});
                setCurrentStep(1);
              }}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Add FD
            </button>
          </div>
        </div>
      </div>

      {/* Modal (Two-step Form) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-start pt-10 z-50 overflow-auto">
          <div className="bg-black border border-gray-600 text-white rounded-lg w-11/12 md:w-3/4 lg:w-2/3 p-6 mx-auto relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-300 hover:text-white transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-semibold mb-4">FD Entry Form</h2>

            {/* Step Indicators */}
            <div className="flex justify-center items-center space-x-2 mb-6">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === step ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>

            {/* Steps */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <div>
                {currentStep === 2 && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-sm bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition mr-2"
                  >
                    Back
                  </button>
                )}
                {currentStep < 2 && (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Next
                  </button>
                )}
                {currentStep === 2 && (
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="p-4 bg-black min-h-screen">
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-700 text-gray-400">
                <th className="px-3 py-2 border border-gray-600">ID</th>
                <th className="px-3 py-2 border border-gray-600">Customer</th>
                <th className="px-3 py-2 border border-gray-600">
                  Product Category
                </th>
                <th className="px-3 py-2 border border-gray-600">
                  Sub-Product
                </th>
                <th className="px-3 py-2 border border-gray-600">
                  Deposit Date
                </th>
                <th className="px-3 py-2 border border-gray-600">
                  Interest Rate
                </th>
                <th className="px-3 py-2 border border-gray-600">Nominee</th>
                <th className="px-3 py-2 border border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fdEntries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-gray-400">
                    No FD Entries Found.
                  </td>
                </tr>
              ) : (
                fdEntries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className="text-gray-300 hover:bg-gray-700 transition"
                  >
                    <td className="px-3 py-2 border border-gray-600">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 border border-gray-600">
                      {getPrimaryCustomerName(entry)}
                    </td>
                    <td className="px-3 py-2 border border-gray-600">
                      {entry.productCategory || '-'}
                    </td>
                    <td className="px-3 py-2 border border-gray-600">
                      {entry.product || '-'}
                    </td>
                    <td className="px-3 py-2 border border-gray-600">
                      {entry.depositDate || '-'}
                    </td>
                    <td className="px-3 py-2 border border-gray-600">
                      {entry.interestRate || '-'}
                    </td>
                    <td className="px-3 py-2 border border-gray-600">
                      {entry.nomineeName || '-'}
                    </td>
                    <td className="px-3 py-2 border border-gray-600 flex space-x-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="flex items-center px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                      >
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

export default FdEntry;
