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
  Modal,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import DropDownPicker from "react-native-dropdown-picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

import { useAuthContext } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  fetchEventPartners,
  eventPartnerLogin,
  eventUserLogin,
} from "../api/adminApi";

import logo from "../../assets/bweb-partner.png";

export default function LoginPage() {
  const [localUserType, setLocalUserType] = useState("eventPartner");
  const [eventPartners, setEventPartners] = useState([]);
  const [eventPartnersOpen, setEventPartnersOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const { setUser, setSelectedEventPartner, setUserType } = useAuthContext();
  const formikRef = useRef(null);

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
          await AsyncStorage.setItem("token", response.data.token);
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
          await AsyncStorage.setItem("token", response.data.token);
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

      <View style={styles.formContainerWrapper}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            
            <ScrollView 
              style={styles.scrollableContent} 
              contentContainerStyle={styles.scrollContentContainer}
              keyboardShouldPersistTaps="handled"
            >
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
                        <TouchableOpacity 
                          style={styles.dropdownSelector}
                          onPress={() => setShowPartnerModal(true)}
                        >
                          <View style={styles.dropdownDisplay}>
                            <Icon name="business" size={20} color="#666" style={styles.dropdownIcon} />
                            <Text style={[
                              styles.dropdownText, 
                              !values.eventPartner && styles.dropdownPlaceholder
                            ]}>
                              {values.eventPartner 
                                ? eventPartners.find(p => p.value === values.eventPartner)?.label || "Select Event Partner"
                                : "Select Event Partner"}
                            </Text>
                            <Icon name="keyboard-arrow-down" size={24} color="#666" />
                          </View>
                        </TouchableOpacity>
                        
                        {errors.eventPartner && touched.eventPartner && (
                          <Text style={styles.errorText}>{errors.eventPartner}</Text>
                        )}
                        
                        {/* Event Partner Selection Modal */}
                        <Modal visible={showPartnerModal} transparent animationType="fade">
                          <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                              <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Event Partner</Text>
                                <TouchableOpacity
                                  onPress={() => setShowPartnerModal(false)}
                                  style={styles.modalCloseButton}
                                >
                                  <Icon name="close" size={24} color="#666" />
                                </TouchableOpacity>
                              </View>
                              
                              <ScrollView style={styles.modalScrollView}>
                                {eventPartners.map((partner, index) => (
                                  <React.Fragment key={partner.value}>
                                    <TouchableOpacity
                                      style={[
                                        styles.partnerOption,
                                        values.eventPartner === partner.value && styles.partnerOptionSelected
                                      ]}
                                      onPress={() => {
                                        setFieldValue("eventPartner", partner.value);
                                        setShowPartnerModal(false);
                                      }}
                                    >
                                      <Text style={[
                                        styles.partnerOptionText,
                                        values.eventPartner === partner.value && styles.partnerOptionTextSelected
                                      ]}>
                                        {partner.label}
                                      </Text>
                                      {values.eventPartner === partner.value && (
                                        <Icon name="check" size={20} color="#154360" />
                                      )}
                                    </TouchableOpacity>
                                    {index < eventPartners.length - 1 && (
                                      <View style={styles.partnerSeparator} />
                                    )}
                                  </React.Fragment>
                                ))}
                              </ScrollView>
                            </View>
                          </View>
                        </Modal>
                      </View>
                    )}

                    {serverError ? (
                      <Text style={styles.serverErrorText}>{serverError}</Text>
                    ) : null}

                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.loginButtonText}>Login</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </Formik>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A5276",
  },
  topBackground: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: 300,
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  formContainerWrapper: {
    flex: 1,
    marginTop: -55,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#F2F4F4",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
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
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
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
  dropdownSelector: {
    borderWidth: 1,
    borderColor: "#B3B6B7",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  dropdownDisplay: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#000",
  },
  dropdownPlaceholder: {
    color: "#aaa",
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
    width: "60%",
    alignSelf: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins-Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins-Bold",
    color: "#154360",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  partnerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  partnerOptionSelected: {
    backgroundColor: "rgba(21, 67, 96, 0.1)",
  },
  partnerOptionText: {
    fontSize: 16,
    fontFamily: "Poppins",
    color: "#333",
  },
  partnerOptionTextSelected: {
    color: "#154360",
    fontFamily: "Poppins-Bold",
  },
  partnerSeparator: {
    height: 1,
    backgroundColor: "#E4E7EB",
    marginHorizontal: 15,
  },
});