/**
 * Detects whether the active tab is a Moodle page, whether the user is logged in
 * and what they can probably do there.
 *
 * Uses `activeTab` + `scripting`: access is granted only to the tab the user is on
 * when they open the popup, so no host permission is needed for each org's Moodle.
 */

/**
 * @typedef {'site-admin' | 'editing-teacher' | 'student-or-viewer' | 'unknown'} MoodleRoleGuess
 *
 * @typedef {Object} MoodlePageInfo
 * @property {true} isMoodle
 * @property {string} wwwroot - Site root as Moodle reports it (`M.cfg.wwwroot`)
 * @property {boolean} loggedIn - A real (non-guest) user session is active
 * @property {boolean} isGuest
 * @property {number | null} userId - Moodle user id
 * @property {string | null} fullName
 * @property {number | null} courseId - Null when the page is not inside a course
 * @property {string | null} courseName
 * @property {boolean} canEditCourse - The edit-mode switch is shown for this course
 * @property {boolean} isSiteAdmin - The "Site administration" link is shown
 * @property {MoodleRoleGuess} roleGuess - Heuristic from the page, not Moodle's real role list
 *
 * @typedef {{ isMoodle: false, reason: 'not-moodle' | 'restricted' }} NotMoodle
 *
 * @typedef {MoodlePageInfo | NotMoodle} MoodleDetection
 */

/**
 * Runs inside the page (MAIN world) so it can read Moodle's `M.cfg` global.
 * Must be self-contained: it is serialized and injected, so it cannot use imports
 * or anything outside its own body.
 * @returns {MoodleDetection}
 */
export function detectMoodlePage() {
  /** @type {any} */
  const cfg = /** @type {any} */ (window).M?.cfg;
  if (!cfg || typeof cfg.wwwroot !== 'string') return { isMoodle: false, reason: 'not-moodle' };

  /** @param {string} selector */
  const has = (selector) => document.querySelector(selector) !== null;

  /** @param {Element | null} link */
  const profileId = (link) => {
    if (!(link instanceof HTMLAnchorElement)) return null;
    const id = Number(new URL(link.href, location.href).searchParams.get('id'));
    return Number.isInteger(id) && id > 0 ? id : null;
  };

  /** @param {unknown} value */
  const positiveInt = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
  };

  const notLoggedIn = document.body.classList.contains('notloggedin');
  // Real users always get a logout link (in the user menu); guests do not.
  const hasLogout = has('a[href*="/login/logout.php"]');
  const loggedIn = !notLoggedIn && hasLogout;
  const isGuest = !notLoggedIn && !hasLogout;

  // Footer "You are logged in as …" link, present in Boost and Classic.
  const loginInfoLink = document.querySelector('.logininfo a[href*="/user/profile.php"]');
  const userId = loggedIn
    ? (positiveInt(cfg.userId) ??
      profileId(loginInfoLink) ??
      profileId(document.querySelector('.usermenu a[href*="/user/profile.php"]')))
    : null;
  const fullName = loggedIn ? loginInfoLink?.textContent?.trim() || null : null;

  // On the front page courseId is the site id, so it does not count as a course.
  const siteId = positiveInt(cfg.siteId) ?? 1;
  const bodyCourse = [...document.body.classList].find((c) => /^course-\d+$/.test(c));
  const rawCourseId = positiveInt(cfg.courseId) ?? (bodyCourse ? positiveInt(bodyCourse.slice(7)) : null);
  const courseId = rawCourseId && rawCourseId !== siteId ? rawCourseId : null;
  const courseName = courseId
    ? document.querySelector('.page-header-headings h1, .page-context-header h1, #page-header h1')?.textContent?.trim() ||
      null
    : null;

  // 4.x: edit-mode toggle. 3.x: "Turn editing on" form posting edit=on.
  const canEditCourse =
    loggedIn &&
    courseId !== null &&
    has('.editmode-switch-form, input[name="setmode"], form[action*="/course/view.php"] input[name="edit"]');
  const isSiteAdmin = loggedIn && has('a[href*="/admin/search.php"]');

  /** @type {MoodleRoleGuess} */
  let roleGuess = 'unknown';
  if (isSiteAdmin) roleGuess = 'site-admin';
  else if (canEditCourse) roleGuess = 'editing-teacher';
  else if (loggedIn && courseId) roleGuess = 'student-or-viewer';

  return {
    isMoodle: true,
    wwwroot: cfg.wwwroot,
    loggedIn,
    isGuest,
    userId,
    fullName,
    courseId,
    courseName,
    canEditCourse,
    isSiteAdmin,
    roleGuess,
  };
}

/**
 * Runs {@link detectMoodlePage} in the active tab.
 * @returns {Promise<MoodleDetection>}
 */
export async function inspectActiveTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith('http')) return { isMoodle: false, reason: 'restricted' };
  try {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: detectMoodlePage,
    });
    return /** @type {MoodleDetection} */ (injection?.result) ?? { isMoodle: false, reason: 'not-moodle' };
  } catch {
    // Browser pages, the web store, PDFs… cannot be scripted.
    return { isMoodle: false, reason: 'restricted' };
  }
}
