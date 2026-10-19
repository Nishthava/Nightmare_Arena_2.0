
export async function saveRegistration(data) {
  const isBgmi = data.g === "bgmi";
  const isFc26 = data.g === "fc26";

  if (!isBgmi && !isFc26) {
    throw new Error("Invalid game selected.");
  }

  const registration = {
    game: isBgmi ? "BGMI" : "FC 26",
    team_name: isBgmi ? data.team : null,
    captain_name: isBgmi ? data.cap : null,
    player_name: isFc26 ? data.name : null,
    email: data.mail,
    phone: data.ph,
    players: isBgmi
      ? data.pl.map((p) => ({
          name: p.n,
          uid: p.u,
        }))
      : [
          {
            name: data.name,
            ign: data.ign || "",
          },
          ...data.mates.map((m) => ({
            name: m.n,
            ign: m.i || "",
          })),
        ],
  };

  const { data: saved, error } = await supabase
    .from("registrations")
    .insert(registration)
    .select("id")
    .single();

  if (error) {
    console.error("Registration error:", error.message);
    throw new Error("Registration could not be saved. Please try again.");
  }

  return saved;
}
