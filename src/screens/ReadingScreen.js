import React, { useCallback, useState } from "react";
import {
  View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Image, StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";
import HorizonMark from "../components/HorizonMark";
import { getBooks, setBooks, getInterests } from "../storage/preferences";
import { searchBooks, suggestBookForInterest } from "../services/googleBooks";

function ProgressBar({ pct }) {
  return (
    <View style={{ height: 6, borderRadius: 999, backgroundColor: colors.line, marginTop: 8 }}>
      <View style={{ height: 6, borderRadius: 999, width: `${pct}%`, backgroundColor: colors.brass }} />
    </View>
  );
}

function BookRow({ book, onBump, onMakeCurrent, onRemove }) {
  return (
    <View style={styles.bookCard}>
      {book.thumbnail ? (
        <Image source={{ uri: book.thumbnail }} style={styles.cover} />
      ) : (
        <View style={styles.iconBox}>
          <Ionicons name="book-outline" size={16} color={colors.ink} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontWeight: "600", color: colors.ink }} numberOfLines={1}>{book.title}</Text>
        <Text style={{ fontSize: 11.5, color: colors.inkSoft }} numberOfLines={1}>{book.author}</Text>
        {book.current ? (
          <>
            <ProgressBar pct={book.pct} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: colors.brass }}>{book.pct}% concluído</Text>
              <Pressable onPress={() => onBump(book.id)}>
                <Text style={{ fontSize: 11.5, fontWeight: "600", color: colors.ink }}>+10%</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable onPress={() => onMakeCurrent(book.id)} style={{ marginTop: 4 }}>
            <Text style={{ fontSize: 11.5, color: colors.brass, fontWeight: "600" }}>Começar a ler</Text>
          </Pressable>
        )}
      </View>
      <Pressable onPress={() => onRemove(book.id)} hitSlop={8}>
        <Ionicons name="close" size={16} color={colors.inkSoft} />
      </Pressable>
    </View>
  );
}

export default function ReadingScreen() {
  const [books, setBooksState] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    const saved = await getBooks();
    setBooksState(saved);

    if (saved.length === 0) {
      const interests = await getInterests();
      if (interests[0]) {
        suggestBookForInterest(interests[0]).then(setSuggestion).catch(() => {});
      }
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const persist = async (next) => {
    setBooksState(next);
    await setBooks(next);
  };

  const addBook = async (b, makeCurrent) => {
    const already = books.some((x) => x.id === b.id);
    if (already) return;
    const next = [...books, { ...b, pct: makeCurrent ? 0 : undefined, current: !!makeCurrent }];
    await persist(next);
    setResults([]);
    setQuery("");
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResults(await searchBooks(query.trim()));
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const bumpProgress = async (id) => {
    const next = books.map((b) => (b.id === id ? { ...b, pct: Math.min(100, (b.pct || 0) + 10) } : b));
    await persist(next);
  };

  const makeCurrent = async (id) => {
    const next = books.map((b) => (b.id === id ? { ...b, current: true, pct: 0 } : b));
    await persist(next);
  };

  const removeBook = async (id) => {
    await persist(books.filter((b) => b.id !== id));
  };

  const current = books.filter((b) => b.current);
  const queue = books.filter((b) => !b.current);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.mist }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
      <HorizonMark />
      <Text style={{ fontSize: 24, fontWeight: "700", color: colors.ink, marginBottom: 4 }}>Sua leitura</Text>
      <Text style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 18 }}>
        {books.length === 0 ? "Nenhum livro cadastrado ainda." : `Você está lendo ${current.length} e tem ${queue.length} na fila.`}
      </Text>

      <Text style={styles.sectionLabel}>Adicionar um livro</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por título ou autor..."
          style={styles.searchInput}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        <Pressable onPress={runSearch} style={styles.searchButton}>
          {searching ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="search" size={16} color="#fff" />}
        </Pressable>
      </View>

      {results.map((r) => (
        <Pressable key={r.id} style={styles.resultRow} onPress={() => addBook(r, books.length === 0)}>
          <Ionicons name="add-circle-outline" size={18} color={colors.brass} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.ink }} numberOfLines={1}>{r.title}</Text>
            <Text style={{ fontSize: 11.5, color: colors.inkSoft }} numberOfLines={1}>{r.author}</Text>
          </View>
        </Pressable>
      ))}

      {current.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Lendo agora</Text>
          {current.map((b) => (
            <BookRow key={b.id} book={b} onBump={bumpProgress} onMakeCurrent={makeCurrent} onRemove={removeBook} />
          ))}
        </>
      )}

      {queue.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Na fila</Text>
          {queue.map((b) => (
            <BookRow key={b.id} book={b} onBump={bumpProgress} onMakeCurrent={makeCurrent} onRemove={removeBook} />
          ))}
        </>
      )}

      {suggestion && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Sugestão pra você</Text>
          <Pressable style={styles.bookCard} onPress={() => addBook(suggestion, books.length === 0)}>
            {suggestion.thumbnail ? (
              <Image source={{ uri: suggestion.thumbnail }} style={styles.cover} />
            ) : (
              <View style={styles.iconBox}><Ionicons name="book-outline" size={16} color={colors.ink} /></View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.ink }} numberOfLines={1}>{suggestion.title}</Text>
              <Text style={{ fontSize: 11.5, color: colors.inkSoft }}>Baseado no seu interesse cadastrado</Text>
            </View>
            <Ionicons name="add-circle-outline" size={20} color={colors.brass} />
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.brass, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  bookCard: { flexDirection: "row", alignItems: "flex-start", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14, marginBottom: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.brassSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  cover: { width: 36, height: 52, borderRadius: 6, marginRight: 12, backgroundColor: colors.line },
  searchInput: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.ink, backgroundColor: colors.card },
  searchButton: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  resultRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 10, marginBottom: 8 },
});
