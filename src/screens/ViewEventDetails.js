import React, { useEffect, useState } from "react";
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
  StyleSheet as RNStyleSheet,
} from "react-native";
import PropTypes from "prop-types";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import placeholder from "../../assets/placeholder.jpg";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fetchSessionByExhibition } from "../api/eventApi";

const { width } = Dimensions.get("window");

/* ---------------- Skeleton Loader Component ---------------- */
const SkeletonLoader = ({ style }) => {
  const [animation] = React.useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    ).start();
  }, [animation]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={[style, skeletonStyles.loaderContainer]}>
      <Animated.View
        style={{
          width: "100%",
          height: "100%",
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            "rgba(255, 255, 255, 0.5)",
            "rgba(255, 255, 255, 0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>
    </View>
  );
};

SkeletonLoader.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const skeletonStyles = RNStyleSheet.create({
  loaderContainer: {
    backgroundColor: "#333", // dark background for a dark look
    overflow: "hidden",
  },
});

/* ---------------- EventImage Component ---------------- */
const EventImage = ({ eventImage }) => {
  const [loaded, setLoaded] = React.useState(false);

  const imageSource =
    eventImage && eventImage !== "null"
      ? { uri: `https://server.bwebevents.com/${eventImage}` }
      : placeholder;

  return (
    <View style={styles.imageWrapper}>
      {!loaded && <SkeletonLoader style={RNStyleSheet.absoluteFill} />}
      <Image
        source={imageSource}
        style={[styles.eventImage, { opacity: loaded ? 1 : 0 }]}
        onLoad={() => {
          console.log("Image loaded successfully");
          setLoaded(true);
        }}
        onError={(error) => {
          console.log("Image loading error:", error.nativeEvent);
          setLoaded(true);
        }}
        resizeMode="cover"
      />
    </View>
  );
};

EventImage.propTypes = {
  eventImage: PropTypes.string,
};

/* ---------------- Main Component ---------------- */
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

  useEffect(() => {
    fetchSession();
  }, [event]);
  const [exhibitionSession, setExhibitionSession] = useState([]);
  const fetchSession = async () => {
    console.log(event);
    const res = await fetchSessionByExhibition(event._id);
    console.log("-------------", res);
    setExhibitionSession(res.data);
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";

    const start = new Date(startDate);
    const end = new Date(endDate);

    const sameDay = start.toDateString() === end.toDateString();
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    const formatOptions = { day: "numeric", month: "short" };
    const startTime = start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = end.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (sameDay) {
      return `${start.toLocaleDateString(undefined, formatOptions)} ${startTime} to ${endTime}`;
    } else if (sameMonth && sameYear) {
      return `${start.toLocaleDateString(undefined, formatOptions)} ${startTime} to ${end.toLocaleDateString(
        undefined,
        formatOptions
      )} ${endTime}`;
    } else if (sameYear) {
      return `${start.toLocaleDateString(undefined, formatOptions)} ${startTime} - ${end.toLocaleDateString(
        undefined,
        formatOptions
      )} ${endTime} ${start.getFullYear()}`;
    } else {
      return `${start.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} ${startTime} - ${end.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} ${endTime}`;
    }
  };

  const handleShare = async () => {
    try {
      const dateRange = formatDateRange(event.startTime, event.endTime);
      const message = `✨ *${event?.exhibitionEventName}* ✨
📅 *Date & Time:* ${dateRange}
📍 *Location:* ${event.address}
🗺️ *Google Maps:* ${event.locationLink}`;

      await Share.share({
        message,
        title: event.exhibitionEventName,
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
        <Text style={styles.title}>{event.exhibitionEventName}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Event Image with Skeleton Loader */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              // opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <EventImage eventImage={event.images && event.images[0]} />
        </Animated.View>

        {/* Event Information */}
        <Animated.View
          style={[
            styles.detailsContainer,
            {
              // opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
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
                  <Text style={styles.value}>
                    {formatDateRange(event.startTime, event.endTime)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* About Event */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <View style={styles.contentCard}>
              <Text style={styles.description}>
                {event.description
                  ? event.description.replace(/<[^>]+>/g, "")
                  : "No description available."}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TouchableOpacity
              style={styles.locationCard}
              onPress={() => Linking.openURL(event.locationLink)}
            >
              <View style={styles.iconContainer}>
                <Icon name="location-on" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.locationText}>{event.address}</Text>
              <Icon name="open-in-new" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Sessions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessions</Text>
            {exhibitionSession && exhibitionSession.length > 0 ? (
              exhibitionSession.map((session, index) => (
                <View key={session._id} style={styles.sessionCard}>
                  <Text style={styles.sessionNumber}>
                    {(index + 1).toString().padStart(2, "0")}
                  </Text>
                  <View style={styles.sessionContent}>
                    <Text style={styles.sessionName}>
                      {session.sessionName}
                    </Text>
                    <View style={styles.sessionDetails}>
                      <View style={styles.sessionTimeContainer}>
                        <Icon name="event" size={16} color="#FFFFFF" style={styles.sessionIcon} />
                        <Text style={styles.sessionTime}>
                          {new Date(session.startTime).toLocaleDateString()} {" "}
                          {new Date(session.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" - "}
                          {new Date(session.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <View style={styles.sessionLocationContainer}>
                        <Icon name="location-on" size={16} color="#FFFFFF" style={styles.sessionIcon} />
                        <Text style={styles.sessionLocation}>
                          {session.sessionLocation}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(session.sessionLocation)}`)}
                    style={styles.mapIconContainer}
                  >
                    <Icon name="map" size={24} color="#4CAF50" />
                  </TouchableOpacity>
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
            // opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Icon name="share" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Share Event</Text>
        </TouchableOpacity>
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
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.5,
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
    alignItems: "flex-start",
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
    marginBottom: 8,
  },
  sessionDetails: {
    gap: 8,
  },
  sessionTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionLocationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sessionIcon: {
    marginRight: 6,
    opacity: 0.8,
  },
  sessionTime: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Poppins-Regular",
    opacity: 0.8,
    flex: 1,
  },
  sessionLocation: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Poppins-Regular",
    opacity: 0.8,
    flex: 1,
  },
  mapIconContainer: {
    padding: 8,
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
    bottom: 7,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
    // backgroundColor: "rgba(0, 11, 25, 0.9)",
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
