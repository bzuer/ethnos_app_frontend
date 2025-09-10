from flask import Flask, render_template, request, jsonify, abort, redirect, url_for
import requests
import os
import time
import json
from config import Config
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)

@app.before_request
def block_dev_files():
    if request.path.endswith(('.dev.css', '.dev.js')):
        abort(404)

_cache = {}
_cache_ttl = {}
CACHE_DURATION = 300
HOMEPAGE_CACHE_DURATION = 600

def get_cached_data(key):
    if key in _cache and key in _cache_ttl:
        if time.time() < _cache_ttl[key]:
            return _cache[key]
        else:
            del _cache[key]
            del _cache_ttl[key]
    return None

def set_cached_data(key, data, duration=None):
    cache_duration = duration or CACHE_DURATION
    _cache[key] = data
    _cache_ttl[key] = time.time() + cache_duration

def api_request(endpoint, params=None, retry_count=2, use_cache=False, timeout=None):
    """Make a request to the Ethnos API with comprehensive error handling"""
    if use_cache:
        cache_key = f"{endpoint}:{json.dumps(params, sort_keys=True) if params else 'None'}"
        cached_result = get_cached_data(cache_key)
        if cached_result is not None:
            app.logger.debug(f"Cache hit: {endpoint}")
            return cached_result
    
    url = f"{app.config['API_BASE_URL']}{endpoint}"
    request_timeout = timeout or 15
    
    for attempt in range(retry_count + 1):
        try:
            app.logger.debug(f"API request attempt {attempt + 1}: {url} with params {params}")
            
            response = requests.get(
                url, 
                params=params, 
                timeout=request_timeout,
                headers={
                    'User-Agent': 'ethnos_app/1.0 (Academic Research Tool)',
                    'Accept': 'application/json'
                }
            )
            
            app.logger.debug(f"API response: status={response.status_code}, url={response.url}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    app.logger.debug(f"API success: {endpoint} returned {len(str(data))} chars")
                    
                    if use_cache:
                        cache_key = f"{endpoint}:{json.dumps(params, sort_keys=True) if params else 'None'}"
                        set_cached_data(cache_key, data)
                    
                    return data
                except ValueError as json_error:
                    app.logger.error(f"Invalid JSON response from {url}: {json_error}")
                    return None
            
            elif response.status_code == 404:
                app.logger.warning(f"API endpoint not found: {url}")
                return None
            
            elif response.status_code >= 500:
                app.logger.error(f"API server error {response.status_code} on {url}")
                if attempt < retry_count:
                    continue
                return None
            
            else:
                app.logger.error(f"API request failed with status {response.status_code}: {url}")
                return None
                
        except requests.exceptions.Timeout as e:
            app.logger.warning(f"API timeout on attempt {attempt + 1}: {url} - {e}")
            if attempt == retry_count:
                app.logger.error(f"API timeout after {retry_count + 1} attempts: {url}")
                return None
                
        except requests.exceptions.ConnectionError as e:
            app.logger.warning(f"API connection error on attempt {attempt + 1}: {url} - {e}")
            if attempt == retry_count:
                app.logger.error(f"API connection failed after {retry_count + 1} attempts: {url}")
                return None
                
        except requests.exceptions.RequestException as e:
            app.logger.error(f"API request exception: {url} - {e}")
            return None
            
        except Exception as e:
            app.logger.error(f"Unexpected error in API request to {url}: {e}")
            return None
    
    return None

def filter_quality_results(results):
    """Filter results to show only high-quality records with complete data"""
    if not results:
        return results
    
    filtered = []
    for work in results:
        if not isinstance(work, dict):
            continue
            
        has_title = work.get('title') and work.get('title').strip()
        has_authors = work.get('authors') or work.get('author_count', 0) > 0
        has_abstract = work.get('abstract') and len(work.get('abstract', '').strip()) > 50
        has_year = work.get('publication_year') or (work.get('publication') and work.get('publication', {}).get('year'))
        has_doi = work.get('doi') or work.get('temp_doi') or (work.get('publication') and work.get('publication', {}).get('doi'))
        
        quality_score = sum([bool(has_title), bool(has_authors), bool(has_abstract), bool(has_year), bool(has_doi)])
        
        if quality_score >= 3:
            work['quality_score'] = quality_score
            filtered.append(work)
    
    return filtered

def _generate_homepage_data():
    """Generate comprehensive homepage data with caching"""
    homepage_cache_key = "homepage_complete_data"
    cached_homepage = get_cached_data(homepage_cache_key)
    if cached_homepage:
        return cached_homepage
    
    stats = {
        'total_works': 0,
        'total_venues': 0,
        'total_authors': 0,
        'total_organizations': 0
    }
    recent_works = []
    top_venues = []
    top_authors = []
    top_organizations = []
    
    try:
        works_response = api_request('/works', {'limit': 12, 'page': 1}, use_cache=True)
        if works_response and 'data' in works_response:
            for work in works_response['data']:
                if work.get('title') and work.get('title').strip() and len(recent_works) < 8:
                    author_names = []
                    if work.get('authors_preview') and isinstance(work.get('authors_preview'), list) and len(work['authors_preview']) > 0:
                        for author in work['authors_preview'][:2]:
                            if isinstance(author, str):
                                author_name = author.strip()
                                if author_name:
                                    author_names.append(author_name)
                    
                    if author_names:
                        work['formatted_authors'] = ', '.join(author_names)
                        if work.get('author_count', 0) > 2:
                            work['formatted_authors'] += ' et al.'
                    else:
                        work['formatted_authors'] = 'Autor não informado'
                    
                    work['publication_year'] = work.get('publication_year') or "S/D"
                    
                    recent_works.append(work)
        
        venues_response = api_request('/venues', {'limit': 20, 'page': 1}, use_cache=True)
        if venues_response and 'data' in venues_response:
            venues_list = venues_response['data']
            if venues_response.get('pagination'):
                stats['total_venues'] = venues_response['pagination'].get('total', len(venues_list))
            else:
                stats['total_venues'] = len(venues_list)
            
            venues_with_works = []
            for venue in venues_list[:15]:
                works_count = venue.get('works_count', 0)
                name = venue.get('name', '').strip()
                if works_count > 5 and name and len(name) > 3 and not name.startswith('2020') and 'A History of' not in name:
                    venues_with_works.append({
                        'id': venue.get('id'),
                        'name': name,
                        'works_count': works_count,
                        'type': venue.get('type', 'JOURNAL'),
                        'publisher_name': venue.get('publisher_name') or 'Não informado'
                    })
            
            top_venues = sorted(venues_with_works, key=lambda x: x.get('works_count', 0), reverse=True)[:10]
        
        persons_response = api_request('/persons', {'limit': 50, 'page': 1}, use_cache=True)
        if persons_response and 'data' in persons_response:
            persons_list = persons_response['data']
            if persons_response.get('pagination'):
                stats['total_authors'] = persons_response['pagination'].get('total', len(persons_list))
            else:
                stats['total_authors'] = len(persons_list) * 10
        
        orgs_response = api_request('/organizations', {'limit': 25, 'page': 1}, use_cache=True, timeout=3)
        if orgs_response and 'data' in orgs_response:
            orgs_list = orgs_response['data']
            if orgs_response.get('pagination'):
                stats['total_organizations'] = orgs_response['pagination'].get('total', len(orgs_list))
            else:
                stats['total_organizations'] = len(orgs_list) * 10
            
            for org in orgs_list:
                name = org.get('name', '').strip()
                
                researchers_count = 0
                if org.get('metrics') and org['metrics'].get('affiliated_authors_count'):
                    researchers_count = org['metrics']['affiliated_authors_count']
                
                if (name and len(name) > 5 and researchers_count > 0 and
                    not name.startswith(',') and 
                    not name.startswith('.') and 
                    not name.startswith('"') and
                    'Department of Human Development' not in name and
                    'Te Puna Wānanga' not in name and
                    'Press' not in name):
                    
                    country = 'País não informado'
                    if org.get('location') and org['location'].get('country_code'):
                        country = org['location']['country_code']
                    
                    top_organizations.append({
                        'id': org.get('id'),
                        'name': name,
                        'type': org.get('type', 'UNIVERSITY'),
                        'country': country,
                        'persons_count': researchers_count
                    })
                    
                    if len(top_organizations) >= 10:
                        break
        
        if stats['total_works'] == 0:
            if venues_response and 'pagination' in venues_response:
                stats['total_works'] = venues_response['pagination'].get('total', 650000)
            else:
                stats['total_works'] = 650000
        
    except Exception as e:
        app.logger.error(f"Error loading homepage data: {e}")
        stats['total_works'] = 650000
        stats['total_venues'] = 4945
        stats['total_authors'] = 549480
        stats['total_organizations'] = 182170
    
    homepage_data = {
        'stats': stats,
        'recent_works': recent_works,
        'top_venues': top_venues,
        'top_organizations': top_organizations
    }
    set_cached_data(homepage_cache_key, homepage_data, HOMEPAGE_CACHE_DURATION)
    
    return homepage_data

@app.route('/')
def home():
    """Homepage with statistics and featured content"""
    homepage_data = _generate_homepage_data()
    return render_template('pages/home.html', initial_data=homepage_data, **homepage_data)

@app.route('/api/preload/homepage')
def api_preload_homepage():
    """API endpoint to preload homepage data for client cache"""
    try:
        homepage_cache_key = "homepage_complete_data"
        cached_homepage = get_cached_data(homepage_cache_key)
        if cached_homepage:
            return jsonify({
                'status': 'success',
                'data': cached_homepage,
                'source': 'cache'
            })
        
        homepage_data = _generate_homepage_data()
        
        cached_homepage = get_cached_data(homepage_cache_key)
        if cached_homepage:
            return jsonify({
                'status': 'success',
                'data': cached_homepage,
                'source': 'generated'
            })
        
        return jsonify({
            'status': 'error',
            'message': 'Failed to generate homepage data'
        }), 500
        
    except Exception as e:
        app.logger.error(f"Error in preload endpoint: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Server error'
        }), 500

