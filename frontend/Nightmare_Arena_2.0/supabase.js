import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

/**
 * Save a registration to Supabase.
 * The `reg` object must already have `id` and `t` set.
 */

export async function saveRegistration(registration) {
  const { error } = await supabase.from("registrations").insert({
    registration_id: registration.id,
    game: registration.g,
    email: registration.mail,
    phone: registration.ph,
    team_name:
      registration.g === "bgmi" ? registration.team : null,
    data: registration,
  });

  if (error) {
    console.error("Supabase registration error:", error);
    throw new Error(error.message);
  }

  return registration;
}

// Fetch registrations for an authenticated admin
export async function fetchRegistrations() {
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Delete one registration by its database ID
export async function deleteRegistration(id) {
  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Delete all registrations — call only after admin confirmation
export async function deleteAllRegistrations() {
  const { error } = await supabase
    .from("registrations")
    .delete()
    .not("id", "is", null);

  if (error) throw error;
}
