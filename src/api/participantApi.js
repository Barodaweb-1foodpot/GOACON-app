import axios from "axios";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";

/**
 * Fetch all events associated with a given partner.
 * Logs the response and displays a toast on error.
 */
export const fetchEventsByPartner = async (id) => {
  try { 
    console.log(`Fetching events for partner: ${id}`);
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/listExhibitionByEventPartner/${id}`
    );
    console.log("Events response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    Toast.show({
      type: "error",
      text1: "Fetch Failed",
      text2: error.response?.data?.message || "Unable to fetch events.",
    });
    throw error;
  }
};

/**
 * Fetch participants based on the provided filtering and pagination payload.
 * Ensures the page size is within acceptable limits.
 */
export const fetchParticipants = async (payload) => {
  try {
    // Cap the per_page value for safety
    const perPage =
      payload.per_page === "total"
        ? 10000 
        : Math.min(Math.max(10, payload.per_page), 1000);

    // Construct the request payload with default sorting settings
    const requestPayload = {
      ...payload,
      skip: payload.skip || 0,
      per_page: perPage,
      sorton: "createdAt",
      sortdir: "desc",
      isActive:true
    }; 

    console.log("Fetching participants with payload:", requestPayload); 

    const response = await axios.post(
      `${API_BASE_URL}/auth/participant/RegistrationScanCount`,
      requestPayload
    );
    console.log("Participants counts:", {
      totalParticipants: response.data.totalParticipants,
      scannedCount: response.data.scannedCount,
      notScannedCount: response.data.notScannedCount,
    });
    
    const responseData = response?.data || {};

    return {
      data: responseData.data || [],
      scannedCount: responseData.scannedCount || 0,
      notScannedCount: responseData.notScannedCount,
      totalCount: responseData.totalParticipants,
      totalPages: Math.ceil((responseData.totalParticipants || 0) / perPage),
    };
  } catch (error) {
    console.error("Error fetching participants:", error);
    Toast.show({
      type: "error",
      text1: "Fetch Failed",
      text2: error.response?.data?.message || "Unable to fetch participants.",
    });
    throw error;
  }
};

/**
 * Update the scan status of a participant.
 * On success, shows a success toast; on error, shows an error toast.
 */
export const updateParticipantScanStatus = async (participantId, isScanned) => {
  try {
    console.log(`Updating scan status for participant: ${participantId} to ${isScanned}`);
    const response = await axios.patch(
      `${API_BASE_URL}/auth/patch/EventRegisterScan/${participantId}`,
      { isScanned }
    );

    if (response.data?.message?.includes("Ticket Scanned successfully")) {
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Ticket scanned successfully.",
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
    if (error.message?.includes("Ticket Scanned successfully")) {
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Ticket scanned successfully.",
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
