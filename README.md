# Ethnos_APP Frontend Interface v2.0.0

**Release Date**: September 2025  
**Status**: Production Ready  
**License**: MIT - Academic Research Platform

## Overview

The Ethnos.app Frontend Interface is a Flask-based web application providing server-side rendering for the Ethnos.app Academic Bibliography API. Built with brutalist-functional design principles, the interface delivers direct access to bibliographic research data with minimal complexity and maximum functionality.

## Purpose and Application

### Primary Objective
Provide academic researchers with a clean, efficient web interface for bibliographic research across all academic disciplines through the Ethnos.app API. The system prioritizes accessibility, performance, and usability over decorative elements.

### Target Applications
- **Research Discovery**: Direct access to 1.16 million academic works through optimized search interface
- **Bibliographic Analysis**: Author profiles, citation networks, and collaboration mapping
- **Course Management**: Bibliography compilation for academic courses with instructor profiles
- **Institutional Research**: Organization profiles and publication analytics
- **Academic Networking**: Researcher collaboration discovery and academic venue analysis

## Technical Architecture

### Core Infrastructure
- **Backend**: Flask 3.0.3 with Jinja2 templating engine
- **API Integration**: RESTful connection to Ethnos.app Academic Bibliography API
- **Frontend**: Server-side rendered templates with minimal JavaScript
- **Build System**: Node.js-based CSS/JS minification with Terser and cssnano
- **Design Philosophy**: Brutalist-functional approach with Swiss International Typography

### System Requirements
- **Python**: 3.8+ with Flask framework
- **Node.js**: 22.18.0+ for build tools
- **API Access**: Connection to https://api.ethnos.app
- **Environment**: Linux-based deployment with virtual environment

## Application Features

### Search and Discovery
- **Homepage Search**: Direct integration with API search endpoints
- **Autocomplete**: Real-time search suggestions with keyboard navigation
- **Advanced Search**: Filter by publication year, peer review status, and author
- **Results Display**: Clean, academic formatting with publication metadata

### Academic Data Access
- **Work Details**: Complete bibliographic information with citation formatting
- **Author Profiles**: Publication history with intelligent signature linking
- **Institution Pages**: Organizational research output and collaboration networks
- **Venue Analytics**: Journal and conference publication tracking
- **Course Integration**: PPGAS course bibliography with instructor profiles

### Performance Optimization
- **Server-side Rendering**: No client-side JavaScript dependencies for core functionality
- **Caching Strategy**: Request-level caching for improved response times
- **Minified Assets**: Professional build process reducing CSS/JS file sizes
- **API Optimization**: Intelligent API calls with quality filtering

## Design Implementation

### Brutalist-Functional Approach
- **Typography**: Swiss International Typography principles
- **Layout**: Grid-based design with clear information hierarchy
- **Accessibility**: ARIA compliance and semantic HTML structure
- **Color Scheme**: High contrast for academic research environments
- **Navigation**: Intuitive breadcrumbs and clean URL structure

### Template Structure
- **Base Template**: Consistent header, navigation, and footer across pages
- **Component System**: Reusable template components for data display
- **Error Handling**: Professional 404 and 500 error pages
- **Responsive Design**: Functional across desktop and mobile devices

## API Integration

### Endpoint Coverage
- **Search Operations**: Works, authors, organizations, and venue search
- **Detail Pages**: Individual records with complete metadata
- **Analytics**: Statistics and metrics for academic research
- **Course System**: PPGAS integration with instructor and bibliography management
- **Signature Linking**: Intelligent author name disambiguation

### Data Processing
- **Quality Filtering**: Enhanced data presentation for research-grade results
- **Citation Formatting**: Academic standard citation generation
- **Network Analysis**: Author collaboration and institutional mapping
- **Performance Metrics**: API response time monitoring and optimization

## Deployment Configuration

### Production Environment
- **Server**: Flask with Gunicorn WSGI server
- **Port Configuration**: 8000 development, 8888 production
- **Environment Variables**: API_BASE_URL, FLASK_ENV, PORT configuration
- **Process Management**: Automated server restart and monitoring scripts

### Build Process
- **CSS Minification**: cssnano with autoprefixer for cross-browser compatibility
- **JavaScript Optimization**: Terser minification with source maps
- **Asset Management**: Development and production asset separation
- **Performance Monitoring**: Build size comparison and optimization tracking

## Project Structure

