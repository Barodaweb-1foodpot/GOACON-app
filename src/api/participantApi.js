import axios from "axios";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";

export const fetchEventsByPartner = async (id) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/auth/list/eventByEventPartner/${id}`
    );

    if (!response.data || !response.data.event) {
      throw new Error("Invalid response format");
    }

    return response.data.event;
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

export const fetchParticipants = async (payload) => {
  try {
    const perPage =
      payload.per_page === "total"
        ? 10000 
        : Math.min(Math.max(10, payload.per_page), 100); 

    const requestPayload = {
      ...payload,
      skip: payload.skip || 0,
      per_page: perPage,
      sorton: "createdAt",
      sortdir: "desc",
    };

    const response = await axios.post(
      `${API_BASE_URL}/auth/list-by-params/EventRegisterFilter`,
      requestPayload
    );

    const responseData = response?.data[0] || {};

    return {
      data: responseData.data || [],
      count: responseData.count || 0,
      totalPages: Math.ceil((responseData.count || 0) / perPage),
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

export const updateParticipantScanStatus = async (participantId, isScanned) => {
  try {
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