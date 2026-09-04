import { BehavioralEvent, EventPayloads } from "./registry";

// Helper để tạo random string cho ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Lưu session vào biến bộ nhớ (chỉ tồn tại trong 1 tab vòng đời của trang)
let currentSessionId: string | null = null;

function getSessionId() {
  if (typeof window === 'undefined') return null;
  if (!currentSessionId) {
    currentSessionId = generateId();
    // Lưu vào sessionStorage để reload không mất, nhưng tắt tab sẽ mất
    try {
      const stored = sessionStorage.getItem('1learn_session_id');
      if (stored) {
        currentSessionId = stored;
      } else {
        sessionStorage.setItem('1learn_session_id', currentSessionId);
        // Lưu vào cookie để server cũng có thể đọc (hữu ích cho first-hit)
        document.cookie = `1learn_session_id=${currentSessionId}; path=/`;
      }
    } catch (e) {
      // ignore
    }
  }
  return currentSessionId;
}

function getAnonymousId() {
  if (typeof window === 'undefined') return null;
  try {
    let anonId = localStorage.getItem('1learn_anon_id');
    if (!anonId) {
      anonId = generateId();
      localStorage.setItem('1learn_anon_id', anonId);
      // Ghi cả cookie để server lấy được attribution dễ hơn
      document.cookie = `1learn_anon_id=${anonId}; path=/; max-age=31536000`; // 1 year
    }
    return anonId;
  } catch (e) {
    return generateId(); // Fallback
  }
}

/**
 * Hàm track event cho Client.
 * Sẽ gửi HTTP request lên Ingestion API của hệ thống.
 */
export async function trackClientEvent<T extends BehavioralEvent>(
  eventName: T,
  properties: EventPayloads[T]
) {
  if (typeof window === 'undefined') return;

  const anonymousId = getAnonymousId();
  const sessionId = getSessionId();

  try {
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_name: eventName,
        anonymous_id: anonymousId,
        session_id: sessionId,
        url: window.location.href,
        properties,
      }),
      // Sử dụng keepalive để request vẫn được gửi kể cả khi user đóng tab/chuyển trang
      keepalive: true 
    });

    if (!response.ok) {
      console.warn('[Analytics Client] Track event failed:', response.statusText);
    }
  } catch (err) {
    console.error('[Analytics Client] Track event error:', err);
  }
}