@app.route('/search')
def search_form():
    """Advanced search form"""
    return render_template('pages/search-form.html')

@app.route('/search/advanced')
def search_advanced():
    """Advanced search form"""
    return render_template('pages/search-form.html')

@app.route('/search/live')
def search_live():
    """Smart search page with live results"""
    query = request.args.get('q', '').strip()
    search_type = request.args.get('type', 'all')
    page = int(request.args.get('page', 1))
    limit = 20
    
    results = {
        'works': [],
        'authors': [],
        'venues': [],
        'organizations': []
    }
    
    suggestions = []
    total_results = 0
    
    if query:
        try:
            if search_type in ['all', 'works']:
                works_response = api_request('/search/works', {
                    'q': query,
                    'limit': limit if search_type == 'works' else 10,
                    'page': page if search_type == 'works' else 1
                })
                if works_response and works_response.get('data'):
                    results['works'] = filter_quality_results(works_response['data'])
                    if works_response.get('pagination'):
                        total_results += works_response['pagination'].get('total', 0)
            
            if search_type in ['all', 'authors']:
                authors_response = api_request('/persons', {
                    'name': query,
                    'limit': limit if search_type == 'authors' else 5
                })
                if authors_response and authors_response.get('data'):
                    authors_filtered = []
                    for author in authors_response['data']:
                        if author.get('preferred_name') and author.get('preferred_name').strip():
                            works_count = 0
                            if author.get('metrics') and author['metrics'].get('works_count'):
                                works_count = author['metrics']['works_count']
                            
                            authors_filtered.append({
                                'id': author.get('id'),
                                'name': author.get('preferred_name'),
                                'organization_name': 'Instituição não informada',
                                'works_count': works_count
                            })
                    results['authors'] = authors_filtered[:10]
            
            if search_type in ['all', 'venues']:
                venues_response = api_request('/venues', {'limit': 100})
                if venues_response and venues_response.get('data'):
                    venues_filtered = []
                    query_lower = query.lower()
                    for venue in venues_response['data']:
                        venue_name = venue.get('name', '').lower()
                        if query_lower in venue_name and venue.get('works_count', 0) > 0:
                            venues_filtered.append({
                                'id': venue.get('id'),
                                'name': venue.get('name'),
                                'works_count': venue.get('works_count', 0),
                                'type': venue.get('type', 'JOURNAL'),
                                'publisher_name': venue.get('publisher_name', 'Editora não informada')
                            })
                    results['venues'] = sorted(venues_filtered, key=lambda x: x.get('works_count', 0), reverse=True)[:8]
            
            if search_type in ['all', 'organizations']:
                orgs_response = api_request('/organizations', {'limit': 50})
                if orgs_response and orgs_response.get('data'):
                    orgs_filtered = []
                    query_lower = query.lower()
                    for org in orgs_response['data']:
                        org_name = org.get('name', '').lower()
                        if query_lower in org_name:
                            orgs_filtered.append({
                                'id': org.get('id'),
                                'name': org.get('name'),
                                'type': org.get('type', 'UNIVERSITY'),
                                'country': org.get('country', 'País não informado'),
                                'persons_count': org.get('persons_count', 0)
                            })
                    results['organizations'] = orgs_filtered[:6]
            
            if query and len(query) > 2:
                common_terms = [
                    'antropologia', 'etnografia', 'cultura', 'sociedade', 'ritual',
                    'mito', 'parentesco', 'identidade', 'território', 'comunidade',
                    'tradição', 'modernidade', 'globalização', 'desenvolvimento',
                    'gênero', 'etnia', 'religião', 'política', 'economia'
                ]
                suggestions = [term for term in common_terms 
                             if term.startswith(query.lower()) and term != query.lower()][:5]
        
        except Exception as e:
            app.logger.error(f"Error in search: {e}")
    
    return render_template('pages/search-results.html',
                         query=query,
                         search_type=search_type,
                         results=results,
                         suggestions=suggestions,
                         total_results=total_results,
                         page=page,
                         limit=limit)

