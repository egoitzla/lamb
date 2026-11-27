/** Types of the teacher check. This file has no runtime code. */

/** The Moodle course page open in the active tab, as every strategy sees it. */
export interface PageContext {
  tabId: number;
  url: string;
  /** Moodle root URL, e.g. `https://moodle.example.org` or `https://example.org/moodle` */
  siteUrl: string;
  /** Real course id, also on pages whose `id` parameter is something else (e.g. `section.php`). */
  courseId: number;
}

/** Identifies the strategy that produced a verdict. Add an id here for each new strategy. */
export type StrategyId = 'dom-edit-mode';

/** Why a verdict is `unknown`. */
export type UnknownReason =
  /** The active tab is not a Moodle course page. */
  | 'not-a-course'
  /** The page could not be inspected (restricted page, missing host permission…). */
  | 'page-unreadable'
  /** Editing mode is off: the user may still be a teacher. */
  | 'edit-mode-off'
  /** A strategy failed while checking. */
  | 'check-failed'
  /** No strategy was available for this page. */
  | 'no-strategy';

/**
 * Answer to "is the user a teacher in this course?". `unknown` means "could not tell",
 * so the resolver moves on to the next strategy; it never means "not a teacher".
 */
export type TeacherVerdict =
  | { readonly status: 'teacher'; readonly source: StrategyId }
  | { readonly status: 'not-teacher'; readonly source: StrategyId }
  | {
      readonly status: 'unknown';
      readonly reason: UnknownReason;
      /** Null when no strategy ran. */
      readonly source: StrategyId | null;
    };

/** One way of telling whether the user is a teacher in the course of the page. */
export interface TeacherStrategy {
  readonly id: StrategyId;
  /** Whether this strategy can say anything about this page (e.g. its backend supports it). */
  isAvailable(context: PageContext): Promise<boolean>;
  /** Returns `unknown` when it cannot decide, so that the next strategy is tried. */
  check(context: PageContext): Promise<TeacherVerdict>;
}
