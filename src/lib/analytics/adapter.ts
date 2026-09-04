import { createClient } from "@/lib/supabase/server";
import { BaseAnalyticsPayload } from "./registry";

/**
 * Analytics Adapter Pattern
 * Giúp dễ dàng switch/cộng dồn backend tracking (Supabase, PostHog, GA4) trong tương lai.
 */
export async function trackToAdapters(payload: BaseAnalyticsPayload) {
  // 1. Supabase Adapter (Hiện tại là Primary)
  await trackToSupabase(payload);
  
  // 2. PostHog Adapter (Tương lai)
  // await trackToPostHog(payload);
  
  // 3. GA4 Adapter (Tương lai)
  // await trackToGA4(payload);
}

async function trackToSupabase(payload: BaseAnalyticsPayload) {
  try {
    const supabase = await createClient();
    
    // Server-side insert bằng Service Role (được xử lý thông qua client instance nếu auth xịn, 
    // nhưng để an toàn hơn, ta nên gọi thẳng createClient() cho app. 
    // Vì đang chạy ở Server Action/API Route, insert bằng quyền user hay anon đều bị chặn bởi RLS.
    // Khoan, RLS của analytics_events CHỈ CHO PHÉP service_role. 
    // Vì vậy ta bắt buộc phải dùng service_role client để insert.
    
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await serviceClient
      .from('analytics_events')
      .insert({
        event_name: payload.event_name,
        event_version: payload.event_version,
        user_id: payload.user_id,
        anonymous_id: payload.anonymous_id,
        session_id: payload.session_id,
        source: payload.source,
        platform: payload.platform,
        properties: payload.properties,
        utm_source: payload.utm_source,
        utm_medium: payload.utm_medium,
        utm_campaign: payload.utm_campaign,
        referrer: payload.referrer,
      });

    if (error) {
      console.error("[Analytics Adapter] Supabase Error:", error);
    }
  } catch (err) {
    console.error("[Analytics Adapter] Failed to track to Supabase:", err);
  }
}
