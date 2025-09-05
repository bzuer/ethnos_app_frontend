#!/bin/bash

# Script de Backup do Projeto site_v2
# Respeita regras do .gitignore e cria backup completo
# Destino: /home/server/backup/

set -e

PROJECT_DIR="/home/server/site_v2"
BACKUP_BASE_DIR="/home/server/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="site_v2_backup_${TIMESTAMP}"
BACKUP_DIR="${BACKUP_BASE_DIR}/${BACKUP_NAME}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Script de Backup site_v2 ===${NC}"
echo -e "${YELLOW}Timestamp: ${TIMESTAMP}${NC}"
echo -e "${YELLOW}Origem: ${PROJECT_DIR}${NC}"
echo -e "${YELLOW}Destino: ${BACKUP_DIR}${NC}"
echo

# Verificar se diretório de origem existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}ERRO: Diretório de origem não encontrado: $PROJECT_DIR${NC}"
    exit 1
fi

# Criar diretório de backup base se não existir
if [ ! -d "$BACKUP_BASE_DIR" ]; then
    echo -e "${YELLOW}Criando diretório de backup base: $BACKUP_BASE_DIR${NC}"
    mkdir -p "$BACKUP_BASE_DIR"
fi

# Criar diretório específico do backup
echo -e "${BLUE}Criando diretório de backup: $BACKUP_NAME${NC}"
mkdir -p "$BACKUP_DIR"

# Navegar para o diretório do projeto
cd "$PROJECT_DIR"

# Usar rsync com exclusões baseadas no .gitignore
echo -e "${BLUE}Iniciando backup com rsync...${NC}"

# Criar arquivo temporário com exclusões do .gitignore
TEMP_EXCLUDE=$(mktemp)

# Processar .gitignore para formato rsync
if [ -f ".gitignore" ]; then
    # Converter padrões do .gitignore para rsync
    grep -v '^#' .gitignore | grep -v '^$' | while IFS= read -r line; do
        # Remover comentários inline
        line=$(echo "$line" | sed 's/#.*//')
        # Remover espaços em branco
        line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        if [ -n "$line" ]; then
            # Se linha começa com !, não excluir (negação)
            if [[ "$line" =~ ^! ]]; then
                # Remover ! e adicionar como inclusão (rsync usa + para incluir)
                pattern=$(echo "$line" | sed 's/^!//')
                echo "$pattern" >> "$TEMP_EXCLUDE"
            else
                echo "$line" >> "$TEMP_EXCLUDE"
            fi
        fi
    done < .gitignore
fi

# Adicionar exclusões específicas sempre ignoradas
cat >> "$TEMP_EXCLUDE" << EOF
.git/
.git
node_modules/
node_modules
venv/
venv
__pycache__/
__pycache__
*.pyc
*.pyo
*.log
.DS_Store
Thumbs.db
.env
.env.local
EOF

echo -e "${YELLOW}Exclusões aplicadas:${NC}"
cat "$TEMP_EXCLUDE"
echo

# Executar rsync com exclusões
rsync -av \
    --exclude-from="$TEMP_EXCLUDE" \
    --progress \
    "$PROJECT_DIR/" \
    "$BACKUP_DIR/"

# Limpar arquivo temporário
rm -f "$TEMP_EXCLUDE"

# Criar arquivo de informações do backup
cat > "$BACKUP_DIR/BACKUP_INFO.txt" << EOF
=== INFORMAÇÕES DO BACKUP ===
Data/Hora: $(date)
Origem: $PROJECT_DIR
Destino: $BACKUP_DIR
Script: $0
Usuário: $(whoami)
Hostname: $(hostname)

=== ESTATÍSTICAS ===
Total de arquivos: $(find "$BACKUP_DIR" -type f | wc -l)
Total de diretórios: $(find "$BACKUP_DIR" -type d | wc -l)
Tamanho total: $(du -sh "$BACKUP_DIR" | cut -f1)

=== ESTRUTURA PRINCIPAL ===
$(ls -la "$BACKUP_DIR")
EOF

# Estatísticas finais
TOTAL_FILES=$(find "$BACKUP_DIR" -type f | wc -l)
TOTAL_DIRS=$(find "$BACKUP_DIR" -type d | wc -l)
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo
echo -e "${GREEN}=== BACKUP CONCLUÍDO COM SUCESSO ===${NC}"
echo -e "${GREEN}Localização: ${BACKUP_DIR}${NC}"
echo -e "${GREEN}Total de arquivos: ${TOTAL_FILES}${NC}"
echo -e "${GREEN}Total de diretórios: ${TOTAL_DIRS}${NC}"
echo -e "${GREEN}Tamanho total: ${BACKUP_SIZE}${NC}"
echo

# Listar backups existentes
echo -e "${BLUE}=== BACKUPS EXISTENTES ===${NC}"
ls -la "$BACKUP_BASE_DIR" | grep "site_v2_backup_"
echo

# Opcional: Compactar o backup
read -p "Deseja compactar o backup? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Compactando backup...${NC}"
    cd "$BACKUP_BASE_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    
    COMPRESSED_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
    echo -e "${GREEN}Backup compactado: ${BACKUP_NAME}.tar.gz (${COMPRESSED_SIZE})${NC}"
    
    read -p "Deseja remover o diretório não compactado? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$BACKUP_NAME"
        echo -e "${GREEN}Diretório não compactado removido${NC}"
    fi
fi

echo -e "${GREEN}Script de backup finalizado!${NC}"