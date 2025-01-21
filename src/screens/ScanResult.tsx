import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import LottieView from "lottie-react-native";
import Toast from "react-native-toast-message";
import { RouteProp, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import { useNavigation } from "@react-navigation/native";
import { fetchEventDetails, markParticipantEntered } from "../api/eventApi";
import { StatusBar } from "expo-status-bar";
import successAnimation from "../../assets/animations/success-tick.json";

type ScanResultRouteProp = RouteProp<RootStackParamList, "ScanResult">;

export default function ScanResult({
  route,
}: {
  route: ScanResultRouteProp;
}): JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { data } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [eventDetails, setEventDetails] = useState<{
    eventName?: {
      EventName: string;
      StartDate: string;
      EndDate: string;
      EventLocation: string;
    };
    name?: string;
    ticketCategory?: string;
    TicketType?: { TicketType: string };
    isScanned?: boolean;
  } | null>(null);

  const [registerId, setRegisterId] = useState("");

  useEffect(() => {
    if (isUrl(data)) {
      try {
        const url = new URL(data);
        const pathSegments = url.pathname.split("/");
        const eventId = pathSegments[pathSegments.length - 1];
        setRegisterId(eventId);
        fetchDetails(eventId);
      } catch (error) {
        console.error("Error parsing URL or extracting ID:", error);
        setIsLoading(false);
      }
    }
  }, [data]);

  const isUrl = (str: string) => {
    const pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
        "((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*))" + // domain name
        "(\\.[a-zA-Z]{2,})+)", // domain extension
      "i"
    );
    return pattern.test(str);
  };

  const fetchDetails = async (eventId: string) => {
    try {
      const eventData = await fetchEventDetails(eventId);
      setEventDetails(eventData);
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch event details. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterParticipant = async () => {
    try {
      if (!eventDetails) return;

      if (eventDetails.isScanned) {
        Toast.show({
          type: "info",
          text1: "Participant Already Entered",
          text2: "This participant has already been entered.",
        });
      } else {
        await markParticipantEntered(registerId);
        Toast.show({
          type: "success",
          text1: "Participant Entered",
          text2: "New participant entry successful!",
        });
        setShowAnimation(true);
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to enter participant. Please try again.",
      });
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#00796B" />
          <Text style={styles.loadingText}>Loading Event Details...</Text>
        </View>
      ) : eventDetails ? (
        <View style={styles.detailsContainer}>
          <Text style={styles.eventName}>
            {eventDetails.eventName?.EventName}
          </Text>
          <Text style={styles.eventDate}>
            {formatDateTime(eventDetails.eventName?.StartDate || "")} to{" "}
            {formatDateTime(eventDetails.eventName?.EndDate || "")}
          </Text>
          <Text style={styles.eventLocation}>
            {eventDetails.eventName?.EventLocation}
          </Text>
          <Text style={styles.participantName}>
            {eventDetails.name} ({eventDetails.ticketCategory})
          </Text>
          <Text style={styles.participantType}>
            {eventDetails.TicketType?.TicketType?.toUpperCase()}
          </Text>

          {showAnimation ? (
            <LottieView
              source={successAnimation}
              autoPlay
              loop={false}
              style={styles.animation}
            />
          ) : !eventDetails.isScanned ? (
            <TouchableOpacity
              style={styles.enterButton}
              onPress={handleEnterParticipant}
            >
              <Text style={styles.enterButtonText}>Enter Participant</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.alreadyEnteredText}>
              Participant already entered.
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.errorText}>No event details found.</Text>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setShowAnimation(false);
          navigation.navigate("Scanner");
        }}
      >
        <Text style={styles.backButtonText}>Back to Scanner</Text>
      </TouchableOpacity>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#00796B",
  },
  detailsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#154360",
    marginBottom: 15,
    textAlign: "center",
  },
  eventDate: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  eventLocation: {
    fontSize: 18,
    color: "#5a81c0",
    marginBottom: 10,
    textAlign: "center",
  },
  participantName: {
    fontSize: 20,
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  participantType: {
    fontSize: 20,
    color: "#00796B",
    fontWeight: "bold",
    textAlign: "center",
  },
  enterButton: {
    backgroundColor: "#28A745",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  enterButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  animation: {
    width: 150,
    height: 150,
    marginTop: 20,
  },
  alreadyEnteredText: {
    fontSize: 18,
    color: "red",
    fontWeight: "bold",
    marginTop: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#00796B",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
});