import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import ParticleExplosion from '../../src/components/ParticleExplosion';
import TaskForm from '../../src/components/TaskForm';
import TaskList, { Task } from '../../src/components/TaskList';
import { darkTheme, lightTheme, type Theme } from '../../src/constants/theme';
import SoundManager from '../../src/utils/SoundManager';

const { width, height } = Dimensions.get('window');

type SortBy = 'dueDate' | 'streak' | 'type';

export default function Home() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [particleKey, setParticleKey] = useState(0);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');
  const [showCompleted, setShowCompleted] = useState(true);
  const [forceTheme, setForceTheme] = useState<'light' | 'dark' | null>(null);
  const soundManagerRef = useRef<SoundManager | null>(null);

  const effectiveIsDark = forceTheme ? forceTheme === 'dark' : isDark;
  const theme: Theme = effectiveIsDark ? darkTheme : lightTheme;
  const styles = createStyles(theme);

  useEffect(() => {
    soundManagerRef.current = new SoundManager();
    soundManagerRef.current.init();
    loadTasks();

    return () => {
      soundManagerRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    saveTasks();
  }, [tasks]);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('tasks');
      if (stored) {
        const parsed: Task[] = JSON.parse(stored);
        const updated = parsed.map((task) => {
          if (task.recurring && task.lastCompleted) {
            const lastDate = new Date(task.lastCompleted);
            const today = new Date();
            const daysSince = Math.floor(
              (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysSince >= (task.recurringDays || 1)) {
              return { ...task, completed: false };
            }
          }
          return task;
        });
        setTasks(updated);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    }
  };

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const getSortedTasks = () => {
    let filtered = showCompleted ? tasks : tasks.filter((t) => !t.completed);

    return filtered.sort((a, b) => {
      if (sortBy === 'dueDate') {
        // Zuerst offene, dann nach Datum (NÄCHSTE ZUERST!)
        if (a.completed !== b.completed) return a.completed ? 1 : -1;

        const aDate = a.dueDate || a.lastCompleted || a.createdAt;
        const bDate = b.dueDate || b.lastCompleted || b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();  
      } else if (sortBy === 'streak') {
        return (b.streak ?? 0) - (a.streak ?? 0);
      } else if (sortBy === 'type') {
        const aType = a.recurring ? 'recurring' : 'once';
        const bType = b.recurring ? 'recurring' : 'once';
        return aType.localeCompare(bType);
      }
      return 0;
    });
  };

  const addTask = (
    taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'streak' | 'lastCompleted'>
  ) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString(),
      streak: 0,
      lastCompleted: null,
    };
    setTasks([newTask, ...tasks]);
    setShowForm(false);
    soundManagerRef.current?.play('add');
  };

  const updateTask = (
    taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'streak' | 'lastCompleted'>
  ) => {
    if (!editingTask) return;
    setTasks(
      tasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              ...taskData,
            }
          : t
      )
    );
    setEditingTask(null);
    setShowForm(false);
    soundManagerRef.current?.play('add');
  };

  const completeTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!task.completed) {
      setParticleKey((prev) => prev + 1);
      soundManagerRef.current?.play('complete');
    }

    setTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          const isNowCompleted = !t.completed;

          let newStreak = t.streak ?? 0;
          if (t.recurring) {
            newStreak = isNowCompleted ? newStreak + 1 : Math.max(0, newStreak - 1);
          }

          return {
            ...t,
            completed: isNowCompleted,
            streak: newStreak,
            lastCompleted: isNowCompleted ? new Date().toISOString() : t.lastCompleted,
          };
        }
        return t;
      })
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
    soundManagerRef.current?.play('delete');
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const sortedTasks = getSortedTasks();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>To-Dos</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {completedCount} von {tasks.length} erledigt
          </Text>
        </View>

        <TouchableOpacity
          onPress={async () => {
            let newTheme: 'light' | 'dark' | null;
            if (forceTheme === null) {
              newTheme = isDark ? 'light' : 'dark';
            } else {
              newTheme = null;
            }
            setForceTheme(newTheme);
            await AsyncStorage.setItem('forcedTheme', newTheme || 'auto');
          }}
          style={styles.themeButton}
        >
          <Text style={styles.themeIcon}>
            {forceTheme === 'dark' ? '☀️' : forceTheme === 'light' ? '🌙' : isDark ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sortierung & Filter */}
      <View style={[styles.controls, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.sortButtons}>
          {(['dueDate', 'streak', 'type'] as const).map((sort) => (
            <TouchableOpacity
              key={sort}
              style={[
                styles.sortButton,
                sortBy === sort && styles.sortButtonActive,
                {
                  backgroundColor: sortBy === sort ? theme.accent : theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setSortBy(sort)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  { color: sortBy === sort ? '#fff' : theme.text },
                ]}
              >
                {sort === 'dueDate' ? '📅' : sort === 'streak' ? '🔥' : '📋'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: showCompleted ? theme.accent : theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setShowCompleted(!showCompleted)}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: showCompleted ? '#fff' : theme.text },
            ]}
          >
            {showCompleted ? 'Alle' : 'Offen'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Particle Explosion */}
      {particleKey > 0 && <ParticleExplosion key={particleKey} theme={theme} />}

      {/* Tasks */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <TaskList
          tasks={sortedTasks}
          onComplete={completeTask}
          onDelete={deleteTask}
          onEdit={startEditTask}
          theme={theme}
        />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => {
          setEditingTask(null);
          setShowForm(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Task Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForm(false)}
      >
        <TaskForm
          theme={theme}
          onAdd={editingTask ? updateTask : addTask}
          onClose={() => setShowForm(false)}
          editingTask={editingTask}
        />
      </Modal>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '500',
    },
    themeButton: {
      padding: 8,
    },
    themeIcon: {
      fontSize: 24,
    },
    controls: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      gap: 8,
      alignItems: 'center',
    },
    sortButtons: {
      flexDirection: 'row',
      gap: 6,
      flex: 1,
    },
    sortButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sortButtonActive: {},
    sortButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    filterButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    fab: {
      position: 'absolute',
      bottom: 32,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    fabText: {
      fontSize: 32,
      color: '#ffffff',
      fontWeight: '300',
    },
  });
