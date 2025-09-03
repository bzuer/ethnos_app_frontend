### **ethnos_app Design and Construction Guide**

**Version 1.1** **Objective:** This document is the single, definitive reference for building the front-end of the ethnos_app project. It details the philosophy, file structure, design system, and visual preferences, using functional prototypes as concrete examples.

#### **1. Philosophy and Fundamental Principles**

Before writing any line of code, it is crucial to understand the project's vision.

* **Core Concept: "Elegant Brutalism"** * **What it is:** A functionalist design by principle. Our inspiration does not come from other websites, but from artifacts where form strictly follows function: technical forms, engineering manuals, and the International Typographic Style (Swiss).  
    * **Positioning:** "A 1970s library form, elegantly digitized."
* **Non-Negotiable Principles:** 1.  **Functionality Above All:** Every element must have a clear purpose. There is no room for decoration.  
    2.  **Structural Honesty:** The page structure (borders, tables, sections) is exposed to reveal how information is organized.  
    3.  **Typography as Interface:** Hierarchy and clarity are achieved primarily through typography and spacing.  
    4.  **No Ornaments:** Zero rounded corners, zero shadows, zero gradients. Visual feedback is subtle and functional.

#### **2. Project Structure**

The file organization was designed to be modular, logical, and scalable. The functional HTML examples are located in the `examples/` folder to serve as visual guides.  
site_v2/  
├── app.py                      # Main Flask application  
├── config.py                   # Application settings  
├── requirements.txt            # Python dependencies  
├── venv/                       # Python virtual environment  
├── templates/                  # Jinja2 templates  
│   ├── base.html               # Base template with global <head>, <body>, header, and footer  
│   ├── pages/                  # Templates for each complete site page  
│   │   ├── index.html            # The "Information Dashboard"  
│   │   ├── advanced-search.html  # The advanced search form  
│   │   ├── results.html          # The search results page  
│   │   ├── item-detail.html      # The "catalog card" for a work  
│   │   ├── my-list.html          # The user's personal list page  
│   │   ├── author-detail.html    # Author details  
│   │   ├── organization-detail.html # Organization details  
│   │   ├── journal-detail.html   # Journal details  
│   │   ├── journals.html         # List of journals  
│   │   └── ppgas*.html           # PPGAS-specific pages  
│   ├── components/             # Reusable components (partials)  
│   │   ├── global-header.html    # The main header with title and navigation  
│   │   └── footer.html           # The default footer  
│   └── errors/                 # Error pages  
│       ├── 404.html              # Page not found  
│       └── 500.html              # Internal server error  
│  
├── static/                     # Static files served by Flask  
│   ├── css/  
│   │   └── styles.min.css      # Minified CSS for production  
│   └── js/                     # Minified JavaScript for production  
│       ├── app.min.js          # Main script  
│       ├── homepage.min.js     # Homepage logic  
│       ├── search.min.js       # Search functionality  
│       ├── my-list.min.js      # Logic for personal list  
│       └── [others].min.js     # Page-specific scripts  
│  
├── src/                        # Source code for development  
│   ├── css/  
│   │   └── styles.css          # Source CSS for development  
│   └── js/                     # Source JavaScript for development  
│       ├── app.js              # Main script  
│       ├── api-client.js       # Ethnos API client  
│       └── [others].js         # Page-specific scripts  
│  
└── examples/                   # Functional HTML prototypes for reference  
    ├── index.html              # Example of the homepage  
    ├── busca-avancada.html     # Example of the advanced search  
    ├── resultados.html         # Example of the results  
    ├── item-detail.html        # Example of the catalog card  
    ├── minha-lista.html        # Example of the personal list  
    ├── visualizador-redes.html # Example of the network viewer  
    └── modelo.css              # Reference model CSS

#### **3. The Design System (Detailed)**

The `src/css/styles.css` file is the single source of truth for the design in development, being minified to `static/css/styles.min.css` for production. It implements the following rules, which must be observed and replicated.  
**3.1. Layout and Grid**

* **Structure:** All pages use a **single, centralized column layout**, with the exception of `visualizador-redes.html`. Information is presented sequentially, from top to bottom.  
* **Alignment:** The `<div class="container">` is always centered in the viewport.  
* **Background:** The "graph paper" background is applied to the entire `<body>`.  
* **Container Width:** `max-width: 800px` for text pages and `960px` for visualizations.

**3.2. Color System** The palette is restricted and functional. The primary colors (`--primary-red`, `--primary-blue`) are used exclusively for action and interactivity elements.  
**3.3. Typography**

* **Fonts:** * **Sans-serif (`--sans`):** For titles and descriptions.  
    * **Monospaced (`--mono`):** For **everything else**: navigation, data, labels, metadata, captions.  
* **Hierarchy:** Font size is the primary tool for hierarchy, ranging from `48px` (`.title-primary`) to `12px` (data and metadata).

**3.4. Visual Components and Interactivity**

* **Tables (`.data-table`):** Always with full borders, a distinct header (`<th>`), and row hover.  
* **Forms:** Inputs with a `--document-white` background and a `--primary-red` border on `:focus`.  
* **Buttons:** No rounded corners. Click feedback (`:active`) with `transform: translateY(1px)`.  
* **Action Links (`.action-link`):** Always in the `--primary-blue` color with an underline on hover.

#### **4. Page Implementation Guide**

Each file in `examples/` serves as a functional prototype and a visual guide for building the corresponding files in `templates/pages/`.

* **`examples/index.html` (Information Dashboard):** * **Observe:** The sequential arrangement of the sections (`.figure-plate` followed by the `.data-table`).  
    * **Replicate:** The section structure with `<h2 class="title-section">` for all future content blocks in `templates/pages/index.html`.  
* **`examples/busca-avancada.html`:** * **Observe:** The use of a grid to align labels and inputs. The `fieldset` to group related fields.  
    * **Replicate:** This form structure in `templates/pages/advanced-search.html` for any future page that requires complex data entry.  
* **`examples/resultados.html`:** * **Observe:** The list structure (`<ol class="results-list">`) and the hierarchy within each item (`.result-title` > `.result-subtitle` > `.result-meta`).  
    * **Replicate:** This list structure in `templates/pages/results.html` and for any page that presents a collection of items (e.g., author page, journals).  
* **`examples/item-detail.html`:** * **Observe:** The use of multiple tables to separate different types of data. The "Tools" section with a `fieldset` to group actions.  
    * **Replicate:** The use of tables to present key-value pairs (label/data) is the standard for displaying metadata in `templates/pages/item-detail.html`, `author-detail.html`, `organization-detail.html`, and `journal-detail.html`.  
* **`examples/minha-lista.html`:** * **Observe:** The combination of a management table with a tools panel (`.export-tools`). The differentiation of buttons (`.btn-primary`, `.btn-secondary`, `.btn-danger`).  
    * **Replicate:** This "list + tools" pattern in `templates/pages/my-list.html` and for future features involving user-created collections.  
* **`examples/visualizador-redes.html`:** * **Observe:** The use of a wider container and a two-column layout to accommodate the visualization and an information panel.  
    * **Replicate:** This visualization + panel layout for any future page that presents complex interactive data.
