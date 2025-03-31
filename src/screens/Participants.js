/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuthContext } from "../context/AuthContext";
import {
  fetchEventsByPartner,
  fetchParticipants,
  updateParticipantScanStatus,
} from "../api/participantApi";
import DropDownPicker from "react-native-dropdown-picker";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient"; // Import LinearGradient
import { markParticipantEntered } from "../api/eventApi";

export default function Participants() {
  const { user, userType, selectedEventPartner } = useAuthContext();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [totalCount, setTotalCount] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [notScannedCount, setNotScannedCount] = useState(0);

  const [eventOpen, setEventOpen] = useState(false);
  const [eventValue, setEventValue] = useState(null);

  const [entryOpen, setEntryOpen] = useState(false);
  const [entryValue, setEntryValue] = useState(null);

  const [dropdownZIndex, setDropdownZIndex] = useState(0);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const [pageSize, setPageSize] = useState(20);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeOptions = [
    { label: "20 per page", value: 20 },
    { label: "50 per page", value: 50 },
    { label: "All", value: "total" },
  ];

  const [noMoreData, setNoMoreData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Added currentPage state

  const entryTypes = [
    { label: "All", value: "All" },
    { label: "Scanned", value: true },
    { label: "Not Scanned", value: false },
  ];

  // Memoize partnerId to avoid recalculating on every render
  const partnerId = useMemo(() => {
    return userType === "eventUser" ? selectedEventPartner : user;
  }, [userType, selectedEventPartner, user]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // Reset to first page when filters or search query change
    setCurrentPage(1);
    if (eventValue) {
      fetchCounts();
      fetchParticipantsList(1, true); // Fetch first page and reset participants
    } else {
      // If no event is selected, clear counts and participants
      setTotalCount(0);
      setScannedCount(0);
      setNotScannedCount(0);
      setParticipants([]);
    }
  }, [eventValue, entryValue, searchQuery, pageSize]);

  const fetchEvents = async () => {
    try {
      const eventsList = await fetchEventsByPartner(partnerId);
      console.log("eventsList",eventsList)
      const formattedEvents = [
        { label: "All Events", value: null },
        ...eventsList.data.map((event) => ({
          label: event.exhibitionEventName,
          value: event._id,
        })),
      ];
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      Alert.alert("Error", "Failed to fetch events.");
    }
  };

  const fetchCounts = async () => {
    try {
      const basePayload = {
        skip: 0,
        per_page: 1,
        match: searchQuery,
        IsActive: true,
        eventPartner: partnerId,
      };
      if (eventValue) {
        basePayload.exhibitionId = eventValue;
      }

      // Total
      const totalResponse = await fetchParticipants(basePayload);
      console.log("mmmmmmmmmmmmmmm",totalResponse)
      setTotalCount(totalResponse.totalCount);
      setNotScannedCount(totalResponse.notScannedCount)
      setScannedCount(totalResponse.scannedCount)

      
    } catch (error) {
      console.error("Error fetching counts:", error);
      Alert.alert("Error", "Failed to fetch counts.");
    }
  };

  const fetchParticipantsList = async (page = 1, reset = false) => {
    if (!eventValue) return; // Do not fetch if no event is selected

    setLoading(true);
    try {
      const currentPageSize = pageSize === "total" ? 10000 : pageSize; // Assuming 10000 as a large number for "All"

      const payload = {
        skip: (page - 1) * (currentPageSize === "total" ? 10000 : currentPageSize),
        per_page: currentPageSize === "total" ? 10000 : currentPageSize,
        match: searchQuery,
        IsActive: true,
        eventPartner: partnerId,
      };
      if (eventValue) {
        payload.exhibitionId = eventValue;
      }
      if (entryValue !== null) {
        payload.isScanned = entryValue;
      }

      const response = await fetchParticipants(payload);

      if (reset) {
        setParticipants(response.data);
      } else {
        setParticipants((prev) => [...prev, ...response.data]);
      }

      // Determine if there's more data to load
      if (pageSize !== "total" && (page * pageSize) >= totalCount) {
        setNoMoreData(true);
      } else if (pageSize === "total" && response.data.length < 10000) {
        setNoMoreData(true);
      } else {
        setNoMoreData(false);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
      Alert.alert("Error", "Failed to fetch participants.");
    } finally {
      setLoading(false);
    }
  };

  const loadNextPage = async () => {
    if (noMoreData || pageSize === "total") return;

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchParticipantsList(nextPage);
  };

  const handleScanStatusUpdate = useCallback(
    async (participantId, currentStatus) => {
      if (currentStatus) {
        Alert.alert(
          "Already Scanned",
          "This participant has already been scanned and cannot be modified.",
          [{ text: "OK" }]
        );
        return;
      }

      Alert.alert(
        "Scan Participant",
        "Are you sure you want to scan in this participant?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Scan",
            onPress: async () => {
              try {
                const resp = await markParticipantEntered(
                  participantId,
                  eventValue
                );
                if(resp.isOk) fetchParticipantsList()

                setParticipants((prev) =>
                  prev.map((p) =>
                    p._id === participantId
                      ? {
                          ...p,
                          isScanned: true,
                          scannedAt:
                            resp?.updatedEvent?.scannedAt || new Date(),
                        }
                      : p
                  )
                );

                // Fetch counts after updating
                fetchCounts();
              } catch (error) {
                console.error("Error updating scan status:", error);
                Alert.alert("Error", "Failed to update scan status.");
              }
            },
          },
        ]
      );
    },
    [fetchCounts]
  );

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const onRefresh = async () => {
    if (!eventValue) return;
    setRefreshing(true);
    setCurrentPage(1);
    await Promise.all([fetchParticipantsList(1, true), fetchCounts()]);
    setRefreshing(false);
  };

  const clearFilters = () => {
    setEventValue(null);
    setEntryValue(null);
    setSearchQuery("");
    setPageSize(20);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleEventOpen = (open) => {
    setEventOpen(open);
    setEntryOpen(false);
    setPageSizeOpen(false);
    setDropdownZIndex(open ? 3000 : 0);
  };
  const handleEntryOpen = (open) => {
    setEntryOpen(open);
    setEventOpen(false);
    setPageSizeOpen(false);
    setDropdownZIndex(open ? 3000 : 0);
  };
  const handlePageSizeOpen = (open) => {
    setPageSizeOpen(open);
    setEventOpen(false);
    setEntryOpen(false);
    setDropdownZIndex(open ? 3000 : 0);
  };

  const renderItem = useCallback(
    ({ item }) => (
      <ParticipantCard
        participant={item}
        onPress={() => handleScanStatusUpdate(item._id, item.isScanned)}
        navigation={navigation}
      />
    ),
    [handleScanStatusUpdate, navigation]
  );

  const renderFooter = () => {
    if (pageSize === "total") return null;

    if (noMoreData) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>No more participants to load</Text>
        </View>
      );
    }

    return (
      <View style={styles.footerContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="#1A5276" />
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={loadNextPage}
            disabled={loading || noMoreData}
            accessible={true}
            accessibilityLabel="Load next set of participants"
          >
            <Text style={styles.nextButtonText}>View more</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const selectedEventLabel =
    events.find((event) => event.value === eventValue)?.label || "Participants";

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      {/* Replace the main container View with LinearGradient */}
      <LinearGradient
        colors={["#000B19", "#001F3F", "#003366"]} // Same gradient as Homepage
        style={styles.gradientContainer}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <View style={styles.container}>
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
              {eventValue ? selectedEventLabel : "Participants"}
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

          {/* Removed the selected event display below the header */}

          <View style={styles.content}>
            <View style={styles.fixedContent}>
              {filtersVisible ? (
                <>
                  <View
                    style={[styles.filtersContainer, { zIndex: dropdownZIndex }]}
                  >
                    <View style={styles.dropdownsWrapper}>
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

                      <View style={{ marginTop: 10 }}>
                        <DropDownPicker
                          open={entryOpen}
                          value={entryValue}
                          items={entryTypes}
                          setOpen={handleEntryOpen}
                          setValue={setEntryValue}
                          placeholder="Select Entry Type"
                          style={styles.dropdown}
                          containerStyle={styles.dropdownContainer}
                          listItemContainerStyle={styles.listItemContainer}
                          dropDownContainerStyle={styles.dropDownContainerStyle}
                          itemSeparator={true}
                          itemSeparatorStyle={styles.itemSeparator}
                          zIndex={2000}
                          listMode="SCROLLVIEW"
                          accessible={true}
                          accessibilityLabel="Select Entry Type"
                        />
                      </View>

                      <View style={{ marginTop: 10 }}>
                        <DropDownPicker
                          open={pageSizeOpen}
                          value={pageSize}
                          items={pageSizeOptions}
                          setOpen={handlePageSizeOpen}
                          setValue={setPageSize}
                          placeholder="Select Page Size"
                          style={styles.dropdown}
                          containerStyle={styles.dropdownContainer}
                          listItemContainerStyle={styles.listItemContainer}
                          dropDownContainerStyle={styles.dropDownContainerStyle}
                          itemSeparator={true}
                          itemSeparatorStyle={styles.itemSeparator}
                          zIndex={1000}
                          listMode="SCROLLVIEW"
                          accessible={true}
                          accessibilityLabel="Select Page Size"
                        />
                      </View>
                    </View>

                    <View style={styles.countsContainer}>
                      <CountCard title="Total" count={totalCount} color="#1A5276" />
                      <CountCard
                        title="Scanned"
                        count={scannedCount}
                        color="#4CAF50"
                      />
                      <CountCard
                        title="Not Scan"
                        count={notScannedCount}
                        color="#FFA000"
                      />
                    </View>
                  </View>

                  <View style={styles.clearFiltersContainer}>
                    <TouchableOpacity
                      style={styles.clearFiltersButton}
                      onPress={clearFilters}
                      accessible={true}
                      accessibilityLabel="Clear all filters"
                    >
                      <Icon name="clear-all" size={20} color="#1A5276" />
                      <Text style={styles.clearFiltersText}>Clear Filters</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.searchContainer}>
                  <Icon
                    name="search"
                    size={24}
                    color="#666"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search participants..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    placeholderTextColor="#999"
                    accessible={true}
                    accessibilityLabel="Search participants"
                  />
                </View>
              )}
            </View>

            <View style={styles.listWrapper}>
              {!eventValue ? (
                // Display prompt to select an event
                <View style={styles.initialPromptContainer}>
                  <Icon name="event-note" size={60} color="#1A5276" />
                  <Text style={styles.initialPromptText}>
                    Please select an filters to view participants
                  </Text>
                </View>
              ) : loading && currentPage === 1 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1A5276" />
                  <Text style={styles.loadingText}>Loading participants...</Text>
                </View>
              ) : participants.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="people-outline" size={60} color="#1A5276" />
                  <Text style={styles.emptyText}>No participants found</Text>
                </View>
              ) : (
                <FlatList
                  data={participants}
                  renderItem={renderItem}
                  keyExtractor={(item) => item._id}
                  showsVerticalScrollIndicator={true}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  keyboardShouldPersistTaps="always"
                  nestedScrollEnabled={true} // Enable nested scrolling
                  scrollEnabled={true} // Explicitly enable scrolling
                  contentContainerStyle={[
                    styles.listContainer,
                    { flexGrow: 1 }, // Ensure content grows to fill available space
                  ]}
                  ListFooterComponent={renderFooter}
                  // Performance + Smooth Scrolling
                  initialNumToRender={8}
                  maxToRenderPerBatch={10}
                  windowSize={21}
                  removeClippedSubviews={true}
                  decelerationRate="fast"
                  scrollEventThrottle={16}
                />
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

// Memoized ParticipantCard Component
const ParticipantCard = React.memo(({ participant, onPress, navigation }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <TouchableOpacity
    style={[
      styles.card,
      participant.registrationScan  && participant.registrationScan !== null && styles.scannedCard,
    ]}
    onPress={onPress}
    disabled={participant.registrationScan  && participant.registrationScan !== null}
    accessible={true}
    accessibilityLabel={`Scan participant ${participant.name}`}
  >
    <View style={styles.cardHeader}>
      <Text style={styles.nameText}>
        {participant?.firstName || " "}
        {participant?.lastName || " "}
      </Text>
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor:
              participant.registrationScan  && participant.registrationScan !== null ? "#4CAF50" : "#FFA000",
          },
        ]}
      >
        <Icon
          name={
            participant.registrationScan  && participant.registrationScan !== null
              ? "check-circle"
              : "pending"
          }
          size={16}
          color="#FFFFFF"
        />
        <Text style={styles.statusText}>
          {participant.registrationScan  && participant.registrationScan !== null ? "Scanned" : "Not Scanned"}
        </Text>
      </View>
    </View>
  
    <View style={styles.cardContent}>
      <View style={styles.infoRow}>
        <Icon
          name="badge"
          size={20}
          color={
            participant.registrationScan  && participant.registrationScan !== null ? "#4CAF50" : "#2C3E50"
          }
        />
        <Text
          style={[
            styles.infoText,
            participant.registrationScan  && participant.registrationScan !== null && styles.scannedText,
          ]}
        >
          {participant.companyName || "N/A"}
        </Text>
      </View>
  
      {participant.registrationScan && participant.scannedAt && (
        <View style={styles.infoRow}>
          <Icon name="schedule" size={20} color="#4CAF50" />
          <Text style={[styles.infoText, styles.scannedText]}>
            {formatDate(participant.scannedAt)}
          </Text>
        </View>
      )}
  
      {participant.registrationScan && (
        <TouchableOpacity
          style={styles.scannedOverlay}
          onPress={() =>
            navigation.navigate("EventSession", { participant: participant })
          }
          accessible={true}
          accessibilityLabel={`View event sessions for ${participant.name}`}
        >
          <Text style={styles.scannedMessage}>View Event Sessions</Text>
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
  
  );
});

