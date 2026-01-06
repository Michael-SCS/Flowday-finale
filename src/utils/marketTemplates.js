import { supabase } from './supabase';

export async function saveMarketTemplate({
  title,
  items,
}) {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user ?? null;

  if (!user) return;

  // 1️⃣ Crear plantilla
  const { data: template, error } =
    await supabase
      .from('market_templates')
      .insert({
        user_id: user.id,
        title,
      })
      .select()
      .single();

  if (error) {
    console.log('Error template', error);
    return;
  }

  // 2️⃣ Guardar items
  const itemsToInsert = items.map((i) => ({
    template_id: template.id,
    product: i.product,
    quantity: i.quantity,
    price: i.price,
  }));

  await supabase
    .from('market_template_items')
    .insert(itemsToInsert);
}
export async function getMarketTemplates() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user ?? null;

  if (!user) return [];

  const { data, error } = await supabase
    .from('market_templates')
    .select(`
      id,
      title,
      market_template_items (
        product,
        quantity,
        price
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.log(error);
    return [];
  }

  return data;
}
