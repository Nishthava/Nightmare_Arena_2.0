
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("Supabase URL loaded:", Boolean(supabaseUrl));
console.log("Supabase key loaded:", Boolean(supabaseKey));

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are missing.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveRegistration(registration) {
  const { error } = await supabase.from("registrations").insert({
    registration_id: registration.id,
    game: registration.g,
    email: registration.mail,
    phone: registration.ph,
    team_name: registration.g === "bgmi" ? registration.team : null,
    data: registration,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "This registration already exists. Check the email, phone, or team name."
      );
    }
    throw new Error(error.message);
  }

  return registration;
}
