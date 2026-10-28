# Number Nest · Kids Maths Trainer

A playful maths learning app for a 7-year-old in First Standard. It includes the first 30 days of short activities, an offline-first child view, and a local parent area for authoring and importing/exporting tasks.

## What's working in this first version

- Responsive web app that also fits a phone screen.
- 30 initial activities covering number sense, addition, subtraction, patterns, reasoning, shapes, measurement, and money.
- Answer feedback, gentle hints, next activity navigation, stars, and saved progress.
- Parent area to create a parent account, sync progress, publish tasks, and import/export task JSON.
- Capacitor configuration for packaging the same web app as an Android app.
- GitHub Pages deployment workflow on pushes to `main`.

Starter progress and parent-created tasks are saved locally. A parent can create/sign into an account to sync progress and publish custom tasks to Supabase; published tasks load on other devices.

## Run locally

```sh
npm install
npm run dev
```

Build the web app with `npm run build`.

## Android

Install Android Studio and its Android SDK, then:

```sh
npm run android:init
npm run android:sync
npm run android:open
```

Android Studio can then build and install the app on an emulator or connected phone. The Android build needs the Android SDK/JDK configured on the build machine.

## GitHub Pages

GitHub Pages is configured at [minimalerp.github.io/kids-maths-trainer](https://minimalerp.github.io/kids-maths-trainer/). The workflow at `.github/workflows/pages.yml` builds and publishes the app on pushes to `main`. The configured site path is `/kids-maths-trainer/`.

## Supabase connection

The dedicated Supabase project is `kids-maths-trainer` (`hbxgcmayrcyxwkfultwl`, region `ap-south-1`, Mumbai). Its database contains only the learning app's `learning_tasks` and `learning_progress` tables. The connected `MinimalERP` project contains ERP data and remains separate.

The local `.env.local` file holds the project URL and **publishable key** (`sb_publishable_...`). These are public client values protected by row-level security; never put a secret/service-role key in the app or GitHub Pages bundle. The schema migration is in `supabase/migrations/`. Parent sign-in uses email/password. In Supabase Dashboard → **Authentication → URL Configuration**, set the Site URL to `https://minimalerp.github.io/kids-maths-trainer/` and add that URL plus `http://localhost:5173/` to the allowed redirect URLs. A parent must verify the email if email confirmation is enabled in Supabase Auth.

## Next steps

- [x] Create the dedicated Supabase project and learning tables with RLS
- [x] Add parent authentication, task publishing, and progress sync
- [ ] Set the Supabase Auth Site URL and allowed redirect URLs
- [ ] Download the Android APK artifact and install it on the target phone
- [ ] Add review/preview, image uploads, and richer question types to the content studio
