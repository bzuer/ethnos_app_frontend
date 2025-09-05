class SearchHandler {
    constructor() {
        this.currentQuery = '';
        this.currentPage = 1;
        this.resultsPerPage = 25;
        this.totalResults = 0;
        this.isLoading = false;
        this.autocompleteTimeout = null;
        this.selectedSuggestionIndex = -1;
    }

    init() {
        document.querySelectorAll('form[role="search"]').forEach(form => {
            form.addEventListener('submit', e => {
                if (window.location.pathname === '/results') {
                    e.preventDefault();
                    this.handleFormSubmission(form);
                }
            });
        });

        this.setupAutocomplete();

        if (window.location.pathname === '/results') {
            this.handleResultsPage();
        }
        this.setupPagination();
    }

    setupAutocomplete() {
        const searchInput = document.getElementById('search-input');
        const searchGhost = document.getElementById('search-ghost');
        const suggestionsContainer = document.getElementById('autocomplete-suggestions');
        
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(this.autocompleteTimeout);
            
            if (query.length < 2) {
                this.hideAutocomplete();
                this.clearGhost();
                return;
            }

            this.autocompleteTimeout = setTimeout(() => {
                this.fetchAutocomplete(query);
            }, 200);
        });

        searchInput.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Tab':
                case 'ArrowRight':
                    if (searchGhost && searchGhost.value && searchGhost.value !== searchInput.value) {
                        e.preventDefault();
                        searchInput.value = searchGhost.value;
                        this.clearGhost();
                        this.hideAutocomplete();
                    }
                    break;
                case 'Escape':
                    this.hideAutocomplete();
                    this.clearGhost();
                    break;
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-input-container')) {
                this.hideAutocomplete();
                this.clearGhost();
            }
        });
    }

    async fetchAutocomplete(query) {
        const suggestionsContainer = document.getElementById('autocomplete-suggestions');
        
        try {
            if (suggestionsContainer) {
                suggestionsContainer.setAttribute('aria-busy', 'true');
            }
            
            const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}&limit=6`);
            const data = await response.json();
            
            if (data.suggestions && data.suggestions.length > 0) {
                this.renderInlineAutocomplete(data.suggestions, query);
            } else {
                this.hideAutocomplete();
                this.clearGhost();
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
            this.hideAutocomplete();
            this.clearGhost();
        } finally {
            if (suggestionsContainer) {
                suggestionsContainer.removeAttribute('aria-busy');
            }
        }
    }

    renderInlineAutocomplete(suggestions, query) {
        const searchInput = document.getElementById('search-input');
        const searchGhost = document.getElementById('search-ghost');
        
        if (!searchInput || !searchGhost || !suggestions.length) return;
        
        const bestMatch = suggestions.find(suggestion => 
            suggestion.text.toLowerCase().startsWith(query.toLowerCase())
        );
        
        if (bestMatch && bestMatch.text.toLowerCase() !== query.toLowerCase()) {
            searchGhost.value = bestMatch.text;
        } else {
            this.clearGhost();
        }
    }

    clearGhost() {
        const searchGhost = document.getElementById('search-ghost');
        if (searchGhost) {
            searchGhost.value = '';
        }
    }

    renderAutocomplete(suggestions) {
        const container = document.getElementById('autocomplete-suggestions');
        if (!container) return;

        container.innerHTML = '';
        
        suggestions.forEach((suggestion, index) => {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.className = 'autocomplete-suggestion';
            suggestionDiv.setAttribute('data-text', suggestion.text);
            suggestionDiv.setAttribute('data-type', suggestion.type);
            suggestionDiv.setAttribute('data-index', index.toString());
            
            const textDiv = document.createElement('div');
            textDiv.className = 'suggestion-text';
            textDiv.innerHTML = this.highlightQuery(suggestion.text);
            
            const metaDiv = document.createElement('div');
            metaDiv.className = 'suggestion-meta';
            
            const typeSpan = document.createElement('span');
            typeSpan.className = `suggestion-type suggestion-type-${suggestion.type}`;
            typeSpan.textContent = this.formatSuggestionType(suggestion.type);
            
            metaDiv.appendChild(typeSpan);
            
            if (suggestion.work_count) {
                const countText = document.createTextNode(` ${suggestion.work_count} trabalhos`);
                metaDiv.appendChild(countText);
            }
            
            suggestionDiv.appendChild(textDiv);
            suggestionDiv.appendChild(metaDiv);
            
            suggestionDiv.addEventListener('click', () => this.selectSuggestion(suggestionDiv));
            
            container.appendChild(suggestionDiv);
        });

        container.classList.add('active');
        this.selectedSuggestionIndex = -1;
    }

    highlightQuery(text) {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    formatSuggestionType(type) {
        const types = {
            'title': 'Título',
            'venue': 'Periódico',
            'author': 'Autor'
        };
        return types[type] || type;
    }

    selectSuggestion(suggestionElement) {
        const text = suggestionElement.dataset.text;
        const type = suggestionElement.dataset.type;
        const searchInput = document.getElementById('search-input');
        
        if (searchInput) {
            this.hideAutocomplete();
            
            if (type === 'venue') {
                window.location.href = `/results?venue=${encodeURIComponent(text)}`;
            } else if (type === 'author') {
                window.location.href = `/results?author=${encodeURIComponent(text)}`;
            } else {
                searchInput.value = text;
                const form = document.getElementById('search-form');
                if (form) {
                    form.submit();
                }
            }
        }
    }

    updateSuggestionHighlight() {
        const suggestions = document.querySelectorAll('.autocomplete-suggestion');
        
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('highlighted', index === this.selectedSuggestionIndex);
        });
    }

    hideAutocomplete() {
        const container = document.getElementById('autocomplete-suggestions');
        if (container) {
            container.classList.remove('active');
            container.innerHTML = '';
            container.style.display = 'none';
        }
        this.selectedSuggestionIndex = -1;
    }

    handleFormSubmission(form) {
        const formData = new FormData(form);
        const params = this.buildSearchParams(formData);
        
        if (params.q || this.hasAdvancedParams(formData)) {
            const urlParams = new URLSearchParams(params).toString();
            window.history.pushState({}, '', '/results?' + urlParams);
            this.performSearch(params);
            this.hideAutocomplete();
        } else {
            this.showError('Preencha pelo menos um campo de busca.');
        }
    }

    buildSearchParams(formData) {
        let params = {};
        
        if (formData.get('q')) {
            params.q = formData.get('q').trim();
        }
        
        ['title', 'author', 'abstract', 'subject', 'venue', 'publisher', 'type', 'language'].forEach(field => {
            if (formData.get(field)) {
                params[field] = formData.get(field).trim();
            }
        });
        
        if (formData.get('year_start')) {
            params.year_start = formData.get('year_start');
        }
        if (formData.get('year_end')) {
            params.year_end = formData.get('year_end');
        }
        if (formData.get('sort')) {
            params.sort = formData.get('sort');
        }
        
        params.limit = this.resultsPerPage;
        
        return params;
    }

    hasAdvancedParams(formData) {
        return ['title', 'author', 'abstract', 'subject', 'venue', 'publisher'].some(field => 
            formData.get(field)
        );
    }

    handleResultsPage() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('q') || this.hasAdvancedUrlParams(urlParams)) {
            const params = Object.fromEntries(urlParams.entries());
            this.performSearch(params);
        }
    }

    hasAdvancedUrlParams(urlParams) {
        return ['title', 'author', 'abstract', 'subject', 'venue', 'publisher'].some(field => 
            urlParams.has(field)
        );
    }

    async performSearch(params) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const response = await fetch('/api/v1/works/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ params })
            });
            
            const results = await response.json();
            this.displayResults(results, params);
            this.currentQuery = params.q || 'Busca Avançada';
            this.totalResults = results.total || 0;
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Erro ao realizar busca. Tente novamente.');
        } finally {
            this.isLoading = false;
        }
    }

    displayResults(results, params) {
        const container = document.querySelector('.results-container') || 
                         document.querySelector('section[aria-labelledby="search-results"]');
        
        if (!container) {
            console.error('Results container not found');
            return;
        }

        this.updateSearchHeader(params, results.total);

        if (results.data && results.data.length > 0) {
            this.renderSortControls(container, params);
            this.renderResults(results.data, container);
            
            if (results.pagination) {
                this.renderPagination(results, container);
            }
        } else {
            this.renderNoResults(params.q, container);
        }
    }

    renderResults(works, container) {
        const resultsHTML = works.map(work => {
            const relevanceScore = work.relevance_score ? 
                `<span class="relevance-score">Score: ${work.relevance_score}</span>` : '';
            
            const peerReviewed = work.peer_reviewed ? 
                '<span class="badge peer-reviewed">Revisado por Pares</span>' : '';
            
            return `
                <article class="result-item">
                    <h3 class="result-title">
                        <a href="/work/${work.id}" class="result-link">
                            ${work.title || 'Título não disponível'}
                            ${work.subtitle ? ' - ' + work.subtitle : ''}
                        </a>
                        ${relevanceScore}
                    </h3>
                    
                    <div class="result-meta">
                        <span class="result-authors">${work.formatted_authors || work.author_string || 'Autor não informado'}</span>
                        ${work.publication_year || work.year ? `<span class="result-year"> • ${work.publication_year || work.year}</span>` : ''}
                        ${work.work_type ? `<span class="result-type"> • ${this.formatWorkType(work.work_type)}</span>` : ''}
                        ${work.language ? `<span class="result-language"> • ${this.formatLanguage(work.language)}</span>` : ''}
                        ${peerReviewed}
                    </div>
                    
                    ${work.venue_name ? `
                        <div class="result-venue">
                            <strong>Publicado em:</strong> ${work.venue_name}
                        </div>
                    ` : ''}
                    
                    ${work.doi ? `
                        <div class="result-doi">
                            <strong>DOI:</strong> <a href="https://doi.org/${work.doi}" target="_blank" rel="noopener">${work.doi}</a>
                        </div>
                    ` : ''}
                    
                    ${work.abstract ? `
                        <div class="result-abstract">
                            <p>${work.abstract.substring(0, 300)}${work.abstract.length > 300 ? '...' : ''}</p>
                        </div>
                    ` : ''}

                    <div class="result-actions">
                        <a href="/work/${work.id}" class="action-btn btn-positive">Ver Detalhes</a>
                        ${work.doi ? `<a href="https://doi.org/${work.doi}" target="_blank" rel="noopener" class="action-btn">Acesso Direto</a>` : ''}
                    </div>
                </article>
            `;
        }).join('');

        container.innerHTML = `<div class="results-container">${resultsHTML}</div>`;
    }

    formatWorkType(type) {
        const types = {
            'ARTICLE': 'Artigo',
            'BOOK': 'Livro',
            'CHAPTER': 'Capítulo',
            'THESIS': 'Tese/Dissertação',
            'CONFERENCE': 'Artigo de Evento',
            'REPORT': 'Relatório',
            'DATASET': 'Dataset',
            'OTHER': 'Outro'
        };
        return types[type] || type;
    }

    formatLanguage(language) {
        const languages = {
            'pt': 'Português',
            'en': 'Inglês',
            'es': 'Espanhol',
            'fr': 'Francês',
            'de': 'Alemão',
            'it': 'Italiano'
        };
        return languages[language] || language;
    }

    renderNoResults(query, container) {
        const html = query && query !== 'Busca Avançada' ? `
            <div class="no-results">
                <p>Nenhum resultado encontrado para "<strong>${query}</strong>".</p>
                <p>Tente usar termos diferentes ou verifique a ortografia.</p>
            </div>
        ` : `
            <div class="info-message">
                <p>Preencha pelo menos um campo de busca para ver os resultados.</p>
            </div>
        `;
        
        container.innerHTML = html;
    }

    updateSearchHeader(params, total) {
        const header = document.querySelector('.page-header');
        if (!header) return;

        const query = params.q || 'Busca Avançada';
        
        let summaryEl = header.querySelector('.search-summary') || document.createElement('p');
        let statsEl = header.querySelector('.search-stats') || document.createElement('p');
        
        summaryEl.className = 'search-summary';
        summaryEl.innerHTML = `Resultados para: "<strong>${query}</strong>"`;
        
        statsEl.className = 'search-stats';
        statsEl.innerHTML = total.toLocaleString('pt-BR') + ' resultados encontrados';
        
        if (!header.querySelector('.search-summary')) header.appendChild(summaryEl);
        if (!header.querySelector('.search-stats')) header.appendChild(statsEl);
    }

    renderPagination(results, container) {
        if (!results.pagination || results.pagination.totalPages <= 1) return;

        const { page, totalPages } = results.pagination;
        const paginationHTML = `
            <nav class="pagination-nav" aria-label="Navegação de páginas de resultados">
                <button class="action-btn pagination-btn" ${page <= 1 ? 'disabled' : ''} 
                        onclick="searchHandler.goToPage(${page - 1})" aria-label="Página anterior">
                    « Anterior
                </button>
                <span class="pagination-info">Página ${page} de ${totalPages}</span>
                <button class="action-btn pagination-btn" ${page >= totalPages ? 'disabled' : ''} 
                        onclick="searchHandler.goToPage(${page + 1})" aria-label="Próxima página">
                    Próximo »
                </button>
            </nav>
        `;

        container.querySelector('.results-container').insertAdjacentHTML('afterend', paginationHTML);
    }

    goToPage(page) {
        if (page < 1 || this.isLoading) return;

        this.currentPage = page;
        const urlParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlParams.entries());
        params.page = page;

        const newUrl = '/results?' + new URLSearchParams(params).toString();
        window.history.pushState({}, '', newUrl);
        
        this.performSearch(params);
    }

    setupPagination() {
        window.addEventListener('popstate', () => {
            if (window.location.pathname === '/results') {
                this.handleResultsPage();
            }
        });
    }

    showLoading() {
        const container = document.querySelector('section[aria-labelledby="search-results"]');
        if (container) {
            container.innerHTML = '<p class="field-value">Realizando busca...</p>';
        }
    }

    showError(message) {
        const container = document.querySelector('section[aria-labelledby="search-results"]');
        if (container) {
            container.innerHTML = `<div class="error-message"><p>${message}</p></div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.searchHandler = new SearchHandler();
    window.searchHandler.init();
});