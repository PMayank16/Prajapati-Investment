import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/router";
import Head from "next/head";
import { auth } from "@/Firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import react-toastify styles
import { FaSpinner } from "react-icons/fa"; // Optional: For a spinner icon

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const router = useRouter();

  // Redirect to home if the user is already logged in
  useEffect(() => {
    if (auth.currentUser) {
      router.push("/"); // If already logged in, redirect to home
    }
  }, [router]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loading
    setError(""); // Reset error state

    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Show success toast
      toast.success("Login successful! Redirecting to home...", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
      });

      // Redirect to the home page after a short delay
      setTimeout(() => {
        router.push("/"); // Redirect to the home page (or another page)
      }, 2000); // 2-second delay for showing the success message
    } catch (error) {
      // Show error toast
      toast.error(`Error: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setError(error.message); // Optionally keep this if you want to show it elsewhere
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <>
      <Head>
        <title>Prajapati Investment - Sign In</title>
      </Head>

      {/* Toast Container */}
      <ToastContainer />

      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="bg-black border p-8 rounded shadow-lg w-96 border-gray-600">
          <h1 className="text-2xl font-bold text-center text-white mb-8">
            Prajapati Investment
          </h1>

          <form onSubmit={handleSignIn} className="space-y-6">
            {/* You can remove these if you prefer using toast only */}
            {/* {error && <p className="text-red-500">{error}</p>} */}
            {/* {successMessage && <p className="text-green-500">{successMessage}</p>} */}

            <div>
              <label className="block text-white font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 mt-2 border rounded-lg bg-black focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-white font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 mt-2 border bg-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className={`w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 flex items-center justify-center ${
                isLoading ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-600 text-center">
            <a href="#" className="text-blue-500 hover:underline">
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
