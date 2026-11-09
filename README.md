# Baseball Stats

A simple home for baseball stats pages, visualizations, and experiments—including pages generated with Claude.

## Site structure

```text
.
├── index.html              # Site homepage
├── pages/                  # Standalone pages and dashboards
│   └── README.md            # Instructions for adding pages
└── assets/
    ├── css/                # Shared stylesheets
    ├── js/                 # Shared scripts
    ├── images/              # Logos, photos, and other images
    └── data/                # Static datasets (CSV, JSON, etc.)
```

## Add a page generated with Claude

1. Ask Claude to generate an HTML page and any supporting CSS, JavaScript, or image files. For an easy start, request a self-contained page that can run as static HTML.
2. In GitHub, choose **Add file → Upload files** and upload the files into a new folder under `pages/`, for example `pages/season-dashboard/`.
3. Name the page's main file `index.html`. It will be available at `pages/season-dashboard/` when the repository is served as a website.
4. Store shared resources in `assets/css/`, `assets/js/`, `assets/images/`, or `assets/data/`. Use relative paths where possible.
5. Add a link to the page in the cards or navigation in the root `index.html`.

For example, a page at `pages/season-dashboard/index.html` can be linked with:

```html
<a href="pages/season-dashboard/">Season dashboard</a>
```

## Publishing

This repository is prepared as a static site. To publish it with GitHub Pages, open **Settings → Pages**, choose the `main` branch and `/ (root)` as the source, then save. Once the deployment is ready, GitHub Pages will provide the site URL.
