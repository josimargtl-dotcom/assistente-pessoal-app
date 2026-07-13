import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { colors, radius } from "../theme";
import HorizonMark from "../components/HorizonMark";
import { CITY_GUIDE_CATEGORIES, searchNearbyByCategory, geocodeCity } from "../services/places";

function PlaceCard({ place }) {
  return (
    <View style={styles.placeCard}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.ink }} numberOfLines={1}>{place.name}</Text>
      <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2 }} numberOfLines={1}>
        {place.address}
      </Text>
      <View style={{ flexDirection: "row", marginTop: 6, gap: 10 }}>
        {place.rating && (
          <Text style={{ fontSize: 12, color: colors.brass }}>★ {place.rating}</Text>
        )}
        {place.priceLevel != null && (
          <Text style={{ fontSize: 12, color: colors.inkSoft }}>{"$".repeat(place.priceLevel + 1)}</Text>
        )}
        {place.openNow === true && (
          <Text style={{ fontSize: 12, color: "#4A7A4A" }}>Aberto agora</Text>
        )}
      </View>
    </View>
  );
}

export default function CityGuideScreen() {
  const [coords, setCoords] = useState(null);
  const [cityLabel, setCityLabel] = useState("Sua localização atual");
  const [category, setCategory] = useState(CITY_GUIDE_CATEGORIES[0].key);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);

  const loadCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permita localização pra ver o guia da sua cidade.");
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setCityLabel("Sua localização atual");
    } catch (e) {
      setError("Não foi possível obter sua localização.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!coords) loadCurrentLocation();
    }, [coords, loadCurrentLocation])
  );

  const loadPlaces = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchNearbyByCategory({ ...coords, category });
      setPlaces(results);
    } catch (e) {
      setError(e.message || "Erro ao buscar lugares.");
    } finally {
      setLoading(false);
    }
  }, [coords, category]);

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [loadPlaces])
  );

  const searchCity = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const result = await geocodeCity(searchText.trim());
      setCoords({ latitude: result.latitude, longitude: result.longitude });
      setCityLabel(result.formattedName);
    } catch (e) {
      setError("Cidade não encontrada. Tente outro nome.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.mist }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 12 }}>
        <HorizonMark />
        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.ink, marginBottom: 4 }}>Guia da Cidade</Text>
        <Text style={{ fontSize: 12.5, color: colors.inkSoft, marginBottom: 14 }}>{cityLabel}</Text>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar outra cidade..."
            placeholderTextColor={colors.inkSoft}
            style={styles.searchInput}
            onSubmitEditing={searchCity}
          />
          <Pressable onPress={searchCity} style={styles.searchButton}>
            {searching ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="search" size={18} color="#fff" />}
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {CITY_GUIDE_CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={[styles.categoryChip, category === c.key && styles.categoryChipActive]}
            >
              <Ionicons name={c.icon} size={14} color={category === c.key ? "#fff" : colors.ink} />
              <Text style={{ fontSize: 12.5, marginLeft: 6, color: category === c.key ? "#fff" : colors.ink, fontWeight: "600" }}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={colors.brass} style={{ marginTop: 20 }} />
        ) : error ? (
          <Text style={{ fontSize: 13, color: colors.alert }}>{error}</Text>
        ) : places.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.inkSoft }}>Nenhum lugar encontrado nessa categoria.</Text>
        ) : (
          places.map((p) => <PlaceCard key={p.id} place={p} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.ink, backgroundColor: colors.card },
  searchButton: { backgroundColor: colors.brass, borderRadius: radius.md, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  categoryChip: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  categoryChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  placeCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, marginBottom: 10 },
});
