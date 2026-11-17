/**
 * Moodle page detection. Runs against the active browser tab, so it only works
 * from extension pages (e.g. the side panel).
 */

/** True if the URL is a Moodle course page (`…/course/view.php?id=N`). */
export function isMoodleCourseUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl);
    return /\/course\/view\.php$/.test(url.pathname) && /^\d+$/.test(url.searchParams.get('id') ?? '');
  } catch {
    return false;
  }
}

/**
 * Injected into the page, so it must be self-contained (no imports or outer
 * variables). Only teachers (users who can edit the course) get the
 * "Edit mode" switch (Moodle 4+) or the "Turn editing on" button (Moodle 3).
 */
function pageHasEnabledEditControl(): boolean {
  const selectors = [
    // Moodle 4.x: "Edit mode" switch in the page header.
    '.editmode-switch-form input[type="checkbox"]',
    'input[name="setmode"]',
    // Moodle 3.x / Boost: "Turn editing on/off" button.
    'form[action*="editmode.php"] button',
    'form[action*="editmode.php"] input[type="submit"]',
    'form[action*="/course/view.php"] input[name="edit"]',
    'a[href*="edit=on"]',
    'a[href*="edit=off"]',
  ];
  for (const selector of selectors) {
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (!(el as HTMLInputElement).disabled && el.getAttribute('aria-disabled') !== 'true') {
        return true;
      }
    }
  }
  // Editing already switched on: the body carries the `editing` class.
  return document.body.classList.contains('editing');
}

/**
 * Whether the user is a teacher in the Moodle course open in the active tab:
 * the tab URL is a course page and the editing control is available.
 * Resolves to `false` if there is no such tab or the page can't be inspected.
 */
export async function isTeacherInCurrentCourse(): Promise<boolean> {
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id === undefined || !isMoodleCourseUrl(tab.url)) return false;

  try {
    const [result] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: pageHasEnabledEditControl,
    });
    return result?.result === true;
  } catch {
    // Restricted page or missing host permission.
    return false;
  }
}
