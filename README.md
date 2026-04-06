# jpcalderon.github.io

Professional portfolio for Juan Pablo Calderón.

This site is built as a static frontend with data-driven content loaded from JSON.

## Current Architecture

- `index.html`: single-page layout and section structure.
- `assets/css/portfolio.css`: visual system (cold palette, responsive layout).
- `assets/js/render.js`: client-side rendering from JSON files.
- `data/profile.json`: personal summary, links, experience, education, skills.
- `data/publications.json`: research publications (ADS / arXiv / DOI links).
- `data/projects.json`: research and data-science case studies.
- `data/stack.json`: technology stack grouped by domain.

## Local Development

Serve the repository over HTTP (required for `fetch` to load JSON):

```bash
python3 -m http.server 8787
```

Open `http://localhost:8787`.

## Conda Environment

Requested environment for this repository:

```bash
conda create -n github.io python=3.11 -y
conda run -n github.io python -m pip install --upgrade pip pypdf
```

`pypdf` is used to extract text from `Profile.pdf` and generate structured profile data.

## Data Hygiene

`.gitignore` is configured to block large/binary scientific and ML artifacts, including:

- `*.fits`, `*.parquet`, `*.pth`, `*.model`
- `data/`, `models/`, `artifacts/`, `checkpoints/`

If `data/` should remain versioned for this website, keep JSON files tracked explicitly and store heavy datasets outside the repository.
