# COURTSIDE v9

This update keeps the existing Supabase project and data. Do NOT rerun the SQL schema unless the database itself was deleted.

1. Upload all files in this folder to the GitHub Pages repository root.
2. Replace the old files when GitHub asks.
3. Wait for the Pages workflow to finish.
4. Open the site and then `editor.html` for the CMS.

The admin uses the existing `profiles.is_admin` flag. Media is stored in the existing public `site-images` bucket.

If the cloud is temporarily unavailable, public pages fall back to the local `data.js` copy instead of rendering an empty screen.
