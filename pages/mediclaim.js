import Layout from '@/components/Layout';
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
import XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


// Make sure you have Firestore initialized in another file and imported here if needed.
// For example:
// import { db } from '@/firebase'; // If you have a firebase.js that exports db
// Otherwise, if db is already globally available, just use it directly.

const db = getFirestore(); // Use the Firestore instance from your Firebase initialization

const Mediclaim = () => {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State to toggle between Single and Family forms
  const [formType, setFormType] = useState(null); // 'Single' or 'Family'

  // State to manage current step in the form
  const [currentStep, setCurrentStep] = useState(1);

  // State for Single Form data
  const [singleForm, setSingleForm] = useState({
    fullName: '',
    dob: '',
    gender: '',
    contactNumber: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
    },
    occupation: '',
    annualIncome: '',
    policyDetails: {
      policyNumber: '',
      insuranceCompany: '',
      startDate: '',
      expiryDate: '',
      policyType: '',
      sumInsured: '',
    },
    paymentInfo: {
      paymentMode: '',
      paymentFrequency: '',
      bankDetails: {
        accountHolder: '',
        accountNumber: '',
        bankName: '',
        branch: '',
        ifsc: '',
      },
    },
  });

  // State for Family Form data
  const [familyForm, setFamilyForm] = useState({
    policyholderName: '',
    gender: '',
    dob: '',
    age: '',
    occupation: '',
    contactDetails: {
      mobileNumber: '',
      email: '',
      residentialAddress: '',
      pinCode: '',
    },
    familyMembers: [
      {
        fullName: '',
        relationship: '',
        gender: '',
        dob: '',
        age: '',
        nomineeName: '',
        nomineeRelationship: '',
      },
    ],
    paymentInfo: {
      paymentMode: '',
      paymentFrequency: '',
      bankDetails: {
        accountHolder: '',
        accountNumber: '',
        bankName: '',
        branch: '',
        ifsc: '',
      },
    },
  });

  // State to hold all entries
  const [entries, setEntries] = useState([]);

  // State for filter
  const [filter, setFilter] = useState('All'); // 'All', 'Single', 'Family'

  // Load entries from localStorage and Firestore on mount
  useEffect(() => {
    const storedEntries = JSON.parse(localStorage.getItem('mediclaim')) || [];
    // Merge local entries with Firestore entries
    const fetchEntries = async () => {
      const querySnapshot = await getDocs(collection(db, 'mediclaim'));
      const firestoreEntries = [];
      querySnapshot.forEach((doc) => {
        firestoreEntries.push({ id: doc.id, ...doc.data() });
      });

      // Merge and remove duplicates if any (based on some unique field)
      // Assuming localStorage and Firestore won't have duplicates as Firestore is the source of truth.
      // Otherwise, you'd need a logic to merge based on some unique identifier.
      const allEntries = [...storedEntries, ...firestoreEntries];
      setEntries(allEntries);
    };

    fetchEntries();
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mediclaim', JSON.stringify(entries));
  }, [entries]);

  // Handlers for opening and closing modal
  const openModal = () => {
    setIsModalOpen(true);
    setFormType(null); // Reset form type selection
    setCurrentStep(1); // Reset to first step
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setFormType(null);
    setCurrentStep(1);
  };

  // Add Single entry to Firestore
  const addSingleEntryToFirestore = async (newEntry) => {
    const docRef = await addDoc(collection(db, 'mediclaim'), newEntry);
    return { id: docRef.id, ...newEntry };
  };

  // Add Family entry to Firestore
  const addFamilyEntryToFirestore = async (newEntry) => {
    const docRef = await addDoc(collection(db, 'mediclaim'), newEntry);
    return { id: docRef.id, ...newEntry };
  };

  // Handlers for form submissions
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    const newEntry = { type: 'Single', data: singleForm };
    const firestoreEntry = await addSingleEntryToFirestore(newEntry);
    setEntries([...entries, firestoreEntry]);

    // Reset form
    setSingleForm({
      fullName: '',
      dob: '',
      gender: '',
      contactNumber: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
      },
      occupation: '',
      annualIncome: '',
      policyDetails: {
        policyNumber: '',
        insuranceCompany: '',
        startDate: '',
        expiryDate: '',
        policyType: '',
        sumInsured: '',
      },
      paymentInfo: {
        paymentMode: '',
        paymentFrequency: '',
        bankDetails: {
          accountHolder: '',
          accountNumber: '',
          bankName: '',
          branch: '',
          ifsc: '',
        },
      },
    });
    closeModal();
  };

  const handleFamilySubmit = async (e) => {
    e.preventDefault();
    const newEntry = { type: 'Family', data: familyForm };
    const firestoreEntry = await addFamilyEntryToFirestore(newEntry);
    setEntries([...entries, firestoreEntry]);

    // Reset form
    setFamilyForm({
      policyholderName: '',
      gender: '',
      dob: '',
      age: '',
      occupation: '',
      contactDetails: {
        mobileNumber: '',
        email: '',
        residentialAddress: '',
        pinCode: '',
      },
      familyMembers: [
        {
          fullName: '',
          relationship: '',
          gender: '',
          dob: '',
          age: '',
          nomineeName: '',
          nomineeRelationship: '',
        },
      ],
      paymentInfo: {
        paymentMode: '',
        paymentFrequency: '',
        bankDetails: {
          accountHolder: '',
          accountNumber: '',
          bankName: '',
          branch: '',
          ifsc: '',
        },
      },
    });
    closeModal();
  };

  // Handlers for adding family members
  const addFamilyMember = () => {
    setFamilyForm({
      ...familyForm,
      familyMembers: [
        ...familyForm.familyMembers,
        {
          fullName: '',
          relationship: '',
          gender: '',
          dob: '',
          age: '',
          nomineeName: '',
          nomineeRelationship: '',
        },
      ],
    });
  };

  // Filtered entries based on filter state
  const filteredEntries =
    filter === 'All' ? entries : entries.filter((entry) => entry.type === filter);

  // Handlers for navigating form steps
  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  // Handlers for form field changes
  const handleSingleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setSingleForm({
        ...singleForm,
        address: { ...singleForm.address, [addressField]: value },
      });
    } else if (name.startsWith('policyDetails.')) {
      const policyField = name.split('.')[1];
      setSingleForm({
        ...singleForm,
        policyDetails: { ...singleForm.policyDetails, [policyField]: value },
      });
    } else if (name.startsWith('paymentInfo.bankDetails.')) {
      const bankField = name.split('.')[2];
      setSingleForm({
        ...singleForm,
        paymentInfo: {
          ...singleForm.paymentInfo,
          bankDetails: { ...singleForm.paymentInfo.bankDetails, [bankField]: value },
        },
      });
    } else if (name.startsWith('paymentInfo.')) {
      const paymentField = name.split('.')[1];
      setSingleForm({
        ...singleForm,
        paymentInfo: { ...singleForm.paymentInfo, [paymentField]: value },
      });
    } else {
      setSingleForm({ ...singleForm, [name]: value });
    }
  };

  const handleFamilyChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contactDetails.')) {
      const contactField = name.split('.')[1];
      setFamilyForm({
        ...familyForm,
        contactDetails: { ...familyForm.contactDetails, [contactField]: value },
      });
    } else if (name.startsWith('paymentInfo.bankDetails.')) {
      const bankField = name.split('.')[2];
      setFamilyForm({
        ...familyForm,
        paymentInfo: {
          ...familyForm.paymentInfo,
          bankDetails: { ...familyForm.paymentInfo.bankDetails, [bankField]: value },
        },
      });
    } else if (name.startsWith('paymentInfo.')) {
      const paymentField = name.split('.')[1];
      setFamilyForm({
        ...familyForm,
        paymentInfo: { ...familyForm.paymentInfo, [paymentField]: value },
      });
    } else {
      setFamilyForm({ ...familyForm, [name]: value });
    }
  };

  const handleFamilyMemberChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMembers = [...familyForm.familyMembers];
    updatedMembers[index][name] = value;
    setFamilyForm({ ...familyForm, familyMembers: updatedMembers });
  };

  // Delete Entry from Firebase and state
  const handleDelete = async (entryId, index) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      if (entryId) {
        await deleteDoc(doc(db, 'mediclaim', entryId));
      }
      const updatedEntries = entries.filter((_, i) => i !== index);
      setEntries(updatedEntries);
    }
  };


  const flattenSingleData = (data) => {
    return {
      'Type': 'Single',
      'Full Name': data.fullName,
      'DOB': data.dob,
      'Gender': data.gender,
      'Contact Number': data.contactNumber,
      'Email': data.email,
      'Address_Street': data.address.street,
      'Address_City': data.address.city,
      'Address_State': data.address.state,
      'Address_Zip': data.address.zip,
      'Occupation': data.occupation,
      'Annual Income': data.annualIncome,
      'Policy Number': data.policyDetails.policyNumber,
      'Insurance Company': data.policyDetails.insuranceCompany,
      'Policy Start Date': data.policyDetails.startDate,
      'Policy Expiry Date': data.policyDetails.expiryDate,
      'Policy Type': data.policyDetails.policyType,
      'Sum Insured': data.policyDetails.sumInsured,
      'Payment Mode': data.paymentInfo.paymentMode,
      'Payment Frequency': data.paymentInfo.paymentFrequency,
      'Bank Account Holder': data.paymentInfo.bankDetails.accountHolder,
      'Bank Account Number': data.paymentInfo.bankDetails.accountNumber,
      'Bank Name': data.paymentInfo.bankDetails.bankName,
      'Bank Branch': data.paymentInfo.bankDetails.branch,
      'Bank IFSC': data.paymentInfo.bankDetails.ifsc,
    };
  };


  const flattenFamilyData = (data) => {

  const membersFlattened = data.familyMembers.map((member, i) => {
    return {
      [`Member ${i+1} Name`]: member.fullName,
      [`Member ${i+1} Relationship`]: member.relationship,
      [`Member ${i+1} Gender`]: member.gender,
      [`Member ${i+1} DOB`]: member.dob,
      [`Member ${i+1} Age`]: member.age,
      [`Member ${i+1} Nominee Name`]: member.nomineeName,
      [`Member ${i+1} Nominee Relationship`]: member.nomineeRelationship,
    };
  });

  let membersObj = {};
  membersFlattened.forEach(m => {
    membersObj = { ...membersObj, ...m };
  });


  return {
    'Type': 'Family',
    'Policyholder Name': data.policyholderName,
    'Gender': data.gender,
    'DOB': data.dob,
    'Age': data.age,
    'Occupation': data.occupation,
    'Mobile Number': data.contactDetails.mobileNumber,
    'Email': data.contactDetails.email,
    'Residential Address': data.contactDetails.residentialAddress,
    'PIN Code': data.contactDetails.pinCode,
    'Payment Mode': data.paymentInfo.paymentMode,
    'Payment Frequency': data.paymentInfo.paymentFrequency,
    'Bank Account Holder': data.paymentInfo.bankDetails.accountHolder,
    'Bank Account Number': data.paymentInfo.bankDetails.accountNumber,
    'Bank Name': data.paymentInfo.bankDetails.bankName,
    'Bank Branch': data.paymentInfo.bankDetails.branch,
    'Bank IFSC': data.paymentInfo.bankDetails.ifsc,
    ...membersObj
  };
};

  // Export to Excel
  const exportToExcel = () => {
    // Ensure this runs on the client
    if (typeof window === 'undefined') return;
    
    const data = filteredEntries.map((entry) => {
      return entry.type === 'Single' 
        ? flattenSingleData(entry.data) 
        : flattenFamilyData(entry.data);
    });
  
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entries');
    XLSX.writeFile(workbook, 'mediclaim_full_data.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let currentY = 10;
  
    doc.setFontSize(14);
    doc.text('MediClaim Detailed Entries', 14, currentY);
    currentY += 10;
  
    filteredEntries.forEach((entry, index) => {
      const entryData = entry.type === 'Single' ? flattenSingleData(entry.data) : flattenFamilyData(entry.data);
  
      // Convert the entryData object into rows suitable for autoTable
      const rows = Object.entries(entryData).map(([key, value]) => ([key, value]));
  
      doc.setFontSize(12);
      doc.text(`Entry ${index + 1}`, 14, currentY);
      currentY += 5;
  
      doc.autoTable({
        startY: currentY,
        head: [['Field', 'Value']],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // This checks if we reached bottom of page. If so, next table will continue after page break
        }
      });
  
      currentY = doc.lastAutoTable.finalY + 10;
      // If space is not enough for next entry, add a page
      if (currentY > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        currentY = 10;
      }
    });
  
    doc.save('mediclaim_full_data.pdf');
  };

  return (
    <Layout>
      <div className="p-6 bg-black min-h-screen text-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">MediClaim</h1>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search..."
              className="px-4 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400"
            />
            <button
              onClick={openModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Add Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div className="bg-black rounded-lg w-11/12 md:w-3/4 lg:w-2/3 max-h-screen overflow-y-auto p-6 border border-gray-600 relative">
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white text-2xl font-bold"
              >
                &times;
              </button>

              {/* Form Type Selection */}
              {!formType && (
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setFormType('Single')}
                    className={`px-4 py-2 rounded-md border border-gray-600 ${
                      formType === 'Single' ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setFormType('Family')}
                    className={`px-4 py-2 rounded-md border border-gray-600 ${
                      formType === 'Family' ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    Family
                  </button>
                </div>
              )}

              {/* Single Form */}
              {formType === 'Single' && (
                <form onSubmit={handleSingleSubmit} className="space-y-6">
                  {/* Step Indicators */}
                  <div className="flex space-x-2 mb-4">
                    <div
                      className={`w-1/3 text-center py-2 rounded ${
                        currentStep === 1 ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      Personal Info
                    </div>
                    <div
                      className={`w-1/3 text-center py-2 rounded ${
                        currentStep === 2 ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      Policy Details
                    </div>
                    <div
                      className={`w-1/3 text-center py-2 rounded ${
                        currentStep === 3 ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      Payment Info
                    </div>
                  </div>

                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div>
                      <h3 className="text-xl font-medium mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Full Name</label>
                          <input
                            type="text"
                            name="fullName"
                            required
                            value={singleForm.fullName}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        {/* Date of Birth */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Date of Birth</label>
                          <input
                            type="date"
                            name="dob"
                            required
                            value={singleForm.dob}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        {/* Gender */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Gender</label>
                          <select
                            name="gender"
                            required
                            value={singleForm.gender}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          >
                            <option value="">Select</option>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                          </select>
                        </div>
                        {/* Contact Number */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Contact Number</label>
                          <input
                            type="tel"
                            name="contactNumber"
                            required
                            value={singleForm.contactNumber}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        {/* Email Address */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Email Address</label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={singleForm.email}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        {/* Street */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Street</label>
                          <input
                            type="text"
                            name="address.street"
                            required
                            value={singleForm.address.street}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        {/* City */}
                        <div>
                          <label className="block text-sm font-medium mb-1">City</label>
                          <input
                            type="text"
                            name="address.city"
                            required
                            value={singleForm.address.city}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        {/* State */}
                        <div>
                          <label className="block text-sm font-medium mb-1">State</label>
                          <input
                            type="text"
                            name="address.state"
                            required
                            value={singleForm.address.state}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        {/* ZIP Code */}
                        <div>
                          <label className="block text-sm font-medium mb-1">ZIP Code</label>
                          <input
                            type="text"
                            name="address.zip"
                            required
                            value={singleForm.address.zip}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        {/* Occupation */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Occupation</label>
                          <input
                            type="text"
                            name="occupation"
                            required
                            value={singleForm.occupation}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        {/* Annual Income */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Annual Income</label>
                          <input
                            type="number"
                            name="annualIncome"
                            required
                            value={singleForm.annualIncome}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Policy Details */}
                  {formType === 'Single' && currentStep === 2 && (
                    <div>
                      <h3 className="text-xl font-medium mb-4">Policy Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Policy Number</label>
                          <input
                            type="text"
                            name="policyDetails.policyNumber"
                            required
                            value={singleForm.policyDetails.policyNumber}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Insurance Company Name
                          </label>
                          <input
                            type="text"
                            name="policyDetails.insuranceCompany"
                            required
                            value={singleForm.policyDetails.insuranceCompany}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Policy Start Date</label>
                          <input
                            type="date"
                            name="policyDetails.startDate"
                            required
                            value={singleForm.policyDetails.startDate}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Policy Expiry Date</label>
                          <input
                            type="date"
                            name="policyDetails.expiryDate"
                            required
                            value={singleForm.policyDetails.expiryDate}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Type of Policy</label>
                          <select
                            name="policyDetails.policyType"
                            required
                            value={singleForm.policyDetails.policyType}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          >
                            <option value="">Select</option>
                            <option>Individual</option>
                            <option>Family Floater</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Sum Insured</label>
                          <input
                            type="number"
                            name="policyDetails.sumInsured"
                            required
                            value={singleForm.policyDetails.sumInsured}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment Information */}
                  {formType === 'Single' && currentStep === 3 && (
                    <div>
                      <h3 className="text-xl font-medium mb-4">Payment Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Premium Payment Mode</label>
                          <select
                            name="paymentInfo.paymentMode"
                            required
                            value={singleForm.paymentInfo.paymentMode}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          >
                            <option value="">Select</option>
                            <option>Online</option>
                            <option>Offline</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Preferred Payment Frequency
                          </label>
                          <select
                            name="paymentInfo.paymentFrequency"
                            required
                            value={singleForm.paymentInfo.paymentFrequency}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          >
                            <option value="">Select</option>
                            <option>Annual</option>
                            <option>Monthly</option>
                            <option>Quarterly</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <h4 className="text-lg font-medium mb-2">Bank Details</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                          <input
                            type="text"
                            name="paymentInfo.bankDetails.accountHolder"
                            required
                            value={singleForm.paymentInfo.bankDetails.accountHolder}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Account Number</label>
                          <input
                            type="text"
                            name="paymentInfo.bankDetails.accountNumber"
                            required
                            value={singleForm.paymentInfo.bankDetails.accountNumber}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Bank Name</label>
                          <input
                            type="text"
                            name="paymentInfo.bankDetails.bankName"
                            required
                            value={singleForm.paymentInfo.bankDetails.bankName}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Branch</label>
                          <input
                            type="text"
                            name="paymentInfo.bankDetails.branch"
                            required
                            value={singleForm.paymentInfo.bankDetails.branch}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">IFSC Code</label>
                          <input
                            type="text"
                            name="paymentInfo.bankDetails.ifsc"
                            required
                            value={singleForm.paymentInfo.bankDetails.ifsc}
                            onChange={handleSingleChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons for Single Form */}
                  {formType === 'Single' && (
                    <div className="flex justify-between mt-6">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                        >
                          Previous
                        </button>
                      )}
                      {currentStep < 3 && (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Next
                        </button>
                      )}
                      {currentStep === 3 && (
                        <button
                          type="submit"
                          className="ml-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  )}
                </form>
              )}

              {/* Family Form */}
              {formType === 'Family' && (
                <form onSubmit={handleFamilySubmit} className="space-y-6">
                  {/* Step Indicators */}
                  <div className="flex space-x-2 mb-4">
                    <div
                      className={`w-1/3 text-center py-2 rounded ${
                        currentStep === 1 ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      Personal Info
                    </div>
                    <div
                      className={`w-1/3 text-center py-2 rounded ${
                        currentStep === 2 ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      Family Members
                    </div>
                    <div
                      className={`w-1/3 text-center py-2 rounded ${
                        currentStep === 3 ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      Payment Info
                    </div>
                  </div>

                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div>
                      <h3 className="text-xl font-medium mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Policyholder Name</label>
                          <input
                            type="text"
                            name="policyholderName"
                            required
                            value={familyForm.policyholderName}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Gender</label>
                          <select
                            name="gender"
                            required
                            value={familyForm.gender}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          >
                            <option value="">Select</option>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Date of Birth</label>
                          <input
                            type="date"
                            name="dob"
                            required
                            value={familyForm.dob}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Age</label>
                          <input
                            type="number"
                            name="age"
                            required
                            value={familyForm.age}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Occupation</label>
                          <input
                            type="text"
                            name="occupation"
                            required
                            value={familyForm.occupation}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Mobile Number</label>
                          <input
                            type="tel"
                            name="contactDetails.mobileNumber"
                            required
                            value={familyForm.contactDetails.mobileNumber}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email Address</label>
                          <input
                            type="email"
                            name="contactDetails.email"
                            required
                            value={familyForm.contactDetails.email}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Residential Address
                          </label>
                          <input
                            type="text"
                            name="contactDetails.residentialAddress"
                            required
                            value={familyForm.contactDetails.residentialAddress}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">PIN Code</label>
                          <input
                            type="text"
                            name="contactDetails.pinCode"
                            required
                            value={familyForm.contactDetails.pinCode}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Family Member Details */}
                  {formType === 'Family' && currentStep === 2 && (
                    <div>
                      <h3 className="text-xl font-medium mb-4">Family Member Details</h3>
                      {familyForm.familyMembers.map((member, index) => (
                        <div key={index} className="border border-gray-600 p-4 rounded-md mb-4">
                          <h4 className="text-lg font-medium mb-2">Member {index + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Full Name</label>
                              <input
                                type="text"
                                name="fullName"
                                required
                                value={member.fullName}
                                onChange={(e) => handleFamilyMemberChange(index, e)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Relationship</label>
                              <input
                                type="text"
                                name="relationship"
                                required
                                value={member.relationship}
                                onChange={(e) => handleFamilyMemberChange(index, e)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Gender</label>
                              <select
                                name="gender"
                                required
                                value={member.gender}
                                onChange={(e) => handleFamilyMemberChange(index, e)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                              >
                                <option value="">Select</option>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Date of Birth</label>
                              <input
                                type="date"
                                name="dob"
                                required
                                value={member.dob}
                                onChange={(e) => handleFamilyMemberChange(index, e)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Age</label>
                              <input
                                type="number"
                                name="age"
                                required
                                value={member.age}
                                onChange={(e) => handleFamilyMemberChange(index, e)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Nominee Name</label>
                              <input
                                type="text"
                                name="nomineeName"
                                required
                                value={member.nomineeName}
                                onChange={(e) => handleFamilyMemberChange(index, e)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Nominee Relationship
                              </label>
                              <input
                                type="text"
                                name="nomineeRelationship"
                                required
                                value={member.nomineeRelationship}
                                onChange={(e) => handleFamilyMemberChange(index, e)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={addFamilyMember}
                          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                        >
                          Add Another Member
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment Information */}
                  {formType === 'Family' && currentStep === 3 && (
                    <div>
                      <h3 className="text-xl font-medium mb-4">Payment Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Premium Payment Mode
                          </label>
                          <select
                            name="paymentInfo.paymentMode"
                            required
                            value={familyForm.paymentInfo.paymentMode}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          >
                            <option value="">Select</option>
                            <option>Online</option>
                            <option>Offline</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Preferred Payment Frequency
                          </label>
                          <select
                            name="paymentInfo.paymentFrequency"
                            required
                            value={familyForm.paymentInfo.paymentFrequency}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          >
                            <option value="">Select</option>
                            <option>Annual</option>
                            <option>Monthly</option>
                            <option>Quarterly</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <h4 className="text-lg font-medium mb-2">Bank Details</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Account Holder Name
                          </label>
                          <input
                            type="text"
                            name="paymentInfo.bankDetails.accountHolder"
                            required
                            value={familyForm.paymentInfo.bankDetails.accountHolder}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Account Number
                          </label>
                          <input
                            type="text"
                            name="paymentInfo.bankDetails.accountNumber"
                            required
                            value={familyForm.paymentInfo.bankDetails.accountNumber}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Bank Name</label>
                          <input
                            type="text"
                            name="paymentInfo.bankDetails.bankName"
                            required
                            value={familyForm.paymentInfo.bankDetails.bankName}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Branch</label>
                          <input
                            type="text"
                            name="paymentInfo.bankDetails.branch"
                            required
                            value={familyForm.paymentInfo.bankDetails.branch}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">IFSC Code</label>
                          <input
                            type="text"
                            name="paymentInfo.bankDetails.ifsc"
                            required
                            value={familyForm.paymentInfo.bankDetails.ifsc}
                            onChange={handleFamilyChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons for Family Form */}
                  {formType === 'Family' && (
                    <div className="flex justify-between mt-6">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={prevStep}
                          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                        >
                          Previous
                        </button>
                      )}
                      {currentStep < 3 && (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Next
                        </button>
                      )}
                      {currentStep === 3 && (
                        <button
                          type="submit"
                          className="ml-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Submit
                        </button>
                      )}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export to Excel
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Export to PDF
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setFilter('All')}
            className={`px-4 py-2 rounded-md border border-gray-600 ${
              filter === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('Single')}
            className={`px-4 py-2 rounded-md border border-gray-600 ${
              filter === 'Single' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setFilter('Family')}
            className={`px-4 py-2 rounded-md border border-gray-600 ${
              filter === 'Family' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'
            }`}
          >
            Family
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 border border-gray-600">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-gray-600">ID</th>
                <th className="py-2 px-4 border-b border-gray-600">Name</th>
                <th className="py-2 px-4 border-b border-gray-600">Type</th>
                <th className="py-2 px-4 border-b border-gray-600">Policy Number</th>
                <th className="py-2 px-4 border-b border-gray-600">Insurance Company</th>
                <th className="py-2 px-4 border-b border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No entries found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-700 text-center">
                    <td className="py-2 px-4 border-b border-gray-600">{index + 1}</td>
                    <td className="py-2 px-4 border-b border-gray-600">
                      {entry.type === 'Single' ? entry.data.fullName : entry.data.policyholderName}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-600">{entry.type}</td>
                    <td className="py-2 px-4 border-b border-gray-600">
                      {entry.type === 'Single' ? entry.data.policyDetails.policyNumber : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-600">
                      {entry.type === 'Single'
                        ? entry.data.policyDetails.insuranceCompany
                        : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-600">
                      {/* Actions: View & Delete */}
                      <button className="px-2 py-1 bg-yellow-500 text-white rounded-md mr-2 hover:bg-yellow-600">
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id, index)}
                        className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
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
};

export default Mediclaim;
