/**
 * Teacher check: is the user a teacher in the Moodle course open in the active tab?
 *
 * Each way of telling is a `TeacherStrategy`; the `TeacherResolver` tries them in
 * the order below. To add one (e.g. asking a LAMB backend connected to Moodle),
 * implement `TeacherStrategy`, add its id to `StrategyId` and register it here,
 * ahead of the less reliable strategies.
 */
import { readActivePageContext } from './context';
import { TeacherResolver } from './resolver';
import { domEditModeStrategy } from './strategies/dom-edit-mode';
import type { TeacherVerdict } from './types';

/** Registered strategies, most reliable first. */
const resolver = new TeacherResolver([domEditModeStrategy]);

/** Verdict for the page in the active tab. */
export async function checkActiveTab(): Promise<TeacherVerdict> {
  const page = await readActivePageContext();
  if (!page.ok) return { status: 'unknown', reason: page.reason, source: null };
  return resolver.resolve(page.context);
}

export { watchActivePage } from './watch';
export type { TeacherVerdict, UnknownReason } from './types';
