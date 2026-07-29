import {
  EmptyState,
  PremiumCard,
  ScreenHeader,
  SkeletonCard,
} from '@/components/ui';
import { AppSymbol, appSymbolSource } from '@/components/AppSymbol';
import {
  deleteHistoryItem,
  listHistory,
  type HistoryItem,
} from '@/services/historyService';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Chip,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HistoryRow =
  | { type: 'header'; key: string; title: string }
  | { type: 'item'; key: string; item: HistoryItem };

export default function HistoryPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [triggerFilter, setTriggerFilter] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const load = useCallback(async (reset = true) => {
    if (loadingRef.current || (!reset && !hasMoreRef.current)) return;
    loadingRef.current = true;
    if (reset) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const nextOffset = reset ? 0 : offsetRef.current;
      const page = await listHistory(50, nextOffset);
      setItems((current) => (reset ? page : [...current, ...page]));
      offsetRef.current = nextOffset + page.length;
      hasMoreRef.current = page.length === 50;
      setErrorMessage('');
    } catch (error) {
      console.error('Error loading smoking history:', error);
      setErrorMessage('History could not be loaded. Your data is safe—try again.');
    } finally {
      loadingRef.current = false;
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(true); }, [load]));

  const triggers = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.triggers))).slice(0, 8),
    [items],
  );
  const rows = useMemo<HistoryRow[]>(() => {
    const filtered = triggerFilter
      ? items.filter((item) => item.triggers.includes(triggerFilter))
      : items;
    const result: HistoryRow[] = [];
    let previousDay = '';
    filtered.forEach((item) => {
      const date = new Date(item.timestamp);
      const dayKey = date.toLocaleDateString();
      if (dayKey !== previousDay) {
        result.push({
          type: 'header',
          key: `header-${dayKey}`,
          title: date.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }),
        });
        previousDay = dayKey;
      }
      result.push({ type: 'item', key: `item-${item.id}`, item });
    });
    return result;
  }, [items, triggerFilter]);

  const remove = (item: HistoryItem) => Alert.alert(
    'Delete this entry?',
    'Your statistics will update. Linked Rescue details will stay preserved.',
    [
      { text: 'Keep entry', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteHistoryItem(item.id);
          if (!result.success) {
            setErrorMessage('That entry could not be deleted. Please try again.');
            return;
          }
          load(true);
        },
      },
    ],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20 }}>
        <ScreenHeader
          action={<IconButton icon={appSymbolSource('close')} onPress={() => router.back()} />}
          subtitle='Review recorded moments without judgment.'
          title='History'
        />
        {triggers.length > 0 && (
          <FlatList
            contentContainerStyle={styles.filters}
            data={['All', ...triggers]}
            horizontal
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const selected = item === 'All' ? !triggerFilter : triggerFilter === item;
              return (
                <Chip
                  compact
                  mode={selected ? 'flat' : 'outlined'}
                  onPress={() => setTriggerFilter(item === 'All' ? null : item)}
                  selected={selected}
                >
                  {item}
                </Chip>
              );
            }}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>

      {initialLoading && items.length === 0 ? (
        <View style={styles.loading}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 },
          ]}
          data={rows}
          keyExtractor={(row) => row.key}
          ListEmptyComponent={
            <EmptyState
              actionLabel={errorMessage ? 'Try again' : 'Record from Home'}
              message={
                errorMessage ||
                (triggerFilter
                  ? 'No entries match this trigger yet.'
                  : 'Your recorded moments will appear here.')
              }
              icon={errorMessage ? 'cloud-alert-outline' : 'history'}
              onAction={() => {
                if (errorMessage) {
                  void load(true);
                } else {
                  router.push('/(tabs)/home');
                }
              }}
              title={errorMessage ? 'History is resting' : 'Nothing recorded yet'}
            />
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} /> : null}
          onEndReached={() => load(false)}
          renderItem={({ item: row }) => {
            if (row.type === 'header') {
              return (
                <View style={[styles.dayHeader, { backgroundColor: theme.colors.background }]}>
                  <Text variant='titleSmall' style={{ color: theme.colors.onSurfaceVariant }}>
                    {row.title}
                  </Text>
                </View>
              );
            }
            const item = row.item;
            return (
              <PremiumCard style={styles.card}>
                <View style={styles.row}>
                  <View style={[styles.timelineIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <AppSymbol name='clock-outline' size={20} color={theme.colors.onSecondaryContainer} />
                  </View>
                  <View style={styles.grow}>
                    <Text variant='titleMedium'>
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                    {item.triggers.length > 0 && (
                      <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        {item.triggers.join(' · ')}
                      </Text>
                    )}
                    {!!item.note && <Text style={styles.note}>{item.note}</Text>}
                  </View>
                  <IconButton
                    accessibilityLabel='Delete history entry'
                    icon={appSymbolSource('delete-outline')}
                    onPress={() => remove(item)}
                  />
                </View>
              </PremiumCard>
            );
          }}
          stickyHeaderIndices={rows
            .map((row, index) => row.type === 'header' ? index : -1)
            .filter((index) => index >= 0)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { gap: 8, paddingBottom: 12 },
  loading: { gap: 12, padding: 20 },
  list: { paddingHorizontal: 20 },
  dayHeader: { paddingBottom: 8, paddingTop: 14 },
  card: { marginBottom: 10, padding: 14 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  timelineIcon: { alignItems: 'center', borderRadius: 999, height: 40, justifyContent: 'center', width: 40 },
  grow: { flex: 1 },
  note: { marginTop: 6 },
  footer: { marginVertical: 20 },
});
