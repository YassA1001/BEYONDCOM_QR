import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { compare, hash } from "npm:bcryptjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { action, email, password, name, role } = body;

    if (action === "login") {
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .limit(1);

      if (error || !users || users.length === 0) {
        return json({ error: "Email ou mot de passe incorrect" }, 401);
      }

      const user = users[0];
      if (!user.isActive) return json({ error: "Compte désactivé" }, 403);

      const valid = await compare(password, user.password);
      if (!valid) return json({ error: "Email ou mot de passe incorrect" }, 401);

      const { password: _p, ...safeUser } = user;
      return json({ user: safeUser });
    }

    if (action === "register") {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (existing && existing.length > 0) {
        return json({ error: "Cet email est déjà utilisé" }, 409);
      }

      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });

      const userRole = count === 0 ? "SUPER_ADMIN" : "ADMIN";
      const hashed = await hash(password, 10);
      const now = new Date().toISOString();

      const { data: created, error: createErr } = await supabase
        .from("users")
        .insert({ name, email, password: hashed, role: userRole, isActive: true, createdAt: now, updatedAt: now })
        .select("*");

      if (createErr) return json({ error: createErr.message }, 400);

      const { password: _p, ...safeUser } = created[0];
      return json({ user: safeUser }, 201);
    }

    if (action === "create_user") {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (existing && existing.length > 0) {
        return json({ error: "Cet email est déjà utilisé" }, 409);
      }

      const hashed = await hash(password, 10);
      const now = new Date().toISOString();

      const { data: created, error: createErr } = await supabase
        .from("users")
        .insert({
          name,
          email,
          password: hashed,
          role: role || "ADMIN",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
        .select("*");

      if (createErr) return json({ error: createErr.message }, 400);

      const { password: _p, ...safeUser } = created[0];
      return json({ user: safeUser }, 201);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return json({ error: message }, 500);
  }
});
