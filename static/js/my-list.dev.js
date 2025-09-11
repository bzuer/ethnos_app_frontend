
const STORAGE_KEY = 'ethnos_app_personal_list';

function initializePersonalList() {
    loadPersonalList();
    setupExportFunctionality();
    updateGlobalCounter();
    setupEventHandlers();
}

function loadPersonalList() {
    const container = document.getElementById('personal-list-container');
    const exportSection = document.getElementById('export-section');
    const emptyMessage = document.getElementById('export-empty-message');
    
    if (!container) return;
    
    const items = getPersonalList();
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p class="field-value">Sua lista pessoal está vazia.</p>
                <p class="description">Adicione itens visitando as páginas de detalhes dos trabalhos.</p>
            </div>
        `;
        
        if (exportSection) exportSection.style.display = 'none';
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }
    
    if (exportSection) exportSection.style.display = 'block';
    if (emptyMessage) emptyMessage.style.display = 'none';
    
    let html = `
        <div class="list-header">
            <p class="list-stats">
                <span class="field-value">${items.length} ${items.length === 1 ? 'item' : 'itens'} na sua lista</span>
                <span class="description">Adicionado${items.length === 1 ? '' : 's'} em ordem cronológica</span>
            </p>
        </div>
    `;
    
    html += `
        <table class="data-table personal-list-table" aria-label="Lista pessoal de trabalhos salvos">
            <thead>
                <tr>
                    <th scope="col">TÍTULO</th>
                    <th scope="col">AUTOR(ES)</th>
                    <th scope="col">ANO</th>
                    <th scope="col">AÇÕES</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const sortedItems = [...items].reverse();
    
    sortedItems.forEach(item => {
        const authors = formatAuthorsForDisplay(item.authors);
        const title = escapeHtml(item.title || 'Título não disponível');
        const year = item.publication_year || 'N/A';
        
        html += `
            <tr data-item-id="${item.id}">
                <td class="field-value">
                    <a href="/works/${item.id}" 
                       class="action-link" 
                       aria-label="Ver detalhes de ${title}">
                        ${title}
                    </a>
                </td>
                <td class="field-value">${escapeHtml(authors)}</td>
                <td class="field-value">${year}</td>
                <td>
                    <button type="button" 
                            class="action-btn btn-negative remove-from-list-btn" 
                            data-item-id="${item.id}"
                            aria-label="Remover '${title}' da lista">
                        Remover
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function getPersonalList() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading personal list:', error);
        return [];
    }
}

function savePersonalList(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return true;
    } catch (error) {
        console.error('Error saving personal list:', error);
        showTemporaryMessage('Erro ao salvar lista. Verifique o espaço de armazenamento.', 'error');
        return false;
    }
}

function addToPersonalList(item) {
    if (!item || !item.id || !item.title) {
        return { success: false, message: 'Dados do item inválidos' };
    }
    
    const list = getPersonalList();
    
    if (list.some(existingItem => existingItem.id === item.id)) {
        return { success: false, message: 'Item já está na sua lista' };
    }
    
    const itemToSave = {
        id: item.id,
        title: item.title,
        authors: item.authors,
        publication_year: item.publication_year,
        venue_name: item.venue_name,
        type: item.type,
        added_at: new Date().toISOString()
    };
    
    list.push(itemToSave);
    
    if (savePersonalList(list)) {
        updateGlobalCounter();
        return { success: true, message: 'Item adicionado à sua lista' };
    }
    
    return { success: false, message: 'Erro ao adicionar item' };
}

function removeFromList(itemId) {
    const list = getPersonalList();
    const item = list.find(item => item.id === itemId);
    
    if (!item) {
        showTemporaryMessage('Item não encontrado na lista', 'error');
        return;
    }
    
    const updatedList = list.filter(item => item.id !== itemId);
    
    if (savePersonalList(updatedList)) {
        loadPersonalList();
        updateGlobalCounter();
        showTemporaryMessage(`"${item.title}" removido da lista`, 'success');
    }
}

function clearAllItems() {
    const list = getPersonalList();
    
    if (list.length === 0) {
        showTemporaryMessage('Sua lista já está vazia', 'info');
        return;
    }
    
    if (confirm('Tem certeza que deseja limpar toda a sua lista? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem(STORAGE_KEY);
        loadPersonalList();
        updateGlobalCounter();
        showTemporaryMessage('Lista limpa com sucesso', 'success');
    }
}

function setupEventHandlers() {
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        if (target.classList.contains('remove-from-list-btn')) {
            const itemId = parseInt(target.dataset.itemId);
            if (!isNaN(itemId)) {
                removeFromList(itemId);
            }
            return;
        }
        
        if (target.classList.contains('clear-all-btn') || target.id === 'clear-all-btn') {
            clearAllItems();
            return;
        }
    });
}

function setupExportFunctionality() {
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        switch (target.id) {
            case 'export-txt-btn':
                exportABNT();
                break;
            case 'export-bib-btn':
                exportBibTeX();
                break;
            case 'export-ris-btn':
                exportRIS();
                break;
            case 'export-json-btn':
                exportJSON();
                break;
        }
    });
}

function updateGlobalCounter() {
    const counter = document.getElementById('reading-list-counter');
    if (counter) {
        const count = getPersonalList().length;
        counter.textContent = count;
        counter.style.display = count > 0 ? 'inline' : 'none';
    }
    
    if (window.updateReadingListCounter) {
        window.updateReadingListCounter();
    }
}

function formatAuthorsForDisplay(authors) {
    if (Array.isArray(authors)) {
        return authors.map(author => author.full_name || author).join('; ');
    }
    return authors || 'Autor não informado';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showTemporaryMessage(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `temporary-message temporary-message-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    
    const bgColor = {
        success: 'var(--primary-blue)',
        error: '#dc3545',
        info: 'var(--subtle-gray)'
    }[type] || 'var(--subtle-gray)';
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: bgColor,
        color: 'white',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: '4px',
        zIndex: '1000',
        fontFamily: 'var(--mono)',
        fontSize: '12px',
        maxWidth: '300px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

async function fetchCompleteWorkData(itemIds) {
    if (itemIds.length === 0) return [];
    
    try {
        const detailedWorks = await Promise.all(
            itemIds.map(async (id) => {
                try {
                    const response = await fetch(`${window.location.origin}/api/work/${id}/details`);
                    if (response.ok) {
                        const data = await response.json();
                        return data;
                    }
                    return null;
                } catch (error) {
                    console.error(`Error fetching work ${id}:`, error);
                    return null;
                }
            })
        );
        
        return detailedWorks.filter(work => work !== null);
        
    } catch (error) {
        console.error('Error fetching complete work data:', error);
        showTemporaryMessage('Erro ao buscar dados completos. Usando dados locais.', 'error');
        return [];
    }
}

async function exportABNT() {
    const items = getPersonalList();
    if (items.length === 0) {
        showTemporaryMessage('Sua lista está vazia. Não há nada para exportar.', 'info');
        return;
    }
    
    showTemporaryMessage('Gerando documento DOCX...', 'info');
    
    const completeData = await fetchCompleteWorkData(items.map(item => item.id));
    
    // Usando dynamic import para carregar as bibliotecas
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('https://unpkg.com/docx@8.2.2/build/index.js');
    
    const children = [];
    
    // Informações da exportação
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "INFORMAÇÕES DA EXPORTAÇÃO",
                    bold: true
                })
            ]
        }),
        new Paragraph({
            text: `Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`
        }),
        new Paragraph({
            text: `Total de referências: ${items.length}`
        }),
        new Paragraph({
            text: `Dados completos obtidos: ${completeData.length}`
        }),
        new Paragraph({
            text: "Fonte: Ethnos Academic Database"
        }),
        new Paragraph({ text: "" }), // Linha em branco
        
        new Paragraph({
            children: [
                new TextRun({
                    text: "REFERÊNCIAS",
                    bold: true
                })
            ]
        }),
        new Paragraph({ text: "" })
    );
    
    // Referências
    items.forEach((item, index) => {
        const work = completeData.find(data => data.id === item.id) || item;
        
        let authorsText = 'AUTOR NÃO INFORMADO';
        if (work.authors && Array.isArray(work.authors)) {
            authorsText = work.authors.map((author) => {
                let authorName = author.name || author.full_name || author;
                
                if (authorName && authorName.includes(' ')) {
                    const parts = authorName.trim().split(' ');
                    const lastName = parts.pop().toUpperCase();
                    const firstNames = parts.join(' ');
                    authorName = `${lastName}, ${firstNames}`;
                } else {
                    authorName = authorName.toUpperCase();
                }
                
                return authorName;
            }).join('; ');
        } else if (work.authors) {
            authorsText = work.authors.toUpperCase();
        }
        
        const title = work.title || 'Título não informado';
        const subtitle = work.subtitle ? `: ${work.subtitle}` : '';
        const year = work.publication?.year || work.year || 'S.d.';
        const venue = work.venue?.name || work.venue_name || '';
        const publisher = work.publisher?.name || work.publisher_name || '';
        const volume = work.publication?.volume || work.volume || '';
        const issue = work.publication?.issue || work.issue || '';
        const pages = work.publication?.pages || work.pages || '';
        const doi = work.doi || '';
        const issn = work.venue?.issn || '';
        const workType = work.work_type || work.type || '';
        const language = work.language || '';
        const openAccess = work.publication?.open_access || work.open_access;
        const peerReviewed = work.publication?.peer_reviewed || work.peer_reviewed;
        
        // Construir referência ABNT
        let referenceText = `${authorsText}. ${title}${subtitle}. `;
        
        if (venue) {
            referenceText += `${venue}, `;
            if (volume) referenceText += `v. ${volume}, `;
            if (issue && issue !== 'None') referenceText += `n. ${issue}, `;
        }
        if (publisher && venue) referenceText += `${publisher}, `;
        else if (publisher) referenceText += `${publisher}, `;
        
        referenceText += `${year}.`;
        
        if (pages) referenceText += ` p. ${pages}.`;
        if (doi) {
            referenceText += ` Disponível em: https://doi.org/${doi}. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.`;
        }
        
        // Adicionar referência como parágrafo justificado (não recuado)
        children.push(
            new Paragraph({
                text: referenceText,
                alignment: AlignmentType.JUSTIFY,
                spacing: {
                    after: 240  // Espaçamento após cada referência
                }
            })
        );
    });
    
    // Estatísticas
    const stats = {
        total: items.length,
        withAbstract: completeData.filter(w => w.abstract && w.abstract.length > 0).length,
        withDOI: completeData.filter(w => w.doi).length,
        openAccess: completeData.filter(w => w.publication?.open_access || w.open_access).length,
        peerReviewed: completeData.filter(w => w.publication?.peer_reviewed || w.peer_reviewed).length
    };
    
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: "ESTATÍSTICAS",
                    bold: true
                })
            ]
        }),
        new Paragraph({
            text: `Total de referências: ${stats.total}`
        }),
        new Paragraph({
            text: `Com resumo: ${stats.withAbstract} (${Math.round(stats.withAbstract/stats.total*100)}%)`
        }),
        new Paragraph({
            text: `Com DOI: ${stats.withDOI} (${Math.round(stats.withDOI/stats.total*100)}%)`
        }),
        new Paragraph({
            text: `Acesso aberto: ${stats.openAccess} (${Math.round(stats.openAccess/stats.total*100)}%)`
        }),
        new Paragraph({
            text: `Revisado por pares: ${stats.peerReviewed} (${Math.round(stats.peerReviewed/stats.total*100)}%)`
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
            text: "Gerado por Ethnos Academic Database - ethnos.app",
            alignment: AlignmentType.CENTER,
            italic: true
        })
    );
    
    const doc = new Document({
        sections: [{
            children: children
        }]
    });
    
    // Gerar e baixar o documento
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `referencias-abnt-${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showTemporaryMessage('Referências ABNT exportadas em formato DOCX', 'success');
}

function formatWorkType(type) {
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

function formatLanguage(language) {
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

async function exportBibTeX() {
    const items = getPersonalList();
    if (items.length === 0) {
        showTemporaryMessage('Sua lista está vazia. Não há nada para exportar.', 'info');
        return;
    }
    
    showTemporaryMessage('Buscando dados completos...', 'info');
    
    const completeData = await fetchCompleteWorkData(items.map(item => item.id));
    
    // Cabeçalho BibTeX formatado
    let content = '';
    content += '%================================================================\n';
    content += '%                    BIBLIOGRAFIA BIBTEX                        \n';
    content += '%                   Ethnos Academic Database                    \n';  
    content += '%================================================================\n';
    content += '%\n';
    content += `% Exportado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n`;
    content += `% Total de referências: ${items.length}\n`;
    content += `% Dados completos obtidos: ${completeData.length}\n`;
    content += `% Formato: BibTeX padrão para LaTeX\n`;
    content += `% Fonte: ethnos.app\n`;
    content += '%\n';
    content += '%----------------------------------------------------------------\n\n';
    
    items.forEach(item => {
        const work = completeData.find(data => data.id === item.id) || item;
        
        let authorsText = '';
        if (work.authors && Array.isArray(work.authors)) {
            authorsText = work.authors.map(author => {
                const name = author.name || author.full_name || author;
                const parts = name.split(' ');
                if (parts.length > 1) {
                    const lastName = parts.pop();
                    const firstNames = parts.join(' ');
                    return `${lastName}, ${firstNames}`;
                }
                return name;
            }).join(' and ');
        } else if (work.authors) {
            authorsText = work.authors.replace(/;/g, ' and');
        }
        
        const title = (work.title || '').replace(/[{}]/g, '');
        const subtitle = work.subtitle ? ` - ${work.subtitle}` : '';
        const year = work.publication?.year || work.year || '';
        const venue = work.venue?.name || work.venue_name || '';
        const volume = work.publication?.volume || work.volume || '';
        const issue = work.publication?.issue || work.issue || '';
        const pages = work.publication?.pages || work.pages || '';
        const doi = work.doi || '';
        const issn = work.venue?.issn || '';
        const publisher = work.publisher?.name || work.publisher_name || '';
        const language = work.language || '';
        const abstract = work.abstract || '';
        
        // Determinar tipo correto de entrada BibTeX
        let entryType = 'misc';
        const workType = work.work_type || work.type || '';
        
        switch (workType.toUpperCase()) {
            case 'ARTICLE':
                entryType = venue ? 'article' : 'misc';
                break;
            case 'BOOK':
                entryType = 'book';
                break;
            case 'CHAPTER':
                entryType = 'incollection';
                break;
            case 'CONFERENCE':
                entryType = 'inproceedings';
                break;
            case 'THESIS':
                entryType = 'phdthesis';
                break;
            case 'REPORT':
                entryType = 'techreport';
                break;
            default:
                entryType = venue ? 'article' : 'misc';
        }
        
        // Gerar chave de citação única e legível
        let citeKey = `work${work.id}`;
        if (work.authors && Array.isArray(work.authors) && work.authors[0]) {
            const firstAuthor = (work.authors[0].name || work.authors[0].full_name || '').split(' ').pop() || '';
            const yearStr = year ? year.toString() : 'nodate';
            citeKey = `${firstAuthor.toLowerCase()}${yearStr}work${work.id}`;
        }
        
        // Comentário identificador da referência
        content += `% -------- Referência ${items.indexOf(item) + 1}/${items.length} --------\n`;
        content += `@${entryType}{${citeKey},\n`;
        
        // Campos obrigatórios primeiro
        if (authorsText) content += `  author    = {${authorsText}},\n`;
        content += `  title     = {${title}${subtitle}},\n`;
        if (year) content += `  year      = {${year}},\n`;
        
        // Campos específicos por tipo (alinhados)
        switch (entryType) {
            case 'article':
                if (venue) content += `  journal   = {${venue}},\n`;
                if (volume) content += `  volume    = {${volume}},\n`;
                if (issue && issue !== 'None') content += `  number    = {${issue}},\n`;
                if (pages) content += `  pages     = {${pages}},\n`;
                break;
                
            case 'book':
                if (publisher) content += `  publisher = {${publisher}},\n`;
                if (pages) content += `  pages     = {${pages}},\n`;
                break;
                
            case 'incollection':
                if (venue) content += `  booktitle = {${venue}},\n`;
                if (publisher) content += `  publisher = {${publisher}},\n`;
                if (pages) content += `  pages     = {${pages}},\n`;
                break;
                
            case 'inproceedings':
                if (venue) content += `  booktitle = {${venue}},\n`;
                if (pages) content += `  pages     = {${pages}},\n`;
                break;
                
            case 'phdthesis':
                if (publisher) content += `  school    = {${publisher}},\n`;
                break;
                
            case 'techreport':
                if (publisher) content += `  institution = {${publisher}},\n`;
                break;
        }
        
        // Campos opcionais (alinhados)
        if (doi) {
            content += `  doi       = {${doi}},\n`;
            content += `  url       = {https://doi.org/${doi}},\n`;
        }
        if (issn) content += `  issn      = {${issn}},\n`;
        if (language && language !== 'pt') content += `  language  = {${language}},\n`;
        
        // Abstract (limitado e formatado)
        if (abstract) {
            const cleanAbstract = abstract.replace(/[{}\\\\]/g, '').substring(0, 300);
            content += `  abstract  = {${cleanAbstract}${abstract.length > 300 ? '...' : ''}},\n`;
        }
        
        // Notas especiais
        const notes = [];
        if (work.publication?.open_access || work.open_access) notes.push('Open Access');
        if (work.publication?.peer_reviewed || work.peer_reviewed) notes.push('Peer Reviewed');
        if (notes.length > 0) {
            content += `  note      = {${notes.join(', ')}},\n`;
        }
        
        content += '}\n\n';
    });
    
    // Rodapé informativo
    content += '%----------------------------------------------------------------\n';
    content += `% Total de ${items.length} referências exportadas\n`;
    content += `% Gerado por Ethnos Academic Database (ethnos.app)\n`;
    content += `% Formato compatível com LaTeX, BibDesk, Mendeley, Zotero\n`;
    content += '%================================================================';
    
    downloadFile(content, `bibliografia-${new Date().toISOString().split('T')[0]}.bib`, 'text/plain');
    showTemporaryMessage('Bibliografia BibTeX exportada com formatação profissional', 'success');
}

