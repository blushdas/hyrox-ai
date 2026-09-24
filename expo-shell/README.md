# FINISHER Expo Shell

Thin Expo wrapper (single WebView) around the FINISHER Next.js dev server.
Lets you test the app three ways without touching Capacitor/Xcode.

## Setup (once)

```bash
cd expo-shell
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_WEB_URL to your Mac's LAN IP
```

Find your Mac's LAN IP: `ipconfig getifaddr en0`

## 1. Web app (browser testing)

From the repo root:

```bash
npm run dev
```

Open http://localhost:3000 — unchanged, no Expo involved.

## 2. iOS Simulator

From the repo root, start the dev server bound to all interfaces:

```bash
npm run dev:lan
```

From `expo-shell/`:

```bash
npm run ios
```

Opens Expo Go in the iOS Simulator, loading `EXPO_PUBLIC_WEB_URL`.

## 3. Real iPhone via Expo Go

1. Install **Expo Go** from the App Store on your iPhone.
2. Make sure the iPhone is on the same Wi-Fi as your Mac.
3. Repo root: `npm run dev:lan`
4. `expo-shell/`: `npm start`
5. Scan the QR code in the terminal with your iPhone camera.

## Notes

- This wraps whatever `EXPO_PUBLIC_WEB_URL` points at — it does not bundle
  the app natively. It's for fast iteration only, not an App Store build.
- If the WebView shows a blank/error screen, the LAN IP changed (DHCP) or
  the dev server isn't bound to `0.0.0.0` — re-run `npm run dev:lan` and
  update `.env`.
