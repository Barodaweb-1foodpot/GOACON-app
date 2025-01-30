/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import { fetchEventDetails, markSessionScanned } from "../api/eventApi";
import { useNavigation } from "@react-navigation/native";
import { RollInRight } from "react-native-reanimated";

export default function EventSession({ route, navigation }) {
  const { participant } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [eventDetails, setEventDetails] = useState(null);
  const [processingSession, setProcessingSession] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const data = await fetchEventDetails(participant._id);
      setEventDetails(data);
      console.log("Fetched event details:", data);
    } catch (error) {
      console.error("Failed to fetch session details:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch session details. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSessionWithinTimeWindow = (startTime, endTime) => {
    if (!startTime || !endTime) return false;

    const now = new Date();
    const sessionStart = new Date(startTime);
    const sessionEnd = new Date(endTime);

    // console.log("Current Time:", now.toLocaleString());
    console.log("Session Start:", sessionStart.toLocaleString());
    console.log("Session End:", sessionEnd.toLocaleString());

    return now >= sessionStart && now <= sessionEnd;
  };

  const handleSessionScan = async (sessionId) => {
    Alert.alert("Enter Session", "Do you want to enter this session?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: async () => {
          try {
            setProcessingSession(sessionId);
            await markSessionScanned(participant._id, sessionId);
            await fetchDetails();
            Toast.show({
              type: "success",
              text1: "Success",
              text2: "Session entered successfully",
            });
          } catch (error) {
            console.error("Failed to enter session:", error);
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to enter session.",
            });
          } finally {
            setProcessingSession(null);
          }
        },
      },
    ]);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const renderParticipantCard = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.participantName}>
          {eventDetails?.name || "N/A"}
        </Text>
      </View>
      <Text style={styles.eventName}>
        {eventDetails?.eventName?.EventName || "N/A"}
      </Text>
      <View style={styles.ticketContainer}>
        {/* <Icon name="confirmation-number" size={20} color="#666666" />
              <Text style={styles.ticketText}>
                {eventDetails?.TicketType?.TicketType || "N/A"}
              </Text> */}
        <Icon
          name="person"
          size={20}
          color="#666666"
          style={styles.iconStyle}
        />
        <Text style={styles.designation}>
          {eventDetails?.designation || "N/A"}
        </Text>
      </View>
      <Text style={styles.eventDate}>
        Date: {formatDate(eventDetails?.eventName?.StartDate)} to{" "}
        {formatDate(eventDetails?.eventName?.EndDate)}
      </Text>
    </View>
  );

  const renderSessionsCard = () => (
    <View style={styles.sessionsContainer}>
      {eventDetails?.EventSession?.map((session) => {
        const sessionStart = session.EventSession?.startTime;
        const sessionEnd = session.EventSession?.endTime;
        const isAvailable = isSessionWithinTimeWindow(sessionStart, sessionEnd);

        return (
          <View
            key={session.EventSession?._id}
            style={[
              styles.sessionCard,
              {
                borderLeftColor: session.isScanned ? "#4CAF50" : "#FFA000",
              },
            ]}
          >
            <View style={styles.sessionContent}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionName}>
                  {session.EventSession?.sessionName || "Unnamed Session"}
                </Text>

                {/* Updated Date Section */}
                <View style={styles.timeContainer}>
                  <Icon name="event" size={16} color="#666666" />
                  <Text style={styles.sessionDate}>
                    {formatDate(sessionStart)}
                  </Text>
                </View>

                {/* Updated Time Section */}
                <View style={styles.timeContainer}>
                  <Icon name="schedule" size={16} color="#666666" />
                  <Text style={styles.sessionTime}>
                    {`${formatDateTime(sessionStart)} - ${formatDateTime(
                      sessionEnd
                    )}`}
                  </Text>
                </View>

                {/* Updated Location Section */}
                <View style={styles.locationContainer}>
                  <Icon name="location-on" size={16} color="#666666" />
                  <Text style={styles.sessionLocation}>
                    {session.EventSession?.sessionLocation || "N/A"}
                  </Text>
                </View>
              </View>

              {processingSession === session.EventSession?._id ? (
                <ActivityIndicator size="small" color="#28A745" />
              ) : (
                <TouchableOpacity
                  style={[
                    styles.sessionButton,
                    session.isScanned && styles.scannedButton,
                    !isAvailable &&
                      !session.isScanned &&
                      styles.unavailableButton,
                  ]}
                  onPress={() =>
                    !session.isScanned &&
                    isAvailable &&
                    session.EventSession?._id &&
                    handleSessionScan(session.EventSession._id)
                  }
                  disabled={session.isScanned || !isAvailable}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      session.isScanned && styles.scannedButtonText,
                      !isAvailable &&
                        !session.isScanned &&
                        styles.unavailableButtonText,
                    ]}
                  >
                    {session.isScanned
                      ? "Scanned ✓"
                      : !isAvailable
                        ? "Not Available"
                        : "Enter Session"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Sessions</Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1A5276" />
          <Text style={styles.loadingText}>Loading Session Details...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} bounces={false}>
          {renderParticipantCard()}
          {renderSessionsCard()}
        </ScrollView>
      )}
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FB",
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: "#1A5276",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight + 16 : 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#1A5276",
    marginTop: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 8,
  },
  participantName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
  },
  eventName: {
    fontSize: 17,
    color: "#2C3E50",
    marginBottom: 10,
  },
  ticketContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  ticketText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 6,
    marginRight: 12,
  },
  designation: {
    fontSize: 14,
    color: "#666666",
  },
  eventDate: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  eventLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventLocation: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 6,
  },
  sessionsContainer: {
    gap: 12,
    marginBottom: 35,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2C3E50",
    marginBottom: 6,
  },
  sessionDate: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
    flex: 1,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 6,
  },
  sessionLocation: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 6,
  },
  sessionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FFA000",
    minWidth: 120,
    alignItems: "center",
  },
  scannedButton: {
    backgroundColor: "#4CAF50",
  },
  unavailableButton: {
    backgroundColor: "#E0E0E0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  scannedButtonText: {
    color: "#FFFFFF",
  },
  unavailableButtonText: {
    color: "#666666",
  },
  iconStyle: {
    marginRight: 6,
  },
});
