import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import type { Theme } from '../constants/theme';
import type { Task } from './TaskList';

const { width } = Dimensions.get('window');

const PREDEFINED_TASKS = [
  { name: 'Pflanzen gießen', description: 'Alle Pflanzen gießen', emoji: '🌱' },
  { name: 'Aufräumen', description: 'Zimmer aufräumen', emoji: '🧹' },
  { name: 'Abwasch', description: 'Geschirr spülen', emoji: '🍽️' },
  { name: 'Wäsche waschen', description: 'Wäsche waschen', emoji: '🧺' },
  { name: 'Staubsaugen', description: 'Boden absaugen', emoji: '🧹' },
  { name: 'Lernen', description: 'Schulstoff/Wissen', emoji: '📚' },
  { name: 'Badezimmer putzen', description: 'Bad saubermachen', emoji: '🛁' },
  { name: 'Sport', description: 'Bewegung/Training', emoji: '🏃' },
  { name: 'Lesen', description: 'Zeit zum Lesen', emoji: '📖' },
];

interface TaskFormProps {
  theme: Theme;
  onAdd: (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'streak' | 'lastCompleted'>) => void;
  onClose: () => void;
  editingTask?: Task | null;
}

// Funktion um Datum zu formatieren (YYYY-MM-DD zu DD.MM.YYYY)
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
};

