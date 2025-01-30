/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
/* eslint-disable react/jsx-no-undef */
import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import * as Font from "expo-font";
import AuthNavigator from "./AuthNavigator";
import Homepage from "../screens/Homepage";
import ScanResult from "../screens/ScanResult";
import Events from "../screens/Events";
import Participants from "../screens/Participants";
import EventSession from "../screens/EventSession";
import SplashScreen from "../screens/SplashScreen";
import { useAuthContext } from "../context/AuthContext";
// import ScannerProd from "../screens/ScannerProd";
import ScannerDev from "../screens/ScannerDev";
import SessionDetails from "../screens/SessionDetails";
import ViewEventDetails from "../screens/ViewEventDetails";

const Stack = createStackNavigator();

export default function MainNavigator() {
  const { fetchUser, user, loading } = useAuthContext();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const loadFontsAndUser = async () => {
      try {
        await Font.loadAsync({
          Poppins: require("../../assets/fonts/Poppins-Regular.ttf"),
          "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
        });
        setFontsLoaded(true);
        await fetchUser();
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    loadFontsAndUser();

    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(splashTimeout);
  }, []);

  if (showSplash || !fontsLoaded || loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, gestureEnabled: false }}
    >
      {!user ? (
        <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Homepage" component={Homepage} />
          <Stack.Screen name="Scanner" component={ScannerDev} />
          {/* Production scannes is under */}
          {/* <Stack.Screen name="Scanner" component={ScannerProd} /> */}
          <Stack.Screen name="ScanResult" component={ScanResult} />
          <Stack.Screen name="Events" component={Events} />
          <Stack.Screen name="Participants" component={Participants} />
          <Stack.Screen name="EventSession" component={EventSession} />
          <Stack.Screen name="SessionDetails" component={SessionDetails} />
          <Stack.Screen
            name="ViewEventDetails"
            component={ViewEventDetails}
            options={{ gestureEnabled: true }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
