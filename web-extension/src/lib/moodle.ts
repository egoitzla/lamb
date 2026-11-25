/**
 * Moodle page detection. Runs against the active browser tab, so it only works
 * from extension pages (e.g. the side panel).
 */

/**
 * True if the URL is a Moodle page inside a course: any `…/course/*.php?id=N`
 * (`view.php`, `section.php`, …). Requiring `id` leaves out the pages that list
 * courses, such as `/course/index.php`. Note that `id` is not always the course
 * id: in `section.php` it is the section id.
 */
export function isMoodleCourseUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl);
    return /\/course\/[^/]+\.php$/.test(url.pathname) && /^\d+$/.test(url.searchParams.get('id') ?? '');
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

/**
 * Calls `onChange` whenever the page in front of the user may have changed: the
 * active tab loads or changes URL (Moodle reloads the page when editing mode is
 * toggled), the user switches tab, or focuses another window. Returns a function
 * that stops watching.
 */
export function watchActivePage(onChange: () => void): () => void {
  const onUpdated: Parameters<typeof browser.tabs.onUpdated.addListener>[0] = (
    _tabId,
    changeInfo,
    tab,
  ) => {
    if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) onChange();
  };
  const onActivated = () => onChange();
  const onFocusChanged = (windowId: number) => {
    // WINDOW_ID_NONE: the browser lost focus, so the page is still the same.
    if (windowId !== browser.windows.WINDOW_ID_NONE) onChange();
  };

  browser.tabs.onUpdated.addListener(onUpdated);
  browser.tabs.onActivated.addListener(onActivated);
  browser.windows.onFocusChanged.addListener(onFocusChanged);

  return () => {
    browser.tabs.onUpdated.removeListener(onUpdated);
    browser.tabs.onActivated.removeListener(onActivated);
    browser.windows.onFocusChanged.removeListener(onFocusChanged);
  };
}
