import { getCurrentAccount } from "@/features/account/current-account";
import { trackToAdapters } from "./adapter";
import { BusinessEvent, EventPayloads, BaseAnalyticsPayload } from "./registry";
import { cookies } from "next/headers";

/**
 * Hàm track event dành riêng cho Server (Business Logic)
 */
export async function trackServerEvent<T extends BusinessEvent>(
  eventName: T,
  properties: EventPayloads[T],
  userId?: string
) {
  try {
    let finalUserId = userId;
    
    // Thử lấy userId nếu chưa truyền vào
    if (!finalUserId) {
      const account = await getCurrentAccount();
      if (account) {
        finalUserId = account.userId;
      }
    }

    // Lấy anonymous_id và session_id từ cookies nếu có
    const cookieStore = await cookies();
    const anonymous_id = cookieStore.get('1learn_anon_id')?.value;
    const session_id = cookieStore.get('1learn_session_id')?.value;
    const utm_source = cookieStore.get('1learn_utm_source')?.value;
    const utm_medium = cookieStore.get('1learn_utm_medium')?.value;
    const utm_campaign = cookieStore.get('1learn_utm_campaign')?.value;
    const referrer = cookieStore.get('1learn_referrer')?.value;

    const payload: BaseAnalyticsPayload = {
      event_name: eventName,
      event_version: 'v1', // Mặc định v1 cho đến khi có breaking change payload
      user_id: finalUserId,
      anonymous_id,
      session_id,
      source: 'server',
      platform: 'web',
      properties,
      utm_source,
      utm_medium,
      utm_campaign,
      referrer,
    };

    // Idempotency: Với Business Events, ta có thể query check xem event này với properties này đã tồn tại chưa
    // Nhưng để tránh làm chậm UX (vì track chạy inline), ta cứ bắn thẳng vào Adapter, việc de-dup có thể làm ở Adapter hoặc Data Warehouse.
    
    // Gọi adapter async không block
    void trackToAdapters(payload);

  } catch (error) {
    console.error("[Analytics Server] Failed to track server event:", error);
  }
}
