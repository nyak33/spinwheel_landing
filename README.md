# SpinWheel Landing

Static, config-driven landing page with a demo spin wheel, business card, contact saving, social cards, and a lead form that posts to Google Apps Script and then opens WhatsApp.

## Features
- Config-driven content via `config.json`
- Business card card click opens WhatsApp connect message
- "Spin & Win" modal with animated wheel
- Lead capture form with honeypot and Google Apps Script POST
- Post-submit WhatsApp CTA button (safe from popup blockers)
- Save contact as `.vcf`
- Social cards and footer icons from config

## Project Structure
- `index.html` - Base markup
- `style.css` - Styling
- `script.js` - App logic (renders UI from `config.json`)
- `config.json` - Content + endpoints + social links
- `syaqir-shaq.vcf` - Contact file

## Quick Start
Open `index.html` in a browser or serve the folder with any static server.

Example (PowerShell):
```powershell
python -m http.server 5500
```
Then open `http://localhost:5500`.

## Configuration
All content is in `config.json`:
- `brand.title` and `brand.background`
- `apps_script.endpoint` for form submissions
- `whatsapp.number`, `whatsapp.connect_message`, `whatsapp.feature_message`
- `business_card`, `spin_demo`, `save_contact`
- `social_cards` and `footer_icons`

If you deploy on GitHub Pages, the app fetches `config.json` with a relative URL.

## Form Submission
The form POSTs to the Google Apps Script endpoint configured in `config.json`:
- Content-Type: `application/x-www-form-urlencoded`
- Expected response: `{ "ok": true }` (JSON) or HTTP 2xx

After a successful submit, the WhatsApp CTA button is displayed so the user can open WhatsApp with a prefilled message.

## Notes
- The location field is filled using `https://ipapi.co/json/` on best-effort basis.
- Popup blockers are handled by showing a toast with a manual link.
