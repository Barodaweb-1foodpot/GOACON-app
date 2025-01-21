import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Loginpage from "../screens/Loginpage";

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Loginpage} />
    </Stack.Navigator>
  );
}