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


/**
 * Fetch all registrations from Supabase, newest first.
 */
export async function fetchRegistrations() {
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("t", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Delete a single registration by id.
 */
export async function deleteRegistration(id) {
  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Delete ALL registrations (admin "Clear All").
 */
export async function deleteAllRegistrations() {
  // Supabase requires a filter for bulk delete; use a truthy condition on id.
  const { error } = await supabase
    .from("registrations")
    .delete()
    .neq("id", "");
  if (error) throw new Error(error.message);
}