@app.route('/persons/<person_id>/works')
def person_works(person_id):
    return redirect(url_for('person_id_works', person_id=person_id, **request.args))

@app.route('/person/<person_id>/works')
def person_id_works(person_id):
    """Display works by person with full pagination"""
    try:
        person_response = api_request(f'/persons/{person_id}')
        if not person_response or 'data' not in person_response:
            return render_template('errors/404.html'), 404
            
        person_data = person_response['data']
        author_name = person_data.get('preferred_name') or person_data.get('name', 'Autor')
        
        page = int(request.args.get('page', 1))
        limit = 25
        
        works_response = api_request(f'/persons/{person_id}/works', {'page': page, 'limit': limit})
        
        if not works_response or 'data' not in works_response:
            search_params = {'query': f"Obras de {author_name}"}
            return render_template('pages/search-results.html',
                                 results=[],
                                 query=f"Obras de {author_name}",
                                 search_params=search_params,
                                 total=0,
                                 page=page)
        
        results = works_response.get('data', [])
        
        for work in results:
            if 'authors' in work and isinstance(work['authors'], dict):
                author_string = work['authors'].get('author_string', '')
                if author_string:
                    author_names = [name.strip() for name in author_string.split(';') if name.strip()]
                    work['authors'] = [{'name': name} for name in author_names]
                else:
                    work['authors'] = []
            elif not work.get('authors'):
                work['authors'] = []
        
        pagination_info = works_response.get('pagination', {})
        total_results = pagination_info.get('total', len(results))
        total_pages = pagination_info.get('totalPages', 1)
        
        pagination = {
            'page': page,
            'totalPages': total_pages,
            'hasPrev': pagination_info.get('hasPrev', page > 1),
            'hasNext': pagination_info.get('hasNext', page < total_pages),
            'total': total_results
        } if total_pages > 1 else None
        
        search_params = {'query': f"Obras de {author_name}"}
        
        is_person_works = True
        
        return render_template('pages/search-results.html',
                             results=results,
                             query=f"Obras de {author_name}",
                             search_params=search_params,
                             total=total_results,
                             page=page,
                             pagination=pagination,
                             person_data=person_data,
                             is_person_works=is_person_works)
    
    except Exception as e:
        app.logger.error(f"Error in person_id_works: {e}")
        return render_template('errors/500.html'), 500

