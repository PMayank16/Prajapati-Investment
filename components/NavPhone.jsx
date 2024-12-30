import { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function ResponsiveNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo or Brand Name */}
        <div className="flex-shrink-0">
          <Link href="/">
            <span className="font-bold text-xl cursor-pointer">MyBrand</span>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="hover:text-gray-300 transition">Home</Link>
          <Link href="/about" className="hover:text-gray-300 transition">About</Link>
          <Link href="/services" className="hover:text-gray-300 transition">Services</Link>
          <Link href="/contact" className="hover:text-gray-300 transition">Contact</Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden focus:outline-none text-white hover:text-gray-300 transition"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
        >
          {isOpen ? <FaTimes size={24}/> : <FaBars size={24}/>}
        </button>
      </div>

      {/* Mobile Menu (shown when isOpen == true) */}
      {isOpen && (
        <nav className="md:hidden bg-black border-t border-gray-700">
          <ul className="flex flex-col px-4 py-2 space-y-2">
            <li>
              <Link
                href="/"
                className="block text-white hover:text-gray-300 transition"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="block text-white hover:text-gray-300 transition"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/services"
                className="block text-white hover:text-gray-300 transition"
                onClick={() => setIsOpen(false)}
              >
                Services
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="block text-white hover:text-gray-300 transition"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
