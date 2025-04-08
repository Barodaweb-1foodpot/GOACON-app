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
  RefreshControl,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuthContext } from "../context/AuthContext";
import { fetchEventsByPartner, fetchParticipants } from "../api/participantApi";
import DropDownPicker from "react-native-dropdown-picker";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { markParticipantEntered } from "../api/eventApi";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function Participants() {
  const { user, userType, selectedEventPartner } = useAuthContext();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Count states for dashboard
  const [totalCount, setTotalCount] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [notScannedCount, setNotScannedCount] = useState(0);

  // Event & Filter states
  const [eventOpen, setEventOpen] = useState(false);
  const [eventValue, setEventValue] = useState(null);

  const [entryOpen, setEntryOpen] = useState(false);
  const [entryValue, setEntryValue] = useState(null);
  const entryTypes = [
    { label: "All", value: "All" },
    { label: "Scanned", value: true },
    { label: "Not Scanned", value: false },
  ];

  // Page size & pagination states
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeOptions = [
    { label: "10 per page", value: 10 },
    { label: "20 per page", value: 20 },
    { label: "50 per page", value: 50 },
    { label: "All", value: "total" },
  ];
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);

  const [filtersVisible, setFiltersVisible] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState(null);

  // Memoize partnerId based on user type
  const partnerId = useMemo(() => {
    return userType === "eventUser" ? selectedEventPartner : user;
  }, [userType, selectedEventPartner, user]);

  useEffect(() => {
    console.log("Participants component mounted – fetching events...");
    fetchEvents();
  }, []);

  // Reset pagination and fetch data when filters (eventValue, entryValue, searchQuery, pageSize) change
  useEffect(() => {
    setCurrentPage(1);
    setNoMoreData(false);

    if (eventValue) {
      fetchCounts();
      fetchParticipantsList(1);
    } else {
      setTotalCount(0);
      setScannedCount(0);
      setNotScannedCount(0);
      setParticipants([]);
      setNoMoreData(false);
    }
  }, [eventValue, entryValue, searchQuery, pageSize]);

  // Fetch events for the given partner and format for the dropdown menu
  const fetchEvents = async () => {
    try {
      const eventsList = await fetchEventsByPartner(partnerId);
      console.log("Fetched events:", eventsList.data);
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
      Alert.alert("Error", "Failed to fetch events.");
    }
  };

  // Fetch the counts for total, scanned, and not scanned participants
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
      if (entryValue !== null && entryValue !== "All") {
        basePayload.isScanned = entryValue;
      }

      console.log("Fetching counts with payload:", basePayload);
      const totalResponse = await fetchParticipants(basePayload);
      setTotalCount(totalResponse.totalCount);
      setScannedCount(totalResponse.scannedCount);
      setNotScannedCount(totalResponse.notScannedCount);
      // console.log("Counts fetched:", totalResponse);
    } catch (error) {
      console.error("Error fetching counts:", error);
      Alert.alert("Error", "Failed to fetch counts.");
    }
  };

  // Fetch participants list using offset-based pagination
  const fetchParticipantsList = async (page = 1) => {
    if (!eventValue || (loading && page === 1) || (isFetchingMore && page > 1))
      return;

    if (page === 1) {
      console.log("Starting participant list fetch for page 1");
      setLoading(true);
      setNoMoreData(false);
      setParticipants([]);
    } else {
      console.log(`Fetching more participants for page ${page}`);
      setIsFetchingMore(true);
    }

    try {
      // Calculate page size
      const currentPageSize =
        pageSize === "total"
          ? totalCount > 0
            ? totalCount
            : 10000
          : Number(pageSize);
      const skipValue = (page - 1) * currentPageSize;
      console.log(
        `Fetching page ${page} with skip=${skipValue} and pageSize=${currentPageSize}`
      );

      const payload = {
        skip: skipValue,
        per_page: currentPageSize,
        match: searchQuery,
        IsActive: true,
        eventPartner: partnerId,
      };

      if (eventValue) {
        payload.exhibitionId = eventValue;
      }
      if (entryValue !== null && entryValue !== "All") {
        payload.isScanned = entryValue;
      }

      const response = await fetchParticipants(payload);
      const fetchedData = response.data || [];
      console.log(
        `Page ${page}: Received ${fetchedData.length} participants out of ${response.totalCount}`
      );

      if (page === 1) {
        setParticipants(fetchedData);
      } else {
        // Append new unique participants
        setParticipants((prev) => {
          // const existingIds = new Set(prev.map((p) => p._id));
          // const newData = fetchedData.filter((p) => !existingIds.has(p._id));
          return [...prev, ...fetchedData];
        });
      }

      // Determine if more data is available
      const noMore =
        fetchedData.length < currentPageSize ||
        skipValue + fetchedData.length >= response.totalCount;
      setNoMoreData(noMore);
    } catch (error) {
      console.error("Error fetching participants:", error);
      Alert.alert("Error", "Failed to fetch participants.");
      setNoMoreData(true);
    } finally {
      page === 1 ? setLoading(false) : setIsFetchingMore(false);
      setRefreshing(false);
    }
  };

  // Load next page if available
  const loadNextPage = useCallback(() => {
    if (
      loading ||
      isFetchingMore ||
      noMoreData ||
      pageSize === "total" ||
      refreshing
    ) {
      console.log("Skipping loadNextPage:", {
        loading,
        isFetchingMore,
        noMoreData,
        pageSize,
      });
      return;
    }

    const nextPage = currentPage + 1;
    console.log(`Loading next page: ${nextPage}`);
    setCurrentPage(nextPage);
    fetchParticipantsList(nextPage);
  }, [loading, isFetchingMore, noMoreData, pageSize, refreshing, currentPage]);

  // Refresh handler for pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (!eventValue || refreshing) {
      console.log("Skipping refresh – no event selected or already refreshing");
      return;
    }
    console.log("Refreshing participant list...");
    setRefreshing(true);
    setCurrentPage(1);
    setNoMoreData(false);

    try {
      await Promise.all([fetchCounts(), fetchParticipantsList(1)]);
      console.log("Refresh completed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      Alert.alert("Error", "Failed to refresh data.");
    } finally {
      setRefreshing(false);
    }
  }, [eventValue, refreshing]);

  // Clear all filter values to reset the view
  const clearFilters = () => {
    console.log("Clearing filters");
    setEventValue(null);
    setEntryValue(null);
    setSearchQuery("");
    setPageSize(10);
  };

  // Dismiss the keyboard when tapping outside the input
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleDropdownOpen = (dropdown) => (open) => {
    if (dropdown === "event") {
      setEventOpen(open);
      if (open) {
        setEntryOpen(false);
        setPageSizeOpen(false);
        setActiveDropdown("event");
      } else if (activeDropdown === "event") {
        setActiveDropdown(null);
      }
    } else if (dropdown === "entry") {
      setEntryOpen(open);
      if (open) {
        setEventOpen(false);
        setPageSizeOpen(false);
        setActiveDropdown("entry");
      } else if (activeDropdown === "entry") {
        setActiveDropdown(null);
      }
    } else if (dropdown === "pageSize") {
      setPageSizeOpen(open);
      if (open) {
        setEventOpen(false);
        setEntryOpen(false);
        setActiveDropdown("pageSize");
      } else if (activeDropdown === "pageSize") {
        setActiveDropdown(null);
      }
    }
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
              console.log(
                `Updating scan status for participant ${participantId}`
              );
              try {
                // Mark participant as entered
                await markParticipantEntered(participantId, eventValue);
                // Update UI immediately for better responsiveness
                setParticipants((prev) =>
                  prev.map((p) =>
                    p._id === participantId
                      ? {
                          ...p,
                          isScanned: true,
                          scannedAt: new Date(),
                          registrationScan: true,
                        }
                      : p
                  )
                );
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
    [eventValue, fetchCounts]
  );

  // Format date strings for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Memoized render function for participant card
  const renderItem = useCallback(
    ({ item }) => (
      <ParticipantCard
        participant={item}
        onPress={() => handleScanStatusUpdate(item._id, item.registrationScan)}
        navigation={navigation}
      />
    ),
    [handleScanStatusUpdate, navigation]
  );

  // Unique key extractor for FlatList
  const keyExtractor = useCallback(
    (item, index) => (item?._id ? String(item._id) : `participant-${index}`),
    []
  );

  // Render footer to support pagination
  const renderListFooter = useCallback(() => {
    if (loading && currentPage === 1) return null;
    if (pageSize === "total") return null; // No pagination if "All" is selected

    if (isFetchingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color="#1A5276" />
        </View>
      );
    }

    // "View More" button if additional data might exist
    if (!noMoreData && participants.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={loadNextPage}
            disabled={isFetchingMore}
          >
            <Text style={styles.nextButtonText}>View More</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Inform the user when no more data is available
    if (noMoreData && participants.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>No more participants to load</Text>
        </View>
      );
    }

    return null;
  }, [
    loading,
    currentPage,
    pageSize,
    isFetchingMore,
    noMoreData,
    participants,
    loadNextPage,
  ]);

  // Render component for an empty list scenario
  const renderEmptyComponent = () => {
    // Loader for the initial data fetch
    if (loading && currentPage === 1 && !refreshing) {
      return (
        <View style={[styles.emptyContainer, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#1A5276" />
          <Text style={styles.loadingText}>Loading participants...</Text>
        </View>
      );
    }

    // Prompt to select filters if no event is selected
    if (!eventValue) {
      return (
        <View style={styles.initialPromptContainer}>
          <Icon name="event-note" size={60} color="#1A5276" />
          <Text style={styles.initialPromptText}>
            Please select filters to view participants
          </Text>
        </View>
      );
    }

    // Display message when no participants match the filters
    if (!loading && participants.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="people-outline" size={60} color="#1A5276" />
          <Text style={styles.emptyText}>No participants found</Text>
        </View>
      );
    }

    return null;
  };

  const selectedEventLabel =
    events.find((event) => event.value === eventValue)?.label || "Participants";

  return (
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
        {/* Header with back and filter buttons */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              console.log("Navigating back from Participants screen");
              navigation.goBack();
            }}
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
            onPress={() => {
              console.log("Toggling filters visibility");
              setFiltersVisible(!filtersVisible);
            }}
            accessible={true}
            accessibilityLabel="Toggle filters"
          >
            <Icon name="tune" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content Container */}
        <View style={styles.content}>
          <View style={styles.fixedContent}>
            {filtersVisible ? (
              <>
                <View style={styles.filtersContainer}>
                  <View style={styles.dropdownsWrapper}>
                    {/* Event selection dropdown */}
                    <DropDownPicker
                      open={eventOpen}
                      value={eventValue}
                      items={events}
                      setOpen={handleDropdownOpen("event")}
                      setValue={setEventValue}
                      setItems={setEvents}
                      placeholder="Select Event"
                      style={styles.dropdown}
                      containerStyle={styles.dropdownContainer}
                      listItemContainerStyle={styles.listItemContainer}
                      dropDownContainerStyle={[
                        styles.dropDownContainerStyle,
                        { zIndex: eventOpen ? 9999 : 1 },
                      ]}
                      itemSeparator
                      itemSeparatorStyle={styles.itemSeparator}
                      zIndex={eventOpen ? 9999 : 1}
                      listMode="SCROLLVIEW"
                      scrollViewProps={{
                        nestedScrollEnabled: true,
                      }}
                      maxHeight={SCREEN_HEIGHT * 0.3}
                      ArrowDownIconComponent={() => (
                        <Icon
                          name="keyboard-arrow-down"
                          size={24}
                          color="#666"
                        />
                      )}
                      ArrowUpIconComponent={() => (
                        <Icon name="keyboard-arrow-up" size={24} color="#666" />
                      )}
                      accessible={true}
                      accessibilityLabel="Select Event"
                    />

                    <View style={{ marginTop: 10 }}>
                      {/* Entry type dropdown */}
                      <DropDownPicker
                        open={entryOpen}
                        value={entryValue}
                        items={entryTypes}
                        setOpen={handleDropdownOpen("entry")}
                        setValue={setEntryValue}
                        placeholder="Select Entry Type"
                        style={styles.dropdown}
                        containerStyle={styles.dropdownContainer}
                        listItemContainerStyle={styles.listItemContainer}
                        dropDownContainerStyle={[
                          styles.dropDownContainerStyle,
                          { zIndex: entryOpen ? 9999 : 1 },
                        ]}
                        itemSeparator
                        itemSeparatorStyle={styles.itemSeparator}
                        zIndex={entryOpen ? 9999 : 1}
                        listMode="SCROLLVIEW"
                        maxHeight={SCREEN_HEIGHT * 0.3}
                        scrollViewProps={{
                          nestedScrollEnabled: true,
                        }}
                        ArrowDownIconComponent={() => (
                          <Icon
                            name="keyboard-arrow-down"
                            size={24}
                            color="#666"
                          />
                        )}
                        ArrowUpIconComponent={() => (
                          <Icon
                            name="keyboard-arrow-up"
                            size={24}
                            color="#666"
                          />
                        )}
                        accessible={true}
                        accessibilityLabel="Select Entry Type"
                      />
                    </View>

                    <View style={{ marginTop: 10 }}>
                      {/* Page size dropdown */}
                      <DropDownPicker
                        open={pageSizeOpen}
                        value={pageSize}
                        items={pageSizeOptions}
                        setOpen={handleDropdownOpen("pageSize")}
                        setValue={setPageSize}
                        placeholder="Select Page Size"
                        style={styles.dropdown}
                        containerStyle={styles.dropdownContainer}
                        listItemContainerStyle={styles.listItemContainer}
                        dropDownContainerStyle={[
                          styles.dropDownContainerStyle,
                          { zIndex: pageSizeOpen ? 9999 : 1 },
                        ]}
                        listMode="SCROLLVIEW"
                        maxHeight={SCREEN_HEIGHT * 0.25}
                        scrollViewProps={{
                          nestedScrollEnabled: true,
                          persistentScrollbar: true,
                        }}
                        itemSeparator
                        itemSeparatorStyle={styles.itemSeparator}
                        zIndex={pageSizeOpen ? 9999 : 1}
                        accessible={true}
                        accessibilityLabel="Select Page Size"
                        ArrowDownIconComponent={() => (
                          <Icon
                            name="keyboard-arrow-down"
                            size={24}
                            color="#666"
                          />
                        )}
                        ArrowUpIconComponent={() => (
                          <Icon
                            name="keyboard-arrow-up"
                            size={24}
                            color="#666"
                          />
                        )}
                      />
                    </View>
                  </View>

                  {/* Display counts for Total, Scanned, and Not Scanned */}
                  <View style={styles.countsContainer}>
                    <CountCard
                      title="Total"
                      count={totalCount}
                      color="#1A5276"
                    />
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

                {/* Clear filters button */}
                <View style={styles.clearFiltersContainer}>
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={clearFilters}
                  >
                    <Icon name="clear-all" size={20} color="#1A5276" />
                    <Text style={styles.clearFiltersText}>Clear Filters</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // When filters are hidden, show the search bar
              <TouchableWithoutFeedback onPress={dismissKeyboard}>
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
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      style={styles.clearButton}
                    >
                      <Icon name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableWithoutFeedback>
            )}
          </View>

          {/* Participants List with pull-to-refresh and pagination */}
          <FlatList
            style={styles.listWrapper}
            contentContainerStyle={styles.listContentContainer}
            data={participants}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListFooterComponent={renderListFooter}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#1A5276"]}
                tintColor="#1A5276"
              />
            }
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const ParticipantCard = React.memo(({ participant, onPress, navigation }) => {
  // Format date for display on scanned participants
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }, []);

  const isScanned = Boolean(participant.registrationScan);

  return (
    <TouchableOpacity
      style={[styles.card, isScanned && styles.scannedCard]}
      onPress={onPress}
      disabled={isScanned}
      accessible={true}
      accessibilityLabel={`Scan participant ${participant.firstName}`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.nameText}>
          {participant?.firstName || ""} {participant?.lastName || ""}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isScanned ? "#4CAF50" : "#FFA000" },
          ]}
        >
          <Icon
            name={isScanned ? "check-circle" : "pending"}
            size={16}
            color="#FFFFFF"
          />
          <Text style={styles.statusText}>
            {isScanned ? "Scanned" : "Not Scanned"}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Icon
            name="badge"
            size={20}
            color={isScanned ? "#4CAF50" : "#2C3E50"}
          />
          <Text style={[styles.infoText, isScanned && styles.scannedText]}>
            {participant.companyName || "N/A"}
          </Text>
        </View>

        {isScanned && participant.scannedAt && (
          <View style={styles.infoRow}>
            <Icon name="schedule" size={20} color="#4CAF50" />
            <Text style={[styles.infoText, styles.scannedText]}>
              {formatDate(participant.scannedAt)}
            </Text>
          </View>
        )}

        {isScanned && (
          <TouchableOpacity
            style={styles.scannedOverlay}
            onPress={() =>
              navigation.navigate("EventSession", { participant: participant })
            }
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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
  },
  filtersContainer: {
    marginBottom: 10,
  },
  dropdownsWrapper: {
    gap: 8,
    marginBottom: 12,
  },
  dropdown: {
    borderColor: "#E0E0E0",
    borderRadius: 12,
    borderWidth: 1,
    height: 45,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
  },
  dropdownContainer: {
    height: 45,
    marginBottom: 10,
  },
  dropDownContainerStyle: {
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 12,
    position: "absolute",
    width: "100%",
    elevation: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  clearButton: {
    padding: 5,
  },
  countsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
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
  },
  listContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    padding: 20,
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#1A5276",
    textAlign: "center",
  },
  initialPromptContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 200,
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
    minHeight: 40,
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