### Directory Organization
```
/home/server/site_v2/
├── app.py                    # Flask application core
├── config.py                 # Application configuration
├── requirements.txt          # Python dependencies
├── package.json             # Node.js build dependencies
├── docs/                    # Technical documentation
├── scripts/                 # Build and deployment scripts
├── backup/                  # Asset backups
├── templates/               # Jinja2 templates
│   ├── base.html           # Base template
│   ├── components/         # Reusable components
│   ├── errors/            # Error page templates
│   └── pages/             # Application page templates
├── static/                 # Static assets
│   ├── css/               # Stylesheets (dev and minified)
│   └── js/                # JavaScript (dev and minified)
└── venv/                  # Python virtual environment
```

### Routing Architecture
- **RESTful URLs**: Clean, semantic URL structure
- **Legacy Support**: Backward compatibility redirects
- **Error Handling**: Professional HTTP status code management
- **Template Mapping**: Direct template-to-route correspondence

## System Status

### Current Implementation
- **27 Active Routes**: Complete coverage of API functionality
- **12 Template Pages**: Server-side rendered academic interface
- **Build System**: Professional minification with 30-40% size reduction
- **Documentation**: Complete technical documentation in docs/
- **Testing**: Functional testing across all major features

### Performance Metrics
- **API Response**: Optimized calls with intelligent caching
- **Asset Loading**: Minified CSS/JS with source maps for debugging
- **Server Performance**: Flask optimized for academic research workloads
- **Accessibility**: ARIA-compliant templates with semantic structure

## Technical Support

### Development Team
- **Developer**: Bruno Cesar Cunha Cruz, PhD Student
- **Institution**: PPGAS/MN/UFRJ (Graduate Program in Social Anthropology, National Museum, Federal University of Rio de Janeiro)
- **Project**: Academic Bibliography Frontend System
- **API Backend**: Ethnos.app Academic Bibliography API v2.0.0

### Integration Notes
- **API Dependency**: Requires active connection to https://api.ethnos.app
- **Environment Setup**: Python virtual environment with Flask dependencies
- **Build Requirements**: Node.js for CSS/JS optimization
- **Deployment**: Linux-based server environment recommended

## Quick Start

### Installation
```bash
# Clone and setup environment
cd /home/server/site_v2
source venv/bin/activate
pip install -r requirements.txt

# Install build dependencies
npm install

# Build optimized assets
npm run build

# Configure environment
export FLASK_ENV=production
export API_BASE_URL=https://api.ethnos.app
export PORT=8888

# Start server
python app.py
```

### Development Commands
```bash
# Development server (port 8000)
export FLASK_ENV=development && export PORT=8000 && python app.py

# Build assets
npm run build        # Full build with optimization
npm run build-css    # CSS only with autoprefixer
npm run build-js     # JavaScript with Terser

# Server management
scripts/restart_site.sh    # Restart with process cleanup
scripts/build.sh           # Build with size comparison
```

## Academic Partnership

The Ethnos.app Frontend Interface serves as the primary user interface for the Ethnos.app Academic Bibliography API, representing a commitment to advancing digital scholarship across all academic disciplines. The design approach prioritizes research effectiveness over aesthetic complexity, creating a tool optimized for serious academic work.

## Technical Support

### Technical Contact
- **Developer**: Bruno Cesar Cunha Cruz, PhD Student
- **Institution**: PPGAS/MN/UFRJ (Graduate Program in Social Anthropology, National Museum, Federal University of Rio de Janeiro)
- **Project**: Academic Bibliography Frontend System
- **Website**: [https://ethnos.app](https://ethnos.app)

### Integration Assistance
- **API Documentation**: Complete endpoint reference with examples
- **Technical Consulting**: Available for complex integration scenarios
- **Performance Optimization**: Guidance for high-volume usage patterns
- **Custom Development**: Specialized endpoints for specific research requirements

---

## Citation

To cite this model in academic work:

**APA Style:**
```
Cruz, B. C. C. (2025). Ethnos_APP Frontend Interface(Version 2.0.0) [Model]. 
https://doi.org/{}
```

**BibTeX:**
```bibtex
@software{ethnos_api_2025,
  author = {Cruz, Bruno Cesar Cunha},
  title = {Ethnos_APP Frontend Interface},
  version = {2.0.0},
  year = {2025},
  doi = {},
  url = {https://ethnos.app}
}
```

---

**Contact**: Technical documentation and integration support available through the Ethnos.app platform  
**Repository**: Production deployment with comprehensive monitoring and logging  
**DOI**: https://doi.or{}
**Status**: Enterprise-ready academic research infrastructure
