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
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuthContext } from "../context/AuthContext";
import { fetchEventsByPartner, fetchParticipants, updateParticipantScanStatus } from "../api/participantApi";
import DropDownPicker from 'react-native-dropdown-picker';

export default function Participants() {
  const { user, userType, selectedEventPartner } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  const [eventOpen, setEventOpen] = useState(false);
  const [eventValue, setEventValue] = useState(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryValue, setEntryValue] = useState(null);
  
  const entryTypes = [
    { label: 'Scanned', value: true },
    { label: 'Not Scanned', value: false }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchParticipantsList();
  }, [eventValue, entryValue]);

  const fetchEvents = async () => {
    try {
      const partnerId = userType === "eventUser" ? selectedEventPartner : user;
      const eventsList = await fetchEventsByPartner(partnerId);
      const formattedEvents = eventsList.map(event => ({
        label: event.EventName,
        value: event._id
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
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
        isScanned: entryValue
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
    const newStatus = !currentStatus;
    const actionText = newStatus ? 'scan in' : 'mark as not scanned';
    
    Alert.alert(
      'Update Status',
      `Are you sure you want to ${actionText} this participant?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await updateParticipantScanStatus(participantId, newStatus);
              // Update the local state to reflect the change
              setParticipants(prevParticipants =>
                prevParticipants.map(participant =>
                  participant._id === participantId
                    ? { ...participant, isScanned: newStatus }
                    : participant
                )
              );
            } catch (error) {
              console.error('Error updating scan status:', error);
              Alert.alert('Error', 'Failed to update participant status');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `Date: ${date.toLocaleDateString()}\nTime: ${date.toLocaleTimeString()}`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchParticipantsList();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setEventValue(null);
    setEntryValue(null);
    setSearchQuery("");
    fetchParticipantsList();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleScanStatusUpdate(item._id, item.isScanned)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.nameText}>{item?.name || 'N/A'}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.isScanned ? '#4CAF50' : '#FFA000' }
        ]}>
          <Text style={styles.statusText}>
            {item.isScanned ? 'Scanned' : 'Not Scanned'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Icon name="event" size={20} color="#2C3E50" />
          <Text style={styles.infoText}>
            {item.eventDetails?.[0]?.EventName || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="local-activity" size={20} color="#2C3E50" />
          <Text style={styles.infoText}>
            {item.TicketTypeDetails?.TicketType || 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="schedule" size={20} color="#2C3E50" />
          <Text style={styles.infoText}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5276" />
      <View style={styles.header}>
        <Text style={styles.title}>Participants</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search participants..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              fetchParticipantsList();
            }}
          />
        </View>

        <View style={styles.filtersContainer}>
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

          <DropDownPicker
            open={eventOpen}
            value={eventValue}
            items={events}
            setOpen={setEventOpen}
            setValue={setEventValue}
            setItems={setEvents}
            placeholder="Select Event"
            style={styles.dropdown}
            containerStyle={styles.dropdownContainer}
            zIndex={2000}
          />

          <DropDownPicker
            open={entryOpen}
            value={entryValue}
            items={entryTypes}
            setOpen={setEntryOpen}
            setValue={setEntryValue}
            placeholder="Select Entry Type"
            style={styles.dropdown}
            containerStyle={[styles.dropdownContainer, { marginTop: 10 }]}
            zIndex={1000}
          />
        </View>

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
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: "Poppins-Regular",
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    zIndex: 1000,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#2C3E50",
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
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
  dropdown: {
    borderColor: "#E0E0E0",
    borderRadius: 12,
  },
  dropdownContainer: {
    marginBottom: 10,
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nameText: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#2C3E50",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: "Poppins-Medium",
    color: "#1A5276",
  },
});