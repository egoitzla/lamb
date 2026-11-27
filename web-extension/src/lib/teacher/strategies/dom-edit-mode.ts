/**
 * Strategy that looks at the page itself: only teachers (users who can edit the
 * course) get an editing control, so editing mode being switched ON means a teacher.
 * It is only a hint, and it cannot rule a teacher out: with editing mode off it
 * answers `unknown`, never `not-teacher`.
 */
import type { StrategyId, TeacherStrategy, TeacherVerdict } from '../types';

const source: StrategyId = 'dom-edit-mode';

/**
 * Injected into the page, so it must be self-contained (no imports or outer
 * variables).
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

export const domEditModeStrategy: TeacherStrategy = {
  id: source,

  // Any course page can be inspected; whether it actually can is found out in `check`.
  async isAvailable() {
    return true;
  },

  async check({ tabId }): Promise<TeacherVerdict> {
    try {
      const [result] = await browser.scripting.executeScript({
        target: { tabId },
        func: pageHasEditModeOn,
      });
      return result?.result === true
        ? { status: 'teacher', source }
        : { status: 'unknown', reason: 'edit-mode-off', source };
    } catch {
      // Restricted page, missing host permission, or the tab went away.
      return { status: 'unknown', reason: 'page-unreadable', source };
    }
  },
};
