<script>
  import { auth } from '../auth.svelte.js';

  /** @type {{ session: import('../lambApi.js').LambSession }} */
  let { session } = $props();
</script>

<div class="flex flex-col gap-3">
  <div>
    <p class="font-semibold text-gray-900">{session.user.name}</p>
    <p class="text-sm text-gray-600">{session.user.email}</p>
  </div>

  <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
    <dt class="text-gray-500">Server</dt>
    <dd class="truncate text-gray-800">{session.serverUrl}</dd>
    <dt class="text-gray-500">Type</dt>
    <dd class="text-gray-800">{session.user.user_type}</dd>
    {#if session.user.organization_role}
      <dt class="text-gray-500">Org role</dt>
      <dd class="text-gray-800">{session.user.organization_role}</dd>
    {/if}
  </dl>

  <div class="flex gap-2">
    <a
      class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
      href={session.serverUrl}
      target="_blank"
      rel="noreferrer"
    >
      Open LAMB
    </a>
    <button
      class="flex-1 rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-900"
      type="button"
      onclick={() => auth.logout()}
    >
      Log out
    </button>
  </div>
</div>
