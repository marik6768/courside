# COURTSIDE v10

1. Keep `config.js` configured with the Supabase project URL and Publishable key.
2. Open `editor.html` and sign in with the admin account.
3. Edit Home, Forecast, Stats, GI, GOAT, News and Forum from Admin Desk.
4. Use Media Library to upload as many images as needed, then assign them to page slots or the Home gallery.
5. `index.html` is the public home page.

Removed from this build:
- Compare
- Insights

No additional SQL migration is required for the v10 content fields. The new forecast reasoning fields live inside the existing `site_content.payload` JSON.
