# Signing TwitchLoop Extension for Permanent Installation

## Why Sign?
Temporary extensions are lost when Firefox restarts. A signed extension installs permanently and survives restarts, making it perfect for unattended operation.

## Quick Method: Build Unsigned XPI (Testing Only)

Run `build-extension.bat` in the parent directory to create an unsigned XPI.

**Note:** Unsigned XPIs only work in Firefox Developer Edition with signature verification disabled.

---

## Recommended Method: Get Mozilla-Signed XPI

### Step 1: Create Firefox Account & API Keys

1. Go to https://addons.mozilla.org/developers/
2. Sign in or create a Firefox Account
3. Go to: https://addons.mozilla.org/en-US/developers/addon/api/key/
4. Click "Generate new credentials"
5. Save your:
   - **JWT Issuer** (looks like: user:12345678:123)
   - **JWT Secret** (long random string)

### Step 2: Sign Using web-ext

#### Option A: Command Line (Manual)

```bash
cd TwitchLoopExtension

npx web-ext sign ^
  --api-key="YOUR_JWT_ISSUER_HERE" ^
  --api-secret="YOUR_JWT_SECRET_HERE" ^
  --channel=unlisted
```

The signed XPI will be created in `web-ext-artifacts/` folder.

#### Option B: Web Upload (Easier)

1. Build unsigned XPI first:
   ```bash
   cd TwitchLoopExtension
   npx web-ext build --overwrite-dest
   ```

2. Go to https://addons.mozilla.org/developers/addons/submit/upload-unlisted
3. Upload the XPI from `web-ext-artifacts/` folder
4. Wait for validation (~5 minutes)
5. Download the signed XPI

### Step 3: Install Signed XPI

Once you have the signed XPI:

1. **Manual Install:**
   - Open Firefox
   - Drag the signed `.xpi` file into Firefox
   - Click "Add" when prompted
   - Extension is now permanently installed!

2. **Automated Install (for AHK script):**
   - Place signed XPI in: `C:\Users\arshs\AutoHotkey\TwitchLoopExtension.xpi`
   - The AHK script will auto-install it on Firefox restart

---

## After Signing

Once installed, the extension will:
- ✅ Survive Firefox restarts
- ✅ Work on regular Firefox (not just Developer Edition)
- ✅ Auto-start with the browser
- ✅ Work completely unattended

---

## Troubleshooting

**"This add-on could not be installed because it appears to be corrupt"**
- The XPI needs to be signed by Mozilla
- Use Firefox Developer Edition for unsigned XPIs, OR
- Get it signed using the methods above

**"Signature verification disabled" warning**
- This means you're using an unsigned XPI
- It will work but shows warnings
- Recommended to get a signed version

**Extension disappears after restart**
- You're using a temporary extension
- Follow this guide to get a signed XPI
