"use server"

import { createClient } from "@/lib/supabase/server"

export type CareerSearchParams = {
  q?: string;
  domain?: string;
  riasec?: string;
  skill?: string;
  page?: number;
  limit?: number;
}

export async function searchCareers(params: CareerSearchParams) {
  const supabase = await createClient()
  const page = params.page || 1
  const limit = params.limit || 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('careers')
    .select('id, code, slug, name, name_en, career_domain_code, description, riasec_profile, riasec_primary, market_data', { count: 'exact' })
    .eq('status', 'published') // ONLY return published

  if (params.q) {
    query = query.ilike('name', `%${params.q}%`)
  }

  if (params.domain) {
    query = query.eq('career_domain_code', params.domain)
  }

  if (params.riasec) {
    query = query.eq('riasec_primary', params.riasec)
  }

  if (params.skill) {
    // Search JSONB array of objects for skill code
    query = query.contains('skills', `[{"code": "${params.skill}"}]`)
  }

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error searching careers:", error)
    return { data: [], count: 0, error: error.message }
  }

  return { data, count: count || 0 }
}

export async function getCareerBySlug(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published') // ONLY return published
    .single()

  if (error) {
    console.error("Error fetching career:", error)
    return { data: null, error: error.message }
  }

  return { data }
}
