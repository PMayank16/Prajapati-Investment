// File: context/EmployeeContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/Firebase";
import { toast } from "react-toastify";
import { useAuth } from "@/context/auth";

const EmployeeContext = createContext();

export const useEmployee = () => useContext(EmployeeContext);

export const EmployeeProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch employees data
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
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching employees:", error);
        toast.error("Failed to fetch employees.");
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const addEmployee = async (employeeData) => {
    try {
      await addDoc(collection(db, "myEmployee"), employeeData);
      toast.success("Employee added successfully.");
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error(`Failed to add employee: ${error.message}`);
    }
  };

  const deleteEmployee = async (docId) => {
    try {
      await deleteDoc(doc(db, "myEmployee", docId));
      toast.success("Employee deleted successfully.");
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error(`Failed to delete employee: ${error.message}`);
    }
  };

  return (
    <EmployeeContext.Provider
      value={{ employees, isLoading, addEmployee, deleteEmployee }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};
