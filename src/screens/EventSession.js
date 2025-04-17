import React, { useState, useEffect, useMemo } from "react";
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
import {
  fetchEventDetails,
  fetchEventsByPartner,
  fetchParticipantDetail,
  markSessionScanned,
} from "../api/eventApi";
import { useAuthContext } from "../context/AuthContext";

const { width } = Dimensions.get("window");

export default function EventSession({ route, navigation }) {
  const { participant } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [eventDetails, setEventDetails] = useState(null);
  const [processingSession, setProcessingSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState([]);
  useEffect(() => {
    fetchDetails();
  }, []);
  const { user, userType, selectedEventPartner } = useAuthContext();
  const partnerId = useMemo(() => {
    return userType === "eventUser" ? selectedEventPartner : user;
  }, [userType, selectedEventPartner, user]);
  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      console.log("pppp", participant);
      const data = await fetchParticipantDetail(participant._id);
      setEventDetails(data.data);
      setSessionDetail(data.sessiondata);
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
    <View style={styles.participantCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Icon name="person" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.participantName}>
            {eventDetails?.firstName || ""} {eventDetails?.lastName || ""}
          </Text>
          <Text style={styles.designation}>
            {eventDetails?.Designation || "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.eventInfoContainer}>
        <Text style={styles.exhibitionEventName}>
          {eventDetails?.exhibitionId?.exhibitionEventName || "N/A"}
        </Text>
        <View style={styles.dateContainer}>
          <Icon
            name="event"
            size={18}
            color="#FFFFFF"
            style={styles.iconStyle}
          />
          <Text style={styles.eventDate}>
            {formatDate(eventDetails?.exhibitionId?.startTime)} to{" "}
            {formatDate(eventDetails?.exhibitionId?.endTime)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSessionsCard = () => (
    <View style={styles.sessionsContainer}>
      <Text style={styles.sectionTitle}>Available Sessions</Text>
      {sessionDetail?.length === 0 && (
        <View style={styles.emptySessionsContainer}>
          <Icon name="event-busy" size={40} color="#FFFFFF" />
          <Text style={styles.emptySessionsText}>
            No sessions available for this event
          </Text>
        </View>
      )}
      {sessionDetail?.map((session) => {
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime;

        // ✅ Check if participant has scanned this session
        const isScanned = eventDetails?.sessionScan?.some(
          (scan) =>
            scan.exhibitionSessionId?.toString() === session._id?.toString()
        );

        // Check if session is currently active (within time window)
        const isActive = isSessionWithinTimeWindow(sessionStart, sessionEnd);

        const sessionStatus = isScanned
          ? "Scanned"
          : isActive
            ? "Active"
            : "Upcoming";
        const statusColor = isScanned
          ? "#4CAF50"
          : isActive
            ? "#FFA000"
            : "#9E9E9E";

        return (
          <View
            key={session._id}
            style={[styles.sessionCard, { borderLeftColor: statusColor }]}
          >
            <View style={styles.sessionContent}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionTitleContainer}>
                  <Text style={styles.sessionName}>
                    {session.sessionName || "Unnamed Session"}
                  </Text>
                  <View
                    style={[
                      styles.sessionStatusBadge,
                      {
                        backgroundColor: `${statusColor}20`,
                        borderColor: `${statusColor}50`,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.sessionStatusText, { color: statusColor }]}
                    >
                      {sessionStatus}
                    </Text>
                  </View>
                </View>

                {processingSession === session._id ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.sessionButton,
                      isScanned && styles.scannedButton,
                      !isActive && !isScanned && styles.unavailableButton,
                    ]}
                    onPress={() =>
                      !isScanned &&
                      isActive &&
                      session._id &&
                      handleSessionScan(session._id)
                    }
                    disabled={isScanned || !isActive}
                  >
                    <LinearGradient
                      colors={
                        isScanned
                          ? ["#4CAF50", "#2E7D32"]
                          : !isActive
                            ? ["#9E9E9E", "#757575"]
                            : ["#FFA000", "#F57C00"]
                      }
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>
                        {isScanned
                          ? "Scanned ✓"
                          : !isActive
                            ? "Not Available"
                            : "Enter Session"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.sessionInfo}>
                <View style={styles.timeContainer}>
                  <Icon name="event" size={16} color="#FFFFFF" />
                  <Text style={styles.sessionDate}>
                    {formatDate(sessionStart)}
                  </Text>
                </View>

                <View style={styles.timeContainer}>
                  <Icon name="schedule" size={16} color="#FFFFFF" />
                  <Text style={styles.sessionTime}>
                    {`${formatDateTime(sessionStart)} - ${formatDateTime(sessionEnd)}`}
                  </Text>
                </View>

                <View style={styles.locationContainer}>
                  <Icon name="location-on" size={16} color="#FFFFFF" />
                  <Text style={styles.sessionLocation}>
                    {session.sessionLocation || "N/A"}
                  </Text>
                </View>
              </View>
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
  exhibitionEventName: {
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
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  sessionInfo: {
    width: "100%",
  },
  sessionButton: {
    minWidth: 120,
    overflow: "hidden",
    borderRadius: 12,
  },
  sessionName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
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
  sessionStatusBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  sessionStatusText: {
    fontSize: 12,
    fontFamily: "Poppins-Medium",
  },
  emptySessionsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  emptySessionsText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 12,
    opacity: 0.7,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
});
