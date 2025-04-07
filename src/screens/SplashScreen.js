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
const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 40 : StatusBar.currentHeight;
const PARTICLE_COUNT = 100;

const STAR_CONFIGS = [
  { size: 1.5, probability: 0.6, twinkleSpeed: 1000 },
  { size: 2.5, probability: 0.3, twinkleSpeed: 1500 },
  { size: 3.5, probability: 0.1, twinkleSpeed: 2000 },
];

const STAR_COLORS = [
  "rgba(255, 255, 255, 0.9)",
  "rgba(255, 255, 255, 0.7)",
  "rgba(173, 216, 230, 0.8)",
  "rgba(255, 223, 186, 0.8)",
];

export default function SplashScreen({ onAnimationComplete }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  const stars = useRef(
    [...Array(PARTICLE_COUNT)].map(() => {
      const rand = Math.random();
      const config =
        STAR_CONFIGS.find((c) => rand <= c.probability) || STAR_CONFIGS[0];

      return {
        opacity: new Animated.Value(Math.random()),
        left: Math.random() * width,
        top: Math.random() * height * 0.8,
        size: config.size,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        twinkleSpeed: config.twinkleSpeed + Math.random() * 500,
        delay: Math.random() * 1000,
      };
    })
  ).current;

  useEffect(() => {
    // Main content animations
    const mainAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]);

    mainAnimation.start(() => {
      // Call the callback when animation finishes, if provided
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });

    stars.forEach((star) => {
      const createTwinkle = () => {
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.4 + 0.4,
            duration: star.twinkleSpeed,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.2 + 0.1,
            duration: star.twinkleSpeed,
            useNativeDriver: true,
          }),
        ]).start(createTwinkle);
      };

      setTimeout(createTwinkle, star.delay);
    });
  }, [onAnimationComplete]);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <LinearGradient
        colors={["#000B19", "#001F3F", "#003366"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.starsContainer}>
          {stars.map((star, i) => (
            <Animated.View
              key={i}
              style={[
                styles.star,
                {
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  backgroundColor: star.color,
                  opacity: star.opacity,
                },
              ]}
            />
          ))}
        </View>

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
            source={require("../../assets/app_icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textFadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <Text style={styles.appNameText} includeFontPadding={false}>
            BwebEScan
          </Text>
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
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  star: {
    position: "absolute",
    borderRadius: 50,
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  logo: {
    width: width * 0.8,
    height: height * 0.25,
  },
  // Updated text container styling from Code 1
  textContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 80 : 60,
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  // Updated app name text styling from Code 1
  appNameText: {
    fontSize: 32,
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
    letterSpacing: 2,
    paddingBottom: 5,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    textAlign: "center",
  },
});
