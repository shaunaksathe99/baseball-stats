/* Plate 450 Diary - online account settings. Leave both blank to run fully offline (no sign-in shown).
   See cloud/SETUP.md. The publishable key is meant to be public; your data is protected by the row-level
   security rules in cloud/schema.sql, not by hiding this key. Never put the secret / service_role key here.
   turnstileKey is the public site key for the invisible Cloudflare Turnstile check on sign-in (leave blank to turn it off). */
window.DD_CLOUD = window.DD_CLOUD || { url: 'https://jjldpvkfnnoxrswlrcjl.supabase.co', anonKey: 'sb_publishable_W9R8RGNblBmxg9rteboaAg_aptgJIWs', turnstileKey: '0x4AAAAAAGSJnx_nCfxSREYo' };
