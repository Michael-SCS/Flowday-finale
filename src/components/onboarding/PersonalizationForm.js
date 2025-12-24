import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../../utils/supabase';

export default function PersonalizationForm({ navigation }) {
  const [sleepProblems, setSleepProblems] = useState(false);
  const [concentrationProblems, setConcentrationProblems] = useState(false);
  const [stressLevel, setStressLevel] = useState(3);
  const [mainGoal, setMainGoal] = useState('productivity');
  const [loading, setLoading] = useState(false);

  async function savePersonalization() {
    setLoading(true);
    try {
      const user = supabase.auth.user();
      if (!user) throw new Error('Usuario no autenticado');
      const payload = {
        user_id: user.id,
        sleep_problems: sleepProblems,
        concentration_problems: concentrationProblems,
        stress_level: stressLevel,
        main_goal: mainGoal,
      };
      const { error } = await supabase.from('user_onboarding').upsert(payload);
      if (error) throw error;
      navigation.replace('Final');
    } catch (err) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personalización</Text>
      <View style={styles.row}>
        <Text>Problemas para dormir</Text>
        <Switch value={sleepProblems} onValueChange={setSleepProblems} />
      </View>
      <View style={styles.row}>
        <Text>Problemas de concentración</Text>
        <Switch value={concentrationProblems} onValueChange={setConcentrationProblems} />
      </View>
      <View style={{ marginVertical: 12 }}>
        <Text>Nivel de estrés: {stressLevel}</Text>
        <View style={styles.stressRow}>
          {[1,2,3,4,5].map((n) => (
            <TouchableOpacity key={n} style={[styles.stressBtn, stressLevel===n && styles.stressBtnActive]} onPress={() => setStressLevel(n)}>
              <Text style={stressLevel===n ? { color: '#fff' } : {}}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ marginBottom: 12 }}>
        <Text>Objetivo principal</Text>
        {['sleep','productivity','wellbeing','organization'].map((g) => (
          <TouchableOpacity key={g} style={[styles.goalBtn, mainGoal===g && styles.goalBtnActive]} onPress={() => setMainGoal(g)}>
            <Text style={mainGoal===g ? { color: '#fff' } : {}}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={savePersonalization} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Finalizar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, justifyContent:'center' },
  title: { fontSize:22, fontWeight:'700', marginBottom:18 },
  row: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  stressRow: { flexDirection:'row', marginTop:8 },
  stressBtn: { padding:10, borderRadius:8, borderWidth:1, borderColor:'#e5e7eb', marginRight:8 },
  stressBtnActive: { backgroundColor:'#f97316', borderColor:'#f97316' },
  goalBtn: { padding:12, borderRadius:12, borderWidth:1, borderColor:'#e5e7eb', marginTop:8 },
  goalBtnActive: { backgroundColor:'#2563eb', borderColor:'#2563eb' },
  btn: { backgroundColor:'#16a34a', padding:14, borderRadius:999, alignItems:'center', marginTop:16 },
  btnText: { color:'#fff', fontWeight:'700' },
});