async function exportRIS() {
    const items = getPersonalList();
    if (items.length === 0) {
        showTemporaryMessage('Sua lista está vazia. Não há nada para exportar.', 'info');
        return;
    }
    
    showTemporaryMessage('Buscando dados completos...', 'info');
    
    const completeData = await fetchCompleteWorkData(items.map(item => item.id));
    
    let content = '';
    
    items.forEach(item => {
        const work = completeData.find(data => data.id === item.id) || item;
        
        // Mapear tipos para RIS corretamente
        let risType = 'JOUR';  // Journal article (default)
        const workType = (work.work_type || work.type || '').toUpperCase();
        
        switch (workType) {
            case 'ARTICLE':
                risType = 'JOUR';  // Journal Article
                break;
            case 'BOOK':
                risType = 'BOOK';  // Whole book
                break;
            case 'CHAPTER':
                risType = 'CHAP';  // Book chapter
                break;
            case 'THESIS':
                risType = 'THES';  // Thesis/Dissertation
                break;
            case 'CONFERENCE':
                risType = 'CONF';  // Conference proceeding
                break;
            case 'REPORT':
                risType = 'RPRT';  // Report
                break;
            case 'DATASET':
                risType = 'DATA';  // Dataset
                break;
            default:
                // Se tem venue/journal, é artigo, senão é misc
                risType = (work.venue?.name || work.venue_name) ? 'JOUR' : 'GEN';
        }
        
        content += `TY  - ${risType}\n`;
        
        if (work.title) {
            const fullTitle = work.title + (work.subtitle ? ` - ${work.subtitle}` : '');
            content += `TI  - ${fullTitle}\n`;
        }
        
        if (Array.isArray(work.authors)) {
            work.authors.forEach(author => {
                const authorName = author.name || author.full_name || author;
                if (authorName) {
                    content += `AU  - ${authorName}\n`;
                    
                    if (author.affiliation) {
                        content += `AD  - ${author.affiliation}\n`;
                    }
                    
                    if (author.orcid) {
                        content += `UR  - https://orcid.org/${author.orcid}\n`;
                    }
                }
            });
        } else if (work.authors) {
            content += `AU  - ${work.authors}\n`;
        }
        
        if (work.venue?.name || work.venue_name) {
            const venueName = work.venue?.name || work.venue_name;
            if (risType === 'JOUR') {
                content += `JO  - ${venueName}\n`;
            } else {
                content += `T2  - ${venueName}\n`;  // Secondary title for other types
            }
        }
        
        const year = work.publication?.year || work.year;
        if (year) content += `PY  - ${year}\n`;
        
        const volume = work.publication?.volume || work.volume;
        if (volume) content += `VL  - ${volume}\n`;
        
        const issue = work.publication?.issue || work.issue;
        if (issue && issue !== 'None') content += `IS  - ${issue}\n`;
        
        const pages = work.publication?.pages || work.pages;
        if (pages) {
            // RIS suporta páginas de início e fim separadas ou intervalo
            if (pages.includes('-')) {
                const [start, end] = pages.split('-');
                content += `SP  - ${start.trim()}\n`;
                if (end && end.trim()) content += `EP  - ${end.trim()}\n`;
            } else {
                content += `SP  - ${pages}\n`;
            }
        }
        
        const publisher = work.publisher?.name || work.publisher_name;
        if (publisher) content += `PB  - ${publisher}\n`;
        
        const doi = work.doi;
        if (doi) {
            content += `DO  - ${doi}\n`;
            content += `UR  - https://doi.org/${doi}\n`;
        }
        
        const issn = work.venue?.issn;
        if (issn) content += `SN  - ${issn}\n`;
        
        // Abstract - limitar tamanho para compatibilidade
        if (work.abstract) {
            const cleanAbstract = work.abstract.replace(/[\\r\n\\t]/g, ' ').substring(0, 1000);
            content += `AB  - ${cleanAbstract}${work.abstract.length > 1000 ? '...' : ''}\n`;
        }
        
        // Language code (ISO 639-1 preferred)
        if (work.language) {
            const langMap = {
                'pt': 'por', 'en': 'eng', 'es': 'spa', 'fr': 'fre', 
                'de': 'ger', 'it': 'ita', 'Eng': 'eng', 'Ita': 'ita', 'Por': 'por'
            };
            const langCode = langMap[work.language] || work.language.toLowerCase();
            content += `LA  - ${langCode}\n`;
        }
        
        // Keywords for quality indicators
        const keywords = [];
        if (work.publication?.peer_reviewed || work.peer_reviewed) {
            keywords.push('peer-reviewed');
        }
        if (work.publication?.open_access || work.open_access) {
            keywords.push('open-access');
        }
        if (workType) {
            keywords.push(workType.toLowerCase());
        }
        if (keywords.length > 0) {
            content += `KW  - ${keywords.join(', ')}\n`;
        }
        
        // Database and provider info
        content += `DB  - ethnos_app\n`;
        content += `DP  - Ethnos Academic Database\n`;
        
        // Access date
        content += `DA  - ${new Date().toISOString().split('T')[0]}\n`;
        
        // End record
        content += 'ER  - \n\n';
    });
    
    downloadFile(content, `referencias-expandido-${new Date().toISOString().split('T')[0]}.ris`, 'application/x-research-info-systems');
    showTemporaryMessage('Bibliografia RIS expandida exportada com sucesso', 'success');
}

