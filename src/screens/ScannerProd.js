import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const FRAME_SIZE = 300;

export default function ScannerProd() {
  // Whether we have camera permission
  const [hasPermission, setHasPermission] = useState(null);

  // Track scanning state
  const [scanned, setScanned] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const lastScanRef = useRef(0);

  const navigation = useNavigation();

  useEffect(() => {
    // Request camera permission when component mounts
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Handle the scanned result
  const handleBarCodeScanned = async ({ data }) => {
    const now = Date.now();
    // Avoid multiple scans within 2 seconds or if we’re already navigating
    if (isNavigating || scanned || now - lastScanRef.current < 2000) {
      return;
    }

    setScanned(true);
    setIsNavigating(true);
    lastScanRef.current = now;

    try {
      // Subtle haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Alert.alert("QR Code Scanned", `Data: ${data}`, [
        {
          text: "OK",
          onPress: () => navigation.navigate("ScanResult", { data }),
        },
      ]);
    } catch (error) {
      console.error("Scan error:", error);
      setScanned(false);
      setIsNavigating(false);
    }
  };

  // Navigate back to Home
  const navigateToHome = () => {
    navigation.navigate("Homepage");
  };

  // Reset scanning state
  const handleScanAgain = () => {
    setScanned(false);
    setIsNavigating(false);
    lastScanRef.current = 0;
  };

  // If we haven’t determined permission yet
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // If permission was denied
  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need camera permission to scan QR codes!
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => BarCodeScanner.requestPermissionsAsync()}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main scanning UI
  return (
    <View style={styles.container}>
      <BarCodeScanner
        style={StyleSheet.absoluteFillObject}
        onBarCodeScanned={!scanned && !isNavigating ? handleBarCodeScanned : undefined}
      >
        {/* Scanning Frame Overlay */}
        <View style={styles.scanFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        {/* Back to Home */}
        <TouchableOpacity style={styles.backButton} onPress={navigateToHome}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>

        {/* Scan Again Button */}
        <View style={styles.bottomControls}>
          {scanned && (
            <TouchableOpacity style={styles.controlButton} onPress={handleScanAgain}>
              <Text style={styles.buttonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </BarCodeScanner>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  permissionText: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#0E7AFE",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 5,
  },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  controlButton: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 15,
    borderRadius: 10,
  },
  scanFrame: {
    position: "absolute",
    top: height / 2 - FRAME_SIZE / 2,
    left: width / 2 - FRAME_SIZE / 2,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#fff",
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#fff",
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#fff",
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#fff",
  },
});
