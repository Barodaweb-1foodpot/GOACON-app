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
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
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
  return (
    <LinearGradient
      colors={["#000B19", "#001F3F", "#003366"]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000B19" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back-ios" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{event.EventName}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
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
          {/* <Image
            source={
              event.EventImage && event.EventImage !== "null"
                ? { uri: `https://server.bwebevents.com/${event.EventImage}` }
                : placeholder
            }
            style={styles.eventImage}
            resizeMode="cover"
          /> */}

          <Image source={placeholder} style={styles.placeholderImage} />
                    <Image
                      source={
                        event.EventImage && event.EventImage !== "null"
                          ? {
                              uri: `https://server.bwebevents.com/${event.EventImage}`,
                            }
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
              <View style={styles.infoContainer}>
                <View style={styles.iconContainer}>
                  <Icon name="event" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.value}>{formatDateRange(event.StartDate, event.EndDate)}</Text>
                </View>
              </View>
        
            </View>
          </View>

          {/* About Event */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <View style={styles.contentCard}>
              <Text style={styles.description}>
                {event.EventDescreption
                  ? event.EventDescreption.replace(/<[^>]+>/g, "")
                  : "No description available."}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity
              style={styles.locationCard}
              onPress={() => Linking.openURL(event.googleMapLink)}
            >
              <View style={styles.iconContainer}>
                <Icon name="location-on" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.locationText}>{event.EventLocation}</Text>
              <Icon name="open-in-new" size={20} color="#FFFFFF" />
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
        {/* <TouchableOpacity
          style={styles.registerButton}
          onPress={() => Linking.openURL("https://participant.bwebevents.com/register")}
        >
          <Icon name="how-to-reg" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Register Now</Text>
        </TouchableOpacity> */}
      </Animated.View>

      <Toast />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 48,
    paddingBottom: 15,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    marginLeft: 15,
    flex: 1,
  },
  imageContainer: {
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
    width: "100%",
    height: "100%",
  },
  detailsContainer: {
    padding: 20,
  },
  cardContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  dateTimeRow: {
    flexDirection: "column",
    gap: 20,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 50,
    padding: 10,
  },
  textContainer: {
    marginLeft: 15,
  },
  label: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.7,
    fontFamily: "Poppins-Regular",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins-Regular",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 15,
  },
  contentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    fontFamily: "Poppins-Regular",
    lineHeight: 24,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 20,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins-Medium",
    marginLeft: 15,
    marginRight: 10,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  sessionNumber: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
    marginRight: 15,
  },
  sessionContent: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Poppins-Medium",
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.7,
    fontFamily: "Poppins-Regular",
  },
  noContent: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.7,
    fontFamily: "Poppins-Regular",
    fontStyle: "italic",
  },
  actionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "rgba(0, 11, 25, 0.9)",
  },
  shareButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 20,
    flex: 0.48,
    elevation: 8,
  },
  registerButton: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 20,
    flex: 0.48,
    elevation: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    marginLeft: 8,
  },
});