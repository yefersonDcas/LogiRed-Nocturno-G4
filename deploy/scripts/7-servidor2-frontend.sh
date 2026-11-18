#!/bin/bash
# =====================================================================
# PASO 7 · servidor2 · Publica el frontend en Apache (app.logiredtech.co)
# Copia taller3/frontend → /var/www/app (DocumentRoot del vhost app.conf)
# y quita la página de prueba del gateway.
# Uso:  sudo bash /vagrant/taller3/7-servidor2-frontend.sh
# =====================================================================
set -e
exec > >(tee /vagrant/taller3/logs/paso7-servidor2.log) 2>&1
ORIGEN=/vagrant/taller3/frontend
DESTINO=/var/www/app

echo ">>> Copiando el frontend a $DESTINO"
rm -f $DESTINO/index.html                     # la página "El gateway funciona…"
mkdir -p $DESTINO
cp -r $ORIGEN/. $DESTINO/
chown -R root:root $DESTINO                    # Apache solo lee, no puede modificar
find $DESTINO -type d -exec chmod 755 {} +
find $DESTINO -type f -exec chmod 644 {} +
ls -lR $DESTINO

echo ">>> Verificación por el gateway"
G="-k --resolve app.logiredtech.co:443:127.0.0.1"
for ruta in / /login.html /admin.html /envios.html /css/estilos.css /js/api.js; do
  curl -sS $G -o /dev/null -w "GET $ruta -> %{http_code} %{content_type}\n" https://app.logiredtech.co$ruta
done
curl -sS $G https://app.logiredtech.co/ | grep -o '<title>.*</title>'
echo ">>> PASO 7 TERMINADO · abre https://app.logiredtech.co en el navegador"
