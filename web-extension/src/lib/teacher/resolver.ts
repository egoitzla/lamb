import type { PageContext, TeacherStrategy, TeacherVerdict } from './types';

/**
 * Asks the strategies, in priority order, whether the user is a teacher in the
 * course of the page. Strategies that are not available are skipped; the first
 * conclusive verdict (`teacher` / `not-teacher`) wins. If none decides, the
 * `unknown` of the last strategy that ran is returned, as it is the fallback the
 * user can act on.
 *
 * Strategies do not know about each other: the order lives only in the list given here.
 */
export class TeacherResolver {
  constructor(private readonly strategies: readonly TeacherStrategy[]) {}

  async resolve(context: PageContext): Promise<TeacherVerdict> {
    let verdict: TeacherVerdict = { status: 'unknown', reason: 'no-strategy', source: null };

    for (const strategy of this.strategies) {
      try {
        if (!(await strategy.isAvailable(context))) continue;
        verdict = await strategy.check(context);
      } catch (error) {
        // A failing strategy must not hide the ones after it.
        console.warn(`[LAMB] Teacher strategy "${strategy.id}" failed:`, error);
        verdict = { status: 'unknown', reason: 'check-failed', source: strategy.id };
        continue;
      }
      if (verdict.status !== 'unknown') return verdict;
    }

    return verdict;
  }
}
