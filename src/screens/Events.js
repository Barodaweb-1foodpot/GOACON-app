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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuthContext } from "../context/AuthContext";
import { fetchEventsByPartner } from "../api/eventApi";
import placeholder from "../../assets/placeholder.png";

export default function Events() {
  const { user, userType, selectedEventPartner } = useAuthContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user, userType, selectedEventPartner]);

  const formatDate = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  const formatTime = (date) => {
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(date).toLocaleTimeString([], options);
  };

  const handleShare = async (event) => {
    try {
      const message = `Check out this amazing event: ${event?.EventName}\n\n📅 Date: ${formatDate(
        event.StartDate
      )}\n⏰ Time: ${formatTime(event?.StartDate)} - ${formatTime(
        event.EndDate
      )}\n👥 Participants: ${event?.NoOfParticipants || 0}\n\n📍 Location: ${
        event.EventLocation
      }\n🗺️ Google Maps: ${event.googleMapLink}\n\nDon't miss out! Join us for this exciting event! #Events #Celebration`;

      await Share.share({
        message,
        title: event.EventName,
      });
    } catch (error) {
      console.error("Error sharing event:", error);
    }
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

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => handleShare(item)}
          >
            <Icon name="share" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share Event</Text>
          </TouchableOpacity>
        </View>
      </View>
      {index < events.length - 1 && <View style={styles.separator} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A5276" />
      <View style={styles.header}>
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
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: "#1A5276",
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
  listContainer: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  shareButton: {
    backgroundColor: "#1A5276",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  shareButtonText: {
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
});
