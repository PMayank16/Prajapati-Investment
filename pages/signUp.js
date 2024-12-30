import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/Firebase";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    number: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState({ text: "", type: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage({ text: "Passwords do not match!", type: "error" });
      return;
    }

    try {
      await addDoc(collection(db, "users"), {
        name: form.name,
        email: form.email,
        number: form.number,
        password: form.password, // Consider hashing in production
        createdAt: new Date(),
      });

      setMessage({ text: "User registered successfully!", type: "success" });
      setForm({
        name: "",
        email: "",
        number: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error adding user:", error);
      setMessage({ text: "Error registering user. Please try again.", type: "error" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-black p-8 rounded-lg shadow-md w-full max-w-md border border-gray-600">
        <h2 className="text-2xl font-bold text-center text-white mb-6">Sign Up</h2>

        {message.text && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              placeholder="Name"
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 bg-black border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-gray-600">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              placeholder="Enter your email"
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border bg-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-gray-600">Phone Number</label>
            <input
              type="tel"
              name="number"
              value={form.number}
              placeholder="Phone number"
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border bg-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-gray-600">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              placeholder="*******"
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border bg-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-gray-600">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              placeholder="*******"
              onChange={handleChange}
              required
              className="w-full px-4 py-2 mt-2 border bg-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
