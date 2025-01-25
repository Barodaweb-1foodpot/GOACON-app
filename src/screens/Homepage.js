/* eslint-disable react/prop-types */
import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext, useAuthContext } from "../context/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function Homepage() {
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);
  const { user } = useAuthContext();

  const handleLogout = () => {
    logout();
  };

  const DashboardCard = ({ icon, title, color, onPress }) => (
    <TouchableOpacity 
      style={[styles.cardContainer, { backgroundColor: color }]} 
      onPress={onPress}
    >
      <View style={styles.cardIconContainer}>
        <Icon name={icon} size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.cardText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Welcome,</Text>
          <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
        </View>
        <TouchableOpacity style={styles.profileIcon} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Content with Dashboard Cards */}
      <View style={styles.mainContent}>
        <DashboardCard
          icon="event"
          title="Event Details"
          color="#4CAF50"
          onPress={() => navigation.navigate("Events")}
        />
        <DashboardCard
          icon="group"
          title="Participants"
          color="#FF9800"
          onPress={() => navigation.navigate("Participants")}
        />
      </View>
      <View style={styles.mainContent}>
        <DashboardCard
          icon="event-seat"
          title="Sessions"
          color="#2196F3"
          onPress={() => navigation.navigate("SessionDetails")}
        />
        <DashboardCard
          icon="qr-code-scanner"
          title="Scanner"
          color="#9C27B0"
          onPress={() => navigation.navigate("Scanner")}
        />
      </View>

      {/* Scanner Quick Action */}
      {/* <TouchableOpacity 
        style={styles.scannerButton}
        onPress={() => navigation.navigate("Scanner")}
      >
        <Icon name="qr-code-scanner" size={24} color="#1A5276" />
        <Text style={styles.scannerButtonText}>Open Scanner</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A5276",
    paddingTop: Platform.OS === "android" ? 25 : 48,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  greetingText: {
    fontSize: 18,
    fontFamily: "Poppins-Regular",
    color: "#FFFFFF",
    opacity: 0.7,
  },
  userName: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
  },
  profileIcon: {
    backgroundColor: "#154360",
    padding: 10,
    borderRadius: 50,
  },
  mainContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cardContainer: {
    width: cardWidth,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 170,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.84,
  },
  cardIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 10,
    marginBottom: 15,
  },
  cardText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  scannerButton: {
    flexDirection: 'row',
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 5,
  },
  scannerButtonText: {
    color: "#1A5276",
    fontFamily: "Poppins-Medium",
    marginLeft: 10,
    fontSize: 16,
  },
});