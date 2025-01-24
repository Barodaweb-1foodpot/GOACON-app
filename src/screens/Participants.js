/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Dimensions,
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
import { useNavigation } from '@react-navigation/native';

export default function Participants() {
  const { user, userType, selectedEventPartner } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [notScannedCount, setNotScannedCount] = useState(0);
  const navigation = useNavigation();
  const [eventOpen, setEventOpen] = useState(false);
  const [eventValue, setEventValue] = useState(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryValue, setEntryValue] = useState(null);
  const [dropdownZIndex, setDropdownZIndex] = useState(0);

  const entryTypes = [
    { label: "Scanned", value: true },
    { label: "Not Scanned", value: false },
  ];

  useEffect(() => {
    fetchEvents();
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchParticipantsList();
    fetchCounts();
  }, [eventValue, entryValue, searchQuery]);

  const fetchEvents = async () => {
    try {
      const partnerId = userType === "eventUser" ? selectedEventPartner : user;
      const eventsList = await fetchEventsByPartner(partnerId);
      const formattedEvents = eventsList.map((event) => ({
        label: event.EventName,
        value: event._id,
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchCounts = async () => {
    try {
      const partnerId = userType === "eventUser" ? selectedEventPartner : user;
      const totalPayload = {
        skip: 0,
        per_page: 1,
        match: searchQuery,
        IsActive: true,
        eventPartner: partnerId,
        EventName: eventValue,
      };
      const totalResponse = await fetchParticipants(totalPayload);
      setTotalCount(totalResponse.count);

      const scannedPayload = { ...totalPayload, isScanned: true };
      const scannedResponse = await fetchParticipants(scannedPayload);
      setScannedCount(scannedResponse.count);

      const notScannedPayload = { ...totalPayload, isScanned: false };
      const notScannedResponse = await fetchParticipants(notScannedPayload);
      setNotScannedCount(notScannedResponse.count);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const fetchParticipantsList = async () => {
    setLoading(true);
    try {
      const partnerId = userType === "eventUser" ? selectedEventPartner : user;
      const payload = {
        skip: 0,
        per_page: 50,
        match: searchQuery,
        IsActive: true,
        eventPartner: partnerId,
        EventName: eventValue,
        isScanned: entryValue,
      };
      const { data } = await fetchParticipants(payload);
      setParticipants(data);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanStatusUpdate = async (participantId, currentStatus) => {
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
              await updateParticipantScanStatus(participantId, true);
              setParticipants((prevParticipants) =>
                prevParticipants.map((participant) =>
                  participant._id === participantId
                    ? { ...participant, isScanned: true }
                    : participant
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
  };

  const formatDate = (dateString) => {
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
    setDropdownZIndex(open ? 3000 : 0);
  };

  const handleEntryOpen = (open) => {
    setEntryOpen(open);
    setEventOpen(false);
    setDropdownZIndex(open ? 3000 : 0);
  };

  const CountCard = ({ title, count, color }) => (
    <View style={[styles.countCard, { backgroundColor: color }]}>
      <Text style={styles.countTitle}>{title}</Text>
      <Text style={styles.countNumber}>{count}</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, item.isScanned && styles.scannedCard]}
      onPress={() => handleScanStatusUpdate(item._id, item.isScanned)}
      disabled={item.isScanned}
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
            name="event"
            size={20}
            color={item.isScanned ? "#4CAF50" : "#2C3E50"}
          />
          <Text style={[styles.infoText, item.isScanned && styles.scannedText]}>
            {item.eventDetails?.EventName || "N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon
            name="local-activity"
            size={20}
            color={item.isScanned ? "#4CAF50" : "#2C3E50"}
          />
          <Text style={[styles.infoText, item.isScanned && styles.scannedText]}>
            {item.TicketTypeDetails?.TicketType || "N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon
            name="schedule"
            size={20}
            color={item.isScanned ? "#4CAF50" : "#2C3E50"}
          />
          <Text style={[styles.infoText, item.isScanned && styles.scannedText]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {item.isScanned && (
          <TouchableOpacity
            style={styles.scannedOverlay}
            onPress={() =>
              navigation.navigate("EventSession", { participant: item })
            }
          >
            <Text style={styles.scannedMessage}>View Event Sessions</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5276" />
      <View style={styles.header}>
                <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()} 
        >
          <Icon name="arrow-back-ios" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Participants</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.fixedContent}>
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
          </View>

          <View style={[styles.filtersContainer, { zIndex: dropdownZIndex }]}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Icon name="clear-all" size={20} color="#1A5276" />
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>

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
            </View>

            <View style={styles.countsContainer}>
              <CountCard title="Total" count={totalCount} color="#1A5276" />
              <CountCard title="Scanned" count={scannedCount} color="#4CAF50" />
              <CountCard
                title="Not Scanned"
                count={notScannedCount}
                color="#FFA000"
              />
            </View>
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
            />
          )}
        </View>
      </View>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 5,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
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
  filtersContainer: {
    marginBottom: 5,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#2C3E50",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#1A5276",
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
  },
  dropdownContainer: {
    height: 45,
  },
  dropDownContainerStyle: {
    borderColor: "#E0E0E0",
    backgroundColor: "white",
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
  countsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
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
  },
  listContainer: {
    padding: 15,
    paddingTop: 10,
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
});
