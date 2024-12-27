import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth';
import { useRouter } from 'next/router';
import { FaBars, FaTimes, FaSignOutAlt, FaHome, FaUser, FaCog, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { RiSecurePaymentFill } from "react-icons/ri";
import { FaSignsPost } from "react-icons/fa6";
import { SiMastercard } from "react-icons/si";
import { GiMasterOfArms } from "react-icons/gi";

export default function MobileNavWithSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);

  const { signOut, currentUser } = useAuth();
  const router = useRouter();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleTransactionDropdown = () => {
    setTransactionOpen(!transactionOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/signIn');
    } catch (error) {
      console.error("Failed to logout:", error);
      alert("Failed to logout. Please try again.");
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: <FaHome />, href: '/' },
    { name: 'Client Management', icon: <FaUser />, href: '/clientManagement' },
    {
      name: 'Masters',
      icon: <GiMasterOfArms />,
      dropdown: [
        { name: 'Product Master', icon: <FaCog />, href: '/productMaster' },
      ],
    },
    {
      name: 'Transactions',
      icon: <RiSecurePaymentFill />,
      dropdown: [
        { name: 'Postal Entry', href: '/postalEntry', icon: <FaSignsPost /> },
        { name: 'FD Entry', href: '/fdEntry', icon: <SiMastercard /> },
        { name: 'Insurance Entry', href: '/insurance', icon: <RiSecurePaymentFill /> },
        { name: 'Mediclaim Entry', href: '/mediclaim', icon: <FaUser /> },
        { name: 'Runsheet Entry', href: '#', icon: <FaCog /> },
        { name: 'Phone Log Book', href: '/phoneLogBook', icon: <FaCog /> },
      ],
    },
    { name: 'Executive Master', icon: <SiMastercard />, href: '/executiveMaster' },
    { name: 'Post Office', icon: <FaSignsPost />, href: '#' },
  ];

  return (
    <div className="relative z-50 md:hidden">
      {/* Top Navbar */}
      <div className="flex items-center justify-between p-4 bg-black text-white shadow-lg">
        {/* Left: Menu Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-700 rounded-md"
          aria-label="Open Menu"
        >
          <FaBars size={20} />
        </button>

        {/* Center: Title */}
        <div className="text-xl font-bold">
          PI
        </div>

        {/* Right: Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-gray-700 rounded-md"
          aria-label="Logout"
        >
          <FaSignOutAlt size={20} />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-black text-white w-64 transform transition-transform duration-300 ease-in-out border-r border-gray-700
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4">
          {currentUser?.profileImage ? (
            <img
              src={currentUser.profileImage}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-sm">{currentUser?.displayName?.[0] || 'U'}</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-700 rounded-md"
            aria-label="Close Menu"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 overflow-y-auto">
          {navItems.map((item, index) =>
            item.dropdown ? (
              <div key={index} className="p-2">
                <button
                  onClick={toggleTransactionDropdown}
                  className="flex items-center p-2 hover:bg-gray-700 rounded-md w-full text-left"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                  <span className="ml-auto">
                    {transactionOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                {transactionOpen && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.dropdown.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.href}
                        className="flex items-center p-2 hover:bg-gray-700 rounded-md"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="mr-2">{subItem.icon}</span>
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={index}
                href={item.href}
                className="flex items-center p-2 hover:bg-gray-700 rounded-md"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            )
          )}
        </nav>
      </div>
    </div>
  );
}
