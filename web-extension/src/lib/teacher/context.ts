/**
 * Reads the Moodle course page open in the active tab. Runs against the active
 * browser tab, so it only works from extension pages (e.g. the side panel).
 */
import type { PageContext } from './types';

export type PageContextResult =
  | { ok: true; context: PageContext }
  | { ok: false; reason: 'not-a-course' | 'page-unreadable' };

/** Matches a page inside a course, `…/course/<page>.php`; group 1 is the Moodle root path. */
const COURSE_PAGE_PATH = /^(.*)\/course\/[^/]+\.php$/;

/**
 * Moodle root URL if `rawUrl` is a Moodle page inside a course: any
 * `…/course/*.php?id=N` (`view.php`, `section.php`, …). Requiring `id` leaves out
 * the pages that list courses, such as `/course/index.php`.
 */
export function courseSiteUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const match = COURSE_PAGE_PATH.exec(url.pathname);
    if (!match || !/^\d+$/.test(url.searchParams.get('id') ?? '')) return null;
    return `${url.origin}${match[1]}`;
  } catch {
    return null;
  }
}

/**
 * Injected into the page, so it must be self-contained (no imports or outer
 * variables). Moodle tags the body of every course page with `course-<id>`, which
 * gives the real course id even where the URL `id` is not (e.g. a section id).
 */
function readCourseIdFromPage(): number | null {
  const match = /(?:^|\s)course-(\d+)(?:\s|$)/.exec(document.body.className);
  return match ? Number(match[1]) : null;
}

/** Context of the active tab, or why there is none. */
export async function readActivePageContext(): Promise<PageContextResult> {
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  const siteUrl = courseSiteUrl(tab?.url);
  if (tab?.id === undefined || !tab.url || !siteUrl) return { ok: false, reason: 'not-a-course' };

  let courseId: number | null;
  try {
    const [result] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: readCourseIdFromPage,
    });
    courseId = result?.result ?? null;
  } catch {
    // Restricted page or missing host permission.
    return { ok: false, reason: 'page-unreadable' };
  }
  // A URL that looks like Moodle but a page that is not a course.
  if (courseId === null) return { ok: false, reason: 'not-a-course' };

  return { ok: true, context: { tabId: tab.id, url: tab.url, siteUrl, courseId } };
}
