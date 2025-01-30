/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Share,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import placeholder from "../../assets/placeholder.jpg";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function ViewEventDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { event } = route.params;
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatDate = (date) => {
    if (!date) return "N/A";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  // Add the formatDateRange function
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";

    const start = new Date(startDate);
    const end = new Date(endDate);

    const sameDay = start.toDateString() === end.toDateString();
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    if (sameDay) {
      return start.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (sameMonth && sameYear) {
      return `${start.getDate()} & ${end.getDate()} ${start.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
    } else if (sameYear) {
      return `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ${start.getFullYear()}`;
    } else {
      return `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
  };

  const formatTime = (date) => {
    if (!date) return "N/A";
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(date).toLocaleTimeString([], options);
  };

  const handleShare = async () => {
    try {
      const dateRange = formatDateRange(event.StartDate, event.EndDate);
      const message = `✨ **${event?.EventName}** ✨
📅 **Date:** ${dateRange}
⏰ **Time:** ${formatTime(event?.StartDate)} - ${formatTime(event.EndDate)}
📍 **Location:** ${event.EventLocation}
🗺️ **Google Maps:** ${event.googleMapLink}

Don't miss out! Join us for this exciting event!

🔗 Register: https://participant.bwebevents.com/register`;

      await Share.share({
        message,
        title: event.EventName,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Share Failed",
        text2: "Unable to share the event. Please try again.",
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back-ios" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{event.EventName}</Text>
        </View>

        {/* Event Image */}
        <Animated.View 
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Image
            source={
              event.EventImage && event.EventImage !== "null"
                ? { uri: `https://server.bwebevents.com/${event.EventImage}` }
                : placeholder
            }
            style={styles.eventImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Event Information */}
        <Animated.View 
          style={[
            styles.detailsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Date and Time Card */}
          <View style={styles.cardContainer}>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateContainer}>
                <Icon name="event" size={24} color="#1A5276" />
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Date</Text>
                  {/* Use formatDateRange instead of formatDate */}
                  <Text style={styles.value}>{formatDateRange(event.StartDate, event.EndDate)}</Text>
                </View>
              </View>
              <View style={styles.timeContainer}>
                <Icon name="access-time" size={24} color="#1A5276" />
                <View style={styles.textContainer}>
                  <Text style={styles.label}>Time</Text>
                  <Text style={styles.value}>
                    {formatTime(event.StartDate)} - {formatTime(event.EndDate)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* About Event */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>
              {event.EventDescreption
                ? event.EventDescreption.replace(/<[^>]+>/g, "")
                : "No description available."}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity
              style={styles.locationCard}
              onPress={() => Linking.openURL(event.googleMapLink)}
            >
              <Icon name="location-on" size={24} color="#1A5276" />
              <Text style={styles.locationText}>{event.EventLocation}</Text>
              <Icon name="open-in-new" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Sessions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessions</Text>
            {event.SessionDetails && event.SessionDetails.length > 0 ? (
              event.SessionDetails.map((session, index) => (
                <View key={session._id} style={styles.sessionCard}>
                  <Text style={styles.sessionNumber}>{(index + 1).toString().padStart(2, '0')}</Text>
                  <View style={styles.sessionContent}>
                    <Text style={styles.sessionName}>{session.sessionName}</Text>
                    <Text style={styles.sessionDuration}>45 minutes</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noContent}>No sessions available.</Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View 
        style={[
          styles.actionsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Icon name="share" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Share Event</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() =>
            Linking.openURL("https://participant.bwebevents.com/register")
          }
        >
          <Icon name="how-to-reg" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Register Now</Text>
        </TouchableOpacity>
      </Animated.View>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 50,
    paddingBottom: 15,
    backgroundColor: "#1A5276",
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    marginLeft: 15,
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: "#E0E0E0"
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  detailsContainer: {
    padding: 20,
  },
  cardContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
  },
  dateTimeRow: {
    flexDirection: "column",
    gap: 20,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 15,
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins-Regular",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#333",
    fontFamily: "Poppins-Medium",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#1A5276",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: "#444",
    fontFamily: "Poppins-Regular",
    lineHeight: 24,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontFamily: "Poppins-Medium",
    marginLeft: 15,
    marginRight: 10,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  sessionNumber: {
    fontSize: 16,
    color: "#1A5276",
    fontFamily: "Poppins-SemiBold",
    marginRight: 15,
  },
  sessionContent: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    color: "#333",
    fontFamily: "Poppins-Medium",
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins-Regular",
  },
  noContent: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Poppins-Regular",
    fontStyle: "italic",
  },
  actionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  shareButton: {
    backgroundColor: "#1A5276",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    flex: 0.48,
  },
  registerButton: {
    backgroundColor: "#2E86C1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    flex: 0.48,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    marginLeft: 8,
  },
});
