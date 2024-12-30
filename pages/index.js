import React, { useContext } from "react";
import Layout from "@/components/Layout";
import { ClientContext } from "@/context/ClientContext";
import { useEmployee } from "@/context/EmployeeContext";
import { FaUsers, FaProjectDiagram, FaDollarSign } from "react-icons/fa";
import { motion } from "framer-motion";
import { FdEntryContext } from "@/context/fdContext";

const DashboardCards = () => {
  const { clients, loading: clientsLoading, error: clientsError } = useContext(ClientContext);
  const { employees, isLoading: employeesLoading, error: employeesError } = useEmployee();
  const { fdEntries, loading: fdLoading, error: fdError } = useContext(FdEntryContext); // Consume FdEntryContext

  // If you have Mediclaim data, you'll handle it in the next section

  if (clientsLoading || employeesLoading || fdLoading) {
    return <div>Loading...</div>;
  }

  if (clientsError || employeesError || fdError) {
    return (
      <div>
        Error loading data: {clientsError || employeesError || fdError}
      </div>
    );
  }

  const totalClients = clients.length;
  const totalFamilyMembers = clients.reduce(
    (sum, client) => sum + (client.familyMembers?.length || 0),
    0
  );
  const totalEmployees = employees.length;

  // Calculate FD Entry data
  const totalFdEntries = fdEntries.length;
  const totalFdAmount = fdEntries.reduce(
    (sum, entry) => sum + (entry.amount || 0),
    0
  );

  const formatNumber = (number) => number.toLocaleString();
  const formatCurrency = (number) => `$${number.toLocaleString()}`;

  const cardsData = [
    {
      title: "Total Clients",
      value: formatNumber(totalClients),
      icon: <FaUsers className="text-4xl text-blue-500" />,
    },
    {
      title: "Total Family",
      value: formatNumber(totalFamilyMembers),
      icon: <FaUsers className="text-4xl text-green-500" />,
    },
    {
      title: "Total Employees",
      value: formatNumber(totalEmployees),
      icon: <FaProjectDiagram className="text-4xl text-purple-500" />,
    },
    {
      title: "FD Entry",
      value: formatNumber(totalFdEntries),
      icon: <FaDollarSign className="text-4xl text-yellow-500" />,
    },
    {
      title: "Mediclaim Entry",
      value: "0", // Placeholder for Mediclaim data
      icon: <FaDollarSign className="text-4xl text-yellow-500" />,
    },
  ];

  // Framer Motion animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.2 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.2 },
    },
  };

  return (
    <Layout>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 text-center gap-6 p-6 bg-black"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {cardsData.map((card, index) => (
          <motion.div
            key={index}
            className="p-6 rounded-lg shadow-lg flex flex-col border border-gray-600 items-center justify-center bg-black text-white"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="mb-4">{card.icon}</div>
            <h3 className="text-xl font-semibold">{card.title}</h3>
            <p className="text-2xl font-bold">{card.value}</p>
          </motion.div>
        ))}
      </motion.div>
    </Layout>
  );
};

export default DashboardCards;
