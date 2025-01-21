import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import { Canvas, DiffRect, rect, rrect } from "@shopify/react-native-skia";

const { width, height } = Dimensions.get("window");
const innerDimension = 300;

const outer = rrect(rect(0, 0, width, height), 0, 0);
const inner = rrect(
  rect(
    width / 2 - innerDimension / 2,
    height / 2 - innerDimension / 2,
    innerDimension,
    innerDimension
  ),
  50,
  50
);

export default function Scanner(): JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);

  const handleBarcodeScanned = ({ type, data }: BarcodeScanningResult): void => {
    console.log("Scanned:", type, data);

    setScanned(true);
    Alert.alert(
      "QR Code Scanned",
      `Data: ${data}`,
      [
        {
          text: "OK",
          onPress: () => navigation.navigate("ScanResult", { data }),
        },
      ]
    );
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to access the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = (): void => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const navigateToHome = (): void => {
    navigation.navigate("Homepage"); 
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      >
        <Canvas style={StyleSheet.absoluteFillObject}>
          <DiffRect inner={inner} outer={outer} color="black" opacity={0.5} />
        </Canvas>

    
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backButton} onPress={navigateToHome}>
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
          {!scanned && (
            <View style={styles.scanIndicator}>
              <Text style={styles.scanningText}>Scanning...</Text>
            </View>
          )}
        </View>

        
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.buttonText}>Flip Camera</Text>
          </TouchableOpacity>
          {scanned && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setScanned(false)}
            >
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
  message: {
    textAlign: "center",
    color: "white",
    fontSize: 16,
    marginBottom: 10,
  },
  permissionButton: {
    backgroundColor: "#0E7AFE",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 10,
    borderRadius: 5,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scanIndicator: {
    position: "absolute",
    top: height / 2 - innerDimension / 2 - 40,
    alignItems: "center",
  },
  scanningText: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "white",
    padding: 8,
    borderRadius: 5,
    fontSize: 16,
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
  button: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});