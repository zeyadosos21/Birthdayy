/*
  ============================================================
  MALOOKKYYY BIRTHDAY SITE — EASY EDIT / FALLBACK AREA
  ============================================================

  After Supabase is connected, the OWNER DASHBOARD becomes the
  normal way to add/remove media, categories, memories and change
  the site PIN. You will NOT need to edit code for normal updates.

  If you ever want to test the site BEFORE Supabase is connected,
  you can still add local files below.

  ------------------------------------------------------------
  ADD YOUR PHOTOS / VIDEOS MANUALLY (OPTIONAL FALLBACK)
  ------------------------------------------------------------
  1) Put the file inside /media
  2) Add a line inside `media` below

  Example photo:
    { type: "image", src: "media/photo-01.jpg", category: "21/6", caption: "Our day" }

  Example video:
    { type: "video", src: "media/video-01.mp4", category: "In Cairoo", caption: "Cairo night" }
*/
window.BIRTHDAY_CONFIG = {
  name: "Malookkyyy",

  // SHA-256 of the starting guest PIN: 2912.
  // Once Supabase is connected, the database PIN is used instead.
  fallbackPasswordHash: "5c9a7f508de2f1ec87076e88a888f9af847c69d68565ab6a6983fc8b497fa1f8",

  // ==========================================================
  // SUPABASE CONNECTION — paste these after creating the project
  // ==========================================================
  supabaseUrl: "https://pzmpnuabucmjeagtqrer.supabase.co",
  supabasePublishableKey: "sb_publishable_Ne2v3sqJIR9OBSd_1VjtAg_rQgUI4Lf",

  // OPTIONAL LOCAL FALLBACK CATEGORIES
  fallbackCategories: ["21/6", "22/7", "Gym", "In Cairoo"],

  // ==========================================================
  // ADD YOUR PHOTOS + VIDEOS HERE (OPTIONAL FALLBACK ONLY)
  // ==========================================================
  media: [
    // { type: "image", src: "media/21-6-photo-01.jpg", category: "21/6", caption: "Our day" },
    // { type: "video", src: "media/21-6-video-01.mp4", category: "21/6", caption: "A little moment" },
    // { type: "image", src: "media/cairo-photo-01.jpg", category: "In Cairoo", caption: "Cairoo" },
  ],

  // OPTIONAL LOCAL FALLBACK MEMORIES
  memories: [
    { title: "21/6", text: "The beginning of a favorite chapter." },
    { title: "22/7", text: "Another sweet memory to keep." },
    { title: "Gym", text: "Growing stronger together." },
    { title: "In Cairoo", text: "Small moments in our favorite city." }
  ]
};
