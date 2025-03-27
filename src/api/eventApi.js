import axios from "axios";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";

const handleApiError = (error, defaultMessage) => {
  const errorMessage = error.response?.data?.message || defaultMessage;
  
  Toast.show({
    type: "error",
    text1: "Error",
    text2: errorMessage,
  });
  
  throw new Error(errorMessage);
};

export const fetchEventDetails = async (eventId) => {
  try {
    console.log(`Fetching details for eventId: ${eventId}`);
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/EventRegister/${eventId}`
    );
    console.log("Event details response:", response);

    if (!response.data || response.status !== 200) {
      throw new Error("Invalid response format or no data received.");
    }
    return response.data;
  } catch (error) {
    console.error("Fetch Event API error:", error);
    handleApiError(error, "Unable to fetch event details.");
  }
};

export const fetchEventsByPartner = async (payload) => {
  try {
    console.log("Fetching events with payload:", payload);
    const response = await axios.post(
      `${API_BASE_URL}/auth/list-by-params/exhibitionDetailsByEventPartner`,
      payload
    );
    // console.log(response.data)

    if (!response.data || !response.data[0] || !response.data[0].data) {
      throw new Error("Invalid response format");
    }

    console.log("Events fetched successfully:", response.data[0].data);
    return response.data[0].data;
  } catch (error) {
    console.error("Error fetching events by partner:", error);
    handleApiError(error, "Unable to fetch event details.");
  }
};

export const markParticipantEntered = async (eventId) => {
  try {
    console.log(`Marking participant as entered for eventId: ${eventId}`);
    const response = await axios.patch(
      `${API_BASE_URL}/auth/patch/EventRegisterScan/${eventId}`
    );

    if (!response.data || response.status !== 200) {
      throw new Error("Failed to mark participant as entered.");
    }

    console.log("Participant entered response:", response.data);
    
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Participant has been successfully entered.",
    });

    return response.data;
  } catch (error) {
    console.error("Enter Participant API error:", error);
    handleApiError(error, "Unable to mark participant as entered.");
  }
};

export const markSessionScanned = async (eventId, sessionId) => {
  try {
    console.log(`Marking session ${sessionId} as scanned for event ${eventId}`);
    const response = await axios.patch(
      `${API_BASE_URL}/auth/patch/EventSessionRegisterScan/${eventId}`,
      { sessionId }
    );

    if (!response.data || response.status !== 200) {
      throw new Error("Failed to mark session as scanned.");
    }

    console.log("Session scan response:", response.data);
    
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Session has been successfully marked as scanned.",
    });

    return response.data;
  } catch (error) {
    console.error("Mark Session API error:", error);
    handleApiError(error, "Unable to mark session as scanned.");
  }
};

// Utility function to validate event data
export const validateEventData = (data) => {
  if (!data) return false;
  
  const requiredFields = ['exhibitionEventName', 'name', 'ticketCategory'];
  return requiredFields.every(field => {
    if (field === 'exhibitionEventName') {
      return data[field]?.exhibitionEventName;
    }
    return data[field];
  });
};

export const fetchSessionByExhibition=async(exhibitionId)=>{
  try {
    const res = await axios.get(`${API_BASE_URL}/auth/get/listEventSessionByExhibition/${exhibitionId}`)
    console.log("=================",res)
    return res.data
  } catch (error) {
    console.error("Error fetching session by exhibition:", error);
    handleApiError(error, "Unable to fetch session by exhibition.");
  }
} 
