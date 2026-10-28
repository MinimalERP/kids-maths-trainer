# Kids Maths Trainer

A child-friendly maths learning platform for a 7-year-old in First Standard. The project will combine a guided 30-day learning plan, a parent-managed content studio, a web app, and an Android app.

## Product goals

- Build number sense, mental addition and subtraction, patterns, reasoning, estimation, and confidence.
- Keep daily activities short, playful, and pressure-free (about 15–20 minutes).
- Let a parent create, preview, upload, and publish new learning tasks.
- Make published lessons available to the web and Android apps without rebuilding the Android app.
- Support offline practice with progress sync when connected.

## Planned architecture

- **Web app:** TypeScript and React, deployed with GitHub Pages.
- **Android app:** Capacitor wrapper around the shared web experience.
- **Backend:** Supabase for published content, authentication, and progress sync.
- **Local storage:** Cached lessons and progress for offline use.
- **Content formats:** In-app editor plus validated JSON import; CSV can be added for suitable question types.

No Supabase project or credentials are committed here. Configure secrets through GitHub Actions and Supabase settings; never put a Supabase service-role key in client code.

## Initial learning plan

The first curriculum targets ages 6–8 and includes 30 daily activities:

1. Number sense and counting
2. Mental addition and subtraction
3. Patterns and logical thinking
4. Applied maths, measurement, money, and review

Activities should provide hints and explanations, adapt to a child's progress, and avoid timed tests or punitive feedback.

## Roadmap

- [ ] Build the child-facing web app and first 30 daily activities
- [ ] Add parent mode and task authoring/preview
- [ ] Add validated JSON import and publish workflow
- [ ] Add Supabase schema, authentication, and row-level security
- [ ] Deploy the web app to GitHub Pages
- [ ] Package the app for Android with Capacitor
- [ ] Add offline caching and progress synchronization

## Development status

This repository is the project home and initial specification. Implementation and deployment configuration are to follow.
