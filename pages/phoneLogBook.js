// pages/phoneLogBook.js

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Layout from '@/components/Layout';
import { db } from '@/Firebase';
import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';

Modal.setAppElement('#__next'); // Ensure this matches Next.js's root ID

const PhoneLogBook = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    email: '',
    phoneNumber: '',
    taskDescription: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Reference to the 'phoneLogs' collection in Firestore
  const phoneLogsCollection = collection(db, 'phoneLogs');

  // Fetch entries from Firestore on component mount
  useEffect(() => {
    const unsubscribe = onSnapshot(phoneLogsCollection, (snapshot) => {
      const entriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEntries(entriesData);
      setFilteredEntries(entriesData);
    });

    return () => unsubscribe();
  }, []);

  const openModal = () => {
    setIsEditing(false);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setFormData({
      employeeId: '',
      employeeName: '',
      email: '',
      phoneNumber: '',
      taskDescription: '',
    });
    setIsEditing(false);
    setCurrentEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing && currentEditId) {
      await handleUpdate();
    } else {
      try {
        await addDoc(phoneLogsCollection, formData);
        closeModal();
      } catch (error) {
        console.error('Error adding document: ', error);
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const docRef = doc(db, 'phoneLogs', currentEditId);
      await updateDoc(docRef, formData);
      closeModal();
    } catch (error) {
      console.error('Error updating document: ', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'phoneLogs', id));
    } catch (error) {
      console.error('Error deleting document: ', error);
    }
  };

  const handleEdit = (entry) => {
    setIsEditing(true);
    setCurrentEditId(entry.id);
    setFormData({
      employeeId: entry.employeeId,
      employeeName: entry.employeeName,
      email: entry.email,
      phoneNumber: entry.phoneNumber,
      taskDescription: entry.taskDescription,
    });
    setModalIsOpen(true);
  };

  const downloadPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(16);
    docPdf.text('Phone Log Book', 14, 22);

    const tableColumn = [
      'Sr No',
      'Employee ID',
      'Employee Name',
      'Phone Number',
      'Task Description',
    ];
    const tableRows = [];

    entries.forEach((entry, index) => {
      const entryData = [
        index + 1,
        entry.employeeId,
        entry.employeeName,
        entry.phoneNumber,
        entry.taskDescription,
      ];
      tableRows.push(entryData);
    });

    docPdf.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: {
        font: 'helvetica',
        textColor: 255,
        fillColor: [75, 85, 99], // Gray-600 equivalent
      },
      headStyles: {
        fillColor: [75, 85, 99],
      },
    });

    docPdf.save('PhoneLogBook.pdf');
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      entries.map((entry, index) => ({
        'Sr No': index + 1,
        'Employee ID': entry.employeeId,
        'Employee Name': entry.employeeName,
        'Phone Number': entry.phoneNumber,
        'Task Description': entry.taskDescription,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Phone Log');
    XLSX.writeFile(workbook, 'PhoneLogBook.xlsx');
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredEntries(
      entries.filter(
        (entry) =>
          entry.employeeName.toLowerCase().includes(term) ||
          entry.phoneNumber.toLowerCase().includes(term) ||
          entry.taskDescription.toLowerCase().includes(term) ||
          entry.employeeId.toLowerCase().includes(term)
      )
    );
  };

  return (
    <Layout>
      <div className="p-5 font-sans bg-black text-white min-h-screen">
        {/* Header section */}
        <div className="flex justify-between mb-5">
          <div className="w-full md:w-2/5">
            <h1 className="text-[29px] text-white font-bold">Phone Log Book</h1>
            <div className="mt-2 flex gap-2">
              <button
                onClick={downloadPDF}
                className="py-2 px-4 bg-blue-700 text-white rounded font-semibold hover:bg-blue-600 transition"
              >
                PDF
              </button>
              <button
                onClick={downloadExcel}
                className="py-2 px-4 bg-green-600 text-white rounded font-semibold hover:bg-green-500 transition"
              >
                Excel
              </button>
            </div>
          </div>
          <div className="flex items-end gap-2 mt-3 md:mt-0">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={handleSearch}
              className="p-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
            />
            <button
              onClick={openModal}
              className="py-2 px-4 bg-orange-500 text-white rounded font-semibold hover:bg-orange-400 transition"
            >
              Add
            </button>
          </div>
        </div>

        {/* Table section */}
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-700">
          <table className="w-full border-collapse text-sm md:text-base">
            <thead>
              <tr className="bg-gray-700 text-white">
                <th className="p-2 border border-gray-600">Sr No</th>
                <th className="p-2 border border-gray-600">Employee ID</th>
                <th className="p-2 border border-gray-600">Employee Name</th>
                <th className="p-2 border border-gray-600">Phone Number</th>
                <th className="p-2 border border-gray-600">Task Description</th>
                <th className="p-2 border border-gray-600 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}
                >
                  <td className="p-2 border border-gray-600 text-center">{index + 1}</td>
                  <td className="p-2 border text-center border-gray-600">{entry.employeeId}</td>
                  <td className="p-2 border text-center border-gray-600">{entry.employeeName}</td>
                  <td className="p-2 border text-center border-gray-600">{entry.phoneNumber}</td>
                  <td className="p-2 border text-center border-gray-600 whitespace-pre-wrap break-words">
                    {entry.taskDescription}
                  </td>
                  <td className="p-2 border border-gray-600 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="py-1 px-2 bg-yellow-500 text-white rounded font-medium hover:bg-yellow-400 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="py-1 px-2 bg-red-500 text-white rounded font-medium hover:bg-red-400 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-center text-gray-400 bg-gray-900"
                  >
                    No entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          className="w-[90%] max-w-[600px] p-8 rounded-lg bg-gray-800 text-white shadow-lg"
        >
          <form onSubmit={handleSubmit} className="font-sans">
            <h2 className="text-center mb-8 text-yellow-400 text-2xl font-semibold">
              {isEditing ? 'Edit Phone Log Entry' : 'Add Phone Log Entry'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col">
                <label
                  htmlFor="employeeId"
                  className="text-white font-semibold mb-2"
                >
                  Employee ID
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                  placeholder="Enter Employee ID"
                  className="p-3 rounded-md border border-gray-600 bg-gray-700 text-white text-base focus:outline-none focus:border-gray-500"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="employeeName"
                  className="text-white font-semibold mb-2"
                >
                  Employee Name
                </label>
                <input
                  type="text"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleChange}
                  required
                  placeholder="Enter Employee Name"
                  className="p-3 rounded-md border border-gray-600 bg-gray-700 text-white text-base focus:outline-none focus:border-gray-500"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="email"
                  className="text-white font-semibold mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter Email Address"
                  className="p-3 rounded-md border border-gray-600 bg-gray-700 text-white text-base focus:outline-none focus:border-gray-500"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="phoneNumber"
                  className="text-white font-semibold mb-2"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="Enter Phone Number"
                  className="p-3 rounded-md border border-gray-600 bg-gray-700 text-white text-base focus:outline-none focus:border-gray-500"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label
                  htmlFor="taskDescription"
                  className="text-white font-semibold mb-2"
                >
                  Task Description
                </label>
                <textarea
                  name="taskDescription"
                  value={formData.taskDescription}
                  onChange={handleChange}
                  required
                  placeholder="Enter Task Description"
                  className="p-3 rounded-md border border-gray-600 bg-gray-700 text-white text-base resize-none min-h-[100px] focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                type="submit"
                className="py-3 px-6 bg-yellow-500 text-white rounded font-bold text-base shadow-md cursor-pointer hover:bg-yellow-400 transition"
              >
                {isEditing ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default PhoneLogBook;
