import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, TextInput, Modal, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { useSettings, getAccentColor } from '../utils/settingsContext';
import { useI18n, translate } from '../utils/i18n';
import { clearLocalHabits } from '../utils/localHabits';
import { clearActivities } from '../utils/localActivities';
import { clearHabitCache } from '../utils/habitCache';

export default function ProfileScreen() {
  const { themeColor, language, setThemeColor, setLanguage } = useSettings();
  const { t } = useI18n();
  const accent = getAccentColor(themeColor);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [languageValue, setLanguageValue] = useState(language || 'es');
  const genderOptions = [
    'Masculino',
    'Femenino',
    'No binario',
    'Género fluido',
    'Prefiero no decirlo',
    'Otro',
  ];

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(t('profile.loadUserError'));
        setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, edad, genero, email, language')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        setError(t('profile.loadProfileError'));
        setProfile(null);
        return;
      }

      if (!data) {
        setError(t('profile.noProfileConfigured'));
        setProfile(null);
        return;
      }

      setProfile(data);
      setNombre(data.nombre || '');
      setApellido(data.apellido || '');
      setEdad(
        data.edad !== null && data.edad !== undefined ? String(data.edad) : ''
      );
      setGenero(data.genero || '');
      if (data.language) {
        setLanguageValue(data.language);
        setLanguage(data.language);
      }
    } catch {
      setError(t('profile.unexpectedLoadError'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const edadNumber = edad ? parseInt(edad, 10) : null;

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          nombre: nombre || profile.nombre,
          apellido: apellido || null,
          edad: Number.isNaN(edadNumber) ? null : edadNumber,
          genero: genero || null,
          language: languageValue || 'es',
        })
        .eq('id', profile.id)
        .select('id, nombre, apellido, edad, genero, email, language')
        .maybeSingle();

      if (updateError) {
        setError(t('profile.updateError'));
        return;
      }

      if (data) {
        setProfile(data);
        const nextLanguage = data.language || languageValue || language || 'es';
        // Mostrar el mensaje en el idioma destino que acaba de guardar
        setSuccessMessage(translate('profile.updated', nextLanguage));
        if (data.language) {
          setLanguage(data.language);
        }
        // Cerrar el modal de ajustes tras guardar correctamente
        setShowSettingsModal(false);
      }
    } catch {
      setError(t('profile.unexpectedUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Limpiar caches y datos locales asociados al usuario actual
      try {
        await clearHabitCache();
        await clearLocalHabits();
        await clearActivities();
      } catch {
        // ignorar errores locales de limpieza
      }

      await supabase.auth.signOut();
    } catch {
      // ignorar error de logout
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      {/* PORTADA / BANNER */}
      <View style={styles.coverContainer}>
        <Image
          source={require('../../assets/Banner.png')}
          style={styles.coverImage}
          resizeMode="cover"
        />
        <Pressable
          style={styles.coverSettingsButton}
          onPress={() => setShowSettingsModal(true)}
        >
          <Ionicons name="settings-outline" size={22} color={accent} />
        </Pressable>
      </View>

      {/* AVATAR PRINCIPAL */}
      <View style={styles.profileAvatarWrapper}>
        <View
          style={[
            styles.profileAvatarLarge,
            { backgroundColor: accent, shadowColor: accent },
          ]}
        >
          <Image
            source={require('../../assets/mascota_saludando.png')}
            style={styles.profileAvatarImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={accent} size="large" />
          <Text style={styles.loadingText}>{t('profile.loading')}</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.cardError}>
              <View style={styles.errorHeader}>
                <Ionicons name="alert-circle" size={24} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
              <Pressable
                style={[
                  styles.reloadButton,
                  { backgroundColor: accent, shadowColor: accent },
                ]}
                onPress={loadProfile}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.reloadButtonText}>{t('profile.retry')}</Text>
              </Pressable>
            </View>
          )}

          {profile && !error && (
            <View style={styles.profileSummaryCard}>
              <View style={styles.profileSummaryTextContainer}>
                <Text style={styles.profileName}>
                  {(profile.nombre || 'Tu nombre') + (profile.apellido ? ` ${profile.apellido}` : '')}
                </Text>
                <Text style={styles.profileEmail}>{profile.email}</Text>
                <View style={styles.profileMetaRow}>
                  {edad ? (
                    <Text style={styles.profileMetaText}>{edad} años</Text>
                  ) : null}
                  {genero ? (
                    <Text style={styles.profileMetaTextSeparator}>•</Text>
                  ) : null}
                  {genero ? (
                    <Text style={styles.profileMetaText}>{genero}</Text>
                  ) : null}
                </View>
                <View style={styles.profileChipsRow}>
                  <View style={styles.profileChip}>
                    <Ionicons name="color-palette" size={14} color={accent} />
                    <Text style={styles.profileChipText}>
                      {t('profile.themeChipLabel')}: {themeColor}
                    </Text>
                  </View>
                  <View style={styles.profileChip}>
                    <Ionicons name="globe-outline" size={14} color={accent} />
                    <Text style={styles.profileChipText}>
                      {t('profile.languageChipLabel')}: {languageValue.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.profileHintText}>{t('profile.profileHint')}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL POLÍTICA */}
      <Modal
        visible={showPolicyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <View 
          style={styles.modalOverlay}
        >
          <View 
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleContainer}>
                  <Ionicons name="shield-checkmark" size={24} color={accent} />
                <Text style={styles.modalTitle}>{t('profile.privacyPolicy')}</Text>
              </View>
              <Pressable 
                onPress={() => setShowPolicyModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator
            >
              <View style={styles.policySection}>
                <Text style={styles.modalText}>
                  {language === 'en'
                    ? 'This app collects and stores only the minimum information needed to offer you a personalized experience, such as your name, email address and some optional profile data. We do not request banking information or other highly sensitive data.'
                    : 'Esta aplicación recopila y almacena únicamente la información mínima necesaria para ofrecerte una experiencia personalizada, como tu nombre, correo electrónico y algunos datos opcionales de perfil. No solicitamos información bancaria ni datos especialmente sensibles.'}
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>
                  {language === 'en' ? 'Use of data' : 'Uso de datos'}
                </Text>
                <Text style={styles.modalText}>
                  {language === 'en'
                    ? 'Your data is stored in specialized third-party services and is only used to:'
                    : 'Tus datos se guardan en servicios de terceros especializados y solo se utilizan para:'}
                </Text>
                <View style={styles.bulletList}>
                  <View style={styles.bulletItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={accent}
                    />
                    <Text style={styles.bulletText}>
                      {language === 'en'
                        ? 'Manage your account and authentication'
                        : 'Gestionar tu cuenta y tu autenticación'}
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={accent}
                    />
                    <Text style={styles.bulletText}>
                      {language === 'en'
                        ? 'Display and personalize your profile information'
                        : 'Mostrar y personalizar tu información de perfil'}
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={accent}
                    />
                    <Text style={styles.bulletText}>
                      {language === 'en'
                        ? 'Improve and maintain the features of the app'
                        : 'Mejorar y mantener las funcionalidades de la aplicación'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>
                  {language === 'en' ? 'Sharing information' : 'Compartir información'}
                </Text>
                <Text style={styles.modalText}>
                  {language === 'en'
                    ? 'We do not share your personal information with third parties for commercial purposes. We would only share data if legally required, in response to a request from a competent authority, or to protect the security and integrity of the service and other users.'
                    : 'No compartimos tu información personal con terceros con fines comerciales. Solo podríamos compartir datos en caso de obligación legal, requerimiento de una autoridad competente o para proteger la seguridad e integridad del servicio y de otros usuarios.'}
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>
                  {language === 'en'
                    ? 'Limitation of liability'
                    : 'Limitación de responsabilidad'}
                </Text>
                <Text style={styles.modalText}>
                  {language === 'en'
                    ? 'This app is provided “as is” and “as available”. Although we work to keep the service stable and secure, we cannot guarantee that it is free of errors, interruptions or data loss. Your use of the app is entirely at your own risk.'
                    : 'Esta aplicación se ofrece "tal cual" y "según disponibilidad". Aunque trabajamos para mantener el servicio estable y seguro, no podemos garantizar que esté libre de errores, interrupciones o pérdidas de información. El uso de la aplicación es responsabilidad exclusiva del usuario.'}
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>
                  {language === 'en'
                    ? 'Not professional advice'
                    : 'No es asesoramiento profesional'}
                </Text>
                <Text style={styles.modalText}>
                  {language === 'en'
                    ? 'The information shown in the app is for personal organization and informational purposes only. It does not constitute medical, psychological, nutritional, financial, legal or any other type of professional advice. Always consult a qualified professional for any matter relevant to your health or personal situation.'
                    : 'La información mostrada en la aplicación tiene un carácter meramente informativo y de organización personal. No constituye asesoramiento médico, psicológico, nutricional, financiero, jurídico ni de ningún otro tipo profesional. Ante cualquier duda relevante para tu salud o situación personal, consulta siempre con un profesional cualificado.'}
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>
                  {language === 'en' ? 'Your rights' : 'Tus derechos'}
                </Text>
                <Text style={styles.modalText}>
                  {language === 'en'
                    ? 'You can request the update or deletion of your profile data at any time. When you log out, your account remains registered, but you can contact the app support team if you want us to permanently delete your information, except where the law requires us to retain it for longer.'
                    : 'En cualquier momento puedes solicitar la actualización o eliminación de tus datos de perfil. Al cerrar sesión, tu cuenta permanece registrada, pero puedes contactar al soporte de la aplicación si deseas que eliminemos definitivamente tu información, salvo que la ley nos obligue a conservarla durante más tiempo.'}
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>
                  {language === 'en' ? 'Minors' : 'Menores de edad'}
                </Text>
                <Text style={styles.modalText}>
                  {language === 'en'
                    ? 'If you are a minor, you must use the app with the consent and supervision of your parent or legal guardian. We do not knowingly collect personal information from minors without such consent.'
                    : 'Si eres menor de edad, debes utilizar la aplicación con el consentimiento y supervisión de tu madre, padre o tutor legal. No recopilamos intencionadamente información personal de menores sin dicho consentimiento.'}
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>
                  {language === 'en'
                    ? 'Changes to this policy'
                    : 'Cambios en la política'}
                </Text>
                <Text style={styles.modalText}>
                  {language === 'en'
                    ? 'We may update this privacy policy when necessary to reflect changes in the law, in the app, or in how we process your data. When there are important changes, we will try to notify you within the app.'
                    : 'Podemos actualizar esta política de privacidad cuando sea necesario para reflejar cambios en la ley, en la aplicación o en la forma en que tratamos tus datos. Cuando haya cambios relevantes, procuraremos avisarte dentro de la propia aplicación.'}
                </Text>
              </View>

              <View style={[styles.policySection, styles.acceptanceSection]}>
                <Text style={styles.modalText}>
                  {language === 'en'
                    ? 'By continuing to use the app, you declare that you have read and understood this privacy policy and that you accept the processing of your data and the limitations of liability described here.'
                    : 'Al continuar usando la aplicación declaras haber leído y comprendido esta política de privacidad y aceptas el tratamiento de tus datos y las limitaciones de responsabilidad aquí descritas.'}
                </Text>
              </View>
            </ScrollView>

            <Pressable
              style={[
                styles.modalCloseButton,
                { backgroundColor: accent, shadowColor: accent },
              ]}
              onPress={() => setShowPolicyModal(false)}
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.modalCloseButtonText}>
                {t('profile.policyAccept')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL AJUSTES PERFIL / APP */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <View style={styles.modalTitleContainer}>
                <Ionicons name="settings" size={24} color={accent} />
                <Text style={styles.modalTitle}>
                  {t('profile.settingsModalTitle')}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowSettingsModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close-circle" size={28} color="#6b7280" />
              </Pressable>
            </View>

            <View style={styles.settingsBodyWrapper}>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator
              >
              {/* CARD INFORMACIÓN */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="information-circle" size={22} color={accent} />
                  <Text style={styles.cardTitle}>{t('profile.personalInfo')}</Text>
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.firstName')}</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={18} color="#9ca3af" />
                      <TextInput
                        style={styles.input}
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder={t('profile.firstName')}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.lastName')}</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={18} color="#9ca3af" />
                      <TextInput
                        style={styles.input}
                        value={apellido}
                        onChangeText={setApellido}
                        placeholder={t('profile.lastName')}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.email')}</Text>
                    <View style={styles.valueWrapper}>
                      <Ionicons name="mail-outline" size={18} color="#6b7280" />
                      <Text style={styles.value}>{profile?.email}</Text>
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.age')}</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                      <TextInput
                        style={styles.input}
                        value={edad}
                        onChangeText={setEdad}
                        placeholder={t('profile.age')}
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.gender')}</Text>
                    <Pressable
                      style={styles.genderSelect}
                      onPress={() => setShowGenderModal(true)}
                    >
                      <Text
                        style={
                          genero
                            ? styles.genderValue
                            : styles.genderPlaceholder
                        }
                      >
                        {genero || t('profile.genderPlaceholder')}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color="#6b7280"
                      />
                    </Pressable>
                  </View>
                </View>

                {successMessage && (
                  <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                )}
              </View>

              {/* CARD PERSONALIZACIÓN */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="color-palette" size={22} color={accent} />
                  <Text style={styles.cardTitle}>{t('profile.customization')}</Text>
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.interfaceColor')}</Text>
                    <View style={styles.themeRow}>
                      {[
                        { key: 'blue', label: t('profile.colorBlue'), color: '#38BDF8' },
                        { key: 'pink', label: t('profile.colorPink'), color: '#FB7185' },
                        { key: 'yellow', label: t('profile.colorYellow'), color: '#FACC15' },
                        { key: 'purple', label: t('profile.colorPurple'), color: '#A855F7' },
                        { key: 'teal', label: t('profile.colorTeal'), color: '#14B8A6' },
                      ].map((opt) => {
                        const isActive = opt.key === themeColor;
                        return (
                          <Pressable
                            key={opt.key}
                            style={[
                              styles.themeOption,
                              isActive && styles.themeOptionActive,
                            ]}
                            onPress={() => setThemeColor(opt.key)}
                          >
                            <View
                              style={[
                                styles.themeColorDot,
                                { backgroundColor: opt.color },
                              ]}
                            />
                            <Text
                              style={[
                                styles.themeLabel,
                                isActive && styles.themeLabelActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>{t('profile.appLanguage')}</Text>
                    <View style={styles.languageRow}>
                      {[
                        { key: 'es', label: t('profile.languageEs') },
                        { key: 'en', label: t('profile.languageEn') },
                      ].map((opt) => {
                        const isActive = opt.key === languageValue;
                        return (
                          <Pressable
                            key={opt.key}
                            style={[
                              styles.languageChip,
                              isActive && styles.languageChipActive,
                            ]}
                            onPress={() => setLanguageValue(opt.key)}
                          >
                            <Text
                              style={[
                                styles.languageChipText,
                                isActive && styles.languageChipTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>

              {/* CARD ACCIONES */}
              <View style={styles.actionsCard}>
                <Pressable
                  style={styles.linkButton}
                  onPress={() => setShowPolicyModal(true)}
                >
                  <View style={styles.linkButtonContent}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color={accent}
                    />
                    <Text
                      style={[
                        styles.linkButtonText,
                        { color: accent },
                      ]}
                    >
                      {t('profile.privacyPolicy')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </Pressable>

                <View style={styles.divider} />

                <Pressable
                  style={[
                    styles.logoutButton,
                    { borderColor: accent, backgroundColor: `${accent}20` },
                  ]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color={accent} />
                  <Text
                    style={[
                      styles.logoutButtonText,
                      { color: accent },
                    ]}
                    >
                    {t('profile.logout')}
                  </Text>
                </Pressable>
              </View>
                <View style={{ height: 96 }} />
              </ScrollView>

              {/* BOTÓN FLOTANTE GUARDAR CAMBIOS */}
              <View style={styles.settingsFloatingFooter}>
                <Pressable
                  style={[
                    styles.primaryButton,
                    styles.primaryButtonFloating,
                    { backgroundColor: accent, shadowColor: accent },
                    saving && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Ionicons
                    name={saving ? 'hourglass' : 'save'}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.primaryButtonText}>
                    {saving ? t('profile.saving') : t('profile.save')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL GÉNERO */}
      <Modal
        visible={showGenderModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowGenderModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowGenderModal(false)}
        >
          <Pressable
            style={styles.genderModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.genderModalTitle}>
              {t('register.genderModalTitle') || 'Selecciona tu género'}
            </Text>
            {genderOptions.map((option) => (
              <Pressable
                key={option}
                style={styles.genderOption}
                onPress={() => {
                  setGenero(option);
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.genderOptionText}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
  },

  // Portada
  coverContainer: {
    width: '100%',
    height: 140,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    marginBottom: 48,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverSettingsButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  profileAvatarWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: -44,
    marginBottom: 16,
  },

  // Header estilo perfil
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  headerSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Tarjeta resumen de perfil
  profileSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatarLarge: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  profileAvatarImage: {
    width: '70%',
    height: '70%',
  },
  profileSummaryTextContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  profileEmail: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  profileMetaText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  profileMetaTextSeparator: {
    fontSize: 13,
    color: '#9ca3af',
  },
  profileChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  profileChipText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },
  profileHintText: {
    marginTop: 14,
    fontSize: 12,
    color: '#9ca3af',
  },

  // Loading
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '500',
  },

  // Scroll
  scrollContent: {
    paddingBottom: 20,
  },

  // Error Card
  cardError: {
    backgroundColor: '#fef2f2',
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: '#fecaca',
    gap: 16,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },

  // Fields
  fieldGroup: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fafafa',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  valueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: '#4b5563',
    fontWeight: '500',
  },
  genderChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  genderChipActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#dbeafe',
  },
  genderChipText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  genderChipTextActive: {
    color: '#b91c1c',
  },
  genderSelect: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  genderPlaceholder: {
    color: '#9ca3af',
    fontSize: 15,
  },
  genderModalContent: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  genderModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#111827',
  },
  genderOption: {
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  genderOptionText: {
    fontSize: 15,
    color: '#111827',
    textAlign: 'center',
  },
  genderSelect: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderValue: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  genderPlaceholder: {
    color: '#9ca3af',
    fontSize: 15,
  },
  genderModalContent: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  genderModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#111827',
  },
  genderOption: {
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  genderOptionText: {
    fontSize: 15,
    color: '#111827',
    textAlign: 'center',
  },

  // Success
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  successText: {
    flex: 1,
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonFloating: {
    marginTop: 0,
    width: '100%',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Settings modal floating footer
  settingsBodyWrapper: {
    flex: 1,
  },
  settingsFloatingFooter: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'ios' ? 24 : 16,
  },

  // Actions Card
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  linkButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'android' ? 24 : 0,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f3f4f6',
    position: 'relative',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    marginBottom: 16,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  modalClose: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalScrollContent: {
    paddingBottom: 28,
  },
  policySection: {
    marginBottom: 20,
  },
  policySubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalText: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  bulletList: {
    marginTop: 12,
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletText: {
    flex: 1,
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  acceptanceSection: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fecdd3',
  },
  modalCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#38BDF8',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    gap: 6,
  },
  themeOptionActive: {
    borderColor: '#e5e7eb',
    backgroundColor: '#e5e7eb',
  },
  themeColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeLabel: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  themeLabelActive: {
    color: '#1f2937',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  languageChipActive: {
    borderColor: '#e5e7eb',
    backgroundColor: '#e5e7eb',
  },
  languageChipText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  languageChipTextActive: {
    color: '#1f2937',
  },
});