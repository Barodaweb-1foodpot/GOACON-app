/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
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
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import DropDownPicker from "react-native-dropdown-picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

import { useAuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  fetchEventPartners,
  eventPartnerLogin,
  eventUserLogin,
} from "../api/adminApi";

import logo from "../../assets/app_icon.png";

export default function LoginPage() {
  // [Previous state and hooks remain exactly the same]
  const [localUserType, setLocalUserType] = useState("eventPartner");
  const [eventPartners, setEventPartners] = useState([]);
  const [eventPartnersOpen, setEventPartnersOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, setSelectedEventPartner, setUserType, loading } = useAuthContext();
  const navigation = useNavigation();
  const formikRef = useRef(null);

  // [Validation schema, useEffect, and handlers remain exactly the same]
  const loginValidationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Please enter a valid email")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    eventPartner:
      localUserType === "eventUser"
        ? Yup.string().required("Event Partner is required")
        : Yup.string(),
  });

  useEffect(() => {
    if (localUserType === "eventUser") {
      fetchPartners();
    }
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    setServerError("");
  }, [localUserType]);

  const fetchPartners = async () => {
    try {
      const data = await fetchEventPartners();
      const formatted = data.map((p) => ({
        label: p.companyName,
        value: p._id,
      }));
      setEventPartners(formatted);
    } catch (error) {
      console.error("Error fetching event partners:", error);
    }
  };

  const handleLogin = async (values, { setSubmitting }) => {
    setServerError("");
    try {
      if (localUserType === "eventPartner") {
        const response = await eventPartnerLogin(values.email, values.password);
        if (response.isOk) {
          await AsyncStorage.setItem("_id", response.data.eventPartner._id);
          await AsyncStorage.setItem("role", "eventPartner");
          setUser(response.data.eventPartner._id);
          setSelectedEventPartner(response.data.eventPartner._id);
          setUserType("eventPartner");
        } else {
          setServerError("Invalid email or password");
        }
      } else {
        const response = await eventUserLogin(
          values.email,
          values.password,
          values.eventPartner
        );
        if (response.isOk) {
          await AsyncStorage.setItem("_id", response.data.user._id);
          await AsyncStorage.setItem("role", "eventUser");
          setUser(response.data.user._id);
          setSelectedEventPartner(values.eventPartner);
          setUserType("eventUser");
        } else {
          setServerError("Invalid email or password");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setServerError("Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000B19" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Logo Section with LinearGradient */}
          <LinearGradient
            colors={["#000B19", "#001F3F", "#003366"]}
            style={styles.topBackground}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} />
            </View>
          </LinearGradient>

          {/* Rest of the form remains exactly the same */}
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
                    localUserType === "eventPartner" && styles.radioCircleSelected,
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

            <Formik
              innerRef={formikRef}
              initialValues={{
                email: "",
                password: "",
                eventPartner: "",
              }}
              validationSchema={loginValidationSchema}
              onSubmit={handleLogin}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
                setFieldValue,
              }) => (
                <View style={styles.formikContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      User name/Email ID <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        placeholder="Enter your email"
                        style={styles.input}
                        placeholderTextColor="#aaa"
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        value={values.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    {errors.email && touched.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}

                    <Text style={styles.label}>
                      Password <Text style={styles.asterisk}>*</Text>
                    </Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        placeholder="Enter your password"
                        style={styles.input}
                        placeholderTextColor="#aaa"
                        secureTextEntry={!showPassword}
                        onChangeText={handleChange("password")}
                        onBlur={handleBlur("password")}
                        value={values.password}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Icon
                          name={showPassword ? "visibility" : "visibility-off"}
                          size={20}
                          color="#000"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && touched.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                  </View>

                  {localUserType === "eventUser" && (
                    <View style={styles.dropdownContainer}>
                      <Text style={styles.label}>
                        Select Event Partner <Text style={styles.asterisk}>*</Text>
                      </Text>
                      <DropDownPicker
                        open={eventPartnersOpen}
                        value={values.eventPartner}
                        items={eventPartners}
                        setOpen={setEventPartnersOpen}
                        setValue={(cb) => {
                          const val = cb(values.eventPartner);
                          setFieldValue("eventPartner", val);
                        }}
                        placeholder="Select Event Partner"
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownList}
                        listMode="SCROLLVIEW"
                        zIndex={3000}
                        zIndexInverse={1000}
                      />
                      {errors.eventPartner && touched.eventPartner && (
                        <Text style={styles.errorText}>{errors.eventPartner}</Text>
                      )}
                    </View>
                  )}

                  {serverError ? (
                    <Text style={styles.serverErrorText}>{serverError}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleSubmit}
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting || loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.loginButtonText}>Login</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A5276",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  topBackground: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: 300,
    height: 200,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    marginTop: -30,
  },
  // [Rest of the styles remain exactly the same]
  welcomeText: {
    fontSize: 28,
    fontFamily: "Poppins-Bold",
    color: "#154360",
    textAlign: "center",
    marginBottom: 20,
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
  },
  radioCircleSelected: {
    backgroundColor: "#154360",
  },
  radioText: {
    fontSize: 16,
    color: "#154360",
    fontFamily: "Poppins",
  },
  formikContainer: {
    marginTop: 10,
  },
  inputContainer: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    color: "#000",
    marginBottom: 5,
    fontFamily: "Poppins",
  },
  asterisk: {
    color: "red",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B3B6B7",
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#000",
    paddingVertical: 12,
    marginRight: 5,
  },
  dropdownContainer: {
    marginVertical: 10,
    zIndex: 2000,
  },
  dropdown: {
    borderColor: "#B3B6B7",
    borderRadius: 10,
  },
  dropdownList: {
    borderColor: "#B3B6B7",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    fontFamily: "Poppins",
  },
  serverErrorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 10,
    fontFamily: "Poppins",
  },
  loginButton: {
    backgroundColor: "#154360",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins-Bold",
  },
});