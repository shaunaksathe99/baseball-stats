/* Dugout Diary - online account settings. Leave both blank to run fully offline (no sign-in shown).
   Fill these in after creating a free Supabase project (see cloud/SETUP.md). The anon key is meant to be public;
   your data is protected by the row-level security rules in cloud/schema.sql, not by hiding this key. */
window.DD_CLOUD = window.DD_CLOUD || { url: '', anonKey: '' };
