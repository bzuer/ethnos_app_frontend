
let currentPublicationsPage = 1;
let totalPublicationsPages = 1;
const publicationsPerPage = 25;

function initializePagination() {
    const venueData = getVenueDataFromPage();
    
    if (!venueData) {
        console.warn('No venue data available');
        return;
    }
    
    if (venueData.totalPublications && venueData.totalPublications > publicationsPerPage) {
        totalPublicationsPages = Math.ceil(venueData.totalPublications / publicationsPerPage);
        updatePublicationsPagination();
        
        const prevBtn = document.getElementById('prev-publications');
        const nextBtn = document.getElementById('next-publications');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', loadPreviousPublications);
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', loadNextPublications);
        }
    }
}

function getVenueDataFromPage() {
    const venueDataElement = document.getElementById('venue-data');
    
    if (!venueDataElement) return null;
    
    return {
        venueId: venueDataElement.dataset.venueId,
        publicationsLoaded: parseInt(venueDataElement.dataset.publicationsLoaded) || 0,
        totalPublications: parseInt(venueDataElement.dataset.totalPublications) || 0
    };
}

async function loadVenueDetails() {
    const venueData = getVenueDataFromPage();
    
    if (!venueData || !venueData.venueId) {
        console.error('No venue ID available');
        return;
    }
    
    try {
        const response = await fetch(`/api/v1/venues/${venueData.venueId}`);
        const venue = await response.json();
        
        if (response.status === 404) {
            document.getElementById('venue-details').innerHTML = 
                '<p class="field-value">Periódico não encontrado.</p>';
            return;
        }
        
        document.querySelector('.page-title').textContent = venue.venue_name || 'Periódico';
        
        let html = '<table class="data-table item-detail-table"><tbody>';
        html += `<tr><th scope="row">NOME</th><td class="field-value">${venue.venue_name || 'N/A'}</td></tr>`;
        html += `<tr><th scope="row">TIPO</th><td class="field-value">${venue.venue_type || 'N/A'}</td></tr>`;
        
        const issn = venue.issn_linking || venue.issn_print || venue.issn_electronic;
        html += `<tr><th scope="row">ISSN</th><td class="field-value">${issn || 'N/A'}</td></tr>`;
        html += `<tr><th scope="row">EDITORA</th><td class="field-value">${venue.publisher_name || 'N/A'}</td></tr>`;
        
        if (venue.established_year) {
            html += `<tr><th scope="row">ANO DE FUNDAÇÃO</th><td class="field-value">${venue.established_year}</td></tr>`;
        }
        
        html += `<tr><th scope="row">IDIOMA</th><td class="field-value">${venue.language || 'N/A'}</td></tr>`;
        html += `<tr><th scope="row">TOTAL DE PUBLICAÇÕES</th><td class="field-value">${venue.total_publications || 0}</td></tr>`;
        
        if (venue.start_year && venue.end_year && venue.start_year !== venue.end_year) {
            html += `<tr><th scope="row">PERÍODO</th><td class="field-value">${venue.start_year} - ${venue.end_year}</td></tr>`;
        }
        
        html += '</tbody></table>';
        document.getElementById('venue-details').innerHTML = html;
        
    } catch (error) {
        console.error('Error loading venue details:', error);
        document.getElementById('venue-details').innerHTML = 
            '<p class="field-value">Erro ao carregar detalhes do periódico.</p>';
    }
}

async function loadVenuePublications(page = 1) {
    const venueData = getVenueDataFromPage();
    
    if (!venueData || !venueData.venueId) {
        console.error('No venue ID available for publications');
        return;
    }
    
    try {
        const offset = (page - 1) * publicationsPerPage;
        const response = await fetch(`/api/v1/venues/${venueData.venueId}/publications?limit=${publicationsPerPage}&offset=${offset}`);
        const data = await response.json();
        
        const container = document.getElementById('venue-publications');
        
        if (data.results.length === 0) {
            container.innerHTML = '<p class="field-value">Nenhuma publicação encontrada neste periódico.</p>';
            return;
        }
        
        let html = '<table class="data-table venue-publications-table" aria-describedby="venue-publications-title">';
        html += '<thead><tr>';
        html += '<th scope="col">TÍTULO</th>';
        html += '<th scope="col">AUTOR(ES)</th>';
        html += '<th scope="col">TIPO</th>';
        html += '<th scope="col">ANO</th>';
        html += '</tr></thead><tbody>';
        
        data.results.forEach(publication => {
            html += '<tr>';
            html += `<td class="field-value"><a class="action-link" href="/work/${publication.id}" aria-label="Ver detalhes de ${publication.title}">${publication.title}</a></td>`;
            html += `<td class="field-value">${publication.authors || 'Não informado'}</td>`;
            html += `<td class="result-type">${publication.type || 'N/A'}</td>`;
            html += `<td class="field-value">${publication.publication_year || 'N/A'}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        currentPublicationsPage = page;
        totalPublicationsPages = Math.ceil(data.total / publicationsPerPage);
        updatePublicationsPagination();
        
    } catch (error) {
        console.error('Error loading venue publications:', error);
        document.getElementById('venue-publications').innerHTML = 
            '<p class="field-value">Erro ao carregar publicações.</p>';
    }
}

function updatePublicationsPagination() {
    const pagination = document.getElementById('publications-pagination');
    const pageInfo = document.getElementById('publications-page-info');
    const prevBtn = document.getElementById('prev-publications');
    const nextBtn = document.getElementById('next-publications');
    
    if (totalPublicationsPages > 1) {
        pagination.classList.remove('hidden');
        pageInfo.textContent = `Página ${currentPublicationsPage} de ${totalPublicationsPages}`;
        
        if (currentPublicationsPage === 1) {
            prevBtn.disabled = true;
            prevBtn.className = 'action-btn pagination-btn';
        } else {
            prevBtn.disabled = false;
            prevBtn.className = 'action-btn btn-negative';
        }
        
        if (currentPublicationsPage === totalPublicationsPages) {
            nextBtn.disabled = true;
            nextBtn.className = 'action-btn pagination-btn';
        } else {
            nextBtn.disabled = false;
            nextBtn.className = 'action-btn btn-positive';
        }
    } else {
        pagination.classList.add('hidden');
    }
}

function loadPreviousPublications() {
    if (currentPublicationsPage > 1) {
        loadVenuePublications(currentPublicationsPage - 1);
    }
}

function loadNextPublications() {
    if (currentPublicationsPage < totalPublicationsPages) {
        loadVenuePublications(currentPublicationsPage + 1);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const venueData = getVenueDataFromPage();
    
    if (venueData && venueData.venueId) {
        initializePagination();
        if (!document.querySelector('.page-title').textContent.trim()) {
            loadVenueDetails();
        }
        loadVenuePublications();
    } else {
        console.warn('No venue ID provided');
    }
});

window.loadPreviousPublications = loadPreviousPublications;
window.loadNextPublications = loadNextPublications;