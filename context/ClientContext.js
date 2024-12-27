// src/context/ClientContext.js

import React, { createContext, useState, useEffect } from 'react';
import { db } from '../Firebase';
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  runTransaction,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Import jspdf-autotable

export const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const clientsCollectionRef = collection(db, 'clients');
  const counterDocRef = doc(db, 'metadata', 'clientsCounter');

  useEffect(() => {
    const unsubscribe = onSnapshot(clientsCollectionRef, (snapshot) => {
      const clientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Ensure clientNumber is a number for proper sorting
      clientsData.sort((a, b) => a.clientNumber - b.clientNumber);
      setClients(clientsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addClient = async (clientForm) => {
    try {
      await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterDocRef);
        const currentCount = (counterDoc.exists() ? counterDoc.data().count : 0) || 0;
        const newCount = currentCount + 1;
        transaction.set(counterDocRef, { count: newCount });

        // Add new client
        const newClientRef = doc(clientsCollectionRef);
        transaction.set(newClientRef, {
          ...clientForm,
          // Generate a 6-letter code like PI1476
          clientNumber: "PI" + String(newCount).padStart(4, '0'),
        });
      });
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const updateClient = async (clientId, updatedData) => {
    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, updatedData);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const deleteClient = async (id) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const addFamilyMember = async (clientId, familyMemberData) => {
    try {
      const clientRef = doc(db, 'clients', clientId);
      await updateDoc(clientRef, {
        familyMembers: arrayUnion(familyMemberData),
      });
    } catch (error) {
      console.error('Error adding family member:', error);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(clients);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, 'clients.xlsx');
  };

  /**
   * Enhanced exportToPDF function with name, date, and Pick Up & Delivery
   */
  const exportToPDF = (filteredClients, name = '', date = '', pickupDeliveryDetails = {}) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Define margins
    const marginLeft = 20;
    const marginRight = pageWidth - 20;

    // Header Section: "Prajapati"
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Prajapati', pageWidth / 2, 15, { align: 'center' });

    // Underline below "Prajapati"
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 17, marginRight, 17);

    // Subheader: "Wealth Management"
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Wealth Management', pageWidth / 2, 22, { align: 'center' });

    // Additional Header Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // Top Left: Email ID
    doc.text('Email ID: prajapatiinvest@gmail.com', marginLeft, 30);

    // Top Right: Contact Numbers
    doc.text('(O): 93200008698 / 9324660329 / 8080892517', marginRight, 30, { align: 'right' });

    // Next Line Left: Name (from input)
    doc.text(`Name: ${name || '___________________'}`, marginLeft, 36);

    // Next Line Right: Date (from input)
    doc.text(`Date: ${date || '__________________'}`, marginRight, 36, { align: 'right' });

    // Underline below the header
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 39, marginRight, 39);

    // Add some spacing before the table
    const tableStartY = 45;

    // Define table columns
    const tableColumns = [
      { header: 'NO', dataKey: 'no' },
      { header: 'Name & Address', dataKey: 'nameAddress' },
      { header: 'Pick Up & Delivery', dataKey: 'pickupDelivery' },
      { header: 'Remarks & Signs', dataKey: 'remarksSigns' },
    ];

    // Prepare table rows with Name, City, Location, and Pick Up & Delivery
    const tableRows = filteredClients.map((client, index) => ({
      no: index + 1,
      nameAddress: `${client.name}\n${client.city}\n${client.location || 'N/A'}`,
      pickupDelivery: pickupDeliveryDetails[client.id] || '',
      remarksSigns: '', // Blank for manual input
    }));

    // Generate the table using autoTable
    doc.autoTable({
      startY: tableStartY,
      head: [tableColumns.map((col) => col.header)],
      body: tableRows.map((row) => [
        row.no,
        row.nameAddress,
        row.pickupDelivery,
        row.remarksSigns,
      ]),
      styles: { fontSize: 10, cellPadding: 3, valign: 'middle' },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 }, // NO
        1: { cellWidth: 60 }, // Name & Address
        2: { cellWidth: 60 }, // Pick Up & Delivery
        3: { cellWidth: 50 }, // Remarks & Signs
      },
      theme: 'grid', // Adds borders to table and cells
      margin: { left: marginLeft, right: marginRight },
      didDrawPage: function (data) {
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(10);
        doc.text(
          `Page ${currentPage} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      },
      styles: { overflow: 'linebreak', cellWidth: 'wrap' },
    });

    // Save the PDF
    doc.save('runsheet.pdf');
  };

  return (
    <ClientContext.Provider
      value={{
        clients,
        loading,
        addClient,
        updateClient,
        deleteClient,
        exportToExcel,
        exportToPDF,
        addFamilyMember, // Added here
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};
