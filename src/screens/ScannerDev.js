import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const FRAME_SIZE = 300;

export default function ScannerDev() {
  // Manage camera permission
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [facing, setFacing] = useState("back"); // "back" or "front"
  const [isNavigating, setIsNavigating] = useState(false);
  const lastScanRef = useRef(0);

  const navigation = useNavigation();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Handle successful barcode/QR scans
  const handleBarCodeScanned = async (data ) => {
    const now = Date.now();
    // Avoid multiple scans within 2s & while navigating
    if (isNavigating || scanned || now - lastScanRef.current < 2000) {
      return;
    }

    setScanned(true);
    setIsNavigating(true);
    lastScanRef.current = now;

    try {
      // Subtle haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Parse the scanned data
      let scanData = data;
      console.log('=== Scanner: Raw QR Data ===');
      console.log(data);
      
      // Check if it's a vCard format (begins with BEGIN:VCARD)
      if (data.raw.includes("BEGIN:VCARD")) {
        console.log('=== Scanner: vCard Format Detected ===');
        
        // Extract email from vCard format
        const emailMatch = data.raw.match(/EMAIL[^:]*:(.*?)(?:\r?\n|$)/i);
        if (emailMatch && emailMatch[1]) {
          // Clean the email (remove any trailing characters)
          scanData = emailMatch[1].trim().toLowerCase();
          console.log('=== Scanner: Extracted Email ===');
          console.log(scanData);
        } else {
          console.log('=== Scanner: No Email Found in vCard ===');
        }
      } 
      else if(data.data){
        scanData = data.raw;
      }

      console.log('=== Scanner: Final Data Being Passed ===');
      console.log(scanData);

      Alert.alert(
        "QR Code Scanned", 
        `Data: ${scanData}`, 
        [
          {
            text: "OK",
            onPress: () => {
              console.log('=== Scanner: Navigating to ScanResult with data ===');
              console.log(scanData);
              navigation.navigate("ScanResult", { data: scanData });
            },
          },
        ]
      );
    } catch (error) {
      console.error("=== Scanner: Error Processing Scan ===");
      console.error(error);
      setScanned(false);
      setIsNavigating(false);
    }
  };

  const handleBarCodeScannedIOS = async ({data} ) => {
    const now = Date.now();
    if (isNavigating || scanned || now - lastScanRef.current < 2000) {
      return;
    }

    setScanned(true);
    setIsNavigating(true);
    lastScanRef.current = now;

    try {
      // Subtle haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Parse the scanned data
      let scanData = data;
      console.log('=== Scanner: Raw QR Data ===');
      console.log(data);
      
      // Check if it's a vCard format (begins with BEGIN:VCARD)
      if (data.includes("BEGIN:VCARD")) {
        console.log('=== Scanner: vCard Format Detected ===');
        
        // Extract email from vCard format
        const emailMatch = data.match(/EMAIL[^:]*:(.*?)(?:\r?\n|$)/i);
        if (emailMatch && emailMatch[1]) {
          // Clean the email (remove any trailing characters)
          scanData = emailMatch[1].trim().toLowerCase();
          console.log('=== Scanner: Extracted Email ===');
          console.log(scanData);
        } else {
          console.log('=== Scanner: No Email Found in vCard ===');
        }
      } 

      console.log('=== Scanner: Final Data Being Passed ===');
      console.log(scanData);

      Alert.alert(
        "QR Code Scanned", 
        `Data: ${scanData}`, 
        [
          {
            text: "OK",
            onPress: () => {
              console.log('=== Scanner: Navigating to ScanResult with data ===');
              console.log(scanData);
              navigation.navigate("ScanResult", { data: scanData });
            },
          },
        ]
      );
    } catch (error) {
      console.error("=== Scanner: Error Processing Scan ===");
      console.error(error);
      setScanned(false);
      setIsNavigating(false);
    }
  };

  // Toggle between front/back camera
  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const navigateToHome = () => {
    navigation.navigate("Homepage");
  };

  const handleScanAgain = () => {
    setScanned(false);
    setIsNavigating(false);
    lastScanRef.current = 0;
  };

  // If permission info is still loading
  if (!permission) {
    return <View style={styles.container} />;
  }

  // If camera permission is denied
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need camera permission.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main UI with CameraView
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing} // "back" or "front"
        onBarcodeScanned={
          !scanned && !isNavigating ? Platform.OS === "android" ? handleBarCodeScanned : handleBarCodeScannedIOS : undefined
        }
        // Restrict scanning to QR codes only
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        {/* Overlay scanning frame */}
        <View style={styles.scanFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        {/* Back/Home button */}
        <TouchableOpacity style={styles.backButton} onPress={navigateToHome}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <Text style={styles.buttonText}>Flip Camera</Text>
          </TouchableOpacity>

          {scanned && (
            <TouchableOpacity style={styles.controlButton} onPress={handleScanAgain}>
              <Text style={styles.buttonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

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
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
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
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
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
