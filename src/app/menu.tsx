import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { darkTheme, lightTheme, type Theme } from '../constants/theme';
import { translations, type Language } from '../constants/translations';
import { getCurrentLanguage, getStoredLanguage, setStoredLanguage, subscribeToLanguageChanges } from '../utils/language';

export default function Menu() {
  const colorScheme = useColorScheme();
  const [forcedTheme, setForcedTheme] = useState<'light' | 'dark' | null>(null);
  const [language, setLanguage] = useState<Language>(getCurrentLanguage());
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    loadStats();
    loadTheme();
    loadLanguage();

    const unsubscribe = subscribeToLanguageChanges((nextLanguage) => {
      setLanguage(nextLanguage);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Theme NACH forcedTheme berechnen!
  const effectiveIsDark = forcedTheme ? forcedTheme === 'dark' : colorScheme === 'dark';
  const theme: Theme = effectiveIsDark ? darkTheme : lightTheme;
  const styles = createStyles(theme);
  const t = translations[language];

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem('tasks');
      if (stored) {
        const parsed = JSON.parse(stored);
        setTaskCount(parsed.length);
      }
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem('forcedTheme');
      if (stored && stored !== 'auto') {
        setForcedTheme(stored as 'light' | 'dark');
      }
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const loadLanguage = async () => {
    const stored = await getStoredLanguage();
    setLanguage(stored);
  };

  const handleClearData = async () => {
    try {
      await AsyncStorage.removeItem('tasks');
      setTaskCount(0);
      alert(t.deletedSuccess);
    } catch (error) {
      alert(t.deletedError);
    }
  };

  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    await setStoredLanguage(newLang);
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      alert('Link could not be opened');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t.menuTitle}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t.settings}
          </Text>

          {/* Dark Mode Toggle */}
          <View
            style={[
              styles.menuItem,
              { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
          >
            <View>
              <Text style={[styles.menuLabel, { color: theme.text }]}>
                {t.darkMode}
              </Text>
              <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                {forcedTheme ? (forcedTheme === 'dark' ? t.forced : t.light) : t.auto}
              </Text>
            </View>
            <Switch
              value={forcedTheme === 'dark'}
              onValueChange={async (isDark) => {
                const newTheme = isDark ? 'dark' : 'light';
                setForcedTheme(newTheme);
                await AsyncStorage.setItem('forcedTheme', newTheme);
              }}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={forcedTheme === 'dark' ? theme.accentLight : theme.textSecondary}
            />
          </View>

          {/* Language Toggle */}
          <View
            style={[
              styles.menuItem,
              { backgroundColor: theme.surface },
            ]}
          >
            <View>
              <Text style={[styles.menuLabel, { color: theme.text }]}>
                {t.language}
              </Text>
            </View>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[
                  styles.langButton,
                  language === 'de' && styles.langButtonActive,
                  {
                    backgroundColor: language === 'de' ? theme.accent : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleLanguageChange('de')}
              >
                <Text
                  style={[
                    styles.langButtonText,
                    { color: language === 'de' ? '#fff' : theme.text },
                  ]}
                >
                  DE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langButton,
                  language === 'en' && styles.langButtonActive,
                  {
                    backgroundColor: language === 'en' ? theme.accent : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text
                  style={[
                    styles.langButtonText,
                    { color: language === 'en' ? '#fff' : theme.text },
                  ]}
                >
                  EN
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t.information}
          </Text>

          {/* Stats */}
          <View
            style={[
              styles.menuItem,
              { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
          >
            <View>
              <Text style={[styles.menuLabel, { color: theme.text }]}>
                {t.taskCount}
              </Text>
            </View>
            <Text style={[styles.statsValue, { color: theme.accent }]}>
              {taskCount}
            </Text>
          </View>

          {/* Über die App */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
          >
            <Text style={[styles.menuLabel, { color: theme.text }]}>
              {t.aboutApp}
            </Text>
            <Text style={[styles.menuSubtitle, { color: theme.accent }]}>→</Text>
          </TouchableOpacity>

          {/* Version */}
          <View
            style={[
              styles.menuItem,
              { backgroundColor: theme.surface },
            ]}
          >
            <View>
              <Text style={[styles.menuLabel, { color: theme.text }]}>
                {t.version}
              </Text>
            </View>
            <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
              1.0.0
            </Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.text }]}
          >
            {t.dangerZone}
          </Text>

          <TouchableOpacity
            style={[
              styles.dangerButton,
              { backgroundColor: theme.warning + '20', borderColor: theme.warning },
            ]}
            onPress={handleClearData}
          >
            <Text style={[styles.dangerButtonText, { color: theme.warning }]}>
              {t.deleteAllData}
            </Text>
          </TouchableOpacity>

          <Text
            style={[styles.dangerWarning, { color: theme.textSecondary }]}
          >
            {t.deleteWarning}
          </Text>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text
            style={[styles.footerText, { color: theme.textSecondary }]}
          >
            {t.builtWith}
          </Text>
          <Text
            style={[styles.footerSmall, { color: theme.textSecondary }]}
          >
            {t.copyright}
          </Text>
        </View>
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
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginBottom: 1,
      borderBottomWidth: 1,
    },
    menuLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    menuSubtitle: {
      fontSize: 12,
      fontWeight: '400',
    },
    statsValue: {
      fontSize: 18,
      fontWeight: '700',
    },
    languageButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    langButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    langButtonActive: {},
    langButtonText: {
      fontSize: 13,
      fontWeight: '600',
    },
    dangerButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    dangerButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    dangerWarning: {
      fontSize: 12,
      fontStyle: 'italic',
      lineHeight: 16,
    },
    footer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 32,
    },
    footerText: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    footerSmall: {
      fontSize: 12,
    },
  });
