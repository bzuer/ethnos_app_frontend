**Ethnos.app Frontend Interface v2.0.0 - Release Documentation**

[![DOI](https://zenodo.org/badge/1050037172.svg)](https://doi.org/10.5281/zenodo.17050053)

**Release Date:** September 2025
**Status:** Production Ready
**License:** MIT - Academic Research Platform
**AI Declaration Date:** 2025-09-03

## Executive Summary

The Ethnos.app Frontend Interface v2.0.0 represents a production-ready web application providing server-side rendering for the Ethnos.app Academic Bibliography API. This release implements a brutalist-functional design philosophy with Swiss International Typography principles, delivering optimal performance and accessibility for academic research environments. The interface features 27 active routes, 12 template pages, and comprehensive API integration while maintaining zero client-side JavaScript dependencies for core functionality.

## AI Utilization Transparency

### Development Methodology
This project employed a multi-model AI strategy to enhance development efficiency while maintaining absolute human accountability. Primary assistance was provided by Anthropic Claude for Flask development and template architecture, with supplementary support from Google Gemini for UI/UX validation and DeepSeek Chat for code snippet generation.

### Human Oversight Protocol
All AI-generated code underwent rigorous validation including critical analysis for correctness, manual accessibility audits, cross-browser compatibility testing, and design governance against academic usability requirements. The human developer retains full authorship and accountability for all architectural decisions and final implementation.

## Technical Architecture

### Core Infrastructure
- **Backend Framework:** Flask 3.0.3 with Jinja2 templating engine
- **API Integration:** RESTful connection to Ethnos.app Academic Bibliography API
- **Frontend Delivery:** Server-side rendered templates with minimal JavaScript
- **Build System:** Node.js-based CSS/JS minification using Terser and cssnano
- **Design Philosophy:** Brutalist-functional approach with Swiss International Typography

### System Requirements
- Python 3.8+ with Flask framework dependencies
- Node.js 22.18.0+ for build toolchain operations
- API access to https://api.ethnos.app
- Linux-based deployment with virtual environment
- 2GB RAM minimum for production deployment

## Application Statistics

- **27 Active Routes:** Complete coverage of API functionality
- **12 Template Pages:** Server-side rendered academic interface
- **30-40% Asset Reduction:** Professional minification achieving significant size reduction
- **0 JavaScript Dependencies:** Core functionality without client-side JavaScript requirements
- **100% ARIA Compliance:** Accessibility-compliant templates with semantic structure

## Interface Features

### Search and Discovery System
- Homepage search with direct API integration
- Real-time autocomplete suggestions with keyboard navigation
- Advanced filtering by publication year, peer review status, and author affiliation
- Clean academic results formatting with complete publication metadata

### Academic Data Presentation
- Complete bibliographic information with academic citation formatting
- Author profiles with intelligent signature linking and publication history
- Institutional research output and collaboration network visualization
- Journal and conference publication tracking with analytics
- Course bibliography integration with instructor profiles

### Performance Optimization
- Server-side rendering eliminating client-side JavaScript dependencies
- Request-level caching strategy for improved response times
- Minified assets with professional build process
- Intelligent API calls with quality filtering and error handling

## Design Implementation

### Brutalist-Functional Approach
- Swiss International Typography principles implementation
- Grid-based layout with clear information hierarchy
- High-contrast color scheme optimized for academic research environments
- ARIA compliance and semantic HTML5 structure
- Intuitive breadcrumb navigation and clean URL architecture

### Template Architecture
- Base template with consistent header, navigation, and footer components
- Reusable template components for standardized data display
- Professional error handling with customized 404 and 500 pages
- Responsive design ensuring functionality across desktop and mobile devices

## Build and Deployment

### Production Environment
- Flask with Gunicorn WSGI server implementation
- Port configuration: 8000 (development), 8888 (production)
- Environment variables: API_BASE_URL, FLASK_ENV, PORT
- Automated server restart and monitoring scripts

### Build Process
- CSS minification with cssnano and autoprefixer
- JavaScript optimization with Terser including source maps
- Development and production asset separation
- Build size comparison and optimization tracking

## Installation and Quick Start

### Production Deployment
```bash
cd /home/server/site_v2
source venv/bin/activate
pip install -r requirements.txt
npm install
npm run build
export FLASK_ENV=production
export API_BASE_URL=https://api.ethnos.app
export PORT=8888
python app.py
```

### Development Commands
```bash
export FLASK_ENV=development && export PORT=8000 && python app.py
npm run build        # Full optimization build
npm run build-css    # CSS-specific processing
npm run build-js     # JavaScript minimization
scripts/restart_site.sh    # Process cleanup and restart
scripts/build.sh           # Build with size metrics
```

## Performance Metrics

- **API Response:** Optimized calls with intelligent caching implementation
- **Asset Loading:** Minified CSS/JS with source maps for debugging
- **Server Performance:** Flask optimization for academic research workloads
- **Accessibility Compliance:** ARIA-compliant templates with semantic structure
- **Cross-Browser Compatibility:** Verified functionality across modern browsers

## Technical Support

### Development Team
- **Lead Developer:** Bruno Cesar Cunha Cruz, PhD Student
- **Institution:** PPGAS/MN/UFRJ (Graduate Program in Social Anthropology, National Museum, Federal University of Rio de Janeiro)
- **Project:** Academic Bibliography Frontend System
- **API Backend:** Ethnos.app Academic Bibliography API v2.0.0

### Integration Requirements
- Active connection to https://api.ethnos.app
- Python virtual environment with Flask dependencies
- Node.js for CSS/JS optimization
- Linux-based server environment recommended

## Funding and Compliance

### Financial Disclosure
This frontend interface was developed without external funding, sponsorships, or grants. Development was supported by a CNPq doctoral scholarship (BRL 3,100/month), with all tools and resources being open-source, academically licensed, or personally funded.

### Ethical Compliance
- No sensitive data shared with AI models
- WCAG accessibility standards adherence
- Professional security and privacy practices
- Complete development transparency

## Citation

**APA Style:**
Cruz, B. C. C. (2025). Ethnos.app Frontend Interface (Version 2.0.0) [Software]. https://doi.org/10.5281/zenodo.17050053

**BibTeX:**
```bibtex
@software{ethnos_frontend_2025,
  author = {Cruz, Bruno Cesar Cunha},
  title = {Ethnos.app Frontend Interface},
  version = {2.0.0},
  year = {2025},
  doi = {10.5281/zenodo.17050053},
  url = {https://ethnos.app}
}
```

**Maintainer:** Bruno Cesar Cunha Cruz, PhD Student  
**ORCID:** [0000-0001-8652-2333](https://orcid.org/0000-0001-8652-2333)  
**Institution:** PPGAS/MN/UFRJ  
**Funding:** CNPq Doctoral Scholarship (Exclusive Dedication)  

**Contact:** Technical documentation and integration support available through https://ethnos.app  
**DOI:** https://doi.org/10.5281/zenodo.17050053  
**Status:** Production-ready academic research interface
