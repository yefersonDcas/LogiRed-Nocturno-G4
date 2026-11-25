#!/bin/bash
# =====================================================================
# PASO 4 · servidor2 (SRVBaseDatos) · Taller 3 · Parte 4.2
# API Gateway: host virtual app.logiredtech.co en Apache.
#   /            -> frontend en /var/www/app
#   /api/<recurso> -> proxy inverso a 127.0.0.1:300X (microservicio)
# Uso:  sudo bash /vagrant/taller3/4-servidor2-gateway.sh
# =====================================================================
set -e
exec > >(tee /vagrant/taller3/logs/paso4-servidor2.log) 2>&1

echo ">>> Módulos de proxy de Apache"
a2enmod proxy proxy_http

echo ">>> Carpeta del frontend"
mkdir -p /var/www/app
if [ ! -f /var/www/app/login.html ] && [ ! -f /var/www/app/index.html ]; then
  # Página provisional hasta que el grupo publique el frontend (Parte 5)
  cat > /var/www/app/index.html <<'HTML'
<!doctype html><html lang="es"><meta charset="utf-8"><title>LogiRed</title>
<body style="font-family:sans-serif;margin:40px"><h1>LogiRed · app.logiredtech.co</h1>
<p>El gateway funciona. El frontend se publica en la Parte 5.</p></body></html>
HTML
fi

echo ">>> /etc/apache2/sites-available/app.conf"
cat > /etc/apache2/sites-available/app.conf <<'CONF'
<VirtualHost *:80>
    ServerName app.logiredtech.co
    DocumentRoot /var/www/app
    # página que abre al entrar a http://app.logiredtech.co
    DirectoryIndex login.html index.html

    # API Gateway: /api/<recurso> se reenvía al microservicio correspondiente
    ProxyPass        /api/usuarios     http://127.0.0.1:3001/usuarios
    ProxyPassReverse /api/usuarios     http://127.0.0.1:3001/usuarios
    ProxyPass        /api/clientes     http://127.0.0.1:3002/clientes
    ProxyPassReverse /api/clientes     http://127.0.0.1:3002/clientes
    ProxyPass        /api/envios       http://127.0.0.1:3003/envios
    ProxyPassReverse /api/envios       http://127.0.0.1:3003/envios
    ProxyPass        /api/conductores  http://127.0.0.1:3004/conductores
    ProxyPassReverse /api/conductores  http://127.0.0.1:3004/conductores

    ErrorLog ${APACHE_LOG_DIR}/app_error.log
    CustomLog ${APACHE_LOG_DIR}/app_access.log combined
</VirtualHost>
CONF
cp /etc/apache2/sites-available/app.conf /vagrant/taller3/deploy/app.conf

a2ensite app.conf
apache2ctl configtest
systemctl reload apache2
apache2ctl -S 2>&1 | grep -i "namevhost"

echo ">>> Pruebas a través del gateway (con el nombre app.logiredtech.co)"
G="--resolve app.logiredtech.co:80:127.0.0.1"
curl -sS $G -o /dev/null -w "GET /                        -> %{http_code}\n" http://app.logiredtech.co/
curl -sS $G -o /dev/null -w "GET /api/conductores sin token -> %{http_code}\n" http://app.logiredtech.co/api/conductores
TOKEN=$(curl -sS $G -X POST http://app.logiredtech.co/api/usuarios/login -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"Admin2026*"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
[ -n "$TOKEN" ] && echo "Login por el gateway OK" || echo "LOGIN POR EL GATEWAY FALLÓ"
curl -sS $G -o /dev/null -w "GET /api/conductores con token -> %{http_code}\n" http://app.logiredtech.co/api/conductores -H "Authorization: Bearer $TOKEN"
curl -sS $G -o /dev/null -w "GET /api/clientes (no desplegado aún) -> %{http_code}\n" http://app.logiredtech.co/api/clientes -H "Authorization: Bearer $TOKEN"
echo ">>> Últimas líneas de app_access.log"; tail -5 /var/log/apache2/app_access.log
echo ">>> PASO 4 TERMINADO"
