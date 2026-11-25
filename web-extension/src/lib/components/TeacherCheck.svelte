<script lang="ts">
  import { onMount } from 'svelte';
  import { isTeacherInCurrentCourse, watchActivePage } from '../moodle';

  let isTeacher = $state<boolean | null>(null);
  let lastCheck = 0;

  async function check() {
    const id = ++lastCheck;
    const result = await isTeacherInCurrentCourse();
    // The page changed again while checking: a newer check has the answer.
    if (id !== lastCheck) return;
    isTeacher = result;
    console.log('[LAMB] isTeacherInCurrentCourse:', isTeacher);
  }

  onMount(() => {
    check();
    return watchActivePage(check);
  });
</script>

<div class="rounded-md border border-gray-200 p-3 text-sm text-gray-800">
  {#if isTeacher === null}
    Checking Moodle…
  {:else if isTeacher}
    Teacher in this Moodle course
  {:else}
    Not a teacher here (or not a Moodle course page)
  {/if}
</div>
