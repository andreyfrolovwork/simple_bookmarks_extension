# Chrome Web Store automation

The GitHub Action uploads a new zip as a **draft**. Google still reviews it. Listing text and screenshots stay in the Dev Console.

API: [Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api) via [chrome-webstore-upload-cli](https://github.com/fregante/chrome-webstore-upload-cli) v4.

## One-time Google keys

Follow [chrome-webstore-upload-keys](https://github.com/fregante/chrome-webstore-upload-keys) (~10 minutes):

1. [Google Cloud credentials](https://console.developers.google.com/apis/credentials) → create project `chrome-webstore-upload`
2. [OAuth overview](https://console.cloud.google.com/auth/overview) → Get started → Internal (or External + add yourself as test user)
3. Create OAuth client → **Desktop app** → save **Client ID** and **Client secret**
4. Enable [Chrome Web Store API](https://console.cloud.google.com/apis/library/chromewebstore.googleapis.com)
5. Locally:

```bash
npx chrome-webstore-upload-keys
```

That prints a **refresh token**. Keep all three values off git.

## GitHub secrets

Repo → **Settings → Secrets and variables → Actions**. Create:

| Secret | Where to get it |
|---|---|
| `CWS_CLIENT_ID` | OAuth Desktop client |
| `CWS_CLIENT_SECRET` | OAuth Desktop client |
| `CWS_REFRESH_TOKEN` | `npx chrome-webstore-upload-keys` |
| `CWS_EXTENSION_ID` | Dev Console item URL, or the ID on the store listing |
| `CWS_PUBLISHER_ID` | Dev Console → Account / publisher id |

Optional: **Settings → Environments → New** named `chrome-webstore` (the workflow already uses it). Add a required reviewer if you want a human gate.

## How a release runs

Default path (draft only, no auto-publish):

```bash
git tag v1.1.0
git push origin v1.1.0
```

Or **Actions → Chrome Web Store → Run workflow**.

Check **publish** only when you want the CLI to submit that draft for review.

Local equivalent after `npm run store:pack`:

```bash
export CLIENT_ID=... CLIENT_SECRET=... REFRESH_TOKEN=... EXTENSION_ID=... PUBLISHER_ID=...
npx chrome-webstore-upload-cli@4 upload --source bookmark-manager.zip
```

## What this does not do

- Rewrite store listing copy, screenshots, or the privacy URL
- Skip Google review
- Publish on every push to `main` (on purpose)
