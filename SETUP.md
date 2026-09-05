# Malookkyyy Birthday Site — V5 Setup

This version has the full Owner Dashboard. The website stays on the same GitHub Pages URL; Supabase is only the database, authentication and media storage.

## What the owner can edit without touching code
- 4-digit guest PIN
- Gallery photos/videos
- Gallery category slider (add, rename, reorder, delete)
- Photo/video caption and category
- Memories timeline (add, edit, reorder, delete)
- To Do List (add, edit, complete, delete)
- Wedding Songs (add, edit, delete)

## Supabase setup
1. Create a new Supabase project.
2. Open **SQL Editor** and run the complete file `supabase/setup.sql`.
3. Open **Authentication > Users** and create ONE owner user with your email and a strong password.
4. Open `supabase/owner.sql`, replace `REPLACE_WITH_YOUR_OWNER_EMAIL` with that exact email, then run it in SQL Editor.
5. In Supabase, copy your **Project URL** and **Publishable key**.
6. Open `assets/js/config.js` and paste them into:
   - `supabaseUrl`
   - `supabasePublishableKey`
7. Push the site to GitHub Pages.

## Starting guest PIN
`2912`

Change it later from **Owner Dashboard > Security**.

## Owner dashboard
Open `owner.html`, or use **Notes > Owner controls** to log in. The dashboard verifies the signed-in account against `birthday_admins`.

## Gallery uploads
The owner dashboard uploads files to the Supabase Storage bucket `gallery-media`. Public Gallery metadata is still protected by the 4-digit site PIN. Storage files use public URLs so they display on static GitHub Pages.

## Important security rule
Only put the **Publishable key** in the site. Never put a Supabase Secret/Service Role key in GitHub or browser JavaScript.
