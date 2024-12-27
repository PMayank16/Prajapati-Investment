// Sidebar Component
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import { RiSecurePaymentFill } from "react-icons/ri";
import { FaSignsPost } from "react-icons/fa6";
import { SiMastercard } from "react-icons/si";
import Link from 'next/link';
import {
  FaHome,
  FaUser,
  FaCog,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { GiMasterOfArms } from "react-icons/gi";
import { MdAddLocationAlt, MdNotificationsActive, MdOutlineFamilyRestroom, MdOutlineLocalPostOffice } from 'react-icons/md';
import { ImProfile } from "react-icons/im";

export default function Sidebar() {
  const { userRole } = useAuth(); // Fetching role dynamically
  const [isOpen, setIsOpen] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = (itemName) => {
    setOpenDropdown(openDropdown === itemName ? null : itemName);
  };

  // Navigation items with role-based filtering
  const navItems = [
    { name: 'Dashboard', icon: <FaHome />, href: '/', roles: ['myEmployee','Admin'] },
    { name: 'Client Management', icon: <FaUser />, href: '/clientManagement', roles: ['Admin', 'myEmployee'] },
    { name: 'Family Management', icon: <MdOutlineFamilyRestroom />, href: '/familyManagement', roles: ['Admin', 'myEmployee'] },
    { name: 'Employee', icon: <ImProfile />, href: '/employee', roles: ['Admin'] },

    {
      name: 'Masters',
      icon: <GiMasterOfArms />,
      roles: ['Admin'],
      dropdown: [
        { name: 'Product Master', icon: <FaCog />, href: '/productMaster', roles: ['Admin'] },
        { name: 'Location & Area Master', icon: <MdAddLocationAlt />, href: '/locationAndAreaMaster', roles: ['Admin'] },
      ],
    },
    {
      name: 'Transactions',
      icon: <RiSecurePaymentFill />,
      roles: ['Admin', 'myEmployee'],
      dropdown: [
        { name: 'Postal Entry', href: '/postalEntry', icon: <FaSignsPost />, roles: ['Admin', 'myEmployee'] },
        { name: 'FD Entry', href: 'fdEntry', icon: <SiMastercard />, roles: ['Admin'] },
        { name: 'Insurance Entry', href: 'insurance', icon: <RiSecurePaymentFill />, roles: ['Admin', 'myEmployee'] },
        { name: 'Mediclaim Entry', href: '/mediclaim', icon: <FaUser />, roles: ['Admin', 'myEmployee'] },
        { name: 'Runsheet Entry', href: '/runsheetEntry', icon: <FaCog />, roles: ['Admin'] },
        { name: 'Phone Log Book', href: '/phoneLogBook', icon: <FaCog />, roles: ['Admin', 'myEmployee'] },
      ],
    },
    { name: 'Post Office', icon: <MdOutlineLocalPostOffice />, href: '/postOffice', roles: ['Admin', 'myEmployee'] },
    { name: 'Executive Master', icon: <SiMastercard />, href: '/executiveMaster', roles: ['Admin'] },
    { name: 'Notification Management', icon: <MdNotificationsActive />, href: '/notificationManagement', roles: ['Admin'] },
  ];

  return (
    <div className="flex p-4 bg-black h-full">
      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'w-64' : 'w-16'
        } bg-black text-white h-full items-center rounded-lg flex flex-col transition-all duration-300 shadow-lg border border-gray-700 overflow-hidden`}
      >
        {/* Top Section with Image */}
        <div className="relative flex items-center justify-center p-6">
          {isOpen && (
            <img
              src="/logo.png"
              alt="Top Image"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
            />
          )}
          <button
            className="absolute top-4 right-0 text-white focus:outline-none"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-4 overflow-y-auto flex-1">
          {navItems.map((item, index) =>
            // Check if userRole matches the allowed roles for the current nav item
            item.roles && item.roles.includes(userRole) ? (
              <div key={index}>
                {item.dropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className="flex items-center p-3 hover:bg-gray-700 rounded-xl transition-colors duration-200 w-full text-left"
                    >
                      <div className={`text-${isOpen ? 'xl' : 'xl'}`}>
                        {item.icon}
                      </div>
                      {isOpen && <span className="ml-4 text-sm">{item.name}</span>}
                      {isOpen && (
                        <span className="ml-auto">
                          {openDropdown === item.name ? <FaChevronUp /> : <FaChevronDown />}
                        </span>
                      )}
                    </button>
                    {openDropdown === item.name && isOpen && (
                      <div className="pl-8 space-y-2 mt-2">
                        {item.dropdown.map((subItem, subIndex) =>
                          subItem.roles && subItem.roles.includes(userRole) ? (
                            <Link
                              key={subIndex}
                              href={subItem.href}
                              className="flex items-center p-3 hover:bg-gray-700 rounded-xl transition-colors duration-200"
                            >
                              {subItem.icon}
                              <span className="ml-4 text-sm">{subItem.name}</span>
                            </Link>
                          ) : null
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    key={index}
                    href={item.href}
                    className="flex items-center p-3 hover:bg-gray-700 rounded-xl transition-colors duration-200"
                  >
                    <div className={`text-${isOpen ? 'xl' : '2xl'}`}>
                      {item.icon}
                    </div>
                    {isOpen && <span className="ml-4 text-sm">{item.name}</span>}
                  </Link>
                )}
              </div>
            ) : null // Don't render items if role doesn't match
          )}
        </nav>
      </aside>
    </div>
  );
}
