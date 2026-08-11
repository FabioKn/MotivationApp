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
  View
} from 'react-native';
import ParticleExplosion from '../components/ParticleExplosion';
import TaskForm from '../components/TaskForm';
import TaskList, { Task } from '../components/TaskList';
import { darkTheme, lightTheme, type Theme } from '../constants/theme';
import SoundManager from '../utils/SoundManager';

const { width, height } = Dimensions.get('window');

export default function Home() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [particleKey, setParticleKey] = useState(0);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const soundManagerRef = useRef<SoundManager | null>(null);


  const [forceTheme, setForceTheme] = useState<'light' | 'dark' | null>(null);

  const effectiveIsDark = forceTheme ? forceTheme === 'dark' : isDark;
  const theme: Theme = effectiveIsDark ? darkTheme : lightTheme;

  const styles = createStyles(theme);

  // Sounds initialisieren
  useEffect(() => {
    soundManagerRef.current = new SoundManager();
    soundManagerRef.current.init();

    // Tasks laden
    loadTasks();

    return () => {
      soundManagerRef.current?.cleanup();
    };
  }, []);

  // Tasks speichern beim Update
  useEffect(() => {
    saveTasks();
  }, [tasks]);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('tasks');
      if (stored) {
        const parsed: Task[] = JSON.parse(stored);
        // Überprüfe auf abgelaufene wiederkehrende Tasks
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

    // Sound SOFORT abspielen
    if (!task.completed) {
      soundManagerRef.current?.play('complete');
      setParticleKey((prev) => prev + 1);
    }

      setTasks(
        tasks.map((t) => {
          if (t.id === taskId) {
            const isNowCompleted = !t.completed;
            
            // Streak nur für wiederkehrende Tasks
            let newStreak = t.streak ?? 0;
            if (t.recurring) {
              newStreak = isNowCompleted 
                ? newStreak + 1
                : Math.max(0, newStreak - 1);
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>To-Dos</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {completedCount} von {tasks.length} erledigt
          </Text>
        </View>
  
  <TouchableOpacity
    onPress={() => {
      if (forceTheme === null) {
        setForceTheme(isDark ? 'light' : 'dark');
      } else {
        setForceTheme(null);
      }
    }}
    style={styles.themeButton}
  >
    <Text style={styles.themeIcon}>
      {forceTheme === 'dark' ? '☀️' : forceTheme === 'light' ? '🌙' : (isDark ? '☀️' : '🌙')}
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
          tasks={tasks}
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
    themeButton: {
      padding: 8,
    },
    themeIcon: {
      fontSize: 24,
    },
  });
