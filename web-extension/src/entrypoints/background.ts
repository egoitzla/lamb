/** Opens the side panel when the toolbar icon is clicked. */
export default defineBackground(() => {
  if (import.meta.env.FIREFOX) {
    // Firefox builds target MV2 (browserAction) by default; sidebarAction is Firefox-only.
    const action = browser.action ?? browser.browserAction;
    // @ts-expect-error -- sidebarAction is missing from the Chrome typings.
    action.onClicked.addListener(() => browser.sidebarAction.toggle());
  } else {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});
