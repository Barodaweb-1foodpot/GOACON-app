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
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { fetchEventDetails, markSessionScanned } from "../api/eventApi";

const { width } = Dimensions.get('window');

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
    return now >= sessionStart && now <= sessionEnd;
  };

  const handleSessionScan = async (sessionId) => {
    Alert.alert(
      "Enter Session",
      "Do you want to enter this session?",
      [
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
      ]
    );
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
    <View style={styles.participantCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Icon name="person" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.participantName}>
            {eventDetails?.name || "N/A"}
          </Text>
          {/* <Text style={styles.designation}>
            {eventDetails?.designation || "N/A"}
          </Text> */}
        </View>
      </View>
      
      <View style={styles.eventInfoContainer}>
        <Text style={styles.eventName}>
          {eventDetails?.eventName?.EventName || "N/A"}
        </Text>
        <View style={styles.dateContainer}>
          <Icon name="event" size={18} color="#FFFFFF" style={styles.iconStyle} />
          <Text style={styles.eventDate}>
            {formatDate(eventDetails?.eventName?.StartDate)} to{" "}
            {formatDate(eventDetails?.eventName?.EndDate)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSessionsCard = () => (
    <View style={styles.sessionsContainer}>
      <Text style={styles.sectionTitle}>Available Sessions</Text>
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

                <View style={styles.timeContainer}>
                  <Icon name="event" size={16} color="#FFFFFF" />
                  <Text style={styles.sessionDate}>
                    {formatDate(sessionStart)}
                  </Text>
                </View>

                <View style={styles.timeContainer}>
                  <Icon name="schedule" size={16} color="#FFFFFF" />
                  <Text style={styles.sessionTime}>
                    {`${formatDateTime(sessionStart)} - ${formatDateTime(
                      sessionEnd
                    )}`}
                  </Text>
                </View>

                <View style={styles.locationContainer}>
                  <Icon name="location-on" size={16} color="#FFFFFF" />
                  <Text style={styles.sessionLocation}>
                    {session.EventSession?.sessionLocation || "N/A"}
                  </Text>
                </View>
              </View>

              {processingSession === session.EventSession?._id ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <TouchableOpacity
                  style={[
                    styles.sessionButton,
                    session.isScanned && styles.scannedButton,
                    !isAvailable && !session.isScanned && styles.unavailableButton,
                  ]}
                  onPress={() =>
                    !session.isScanned &&
                    isAvailable &&
                    session.EventSession?._id &&
                    handleSessionScan(session.EventSession._id)
                  }
                  disabled={session.isScanned || !isAvailable}
                >
                  <LinearGradient
                    colors={
                      session.isScanned
                        ? ["#4CAF50", "#2E7D32"]
                        : !isAvailable
                        ? ["#9E9E9E", "#757575"]
                        : ["#FFA000", "#F57C00"]
                    }
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {session.isScanned
                        ? "Scanned ✓"
                        : !isAvailable
                        ? "Not Available"
                        : "Enter Session"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <LinearGradient
      colors={["#000B19", "#001F3F", "#003366"]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
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
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading Session Details...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView} 
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {renderParticipantCard()}
            {renderSessionsCard()}
          </ScrollView>
        )}
      </SafeAreaView>
      <Toast />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight + 16 : 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
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
    color: "#FFFFFF",
    fontFamily: "Poppins-Medium",
    marginTop: 10,
  },
  participantCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.84,
    backgroundColor: "#002952",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    backgroundColor: "#003366",
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 22,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
  },
  designation: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Poppins-Regular",
  },
  eventInfoContainer: {
    backgroundColor: "#001F3F",
    borderRadius: 12,
    padding: 12,
  },
  eventName: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventDate: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Poppins-Regular",
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  sessionsContainer: {
    gap: 16,
    marginBottom: 35,
  },
  sessionCard: {
    borderRadius: 20,
    borderLeftWidth: 4,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.84,
    backgroundColor: "#002952",
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
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionDate: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
  },
  sessionTime: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
  },
  sessionLocation: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
  },
  sessionButton: {
    minWidth: 120,
    overflow: "hidden",
    borderRadius: 12,
  },
  buttonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
  },
  iconStyle: {
    marginRight: 8,
  },
});