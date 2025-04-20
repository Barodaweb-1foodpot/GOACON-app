import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import * as Font from "expo-font";
import AuthNavigator from "./AuthNavigator";
import Homepage from "../screens/Homepage";
import ScanResult from "../screens/ScanResult";
import Events from "../screens/Events";
import Participants from "../screens/Participants";
import EventSession from "../screens/EventSession";
import SplashScreenComponent from "../screens/SplashScreen";
// import ScannerProd from "../screens/ScannerProd";
import ScannerDev from "../screens/ScannerDev";
import SessionDetails from "../screens/SessionDetails";
import ViewEventDetails from "../screens/ViewEventDetails";
import { useAuthContext } from "../context/AuthContext";
import { View } from 'react-native';

const Stack = createStackNavigator();

// Preload fonts before importing components
async function preloadFonts() {
  try {
    console.log("Preloading fonts...");
    await Font.loadAsync({
      "Poppins": require("../../assets/fonts/Poppins-Regular.ttf"),
      "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
      "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
      "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
    });
    console.log("Fonts preloaded successfully.");
  } catch (e) {
    console.warn("Font preloading error:", e);
  }
}

// Start font preloading immediately
preloadFonts();

export default function MainNavigator() {
  const { fetchUser, user, loading } = useAuthContext();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Fetch user data in parallel with splash display
        fetchUser();
      } catch (e) {
        console.warn("App initialization error:", e);
      }
    };

    initializeApp();

    // Show splash screen for fixed duration
    console.log("Starting splash timer for 3 seconds.");
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimer);
  }, []);

  if (showSplash) {
    console.log("Displaying SplashScreen.");
    return <SplashScreenComponent />;
  }

  console.log("Rendering Main Navigator.");
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, gestureEnabled: false }}
    >
      {loading ? (
        <Stack.Screen name="LoadingPlaceholder">
          {() => <View style={{flex: 1, backgroundColor: '#000B19'}} />}
        </Stack.Screen>
      ) : !user ? (
        <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Homepage" component={Homepage} />
          <Stack.Screen name="Scanner" component={ScannerDev} />
          {/* Production scanner is under */}
          {/* <Stack.Screen name="Scanner" component={ScannerProd} /> */}
          <Stack.Screen name="ScanResult" component={ScanResult} />
          <Stack.Screen name="Events" component={Events} />
          <Stack.Screen name="Participants" component={Participants} />
          <Stack.Screen name="EventSession" component={EventSession} />
          <Stack.Screen name="SessionDetails" component={SessionDetails} />
          <Stack.Screen name="ViewEventDetails" component={ViewEventDetails} />
        </>
      )}
    </Stack.Navigator>
  );
}
