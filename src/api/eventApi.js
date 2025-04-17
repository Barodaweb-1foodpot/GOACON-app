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

export const markParticipantEntered = async (participantId, exhibitionId ) => {
  try {
    console.log(participantId, exhibitionId );
    const response = await axios.post(
      `${API_BASE_URL}/auth/create/createRegistrationScan`,
      {participantId, exhibitionId }
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

export const fetchEventsByPartner = async (id) => {
  try { 
    console.log(id)
    const response = await axios.get(
      `${API_BASE_URL}/auth/get/listExhibitionByEventPartner/${id.eventPartner_id}`
    );
    // console.log("------------------",response.data)
    

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

export const markSessionScanned = async (participantId, exhibitionSessionId) => {
  try {
    // console.log(`Marking session ${sessionId} as scanned for event ${eventId}`);
    const response = await axios.post(
      `${API_BASE_URL}/auth/create/createSessionScan`,
      { participantId, exhibitionSessionId }
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

export const fetchSessionByExhibitionParticipant = async (exhibitionId,participantId) => {
  try {
    console.log('=== API: Fetching Exhibition Sessions by participant===');
    console.log('Exhibition ID:', exhibitionId);
    
    const res = await axios.post(`${API_BASE_URL}/auth/get/listEventSessionByExhibition/${exhibitionId}`, {participantId});
    console.log('=== API: Session Response ===');
    console.log(JSON.stringify(res.data, null, 2));  
    
    return res.data;
  } catch (error) {
    console.error('=== API: Error Fetching Sessions ===');
    console.error(error);
    handleApiError(error, "Unable to fetch session by exhibition.");
  }
};

export const fetchSessionByExhibition = async (exhibitionId) => {
  try {
    console.log('=== API: Fetching Exhibition Sessions ===');
    console.log('Exhibition ID:', exhibitionId);
    
    const res = await axios.get(`${API_BASE_URL}/auth/get/listEventSessionByExhibition/${exhibitionId}`);
    console.log('=== API: Session Response ===');
    console.log(JSON.stringify(res.data, null, 2));  
    
    return res.data;
  } catch (error) {
    console.error('=== API: Error Fetching Sessions ===');
    console.error(error);
    handleApiError(error, "Unable to fetch session by exhibition.");
  }
};

export const fetchParticipantDetail = async (data) => {
  try {
    console.log('=== API: Fetching Participant Details ===');
    console.log('Input Data:', data);
    
    // Ensure data is properly encoded for URL
    const encodedData = encodeURIComponent(data); 
    console.log('=== API: Encoded Data ===');
    console.log(encodedData);
    
    // Make the API call with the appropriate parameter
    console.log('=== API: Making Request ===');
    console.log(`${API_BASE_URL}/auth/participant/forScan/${encodedData}`);
    
    const res = await axios.get(
      `${API_BASE_URL}/auth/participant/forScan/${encodedData}`
    );
    
    console.log('=== API: Response Received ===');
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
    
    // Check if we got valid data
    if (!res.data || !res.data.data) {
      console.error('=== API: Invalid Response Format ===');
      console.error(res.data);
      throw new Error(res.data?.message || "Failed to fetch participant details");
    }
    
    return res.data;
  } catch (error) {
    console.error('=== API: Error in fetchParticipantDetail ===');
    if (error.response) {
      console.error('Response Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('Request Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    // Get a more specific error message if available
    let errorMessage = "Unable to fetch participant details.";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Toast.show({
      type: "error",
      text1: "Error",
      text2: errorMessage,
    });
    
    throw error;
  }
};
 
