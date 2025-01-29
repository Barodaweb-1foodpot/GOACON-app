/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Linking,
  Share,
  StatusBar,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuthContext } from "../context/AuthContext";
import { fetchEventsByPartner } from "../api/eventApi";
import placeholder from "../../assets/placeholder.jpg";
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function Events() {
  const { user, userType, selectedEventPartner } = useAuthContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigation = useNavigation();

  // State for Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    console.log("TEST:", selectedEventPartner);
    const partnerId = userType === "eventUser" ? selectedEventPartner : user;
    try {
      const payload = {
        skip: 0,
        per_page: 10,
        match: "",
        IsActive: true,
        eventPartner_id: partnerId,
      };
      const response = await fetchEventsByPartner(payload);
      setEvents(response || []);
    } catch (err) {
      setError("Failed to fetch events.");
      console.error("Error fetching events:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch events. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user, userType, selectedEventPartner]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  const formatTime = (date) => {
    if (!date) return "N/A";
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(date).toLocaleTimeString([], options);
  };

  const handleShare = async (event) => {
    try {
      const message = `✨ **${event?.EventName}** ✨

📅 **Date:** ${formatDate(event.StartDate)}
⏰ **Time:** ${formatTime(event?.StartDate)} - ${formatTime(event.EndDate)}
👥 **Participants:** ${event?.NoOfParticipants || 0}

📍 **Location:** ${event.EventLocation}
🗺️ **Google Maps:** ${event.googleMapLink}

Don't miss out! Join us for this exciting event! #Events #Celebration

🔗 **To register for this event:** https://participant.bwebevents.com/register`;

      await Share.share({
        message,
        title: event.EventName,
      });
    } catch (error) {
      console.error("Error sharing event:", error);
      Toast.show({
        type: "error",
        text1: "Share Failed",
        text2: "Unable to share the event. Please try again.",
      });
    }
  };

  // Handler to open Modal with Event Details
  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const renderEventItem = ({ item, index }) => (
    <View>
      <View style={styles.eventCard}>
        <View style={styles.imageContainer}>
          <Image source={placeholder} style={styles.placeholderImage} />
          <Image
            source={
              item.EventImage && item.EventImage !== "null"
                ? {
                    uri: `https://serverhiindia.barodaweb.org/${item.EventImage}`,
                  }
                : placeholder
            }
            style={[styles.eventImage]}
            resizeMode="cover"
          />
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{item.EventName}</Text>

          <View style={styles.categoryContainer}>
            {item?.eventCategoryDetails?.map((data, index) => (
              <View key={index} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{data.category}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Icon name="group" size={20} color="#2C3E50" />
              <Text style={styles.infoText}>
                {item.NoOfParticipants || 0} Participants
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="event" size={20} color="#2C3E50" />
              <Text style={styles.infoText}>{formatDate(item.StartDate)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="schedule" size={20} color="#2C3E50" />
              <Text style={styles.infoText}>
                {formatTime(item.StartDate)} - {formatTime(item.EndDate)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="location-on" size={20} color="#2C3E50" />
              <TouchableOpacity
                onPress={() => Linking.openURL(item.googleMapLink)}
                style={styles.locationContainer}
              >
                <Text style={styles.locationText}>{item.EventLocation}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons Container */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShare(item)}
            >
              <Icon name="share" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share Event</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => handleViewDetails(item)}
            >
              <Icon name="info" size={20} color="#FFFFFF" />
              <Text style={styles.viewDetailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {index < events.length - 1 && <View style={styles.separator} />}
    </View>
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
        <Text style={styles.title}>Events</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A5276" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="event-busy" size={60} color="#1A5276" />
            <Text style={styles.emptyText}>No events available</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item._id}
            renderItem={renderEventItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Modal for Event Details */}
      {selectedEvent && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setSelectedEvent(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header with close button */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedEvent.EventName}</Text>
                <TouchableOpacity
                  style={styles.modalCloseIcon}
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedEvent(null);
                  }}
                >
                  <Icon name="close" size={24} color="#1A5276" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.modalScrollContent}
              >
                {/* Event Image */}
                <View style={styles.modalImageContainer}>
                  <Image
                    source={
                      selectedEvent.EventImage && selectedEvent.EventImage !== "null"
                        ? {
                            uri: `https://serverhiindia.barodaweb.org/${selectedEvent.EventImage}`,
                          }
                        : placeholder
                    }
                    style={styles.modalEventImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Event Details */}
                <View style={styles.modalDetailsContainer}>
                  {/* Date and Time Section */}
                  <View style={styles.modalInfoSection}>
                    <View style={styles.modalInfoRow}>
                      <Icon name="event" size={24} color="#1A5276" />
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Date</Text>
                        <Text style={styles.modalInfoText}>
                          {formatDate(selectedEvent.StartDate)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Icon name="schedule" size={24} color="#1A5276" />
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Time</Text>
                        <Text style={styles.modalInfoText}>
                          {formatTime(selectedEvent.StartDate)} - {formatTime(selectedEvent.EndDate)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Description Section */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>About Event</Text>
                    <Text style={styles.modalDescription}>
                      {selectedEvent.EventDescreption
                        ? selectedEvent.EventDescreption.replace(/<[^>]+>/g, '')
                        : "No description available."}
                    </Text>
                  </View>

                  {/* Location Section */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Location</Text>
                    <TouchableOpacity
                      style={styles.modalLocationButton}
                      onPress={() => Linking.openURL(selectedEvent.googleMapLink)}
                    >
                      <Icon name="location-on" size={24} color="#1A5276" />
                      <Text style={styles.modalLocationText}>
                        {selectedEvent.EventLocation}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sessions Section */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Sessions</Text>
                    {selectedEvent.SessionDetails && selectedEvent.SessionDetails.length > 0 ? (
                      selectedEvent.SessionDetails.map((session, index) => (
                        <View key={session._id} style={styles.modalSessionItem}>
                          <View style={styles.sessionNumberBadge}>
                            <Text style={styles.sessionNumberText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.modalSessionName}>{session.sessionName}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.modalNoContent}>No sessions available.</Text>
                    )}
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalShareButton}
                  onPress={() => handleShare(selectedEvent)}
                >
                  <Icon name="share" size={20} color="#FFFFFF" />
                  <Text style={styles.modalButtonText}>Share Event</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalRegisterButton}
                  onPress={() => Linking.openURL('https://participant.bwebevents.com/register')}
                >
                  <Icon name="how-to-reg" size={20} color="#FFFFFF" />
                  <Text style={styles.modalButtonText}>Register Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Toast />
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
    paddingTop: 45,
    paddingBottom: 20,
    backgroundColor: "#1A5276",
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  backButton: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    overflow: "hidden", 
  },
  
  listContainer: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    overflow: "hidden",
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 20,
    marginHorizontal: 10,
    opacity: 0.7,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: "#E0E0E0",
  },
  placeholderImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.5,
  },
  eventImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    color: "#2C3E50",
    marginBottom: 12,
    lineHeight: 30,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: "#1A5276",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
  infoContainer: {
    backgroundColor: "#F0F4F8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#2C3E50",
    marginLeft: 12,
    fontFamily: "Poppins-Regular",
    flex: 1,
  },
  locationContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    color: "#1A5276",
    marginLeft: 12,
    fontFamily: "Poppins-Regular",
    textDecorationLine: "underline",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shareButton: {
    backgroundColor: "#1A5276",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    flex: 0.48,
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    marginLeft: 8,
  },
  viewDetailsButton: {
    backgroundColor: "#2E86C1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    flex: 0.48,
  },
  viewDetailsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F6FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#1A5276",
    fontFamily: "Poppins-Medium",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#F5F6FA",
  },
  emptyText: {
    fontSize: 18,
    color: "#1A5276",
    fontFamily: "Poppins-Medium",
    marginTop: 16,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#FF5252",
    fontFamily: "Poppins-Medium",
    textAlign: "center",
    marginTop: 16,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end', 
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '90%',
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative', 
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#1A5276",
    flex: 1,
    textAlign: 'center',
  },
  modalCloseIcon: {
    position: 'absolute',
    right: -10,
    top: 30,
    padding: 5,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20, 
  },
  modalImageContainer: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  modalEventImage: {
    width: '100%',
    height: '100%',
  },
  modalDetailsContainer: {
    flex: 1,
  },
  modalInfoSection: {
    backgroundColor: '#F5F6FA',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalInfoContent: {
    marginLeft: 15,
  },
  modalInfoLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: '#666',
  },
  modalInfoText: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: '#2C3E50',
  },
  modalSection: {
    marginBottom: 25,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#1A5276",
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#2C3E50",
    lineHeight: 24,
  },
  modalLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    padding: 15,
    borderRadius: 12,
  },
  modalLocationText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#1A5276",
    marginLeft: 10,
    flex: 1,
  },
  modalSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  sessionNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A5276',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionNumberText: {
    color: '#FFFFFF',
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
  },
  modalSessionName: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#2C3E50",
    flex: 1,
    flexWrap: 'wrap',
  },
  modalNoContent: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#666",
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalShareButton: {
    backgroundColor: "#1A5276",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    flex: 0.48,
  },
  modalRegisterButton: {
    backgroundColor: "#2E86C1",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    flex: 0.48,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    marginLeft: 8,
  },
});
