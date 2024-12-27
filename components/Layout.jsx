import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/auth';
import SidebarMobile from './Mobile-Screen/SidebarMobile';
import NavbarMobile from './Mobile-Screen/NavbarMobile';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const { signOut, currentUser } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false); // To track if we're on the client side
  const router = useRouter(); // Adding router for redirects

  useEffect(() => {
    setIsClient(true); // Set to true after component mounts (on client side)
  }, []);

  useEffect(() => {
    if (isClient && !currentUser) {
      router.push('/Signin'); // Redirect to login if not logged in, only on client
    }
  }, [isClient, currentUser, router]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!isClient) {
    return null; // Prevent rendering before client-side code executes
  }

  return (
    <>
      {isMobile ? (
        <>
          {/* Mobile View: Navbar at top and a Sidebar that can slide in */}
          <NavbarMobile onToggleSidebar={handleToggleSidebar} />
          <SidebarMobile 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)}
          />
          {/* Main content (below the navbar in mobile) */}
          <main className="pt-16 p-4 overflow-y-auto bg-black text-white min-h-screen">
            {children}
          </main>
        </>
      ) : (
        /* Desktop View: Sidebar on left and Navbar on top of the main content area */
        <div className="flex h-screen bg-black text-white">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 border m-4 border-gray-600 rounded-lg overflow-hidden">
            <Navbar />
            <main className="p-4 overflow-y-auto flex-1">
              {children}
            </main>
          </div>
        </div>
      )}
    </>
  );
}
