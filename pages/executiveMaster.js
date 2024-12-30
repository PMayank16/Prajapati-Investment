// pages/executiveMaster.js

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
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    phoneNumber: '',
    email: '',
    designation: '',
    leaveLeft: '',
    leaveUsed: '',
    salary: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Set the app element for accessibility after the component mounts
  useEffect(() => {
    Modal.setAppElement('#__next'); // Next.js uses '__next' as the root div
  }, []);

  // Fetch employees from Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, 'employees'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const employeesData = [];
      querySnapshot.forEach((doc) => {
        employeesData.push({ id: doc.id, ...doc.data() });
      });
      setEmployees(employeesData);
      setFilteredEmployees(employeesData);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => {
    setModalIsOpen(false);
    setFormData({
      name: '',
      employeeId: '',
      phoneNumber: '',
      email: '',
      designation: '',
      leaveLeft: '',
      leaveUsed: '',
      salary: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add a new document with a generated id
      await addDoc(collection(db, 'employees'), {
        ...formData,
        leaveLeft: Number(formData.leaveLeft),
        leaveUsed: Number(formData.leaveUsed),
        salary: Number(formData.salary),
      });
      closeModal();
    } catch (error) {
      console.error('Error adding document: ', error);
      // Optionally, display an error message to the user
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setTextColor(255, 255, 255); // White text
    doc.setFillColor(0, 0, 0); // Black background
    doc.text('Employee Details', 20, 10);

    const tableData = employees.map((emp, index) => [
      index + 1,
      emp.name,
      emp.employeeId,
      emp.phoneNumber,
      emp.email,
      emp.designation,
      emp.leaveLeft,
      emp.leaveUsed,
      `$${emp.salary}`,
    ]);

    doc.autoTable({
      head: [
        [
          '#',
          'Name',
          'Employee ID',
          'Phone Number',
          'Email',
          'Designation',
          'Leave Left',
          'Leave Used',
          'Salary',
        ],
      ],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8, textColor: [255, 255, 255], fillColor: [40, 40, 40] },
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
    });

    doc.save('EmployeeDetails.pdf');
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(employees);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, 'EmployeeDetails.xlsx');
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredEmployees(
      employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(term) ||
          employee.employeeId.toLowerCase().includes(term) ||
          employee.email.toLowerCase().includes(term)
      )
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 font-sans bg-black text-white min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold mb-4">Executive Master</h1>
            <div className="flex space-x-4">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Download PDF
              </button>
              <button
                onClick={downloadExcel}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Download Excel
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              placeholder="Search by Name, ID, or Email"
              value={searchTerm}
              onChange={handleSearch}
              className="px-4 py-2 border border-gray-600 rounded bg-gray-700 text-white w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={openModal}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
            >
              Add Employee
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Employee ID</th>
                <th className="py-3 px-4 text-left">Phone Number</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Designation</th>
                <th className="py-3 px-4 text-left">Leave Left</th>
                <th className="py-3 px-4 text-left">Leave Used</th>
                <th className="py-3 px-4 text-left">Salary</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee, index) => (
                  <tr key={employee.id} className="border-b border-gray-600">
                    <td className="py-3 px-4">{employee.name}</td>
                    <td className="py-3 px-4">{employee.employeeId}</td>
                    <td className="py-3 px-4">{employee.phoneNumber}</td>
                    <td className="py-3 px-4">{employee.email}</td>
                    <td className="py-3 px-4">{employee.designation}</td>
                    <td className="py-3 px-4">{employee.leaveLeft}</td>
                    <td className="py-3 px-4">{employee.leaveUsed}</td>
                    <td className="py-3 px-4">${employee.salary}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-4 px-4 text-center">
                    No employees found.
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
          contentLabel="Add Employee"
          className="bg-gray-800 rounded-lg shadow-lg max-w-3xl mx-auto my-8 p-6 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">
            Add New Employee
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                  className="px-4 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Employee ID */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Employee ID:</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                  placeholder="E.g., EMP12345"
                  className="px-4 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Phone Number */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Phone Number:</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="E.g., +1 234 567 8901"
                  pattern="[+]?[0-9]{1,4}?[-.\s]?(\d{1,3}?[-.\s]?){1,4}$"
                  className="px-4 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Email */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="E.g., john.doe@example.com"
                  className="px-4 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Designation */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Designation:</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  placeholder="E.g., Software Engineer"
                  className="px-4 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Leave Left */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Leave Left:</label>
                <input
                  type="number"
                  name="leaveLeft"
                  value={formData.leaveLeft}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="Number of leave days left"
                  className="px-4 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Leave Used */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Leave Used:</label>
                <input
                  type="number"
                  name="leaveUsed"
                  value={formData.leaveUsed}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="Number of leave days used"
                  className="px-4 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Salary */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Salary:</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="Monthly salary in USD"
                  className="px-4 py-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-center mt-6 space-x-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default EmployeeManagement;
