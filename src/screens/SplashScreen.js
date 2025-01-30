/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Animated,
  StatusBar,
  Dimensions,
  Text,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 40 : StatusBar.currentHeight;

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Initial logo animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Text animations
      Animated.parallel([
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={["#003366", "#001F3F", "#000B19"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        {/* Floating particles effect */}
        <View style={styles.particlesContainer}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.particle,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                },
              ]}
            />
          ))}
        </View>

        {/* Logo container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Date and tagline */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textFadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <Text style={styles.dateText}>7th & 8th February</Text>
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Exchange | Empower | Transform</Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: STATUSBAR_HEIGHT,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
    width: 4,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 2,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  logo: {
    width: width * 0.8,
    height: height * 0.25,
  },
  textContainer: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 60 : 40,
    alignItems: "center",
  },
  dateText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 15,
    letterSpacing: 1,
  },
  taglineContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  taglineText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    letterSpacing: 1,
  },
});