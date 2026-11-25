# The Case Office — Outgunned Adventure

A 1930s office on screen: a typewriter notice board, a letter, a stack of character files (with portraits, backstories,
recruitment assessments, photographs, documents and character sheets) and the rulebooks. Static site — works on GitHub Pages.

## Scenes
On wide screens the desk is a photo (`assets/scene/desk.jpg`); the folders and books in it are the clickable dossier stack and rulebooks, and the typewriter and letter sit on the desk. Phones and tall screens get the drawn office instead. To change the photo, replace `assets/scene/desk.jpg` (16:9) and adjust the positions in the `PHOTO SCENE` block at the end of `css/style.css`. Make sure you have the right to publish whichever image you use.

## What to edit

| What | Where |
|---|---|
| Opening letter | `data/letter.txt` (`# ` = heading, `> ` = right-aligned line such as a date) |
| Typewriter notice board | `data/messages.txt` |
| Each character's role and brief description | `data/characters.json` (`role`, `blurb`) — roles are provisional guesses |
| Character sheets | put an image or PDF in the character's folder and set `sheet` in `data/characters.json` |
| Backstory and recruitment assessment | plain `.txt` files, copied in by `Update-CharacterText.ps1` |
| Rulebook PDFs | `assets/pdf/quickstart.pdf`, `assets/pdf/rulebook.pdf` (or edit `data/site.json`) |
| Site title / year | `data/site.json` |

## Text files for the typed pages
Keep them as `.txt` in `D:\Outgunned\Characters\<Name>\Backstory\` and `...\Recruitment Assessment\`, then run:

    powershell -ExecutionPolicy Bypass -File .\Update-CharacterText.ps1

Lines starting with `# ` become underlined typed headings. Blank lines separate paragraphs.

## Preview locally
    python -m http.server 8000
then open http://localhost:8000 (opening index.html directly will not load the data files).

## Publish on GitHub Pages
Repo → Settings → Pages → Deploy from a branch → `main` / `(root)`.
Files must be under 100 MB each. Pages sites are public.
