import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../../utils/supabase';
import { useSettings } from '../../utils/settingsContext';
import { useI18n } from '../../utils/i18n';

export default function AppSettings({ navigation, route }) {
  const { t } = useI18n();
  const profile = route.params?.profile || {};
  const { language: currentLanguage, themeMode: currentThemeMode, setLanguage, setThemeMode, setLanguageTemp } = useSettings();

  // If we came here directly from the slides, force the UI to show English
  // so the language choice step is presented in English.
  useEffect(() => {
    if (route.params?.from === 'slides') {
      try {
        setLanguageTemp('en');
      } catch {}
    }
  }, []);

  const [loading, setLoading] = useState(false);

  const Option = ({ onPress, active, children, fullWidth = false }) => {
    const isDark = currentThemeMode === 'dark';
    
    return (
      <TouchableOpacity
        style={[
          styles.optBtn,
          fullWidth && styles.optBtnFull,
          {
            backgroundColor: active 
              ? (isDark ? '#6366f1' : '#4f46e5')
              : (isDark ? '#1e293b' : '#ffffff'),
            borderColor: active 
              ? (isDark ? '#818cf8' : '#6366f1')
              : (isDark ? '#334155' : '#e2e8f0'),
            shadowColor: active ? '#6366f1' : '#000',
            shadowOpacity: active ? 0.3 : 0.05,
            shadowOffset: { width: 0, height: active ? 4 : 2 },
            shadowRadius: active ? 8 : 4,
            elevation: active ? 8 : 2,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.optText,
            {
              color: active 
                ? '#ffffff'
                : (isDark ? '#e2e8f0' : '#334155'),
              fontWeight: active ? '700' : '600',
            }
          ]}
        >
          {children}
        </Text>
      </TouchableOpacity>
    );
  };

  async function finish() {
    setLoading(true);
    try {
      // If we arrived here directly from the slides OR from login 'no account',
      // don't require an authenticated user: continue the onboarding to registration.
      if (!route.params?.profile && (route.params?.from === 'slides' || route.params?.from === 'login_no_account')) {
        navigation.replace('Register', { fromSettings: true });
        return;
      }

      // If we have a profile payload but no authenticated user, forward to Register
      if (route.params?.profile && !route.params?.fromSettings) {
        navigation.replace('Register', { profile: route.params.profile });
        return;
      }

      // Otherwise, save profile (user should be logged in at this point)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Usuario no autenticado');

      const payload = {
        id: user.id,
        nombre: profile.nombre || '',
        apellido: profile.apellido || '',
        edad: profile.edad || null,
        genero: profile.genero || null,
        email: user.email,
        language: currentLanguage,
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;

      navigation.replace('Final');
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  }

  const isDark = currentThemeMode === 'dark';

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
          {t('profile.settingsModalTitle')}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          Personaliza tu experiencia
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.icon}>🌍</Text>
            <Text style={[styles.label, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              {t('profile.appLanguage')}
            </Text>
          </View>
          <View style={styles.optionsGrid}>
            <Option onPress={() => setLanguage('es')} active={currentLanguage === 'es'}>
              🇪🇸 {t('profile.languageEs')}
            </Option>
            <Option onPress={() => setLanguage('en')} active={currentLanguage === 'en'}>
              🇬🇧 {t('profile.languageEn')}
            </Option>
            <Option onPress={() => setLanguage('pt')} active={currentLanguage === 'pt'}>
              🇧🇷 {t('profile.languagePt')}
            </Option>
            <Option onPress={() => setLanguage('fr')} active={currentLanguage === 'fr'}>
              🇫🇷 {t('profile.languageFr')}
            </Option>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.icon}>🎨</Text>
            <Text style={[styles.label, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              {t('profile.appearanceMode')}
            </Text>
          </View>
          <View style={styles.row}>
            <Option onPress={() => setThemeMode('light')} active={currentThemeMode === 'light'}>
              ☀️ {t('profile.appearanceLight')}
            </Option>
            <Option onPress={() => setThemeMode('dark')} active={currentThemeMode === 'dark'}>
              🌙 {t('profile.appearanceDark')}
            </Option>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.saveBtn,
          { 
            backgroundColor: isDark ? '#10b981' : '#16a34a',
            opacity: loading ? 0.7 : 1,
          }
        ]} 
        onPress={finish} 
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.saveText}>
          {loading ? '⏳ ' + t('profile.saving') : '✓ ' + t('profile.save')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  optionsGrid: {
    gap: 10,
  },
  optBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  optBtnFull: {
    flex: 1,
  },
  optText: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  saveBtn: {
    marginTop: 16,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: -0.3,
  },
});