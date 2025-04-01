import axios from "axios";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";



// Fetch sessions by event ID
export const fetchSessionsByEvent = async (eventId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/sessionByEvent/${eventId}`
    );

    if (response.data && response.data.success) {
      return response.data; // { find: [...], success: true, status: 200 }
    } else {
      throw new Error("No sessions found for the selected event.");
    }
  } catch (error) {
    console.error("Error fetching sessions:", error);
    Toast.show({
      type: "error",
      text1: "Fetch Failed",
      text2: error.response?.data?.message || "Unable to fetch sessions.",
    });
    throw error;
  }
};

// Optional: Update session scan status (if needed)
export const updateSessionScanStatus = async (sessionId, isScanned) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/auth/patch/EventSessionScan/${sessionId}`,
      { isScanned }
    );

    if (response.data?.message?.includes("Session Scanned successfully")) {
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Session scanned successfully.",
      });
      return response.data;
    }

    if (response.data && response.data.success) {
      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: "Scan status updated successfully.",
      });
      return response.data;
    }

    throw new Error(response.data?.message || "Update failed");
  } catch (error) {
    if (error.message?.includes("Session Scanned successfully")) {
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Session scanned successfully.",
      });
      return { success: true, message: error.message };
    }

    console.error("Error updating scan status:", error);
    Toast.show({
      type: "error",
      text1: "Update Failed",
      text2: error.response?.data?.message || "Unable to update scan status.",
    });
    throw error;
  }
};

// Fetch participant counts by session ID
export const fetchParticipantCounts = async (sessionId , exhibitionId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/participant/sessionScanCount`,{sessionId , exhibitionId}
      );
  
      if (response.data) {
        return response.data; // { totalParticipants: X, scannedParticipants: Y }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching participant counts:", error);
      Toast.show({
        type: "error",
        text1: "Fetch Failed",
        text2: error.response?.data?.message || "Unable to fetch participant counts.",
      });
      throw error;
    }
  };