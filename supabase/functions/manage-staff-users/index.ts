import { createClient } from "npm:@supabase/supabase-js@2.110.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const roles = new Set(["super_admin", "management", "accounts", "sales", "operations", "marketing", "auditor"]);

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization");
  if (!supabaseUrl || !serviceRoleKey) return response({ error: "Server configuration is incomplete." }, 503);
  if (!authorization?.startsWith("Bearer ")) return response({ error: "Authentication required." }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const jwt = authorization.slice("Bearer ".length);
  const { data: callerData, error: callerError } = await admin.auth.getUser(jwt);
  if (callerError || !callerData.user) return response({ error: "Invalid session." }, 401);

  const { data: callerProfile, error: profileError } = await admin
    .from("staff_profiles")
    .select("user_id,role,active")
    .eq("user_id", callerData.user.id)
    .single();
  if (profileError || !callerProfile?.active || callerProfile.role !== "super_admin") {
    return response({ error: "Only an active super admin can manage staff users." }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return response({ error: "Invalid JSON body." }, 400);
  }

  const action = text(body.action);
  if (action === "list") {
    const [{ data: profiles, error: profilesError }, { data: authUsers, error: usersError }] = await Promise.all([
      admin.from("staff_profiles").select("user_id,full_name,role,active,created_at").order("full_name"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (profilesError || usersError) return response({ error: profilesError?.message ?? usersError?.message }, 500);
    const byId = new Map((authUsers.users ?? []).map((user) => [user.id, user]));
    return response({ users: (profiles ?? []).map((profile) => {
      const user = byId.get(profile.user_id);
      return { ...profile, email: user?.email ?? "", invited_at: user?.invited_at ?? null, last_sign_in_at: user?.last_sign_in_at ?? null };
    }) });
  }

  if (action === "invite") {
    const email = text(body.email).toLowerCase();
    const fullName = text(body.full_name);
    const role = text(body.role);
    if (!email || !email.includes("@")) return response({ error: "A valid email is required." }, 400);
    if (fullName.length < 2 || fullName.length > 120) return response({ error: "Full name must be 2–120 characters." }, 400);
    if (!roles.has(role)) return response({ error: "Invalid staff role." }, 400);

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName } });
    if (inviteError || !invited.user) return response({ error: inviteError?.message ?? "Invitation failed." }, 400);

    // A re-invite of an already-pending user returns the same auth user instead of erroring.
    // Treat that as a resend rather than falling through to the insert below, which would hit
    // the staff_profiles primary key and previously caused the just-re-invited user to be deleted.
    const { data: existingProfile, error: existingProfileError } = await admin
      .from("staff_profiles")
      .select("user_id")
      .eq("user_id", invited.user.id)
      .maybeSingle();
    if (existingProfileError) return response({ error: existingProfileError.message }, 500);
    if (existingProfile) return response({ ok: true, resent: true });

    const { error: insertError } = await admin.rpc("admin_insert_staff_profile", {
      p_actor_user_id: callerData.user.id,
      p_target_user_id: invited.user.id,
      p_full_name: fullName,
      p_role: role,
      p_active: true,
    });
    if (insertError) {
      await admin.auth.admin.deleteUser(invited.user.id);
      return response({ error: `Invitation rolled back because staff access could not be created: ${insertError.message}` }, 500);
    }
    return response({ ok: true }, 201);
  }

  if (action === "update") {
    const userId = text(body.user_id);
    const email = text(body.email).toLowerCase();
    const fullName = text(body.full_name);
    const role = text(body.role);
    const active = body.active === true;
    if (!userId || !email || !email.includes("@") || fullName.length < 2 || fullName.length > 120 || !roles.has(role)) {
      return response({ error: "Valid user, email, full name, role, and active state are required." }, 400);
    }

    const { data: target, error: targetError } = await admin.from("staff_profiles").select("user_id,full_name,role,active").eq("user_id", userId).single();
    if (targetError || !target) return response({ error: "Staff user not found." }, 404);
    if (userId === callerData.user.id && (!active || role !== "super_admin")) {
      return response({ error: "You cannot deactivate or demote your own super-admin account." }, 409);
    }
    if (target.role === "super_admin" && target.active && (!active || role !== "super_admin")) {
      const { count, error: countError } = await admin.from("staff_profiles").select("*", { count: "exact", head: true }).eq("role", "super_admin").eq("active", true);
      if (countError) return response({ error: countError.message }, 500);
      if ((count ?? 0) <= 1) return response({ error: "The last active super admin cannot be demoted or deactivated." }, 409);
    }

    const { error: updateProfileError } = await admin.rpc("admin_update_staff_profile", {
      p_actor_user_id: callerData.user.id,
      p_target_user_id: userId,
      p_full_name: fullName,
      p_role: role,
      p_active: active,
    });
    if (updateProfileError) return response({ error: updateProfileError.message }, 500);

    const { error: updateAuthError } = await admin.auth.admin.updateUserById(userId, {
      email,
      ban_duration: active ? "none" : "876000h",
    });
    if (updateAuthError) {
      await admin.rpc("admin_update_staff_profile", {
        p_actor_user_id: callerData.user.id,
        p_target_user_id: userId,
        p_full_name: target.full_name,
        p_role: target.role,
        p_active: target.active,
      });
      return response({ error: `Staff update rolled back because Auth could not be updated: ${updateAuthError.message}` }, 500);
    }
    return response({ ok: true });
  }

  return response({ error: "Unsupported action." }, 400);
});
