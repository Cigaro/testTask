// src/screens/MapPickerScreen.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { SafeAreaView } from "react-native-safe-area-context";
import { Location as Loc } from "../types/task";

type MapPickerNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "MapPicker"
>;
type MapPickerRouteProp = RouteProp<RootStackParamList, "MapPicker">;

const MapPickerScreen: React.FC<{
  navigation: MapPickerNavProp;
  route: MapPickerRouteProp;
}> = ({ navigation, route }) => {
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelected({ lat: latitude, lng: longitude });
  };

  const confirm = () => {
    if (!selected) {
      Alert.alert("Выберите точку на карте");
      return;
    }

    const pickedLocation: Loc = {
      lat: selected.lat,
      lng: selected.lng,
      address: "",
    };

    // Если передан callback — вызываем его (это самый надёжный путь)
    const onPick = route.params?.onPick;
    if (typeof onPick === "function") {
      try {
        onPick(pickedLocation);
      } catch (err) {
        console.warn("MapPicker: onPick callback threw", err);
      }
      // закрываем карту
      navigation.goBack();
      return;
    }

    // fallback: если callback не передан — используем navigate на AddTask (типа безопасный fallback)
    const returnTo =
      (route.params?.returnTo as keyof RootStackParamList) || "AddTask";
    navigation.navigate(returnTo as any, { pickedLocation });
    // в fallback тоже закрываем
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          onPress={onMapPress}
          initialRegion={{
            latitude: 55.751244,
            longitude: 37.618423,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {selected && (
            <Marker
              coordinate={{ latitude: selected.lat, longitude: selected.lng }}
              title="Выбранная точка"
            />
          )}
        </MapView>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.goBack()}
          >
            <Text>Отмена</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.confirmBtn]}
            onPress={confirm}
          >
            <Text style={{ color: "#fff" }}>Подтвердить</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bottom: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btn: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    minWidth: 140,
    alignItems: "center",
  },
  confirmBtn: {
    backgroundColor: "#2563eb",
  },
});

export default MapPickerScreen;
