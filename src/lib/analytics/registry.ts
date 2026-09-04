/**
 * Event Registry cho Analytics
 * Định nghĩa chặt chẽ Schema cho từng Event để chống rác dữ liệu.
 */

// Behavioral Events (Client-side)
export type BehavioralEvent = 
  | 'PAGE_VIEW'
  | 'CAREER_EXPLORED'
  | 'MAJOR_EXPLORED'
  | 'UNIVERSITY_EXPLORED';

// Business Events (Server-side)
export type BusinessEvent =
  | 'REGISTER'
  | 'ONBOARDING_COMPLETED'
  | 'ASSESSMENT_STARTED'
  | 'ASSESSMENT_COMPLETED'
  | 'ROADMAP_GENERATED'
  | 'FIRST_TASK_COMPLETED';

export type AnalyticsEvent = BehavioralEvent | BusinessEvent;

export interface EventPayloads {
  PAGE_VIEW: {
    path: string;
    search: string;
    title: string;
  };
  REGISTER: {
    provider: string; // 'email' | 'google' etc
  };
  ONBOARDING_COMPLETED: {
    grade_level: string;
    has_interests: boolean;
  };
  ASSESSMENT_STARTED: {
    assessment_version: string;
  };
  ASSESSMENT_COMPLETED: {
    assessment_version: string;
    duration_seconds: number;
    completion_rate?: number;
  };
  CAREER_EXPLORED: {
    target_id: string;
    slug: string;
  };
  MAJOR_EXPLORED: {
    target_id: string;
    slug: string;
  };
  UNIVERSITY_EXPLORED: {
    target_id: string;
    slug: string;
  };
  ROADMAP_GENERATED: {
    target_type: string;
    target_id: string;
    roadmap_id: string;
  };
  FIRST_TASK_COMPLETED: {
    roadmap_id: string;
    task_id: string;
  };
}

export interface BaseAnalyticsPayload {
  event_name: AnalyticsEvent;
  event_version: string;
  user_id?: string;
  anonymous_id?: string;
  session_id?: string;
  source: 'client' | 'server';
  platform: string;
  properties: Record<string, any>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
}
