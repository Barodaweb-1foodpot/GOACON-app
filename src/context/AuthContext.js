/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/prop-types */
import React, { createContext, useContext, useState } from "react";
// import { fetchUserDetails } from "../api/adminApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchEventPartnerDetails,
  fetchEventUserDetails,
} from "../api/adminApi";

export const AuthContext = createContext();
export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [selectedEventPartner, setSelectedEventPartner] = useState(null);
  const [userType, setUserType] = useState("");
  const [mainLoading, setmainLoading] = useState(false);

  const fetchUser = async () => {
    setmainLoading(true);
    setError(null);
    try {
      const _id = await AsyncStorage.getItem("_id");
      const role = await AsyncStorage.getItem("role");
      setUserType(role)
      if(_id)
      {const eventPartner = await AsyncStorage.getItem("selectedEventPartner");
      if (role === "eventUser") {
        const data = await fetchEventUserDetails(_id);
        setSelectedEventPartner(eventPartner);
        setUser(data._id);
      }
      
      if (role === "eventPartner") {
        const data = await fetchEventPartnerDetails(_id);
        setUser(data._id);
      }}
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      setError(error.message || "Failed to fetch user details.");
    } finally {
      setmainLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("_id");
    await AsyncStorage.removeItem("role");
    await AsyncStorage.removeItem("selectedEventPartner");
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
        setLoading,
        setUser,
        fetchUser,
        logout,
        user,
        error,
        selectedEventPartner,
        setSelectedEventPartner,
        userType,
        setUserType,
        mainLoading,
        setmainLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
