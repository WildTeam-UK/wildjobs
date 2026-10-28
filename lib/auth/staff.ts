import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type StaffRole = "admin" | "reviewer";

type StaffSession = {
  email?: string;
  role: StaffRole;
  userId: string;
};

export const requireStaff = cache(async (): Promise<StaffSession> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) redirect("/sign-in?next=/admin");

  const { data: membership, error: membershipError } = await supabase
    .from("staff_members")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (membershipError || !membership || !["admin", "reviewer"].includes(membership.role)) {
    redirect("/account");
  }

  return {
    email: typeof data.claims.email === "string" ? data.claims.email : undefined,
    role: membership.role as StaffRole,
    userId,
  };
});

export async function requireAdministrator() {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin");
  return staff;
}
