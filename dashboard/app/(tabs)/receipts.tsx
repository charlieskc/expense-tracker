import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { fetchReceipts } from '@/lib/api';
import { formatDate, formatHkd } from '@/lib/format';
import type { ReceiptListItem } from '@/lib/types';

export default function ReceiptsScreen() {
  const [items, setItems] = useState<ReceiptListItem[]>([]);
  const [merchant, setMerchant] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q?: string) => {
    setError(null);
    try {
      const list = await fetchReceipts({ merchant: q?.trim() || undefined });
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Filter merchant…"
          placeholderTextColor="#6b7685"
          value={merchant}
          onChangeText={setMerchant}
          onSubmitEditing={() => { setLoading(true); load(merchant); }}
          returnKeyType="search"
        />
        <Pressable
          style={styles.searchBtn}
          onPress={() => { setLoading(true); load(merchant); }}
        >
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.searchBtn} onPress={() => { setLoading(true); load(merchant); }}>
            <Text style={styles.searchBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); load(merchant); }} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={{ marginTop: 40 }} />
            ) : (
              <Text style={styles.empty}>No approved receipts</Text>
            )
          }
          renderItem={({ item }) => (
            <Link href={`/receipt/${item.id}`} asChild>
              <Pressable style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>{item.merchant}</Text>
                  <Text style={styles.meta}>
                    {formatDate(item.receiptDate)} · {item.itemCount} items
                  </Text>
                </View>
                <Text style={styles.amount}>{formatHkd(item.actualPaidCents)}</Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1419' },
  searchRow: { flexDirection: 'row', padding: 12, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#1a2332',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e8eef5',
    borderWidth: 1,
    borderColor: '#2a3544',
  },
  searchBtn: {
    backgroundColor: '#3d7eff',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  list: { padding: 12, paddingTop: 0, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2332',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a3544',
    gap: 12,
  },
  title: { color: '#e8eef5', fontSize: 15, fontWeight: '600' },
  meta: { color: '#9aa4b2', fontSize: 13, marginTop: 4 },
  amount: { color: '#7dd3a7', fontSize: 15, fontWeight: '700' },
  empty: { color: '#9aa4b2', textAlign: 'center', marginTop: 40 },
  center: { padding: 24, alignItems: 'center' },
  error: { color: '#f0a0a0', marginBottom: 12, textAlign: 'center' },
});
