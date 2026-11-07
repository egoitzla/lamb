<script>
  import { auth } from '../auth.svelte.js';

  let serverUrl = $state(auth.serverUrl);
  let email = $state('');
  let password = $state('');
  let submitting = $state(false);
  /** @type {string | null} */
  let error = $state(null);

  /** @param {SubmitEvent} event */
  async function onsubmit(event) {
    event.preventDefault();
    submitting = true;
    error = null;
    try {
      await auth.login(serverUrl, email, password);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Login failed.';
    } finally {
      submitting = false;
    }
  }
</script>

<form class="flex flex-col gap-3" {onsubmit}>
  {#if auth.notice}
    <p class="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{auth.notice}</p>
  {/if}

  <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
    Server
    <input
      class="rounded-md border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
      type="url"
      required
      placeholder="https://lamb.example.org"
      bind:value={serverUrl}
    />
  </label>

  <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
    Email
    <input
      class="rounded-md border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
      type="email"
      required
      autocomplete="username"
      bind:value={email}
    />
  </label>

  <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
    Password
    <input
      class="rounded-md border border-gray-300 px-3 py-2 font-normal focus:border-blue-500 focus:outline-none"
      type="password"
      required
      autocomplete="current-password"
      bind:value={password}
    />
  </label>

  {#if error}
    <p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>
  {/if}

  <button
    class="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    type="submit"
    disabled={submitting}
  >
    {submitting ? 'Logging in…' : 'Log in'}
  </button>
</form>