const CountCard = React.memo(({ title, count, color }) => (
  <View style={[styles.countCard, { backgroundColor: color }]}>
    <Text style={styles.countTitle}>{title}</Text>
    <Text style={styles.countNumber}>{count}</Text>
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
    paddingBottom: 5,
    backgroundColor: "transparent", 
  },
  backButton: {
    marginRight: 8,
  },
  filterButton: {},
  title: {
    fontSize: 24,
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
  },
  fixedContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: "#F5F6FA",
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
    marginTop: 10,
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
  clearFiltersContainer: {
    alignItems: "flex-end",
    marginTop: 5,
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearFiltersText: {
    marginLeft: 5,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#1A5276",
  },
  listWrapper: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  listContainer: {
    paddingBottom: 15,
  },
  card: {
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
  scannedCard: {
    borderLeftColor: "#4CAF50",
    backgroundColor: "#F8FFF8",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nameText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#2C3E50",
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Poppins-Regular",
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#2C3E50",
    flex: 1,
  },
  scannedText: {
    color: "#4CAF50",
  },
  scannedOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 6,
  },
  scannedMessage: {
    color: "#4CAF50",
    fontSize: 15,
    fontFamily: "Poppins-Medium",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#1A5276",
  },
  footerLoader: {
    paddingVertical: 20,
  },
  initialPromptContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  initialPromptText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#1A5276",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  nextButton: {
    backgroundColor: "#1A5276",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
  },
});
