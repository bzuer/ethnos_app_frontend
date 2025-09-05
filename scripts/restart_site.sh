#!/bin/bash

set -e

MODE=${1:-dev}
if [ "$MODE" = "prod" ]; then
    FLASK_ENV="production"
    PORT=8888
    echo "Reiniciando site em PRODUCAO (porta $PORT)..."
else
    FLASK_ENV="development"
    PORT=8000
    echo "Reiniciando site em DESENVOLVIMENTO..."
fi

echo "Parando processos existentes..."
pkill -f "python.*app\.py" 2>/dev/null || true
pkill -f "gunicorn.*app:app" 2>/dev/null || true
sleep 2

RUNNING=$(ps aux | grep -E "(python.*app\.py|gunicorn.*app:app)" | grep -v grep | wc -l)
if [ "$RUNNING" -gt 0 ]; then
    echo "Forcando parada de processos..."
    pkill -9 -f "python.*app\.py" 2>/dev/null || true
    pkill -9 -f "gunicorn.*app:app" 2>/dev/null || true
    sleep 2
fi

cd /home/server/site_v2

echo "Ativando ambiente virtual..."
source venv/bin/activate

echo "Configurando variaveis..."
export FLASK_ENV=$FLASK_ENV
export API_BASE_URL=http://localhost:3000
export PORT=$PORT

echo "Verificando dependencias..."
pip install -q -r requirements.txt

if [ "$MODE" = "prod" ]; then
    echo "Iniciando servidor Gunicorn na porta $PORT..."
    venv/bin/gunicorn --bind 0.0.0.0:$PORT --workers 4 --daemon --pid /tmp/antropoteca_new.pid --access-logfile /tmp/antropoteca_new-access.log --error-logfile /tmp/antropoteca_new-error.log app:app
else
    echo "Iniciando servidor Flask na porta $PORT..."
    python app.py &
fi

sleep 3

if curl -s http://127.0.0.1:$PORT/ > /dev/null; then
    echo "Site iniciado com sucesso!"
    echo "Acesse: http://127.0.0.1:$PORT/"
    if [ "$MODE" = "prod" ]; then
        echo "Processo PID: $(cat /tmp/antropoteca_new.pid 2>/dev/null || echo 'N/A')"
        echo "Logs: /tmp/antropoteca_new-access.log | /tmp/antropoteca_new-error.log"
    else
        echo "Processo PID: $(pgrep -f 'python.*app\.py')"
    fi
else
    echo "Erro ao iniciar o site"
    exit 1
fi