<script>
  import { auth } from '@/lib/auth.svelte.js';
  import LoginForm from '@/lib/components/LoginForm.svelte';
  import UserCard from '@/lib/components/UserCard.svelte';

  auth.init();
</script>

<main class="flex min-h-screen flex-col gap-4 p-4 font-sans">
  <h1 class="text-lg font-semibold text-gray-900">LAMB</h1>

  {#if auth.status === 'loading'}
    <p class="text-sm text-gray-500">Loading…</p>
  {:else if auth.session}
    <UserCard session={auth.session} />
  {:else}
    <LoginForm />
  {/if}
</main>