async function exportJSON() {
    const items = getPersonalList();
    if (items.length === 0) {
        showTemporaryMessage('Sua lista está vazia. Não há nada para exportar.', 'info');
        return;
    }
    
    showTemporaryMessage('Buscando dados completos...', 'info');
    
    const completeData = await fetchCompleteWorkData(items.map(item => item.id));
    
    const exportData = {
        metadata: {
            format: 'ethnos_json_export',
            version: '2.1',
            exported_at: new Date().toISOString(),
            generator: 'ethnos_app Personal List System',
            source: 'Ethnos Academic Database API v2.0',
            total_items: items.length,
            api_calls_successful: completeData.length,
            data_quality: completeData.length === items.length ? 'complete' : 'partial'
        },
        export_info: {
            user_list_size: items.length,
            enhanced_records: completeData.length,
            fallback_records: items.length - completeData.length,
            data_completeness_ratio: (completeData.length / items.length * 100).toFixed(1) + '%',
            earliest_added: items.length > 0 ? Math.min(...items.map(item => 
                new Date(item.added_at || Date.now()).getTime()
            )) : null,
            latest_added: items.length > 0 ? Math.max(...items.map(item => 
                new Date(item.added_at || 0).getTime()
            )) : null
        },
        works: completeData.length > 0 ? completeData.map(work => {
            const originalItem = items.find(item => item.id === work.id);
            
            return {
                // Core identifiers
                id: work.id,
                
                // Work details
                title: work.title || 'Untitled',
                subtitle: work.subtitle || null,
                work_type: work.work_type || work.type || 'unknown',
                language: work.language || null,
                
                // Content
                abstract: work.abstract || null,
                
                // Publication details  
                publication: {
                    year: work.publication?.year || work.year || null,
                    volume: work.publication?.volume || work.volume || null,
                    issue: work.publication?.issue || work.issue || null,
                    pages: work.publication?.pages || work.pages || null,
                    publication_date: work.publication?.publication_date || null,
                    open_access: work.publication?.open_access || work.open_access || false,
                    peer_reviewed: work.publication?.peer_reviewed || work.peer_reviewed || false
                },
                
                // Venue/Journal
                venue: work.venue ? {
                    id: work.venue.id || null,
                    name: work.venue.name || null,
                    type: work.venue.type || null,
                    issn: work.venue.issn || null,
                    eissn: work.venue.eissn || null
                } : work.venue_name ? {
                    name: work.venue_name
                } : null,
                
                // Publisher
                publisher: work.publisher ? {
                    id: work.publisher.id || null,
                    name: work.publisher.name || null
                } : work.publisher_name ? {
                    name: work.publisher_name
                } : null,
                
                // Authors
                authors: Array.isArray(work.authors) ? work.authors.map((author, index) => ({
                    position: index + 1,
                    person_id: author.person_id || null,
                    name: author.name || author.full_name || null,
                    given_names: author.given_names || null,
                    family_name: author.family_name || null,
                    orcid: author.orcid || null,
                    affiliation: typeof author.affiliation === 'string' ? author.affiliation : 
                                author.affiliation?.name || null,
                    role: author.role || 'AUTHOR'
                })) : typeof work.authors === 'string' ? [{
                    position: 1,
                    name: work.authors,
                    role: 'AUTHOR'
                }] : [],
                
                // Identifiers and links
                identifiers: {
                    doi: work.doi || null,
                    temp_doi: work.temp_doi || null,
                    pmid: work.identifiers?.find(i => i.type === 'PMID')?.value || null,
                    arxiv: work.identifiers?.find(i => i.type === 'ARXIV')?.value || null
                },
                
                // Metrics and files
                metrics: work.metrics ? {
                    citation_count: work.metrics.citation_count || 0,
                    file_count: work.metrics.file_count || 0,
                    has_files: work.metrics.has_files || false,
                    has_citations: work.metrics.has_citations || false
                } : {
                    citation_count: 0,
                    file_count: 0,
                    has_files: false,
                    has_citations: false
                },
                
                // User list metadata
                user_metadata: {
                    added_to_list_at: originalItem?.added_at || new Date().toISOString(),
                    export_timestamp: new Date().toISOString(),
                    data_source: completeData.find(d => d.id === work.id) ? 'api_enhanced' : 'local_storage'
                }
            };
        }) : items.map(item => ({
            ...item,
            user_metadata: {
                added_to_list_at: item.added_at || new Date().toISOString(),
                export_timestamp: new Date().toISOString(),
                data_source: 'local_storage_only'
            }
        })),
        
        // Summary statistics
        statistics: {
            total_works: items.length,
            enhanced_from_api: completeData.length,
            using_local_data: items.length - completeData.length,
            has_abstracts: completeData.filter(w => w.abstract && w.abstract.length > 0).length,
            has_doi: completeData.filter(w => w.doi).length,
            open_access: completeData.filter(w => w.publication?.open_access || w.open_access).length,
            peer_reviewed: completeData.filter(w => w.publication?.peer_reviewed || w.peer_reviewed).length
        }
    };
    
    downloadFile(JSON.stringify(exportData, null, 2), `referencias-expandido-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    showTemporaryMessage('Dados JSON expandidos exportados com sucesso', 'success');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', function() {
    initializePersonalList();
});

window.MyList = {
    loadPersonalList: loadPersonalList,
    addToPersonalList: addToPersonalList,
    removeFromList: removeFromList,
    getPersonalList: getPersonalList,
    clearAllItems: clearAllItems,
    updateGlobalCounter: updateGlobalCounter,
    exportABNT: exportABNT,
    exportBibTeX: exportBibTeX,
    exportRIS: exportRIS,
    exportJSON: exportJSON
};
