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
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  fetchEventDetails,
  fetchParticipantDetail,
  fetchSessionByExhibition,
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
  const [exhibitionSession, setExhibitionSession] = useState([]);
  const [processingSession, setProcessingSession] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [participantData, setParticipantData] = useState("");

  useEffect(() => {
    if (data) {
      try {
        console.log('=== ScanResult: Received Data from Scanner ===');
        console.log(data);
        setRegisterId(data);
        fetchDetails(data);
      } catch (error) {
        console.error('=== ScanResult: Error Processing Initial Data ===');
        console.error(error);
        Toast.show({
          type: "error",
          text1: "Invalid QR Code",
          text2: "The scanned QR code is not valid or cannot be processed.",
        });
        setIsLoading(false);
      }
    }
  }, [data]);

  const fetchDetails = async (data) => {
    try {
      setIsLoading(true);
      console.log('=== ScanResult: Fetching Participant Details ===');
      console.log('Identifier:', data);
      
      const fetchedData = await fetchParticipantDetail(data);
      console.log('=== ScanResult: API Response ===');
      console.log(JSON.stringify(fetchedData, null, 2));
      
      if (!fetchedData || !fetchedData.data) {
        console.error('=== ScanResult: Invalid API Response ===');
        console.error('Response:', fetchedData);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No participant found with the provided identifier.",
        });
        setIsLoading(false);
        return;
      }
      
      console.log('=== ScanResult: Setting Participant Data ===');
      console.log('Participant ID:', fetchedData.data._id);
      setParticipantData(fetchedData);
      
      // Check if exhibition data exists
      if (fetchedData.data.exhibitionId) {
        console.log('=== ScanResult: Exhibition Data Found ===');
        console.log('Exhibition:', fetchedData.data.exhibitionId);
        setEventDetails(fetchedData.data.exhibitionId);
        
        // Check registration scan status
        if (!fetchedData.data.registrationScan || fetchedData.data.registrationScan === null) {
          setShowSessions(false);
        } else {
          console.log('=== ScanResult: Registration Scan Found, Fetching Sessions ===');
          console.log('Exhibition ID:', fetchedData.data.exhibitionId._id);
          fetchExhibitionSession(fetchedData.data.exhibitionId._id);
          setShowSessions(true);
        }
      } else {
        console.warn('=== ScanResult: No Exhibition Data Found ===');
        Toast.show({
          type: "warning",
          text1: "Warning",
          text2: "No event data found for this participant.",
        });
      }
    } catch (error) {
      console.error('=== ScanResult: Error in fetchDetails ===');
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to fetch participant details. Please try again.",
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

      // Use the nested participant ID from participantData.data
      const res = await markParticipantEntered(
        participantData.data._id,
        eventDetails._id
      );

      if (res.isOk) {
        fetchExhibitionSession(res.data.exhibitionId);
      }

      // Update local participant data: set registrationScan on the nested data object
      setParticipantData((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          registrationScan: eventDetails._id,
        },
      }));
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
        setShowSessions(true);
      }, 2000);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to enter participant. Please try again.",
      });
    }
  };

  const fetchExhibitionSession = async (exhibitionId) => {
    try {
      console.log('=== ScanResult: Fetching Exhibition Sessions ===');
      console.log('Exhibition ID:', exhibitionId);
      const res = await fetchSessionByExhibition(exhibitionId);
      console.log('=== ScanResult: Session Data Received ===');
      console.log(JSON.stringify(res, null, 2));
      setExhibitionSession(res.data);
    } catch (error) {
      console.error('=== ScanResult: Error Fetching Sessions ===');
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch exhibition sessions.",
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
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            setProcessingSession(sessionId);
            // Use nested participant ID
            await markSessionScanned(participantData.data._id, sessionId);
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
        <View style={styles.statusBadge}>
          <Icon
            name={
              participantData?.data?.registrationScan === null ||
              !participantData?.data?.registrationScan
                ? "pending"
                : "check-circle"
            }
            size={16}
            color={
              participantData?.data?.registrationScan === null ||
              !participantData?.data?.registrationScan
                ? "#FFA000"
                : "#4CAF50"
            }
          />
          <Text
            style={[
              styles.statusText,
              {
                color:
                  participantData?.data?.registrationScan === null ||
                  !participantData?.data?.registrationScan
                    ? "#FFA000"
                    : "#4CAF50",
              },
            ]}
          >
            { !participantData?.data?.registrationScan ||
              participantData?.data?.registrationScan === null
              ? "Not Entered"
              : "Checked In"}
          </Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Icon name="person" size={20} color="#FFFFFF" />
          <Text style={styles.participantName}>
          {participantData?.data?.firstName || ""}{" "}
          {participantData?.data?.lastName || ""}
        </Text>
        </View>

        <View style={styles.infoItem}>
          <Icon name="badge" size={20} color="#FFFFFF" />
          <Text style={styles.infoText}>
            {participantData?.data?.Designation || "N/A"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Icon name="room" size={20} color="#FFFFFF" />
          <Text style={styles.infoText}>
            {eventDetails?.address || "N/A"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Icon name="event" size={20} color="#FFFFFF" />
          <Text style={styles.infoText}>
            {`Registered: ${formatFullDateTime(eventDetails?.createdAt)}`}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSessionsCard = () => {
    const availableSessions = exhibitionSession;
    if (!availableSessions || availableSessions.length === 0) {
      return (
        <View style={styles.noSessionsContainer}>
          <Icon name="event-busy" size={48} color="#FFFFFF" />
          <Text style={styles.noSessionsText}>
            No active sessions available
          </Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sessionsTitle}>Event Sessions</Text>
        <View style={styles.sessionsContainer}>
          {availableSessions.map((session) => {
            const sessionStart = session.startTime;
            const sessionEnd = session.endTime;
            const isAvailable = true;
            const isScanned = participantData?.data?.sessionScan?.some(
              (scan) => scan.exhibitionSessionId === session._id
            );
            return (
              <LinearGradient
                key={session._id}
                colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.05)"]}
                style={[
                  styles.sessionCard,
                  {
                    borderLeftColor: isScanned ? "#4CAF50" : "#FFA000",
                  },
                ]}
              >
                <View style={styles.sessionContent}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>
                      {session.sessionName || "Unnamed Session"}
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
                        {session.sessionLocation || "N/A"}
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
                        !isAvailable &&
                          !isScanned &&
                          styles.unavailableButton,
                      ]}
                      onPress={() =>
                        !isScanned &&
                        isAvailable &&
                        handleSessionScan(session._id)
                      }
                      disabled={isScanned || !isAvailable}
                    >
                      <LinearGradient
                        colors={
                          isScanned
                            ? ["#4CAF50", "#2E7D32"]
                            : !isAvailable
                            ? ["#9E9E9E", "#757575"]
                            : ["#FFA000", "#F57C00"]
                        }
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.buttonText}>
                          {isScanned
                            ? "Scanned ✓"
                            : !isAvailable
                            ? "Not Available"
                            : "Enter Session"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            );
          })}
        </View>
      </>
    );
  };

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
          <Text style={styles.headerTitle}>Participant Details</Text>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading Details...</Text>
          </View>
        ) : (
          <>
            <ScrollView style={styles.scrollView} bounces={false}>
              {renderParticipantCard()}

              {!eventDetails?.isScanned && !showSessions && (
                <View style={styles.centerContent}>
                  {showAnimation ? (
                    <View style={styles.successContainer}>
                      <Icon name="check-circle" size={100} color="#4CAF50" />
                      <Text style={styles.successText}>
                        Check-in Successful!
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.enterButton}
                      onPress={handleEnterParticipant}
                    >
                      <Icon
                        name="how-to-reg"
                        size={24}
                        color="#FFFFFF"
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.enterButtonText}>
                        Check In Participant
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
                <Icon
                  name="qr-code-scanner"
                  size={24}
                  color="#FFFFFF"
                  style={styles.buttonIcon}
                />
                <Text style={styles.navigationButtonText}>Scan Next</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navigationButton, styles.homeButton]}
                onPress={() => navigation.navigate("Homepage")}
              >
                <Icon
                  name="home"
                  size={24}
                  color="#FFFFFF"
                  style={styles.buttonIcon}
                />
                <Text style={styles.navigationButtonText}>Home</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <Toast />
      </SafeAreaView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  header: {
    padding: 16,
    paddingTop:
      Platform.OS === "android" ? (RNStatusBar.currentHeight || 0) + 16 : 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  spacing: {
    height: 100,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 10,
    fontFamily: "Poppins-Regular",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  participantName: {
    fontSize: 20,
    marginLeft: 8,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Poppins-Bold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "center",
  },
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  exhibitionEventName: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 16,
    opacity: 0.9,
    fontFamily: "Poppins-Medium",
  },
  infoContainer: {
    flexDirection: "column",
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
    opacity: 0.9,
    fontFamily: "Poppins-Regular",
  },
  sessionsTitle: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 16,
    marginTop: 24,
    fontFamily: "Poppins-Bold",
  },
  sessionsContainer: {
    gap: 16,
  },
  sessionCard: {
    backgroundColor: "#233446",
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.84,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  sessionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionName: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  sessionDate: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
    opacity: 0.8,
  },
  sessionTime: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
    opacity: 0.8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionLocation: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
    opacity: 0.8,
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
  scannedButton: {},
  unavailableButton: {},
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  successText: {
    color: "#4CAF50",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    fontFamily: "Poppins-Bold",
  },
  enterButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
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
    marginLeft: 8,
    fontFamily: "Poppins-Bold",
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  navigationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#154360",
    paddingVertical: 12,
    borderRadius: 12,
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
    marginLeft: 8,
    fontFamily: "Poppins-Bold",
  },
  noSessionsContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 24,
    borderRadius: 16,
  },
  noSessionsText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 12,
    opacity: 0.7,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
});
