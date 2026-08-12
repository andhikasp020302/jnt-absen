<script lang="ts">
  let {
    value = $bindable(''),
    id = 'pw',
    placeholder = '••••••',
    autocomplete = 'current-password'
  }: {
    value?: string;
    id?: string;
    placeholder?: string;
    autocomplete?: AutoFill;
  } = $props();

  let show = $state(false);
</script>

<div class="pw-wrap">
  <input
    {id}
    class="pwi"
    type={show ? 'text' : 'password'}
    bind:value
    {autocomplete}
    {placeholder}
    required
  />
  <button
    type="button"
    class="eye"
    onclick={() => (show = !show)}
    aria-label={show ? 'Sembunyikan password' : 'Lihat password'}
  >
    {#if show}
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="1" y1="1" x2="23" y2="23" stroke-linecap="round"/>
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    {/if}
  </button>
</div>

<style>
  .pw-wrap {
    position: relative;
  }
  /* dua kelas (.pwi) agar menang atas .field input global */
  .pw-wrap input.pwi {
    width: 100%;
    padding: 13px 46px 13px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--white);
    outline: none;
  }
  .pw-wrap input.pwi:focus {
    border-color: var(--green);
  }
  .eye {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: 0;
    padding: 8px;
    color: var(--muted);
    display: flex;
  }
</style>
