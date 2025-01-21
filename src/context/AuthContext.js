/* eslint-disable react/prop-types */
import React, { createContext, useContext, useState } from "react";
import { fetchUserDetails } from "../api/adminApi";

export const AuthContext = createContext();
export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedEventPartner, setSelectedEventPartner] = useState(null);
  const [userType, setUserType] = useState("");

  const fetchUser = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Calling fetchUser with userId:", userId);
      const userData = await fetchUserDetails(userId);
      console.log("Fetched user data in AuthContext:", userData);
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      setError(error.message || "Failed to fetch user details.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    setSelectedEventPartner(null);
    console.log("User logged out successfully.");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        setUser,
        fetchUser,
        logout,
        user,
        error,
        selectedEventPartner,
        setSelectedEventPartner,
        userType,
        setUserType
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
