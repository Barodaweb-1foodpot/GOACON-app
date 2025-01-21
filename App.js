import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import MainNavigator from "./src/navigation/MainNavigator";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}