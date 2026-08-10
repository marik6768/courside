# COURTSIDE Cloud CMS

This version keeps the public site on GitHub Pages but moves the editable content to Supabase.

## What it gives you

- Admin login with email/password.
- One shared content record, so changes are visible to every visitor.
- Edit forecasts and all main text.
- Edit the player statistics / GI table.
- Edit GOAT ranking.
- Add/edit/delete news.
- Upload shared photos to Supabase Storage.
- Public pages read the same cloud data.
- No secret service key is placed in the website.

## Setup

1. Create a free Supabase project.
2. Open SQL Editor and run `supabase.sql`.
3. In Authentication -> Users, create your admin user with email/password.
4. In SQL Editor, promote that user:
   `update public.profiles set is_admin = true where email = 'YOUR_EMAIL';`
5. Open `config.js` and put your Supabase Project URL and Publishable key there.
6. Upload all files from this folder to the GitHub repository root and replace the old files.
7. Open the site and go to `editor.html`.
8. Log in with the admin account.

The browser uses the public/publishable Supabase key. Do NOT put a service_role/secret key in `config.js`.

## Images

The default images stay in the repository. When you upload a replacement in the admin panel, it is stored in the `site-images` bucket and its public URL is saved in the content record. That means the new image is shared by all visitors.

## Notes

The sample statistics and GI values are demo data. Replace them in the admin panel with your own verified dataset.
