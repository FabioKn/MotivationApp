import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../../src/constants/theme';
import { translations, type Language } from '../../src/constants/translations';
import { getCurrentLanguage, getStoredLanguage, subscribeToLanguageChanges } from '../../src/utils/language';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const [language, setLanguage] = useState<Language>(getCurrentLanguage());

  useEffect(() => {
    const loadLanguage = async () => {
      const stored = await getStoredLanguage();
      setLanguage(stored);
    };

    loadLanguage();

    const unsubscribe = subscribeToLanguageChanges((nextLanguage) => {
      setLanguage(nextLanguage);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const t = translations[language];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.toDoTitle,
          tabBarLabel: t.toDoTitle,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t.statsTitle,
          tabBarLabel: t.statsTitle,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t.menuTitle,
          tabBarLabel: t.menuTitle,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
