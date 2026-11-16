<script lang="ts">
  import { assistantDisplayName, fetchAssistants } from '../api/assistants';
  import { SessionExpiredError } from '../api/errors';
  import { auth } from '../auth.svelte';
  import type { LambAssistant, LambSession } from '../types';

  let { session }: { session: LambSession } = $props();

  let assistants = $state.raw<LambAssistant[]>([]);
  let total = $state(0);
  let loading = $state(true);
  let error = $state<string | null>(null);

  const hasMore = $derived(assistants.length < total);

  /** Loads the next page, or the first one when `reset` is set. */
  async function load(reset = false) {
    loading = true;
    error = null;
    try {
      const offset = reset ? 0 : assistants.length;
      const page = await fetchAssistants(session.serverUrl, session.token, offset);
      assistants = reset ? page.assistants : [...assistants, ...page.assistants];
      total = page.total_count;
    } catch (e) {
      if (e instanceof SessionExpiredError) {
        await auth.logout(e.message);
        return;
      }
      error = e instanceof Error ? e.message : 'Could not load your assistants.';
    } finally {
      loading = false;
    }
  }

  load(true);
</script>

<section class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-semibold text-gray-900">
      My assistants
      {#if total > 0}<span class="font-normal text-gray-500">({total})</span>{/if}
    </h2>
    <button
      class="text-xs text-blue-600 hover:underline disabled:opacity-50"
      type="button"
      disabled={loading}
      onclick={() => load(true)}
    >
      Refresh
    </button>
  </div>

  {#if error}
    <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>
  {/if}

  {#if assistants.length > 0}
    <ul class="flex flex-col gap-2">
      {#each assistants as assistant (assistant.id)}
        <li>
          <a
            class="flex flex-col gap-1 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
            href="{session.serverUrl}/assistants?view=detail&id={assistant.id}"
            target="_blank"
            rel="noreferrer"
          >
            <span class="flex items-center justify-between gap-2">
              <span class="truncate text-sm font-medium text-gray-900">
                {assistantDisplayName(assistant.name)}
              </span>
              {#if assistant.published}
                <span class="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                  Published
                </span>
              {:else}
                <span class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  Draft
                </span>
              {/if}
            </span>
            {#if assistant.description}
              <span class="line-clamp-2 text-xs text-gray-600">{assistant.description}</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  {:else if !loading && !error}
    <p class="text-sm text-gray-500">You have not created any assistants yet.</p>
  {/if}

  {#if loading}
    <p class="text-sm text-gray-500">Loading assistants…</p>
  {:else if hasMore}
    <button
      class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      type="button"
      onclick={() => load()}
    >
      Load more
    </button>
  {/if}
</section>
