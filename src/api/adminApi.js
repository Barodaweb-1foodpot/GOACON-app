import axios from "axios";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const fetchEventPartners = async () => {
  const token = await AsyncStorage.getItem("token");
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/list/eventpartner`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(
      "Event partners fetched:",
      response.data.map((partner) => partner.companyName)
    );
    
    return response.data;
  } catch (error) {
    console.error("Error fetching event partners:", error);
    Toast.show({
      type: "error",
      text1: "Fetch Failed",
      text2: "Unable to fetch event partners. Please try again.",
    });
    throw new Error("Unable to fetch event partners.");
  }
};

export const eventPartnerLogin = async (email, password) => {
  try {
    console.log("Attempting Event Partner login...");
    const response = await axios.post(
      `${API_BASE_URL}/auth/eventPartnerLogin`,
      {
        Email: email,
        Password: password,
      }
    );
    console.log("Event Partner login response:", response.data);
    if(response.data.isOk){
      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome back, Event Partner!",
      });
    }else{
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: "Invalid email or password.",
      });
    }

    return response.data;
  } catch (error) {
    console.error("Error logging in Event Partner:", error);
    Toast.show({
      type: "error",
      text1: "Login Failed",
      text2: error.response?.data?.message || "Invalid email or password.",
    });
    throw new Error(error.response?.data?.message || "Login failed.");
  }
};

export const eventUserLogin = async (email, password, eventPartner) => {
  try {
    console.log("Attempting Event User login...");
    const response = await axios.post(`${API_BASE_URL}/EventUserLogin`, {
      email,
      password,
      eventPartner,
    });
    console.log("Event User login response:", response.data);
    await AsyncStorage.setItem("role","eventUser")
    await AsyncStorage.setItem("selectedEventPartner",eventPartner)
    Toast.show({
      type: "success",
      text1: "Login Successful",
      text2: "Welcome back, Event User!",
    });

    return response.data;
  } catch (error) {
    console.error("Error logging in Event User:", error);
    Toast.show({
      type: "error",
      text1: "Login Failed",
      text2: error.response?.data?.message || "Invalid email or password.",
    });
    throw new Error(error.response?.data?.message || "Login failed.");
  }
};

export const fetchEventUserDetails = async (userId, token) => {
  try {
    console.log(`Fetching details for Event User ID: ${userId}`);
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/EventUser/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Event User details fetched:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error fetching Event User details:", error);
    Toast.show({
      type: "error",
      text1: "Fetch Failed",
      text2: error.response?.data?.message || "Unable to fetch user details.",
    });
    throw new Error(
      error.response?.data?.message || "Unable to fetch user details."
    );
  }
};

export const fetchEventPartnerDetails = async (partnerId, token) => {
  try {
    console.log(`Fetching details for Event Partner ID: ${partnerId}`);
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/eventpartner/${partnerId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Event Partner details fetched:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error fetching Event Partner details:", error);
    Toast.show({
      type: "error",
      text1: "Fetch Failed",
      text2:
        error.response?.data?.message || "Unable to fetch partner details.",
    });
    throw new Error(
      error.response?.data?.message || "Unable to fetch partner details."
    );
  }
};
