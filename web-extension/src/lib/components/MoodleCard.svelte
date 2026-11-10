<script>
  import { fetchMoodleConnection } from '../lambApi.js';
  import { inspectActiveTab } from '../moodleDetect.js';

  /** @typedef {import('../moodleDetect.js').MoodleDetection} MoodleDetection */
  /** @typedef {import('../lambApi.js').MoodleConnection} MoodleConnection */

  /** @type {{ session: import('../lambApi.js').LambSession | null }} */
  let { session } = $props();

  /** @type {MoodleDetection | null} */
  let page = $state.raw(null);

  /** @type {MoodleConnection | null} */
  let connection = $state.raw(null);

  /** @type {Record<import('../moodleDetect.js').MoodleRoleGuess, string>} */
  const ROLE_LABELS = {
    'site-admin': 'Site administrator',
    'editing-teacher': 'Teacher (can edit this course)',
    'student-or-viewer': 'Student or non-editing role',
    unknown: 'Unknown (open a course)',
  };

  /** Same idea as the backend's canonical_base_url: compare origin + path, no trailing slash. */
  /** @param {string} url */
  function canonical(url) {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '')}`;
    } catch {
      return url;
    }
  }

  /** @type {'linked' | 'other-user' | 'other-site' | 'not-connected' | null} */
  let link = $derived.by(() => {
    if (!page?.isMoodle || !page.loggedIn || !connection) return null;
    if (!connection.connected || !connection.baseUrl) return 'not-connected';
    if (canonical(connection.baseUrl) !== canonical(page.wwwroot)) return 'other-site';
    return connection.moodleUserId === page.userId ? 'linked' : 'other-user';
  });

  inspectActiveTab().then((result) => (page = result));

  // Re-fetch when the user logs in or out of LAMB while the popup is open.
  $effect(() => {
    const current = session;
    const detected = page;
    connection = null;
    if (!current || !detected?.isMoodle || !detected.loggedIn) return;

    let cancelled = false;
    fetchMoodleConnection(current.serverUrl, current.token)
      .then((result) => {
        if (!cancelled) connection = result;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  });
</script>

<section class="mt-4 border-t border-gray-200 pt-3">
  <h2 class="mb-2 text-sm font-semibold text-gray-900">Moodle</h2>

  {#if page === null}
    <p class="text-sm text-gray-500">Checking this tab…</p>
  {:else if !page.isMoodle}
    <p class="text-sm text-gray-500">
      {page.reason === 'restricted' ? 'This tab cannot be inspected.' : 'This tab is not a Moodle page.'}
    </p>
  {:else if !page.loggedIn}
    <p class="text-sm text-gray-700">
      {page.isGuest ? 'Browsing as guest' : 'Not logged in'} on
      <span class="break-all">{page.wwwroot}</span>
    </p>
  {:else}
    <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      <dt class="text-gray-500">Site</dt>
      <dd class="truncate text-gray-800">{page.wwwroot}</dd>
      <dt class="text-gray-500">User</dt>
      <dd class="text-gray-800">{page.fullName ?? '—'} (id {page.userId ?? '?'})</dd>
      {#if page.courseId}
        <dt class="text-gray-500">Course</dt>
        <dd class="truncate text-gray-800">{page.courseName ?? `id ${page.courseId}`}</dd>
      {/if}
      <dt class="text-gray-500">Role</dt>
      <dd class="text-gray-800">{ROLE_LABELS[page.roleGuess]}</dd>
    </dl>
    <p class="mt-1 text-xs text-gray-400">Role is guessed from the page, not read from Moodle.</p>

    {#if link === 'linked'}
      <p class="mt-2 rounded bg-green-50 px-2 py-1 text-sm text-green-800">
        Matches your Moodle connection in LAMB.
      </p>
    {:else if link === 'other-user'}
      <p class="mt-2 rounded bg-amber-50 px-2 py-1 text-sm text-amber-800">
        LAMB is connected to a different Moodle user (id {connection?.moodleUserId}).
      </p>
    {:else if link === 'other-site'}
      <p class="mt-2 rounded bg-amber-50 px-2 py-1 text-sm text-amber-800">
        LAMB is connected to another Moodle site.
      </p>
    {:else if link === 'not-connected'}
      <p class="mt-2 rounded bg-gray-50 px-2 py-1 text-sm text-gray-600">
        Your LAMB account has no Moodle connection yet.
      </p>
    {/if}
  {/if}
</section>
