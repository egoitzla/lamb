import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

/** Default Brave install path per OS. Override with the BRAVE_PATH env var. */
const BRAVE_PATHS: Partial<Record<NodeJS.Platform, string>> = {
  darwin: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  linux: '/usr/bin/brave-browser',
  win32: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
};

const bravePath: string | undefined =
  process.env.BRAVE_PATH ?? BRAVE_PATHS[process.platform];

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'LAMB',
    description: 'LAMB browser extension',
    permissions: ['storage'],
    // Toolbar icon; the background script makes clicking it open the side panel.
    action: { default_title: 'Open LAMB' },
  },
  webExt: {
    binaries: bravePath ? { brave: bravePath } : {},
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
