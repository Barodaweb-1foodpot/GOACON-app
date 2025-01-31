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
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthContext } from "../context/AuthContext";
import { fetchEventsByPartner } from "../api/eventApi";
import placeholder from "../../assets/placeholder.jpg";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function Events() {
  const { user, userType, selectedEventPartner } = useAuthContext();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigation = useNavigation();

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

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";

    const start = new Date(startDate);
    const end = new Date(endDate);

    const sameDay = start.toDateString() === end.toDateString();
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    const formatOptions = { day: "numeric", month: "short" };
    const startTime = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const endTime = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (sameDay) {
      return `${start.toLocaleDateString(undefined, formatOptions)} ${startTime} to ${endTime}`;
    } else if (sameMonth && sameYear) {
      return `${start.toLocaleDateString(undefined, formatOptions)} ${startTime} to ${end.toLocaleDateString(undefined, formatOptions)} ${endTime}`;
    } else if (sameYear) {
      return `${start.toLocaleDateString(undefined, formatOptions)} ${startTime} - ${end.toLocaleDateString(undefined, formatOptions)} ${endTime} ${start.getFullYear()}`;
    } else {
      return `${start.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} ${startTime} - ${end.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} ${endTime}`;
    }
  };

  const handleShare = async (event) => {
    try {
      const dateRange = formatDateRange(event.StartDate, event.EndDate);
      const message = `✨ *${event?.EventName}* ✨
📅 *Date & Time:* ${dateRange}
📍 *Location:* ${event.EventLocation}
🗺️ *Google Maps:* ${event.googleMapLink}`;

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

  const handleViewDetails = (event) => {
    navigation.navigate("ViewEventDetails", { event });
  };

  const renderEventItem = ({ item, index }) => (
    <View style={styles.eventCardWrapper}>
      <LinearGradient
        colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
        style={styles.eventCard}
      >
        <View style={styles.imageContainer}>
          <Image source={placeholder} style={styles.placeholderImage} />
          <Image
            source={
              item.EventImage && item.EventImage !== "null"
                ? {
                    uri: `https://server.bwebevents.com/${item.EventImage}`,
                  }
                : placeholder
            }
            style={styles.eventImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{item.EventName}</Text>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Icon name="event" size={20} color="#FFFFFF" />
              <Text style={styles.infoText}>
                {formatDateRange(item.StartDate, item.EndDate)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="location-on" size={20} color="#FFFFFF" />
              <TouchableOpacity
                onPress={() => Linking.openURL(item.googleMapLink)}
                style={styles.locationContainer}
              >
                <Text style={styles.locationText}>{item.EventLocation}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShare(item)}
            >
              <LinearGradient
                colors={["#4CAF50", "#2E7D32"]}
                style={styles.buttonGradient}
              >
                <Icon name="share" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Share Event</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => handleViewDetails(item)}
            >
              <LinearGradient
                colors={["#2196F3", "#1976D2"]}
                style={styles.buttonGradient}
              >
                <Icon name="info" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>View Details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      {index < events.length - 1 && <View style={styles.separator} />}
    </View>
  );

  return (
    <LinearGradient colors={["#000B19", "#001F3F", "#003366"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000B19" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-ios" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Events</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        renderItem={renderEventItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Toast />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 25 : 48,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  backButton: {
    marginRight: 8,
    padding: 8,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  listContainer: {
    padding: 16,
  },
  eventCardWrapper: {
    marginBottom: 20,
  },
  eventCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 20,
    marginHorizontal: 10,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  placeholderImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.5,
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 22,
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 30,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  categoryBadge: {
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
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#FFFFFF",
    marginLeft: 12,
    fontFamily: "Poppins-Regular",
    flex: 1,
  },
  locationContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    color: "#FFFFFF",
    marginLeft: 12,
    fontFamily: "Poppins-Regular",
    textDecorationLine: "underline",
    marginTop:10,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shareButton: {
    flex: 0.48,
  },
  viewDetailsButton: {
    flex: 0.48,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins-Medium",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: "#FFFFFF",
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