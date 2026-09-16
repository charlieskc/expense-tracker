import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchOverview } from '@/lib/api';
import { formatDate, formatHkd } from '@/lib/format';
import type { OverviewResponse } from '@/lib/types';

export default function OverviewScreen() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const overview = await fetchOverview();
      setData(overview);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading approved spend…</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Could not load overview</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Text style={styles.hint}>
          Start the API: cd dashboard && npm run server (needs DATABASE_URL in .env)
        </Text>
        <Pressable style={styles.button} onPress={() => { setLoading(true); load(); }}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const totals = data!.totals;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); load(); }} />}
    >
      <Text style={styles.heading}>Pantry spend</Text>
      <Text style={styles.sub}>
        Approved receipts · {formatDate(totals.minDate)} → {formatDate(totals.maxDate)}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Total approved</Text>
        <Text style={styles.bigAmount}>{formatHkd(totals.totalPaidCents)}</Text>
        <Text style={styles.muted}>{totals.receiptCount} receipts · metric: actual_paid_cents</Text>
      </View>

      <Text style={styles.section}>By category</Text>
      {data!.byCategory.map((row) => (
        <View key={row.category} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{row.category}</Text>
            <Text style={styles.muted}>{row.itemCount} items</Text>
          </View>
          <Text style={styles.amount}>{formatHkd(row.totalCents)}</Text>
        </View>
      ))}

      <Text style={styles.section}>By merchant</Text>
      {data!.byMerchant.map((row) => (
        <View key={row.merchant} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle} numberOfLines={2}>{row.merchant}</Text>
            <Text style={styles.muted}>{row.receiptCount} receipts</Text>
          </View>
          <Text style={styles.amount}>{formatHkd(row.totalCents)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1419' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0f1419' },
  heading: { color: '#f5f7fa', fontSize: 28, fontWeight: '700', marginBottom: 4 },
  sub: { color: '#9aa4b2', marginBottom: 16 },
  card: {
    backgroundColor: '#1a2332',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a3544',
  },
  cardLabel: { color: '#9aa4b2', fontSize: 14, marginBottom: 6 },
  bigAmount: { color: '#7dd3a7', fontSize: 36, fontWeight: '700', marginBottom: 6 },
  section: { color: '#f5f7fa', fontSize: 18, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  row: {
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
  rowTitle: { color: '#e8eef5', fontSize: 15, fontWeight: '500' },
  amount: { color: '#e8eef5', fontSize: 15, fontWeight: '600' },
  muted: { color: '#9aa4b2', fontSize: 13 },
  errorTitle: { color: '#f5f7fa', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  errorBody: { color: '#f0a0a0', textAlign: 'center', marginBottom: 12 },
  hint: { color: '#9aa4b2', textAlign: 'center', marginBottom: 16, fontSize: 13 },
  button: { backgroundColor: '#3d7eff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
