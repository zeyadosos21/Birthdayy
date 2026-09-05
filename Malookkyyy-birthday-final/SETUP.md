# Malookkyyy Birthday Site — Setup

## 1. Add your photos and videos

Put your files in the `media/` folder.

Then open:

`assets/js/config.js`

You will see a big commented section called **ADD YOUR PHOTOS + VIDEOS HERE**.
Copy one of the examples and change the filename/category/caption.

Allowed categories are exactly:

- `21/6`
- `22/7`
- `Gym`
- `In Cairoo`

**All Memories is automatic.** It combines every category and shuffles the order when it opens.

## 2. Shared To Do List + Wedding Songs

GitHub Pages can host the website, but it cannot permanently save new visitor data by itself. The site therefore keeps GitHub Pages as the host and uses Supabase only as the small database.

1. Create a free Supabase project.
2. Open **SQL Editor**.
3. Open `supabase/setup.sql` from this project and run it.
4. In Supabase, open **Project Settings > API**.
5. Copy the Project URL and anon/public key.
6. Paste both into `assets/js/config.js`.

The NFC/GitHub Pages link does not change.

## 3. Owner delete controls (optional)

If you want only yourself to delete bad/duplicate to-dos and songs:

1. In Supabase Authentication, create your owner user with email/password.
2. Copy that user's UUID.
3. Replace `REPLACE_WITH_YOUR_ADMIN_USER_UUID` inside `supabase/setup.sql` with that UUID before running the owner delete functions.
4. Use **Owner controls** at the bottom of the Notes page to log in.

## 4. Password

The site uses the four-digit password you already chose. The repository stores only its SHA-256 hash, not the plain code.

When Supabase is connected, the same hashed-code check is used there too.

## 5. Push to the existing GitHub repo

Keep the repository named `Birthdayy` so this link stays the same:

`https://zeyadosos21.github.io/Birthdayy/`

From the existing local repo folder:

```powershell
git add -A
git commit -m "Build final Malookkyyy birthday site"
git push origin main
```
