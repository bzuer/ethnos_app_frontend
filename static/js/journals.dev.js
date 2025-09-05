class JournalsLoader {
    constructor() {
        this.loadingStates = {
            impact: false,
            representation: false
        };
    }

    async loadVenuesByImpact() {
        this.loadingStates.impact = true;
        
        const container = document.querySelector('.venues-impact-container');
        if (!container) {
            console.error('Venues impact container not found');
            return;
        }

        try {
            container.innerHTML = '<p class="field-value">Carregando periódicos por impacto...</p>';
            
            container.innerHTML = `
                <p class="field-value">
                    Dados de impacto não disponíveis no momento. 
                    <a href="/venues/complete" class="action-link">Ver listagem completa de periódicos</a>
                </p>
            `;
        } catch (error) {
            console.error('Error loading venues by impact:', error);
            container.innerHTML = '<p class="field-value error-text">Erro ao carregar dados de impacto</p>';
        } finally {
            this.loadingStates.impact = false;
        }
    }

    async loadVenuesByRepresentation() {
        this.loadingStates.representation = true;
        
        const container = document.querySelector('.venues-representation-container');
        if (!container) {
            console.error('Venues representation container not found');
            return;
        }

        try {
            container.innerHTML = '<p class="field-value">Carregando periódicos por representação...</p>';

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch('/venues/complete', {
                signal: controller.signal,
                headers: {
                    'Accept': 'text/html'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            container.innerHTML = `
                <div class="venues-preview">
                    <table class="data-table journals-representation-table">
                        <thead>
                            <tr>
                                <th scope="col">PRINCIPAIS PERIÓDICOS</th>
                                <th scope="col">AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="field-value">
                                    American Anthropologist, Current Anthropology, American Ethnologist, 
                                    Journal of the Royal Anthropological Institute, American Journal of Sociology, 
                                    Social Forces, American Sociological Review, e outros...
                                </td>
                                <td class="field-value">
                                    <a href="/venues/complete" class="action-link">Ver listagem completa</a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="action-links">
                        <p class="field-value">
                            <strong>4945+ periódicos disponíveis</strong> - 
                            <a href="/venues/complete" class="action-link">Ver todos os periódicos organizados</a> | 
                            <a href="/search/advanced" class="action-link">Busca avançada</a>
                        </p>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error loading venues by representation:', error);
            
            if (error.name === 'AbortError' || error.message.includes('timeout')) {
                container.innerHTML = `
                    <p class="field-value error-text">
                        Timeout ao carregar periódicos. A base de dados é muito grande.
                        <br><a href="/venues/complete" class="action-link">Ver listagem completa de periódicos</a>
                        <br><a href="/search/advanced" class="action-link">Ou use a busca avançada para filtros específicos</a>
                    </p>
                `;
            } else {
                container.innerHTML = `
                    <p class="field-value error-text">
                        Erro ao carregar periódicos. 
                        <br><a href="/venues/complete" class="action-link">Ver listagem completa</a>
                    </p>
                `;
            }
        } finally {
            this.loadingStates.representation = false;
        }
    }

    async init() {
        
        try {
            await Promise.all([
                this.loadVenuesByImpact(),
                this.loadVenuesByRepresentation()
            ]);
        } catch (error) {
            console.error('Error initializing journals loader:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const loader = new JournalsLoader();
    loader.init();
});