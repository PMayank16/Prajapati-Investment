// File: components/Navbar.jsx

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/router";
import { format } from "date-fns"; // Install date-fns for date formatting
import { ToastContainer, toast } from "react-toastify"; // Install react-toastify for notifications
import "react-toastify/dist/ReactToastify.css";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navbarRef = useRef(null);
  const { signOut, currentUser, userRole, admin } = useAuth();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !navbarRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside); // For mobile

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      const logoutTime = format(new Date(), "PPpp"); // Format the current time
      toast.success(`Successfully logged out at ${logoutTime}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // Delay the redirection to allow the toast to display
      setTimeout(() => {
        router.push("/Signin");
      }, 3000); // 3 seconds delay
    } catch (error) {
      console.error("Failed to logout:", error);
      toast.error("Failed to logout. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    const names = name.trim().split(" ");
    const initials = names.map((n) => n[0]).join("");
    return initials.toUpperCase();
  };

  return (
    <div className={`relative ${isDropdownOpen ? "fixed inset-0 z-40" : ""}`}>
      <nav
        ref={navbarRef}
        className="flex items-center justify-between p-4 bg-black text-white shadow-lg"
      >
        {/* Left side: Greeting */}
        <div className="text-xl font-semibold">
          {currentUser ? (
            userRole === "Admin" ? (
              `Hello, ${admin?.name || "Admin"}!`
            ) : (
              `Hello, ${currentUser?.displayName || "Employee"}!`
            )
          ) : (
            "Hello!"
          )}
        </div>

        {/* Right side: Profile image and dropdown */}
        <div className="relative flex items-center">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-gray-700 text-white text-lg font-bold rounded-full">
              {getInitials(currentUser?.displayName || "User")}
            </div>
          )}
          <button
            onClick={toggleDropdown}
            className="flex items-center justify-center p-2 ml-2 bg-black rounded-full hover:bg-gray-700 focus:outline-none"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
            aria-label="User menu"
          >
            <IoIosArrowDown className="text-white text-2xl" />
          </button>
        </div>
      </nav>

      {/* Dropdown overlay and menu */}
      {isDropdownOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity z-30"></div>

          {/* Dropdown Menu */}
          <div
            ref={dropdownRef}
            className="absolute right-4 top-16 w-48 bg-gray-800 border border-gray-700 text-white rounded-lg shadow-lg z-40 animate-fade-in"
          >
            <ul className="divide-y divide-gray-700">
              <li className="px-4 py-3 hover:bg-gray-700 cursor-pointer">
                <Link href="/profile" className="block w-full">
                  Profile
                </Link>
              </li>
              <li className="px-4 py-3 hover:bg-gray-700 cursor-pointer">
                <Link href="/settings" className="block w-full">
                  Settings
                </Link>
              </li>
              <li
                onClick={handleLogout}
                className="px-4 py-3 hover:bg-gray-700 cursor-pointer"
              >
                Logout
              </li>
            </ul>
          </div>
        </>
      )}

      {/* Toast Container for notifications */}
      <ToastContainer />

      {/* Styles */}
      <style jsx>{`
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Navbar;