@app.route('/venues/<venue_id>')
def venues_detail(venue_id):
    venue_response = api_request(f'/venues/{venue_id}')
    
    if not venue_response or 'data' not in venue_response:
        return render_template('errors/404.html'), 404
    
    venue = venue_response['data']
    
    page = int(request.args.get('page', 1))
    limit = 25
    
    publications = []
    total_publications = venue.get('works_count', 0)
    
    works_response = api_request(f'/venues/{venue_id}/works', {'limit': limit, 'page': page})
    if works_response and 'data' in works_response:
        publications_raw = works_response['data']
        publications = []
        
        for pub in publications_raw:
            if pub.get('authors') and len(pub['authors']) > 0:
                has_valid_author = False
                for author in pub['authors']:
                    author_name = ''
                    if isinstance(author, dict):
                        author_name = author.get('name', '').strip()
                    else:
                        author_name = str(author).strip()
                    if author_name:
                        has_valid_author = True
                        break
                
                if has_valid_author:
                    publications.append(pub)
        
    
    total_pages = max(1, (total_publications + limit - 1) // limit) if total_publications > 0 else 1
    has_prev = page > 1
    has_next = page < total_pages
    
    return render_template('pages/venues-detail.html', 
                         venue=venue,
                         venue_id=venue_id,
                         publications=publications,
                         total_publications=total_publications,
                         page=page,
                         total_pages=total_pages,
                         has_prev=has_prev,
                         has_next=has_next)

@app.route('/organizations/<org_id>')
def organizations_detail(org_id):
    """Display organization details with paginated works"""
    try:
        organization = api_request(f'/organizations/{org_id}')
        
        if not organization:
            return render_template('errors/404.html'), 404
        
        org_data = organization.get('data', {})
        org_name = org_data.get('name', '')
        if not org_name or not org_name.strip() or len(org_name.strip()) <= 1:
            return render_template('errors/404.html'), 404
        
        page = int(request.args.get('page', 1))
        limit = 25
        
        works_response = api_request(f'/organizations/{org_id}/works', {'page': page, 'limit': limit})
        
        if works_response and 'data' in works_response:
            works_data = works_response.get('data', [])
            for work in works_data:
                if 'authors' in work and isinstance(work['authors'], dict):
                    author_string = work['authors'].get('author_string', '')
                    if author_string:
                        author_names = [name.strip() for name in author_string.split(';') if name.strip()]
                        work['authors'] = [{'name': name} for name in author_names]
                    else:
                        work['authors'] = []
                elif not work.get('authors'):
                    work['authors'] = []
            
            pagination_info = works_response.get('pagination', {})
            total_results = pagination_info.get('total', len(works_data))
            total_pages = pagination_info.get('totalPages', 1)
            
            pagination = {
                'page': page,
                'totalPages': total_pages,
                'hasPrev': page > 1,
                'hasNext': page < total_pages,
                'total': total_results
            } if total_pages > 1 else None
            
            works = {
                'data': works_data,
                'total': total_results,
                'pagination': pagination
            }
        else:
            works_data = org_data.get('recent_works', [])
            total_works = org_data.get('metrics', {}).get('works_count', 0)
            works = {
                'data': works_data,
                'total_works': total_works,
                'showing_recent': len(works_data)
            }
        
        authors = {'data': org_data.get('top_authors', [])}
        
        is_organization_detail = True
        
        return render_template('pages/organizations-detail.html',
                             organization=organization,
                             works=works,
                             authors=authors,
                             is_organization_detail=is_organization_detail,
                             page=page,
                             pagination=works.get('pagination'))
        
    except Exception as e:
        app.logger.error(f"Error in organizations_detail: {e}")
        return render_template('errors/500.html'), 500

@app.route('/venues/complete')
def venues_complete():
    """Display complete journals listing with signature works layout and pagination"""
    try:
        page = int(request.args.get('page', 1))
        limit = 25
        
        venues_response = api_request('/venues', {'page': page, 'limit': limit})
        
        if not venues_response or 'data' not in venues_response:
            return render_template('pages/search-results.html',
                                 results=[],
                                 query="Todos os Periódicos",
                                 total=0,
                                 is_venues_listing=True)
        
        venues_list = venues_response['data']
        
        results = []
        for venue in venues_list:
            if venue.get('name') and venue.get('name').strip():
                results.append({
                    'id': venue.get('id'),
                    'title': venue.get('name'),
                    'venue_id': venue.get('id'),
                    'works_count': venue.get('works_count', 0),
                    'type': venue.get('type', 'JOURNAL'),
                    'issn': venue.get('issn'),
                    'eissn': venue.get('eissn')
                })
        
        pagination_info = venues_response.get('pagination', {})
        total_results = pagination_info.get('total', len(results))
        total_pages = max(1, (total_results + limit - 1) // limit)
        has_prev = page > 1
        has_next = page < total_pages
        
        pagination = {
            'page': page,
            'totalPages': total_pages,
            'hasPrev': has_prev,
            'hasNext': has_next,
            'total': total_results
        }
        
        return render_template('pages/search-results.html',
                             results=results,
                             query="Todos os Periódicos",
                             total=total_results,
                             page=page,
                             pagination=pagination,
                             is_venues_listing=True)
    
    except Exception as e:
        app.logger.error(f"Error in venues_complete: {e}")
        return render_template('errors/500.html'), 500

@app.route('/organizations/complete')
def organizations_complete():
    """Display complete organizations listing with signature works layout and pagination"""
    try:
        page = int(request.args.get('page', 1))
        limit = 25
        
        orgs_response = api_request('/organizations', {'page': page, 'limit': limit})
        
        if not orgs_response or 'data' not in orgs_response:
            return render_template('pages/search-results.html',
                                 results=[],
                                 query="Todas as Instituições",
                                 total=0,
                                 is_organizations_listing=True)
        
        orgs_list = orgs_response['data']
        
        results = []
        for org in orgs_list:
            org_name = org.get('name', '').strip()
            if org_name and len(org_name) > 1:
                researchers_count = 0
                if org.get('metrics') and org['metrics'].get('affiliated_authors_count'):
                    researchers_count = org['metrics']['affiliated_authors_count']
                
                results.append({
                    'id': org.get('id'),
                    'title': org_name,
                    'org_id': org.get('id'),
                    'type': org.get('type', 'UNIVERSITY'),
                    'researchers_count': researchers_count,
                    'ror_id': org.get('identifiers', {}).get('ror_id') if org.get('identifiers') else None
                })
        
        pagination_info = orgs_response.get('pagination', {})
        total_results = pagination_info.get('total', len(results))
        total_pages = max(1, (total_results + limit - 1) // limit)
        has_prev = page > 1
        has_next = page < total_pages
        
        pagination = {
            'page': page,
            'totalPages': total_pages,
            'hasPrev': has_prev,
            'hasNext': has_next,
            'total': total_results
        }
        
        return render_template('pages/search-results.html',
                             results=results,
                             query="Todas as Instituições",
                             total=total_results,
                             page=page,
                             pagination=pagination,
                             is_organizations_listing=True)
    
    except Exception as e:
        app.logger.error(f"Error in organizations_complete: {e}")
        return render_template('errors/500.html'), 500

@app.route('/works')
def works_list():
    """Display complete works catalog using /works endpoint"""
    try:
        page = int(request.args.get('page', 1))
        limit = 25
        
        works_response = api_request('/works', {'page': page, 'limit': limit})
        
        if not works_response or 'data' not in works_response:
            return render_template('pages/search-results.html',
                                 results=[],
                                 query="Todo o Catálogo",
                                 total=0,
                                 is_catalog_listing=True)
        
        works_list = works_response['data']
        
        results = []
        for work in works_list:
            if work.get('title') and work.get('title').strip():
                author_names = []
                if work.get('authors') and isinstance(work.get('authors'), list):
                    for author in work['authors'][:3]:
                        author_name = str(author).strip()
                        if author_name:
                            author_names.append(author_name)
                
                if author_names:
                    work['formatted_authors'] = ', '.join(author_names)
                    if work.get('authors') and len(work['authors']) > 3:
                        work['formatted_authors'] += ' et al.'
                else:
                    work['formatted_authors'] = 'Autor não informado'
                
                work['publication_year'] = work.get('year') or 'S/D'
                
                if work.get('venue'):
                    work['venue_name'] = work['venue'].get('name', '')
                
                results.append(work)
        
        pagination_info = works_response.get('pagination', {})
        total_results = pagination_info.get('total', len(results))
        total_pages = max(1, (total_results + limit - 1) // limit)
        
        pagination = {
            'page': page,
            'totalPages': total_pages,
            'hasPrev': page > 1,
            'hasNext': page < total_pages,
            'total': total_results
        }
        
        return render_template('pages/search-results.html',
                             results=results,
                             query="Todo o Catálogo",
                             total=total_results,
                             page=page,
                             pagination=pagination,
                             is_catalog_listing=True,
                             search_params={'query': '*'})
    
    except Exception as e:
        app.logger.error(f"Error in catalog: {e}")
        return render_template('errors/500.html'), 500

@app.route('/venues')
def venues_list():
    """Display journals listing"""
    journals = api_request('/venues', {'limit': 50})
    
    stats = api_request('/venues/statistics')
    
    return render_template('pages/venues-list.html',
                         journals=journals,
                         stats=stats)

@app.route('/ppgas')
def ppgas_home():
    """PPGAS section with courses and professors"""
    try:
        courses_data = api_request('/courses', {'limit': 10, 'page': 1})
        courses = courses_data.get('courses', []) if courses_data else []
        
        instructors_data = api_request('/instructors', {'limit': 10, 'page': 1})
        instructors = instructors_data.get('instructors', []) if instructors_data else []
        
        courses_stats = api_request('/courses/statistics')
        
        instructors_stats = api_request('/instructors/statistics')
        
        disciplinas_por_professores = []
        if instructors:
            for instructor in instructors:
                disciplinas_por_professores.append({
                    'professor_id': instructor.get('person_id'),
                    'professor': instructor.get('preferred_name', ''),
                    'total_disciplinas': instructor.get('courses_taught', 0),
                    'periodo': f"{instructor.get('earliest_year', '')}-{instructor.get('latest_year', '')}" if instructor.get('earliest_year') else 'N/A'
                })
        
        return render_template('pages/ppgas-home.html',
                             courses=courses,
                             disciplinas_por_professores=disciplinas_por_professores,
                             courses_stats=courses_stats,
                             instructors_stats=instructors_stats)
    except Exception as e:
        return render_template('pages/ppgas-home.html',
                             courses=[],
                             disciplinas_por_professores=[],
                             courses_stats=None,
                             instructors_stats=None)

@app.route('/courses/ppgas')
def courses_ppgas():
    """PPGAS courses listing"""
    try:
        page = int(request.args.get('page', 1))
        limit = 20
        
        courses_data = api_request('/courses', {'page': page, 'limit': limit}, timeout=30)
        courses = courses_data.get('courses', []) if courses_data else []
        
        api_pagination = courses_data.get('pagination', {}) if courses_data else {}
        pagination = None
        if api_pagination and api_pagination.get('total', 0) > limit:
            total_pages = (api_pagination.get('total', 0) + limit - 1) // limit
            pagination = {
                'page': page,
                'totalPages': total_pages,
                'has_prev': page > 1,
                'has_next': page < total_pages
            }
        
        stats = api_request('/courses/statistics')
        
        return render_template('pages/courses-ppgas.html',
                             courses=courses,
                             pagination=pagination,
                             stats=stats)
    except Exception as e:
        app.logger.error(f"Exception in courses_ppgas(): {e}")
        import traceback
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        return render_template('pages/courses-ppgas.html',
                             courses=[],
                             pagination={},
                             stats=None)

@app.route('/courses/ppgas/<course_id>')
def courses_ppgas_detail(course_id):
    """PPGAS course detail"""
    try:
        course_data = api_request(f'/courses/{course_id}')
        
        if course_data:
            course = {
                'id': course_data.get('id'),
                'name': course_data.get('name'),
                'code': course_data.get('code'),
                'year': course_data.get('year'),
                'semester': course_data.get('semester'),
                'credits': course_data.get('credits'),
                'instructor_count': course_data.get('instructor_count'),
                'bibliography_count': course_data.get('bibliography_count')
            }
            bibliography = course_data.get('bibliography', [])
            instructors = course_data.get('instructors', [])
            subjects = course_data.get('subjects', [])
        else:
            course = None
            bibliography = []
            instructors = []
            subjects = []
        
        return render_template('pages/courses-detail.html',
                             course=course,
                             bibliography=bibliography,
                             instructors=instructors,
                             subjects=subjects)
    except Exception as e:
        return render_template('pages/courses-detail.html',
                             course=None,
                             bibliography=[],
                             instructors=[],
                             subjects=[])

@app.route('/courses/<course_id>')
def courses_detail(course_id):
    """Course detail - general route"""
    try:
        course_data = api_request(f'/courses/{course_id}')
        
        if course_data:
            course = {
                'id': course_data.get('id'),
                'name': course_data.get('name'),
                'code': course_data.get('code'),
                'year': course_data.get('year'),
                'semester': course_data.get('semester'),
                'credits': course_data.get('credits'),
                'instructor_count': course_data.get('instructor_count'),
                'bibliography_count': course_data.get('bibliography_count')
            }
            bibliography = course_data.get('bibliography', [])
            instructors = course_data.get('instructors', [])
            subjects = course_data.get('subjects', [])
        else:
            course = None
            bibliography = []
            instructors = []
            subjects = []
        
        return render_template('pages/courses-detail.html',
                             course=course,
                             bibliography=bibliography,
                             instructors=instructors,
                             subjects=subjects)
    except Exception as e:
        return render_template('pages/courses-detail.html',
                             course=None,
                             bibliography=[],
                             instructors=[],
                             subjects=[])

@app.route('/courses')
def courses_list():
    """General courses listing"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 30))
        
        courses_data = api_request('/courses', {'page': page, 'limit': limit})
        courses = courses_data.get('courses', []) if courses_data else []
        pagination = courses_data.get('pagination', {}) if courses_data else {}
        
        stats = api_request('/courses/statistics')
        
        return render_template('pages/courses-list.html',
                             courses=courses,
                             pagination=pagination,
                             stats=stats,
                             current_page=page)
    except Exception as e:
        return render_template('pages/courses-list.html',
                             courses=[],
                             pagination={},
                             stats=None,
                             current_page=1)

@app.route('/instructors')
def instructors_list():
    """PPGAS professors listing"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        instructors_data = api_request('/instructors', {'page': page, 'limit': limit})
        instructors = instructors_data.get('instructors', []) if instructors_data else []
        pagination = instructors_data.get('pagination', {}) if instructors_data else {}
        
        stats = api_request('/instructors/statistics')
        
        return render_template('pages/instructors-list.html',
                             instructors=instructors,
                             pagination=pagination,
                             stats=stats)
    except Exception as e:
        return render_template('pages/instructors-list.html',
                             instructors=[],
                             pagination={},
                             stats=None)

@app.route('/instructors/<instructor_id>')
def instructors_detail(instructor_id):
    """PPGAS professor detail"""
    stats_data = api_request(f'/instructors/{instructor_id}/statistics')
    
    if stats_data and 'person' in stats_data:
        instructor = stats_data.get('person', {})
        teaching_profile = stats_data.get('teaching_profile', {})
        authorship_profile = stats_data.get('authorship_profile', {})
        
        instructor['courses_taught'] = teaching_profile.get('courses_taught', 0)
        instructor['bibliography_contributed'] = teaching_profile.get('bibliography_items_used', 0)
        instructor['earliest_year'] = teaching_profile.get('teaching_start_year')
        instructor['latest_year'] = teaching_profile.get('teaching_end_year')
        instructor['teaching_span_years'] = teaching_profile.get('teaching_span_years', 0)
        instructor['works_authored'] = authorship_profile.get('works_authored', 0)
        instructor['first_publication_year'] = authorship_profile.get('first_publication_year')
        instructor['latest_publication_year'] = authorship_profile.get('latest_publication_year')
        instructor['unique_collaborators'] = teaching_profile.get('unique_collaborators', 0)
        instructor['programs_count'] = teaching_profile.get('programs_count', 0)
        
        bibliography = stats_data.get('recent_authored_works', [])
        subjects = stats_data.get('subject_expertise', [])
        most_used_authors = stats_data.get('most_used_authors_in_courses', [])
        teaching_collaborators = stats_data.get('teaching_collaborators', [])
        
        courses_data = api_request(f'/instructors/{instructor_id}/courses')
        courses = courses_data if courses_data else []
        
        return render_template('pages/instructors-detail.html',
                             instructor=instructor,
                             courses=courses,
                             bibliography=bibliography,
                             subjects=subjects,
                             most_used_authors=most_used_authors,
                             teaching_collaborators=teaching_collaborators)
    else:
        return render_template('pages/instructors-detail.html',
                             instructor=None,
                             courses=[],
                             bibliography=[],
                             subjects=[],
                             most_used_authors=[],
                             teaching_collaborators=[])



@app.route('/search/results')
def search_results():
    """Display search results - main route"""
    query = request.args.get('q', '')
    title = request.args.get('title', '')
    author = request.args.get('author', '')
    venue = request.args.get('venue', '')
    year_from = request.args.get('year_from', '') or request.args.get('year_start', '')
    year_to = request.args.get('year_to', '') or request.args.get('year_end', '')
    work_type = request.args.get('type', '')
    language = request.args.get('language', '')
    peer_reviewed = request.args.get('peer_reviewed', '')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    
    params = {
        'page': page,
        'limit': min(limit, 100)  # Respect API limit
    }
    
    has_specific_search = (query and query != '*') or title or author or venue
    
    if not has_specific_search or query == '*':
        catalog_params = {'page': page, 'limit': limit}
        search_results = api_request('/works', catalog_params)
        search_query = "*"
    else:
        search_query = query or title or author or venue
        
        has_advanced_params = work_type or year_from or year_to or language or peer_reviewed or venue
        
        if has_advanced_params:
            search_params = {'q': search_query, 'page': page, 'limit': limit}
            
            if work_type:
                search_params['work_type'] = work_type
            if year_from:
                search_params['year_from'] = year_from  
            if year_to:
                search_params['year_to'] = year_to
            if language:
                search_params['language'] = language
            if venue:
                search_params['venue'] = venue
            if peer_reviewed:
                search_params['peer_reviewed'] = peer_reviewed.lower() == 'true'
            
            search_results = api_request('/search/works', search_params, use_cache=True)
        else:
            search_params = {'q': search_query, 'page': page, 'limit': limit}
            
            # Try Sphinx first, fallback to /search/works on error
            search_results = api_request('/search/sphinx', search_params, use_cache=True)
            
            # If Sphinx fails or returns error, use /search/works as fallback
            if not search_results or search_results.get('status') == 'error' or not search_results.get('data'):
                app.logger.warning(f"Sphinx search failed for query: {search_query}, falling back to /search/works")
                search_results = api_request('/search/works', search_params, use_cache=True)
    
    if search_results:
        app.logger.debug(f"API response keys: {search_results.keys()}")
        
        if 'data' in search_results and isinstance(search_results['data'], dict) and 'results' in search_results['data']:
            data = search_results['data']
            works = data['results']
            meta = data.get('meta', {})
            meta['search_engine'] = 'sphinx'
            app.logger.debug(f"Sphinx search results: {len(works)} works found")
            pagination = {
                'total': data.get('total', 0),
                'page': page,
                'limit': limit,
                'pages': (data.get('total', 0) + limit - 1) // limit,
                'hasNext': page * limit < data.get('total', 0),
                'hasPrev': page > 1
            }
        elif 'data' in search_results and isinstance(search_results['data'], list):
            works = search_results['data']
            pagination = search_results.get('pagination', {})
            meta = search_results.get('meta', {})
            if not meta.get('search_engine'):
                meta['search_engine'] = 'fulltext'
        else:
            works = []
            pagination = {'total': 0, 'page': 1, 'pages': 0}
            meta = {}
            app.logger.warning(f"Unexpected API response structure: {search_results}")
        
        if 'hasNext' in pagination and 'totalPages' not in pagination:
            total = pagination.get('total', 0)
            limit = pagination.get('limit', 20)
            current_page = pagination.get('page', 1)
            total_pages = (total + limit - 1) // limit if total > 0 else 1
            
            pagination['totalPages'] = total_pages
            pagination['hasNext'] = current_page < total_pages
            pagination['hasPrev'] = current_page > 1
        
        enriched_works = []
        for i, work in enumerate(works[:10]):
            detailed_work = api_request(f'/works/{work.get("id")}')
            if detailed_work and 'data' in detailed_work:
                enhanced_work = {**work, **detailed_work['data']}
                enhanced_work['quality_score'] = work.get('quality_score')
                enriched_works.append(enhanced_work)
            else:
                enriched_works.append(work)
        
        works = enriched_works + works[10:]
        
        if pagination:
            pagination['filtered_total'] = len(works)
    else:
        works = []
        pagination = {'total': 0, 'page': 1, 'totalPages': 0}
        meta = {}
    
    return render_template('pages/search-results.html', 
                         results=works,
                         pagination=pagination,
                         meta=meta,
                         search_params={
                             'query': query,
                             'title': title,
                             'author': author,
                             'venue': venue,
                             'year_from': year_from,
                             'year_to': year_to,
                             'type': work_type,
                             'language': language,
                             'peer_reviewed': peer_reviewed
                         },
                         query=search_query,
                         page=page,
                         limit=limit)

@app.route('/works/<work_id>')
def works_detail(work_id):
    """Display work details with enriched API data"""
    work_response = api_request(f'/works/{work_id}')
    
    if not work_response or 'data' not in work_response:
        return render_template('errors/404.html'), 404
    
    work = work_response['data']
    
    author_details = []
    affiliations_list = []
    
    if work.get('authors') and isinstance(work.get('authors'), list):
        for author in work['authors']:
            if isinstance(author, dict):
                author_info = {
                    'name': author.get('name', ''),
                    'role': author.get('role', 'AUTHOR'),
                    'orcid': author.get('orcid'),
                    'affiliation': author.get('affiliation'),
                    'person_id': author.get('person_id'),
                    'signature_id': None
                }
                
                author_details.append(author_info)
                
                if author.get('affiliation') and isinstance(author['affiliation'], dict) and author['affiliation'].get('name'):
                    affiliation_name = author['affiliation']['name']
                    if affiliation_name not in affiliations_list:
                        affiliations_list.append(affiliation_name)
    
    if work.get('publication'):
        work['publication_year'] = work['publication'].get('year')
    
    if work.get('work_type'):
        work['formatted_type'] = work.get('work_type', '').replace('_', ' ').title()
    elif work.get('type'):
        work['formatted_type'] = work.get('type', '').replace('_', ' ').title()
    else:
        work['formatted_type'] = 'Artigo'
    
    if work.get('doi') and work['doi'].startswith('10.'):
        work['doi_url'] = f"https://doi.org/{work['doi']}"
    elif work.get('temp_doi') and work['temp_doi'].startswith('10.'):
        work['doi_url'] = f"https://doi.org/{work['temp_doi']}"
    
    files_data = work.get('files', [])
    
    metrics_data = {}
    try:
        metrics_response = api_request(f'/works/{work_id}/metrics')
        if metrics_response and 'data' in metrics_response:
            metrics_data = metrics_response['data']
    except Exception as e:
        app.logger.warning(f"Could not fetch metrics for work {work_id}: {e}")
    
    references = []
    similar_works = []
    
    try:
        references_response = api_request(f'/works/{work_id}/references')
        if references_response and 'data' in references_response and references_response['data'].get('referenced_works'):
            referenced_works = references_response['data']['referenced_works'][:4]
            
            for ref in referenced_works:
                reference_work = {
                    'id': ref.get('cited_work_id'),
                    'title': ref.get('title', 'Título não disponível'),
                    'authors': [],
                    'year': ref.get('year'),
                    'type': ref.get('type', 'ARTICLE').lower()
                }
                references.append(reference_work)
    except Exception as e:
        app.logger.warning(f"Could not fetch references for work {work_id}: {e}")
    
    if not references:
        try:
            if work.get('title'):
                title_words = work['title'].split()[:3]
                if title_words:
                    search_query = ' '.join(title_words)
                    similar_response = api_request('/search/works', {'q': search_query, 'limit': 5})
                    if similar_response and 'data' in similar_response:
                        for similar in similar_response['data']:
                            if similar.get('id') != int(work_id):
                                similar_works.append(similar)
                        similar_works = similar_works[:4]
        except Exception as e:
            app.logger.warning(f"Could not fetch similar works for work {work_id}: {e}")
    
    related_works = references if references else similar_works
    
    return render_template('pages/works-detail.html', 
                         work=work,
                         venue_details=work.get('venue'),
                         author_details=author_details,
                         affiliations_list=affiliations_list,
                         similar_works=related_works,
                         references=references,
                         files_data=files_data,
                         metrics_data=metrics_data,
                         show_references=bool(references))

@app.route('/signatures/<signature_id>/works')
def signatures_works(signature_id):
    """Display works by signature"""
    try:
        signature_response = api_request(f'/signatures/{signature_id}')
        if not signature_response or 'data' not in signature_response:
            return render_template('errors/404.html'), 404
        
        signature = signature_response['data']
        signature_name = signature.get('signature', f'Signature {signature_id}')
        
        works_response = api_request(f'/signatures/{signature_id}/works')
        
        if not works_response or 'status' in works_response and works_response['status'] == 'error':
            search_params = {
                'q': f'"{signature_name}"',
                'limit': 25,
                'page': int(request.args.get('page', 1))
            }
            works_response = api_request('/search/works', search_params)
        
        works = []
        pagination = {}
        total = 0
        
        if works_response and 'data' in works_response:
            works = works_response['data']
            total = works_response.get('total', 0)
            pagination = works_response.get('pagination', {})
            
            for work in works:
                if 'authors' in work and isinstance(work['authors'], dict):
                    author_string = work['authors'].get('author_string', '')
                    if author_string:
                        author_names = [name.strip() for name in author_string.split(';') if name.strip()]
                        work['authors'] = [{'name': name} for name in author_names]
                    else:
                        work['authors'] = []
                elif not work.get('authors'):
                    work['authors'] = []
                
                if not work.get('title'):
                    work['title'] = 'Título não disponível'
        
        search_params = {'query': f"Obras de {signature_name}"}
        
        return render_template('pages/search-results.html',
                             results=works,
                             query=f"Obras de {signature_name}",
                             search_params=search_params,
                             total=total,
                             page=int(request.args.get('page', 1)),
                             pagination=pagination)
    
    except Exception as e:
        app.logger.error(f"Error in signatures_works: {e}")
        person_response = api_request(f'/persons/{signature_id}/works')
        if person_response and 'data' in person_response:
            works = person_response['data']
            for work in works:
                if 'authors' in work and isinstance(work['authors'], dict):
                    author_string = work['authors'].get('author_string', '')
                    if author_string:
                        author_names = [name.strip() for name in author_string.split(';') if name.strip()]
                        work['authors'] = [{'name': name} for name in author_names]
                    else:
                        work['authors'] = []
                elif not work.get('authors'):
                    work['authors'] = []
            
            return render_template('pages/search-results.html',
                                 results=works,
                                 query=f"Obras de Signature {signature_id}",
                                 search_params={'query': f"Signature {signature_id}"},
                                 total=len(works),
                                 page=1)
        
        return render_template('errors/500.html'), 500

@app.route('/lists')
def lists():
    """User lists page (using local storage)"""
    return render_template('pages/lists.html')

@app.route('/api/work/<int:work_id>/details')
def api_work_details(work_id):
    """Fetch complete work details for exports"""
    try:
        work_response = api_request(f'/works/{work_id}')
        if work_response and 'data' in work_response:
            return jsonify(work_response['data'])
        else:
            return jsonify({'error': 'Work not found'}), 404
            
    except Exception as e:
        app.logger.error(f"Error fetching work details: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/v1/works/batch')
def api_works_batch():
    """Batch fetch works by IDs for personal list functionality"""
    ids_param = request.args.get('ids', '')
    if not ids_param:
        return jsonify({'error': 'No IDs provided'}), 400
    
    try:
        work_ids = [id.strip() for id in ids_param.split(',') if id.strip()]
        if not work_ids:
            return jsonify({'error': 'No valid IDs provided'}), 400
        
        if len(work_ids) > 100:
            return jsonify({'error': 'Too many IDs requested (max 100)'}), 400
        
        works = []
        for work_id in work_ids:
            work_response = api_request(f'/works/{work_id}')
            if work_response and 'data' in work_response:
                work_data = work_response['data']
                
                formatted_work = {
                    'id': work_data.get('id'),
                    'title': work_data.get('title', ''),
                    'authors': [],
                    'publication_year': work_data.get('publication', {}).get('year') if work_data.get('publication') else work_data.get('year'),
                    'venue_name': work_data.get('venue', {}).get('name') if work_data.get('venue') else '',
                    'publisher_name': work_data.get('publisher', {}).get('name') if work_data.get('publisher') else '',
                    'work_type': work_data.get('work_type') or work_data.get('type', ''),
                    'doi': work_data.get('doi') or work_data.get('temp_doi'),
                    'abstract': work_data.get('abstract', ''),
                    'language': work_data.get('language', ''),
                    'venue': work_data.get('venue'),
                    'publisher': work_data.get('publisher'),
                    'publication': work_data.get('publication'),
                    'metrics': work_data.get('metrics'),
                    'identifiers': work_data.get('identifiers', [])
                }
                
                if work_data.get('authors') and isinstance(work_data.get('authors'), list):
                    for author in work_data['authors']:
                        if isinstance(author, dict):
                            formatted_work['authors'].append({
                                'full_name': author.get('name', ''),
                                'orcid': author.get('orcid'),
                                'person_id': author.get('person_id'),
                                'affiliation': author.get('affiliation')
                            })
                        else:
                            formatted_work['authors'].append({
                                'full_name': str(author),
                                'orcid': None,
                                'person_id': None,
                                'affiliation': None
                            })
                
                works.append(formatted_work)
        
        return jsonify({'works': works, 'total': len(works)})
    
    except Exception as e:
        app.logger.error(f"Error in works batch API: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/statistics')
def api_statistics():
    """Proxy for statistics API - used by templates"""
    stats = api_request('/metrics/annual')
    if stats:
        return jsonify(stats)
    else:
        return jsonify({
            'total_works': 399302,
            'total_authors': 25000,
            'total_venues': 1500,
            'year': 2025
        })

@app.route('/api/autocomplete')
def autocomplete():
    """Autocomplete suggestions for search"""
    query = request.args.get('q', '').strip()
    if not query or len(query) < 2:
        return jsonify({'suggestions': []})
    
    params = {
        'q': query,
        'type': request.args.get('type', 'all'),
        'limit': int(request.args.get('limit', 8))
    }
    
    result = api_request('/search/autocomplete', params)
    
    if result and 'data' in result:
        suggestions = []
        for suggestion in result['data']['suggestions']:
            suggestions.append({
                'text': suggestion['text'],
                'type': suggestion['type'],
                'preview': suggestion.get('preview', suggestion['text']),
                'work_count': suggestion.get('work_count')
            })
        return jsonify({'suggestions': suggestions})
    
    return jsonify({'suggestions': []})

@app.route('/work/<work_id>')
def work_detail_legacy(work_id):
    return redirect(url_for('works_detail', work_id=work_id))

@app.route('/author/<author_id>/works')
def author_works_legacy(author_id):
    return redirect(url_for('person_id_works', person_id=author_id))

@app.route('/ppgas/professors')
def ppgas_professors_legacy():
    return redirect(url_for('instructors_list'))

@app.route('/venue/<venue_id>')
def venue_detail_legacy(venue_id):
    return redirect(url_for('venues_detail', venue_id=venue_id))

@app.route('/organization/<org_id>')
def organization_detail_legacy(org_id):
    return redirect(url_for('organizations_detail', org_id=org_id))

@app.route('/journals-complete')
def journals_complete_legacy():
    return redirect(url_for('venues_complete'))

@app.route('/organizations-complete')
def organizations_complete_legacy():
    return redirect(url_for('organizations_complete'))

@app.route('/catalog')
def catalog_legacy():
    return redirect(url_for('works_list'))

@app.route('/journals')
def journals_legacy():
    return redirect(url_for('venues_list'))

@app.route('/course/<course_id>')
def course_detail_legacy(course_id):
    return redirect(url_for('courses_detail', course_id=course_id))

@app.route('/ppgas/course/<course_id>')
def ppgas_course_detail_legacy(course_id):
    return redirect(url_for('courses_ppgas_detail', course_id=course_id))

@app.route('/ppgas/courses')
def ppgas_courses_legacy():
    return redirect(url_for('courses_ppgas'))

@app.route('/instructors/<instructor_id>/statistics')
def instructor_statistics_legacy(instructor_id):
    return redirect(url_for('instructors_detail', instructor_id=instructor_id))

@app.route('/signature/<signature_id>/works')
def signature_works_legacy(signature_id):
    return redirect(url_for('signatures_works', signature_id=signature_id))

@app.route('/results')
def results_legacy():
    return redirect(url_for('search_results', **request.args))

@app.route('/advanced-search')
def advanced_search_legacy():
    return redirect(url_for('search_advanced'))

@app.route('/busca')
def search_page_legacy():
    return redirect(url_for('search_live', **request.args))

@app.route('/ppgas/professor/<professor_id>')
def ppgas_professor_detail_legacy(professor_id):
    return redirect(url_for('instructors_detail', instructor_id=professor_id))

@app.route('/license')
def license_page():
    """Página da licença MIT do projeto"""
    return render_template('pages/license.html')

@app.errorhandler(404)
def not_found(error):
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def server_error(error):
    return render_template('errors/500.html'), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)