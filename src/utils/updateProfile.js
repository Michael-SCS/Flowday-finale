import { supabase } from './supabase';

/**
 * Updates the authenticated user's row in `profiles`.
 * - Always filters by `id === auth.uid()` (i.e. `user.id`).
 * - Does NOT create profiles.
 * - Does NOT require service role.
 *
 * @param {{ nombre?: string|null, apellido?: string|null, edad?: number|string|null, genero?: string|null }} fields
 * @returns {Promise<any>} Updated profile row (selected fields)
 */
export async function updateProfile(fields) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  const user = session?.user ?? null;
  if (!user) throw new Error('Not authenticated');

  const payload = {};

  if ('nombre' in (fields || {})) payload.nombre = fields.nombre;
  if ('apellido' in (fields || {})) payload.apellido = fields.apellido;
  if ('edad' in (fields || {})) payload.edad = fields.edad;
  if ('genero' in (fields || {})) payload.genero = fields.genero;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select('id, nombre, apellido, edad, genero, email')
    .maybeSingle();

  if (error) throw error;
  return data;
}
