"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import * as crypto from "crypto";

/**
 * Creates a high-entropy 8-character token (using random bytes).
 * We hash it with SHA-256 for storage to prevent leaks.
 */
export async function createParentInvitation(studentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  if (user.id !== studentId) {
    console.error("Authorization failed: User tried to create invitation for another student");
    return { error: "Forbidden: You can only create invitations for your own account" };
  }

  // Generate 6 random bytes, hex encode => 12 characters.
  // We can slice it to 8 chars for a good balance of entropy vs UX.
  const rawToken = crypto.randomBytes(6).toString("hex").toUpperCase().slice(0, 8);
  
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  
  // Set expiration to 48 hours from now (strict security policy)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  const { data, error } = await supabase
    .from("parent_link_invitations")
    .insert({
      student_id: studentId,
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select("id, created_at, expires_at, status")
    .single();

  if (error) {
    console.error("Error creating parent invitation:", error);
    return { error: "Failed to generate invitation" };
  }

  revalidatePath("/settings/privacy");

  // We return the RAW token to the user ONCE. They must copy it.
  return { 
    invitation: data,
    rawToken 
  };
}

/**
 * Revokes a pending parent invitation
 */
export async function revokeParentInvitation(invitationId: string, studentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };
  if (user.id !== studentId) return { error: "Forbidden" };

  const { error } = await supabase
    .from("parent_link_invitations")
    .update({ status: "revoked" })
    .match({ id: invitationId, student_id: studentId, status: "pending" });

  if (error) {
    console.error("Error revoking parent invitation:", error);
    return { error: "Failed to revoke invitation" };
  }

  revalidatePath("/settings/privacy");
  return { success: true };
}

/**
 * Redeems an invitation using the raw token
 */
export async function redeemParentInvitation(rawToken: string, parentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };
  if (user.id !== parentId) return { error: "Forbidden: You can only redeem for your own account" };
  
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const { data, error } = await supabase.rpc("redeem_parent_invitation", {
    p_token_hash: tokenHash,
    p_parent_id: parentId,
  });

  if (error) {
    console.error("Error redeeming parent invitation:", error);
    return { error: "Failed to redeem invitation" };
  }

  const result = data as { success: boolean; error?: string; link_id?: string; student_id?: string };

  if (!result.success) {
    return { error: result.error || "Invalid or expired token" };
  }

  revalidatePath("/parent/dashboard");
  return { success: true, studentId: result.student_id };
}

/**
 * Updates sharing permissions for a specific parent-child link
 */
export async function updateSharingPermissions(
  linkId: string,
  permissions: {
    career_profile_level?: number;
    assessment_level?: number;
    roadmap_level?: number;
    academic_level?: number;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Verify the user is the student associated with this link
  const { data: linkData } = await supabase
    .from("parent_child_links")
    .select("student_id")
    .eq("id", linkId)
    .single();

  if (!linkData || linkData.student_id !== user.id) {
    return { error: "Forbidden: Only the student can update permissions" };
  }
  
  const { error } = await supabase
    .from("parent_sharing_permissions")
    .update({
      ...permissions,
      updated_at: new Date().toISOString(),
    })
    .eq("link_id", linkId);

  if (error) {
    console.error("Error updating sharing permissions:", error);
    return { error: "Failed to update permissions" };
  }

  revalidatePath("/settings/privacy");
  return { success: true };
}

/**
 * Revokes an existing parent-child link
 */
export async function revokeParentLink(linkId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };
  if (user.id !== userId) return { error: "Forbidden: You can only revoke your own links" };
  
  const { error } = await supabase
    .from("parent_child_links")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: userId,
    })
    .eq("id", linkId)
    .eq("status", "accepted");

  if (error) {
    console.error("Error revoking parent link:", error);
    return { error: "Failed to revoke link" };
  }

  revalidatePath("/settings/privacy");
  revalidatePath("/parent/dashboard");
  return { success: true };
}
