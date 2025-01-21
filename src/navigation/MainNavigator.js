import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AuthNavigator from "./AuthNavigator";
import Homepage from "../screens/Homepage";
import Scanner from "../screens/Scanner";
import ScanResult from "../screens/ScanResult";
import Events from "../screens/Events";
import Participants from "../screens/Participants";


const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
      <Stack.Screen name="Homepage" component={Homepage} />
      <Stack.Screen name="Scanner" component={Scanner} />
      <Stack.Screen name="ScanResult" component={ScanResult} />
      <Stack.Screen name="Events" component={Events} />
      <Stack.Screen name="Participants" component={Participants} />
    </Stack.Navigator>
  );
}
