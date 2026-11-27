<script lang="ts">
  import { onMount } from 'svelte';
  import {
    checkActiveTab,
    watchActivePage,
    type TeacherVerdict,
    type UnknownReason,
  } from '../teacher';

  /** Shown when the check cannot tell. */
  const UNKNOWN_MESSAGES: Record<UnknownReason, string> = {
    'not-a-course': 'Not a Moodle course page',
    'page-unreadable': 'Cannot read this page',
    'edit-mode-off': 'Turn editing mode on to confirm you are a teacher here',
    'check-failed': 'Could not check this course',
    'no-strategy': 'Could not check this course',
  };

  let verdict = $state.raw<TeacherVerdict | null>(null);
  let lastCheck = 0;

  async function check() {
    const id = ++lastCheck;
    const result = await checkActiveTab();
    // The page changed again while checking: a newer check has the answer.
    if (id !== lastCheck) return;
    verdict = result;
    console.log('[LAMB] Teacher check:', result);
  }

  onMount(() => {
    check();
    return watchActivePage(check);
  });
</script>

<div class="rounded-md border border-gray-200 p-3 text-sm text-gray-800">
  {#if verdict === null}
    Checking Moodle…
  {:else if verdict.status === 'teacher'}
    Teacher in this Moodle course
  {:else if verdict.status === 'not-teacher'}
    Not a teacher in this Moodle course
  {:else}
    {UNKNOWN_MESSAGES[verdict.reason]}
  {/if}
</div>
