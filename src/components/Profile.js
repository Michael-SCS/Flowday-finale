import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, TextInput, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
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
        setError('No se pudo obtener el usuario actual.');
        setProfile(null);
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, edad, genero, email')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        setError('No se pudo cargar el perfil.');
        setProfile(null);
        return;
      }

      if (!data) {
        setError('Aún no tienes un perfil configurado.');
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
    } catch {
      setError('Ocurrió un error inesperado al cargar el perfil.');
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
        })
        .eq('id', profile.id)
        .select('id, nombre, apellido, edad, genero, email')
        .maybeSingle();

      if (updateError) {
        setError('No se pudo actualizar el perfil.');
        return;
      }

      if (data) {
        setProfile(data);
        setSuccessMessage('Perfil actualizado correctamente.');
      }
    } catch {
      setError('Ocurrió un error al actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignorar error de logout
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="person" size={28} color="#fff" />
        </View>
        <Text style={styles.title}>Mi perfil</Text>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color="#38BDF8" size="large" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
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
              <Pressable style={styles.reloadButton} onPress={loadProfile}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.reloadButtonText}>Reintentar</Text>
              </Pressable>
            </View>
          )}

          {profile && !error && (
            <>
              {/* CARD INFORMACIÓN */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="information-circle" size={22} color="#38BDF8" />
                  <Text style={styles.cardTitle}>Información personal</Text>
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Nombre</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={18} color="#9ca3af" />
                      <TextInput
                        style={styles.input}
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder="Tu nombre"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Apellido</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={18} color="#9ca3af" />
                      <TextInput
                        style={styles.input}
                        value={apellido}
                        onChangeText={setApellido}
                        placeholder="Tu apellido"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.valueWrapper}>
                      <Ionicons name="mail-outline" size={18} color="#6b7280" />
                      <Text style={styles.value}>{profile.email}</Text>
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Edad</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                      <TextInput
                        style={styles.input}
                        value={edad}
                        onChangeText={setEdad}
                        placeholder="Edad"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Género</Text>
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
                        {genero || 'Selecciona género'}
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

                <Pressable
                  style={[
                    styles.primaryButton,
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
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </Text>
                </Pressable>
              </View>

              {/* CARD ACCIONES */}
              <View style={styles.actionsCard}>
                <Pressable
                  style={styles.linkButton}
                  onPress={() => setShowPolicyModal(true)}
                >
                  <View style={styles.linkButtonContent}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#38BDF8" />
                    <Text style={styles.linkButtonText}>
                      Política de privacidad
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </Pressable>

                <View style={styles.divider} />

                <Pressable style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                  <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
                </Pressable>
              </View>
            </>
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
                <Ionicons name="shield-checkmark" size={24} color="#38BDF8" />
                <Text style={styles.modalTitle}>Política de privacidad</Text>
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
                  Esta aplicación recopila y almacena únicamente la información mínima
                  necesaria para ofrecerte una experiencia personalizada, como tu nombre,
                  correo electrónico y algunos datos opcionales de perfil. No solicitamos
                  información bancaria ni datos especialmente sensibles.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>Uso de datos</Text>
                <Text style={styles.modalText}>
                  Tus datos se guardan en servicios de terceros especializados y solo se
                  utilizan para:
                </Text>
                <View style={styles.bulletList}>
                  <View style={styles.bulletItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#38BDF8" />
                    <Text style={styles.bulletText}>
                      Gestionar tu cuenta y tu autenticación
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#38BDF8" />
                    <Text style={styles.bulletText}>
                      Mostrar y personalizar tu información de perfil
                    </Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#38BDF8" />
                    <Text style={styles.bulletText}>
                      Mejorar y mantener las funcionalidades de la aplicación
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>Compartir información</Text>
                <Text style={styles.modalText}>
                  No compartimos tu información personal con terceros con fines
                  comerciales. Solo podríamos compartir datos en caso de obligación
                  legal, requerimiento de una autoridad competente o para proteger
                  la seguridad e integridad del servicio y de otros usuarios.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>Limitación de responsabilidad</Text>
                <Text style={styles.modalText}>
                  Esta aplicación se ofrece "tal cual" y "según disponibilidad". Aunque
                  trabajamos para mantener el servicio estable y seguro, no podemos
                  garantizar que esté libre de errores, interrupciones o pérdidas de
                  información. El uso de la aplicación es responsabilidad exclusiva del
                  usuario.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>No es asesoramiento profesional</Text>
                <Text style={styles.modalText}>
                  La información mostrada en la aplicación tiene un carácter meramente
                  informativo y de organización personal. No constituye asesoramiento
                  médico, psicológico, nutricional, financiero, jurídico ni de ningún
                  otro tipo profesional. Ante cualquier duda relevante para tu salud o
                  situación personal, consulta siempre con un profesional cualificado.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>Tus derechos</Text>
                <Text style={styles.modalText}>
                  En cualquier momento puedes solicitar la actualización o eliminación
                  de tus datos de perfil. Al cerrar sesión, tu cuenta permanece
                  registrada, pero puedes contactar al soporte de la aplicación si
                  deseas que eliminemos definitivamente tu información, salvo que la
                  ley nos obligue a conservarla durante más tiempo.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>Menores de edad</Text>
                <Text style={styles.modalText}>
                  Si eres menor de edad, debes utilizar la aplicación con el
                  consentimiento y supervisión de tu madre, padre o tutor legal. No
                  recopilamos intencionadamente información personal de menores sin
                  dicho consentimiento.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySubtitle}>Cambios en la política</Text>
                <Text style={styles.modalText}>
                  Podemos actualizar esta política de privacidad cuando sea necesario
                  para reflejar cambios en la ley, en la aplicación o en la forma en
                  que tratamos tus datos. Cuando haya cambios relevantes, procuraremos
                  avisarte dentro de la propia aplicación.
                </Text>
              </View>

              <View style={[styles.policySection, styles.acceptanceSection]}>
                <Text style={styles.modalText}>
                  Al continuar usando la aplicación declaras haber leído y comprendido
                  esta política de privacidad y aceptas el tratamiento de tus datos y
                  las limitaciones de responsabilidad aquí descritas.
                </Text>
              </View>
            </ScrollView>

            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowPolicyModal(false)}
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.modalCloseButtonText}>Entendido</Text>
            </Pressable>
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
              Selecciona tu género
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
    paddingTop: 24,
    paddingBottom: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 14,
  },
  headerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
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
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
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
    color: '#38BDF8',
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
});