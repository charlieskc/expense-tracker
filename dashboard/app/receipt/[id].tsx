import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchReceipt } from '@/lib/api';
import { formatDate, formatHkd } from '@/lib/format';
import type { ReceiptDetail } from '@/lib/types';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<ReceiptDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await fetchReceipt(id);
        if (!cancelled) setData(detail);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.merchant}>{data.merchant}</Text>
      <Text style={styles.meta}>
        {formatDate(data.receiptDate)}
        {data.receiptTime ? ` · ${data.receiptTime.slice(0, 8)}` : ''}
        {data.paymentMethod ? ` · ${data.paymentMethod}` : ''}
      </Text>
      <Text style={styles.paid}>{formatHkd(data.actualPaidCents)}</Text>
      <Text style={styles.muted}>actual_paid · {data.currency}</Text>

      <Text style={styles.section}>Line items ({data.items.length})</Text>
      {data.items.length === 0 ? (
        <Text style={styles.muted}>No line items</Text>
      ) : (
        data.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.description || '(no description)'}</Text>
              <Text style={styles.muted}>
                {item.category}
                {item.quantity != null ? ` · qty ${item.quantity}` : ''}
              </Text>
            </View>
            <Text style={styles.amount}>{formatHkd(item.lineTotalCents)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1419' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1419' },
  merchant: { color: '#f5f7fa', fontSize: 22, fontWeight: '700' },
  meta: { color: '#9aa4b2', marginTop: 6 },
  paid: { color: '#7dd3a7', fontSize: 32, fontWeight: '700', marginTop: 16 },
  muted: { color: '#9aa4b2', fontSize: 13, marginTop: 4 },
  section: { color: '#f5f7fa', fontSize: 18, fontWeight: '600', marginTop: 28, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#1a2332',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a3544',
    gap: 12,
  },
  itemTitle: { color: '#e8eef5', fontSize: 15, fontWeight: '500' },
  amount: { color: '#e8eef5', fontWeight: '600' },
  error: { color: '#f0a0a0' },
});
