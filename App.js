import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import MainNavigator from "./src/navigation/MainNavigator";
import Toast from "react-native-toast-message";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <MainNavigator />
        <Toast />
      </NavigationContainer>
    </AuthProvider>
  );
}