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
 * variables). Only teachers (users who can edit the course) get an editing
 * control, so editing mode being switched ON right now means a teacher.
 */
function pageHasEditModeOn(): boolean {
  // Moodle 4.x: the "Edit mode" switch is checked.
  const switches = document.querySelectorAll<HTMLInputElement>(
    '.editmode-switch-form input[type="checkbox"], input[name="setmode"]',
  );
  for (const input of switches) {
    if (input.checked && !input.disabled) return true;
  }
  // Moodle 3.x: with editing on, the button/link offers "Turn editing off".
  if (
    document.querySelector(
      'form[action*="editmode.php"] input[name="edit"][value="off"], a[href*="edit=off"]',
    )
  ) {
    return true;
  }
  // Fallback: Moodle marks the body with `editing` while editing mode is on.
  return document.body.classList.contains('editing');
}

/**
 * Whether the user is a teacher in the Moodle course open in the active tab:
 * the tab URL is a course page and editing mode is currently switched on.
 * Resolves to `false` if there is no such tab or the page can't be inspected.
 */
export async function isTeacherInCurrentCourse(): Promise<boolean> {
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id === undefined || !isMoodleCourseUrl(tab.url)) return false;

  try {
    const [result] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: pageHasEditModeOn,
    });
    return result?.result === true;
  } catch {
    // Restricted page or missing host permission.
    return false;
  }
}
