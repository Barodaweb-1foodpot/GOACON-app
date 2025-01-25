// SessionDetails.js

/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuthContext } from "../context/AuthContext";
import { fetchEventsByPartner, fetchSessionsByEvent, fetchParticipantCounts } from "../api/sessionApi";
import DropDownPicker from "react-native-dropdown-picker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

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

      const formattedEvents = [
        { label: "All Events", value: null },
        ...eventsList.map((event) => ({
          label: event.EventName,
          value: event._id,
        })),
      ];
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchSessions = async (eventId) => {
    setLoadingSessions(true);
    try {
      const response = await fetchSessionsByEvent(eventId);
      if (response.success) {
        const fetchedSessions = response.find;

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
      const counts = await fetchParticipantCounts(sessionId);
      setTotalParticipants(counts.totalParticipants || 0);
      setScannedParticipants(counts.scannedParticipants || 0);
      setNotScannedParticipants(
        (counts.totalParticipants || 0) - (counts.scannedParticipants || 0)
      );

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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A5276" />

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
            <View style={[styles.filtersContainer, { zIndex: dropdownZIndex }]}>
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

                {/* Session Dropdown */}
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
                </View>
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
                />
              ) : (
                // Display participant counts
                <>
                  <CountCard
                    title="Total"
                    count={totalParticipants}
                    color="#1A5276"
                  />
                  <CountCard
                    title="Scanned"
                    count={scannedParticipants}
                    color="#4CAF50"
                  />
                  <CountCard
                    title="Not Scanned"
                    count={notScannedParticipants}
                    color="#FFA000"
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
                    onPress={() => setSessionValue(item._id)}
                    accessible={true}
                    accessibilityLabel={`Select session ${item.sessionName}`}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.sessionName}>{item.sessionName}</Text>
                    </View>
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
                  const wait = new Promise((resolve) => setTimeout(resolve, 500));
                  wait.then(() => {
                    flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                  });
                }}
              />
            ) : (
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  Please select an event to view sessions.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const CountCard = React.memo(({ title, count, color }) => (
  <View style={[styles.countCard, { backgroundColor: color }]}>
    <Text style={styles.countTitle}>{title}</Text>
    <Text style={styles.countNumber}>{count}</Text>
  </View>
));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A5276",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 25 : 48,
    paddingBottom: 5,
    backgroundColor: "#1A5276",
  },
  backButton: {},
  filterButton: {},
  title: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
    borderColor: "#E0E0E0",
    borderRadius: 12,
    borderWidth: 1,
    height: 45,
    backgroundColor: "#FFFFFF",
  },
  dropdownContainer: {
    height: 45,
  },
  dropDownContainerStyle: {
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 12,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    height: 45,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontFamily: "Poppins-Regular",
    fontSize: 15,
    color: "#2C3E50",
  },
  countsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 15,
  },
  countCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
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
    backgroundColor: "#F5F6FA",
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA000",
  },
  selectedSessionCard: {
    borderLeftColor: "#1A5276",
    backgroundColor: "#E8F4FA",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionName: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#2C3E50",
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
    color: "#1A5276",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#2C3E50",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#1A5276",
  },
});
