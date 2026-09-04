"use server"

import { createClient } from "@/lib/supabase/server"
import { careerFormSchema, CareerFormValues } from "../schemas/career"
import { revalidatePath } from "next/cache"

export async function createDraftCareer(data: CareerFormValues) {
  const supabase = await createClient()
  const { data: user, error: authErr } = await supabase.auth.getUser()
  
  if (authErr || !user.user) {
    return { error: "Unauthorized" }
  }

  // Double check admin role
  const { data: profile } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return { error: "Permission denied" }
  }

  const parsed = careerFormSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Invalid data", details: parsed.error.flatten() }
  }

  const payload = {
    ...parsed.data,
    status: 'draft' as const,
    created_by: user.user.id,
    updated_by: user.user.id,
  }

  const { data: career, error } = await supabase
    .from('careers')
    .insert(payload)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/careers')
  return { data: career }
}

export async function updateCareer(id: string, data: Partial<CareerFormValues>) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) return { error: "Unauthorized" }

  const { data: career, error } = await supabase
    .from('careers')
    .update({ ...data, updated_by: user.user.id })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/admin/careers/${id}`)
  revalidatePath('/admin/careers')
  return { data: career }
}

export async function verifyCareer(id: string) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from('careers')
    .update({ 
      status: 'verified',
      verified_by: user.user.id,
      last_verified_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath(`/admin/careers/${id}`)
  revalidatePath('/admin/careers')
  return { success: true }
}

export async function publishCareer(id: string) {
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  
  if (!user.user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from('careers')
    .update({ 
      status: 'published',
      published_by: user.user.id,
      published_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('status', 'verified') // MUST be verified first

  if (error) return { error: error.message }
  
  revalidatePath(`/admin/careers/${id}`)
  revalidatePath('/admin/careers')
  revalidatePath('/careers')
  return { success: true }
}

export async function archiveCareer(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('careers')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath(`/admin/careers/${id}`)
  revalidatePath('/admin/careers')
  revalidatePath('/careers')
  return { success: true }
}

// Function to process CSV import preview
export async function processCareerCSVUpload(rows: any[]) {
  // Returns validation errors per row without inserting
  const results = rows.map((row, index) => {
    const parsed = careerFormSchema.safeParse(row)
    if (!parsed.success) {
      return { 
        index, 
        success: false, 
        errors: parsed.error.flatten().fieldErrors,
        original: row
      }
    }
    return { index, success: true, data: parsed.data }
  })
  
  return results
}
