# Malookkyyy Birthday Site — Setup

This project is intentionally **plain HTML/CSS/JS**, so it works directly on GitHub Pages with **no build command**.

## 1) Keep the exact same NFC / GitHub Pages link
Do **not** create a new repository. Open the repository that your NFC card already points to and replace its old site files with the contents of this folder. Keep the same repository name and GitHub Pages settings.

## 2) Add photos and videos later
Copy your files into the `media/` folder.

Then open `assets/js/config.js` and edit only the `media` array, for example:

```js
media: [
  { type: "video", src: "media/intro.mp4", poster: "media/photo1.jpg", caption: "Our intro 💖" },
  { type: "image", src: "media/photo1.jpg", caption: "Us" },
  { type: "image", src: "media/photo2.jpg", caption: "Favorite day" },
  { type: "video", src: "media/outro.mp4", caption: "And many more" },
],
```

The same list automatically powers the **large slider at the top** and the full Gallery wall.

## 3) Connect Notes while keeping GitHub Pages
GitHub Pages cannot permanently save visitor messages by itself. Supabase is used **only as the database**; GitHub Pages remains the host, so the NFC link does not change.

1. Create a free Supabase project.
2. In **Authentication → Users**, create one user for yourself (your admin email/password).
3. Copy that user's UUID.
4. Open `supabase/setup.sql` and replace `REPLACE_WITH_YOUR_ADMIN_USER_UUID` with your UUID.
5. In Supabase **SQL Editor**, paste and run the complete `supabase/setup.sql` file.
6. In **Project Settings → API**, copy the Project URL and anon/public key.
7. Open `assets/js/config.js` and paste them here:

```js
supabaseUrl: "https://YOURPROJECT.supabase.co",
supabaseAnonKey: "YOUR_ANON_KEY",
```

That is all. Visitors enter `2912`, submit a note, and it appears instantly. They need no account.

## 4) Admin deletion
On the Notes page, open **Owner controls** and log in with the Supabase admin user you created. Delete buttons will appear only in your authenticated admin session.

For extra safety in Supabase, disable public user signups after creating your admin account.

## 5) Password behavior
The birthday password is `2912`.

With Supabase connected, the browser asks the database to verify it rather than keeping the plain password in the page code. There is also a hashed fallback so you can preview the static site before Supabase is connected.

**GitHub Pages limitation:** GitHub Pages is static hosting. The normal site is password-gated, but someone with technical knowledge and direct access to a public repo can still inspect the HTML/media files. True server-side protection would require moving hosting behind an authenticated server. For an NFC/shared birthday page, this setup keeps the same link and gives the intended visitor experience.

## 6) Files you can delete from the old repo
The MP3 is no longer used. You can delete `iloveyou.mp3` and any old images/videos you do not want.
