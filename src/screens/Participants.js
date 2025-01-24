/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
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
    { label: "100 per page", value: 100 },
    { label: "All", value: "total" },
  ];

  const [loadingMore, setLoadingMore] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);

  const entryTypes = [
    { label: "All", value: null },
    { label: "Scanned", value: true },
    { label: "Not Scanned", value: false },
  ];

  const CountCard = React.memo(({ title, count, color }) => (
    <View style={[styles.countCard, { backgroundColor: color }]}>
      <Text style={styles.countTitle}>{title}</Text>
      <Text style={styles.countNumber}>{count}</Text>
    </View>
  ));

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchCounts();
    fetchParticipantsList();
  }, [eventValue, entryValue, searchQuery, pageSize]);

  const fetchEvents = async () => {
    try {
      const partnerId = userType === "eventUser" ? selectedEventPartner : user;
      const eventsList = await fetchEventsByPartner(partnerId);

      const formattedEvents = [
        { label: "All", value: null },
        ...eventsList.map((event) => ({
          label: event.EventName,
          value: event._id,
        })),
      ];
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchCounts = async () => {
    try {
      const partnerId = userType === "eventUser" ? selectedEventPartner : user;
      const basePayload = {
        skip: 0,
        per_page: 1,
        match: searchQuery,
        IsActive: true,
        eventPartner: partnerId,
      };
      if (eventValue) {
        basePayload.EventName = eventValue;
      }

      // Total
      const totalResponse = await fetchParticipants(basePayload);
      setTotalCount(totalResponse.count);

      const scannedResponse = await fetchParticipants({
        ...basePayload,
        isScanned: true,
      });
      setScannedCount(scannedResponse.count);

      const notScannedResponse = await fetchParticipants({
        ...basePayload,
        isScanned: false,
      });
      setNotScannedCount(notScannedResponse.count);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const fetchParticipantsList = async () => {
    setLoading(true);
    setNoMoreData(false);
    try {
      const partnerId = userType === "eventUser" ? selectedEventPartner : user;
      const currentPageSize = pageSize === "total" ? "total" : pageSize;

      const payload = {
        skip: 0,
        per_page: currentPageSize,
        match: searchQuery,
        IsActive: true,
        eventPartner: partnerId,
      };

      if (eventValue) {
        payload.EventName = eventValue;
      }
      if (entryValue !== null) {
        payload.isScanned = entryValue;
      }

      const { data } = await fetchParticipants(payload);
      setParticipants(data);

      if (pageSize !== "total" && data.length < pageSize) {
        setNoMoreData(true);
      }

      if (pageSize === "total" && data.length < 10000) {
        setNoMoreData(true);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreParticipants = async () => {
    if (loadingMore || noMoreData || pageSize !== "total") return;

    if (participants.length >= totalCount) {
      setNoMoreData(true);
      return;
    }

    setLoadingMore(true);
    try {
      const partnerId = userType === "eventUser" ? selectedEventPartner : user;

      const payload = {
        skip: participants.length,
        per_page: 50,
        match: searchQuery,
        IsActive: true,
        eventPartner: partnerId,
      };
      if (eventValue) {
        payload.EventName = eventValue;
      }
      if (entryValue !== null) {
        payload.isScanned = entryValue;
      }

      const { data } = await fetchParticipants(payload);

      setParticipants((prev) => [...prev, ...data]);
      if (data.length < 50) {
        setNoMoreData(true);
      }
    } catch (error) {
      console.error("Error loading more participants:", error);
    } finally {
      setLoadingMore(false);
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
              try {
                const resp = await updateParticipantScanStatus(
                  participantId,
                  true
                );

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

                fetchCounts();
              } catch (error) {
                console.error("Error updating scan status:", error);
                Alert.alert("Error", "Failed to update scan status");
              }
            },
          },
        ]
      );
    },
    []
  );

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchParticipantsList(), fetchCounts()]);
    setRefreshing(false);
  };

  const clearFilters = () => {
    setEventValue(null);
    setEntryValue(null);
    setSearchQuery("");
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
      <TouchableOpacity
        style={[styles.card, item.isScanned && styles.scannedCard]}
        onPress={() => handleScanStatusUpdate(item._id, item.isScanned)}
        disabled={item.isScanned}
        accessible={true}
        accessibilityLabel={`Scan participant ${item.name}`}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.nameText}>{item?.name || "N/A"}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.isScanned ? "#4CAF50" : "#FFA000" },
            ]}
          >
            <Icon
              name={item.isScanned ? "check-circle" : "pending"}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>
              {item.isScanned ? "Scanned" : "Not Scanned"}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Icon
              name="badge"
              size={20}
              color={item.isScanned ? "#4CAF50" : "#2C3E50"}
            />
            <Text
              style={[styles.infoText, item.isScanned && styles.scannedText]}
            >
              {item.designation || "N/A"}
            </Text>
          </View>

          {item.isScanned && item.scannedAt && (
            <View style={styles.infoRow}>
              <Icon name="schedule" size={20} color="#4CAF50" />
              <Text style={[styles.infoText, styles.scannedText]}>
                {formatDate(item.scannedAt)}
              </Text>
            </View>
          )}

          {item.isScanned && (
            <TouchableOpacity
              style={styles.scannedOverlay}
              onPress={() =>
                navigation.navigate("EventSession", { participant: item })
              }
              accessible={true}
              accessibilityLabel={`View event sessions for ${item.name}`}
            >
              <Text style={styles.scannedMessage}>View Event Sessions</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    ),
    [handleScanStatusUpdate, navigation]
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1A5276" />
      </View>
    );
  };

  const selectedEventLabel =
    events.find((event) => event.value === eventValue)?.label || "";

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A5276" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-back-ios" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Participants</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFiltersVisible(!filtersVisible)}
            accessible={true}
            accessibilityLabel="Toggle filters"
          >
            <Icon name="tune" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {eventValue && (
          <View style={styles.selectedEventContainer}>
            <Text style={styles.selectedEventText}>{selectedEventLabel}</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.fixedContent}>
            {filtersVisible && (
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
                    title="Not Scanned"
                    count={notScannedCount}
                    color="#FFA000"
                  />
                </View>
              </View>
            )}

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
          </View>

          <View style={styles.listWrapper}>
            {loading ? (
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
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={true}
                refreshing={refreshing}
                onRefresh={onRefresh}
                keyboardShouldPersistTaps="handled"
                // Infinite scroll only if "All" is selected
                onEndReached={
                  pageSize === "total" ? loadMoreParticipants : null
                }
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                // Performance + Smooth Scrolling
                initialNumToRender={8}
                maxToRenderPerBatch={5}
                windowSize={11}
                removeClippedSubviews={true}
                decelerationRate="fast"
                scrollEventThrottle={1}
              />
            )}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

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
  selectedEventContainer: {
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: "#2980B9",
    borderRadius: 20,
  },
  selectedEventText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
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
    fontFamily: "Poppins-SemiBold",
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
    fontFamily: "Poppins-Medium",
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
});
