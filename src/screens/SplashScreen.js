import React, { useRef, useEffect, useState } from "react";
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
import * as Font from "expo-font";

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

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const [fontLoaded, setFontLoaded] = useState(false);

  const stars = useRef(
    [...Array(PARTICLE_COUNT)].map(() => {
      const rand = Math.random();
      const config =
        STAR_CONFIGS.find((c) => rand <= c.probability) || STAR_CONFIGS[0];

      return {
        opacity: new Animated.Value(Math.random()),
        left: Math.random() * width,
        top: Math.random() * height,
        size: config.size,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        twinkleSpeed: config.twinkleSpeed + Math.random() * 500,
        delay: Math.random() * 1000,
      };
    })
  ).current;

  useEffect(() => {
    // Load fonts directly in the splash screen component
    async function loadFonts() {
      try {
        if (!Font.isLoaded('Poppins-SemiBold')) {
          await Font.loadAsync({
            'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
          });
        }
        setFontLoaded(true);
        console.log('Splash screen - Font loaded successfully');
      } catch (e) {
        console.error('Error loading font in splash screen:', e);
        setFontLoaded(true); // Continue with default font
      }
    }
    
    loadFonts();

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
      Animated.delay(300), // Added a slight delay before text animation
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

    mainAnimation.start();

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
  }, []);

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
            source={require("../../assets/BwebPartner.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textFadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.textWrapper}>
            <Text 
              style={[
                styles.appNameText, 
                !fontLoaded && styles.fallbackFont
              ]} 
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              BwebEScan
            </Text>
          </View>
        </Animated.View> */}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000B19', // Fallback color
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
    width: width * 1.3,
    height: height * 0.35,
  },
  textContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 50 : 40,
  },
  textWrapper: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 10,
    minWidth: width * 0.7,
    alignItems: 'center',
  },
  appNameText: {
    fontSize: 32,
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
    letterSpacing: 2,
    lineHeight: 40,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    textAlign: "center",
    fontWeight: "600",
  },
  fallbackFont: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontWeight: "bold",
  },
});