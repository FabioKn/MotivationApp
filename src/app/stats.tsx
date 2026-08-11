import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';
import type { Task } from '../../src/components/TaskList';
import { darkTheme, lightTheme, type Theme } from '../../src/constants/theme';

export default function Stats() {
  const colorScheme = useColorScheme();
  const theme: Theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekStats, setWeekStats] = useState<Record<string, number>>({});
  const [topStreaks, setTopStreaks] = useState<{ name: string; streak: number }[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('tasks');
      if (stored) {
        const parsed: Task[] = JSON.parse(stored);
        setTasks(parsed);
        calculateStats(parsed);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    }
  };

  const calculateStats = (taskList: Task[]) => {
    // Wochenstatistiken
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const stats: Record<string, number> = {};
    days.forEach((day) => {
      stats[day] = 0;
    });

    const today = new Date();
    taskList.forEach((task) => {
      if (task.lastCompleted) {
        const completedDate = new Date(task.lastCompleted);
        const daysDiff = Math.floor(
          (today.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff < 7) {
          const dayIndex = completedDate.getDay() === 0 ? 6 : completedDate.getDay() - 1;
          stats[days[dayIndex]]++;
        }
      }
    });

    setWeekStats(stats);

    // Top Streaks
    const streaks = taskList
      .filter((t) => (t.streak ?? 0) > 0)
      .sort((a, b) => (b.streak ?? 0) - (a.streak ?? 0))
      .slice(0, 5)
      .map((t) => ({ name: t.name, streak: t.streak ?? 0 }));

    setTopStreaks(streaks);
  };

  const totalCompleted = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const totalStreak = tasks.reduce((sum, t) => sum + (t.streak ?? 0), 0);
  const weekCompleted = Object.values(weekStats).reduce((a, b) => a + b, 0);

  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const maxStat = Math.max(...Object.values(weekStats), 1);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Statistiken</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Cards */}
        <View style={styles.cardGrid}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Erledigt heute</Text>
            <Text style={[styles.cardValue, { color: theme.accent }]}>
              {totalCompleted}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Gesamt Streaks</Text>
            <Text style={[styles.cardValue, { color: theme.accent }]}>
              🔥 {totalStreak}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Diese Woche</Text>
            <Text style={[styles.cardValue, { color: theme.accent }]}>
              {weekCompleted}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Aufgaben</Text>
            <Text style={[styles.cardValue, { color: theme.accent }]}>
              {totalTasks}
            </Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Letzte 7 Tage
          </Text>
          <View style={styles.weekChart}>
            {days.map((day, idx) => {
              const value = weekStats[day] || 0;
              const height = Math.max((value / Math.max(maxStat, 1)) * 100, 5);
              return (
                <View key={day} style={styles.dayColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: theme.accent,
                      },
                    ]}
                  />
                  <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>
                    {day}
                  </Text>
                  <Text style={[styles.dayValue, { color: theme.text }]}>
                    {value}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Streaks */}
        {topStreaks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Top Streaks 🔥
            </Text>
            <View style={styles.streakList}>
              {topStreaks.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.streakItem,
                    {
                      backgroundColor: theme.surface,
                      borderLeftColor: theme.accent,
                    },
                  ]}
                >
                  <Text
                    style={[styles.streakName, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text style={[styles.streakCount, { color: theme.accent }]}>
                    {item.streak}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    card: {
      flex: 1,
      minWidth: '45%',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    cardLabel: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 8,
    },
    cardValue: {
      fontSize: 24,
      fontWeight: '700',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
    },
    weekChart: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 180,
      paddingVertical: 12,
    },
    dayColumn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginHorizontal: 4,
    },
    bar: {
      width: '80%',
      borderRadius: 6,
      marginBottom: 8,
    },
    dayLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    dayValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    streakList: {
      gap: 8,
    },
    streakItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderLeftWidth: 4,
    },
    streakName: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    streakCount: {
      fontSize: 16,
      fontWeight: '700',
    },
  });
