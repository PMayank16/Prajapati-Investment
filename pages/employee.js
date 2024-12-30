// File: pages/employee.js

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import Modal from "react-modal";
import { toast } from "react-toastify";

// Firebase
import { useAuth } from "@/context/auth";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/Firebase";

Modal.setAppElement("#__next");

function Employee() {
  const { currentUser, newUser, admin, userRole } = useAuth(); // Access current user from context

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dob: "",
    password: "",
    confirmPassword: "",
    role: "read", // default role
  });

  const [employees, setEmployees] = useState([]);

  // Handle Input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Form (Create Employee)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2. Save additional user details in Firestore
      const data = {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        dob: formData.dob,
        createdAt: new Date(),
        createdBy: currentUser.uid, // which admin created the user
        role: formData.role,
      };

      await newUser(data.uid, data);

      // 3. Show success Toast only, do NOT sign out or redirect
      toast.success("Employee account created successfully!");

      // 4. Reset form & close modal
      setFormData({
        name: "",
        email: "",
        dob: "",
        password: "",
        confirmPassword: "",
        role: "read",
      });
      setModalIsOpen(false);

      // No signOut(auth) or signIn(...) calls here
      // The current admin remains logged in
    } catch (error) {
      console.error("Error creating employee account:", error);
      toast.error(`Failed to create employee: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Employee
  const handleDelete = async (docId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete ${employeeName}?`)) {
      try {
        await deleteDoc(doc(db, "myEmployee", docId));
        toast.success("Employee deleted successfully.");
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error(`Failed to delete employee: ${error.message}`);
      }
    }
  };

  // Fetch employees created by current Admin
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "myEmployee"),
      where("createdBy", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const employeesData = [];
        querySnapshot.forEach((doc) => {
          employeesData.push({ id: doc.id, ...doc.data() });
        });
        setEmployees(employeesData);
      },
      (error) => {
        console.error("Error fetching employees:", error);
        toast.error("Failed to fetch employees.");
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <Layout>
      {/* Header Section */}
      <div className="flex justify-between items-center py-4 border-b border-gray-600">
        <h1 className="text-2xl font-bold text-white mb-4 md:mb-0">
          Employee Management
        </h1>

        {/* Create Employee Button */}
        {userRole === "Admin" && (
          <button
            onClick={() => setModalIsOpen(true)}
            className="flex items-center bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-200"
          >
            Create Employee
          </button>
        )}
      </div>

      {/* Modal for Creating Employee */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Create Employee"
        className="max-w-3xl mx-auto mt-20 bg-gray-800 p-8 rounded-lg shadow-lg relative text-white overflow-auto max-h-screen"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-start z-50"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Create Employee</h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Full Name */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="border border-gray-600 bg-gray-700 text-white rounded px-3 py-2"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="border border-gray-600 bg-gray-700 text-white rounded px-3 py-2"
              placeholder="john.doe@example.com"
            />
          </div>

          {/* DOB */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
              className="border border-gray-600 bg-gray-700 text-white rounded px-3 py-2"
            />
          </div>

          {/* Role Selection */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="border border-gray-600 bg-gray-700 text-white rounded px-3 py-2"
            >
              <option value="read">Read</option>
              <option value="write">Write</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="border border-gray-600 bg-gray-700 text-white rounded px-3 py-2"
            />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="border border-gray-600 bg-gray-700 text-white rounded px-3 py-2"
            />
          </div>

          {/* Form Buttons */}
          <div className="flex items-center justify-end col-span-1 md:col-span-2 space-x-4 mt-4">
            <button
              type="button"
              onClick={() => setModalIsOpen(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={`flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200 ${
                isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isUploading && <FaSpinner className="animate-spin mr-2" />} 
              Submit
            </button>
          </div>
        </form>
      </Modal>

      {/* Employee Table */}
      <div className="mt-8 overflow-x-auto">
        <table className="min-w-full bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-700 text-gray-300 text-sm uppercase text-left">
              <th className="py-3 px-6">#</th>
              <th className="py-3 px-6">Full Name</th>
              <th className="py-3 px-6">Email Address</th>
              <th className="py-3 px-6">Date of Birth</th>
              <th className="py-3 px-6">Role</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-gray-400">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr
                  key={emp.id}
                  className={`${
                    index % 2 === 0 ? "bg-gray-800" : "bg-gray-700"
                  } hover:bg-gray-600 text-gray-200 transition duration-200`}
                >
                  {/* Index */}
                  <td className="py-4 px-6 text-sm font-medium text-gray-400">
                    {index + 1}
                  </td>
                  {/* Full Name */}
                  <td className="py-4 px-6 text-sm font-medium">{emp.name}</td>
                  {/* Email */}
                  <td className="py-4 px-6 text-sm font-medium">{emp.email}</td>
                  {/* DOB */}
                  <td className="py-4 px-6 text-sm font-medium">
                    {new Date(emp.dob).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  {/* Role */}
                  <td className="py-4 px-6 text-sm font-medium">
                    {emp.role || "N/A"}
                  </td>
                  {/* Actions */}
                  <td className="py-4 px-6 text-center">
                    {userRole === "Admin" && (
                      <button
                        className="text-red-500 hover:text-red-400 transition duration-200"
                        onClick={() => handleDelete(emp.id, emp.name)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

export default Employee;
