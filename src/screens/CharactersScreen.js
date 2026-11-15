import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import CharacterCard from '../components/CharacterCard';
import StateMessage from '../components/StateMessage';
import { COLORS, DEBOUNCE_MS } from '../config/constants';
import { getCharacters } from '../services/charactersService';

function ListSeparator() {
  return <View style={styles.separator} />;
}

function mergeUniqueCharacters(previous, incoming) {
  const existingIds = new Set(previous.map((item) => item.id));
  const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.id));
  return [...previous, ...uniqueIncoming];
}

export default function CharactersScreen() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const isLoadingMoreRef = useRef(false);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerId);
  }, [searchText]);

  useEffect(() => {
    let isCancelled = false;
    const currentVersion = ++requestVersionRef.current;

    isLoadingMoreRef.current = false;
    setLoadingMore(false);
    setRefreshing(false);
    setLoading(true);
    setError(null);
    setLoadMoreError(null);

    async function loadInitialCharacters() {
      try {
        const data = await getCharacters({ page: 1, name: debouncedSearch });
        if (isCancelled || currentVersion !== requestVersionRef.current) return;
        setCharacters(data.results);
        setPage(1);
        setHasNextPage(data.hasNextPage);
      } catch (err) {
        if (isCancelled || currentVersion !== requestVersionRef.current) return;
        setCharacters([]);
        setHasNextPage(false);
        setError(err.message || 'Ocurrió un error al cargar los personajes.');
      } finally {
        if (!isCancelled && currentVersion === requestVersionRef.current) {
          setLoading(false);
        }
      }
    }

    loadInitialCharacters();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, retryCount]);

  function handleRetry() {
    setRetryCount((previous) => previous + 1);
  }

  async function handleLoadMore() {
    if (
      loading ||
      refreshing ||
      loadingMore ||
      isLoadingMoreRef.current ||
      !hasNextPage ||
      loadMoreError
    ) {
      return;
    }

    const nextPage = page + 1;
    const currentVersion = requestVersionRef.current;
    isLoadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const data = await getCharacters({ page: nextPage, name: debouncedSearch });
      if (currentVersion !== requestVersionRef.current) return;
      setCharacters((previous) => mergeUniqueCharacters(previous, data.results));
      setPage(nextPage);
      setHasNextPage(data.hasNextPage);
    } catch (err) {
      if (currentVersion !== requestVersionRef.current) return;
      setLoadMoreError(err.message || 'No se pudieron cargar más personajes.');
    } finally {
      if (currentVersion === requestVersionRef.current) {
        isLoadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }

  async function handleRefresh() {
    if (loading || refreshing) return;

    const currentVersion = ++requestVersionRef.current;
    isLoadingMoreRef.current = false;
    setLoadingMore(false);
    setRefreshing(true);
    setError(null);
    setLoadMoreError(null);

    try {
      const data = await getCharacters({ page: 1, name: debouncedSearch });
      if (currentVersion !== requestVersionRef.current) return;
      setCharacters(data.results);
      setPage(1);
      setHasNextPage(data.hasNextPage);
    } catch (err) {
      if (currentVersion !== requestVersionRef.current) return;
      const message = err.message || 'No se pudieron actualizar los personajes.';
      if (characters.length === 0) {
        setError(message);
      } else {
        setLoadMoreError(message);
      }
    } finally {
      if (currentVersion === requestVersionRef.current) {
        setRefreshing(false);
      }
    }
  }

  function renderFooter() {
    if (loadingMore) {
      return (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.footer} />
      );
    }
    if (loadMoreError) {
      return <Text style={styles.footerError}>{loadMoreError}</Text>;
    }
    return null;
  }

  function renderContent() {
    if (loading) {
      return (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      );
    }

    if (error && characters.length === 0) {
      return (
        <StateMessage
          message={error}
          actionLabel="Reintentar"
          onAction={handleRetry}
        />
      );
    }

    const emptyMessage = debouncedSearch
      ? `No se encontraron personajes para "${debouncedSearch}".`
      : 'No hay personajes para mostrar.';

    return (
      <FlatList
        data={characters}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <CharacterCard character={item} />}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<StateMessage message={emptyMessage} />}
        ListFooterComponent={renderFooter()}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyboardShouldPersistTaps="handled"
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rick and Morty</Text>
      <TextInput
        style={styles.input}
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Buscar personaje..."
        placeholderTextColor={COLORS.textMuted}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },
  title: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  loader: { marginTop: 40 },
  separator: { height: 10 },
  listContent: { paddingBottom: 24 },
  footer: { marginVertical: 16 },
  footerError: { color: COLORS.danger, textAlign: 'center', marginVertical: 16 },
});
