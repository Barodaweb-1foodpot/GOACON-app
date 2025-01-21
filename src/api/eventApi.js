import axios from "axios";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";

export const fetchEventDetails = async (eventId) => {
  try {
    console.log(`Fetching details for eventId: ${eventId}`);
    const response = await axios.get(`${API_BASE_URL}/auth/get/EventRegister/${eventId}`);
    console.log("Event details response:", response);

    if (!response.data || response.status !== 200) {
      throw new Error("Invalid response format or no data received.");
    }
    return response.data; 
  } catch (error) {
    console.error("Fetch Event API error:", error);

    Toast.show({
      type: "error",
      text1: "Fetch Failed",
      text2: error.response?.data?.message || "Unable to fetch event details.",
    });

    throw new Error(
      error.response?.data?.message || "Unable to fetch event details."
    );
  }
};

export const fetchEventsByPartner = async (payload) => {
  try {
    console.log("Fetching events with payload:", payload);
    const response = await axios.post(
      `${API_BASE_URL}/auth/list-by-params/eventByEventPartner`,
      payload
    );

    if (!response.data || !response.data[0] || !response.data[0].data) {
      throw new Error("Invalid response format");
    }

    console.log("Events fetched successfully:", response.data[0].data);
    return response.data[0].data;
  } catch (error) {
    console.error("Error fetching events by partner:", error);
    Toast.show({
      type: "error",
      text1: "Fetch Failed",
      text2: error.response?.data?.message || "Unable to fetch event details.",
    });
    throw new Error(
      error.response?.data?.message || "Unable to fetch event details."
    );
  }
};

export const markParticipantEntered = async (eventId) => {
  try {
    console.log(`Marking participant as entered for eventId: ${eventId}`);
    const response = await axios.patch(
      `${API_BASE_URL}/auth/patch/EventRegisterScan/${eventId}`
    );

    console.log("Participant entered response:", response.data);

    Toast.show({
      type: "success",
      text1: "Participant Entered",
      text2: "The participant has been successfully entered.",
    });

    return response.data;
  } catch (error) {
    console.error("Enter Participant API error:", error);

    Toast.show({
      type: "error",
      text1: "Entry Failed",
      text2:
        error.response?.data?.message ||
        "Unable to mark participant as entered.",
    });

    throw new Error(
      error.response?.data?.message || "Unable to mark participant as entered."
    );
  }
};