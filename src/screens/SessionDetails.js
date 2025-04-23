import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TextInput,
  FlatList,
  LayoutAnimation,
  UIManager,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuthContext } from "../context/AuthContext";
import { 
  fetchSessionsByEvent,
  fetchParticipantCounts,
} from "../api/sessionApi";
import DropDownPicker from "react-native-dropdown-picker";
import { fetchEventsByPartner } from "../api/participantApi";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient"; // Import LinearGradient
import { fetchEventPartners } from "../api/adminApi";
import { fetchSessionByExhibition } from "../api/eventApi";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SessionDetails() {
  const { user, userType, selectedEventPartner } = useAuthContext();
  const navigation = useNavigation();

  const [events, setEvents] = useState([]);
  const [eventOpen, setEventOpen] = useState(false);
  const [eventValue, setEventValue] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionValue, setSessionValue] = useState(null);

  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [totalSessions, setTotalSessions] = useState(0);

  const [totalParticipants, setTotalParticipants] = useState(0);
  const [scannedParticipants, setScannedParticipants] = useState(0);
  const [notScannedParticipants, setNotScannedParticipants] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");

  const [dropdownZIndex, setDropdownZIndex] = useState(1000);

  const [filtersVisible, setFiltersVisible] = useState(false);

  const flatListRef = useRef(null); // Ref for FlatList

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (eventValue) {
      fetchSessions(eventValue);
      setSessionValue(null);
      // Reset participant counts
      setTotalParticipants(0);
      setScannedParticipants(0);
      setNotScannedParticipants(0);
    } else {
      setSessions([]);
      setTotalSessions(0);
      setSessionValue(null);
      setTotalParticipants(0);
      setScannedParticipants(0);
      setNotScannedParticipants(0);
    }
  }, [eventValue]);

  useEffect(() => {
    if (sessionValue) {
      fetchSessionCounts(sessionValue);
    } else {
      setTotalParticipants(0);
      setScannedParticipants(0);
      setNotScannedParticipants(0);
    }
  }, [sessionValue, filteredSessions]);

  useFocusEffect(
    useCallback(() => {
      if (eventValue) {
        fetchSessions(eventValue);
        if (sessionValue) {
          fetchSessionCounts(sessionValue);
        }
      }
    }, [eventValue, sessionValue])
  );

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const partnerId = userType === "eventUser" ? selectedEventPartner : user;
      const eventsList = await fetchEventsByPartner(partnerId);
      console.log(eventsList)
      const formattedEvents = [
        { label: "Select Events", value: null },
        ...eventsList.data.map((event) => ({
          label: event.exhibitionEventName,
          value: event._id,
        })),
      ];
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      Toast.show({
        type: "error",
        text1: "Fetch Failed",
        text2: "Unable to fetch events.",
      });
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchSessions = async (eventId) => {
    setLoadingSessions(true);
    try {
      const response = await fetchSessionByExhibition(eventId);
      console.log("0000000",response)
      if (response.isOk) {
        const fetchedSessions = response.data;

        setSessions(fetchedSessions);

        const total = fetchedSessions.length;
        setTotalSessions(total);
      } else {
        setSessions([]);
        setTotalSessions(0);
        Toast.show({
          type: "error",
          text1: "Fetch Failed",
          text2: "Unable to fetch sessions.",
        });
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      Toast.show({
        type: "error",
        text1: "Fetch Failed",
        text2: "Unable to fetch sessions.",
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch participant counts by session ID
  const fetchSessionCounts = async (sessionId) => {
    setLoadingParticipants(true);
    try {
      const counts = await fetchParticipantCounts(sessionId,eventValue);
      console.log("llllllllllllll",counts)
      setTotalParticipants(counts.totalParticipants || 0);
      setScannedParticipants(counts.scannedCount || 0);
      setNotScannedParticipants(counts.notScannedCount || 0);

      // Scroll to the selected session after counts are fetched
      const index = filteredSessions.findIndex(
        (session) => session._id === sessionId
      );
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index, animated: true });
      }
    } catch (error) {
      setTotalParticipants(0);
      setScannedParticipants(0);
      setNotScannedParticipants(0);
      Toast.show({
        type: "error",
        text1: "Fetch Failed",
        text2: "Unable to fetch participant counts.",
      });
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Handle event dropdown open
  const handleEventOpen = useCallback((open) => {
    setDropdownZIndex(open ? 3000 : 1000);
    setEventOpen(open);
    setSessionOpen(false);
  }, []);

  const handleSessionOpen = useCallback((open) => {
    setDropdownZIndex(open ? 2000 : 1000);
    setSessionOpen(open);
    setEventOpen(false);
  }, []);

  const filteredSessions = sessions.filter((session) =>
    session.sessionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to handle session card press with toggle functionality
  const handleSessionPress = (sessionId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (sessionValue === sessionId) {
      setSessionValue(null);
    } else {
      setSessionValue(sessionId);
      // Reset counts before loading new data
      setTotalParticipants(0);
      setScannedParticipants(0);
      setNotScannedParticipants(0);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* Replace the main container View with LinearGradient */}
      <LinearGradient
        colors={["#000B19", "#001F3F", "#003366"]}
        style={styles.gradientContainer}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessible={true}
              accessibilityLabel="Go back"
            >
              <Icon name="arrow-back-ios" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {eventValue
                ? `${events.find((e) => e.value === eventValue)?.label || ""}`
                : "Session Details"}
            </Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFiltersVisible(!filtersVisible)}
              accessible={true}
              accessibilityLabel="Toggle filters"
            >
              <Icon name="tune" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            {/* Filters Section */}
            {filtersVisible && (
              <View
                style={[styles.filtersContainer, { zIndex: dropdownZIndex }]}
              >
                <View style={styles.dropdownsWrapper}>
                  {/* Event Dropdown */}
                  <DropDownPicker
                    open={eventOpen}
                    value={eventValue}
                    items={events}
                    setOpen={handleEventOpen}
                    setValue={setEventValue}
                    setItems={setEvents}
                    placeholder="Select Event"
                    style={styles.dropdown}
                    containerStyle={styles.dropdownContainer}
                    listItemContainerStyle={styles.listItemContainer}
                    dropDownContainerStyle={styles.dropDownContainerStyle}
                    itemSeparator={true}
                    itemSeparatorStyle={styles.itemSeparator}
                    zIndex={3000}
                    listMode="SCROLLVIEW"
                    accessible={true}
                    accessibilityLabel="Select Event"
                  />

                  {/* Session Dropdown
                  <View style={{ marginTop: 10 }}>
                    <DropDownPicker
                      open={sessionOpen}
                      value={sessionValue}
                      items={[
                        { label: "All Sessions", value: null },
                        ...filteredSessions.map((session) => ({
                          label: session.sessionName,
                          value: session._id,
                        })),
                      ]}
                      setOpen={handleSessionOpen}
                      setValue={setSessionValue}
                      setItems={() => {}}
                      placeholder="Select Session"
                      style={styles.dropdown}
                      containerStyle={styles.dropdownContainer}
                      listItemContainerStyle={styles.listItemContainer}
                      dropDownContainerStyle={styles.dropDownContainerStyle}
                      itemSeparator={true}
                      itemSeparatorStyle={styles.itemSeparator}
                      zIndex={2000}
                      listMode="SCROLLVIEW"
                      disabled={!eventValue}
                      accessible={true}
                      accessibilityLabel="Select Session"
                    />
                  </View> */}
                </View>
              </View>
            )}

            {/* Search Bar */}
            {eventValue && !filtersVisible && (
              <View style={styles.searchContainer}>
                <Icon
                  name="search"
                  size={24}
                  color="#666"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  placeholderTextColor="#999"
                  accessible={true}
                  accessibilityLabel="Search sessions"
                />
              </View>
            )}

            {/* Counts Display */}
            {eventValue && (
              <View style={styles.countsContainer}>
                {!sessionValue ? (
                  // Display only total sessions count
                  <CountCard
                    title="Total Sessions"
                    count={totalSessions}
                    color="#1A5276"
                    loading={loadingSessions}
                  />
                ) : (
                  // Display participant counts
                  <>
                    <CountCard
                      title="Total"
                      count={totalParticipants}
                      color="#1A5276"
                      loading={loadingParticipants}
                    />
                    <CountCard
                      title="Scanned"
                      count={scannedParticipants}
                      color="#4CAF50"
                      loading={loadingParticipants}
                    />
                    <CountCard
                      title="Not Scan"
                      count={notScannedParticipants}
                      color="#FFA000"
                      loading={loadingParticipants}
                    />
                  </>
                )}
              </View>
            )}

            {/* Sessions List */}
            <View style={styles.listWrapper}>
              {loadingSessions ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1A5276" />
                  <Text style={styles.loadingText}>Loading sessions...</Text>
                </View>
              ) : eventValue ? (
                <FlatList
                  ref={flatListRef}
                  data={filteredSessions}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.sessionCard,
                        sessionValue === item._id && styles.selectedSessionCard,
                      ]}
                      onPress={() => handleSessionPress(item._id)}
                      activeOpacity={0.8}
                      accessible={true}
                      accessibilityLabel={`Toggle session ${item.sessionName}`}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={styles.sessionName}>
                          {item.sessionName}
                        </Text>
                        <Icon
                          name={
                            sessionValue === item._id
                              ? "keyboard-arrow-up"
                              : "keyboard-arrow-down"
                          }
                          size={24}
                          color="#1A5276"
                        />
                      </View>
                      {/* Expanded Details */}
                      {sessionValue === item._id && (
                        <View style={styles.expandedDetails}>
                          <View style={styles.locationContainer}>
                            <Icon name="event" size={20} color="#FFFFFF" />
                            <Text style={styles.detailText}>
                              {new Date(item.startTime).toLocaleDateString()}{" "}
                              {new Date(item.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>
                          <View style={styles.locationContainer}>
                            <Icon
                              name="location-on"
                              size={20}
                              color="#FFFFFF"
                            />
                            <Text style={styles.detailText}>
                              {item.sessionLocation}
                            </Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Icon name="event-note" size={60} color="#1A5276" />
                      <Text style={styles.emptyText}>No sessions found</Text>
                    </View>
                  }
                  contentContainerStyle={styles.listContentContainer}
                  // Handle potential scrollToIndex errors
                  onScrollToIndexFailed={(info) => {
                    const wait = new Promise((resolve) =>
                      setTimeout(resolve, 500)
                    );
                    wait.then(() => {
                      flatListRef.current?.scrollToIndex({
                        index: info.index,
                        animated: true,
                      });
                    });
                  }}
                />
              ) : (
                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>
                    Please select filters to view sessions.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const CountCard = React.memo(({ title, count, color, loading }) => (
  <View style={[styles.countCard, { backgroundColor: color }]}>
    <Text style={styles.countTitle}>{title}</Text>
    {loading ? (
      <ActivityIndicator size="small" color="#FFFFFF" />
    ) : (
      <Text style={styles.countNumber}>{count}</Text>
    )}
  </View>
));

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 25 : 48,
    paddingBottom: 15,
    backgroundColor: "transparent",
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
  },
  filterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 10,
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  filtersContainer: {
    marginBottom: 10,
  },
  dropdownsWrapper: {
    gap: 8,
    marginBottom: 8,
  },
  dropdown: {
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    height: 45,
  },
  dropdownContainer: {
    height: 45,
  },
  dropDownContainerStyle: {
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  listItemContainer: {
    height: 45,
    justifyContent: "center",
  },
  itemSeparator: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#001F3F",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 10,
    height: 45,
    borderWidth: 1,
    borderColor: "#003366",
  },
  searchIcon: {
    marginRight: 10,
    color: "#FFFFFF",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: "#FFFFFF",
  },
  countsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 15,
  },
  countCard: {
    flex: 1,
    borderRadius: 20,
    padding: 8,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.84,
  },
  countTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    marginBottom: 2,
  },
  countNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Poppins-Bold",
  },
  listWrapper: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  sessionCard: {
    backgroundColor: "#002D5C",
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA000",
  },
  selectedSessionCard: {
    borderLeftColor: "#4CAF50",
    backgroundColor: "#003366",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  expandedDetails: {
    marginTop: 12,
    backgroundColor: "#001F3F",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#E0E0E0",
    flex: 1,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
    opacity: 0.9,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#FFFFFF",
    opacity: 0.9,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#FFFFFF",
    opacity: 0.9,
  },
});
