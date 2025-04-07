/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
/* eslint-disable react/jsx-no-undef */
import React, { useEffect, useState, useCallback } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import * as Font from "expo-font";
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function MainNavigator() {
  const { fetchUser, user, loading } = useAuthContext();
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync({
          "Poppins": require("../../assets/fonts/Poppins-Regular.ttf"),
          "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
          "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
          "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
        });

        // Fetch initial user data
        await fetchUser();

      } catch (e) {
        console.warn("App preparation error:", e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the native splash screen when the RN view has laid out
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    // Native splash screen is still visible via preventAutoHideAsync
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {!splashAnimationFinished ? (
        // Show your custom splash screen first
        <SplashScreenComponent 
          onAnimationComplete={() => setSplashAnimationFinished(true)} 
        />
      ) : (
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
      )}
    </View>
  );
}
