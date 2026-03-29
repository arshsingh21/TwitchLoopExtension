# Firefox Extension Session-Only 'Total' Count Update

This plan outlines the changes required to make the "total" count (tabs cycled) session-specific rather than "All time".

## Effort Analysis

1. **Code Change (Very Low):** ~5-10 minutes.
   - Update `background.js` to use `browser.storage.session` for `cycleCount`.
   - Remove `cycleCount` from `browser.storage.local` persistence.
2. **Submission (Low):** ~10 minutes. 
   - Uploading the ZIP and filling out the version notes on the Firefox Add-ons portal (AMO).
3. **Approval (Variable):** 
   - **Auto-approval:** Usually within minutes for simple updates.
   - **Manual review:** If triggered, can take 3-7+ days. 

## Technical Changes

### [MODIFY] [background.js](file:///c:/Users/arshs/AutoHotkey/TwitchLoopExtension/background.js)
- Update data restoration to check `browser.storage.session.get("cycleCount")`.
- Update increment logic to save to `browser.storage.session` instead of `local`.
- Add cleanup to ensure `cycleCount` is removed from `local` storage if it exists (one-time migration).

## Verification Plan

1. Load as temporary extension in `about:debugging`.
2. Cycle some tabs and check the "Total" count.
3. Restart the browser and verify the "Total" resets to 0.
4. Verify "Total" persists if the background script is suspended/resumed within the same session.
