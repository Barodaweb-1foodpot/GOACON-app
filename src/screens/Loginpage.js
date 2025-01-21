/* eslint-disable no-redeclare */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { AuthContext, useAuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import * as Font from "expo-font";
import PoppinsRegular from "../../assets/fonts/Poppins-Regular.ttf";
import PoppinsBold from "../../assets/fonts/Poppins-Bold.ttf";
import logo from "../../assets/logo.png";
import {
  fetchEventPartners,
  eventPartnerLogin,
  eventUserLogin,
} from "../api/adminApi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [localUserType, setLocalUserType] = useState("eventPartner");
  const [eventPartners, setEventPartners] = useState([]);
  const [localSelectedEventPartner, setLocalSelectedEventPartner] =
    useState("");
  const { setuser, setSelectedEventPartner, userType, setUserType } =
    useAuthContext();
  const [showPicker, setShowPicker] = useState(false);
  const { setUser } = useAuthContext();
  const { loading } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          Poppins: PoppinsRegular,
          "Poppins-Bold": PoppinsBold,
        });
      } catch (error) {
        console.error("Error loading fonts:", error);
      }
    };
    loadFonts();
  }, []);

  useEffect(() => {
    if (localUserType === "eventUser") {
      fetchPartners();
    }
    resetFields();
  }, [localUserType]);

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setEmailError("");
    setPasswordError("");
    setServerError("");
    setLocalSelectedEventPartner("");
  };

  const fetchPartners = async () => {
    try {
      const data = await fetchEventPartners();
      setEventPartners(data || []);
    } catch (error) {
      console.error("Error fetching event partners:", error);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    let isValid = true;

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (!isValid) return;

    try {
      if (localUserType === "eventPartner") {
        const response = await eventPartnerLogin(email, password);
        if (response.isOk) {
          console.log("Event Partner ID:", response.data.eventPartner._id);
          setUser(response.data.eventPartner._id);
          setSelectedEventPartner(null);
          navigation.reset({
            index: 0,
            routes: [{ name: "Homepage" }],
          });
        } else {
          setServerError("Invalid email or password");
        }
      } else if (localUserType === "eventUser") {
        if (!localSelectedEventPartner) {
          setServerError("Please select an Event Partner");
          return;
        }

        const response = await eventUserLogin(
          email,
          password,
          localSelectedEventPartner
        );
        if (response.isOk) {
          console.log("Event User ID:", response.data.user._id);
          setUser(response.data.user._id);
          setSelectedEventPartner(localSelectedEventPartner);
          setUserType(localUserType);
          navigation.reset({
            index: 0,
            routes: [{ name: "Homepage" }],
          });
        } else {
          setServerError("Invalid email or password");
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      setServerError("Login failed. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.topBackground}>
            <TouchableOpacity style={styles.backArrow}>
              <AntDesign name="left" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} />
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome Back.</Text>

            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setLocalUserType("eventPartner")}
              >
                <View
                  style={[
                    styles.radioCircle,
                    localUserType === "eventPartner" &&
                      styles.radioCircleSelected,
                  ]}
                />
                <Text style={styles.radioText}>Event Partner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setLocalUserType("eventUser")}
              >
                <View
                  style={[
                    styles.radioCircle,
                    localUserType === "eventUser" && styles.radioCircleSelected,
                  ]}
                />
                <Text style={styles.radioText}>Event User</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                User name/Email ID <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Enter your email"
                  style={styles.input}
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError("");
                    setServerError("");
                  }}
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              <Text style={styles.label}>
                Password <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Enter your password"
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#aaa"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError("");
                    setServerError("");
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#000"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
              {serverError ? (
                <Text style={styles.errorText}>{serverError}</Text>
              ) : null}
            </View>

            {localUserType === "eventUser" && (
              <>
                <View style={styles.dropdownContainer}>
                  <Text style={styles.label}>Select Event Partner</Text>
                  <Pressable
                    style={styles.dropdown}
                    onPress={() => setShowPicker(true)}
                  >
                    <Text style={styles.dropdownText}>
                      {localSelectedEventPartner
                        ? eventPartners.find(
                            (partner) =>
                              partner._id === localSelectedEventPartner
                          )?.companyName || "Select Event Partner"
                        : "Select Event Partner"}
                    </Text>
                    <Icon name="arrow-drop-down" size={24} color="#000" />
                  </Pressable>
                </View>

                <Modal visible={showPicker} transparent>
                  <View style={styles.modal}>
                    <View style={styles.modalContent}>
                      <FlatList
                        data={eventPartners}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.pickerItem}
                            onPress={() => {
                              setLocalSelectedEventPartner(item._id);
                              setShowPicker(false);
                            }}
                          >
                            <Text style={styles.pickerItemText}>
                              {item.companyName}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setShowPicker(false)}
                      >
                        <Text style={styles.closeButtonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </>
            )}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A5276",
  },
  topBackground: {
    height: "40%",
    backgroundColor: "#154360",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  backArrow: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  logoContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#F2F4F4",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    marginTop: -30,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    color: "#154360",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: "#000",
    marginBottom: 5,
    fontFamily: "Poppins",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B3B6B7",
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#000",
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 5,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    fontFamily: "Poppins",
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#154360",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    backgroundColor: "#154360",
  },
  radioText: {
    fontSize: 16,
    color: "#154360",
    fontFamily: "Poppins",
  },
  dropdownContainer: {
    width: "100%",
    marginVertical: 15,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B3B6B7",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: 16,
    color: "#000",
    fontFamily: "Poppins",
  },
  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  pickerItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    width: "100%",
    alignItems: "center",
  },
  pickerItemText: {
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#154360",
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#154360",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontFamily: "Poppins",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#154360",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 60,
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins-Bold",
  },
  asterisk: {
    color: "red",
  },
});
