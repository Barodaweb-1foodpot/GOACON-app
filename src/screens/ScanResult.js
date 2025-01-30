/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import {
  fetchEventDetails,
  markParticipantEntered,
  markSessionScanned,
} from "../api/eventApi";
import { StatusBar } from "expo-status-bar";

export default function ScanResult({ route }) {
  const navigation = useNavigation();
  const { data } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [registerId, setRegisterId] = useState("");
  const [processingSession, setProcessingSession] = useState(null);
  const [showSessions, setShowSessions] = useState(false);

  useEffect(() => {
    if (data) {
      try {
        const url = new URL(data);
        const pathSegments = url.pathname.split("/");
        const eventId = pathSegments[pathSegments.length - 1];
        setRegisterId(eventId);
        fetchDetails(eventId);
      } catch (error) {
        console.error("Error parsing URL or extracting ID:", error);
        Toast.show({
          type: "error",
          text1: "Invalid QR Code",
          text2: "The scanned QR code is not valid.",
        });
        setIsLoading(false);
      }
    }
  }, [data]);

  const fetchDetails = async (eventId) => {
    try {
      setIsLoading(true);
      const eventData = await fetchEventDetails(eventId);
      setEventDetails(eventData);
      if (eventData.isScanned) {
        setShowSessions(true);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch event details. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterParticipant = async () => {
    try {
      if (!eventDetails) return;

      if (eventDetails.isScanned) {
        Toast.show({
          type: "info",
          text1: "Already Entered",
          text2: "This participant has already been entered.",
        });
        return;
      }

      await markParticipantEntered(registerId);
      setShowAnimation(true);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to enter participant. Please try again.",
      });
    }
  };

  const isSessionWithinTimeWindow = (startTime, endTime) => {
    if (!startTime || !endTime) return false;
    const now = new Date();
    const sessionStart = new Date(startTime);
    const sessionEnd = new Date(endTime);

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
            await markSessionScanned(registerId, sessionId);
            await fetchDetails(registerId);
            Toast.show({
              type: "success",
              text1: "Success",
              text2: "Session entered successfully",
            });
          } catch (error) {
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

  // New function to format full date and time
  const formatFullDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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
      <View style={styles.locationContainer}>
        <Icon name="room" size={20} color="#666666" style={styles.iconStyle} />
        <Text style={styles.eventLocation}>
          {eventDetails?.eventName?.EventLocation || "N/A"}
        </Text>
      </View>
      <View style={styles.dateContainer}>
        <Icon name="event" size={20} color="#666666" style={styles.iconStyle} />
        <Text style={styles.registrationDate}>
          {`Registered on: ${formatFullDateTime(eventDetails?.createdAt)}`}
        </Text>
      </View>
    </View>
  );

  const renderSessionsCard = () => {
    const availableSessions = eventDetails?.EventSession?.filter(
      (session) =>
        isSessionWithinTimeWindow(
          session.EventSession?.startTime,
          session.EventSession?.endTime
        ) || session.isScanned
    );

    if (!availableSessions || availableSessions.length === 0) {
      return (
        <View style={styles.noSessionsContainer}>
          <Text style={styles.noSessionsText}>
            Currently no active sessions available
          </Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sessionsTitle}>Event Sessions</Text>
        <View style={styles.sessionsContainer}>
          {availableSessions.map((session) => {
            const isAvailable = isSessionWithinTimeWindow(
              session.EventSession?.startTime,
              session.EventSession?.endTime
            );
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
                    <View style={styles.timeContainer}>
                      <Icon name="schedule" size={16} color="#666666" />
                      <Text style={styles.sessionTime}>
                        {`${formatFullDateTime(session.EventSession?.startTime)} - ${formatDateTime(
                          session.EventSession?.endTime
                        )}`}
                      </Text>
                    </View>
                    <View style={styles.locationContainerSession}>
                      <Icon name="room" size={16} color="#666666" />
                      <Text style={styles.sessionLocation}>
                        {`${session.EventSession?.sessionLocation || "N/A"}`}
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
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Participant Details</Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1A5276" />
          <Text style={styles.loadingText}>Loading Event Details...</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scrollView} bounces={false}>
            {renderParticipantCard()}
            {!eventDetails?.isScanned && !showSessions && (
              <View style={styles.centerContent}>
                {showAnimation ? (
                  <View style={styles.successContainer}>
                    <Icon name="check-circle" size={100} color="#28A745" />
                    <Text style={styles.successText}>
                      Participant entered successfully
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.enterButton}
                    onPress={handleEnterParticipant}
                  >
                    <Text style={styles.enterButtonText}>
                      Enter Participant
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {showSessions && renderSessionsCard()}
            <View style={styles.spacing} />
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={() => navigation.navigate("Scanner")}
            >
              <Text style={styles.navigationButtonText}>Open Scanner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navigationButton, styles.homeButton]}
              onPress={() => navigation.navigate("Homepage")}
            >
              <Text style={styles.navigationButtonText}>Home</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FB",
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight || 0 : 0,
  },
  header: {
    backgroundColor: "#1A5276",
    padding: 16,
    paddingTop:
      Platform.OS === "android" ? (RNStatusBar.currentHeight || 0) + 16 : 16,
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
  spacing: {
    height: 80,
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
    fontSize: 18,
    color: "#2C3E50",
    marginBottom: 8,
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
    marginLeft: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  sessionsContainer: {
    gap: 12,
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
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationContainerSession: {
    flexDirection: "row",
    alignItems: "center",
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
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  successText: {
    color: "#28A745",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  enterButton: {
    backgroundColor: "#28A745",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  enterButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navigationButton: {
    flex: 1,
    backgroundColor: "#154360",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  homeButton: {
    backgroundColor: "#00796B",
  },
  navigationButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sessionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 12,
    marginTop: 16,
  },
  iconStyle: {
    marginRight: 6,
  },
  // New Styles for No Sessions Message
  noSessionsContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  noSessionsText: {
    fontSize: 16,
    color: "#666666",
    fontFamily: "Poppins-Regular",
  },
});
