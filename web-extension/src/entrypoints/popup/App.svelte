<script>
  import { auth } from '@/lib/auth.svelte.js';
  import LoginForm from '@/lib/components/LoginForm.svelte';
  import UserCard from '@/lib/components/UserCard.svelte';
  import MoodleCard from '@/lib/components/MoodleCard.svelte';

  auth.init();
</script>

<main class="w-80 p-4 font-sans">
  <h1 class="mb-4 text-lg font-semibold text-gray-900">LAMB</h1>

  {#if auth.status === 'loading'}
    <p class="text-sm text-gray-500">Loading…</p>
  {:else if auth.status === 'logged-in' && auth.session}
    <UserCard session={auth.session} />
  {:else}
    <LoginForm />
  {/if}

  {#if auth.status !== 'loading'}
    <MoodleCard session={auth.session} />
  {/if}
</main>
