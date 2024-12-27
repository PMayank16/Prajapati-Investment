// src/pages/profile.js
import React, { useState, useEffect } from "react";
import { FaCamera } from "react-icons/fa";
import Layout from "../components/Layout";
import { useAuth } from "@/context/auth";
import { auth, db, storage } from "@/Firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import Modal from "react-modal";

Modal.setAppElement("#__next");

const ProfilePage = () => {
  const {
    currentUser,
    getUserData,
    deleteUserData,
    removeUserFromAuth,
  } = useAuth();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    dob: "",
    phone: "",
    profileImageUrl: "/default-profile.png",
    profileImagePath: "",
  });

  const [formState, setFormState] = useState({ ...userData });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (selectedImage) {
      const objectUrl = URL.createObjectURL(selectedImage);
      setPreviewUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      };
    }
  }, [selectedImage]);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const data = await getUserData(currentUser.uid);
        if (data) {
          const userDetails = {
            name: data.name || currentUser.displayName || "Anonymous",
            email: data.email || currentUser.email || "",
            dob: data.dob || "",
            phone: data.phone || "",
            profileImageUrl: data.profileImageUrl || currentUser.photoURL || "/default-profile.png",
            profileImagePath: data.profileImagePath || "",
          };
          setUserData(userDetails);
          setFormState(userDetails);
        } else {
          // If no data in Firestore, initialize from Auth
          const defaultUserData = {
            name: currentUser.displayName || "Anonymous",
            email: currentUser.email || "",
            dob: "",
            phone: "",
            profileImageUrl: currentUser.photoURL || "/default-profile.png",
            profileImagePath: "",
          };
          // Create default doc in Firestore if needed
          await setDoc(doc(db, "users", currentUser.uid), defaultUserData);
          setUserData(defaultUserData);
          setFormState(defaultUserData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setErrorMessage("Failed to fetch user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, getUserData]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Select an image for preview
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Unsupported file type. Please upload a JPEG, PNG, or GIF image.");
      return;
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage("File size exceeds 5MB. Please upload a smaller image.");
      return;
    }

    setErrorMessage("");
    setSelectedImage(file);
  };

  // Upload the selected image to Firebase Storage
  const handleImageUpload = async () => {
    if (!selectedImage || !currentUser) return;

    setUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const imagePath = `userProfiles/${currentUser.uid}/profileImage_${Date.now()}`;
      const storageRefPath = ref(storage, imagePath);

      // Upload new image
      await uploadBytes(storageRefPath, selectedImage);
      const url = await getDownloadURL(storageRefPath);

      // Delete old image if it exists and is not the default
      if (userData.profileImagePath && userData.profileImageUrl !== "/default-profile.png") {
        const oldImageRef = ref(storage, userData.profileImagePath);
        await deleteObject(oldImageRef).catch((err) => {
          console.warn("Old image deletion failed or no previous image:", err);
        });
      }

      // Update Firestore and Auth profile
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        profileImageUrl: url,
        profileImagePath: imagePath,
      });

      await updateProfile(auth.currentUser, { photoURL: url });

      // Update local state
      setUserData((prev) => ({
        ...prev,
        profileImageUrl: url,
        profileImagePath: imagePath,
      }));
      setFormState((prev) => ({
        ...prev,
        profileImageUrl: url,
        profileImagePath: imagePath,
      }));

      setSuccessMessage("Profile image updated successfully.");
      setSelectedImage(null); 
    } catch (error) {
      console.error("Error uploading image:", error);
      setErrorMessage("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Update user profile details
  const handleUpdate = async () => {
    if (!auth.currentUser) {
      setErrorMessage("No user is currently signed in.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setUpdating(true);

    const { name, profileImageUrl, email, phone, dob } = formState;

    // Basic validation
    if (!name.trim()) {
      setErrorMessage("Name cannot be empty.");
      setUpdating(false);
      return;
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      setErrorMessage("Please enter a valid 10-digit phone number.");
      setUpdating(false);
      return;
    }

    try {
      const updateProfilePayload = {};
      const updateDocPayload = {};

      // Name
      if (name && name.trim() !== userData.name) {
        updateProfilePayload.displayName = name;
        updateDocPayload.name = name;
      }

      // PhotoURL
      if (profileImageUrl && profileImageUrl.trim() !== userData.profileImageUrl) {
        updateProfilePayload.photoURL = profileImageUrl;
        updateDocPayload.profileImageUrl = profileImageUrl;
      }

      // Email (if changed)
      if (email && email.trim() !== "" && email !== userData.email) {
        updateDocPayload.email = email;
        // For updating Auth email, ensure user re-authenticates if required.
        // Example: await auth.currentUser.updateEmail(email);
      }

      // Phone & DOB
      updateDocPayload.phone = phone;
      updateDocPayload.dob = dob;

      // Update Auth Profile
      if (Object.keys(updateProfilePayload).length > 0) {
        await updateProfile(auth.currentUser, updateProfilePayload);
      }

      // Update Firestore Document
      if (Object.keys(updateDocPayload).length > 0) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, updateDocPayload);
        setUserData((prev) => ({
          ...prev,
          ...updateDocPayload,
        }));
      }

      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Delete user account and associated data
  const handleDeleteUserData = async () => {
    if (!currentUser) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      // Remove user data from Firestore
      await deleteUserData(currentUser.uid); 
      // This presumably deletes Firestore doc and storage files as implemented in your useAuth

      // Remove user from Auth
      await removeUserFromAuth();
      console.log("User data and account deleted");
      // Redirect or show a message
    } catch (error) {
      console.error("Error deleting user:", error);
      setErrorMessage("Failed to delete account. Please try again.");
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const confirmDelete = () => {
    handleDeleteUserData();
    closeDeleteModal();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-white p-6 mb-10 flex justify-center items-center">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white p-6 mb-10">
        {errorMessage && (
          <div className="bg-red-600 p-4 mb-4 rounded-lg">
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-600 p-4 mb-4 rounded-lg">
            <p>{successMessage}</p>
          </div>
        )}

        {/* Profile Display */}
        <div className="relative flex flex-col mb-10 bg-gradient-to-br from-gray-900 to-black md:flex-row items-center p-8 rounded-xl shadow-2xl shadow-gray-900 w-full md:w-3/4 mx-auto bg-cover bg-center bg-no-repeat border border-gray-600">
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gray-600 shadow-xl hover:scale-105 transform transition duration-300 ease-out hover:shadow-gray-700">
            <img
              src={userData.profileImageUrl || "/default-profile.png"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            <label className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center cursor-pointer text-white hover:bg-opacity-60 transition duration-300 ease-in-out">
              <FaCamera size={20} />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Change Profile Picture"
              />
            </label>

            {/* If image selected, show preview */}
            {selectedImage && previewUrl && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center p-4">
                <img
                  src={previewUrl}
                  alt="Selected Preview"
                  className="w-24 h-24 object-cover rounded-full mb-2"
                />
                <button
                  onClick={handleImageUpload}
                  disabled={uploading || updating}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    (uploading || updating) && "opacity-50 cursor-not-allowed"
                  }`}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  disabled={uploading || updating}
                  className={`mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    (uploading || updating) && "opacity-50 cursor-not-allowed"
                  }`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="md:ml-8 mt-6 md:mt-0 p-4 rounded-lg">
            <h2 className="text-3xl font-bold text-center md:text-left mb-4 drop-shadow-lg">
              {userData.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <p className="flex items-center">
                <span className="mr-2">📞</span>
                {userData.phone || "Not Provided"}
              </p>
              <p className="flex items-center">
                <span className="mr-2">📧</span>
                {userData.email || "Not Provided"}
              </p>
              <p className="flex items-center">
                <span className="mr-2">🎂</span>
                {userData.dob
                  ? new Date(userData.dob).toLocaleDateString()
                  : "Not Provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Update Profile Form */}
        <div className="flex items-center justify-center w-full mt-4">
          <div className="w-full max-w-3xl bg-gradient-to-br from-gray-900 to-black p-6 md:p-8 rounded-xl shadow-2xl border border-gray-600 transform transition duration-500 hover:scale-[1.01] hover:shadow-gray-800">
            <h2 className="text-3xl font-extrabold mb-6 text-center drop-shadow-xl">
              Update Profile
            </h2>
            <p className="text-center text-gray-300 mb-8">
              Keep your information up to date.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className="p-3 border border-gray-600 rounded-lg w-full bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/50"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formState.phone}
                  onChange={handleInputChange}
                  className="p-3 border border-gray-600 rounded-lg w-full bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/50"
                  placeholder="Enter your phone number"
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit phone number."
                  required
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  className="p-3 border border-gray-600 rounded-lg w-full bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/50"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="dob"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  id="dob"
                  value={formState.dob}
                  onChange={handleInputChange}
                  className="p-3 border border-gray-600 rounded-lg w-full bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/50"
                  required
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row gap-4">
              <button
                onClick={handleUpdate}
                disabled={updating || uploading}
                className={`px-6 py-3 w-full bg-gradient-to-r from-blue-500 to-purple-700 text-white text-lg font-semibold rounded-lg shadow-lg hover:from-purple-500 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 transform hover:-translate-y-1 hover:shadow-2xl ${
                  (updating || uploading) && "opacity-50 cursor-not-allowed"
                }`}
              >
                {updating ? "Updating..." : "Update Profile"}
              </button>
              <button
                onClick={openDeleteModal}
                className="px-6 py-3 w-full bg-red-600 hover:bg-red-700 text-white text-lg font-semibold rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500 transform hover:-translate-y-1 hover:shadow-2xl"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <Modal
          isOpen={showDeleteModal}
          onRequestClose={closeDeleteModal}
          contentLabel="Confirm Delete Account"
          className="fixed inset-0 flex items-center justify-center p-4"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        >
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Confirm Account Deletion
            </h2>
            <p className="text-gray-300 mb-6 text-center">
              Are you sure you want to delete your account? This will permanently remove all your data.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Yes, Delete
              </button>
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default ProfilePage;
