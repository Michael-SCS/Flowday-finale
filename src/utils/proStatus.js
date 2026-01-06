import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Definición local de los planes PRO.
// IMPORTANTE: estos valores deben estar alineados con tu backend / proveedor de pagos.
export const PRO_PLANS = {
  trial_7d: {
    id: 'trial_7d',
    label: 'Prueba 7 días',
    durationDays: 7,
    isTrial: true,
    isLifetime: false,
  },
  monthly: {
    id: 'monthly',
    label: 'Mensual',
    durationDays: 30,
    isTrial: false,
    isLifetime: false,
  },
  semiannual: {
    id: 'semiannual',
    label: '6 meses',
    durationDays: 30 * 6,
    isTrial: false,
    isLifetime: false,
  },
  annual: {
    id: 'annual',
    label: 'Anual',
    durationDays: 365,
    isTrial: false,
    isLifetime: false,
  },
  lifetime: {
    id: 'lifetime',
    label: 'De por vida',
    durationDays: null,
    isTrial: false,
    isLifetime: true,
  },
};

function addDays(base, days) {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

// Función pura para consultar el estado PRO del usuario actual
// REQUIERE que la tabla profiles tenga al menos las columnas:
// pro (bool), pro_trial_used (bool), pro_until (timestamp), pro_lifetime (bool)
export async function fetchProStatus() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user ?? null;

  if (!user) {
    return {
      isPro: false,
      trialUsed: false,
      proUntil: null,
      isLifetime: false,
      error: null,
    };
  }

  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('pro, pro_trial_used, pro_until, pro_lifetime')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return {
      isPro: false,
      trialUsed: false,
      proUntil: null,
      isLifetime: false,
      error,
    };
  }

  const isPro = Boolean(profileData?.pro);
  const trialUsed = Boolean(profileData?.pro_trial_used);
  const isLifetime = Boolean(profileData?.pro_lifetime);
  const proUntil = profileData?.pro_until ? new Date(profileData.pro_until) : null;

  return {
    isPro,
    trialUsed,
    proUntil,
    isLifetime,
    error: null,
  };
}

// Aplica localmente la lógica de actualización de perfil según el plan
// Esto asume que YA has validado el pago en tu backend.
export async function applyProPlan(planId) {
  const plan = PRO_PLANS[planId];
  if (!plan) {
    throw new Error(`Plan PRO desconocido: ${planId}`);
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user ?? null;

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Cargamos el estado actual para poder extender períodos si ya es PRO
  const current = await fetchProStatus();

  let pro_until = null;
  let pro_lifetime = false;
  let pro_trial_used = current.trialUsed;

  const now = new Date();
  const baseDate = current.proUntil && current.proUntil > now
    ? current.proUntil
    : now;

  if (plan.isLifetime) {
    pro_lifetime = true;
    pro_until = null;
  } else {
    const days = plan.durationDays || 0;
    const end = addDays(baseDate, days);
    pro_until = end.toISOString();
  }

  if (plan.isTrial) {
    pro_trial_used = true;
  }

  const updatePayload = {
    pro: true,
    pro_lifetime,
    pro_trial_used,
  };

  if (!pro_lifetime && pro_until) {
    updatePayload.pro_until = pro_until;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id);

  if (updateError) {
    throw updateError;
  }
}

// Hook para usar el estado PRO en componentes React
export function useProStatus() {
  const [isPro, setIsPro] = useState(null); // null = cargando / desconocido
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    trialUsed: false,
    proUntil: null,
    isLifetime: false,
  });

  async function refresh() {
    try {
      setLoading(true);
      const { isPro, trialUsed, proUntil, isLifetime, error } = await fetchProStatus();
      setIsPro(isPro);
      setMeta({ trialUsed, proUntil, isLifetime });
      setError(error);
    } catch (e) {
      setIsPro(false);
      setMeta({ trialUsed: false, proUntil: null, isLifetime: false });
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;
      await refresh();
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isPro,
    error,
    loading,
    trialUsed: meta.trialUsed,
    proUntil: meta.proUntil,
    isLifetime: meta.isLifetime,
    refresh,
  };
}