// Funktion um DD.MM.YYYY zu YYYY-MM-DD zu konvertieren
const dateToISOString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TaskForm: React.FC<TaskFormProps> = ({
  theme,
  onAdd,
  onClose,
  editingTask,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('');
  const [taskType, setTaskType] = useState<'once' | 'recurring'>('once');
  const [dueDate, setDueDate] = useState('');
  const [recurringDays, setRecurringDays] = useState('1');
  const [showPredefined, setShowPredefined] = useState(!editingTask);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  const formStyles = createFormStyles(theme);

  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name);
      setDescription(editingTask.description || '');
      setEmoji(editingTask.emoji || '');
      setTaskType(editingTask.recurring ? 'recurring' : 'once');
      setDueDate(editingTask.dueDate || '');
      setRecurringDays((editingTask.recurringDays || 1).toString());
      
      // Setze Picker-Datum wenn dueDate existiert
      if (editingTask.dueDate) {
        setPickerDate(new Date(editingTask.dueDate));
      }
    }
  }, [editingTask]);

  const handleDateConfirm = (date: Date) => {
    const isoString = dateToISOString(date);
    setDueDate(isoString);
    setPickerDate(date);
    setShowDatePicker(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Bitte gib einen Aufgabennamen ein');
      return;
    }

    if (taskType === 'once' && !dueDate) {
      alert('Bitte wähle ein Fälligkeitsdatum');
      return;
    }

    onAdd({
      name: name.trim(),
      description: description.trim(),
      emoji,
      dueDate: taskType === 'once' ? dueDate : null,
      recurring: taskType === 'recurring',
      recurringDays: taskType === 'recurring' ? parseInt(recurringDays) || 1 : undefined,
    });

    setName('');
    setDescription('');
    setEmoji('');
    setTaskType('once');
    setDueDate('');
    setRecurringDays('1');
  };

  const selectPredefined = (task: typeof PREDEFINED_TASKS[0]) => {
    setName(task.name);
    setDescription(task.description);
    setEmoji(task.emoji);
    setShowPredefined(false);
  };

  return (
    <View style={[formStyles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[formStyles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onClose}>
          <Text style={[formStyles.closeButton, { color: theme.accent }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[formStyles.headerTitle, { color: theme.text }]}>
          {editingTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
        </Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        style={formStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Vordefinierte Aufgaben */}
        {showPredefined && !editingTask && (
          <>
            <Text style={[formStyles.sectionTitle, { color: theme.text }]}>
              Schnell hinzufügen
            </Text>
            <View style={formStyles.predefinedGrid}>
              {PREDEFINED_TASKS.map((task, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    formStyles.predefinedButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => selectPredefined(task)}
                >
                  <Text style={formStyles.predefinedEmoji}>{task.emoji}</Text>
                  <Text
                    style={[formStyles.predefinedName, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {task.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={[formStyles.divider, { backgroundColor: theme.border }]}
            />

            <Text style={[formStyles.sectionTitle, { color: theme.text }]}>
              Oder selbst erstellen
            </Text>
          </>
        )}

        {/* Emoji Input */}
        <View>
          <Text style={[formStyles.label, { color: theme.text }]}>
            Emoji (Optional)
          </Text>
          <TextInput
            style={[
              formStyles.emojiInput,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="z.B. 🌱"
            placeholderTextColor={theme.textSecondary}
            value={emoji}
            onChangeText={setEmoji}
            maxLength={2}
          />
          <Text style={[formStyles.sublabel, { color: theme.textSecondary }]}>
            Tippe ein Emoji aus deiner Tastatur
          </Text>
        </View>

        {/* Name Input */}
        <View style={formStyles.spacer}>
          <Text style={[formStyles.label, { color: theme.text }]}>
            Aufgabenname
          </Text>
          <TextInput
            style={[
              formStyles.input,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="z.B. Küche putzen"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Description Input */}
        <View style={formStyles.spacer}>
          <Text style={[formStyles.label, { color: theme.text }]}>
            Beschreibung (Optional)
          </Text>
          <TextInput
            style={[
              formStyles.input,
              formStyles.textarea,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Notizen oder Details..."
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />
        </View>

        {/* Task Type Toggle */}
        <View style={formStyles.typeToggle}>
          <TouchableOpacity
            style={[
              formStyles.typeButton,
              taskType === 'once' && formStyles.typeButtonActive,
              { backgroundColor: taskType === 'once' ? theme.accent : theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setTaskType('once')}
          >
            <Text style={[formStyles.typeButtonText, { color: taskType === 'once' ? '#fff' : theme.text }]}>
              Einmalig
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              formStyles.typeButton,
              taskType === 'recurring' && formStyles.typeButtonActive,
              { backgroundColor: taskType === 'recurring' ? theme.accent : theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setTaskType('recurring')}
          >
            <Text style={[formStyles.typeButtonText, { color: taskType === 'recurring' ? '#fff' : theme.text }]}>
              Wiederkehrend
            </Text>
          </TouchableOpacity>
        </View>

        {/* Einmalig: Date Picker */}
        {taskType === 'once' && (
          <View style={formStyles.spacer}>
            <Text style={[formStyles.label, { color: theme.text }]}>
              Fälligkeitsdatum
            </Text>
            <TouchableOpacity
              style={[
                formStyles.dateButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[formStyles.dateButtonText, { color: theme.text }]}>
                {dueDate ? formatDateForDisplay(dueDate) : '📅 Datum wählen'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={formStyles.datePickerContainer}>
            <View
              style={[
                formStyles.datePickerContent,
                { backgroundColor: theme.background },
              ]}
            >
              <View
                style={[
                  formStyles.datePickerHeader,
                  { borderBottomColor: theme.border },
                ]}
              >
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[formStyles.datePickerClose, { color: theme.accent }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
                <Text style={[formStyles.datePickerTitle, { color: theme.text }]}>
                  Datum wählen
                </Text>
                <View style={{ width: 30 }} />
              </View>

              <View style={formStyles.pickerWrapper}>
                <DatePicker
                  date={pickerDate}
                  onDateChange={setPickerDate}
                  mode="date"
                  locale="de"
                />
              </View>

              <TouchableOpacity
                style={[
                  formStyles.datePickerButton,
                  { backgroundColor: theme.accent },
                ]}
                onPress={() => handleDateConfirm(pickerDate)}
              >
                <Text style={formStyles.datePickerButtonText}>Bestätigen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Wiederkehrend: Tage Input */}
        {taskType === 'recurring' && (
          <View style={formStyles.spacer}>
            <Text style={[formStyles.label, { color: theme.text }]}>
              Alle wieviele Tage?
            </Text>
            <View style={formStyles.recurringButtonGroup}>
              {[1, 2, 3, 7].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    formStyles.recurringButton,
                    {
                      backgroundColor:
                        parseInt(recurringDays) === days
                          ? theme.accent
                          : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setRecurringDays(days.toString())}
                >
                  <Text
                    style={[
                      formStyles.recurringButtonText,
                      {
                        color:
                          parseInt(recurringDays) === days
                            ? '#ffffff'
                            : theme.text,
                      },
                    ]}
                  >
                    {days}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[
                formStyles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Oder Anzahl eingeben..."
              placeholderTextColor={theme.textSecondary}
              value={recurringDays}
              onChangeText={setRecurringDays}
              keyboardType="number-pad"
            />
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          formStyles.footer,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            formStyles.button,
            { backgroundColor: theme.textSecondary + '20' },
          ]}
          onPress={onClose}
        >
          <Text style={[formStyles.buttonText, { color: theme.text }]}>
            Abbrechen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[formStyles.button, { backgroundColor: theme.accent }]}
          onPress={handleSubmit}
        >
          <Text style={[formStyles.buttonText, { color: '#ffffff' }]}>
            {editingTask ? 'Speichern' : 'Hinzufügen'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createFormStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    closeButton: {
      fontSize: 24,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    predefinedGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    predefinedButton: {
      width: (width - 60) / 2,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    predefinedEmoji: {
      fontSize: 32,
      marginBottom: 8,
    },
    predefinedName: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    divider: {
      height: 1,
      marginVertical: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    sublabel: {
      fontSize: 12,
      marginTop: 4,
      fontWeight: '400',
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
    },
    emojiInput: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 24,
      textAlign: 'center',
      height: 50,
    },
    textarea: {
      height: 100,
      paddingTop: 12,
      textAlignVertical: 'top',
    },
    spacer: {
      marginTop: 20,
    },
    typeToggle: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      marginBottom: 20,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    typeButtonActive: {},
    typeButtonText: {
      fontWeight: '600',
      fontSize: 14,
    },
    dateButton: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    dateButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    datePickerContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    datePickerContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
      maxHeight: '80%',
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    datePickerTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    datePickerClose: {
      fontSize: 24,
      fontWeight: '600',
    },
    pickerWrapper: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    datePickerButton: {
      marginHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    datePickerButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    recurringButtonGroup: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    recurringButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recurringButtonText: {
      fontWeight: '600',
      fontSize: 14,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 16,
      borderTopWidth: 1,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
    },
  });

export default TaskForm;
