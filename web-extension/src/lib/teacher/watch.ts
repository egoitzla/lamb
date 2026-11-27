/**
 * Calls `onChange` whenever the page in front of the user may have changed: the
 * active tab loads or changes URL (Moodle reloads the page when editing mode is
 * toggled), the user switches tab, or focuses another window. Returns a function
 * that stops watching.
 */
export function watchActivePage(onChange: () => void): () => void {
  const onUpdated: Parameters<typeof browser.tabs.onUpdated.addListener>[0] = (
    _tabId,
    changeInfo,
    tab,
  ) => {
    if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) onChange();
  };
  const onActivated = () => onChange();
  const onFocusChanged = (windowId: number) => {
    // WINDOW_ID_NONE: the browser lost focus, so the page is still the same.
    if (windowId !== browser.windows.WINDOW_ID_NONE) onChange();
  };

  browser.tabs.onUpdated.addListener(onUpdated);
  browser.tabs.onActivated.addListener(onActivated);
  browser.windows.onFocusChanged.addListener(onFocusChanged);

  return () => {
    browser.tabs.onUpdated.removeListener(onUpdated);
    browser.tabs.onActivated.removeListener(onActivated);
    browser.windows.onFocusChanged.removeListener(onFocusChanged);
  };
}
