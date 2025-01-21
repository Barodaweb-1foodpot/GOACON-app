/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext, useAuthContext } from "../context/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function Homepage() {
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);
  const { selectedEventPartner } = useAuthContext();

  const handleLogout = () => {
    logout();
    navigation.navigate("AuthNavigator");
  };

  return (
    <TouchableWithoutFeedback>
      <View style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <TouchableOpacity style={styles.profileIcon} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Events")}
          >
            <Icon name="event" size={48} color="#4CAF50" />
            <Text style={styles.cardText}>Events</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("Participants")}
          >
            <Icon name="group" size={48} color="#FF9800" />
            <Text style={styles.cardText}>Participants</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.scannerButton}
          onPress={() => navigation.navigate("Scanner")}
        >
          <Text style={styles.scannerButtonText}>Open Scanner</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A5276",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 30,
  },
  title: {
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
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  card: {
    flex: 1,
    height: 150,
    margin: 10,
    backgroundColor: "#F2F4F4",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  cardText: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#154360",
  },
  scannerButton: {
    marginTop: 30,
    backgroundColor: "#fff",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  scannerButtonText: {
    color: "#154360",
    fontSize: 18,
    fontFamily: "Poppins-Bold",
  },
});
