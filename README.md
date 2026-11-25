# The Case Office — Outgunned Adventure

A 1930s office desk on screen: a newspaper holding the player's pack (notice, blank adventurer sheet, travel journal),
the invitation letter in its envelope, a stack of character dossiers (portrait, backstory, recruitment assessment,
photographs, documents and a fillable adventurer sheet), the rulebooks, and a card-index cabinet whose five drawers hold
the player handouts. Static site — works on GitHub Pages.

## The desk
The scene is a photo (`assets/scene/desk.jpg`, 16:9). Clickable areas are laid over the real objects in the `PHOTO SCENE`
and `handout drawers` blocks at the end of `css/style.css`. Phones show the same desk, smaller. Make sure you have the right
to publish whichever desk image you use.

## What to edit

| What | Where |
|---|---|
| Invitation letter (in the envelope) | `data/letter.txt` — `**bold**`, `*italic*`; an italic name line followed by the same name typed becomes a handwritten signature |
| Notice on the newspaper | `data/messages.txt` |
| Player's pack PDFs (newspaper) | `pack` list in `data/site.json`, files in `assets/pdf/` |
| Handouts (cabinet drawers) | `data/handouts.json` — add `{ "title": "...", "src": "assets/handouts/<drawer>/file.jpg" }` to a drawer. Images, PDFs and `.txt` all work |
| Each character's role and short description | `data/characters.json` (`role`, `blurb`) |
| Backstory and recruitment assessment | `assets/characters/<name>/backstory.txt` and `recruitment.txt` (Markdown-style text is fine) |
| Handwritten margin notes | in those files, a line `*Handwritten in the margin*` followed by the note, or any line starting `> ` |
| Adventurer sheets | `assets/characters/<name>/sheet.pdf` (fillable PDF) |
| Rulebook PDFs | `assets/pdf/quickstart.pdf`, `assets/pdf/rulebook.pdf` |
| Site title / year | `data/site.json` |

## Preview locally
    python -m http.server 8000
then open http://localhost:8000 (opening index.html directly will not load the data files).

## Publish on GitHub Pages
Repo → Settings → Pages → Deploy from a branch → `main` / `(root)`.
Files must be under 100 MB each. Pages sites are public.
