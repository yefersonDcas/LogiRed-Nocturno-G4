#!/bin/bash
# =====================================================================
# PASO 8 · servidor2 · HTTPS para app.logiredtech.co
#  1. Certificado autofirmado para app.logiredtech.co (válido 1 año)
#  2. Vhost 443 con el frontend + gateway /api y cabeceras de seguridad
#  3. El vhost 80 ahora solo redirige a https://
#  4. ufw: deja entrar 443 desde la red de Windows (172.16.0.176/29)
# El sitio websegura NO se toca: el nuevo vhost se carga después de él.
# Uso:  sudo bash /vagrant/taller3/8-servidor2-https.sh
# =====================================================================
set -e
exec > >(tee /vagrant/taller3/logs/paso8-servidor2.log) 2>&1
DOM=app.logiredtech.co
CERT=/etc/ssl/certs/$DOM.crt
KEY=/etc/ssl/private/$DOM.key

echo ">>> 1. Certificado"
if [ ! -f $CERT ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout $KEY -out $CERT \
    -subj "/C=CO/ST=Valle del Cauca/L=Cali/O=LogiRed/CN=$DOM" \
    -addext "subjectAltName=DNS:$DOM"
fi
chmod 600 $KEY
cp $CERT /vagrant/taller3/$DOM.crt          # para que Windows lo marque como confiable
openssl x509 -in $CERT -noout -subject -dates

echo ">>> 2. Módulos"
a2enmod -q ssl headers proxy proxy_http

echo ">>> 3. Vhost HTTPS (zz-app-ssl.conf: carga después de websegura)"
IP443=$(grep -ohE '<VirtualHost [^>]*:443>' /etc/apache2/sites-enabled/websegura.conf | head -1 | sed 's/<VirtualHost //; s/>//')
IP443=${IP443:-*:443}
echo "    websegura usa $IP443 → app usa el mismo para compartir el puerto por nombre (SNI)"
cat > /etc/apache2/sites-available/zz-app-ssl.conf <<VH
<VirtualHost $IP443>
    ServerName $DOM
    DocumentRoot /var/www/app
    DirectoryIndex login.html

    SSLEngine on
    SSLCertificateFile    $CERT
    SSLCertificateKeyFile $KEY
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1

    # Cabeceras de seguridad
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set Referrer-Policy "no-referrer"
    Header always set Content-Security-Policy "default-src 'self'; frame-ancestors 'none'; form-action 'self'"
    Header always unset X-Powered-By
    Header unset X-Powered-By

    # Gateway: los microservicios solo escuchan en 127.0.0.1
    ProxyPass        /api/usuarios     http://127.0.0.1:3001/usuarios
    ProxyPassReverse /api/usuarios     http://127.0.0.1:3001/usuarios
    ProxyPass        /api/clientes     http://127.0.0.1:3002/clientes
    ProxyPassReverse /api/clientes     http://127.0.0.1:3002/clientes
    ProxyPass        /api/envios       http://127.0.0.1:3003/envios
    ProxyPassReverse /api/envios       http://127.0.0.1:3003/envios
    ProxyPass        /api/conductores  http://127.0.0.1:3004/conductores
    ProxyPassReverse /api/conductores  http://127.0.0.1:3004/conductores

    ErrorLog \${APACHE_LOG_DIR}/app_ssl_error.log
    CustomLog \${APACHE_LOG_DIR}/app_ssl_access.log combined
</VirtualHost>
VH

echo ">>> 4. El puerto 80 de app solo redirige a HTTPS"
cp /etc/apache2/sites-available/app.conf /vagrant/taller3/logs/app.conf.antes-https
cat > /etc/apache2/sites-available/app.conf <<VH
<VirtualHost *:80>
    ServerName $DOM
    Redirect permanent / https://$DOM/
    ErrorLog \${APACHE_LOG_DIR}/app_error.log
    CustomLog \${APACHE_LOG_DIR}/app_access.log combined
</VirtualHost>
VH
cp /etc/apache2/sites-available/app.conf /etc/apache2/sites-available/zz-app-ssl.conf /vagrant/taller3/deploy/

a2ensite -q zz-app-ssl
apache2ctl configtest
systemctl reload apache2

echo ">>> 5. Firewall: 443 desde la red del host Windows"
ufw allow from 172.16.0.176/29 to any port 443 proto tcp
ufw status numbered

echo ">>> 6. Pruebas"
apache2ctl -S 2>&1 | grep -E '443|80 '
R="--resolve $DOM:80:127.0.0.1 --resolve $DOM:443:127.0.0.1"
curl -sS $R -o /dev/null -w "http://  -> %{http_code} redirige a %{redirect_url}\n" http://$DOM/
curl -sS $R --cacert $CERT -o /dev/null -w "https:// -> %{http_code}\n" https://$DOM/
curl -sS $R --cacert $CERT -o /dev/null -w "https://.../api/conductores sin token -> %{http_code}\n" https://$DOM/api/conductores
echo "--- cabeceras ---"
curl -sS $R --cacert $CERT -I https://$DOM/login.html | grep -iE 'x-content|x-frame|content-security|referrer|strict'
echo ">>> PASO 8 TERMINADO"
