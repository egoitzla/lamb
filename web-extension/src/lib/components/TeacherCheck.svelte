<script lang="ts">
  import { isTeacherInCurrentCourse } from '../moodle';

  let isTeacher = $state<boolean | null>(null);

  async function check() {
    isTeacher = null;
    isTeacher = await isTeacherInCurrentCourse();
    console.log('[LAMB] isTeacherInCurrentCourse:', isTeacher);
  }

  check();
</script>

<div class="flex items-center justify-between gap-2 rounded-md border border-gray-200 p-3 text-sm">
  <span class="text-gray-800">
    {#if isTeacher === null}
      Checking Moodle…
    {:else if isTeacher}
      Teacher in this Moodle course
    {:else}
      Not a teacher here (or not a Moodle course page)
    {/if}
  </span>
  <button class="text-gray-600 underline hover:text-gray-900" type="button" onclick={check}>
    Recheck
  </button>
</div>
