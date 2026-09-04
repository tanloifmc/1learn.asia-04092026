/**
 * Analytics barrel — re-exports a unified trackEvent for client components.
 * Onboarding wizard and other client components import from '@/lib/analytics'.
 */
export { trackClientEvent as trackEvent } from './client';
export type { BehavioralEvent, EventPayloads } from './registry';
