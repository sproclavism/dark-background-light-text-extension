<script lang="ts">
  import ColorInput from './ColorInput.svelte';
  import { query_style } from '../common/ui-style';
  import type {
    ConfiguredPages,
    MethodIndex,
    Preferences,
  } from '../common/types';
  import {
    preferences,
    get_prefs,
    on_prefs_change,
    prefs_keys_with_defaults,
    set_pref,
  } from '../common/shared';
  import { methods } from '../methods/methods';
  import type { Browser } from 'webextension-polyfill';
  export let browser: Browser;

  query_style().catch((error) => console.error(error));

  let current_preferences: Preferences = [];
  let configured_pages: ConfiguredPages = {};
  async function update_prefs() {
    const saved_prefs = await get_prefs();
    current_preferences = preferences.map((pref) => ({
      ...pref,
      value: saved_prefs[pref.name],
    })) as Preferences;

    configured_pages = current_preferences.find(
      (p) => p.name === 'configured_pages',
    )!.value as ConfiguredPages;
  }
  update_prefs().catch((error) => console.error(error));
  on_prefs_change(() => {
    update_prefs().catch((error) => console.error(error));
    query_style().catch((error) => console.error(error));
  });

  // Methods that can be assigned to a configured page ("Default" means "no
  // override", so it is represented by removing the entry instead).
  const method_options = Object.values(methods).filter(
    (m) => m.number !== '-1',
  );

  let new_page_url = '';
  let new_page_method: MethodIndex = '1';

  function set_page_method(page: string, method: string) {
    set_pref('configured_pages', {
      ...configured_pages,
      [page]: method as MethodIndex,
    }).catch((error) => console.error(error));
  }

  function remove_page(page: string) {
    set_pref(
      'configured_pages',
      Object.fromEntries(
        Object.entries(configured_pages).filter(([k]) => k !== page),
      ),
    ).catch((error) => console.error(error));
  }

  function rename_page(old_url: string, raw_new_url: string) {
    const new_url = raw_new_url.trim();
    if (!new_url || new_url === old_url || new_url in configured_pages) {
      // Reset the input back to the stored value on invalid/duplicate edits.
      update_prefs().catch((error) => console.error(error));
      return;
    }
    const next: ConfiguredPages = {};
    for (const [k, v] of Object.entries(configured_pages)) {
      next[k === old_url ? new_url : k] = v;
    }
    set_pref('configured_pages', next).catch((error) => console.error(error));
  }

  function add_page() {
    const url = new_page_url.trim();
    if (!url || url in configured_pages) {
      return;
    }
    set_page_method(url, new_page_method);
    new_page_url = '';
  }
</script>

<main class="container-fluid">
  <div class="row"><div class="col-xs-12"><h2>Options</h2></div></div>
  {#each current_preferences as pref (pref.name)}
    {#if pref.type !== 'configured_pages'}
      <div class="row">
        <div class="col-xs-10 col-sm-4 col-md-4">
          <label class="full-width" for="labeled_pref_{pref.name}"
            >{pref.title}</label
          >
        </div>
        {#if pref.type === 'bool'}
          <div class="col-xs-2 col-sm-4 col-md-6">
            <input
              bind:checked={pref.value}
              on:change={(e) => set_pref(pref.name, e.currentTarget.checked)}
              class="pref_{pref.name} full-width form-control"
              id="labeled_pref_{pref.name}"
              type="checkbox"
              data-pref-type={pref.type}
            />
          </div>
        {:else if pref.type === 'menulist'}
          <div class="col-xs-12 col-sm-8 col-md-6">
            <select
              on:change={(e) =>
                set_pref(pref.name, e.currentTarget.selectedIndex)}
              class="pref_{pref.name} full-width form-control"
              id="labeled_pref_{pref.name}"
              data-pref-type={pref.type}
            >
              {#each pref.options as option (option.value)}
                <option selected={pref.value === parseInt(option.value, 10)}
                  >{option.label}</option
                >
              {/each}
            </select>
          </div>
        {:else if pref.type === 'color'}
          <ColorInput
            value={pref.value}
            default={pref.value}
            on:change={(e) => set_pref(pref.name, e.detail.value)}
            class="col-xs-12 col-sm-8 col-md-6"
          />
        {/if}
        <div class="col-xs-12 col-sm-4 col-md-2">
          <button
            on:click={() =>
              set_pref(pref.name, prefs_keys_with_defaults[pref.name])}
            class="btn btn-default full-width">Reset</button
          >
        </div>
      </div>
    {/if}
  {/each}

  {#await browser.runtime.getPlatformInfo() then platformInfo}
    {#if platformInfo.os !== 'android'}
      <div class="row"><div class="col-xs-12"><h2>Shortcuts</h2></div></div>
      <div>
        In order to configure shortcuts, go to about:addons (Menu -&gt;
        Add-ons), press on the cogwheel icon, then choose "Manage Extension
        Shortcuts"
      </div>
      <a
        href="https://support.mozilla.org/kb/manage-extension-shortcuts-firefox"
        >See this support article for the detais</a
      >
    {/if}
  {/await}

  <div class="row"><div class="col-xs-12"><h2>Configured pages</h2></div></div>
  <div class="row configured_page">
    <div class="col-xs-12 col-sm-12 col-md-5 col-lg-8 configured_page_url">
      <input
        class="full-width form-control"
        type="text"
        placeholder="example.com"
        bind:value={new_page_url}
        on:keydown={(e) => {
          if (e.key === 'Enter') add_page();
        }}
      />
    </div>
    <div class="col-xs-12 col-sm-8 col-md-3 col-lg-2">
      <select class="full-width form-control" bind:value={new_page_method}>
        {#each method_options as option (option.number)}
          <option value={option.number}>{option.label}</option>
        {/each}
      </select>
    </div>
    <div class="col-xs-12 col-sm-4 col-md-2 col-lg-2">
      <button
        on:click={add_page}
        disabled={!new_page_url.trim() ||
          new_page_url.trim() in configured_pages}
        class="btn btn-default full-width">Add</button
      >
    </div>
  </div>
  {#each Object.entries(configured_pages) as [page, method_index] (page)}
    <div class="row configured_page">
      <div class="col-xs-12 col-sm-12 col-md-5 col-lg-8 configured_page_url">
        <input
          class="full-width form-control"
          type="text"
          value={page}
          on:change={(e) => rename_page(page, e.currentTarget.value)}
        />
      </div>
      <div class="col-xs-12 col-sm-8 col-md-3 col-lg-2">
        <select
          class="full-width form-control"
          on:change={(e) => set_page_method(page, e.currentTarget.value)}
        >
          {#each method_options as option (option.number)}
            <option
              value={option.number}
              selected={option.number === method_index}>{option.label}</option
            >
          {/each}
        </select>
      </div>
      <div class="col-xs-12 col-sm-4 col-md-2 col-lg-2">
        <button
          on:click={() => remove_page(page)}
          class="btn btn-default full-width">Remove</button
        >
      </div>
    </div>
  {:else}
    <div class="row configured_page">
      <div class="col-xs-12">There is no single configured page</div>
    </div>
  {/each}
</main>

<style>
</style>
