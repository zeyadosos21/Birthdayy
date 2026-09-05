/*
  ============================================================
  MALOOKKYYY BIRTHDAY SITE — EASY EDIT AREA
  ============================================================

  You should only need to edit this file when adding photos,
  videos, captions, or changing the Memories text.

  1) Copy your files into the /media folder.
  2) Add one line for each file inside `media` below.
  3) Keep category EXACTLY one of:
       "21/6", "22/7", "Gym", "In Cairoo"

  "All Memories" is created automatically and mixes everything.
*/

window.BIRTHDAY_CONFIG = {
  name: "Malookkyyy",

  // This hash lets the static site verify the private 4-digit code even
  // before Supabase is connected. Keep the plain code out of the repo.
  fallbackPasswordHash: "5c9a7f508de2f1ec87076e88a888f9af847c69d68565ab6a6983fc8b497fa1f8",

  // ----------------------------------------------------------
  // SUPABASE — needed only for shared To Do List / Wedding Songs
  // ----------------------------------------------------------
  // The website can still live on the SAME GitHub Pages URL.
  // Paste your values here after following SETUP.md.
  supabaseUrl: "PASTE_SUPABASE_PROJECT_URL_HERE",
  supabaseAnonKey: "PASTE_SUPABASE_ANON_KEY_HERE",

  // ==========================================================
  // ADD YOUR PHOTOS + VIDEOS HERE
  // ==========================================================
  media: [
    // ---------- 21/6 ----------
    // { type: "image", src: "media/21-6-photo-01.jpg", category: "21/6", caption: "Our day" },
    // { type: "video", src: "media/21-6-video-01.mp4", category: "21/6", caption: "A little moment" },

    // ---------- 22/7 ----------
    // { type: "image", src: "media/22-7-photo-01.jpg", category: "22/7", caption: "Another favorite" },
    // { type: "video", src: "media/22-7-video-01.mp4", category: "22/7", caption: "22/7" },

    // ---------- GYM ----------
    // { type: "image", src: "media/gym-photo-01.jpg", category: "Gym", caption: "Gym" },
    // { type: "video", src: "media/gym-video-01.mp4", category: "Gym", caption: "Growing stronger together" },

    // ---------- IN CAIROO ----------
    // { type: "image", src: "media/cairo-photo-01.jpg", category: "In Cairoo", caption: "Cairoo" },
    // { type: "video", src: "media/cairo-video-01.mp4", category: "In Cairoo", caption: "A Cairo night" },

    // OPTIONAL VIDEO POSTER EXAMPLE:
    // { type: "video", src: "media/video.mp4", poster: "media/video-cover.jpg", category: "21/6", caption: "Memory" },
  ],

  // ==========================================================
  // MEMORIES TIMELINE — EDIT THE TEXT HERE ANY TIME
  // ==========================================================
  memories: [
    { title: "21/6", text: "The beginning of a favorite chapter." },
    { title: "22/7", text: "Another sweet memory to keep." },
    { title: "Gym", text: "Growing stronger together." },
    { title: "In Cairoo", text: "Small moments in our favorite city." }
  ]
};
