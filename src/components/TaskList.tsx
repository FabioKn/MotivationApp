import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Theme } from '../constants/theme';
import { translations, type Language } from '../constants/translations';

type Translation = (typeof translations)[Language];

export interface Task {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  completed: boolean;
  // Either dueDate OR recurring
  dueDate?: string | null; // ISO date string (YYYY-MM-DD)
  recurring?: boolean;
  recurringDays?: number;
  streak?: number;
  createdAt: string;
  lastCompleted?: string | null;
}

interface TaskListProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  theme: Theme;
  t: Translation;
}

// Hilfsunktionen für Datum-Formatierung
const formatDueDate = (dateString: string, t: Translation): string => {
  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t.today;
  if (diffDays === 1) return t.tomorrow;
  if (diffDays === -1) return `${t.overdueSince} 1 ${t.days}`;
  if (diffDays < -1) return `${t.overdueSince} ${Math.abs(diffDays)} ${t.days}`;

  const locale = t === translations.en ? 'en-US' : 'de-DE';
  const weekday = dueDate.toLocaleDateString(locale, { weekday: 'long' });

  if (diffDays <= 7) {
    return `${t.dueOn} ${weekday}`;
  }

  const formatted = dueDate.toLocaleDateString(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });

  return `${t.dueOn} ${formatted}`;
};

const formatNextDate = (baseDate: string, recurringDays: number | undefined, t: Translation): string => {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + (recurringDays || 1));
  return formatDueDate(nextDate.toISOString().split('T')[0], t);
};

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onComplete,
  onDelete,
  onEdit,
  theme,
  t,
}) => {
  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {t.noTasks}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onComplete={() => onComplete(task.id)}
          onDelete={() => onDelete(task.id)}
          onEdit={() => onEdit(task)}
          theme={theme}
          t={t}
        />
      ))}
    </View>
  );
};

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  theme: Theme;
  t: Translation;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onDelete,
  onEdit,
  theme,
  t,
}) => {
  const cardStyles = createTaskCardStyles(theme);

  // Für wiederkehrende Tasks: nutze lastCompleted oder createdAt als Basis
  const recurringBaseDate = task.lastCompleted || task.createdAt.split('T')[0];

  return (
    <View
      style={[
        cardStyles.card,
        task.completed && cardStyles.cardCompleted,
      ]}
    >
      <View style={cardStyles.content}>
        <TouchableOpacity
          style={cardStyles.checkButton}
          onPress={onComplete}
          activeOpacity={0.7}
        >
          <View
            style={[
              cardStyles.checkbox,
              task.completed && cardStyles.checkboxCompleted,
            ]}
          >
            {task.completed && <Text style={cardStyles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <View style={cardStyles.textContainer}>
          <Text
            style={[
              cardStyles.taskName,
              task.completed && cardStyles.taskNameCompleted,
            ]}
          >
            {task.emoji ? `${task.emoji} ` : ''}
            {task.name}
          </Text>

          {task.description && (
            <Text style={[cardStyles.description, { color: theme.textSecondary }]}>
              {task.description}
            </Text>
          )}

          {task.dueDate && !task.recurring && (
            <Text style={[cardStyles.dueDate, { color: theme.textSecondary }]}>
              {formatDueDate(task.dueDate, t)}
            </Text>
          )}

          {task.recurring && (
            <Text style={[cardStyles.recurring, { color: theme.textSecondary }]}>
              {`${t.everyXDays.replace('{count}', String(task.recurringDays || 1))}`}
              {` · ${formatNextDate(recurringBaseDate, task.recurringDays, t)}`}
            </Text>
          )}

          {(task.streak ?? 0) > 0 && (
            <View style={cardStyles.streakBadge}>
              <Text style={cardStyles.streakText}>🔥 {task.streak}</Text>
            </View>
          )}

          {task.recurring && task.completed && task.lastCompleted && (() => {
            const lastDate = new Date(task.lastCompleted);
            const today = new Date();
            const daysSince = Math.floor(
              (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const daysUntilReset = (task.recurringDays ?? 1) - daysSince;

            return daysUntilReset > 0 ? (
              <View style={cardStyles.resetBadge}>
                <Text style={cardStyles.resetText}>⏳ {t.inDaysAgain.replace('{count}', String(daysUntilReset))}</Text>
              </View>
            ) : null;
          })()}
        </View>
      </View>

      <View style={cardStyles.actions}>
        <TouchableOpacity
          style={[cardStyles.actionButton, cardStyles.editButton]}
          onPress={onEdit}
        >
          <Text style={cardStyles.actionText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[cardStyles.actionButton, cardStyles.deleteButton]}
          onPress={onDelete}
        >
          <Text style={cardStyles.actionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createTaskCardStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    cardCompleted: {
      opacity: 0.6,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    checkButton: {
      padding: 8,
      marginRight: 12,
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: theme.textSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxCompleted: {
      backgroundColor: theme.completed,
      borderColor: theme.completed,
    },
    checkmark: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    textContainer: {
      flex: 1,
    },
    taskName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    taskNameCompleted: {
      textDecorationLine: 'line-through',
      color: theme.textSecondary,
    },
    description: {
      fontSize: 13,
      marginBottom: 4,
    },
    dueDate: {
      fontSize: 12,
      marginBottom: 6,
      fontStyle: 'italic',
    },
    recurring: {
      fontSize: 12,
      marginBottom: 6,
      fontStyle: 'italic',
    },
    streakBadge: {
      marginTop: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: theme.accent + '20',
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    streakText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.accent,
    },
    resetBadge: {
      marginTop: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: theme.accentLight + '20',
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    resetText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.accentLight,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButton: {
      backgroundColor: theme.accent + '20',
    },
    deleteButton: {
      backgroundColor: theme.warning + '20',
    },
    actionText: {
      fontSize: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      textAlign: 'center',
    },
  });

const styles = StyleSheet.create({
  container: {},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default TaskList;
