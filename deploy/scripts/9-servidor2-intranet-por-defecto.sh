#!/bin/bash
# =====================================================================
# PASO 9 · servidor2 · Devuelve a intranet el papel de sitio por defecto
# Apache usa como "por defecto" el PRIMER vhost (orden alfabético). Al
# crear app.conf, este quedó antes que intranet.logiredtech.conf y
# entrar por IP (http://172.16.0.181) caía en app. Se renombra a
# zz-app.conf para que cargue al final, igual que zz-app-ssl.conf.
# Uso:  sudo bash /vagrant/taller3/9-servidor2-intranet-por-defecto.sh
# =====================================================================
set -e
exec > >(tee /vagrant/taller3/logs/paso9-servidor2.log) 2>&1
cd /etc/apache2/sites-available
if [ -f app.conf ]; then
  a2dissite -q app
  mv app.conf zz-app.conf
  a2ensite -q zz-app
fi
apache2ctl configtest
systemctl reload apache2
cp zz-app.conf /vagrant/taller3/deploy/
echo ">>> Sitios del puerto 80 (el primero es el de por defecto)"
apache2ctl -S 2>&1 | grep -E 'default server|namevhost'
echo ">>> Pruebas"
curl -sS -o /dev/null -w "http://172.16.0.181 (por IP)   -> %{http_code}  %{redirect_url}\n" http://172.16.0.181/
curl -sS --resolve intranet.logiredtech.co:80:127.0.0.1 -o /dev/null -w "http://intranet.logiredtech.co  -> %{http_code}\n" http://intranet.logiredtech.co/
curl -sS --resolve app.logiredtech.co:80:127.0.0.1 -o /dev/null -w "http://app.logiredtech.co       -> %{http_code} %{redirect_url}\n" http://app.logiredtech.co/
curl -sS -k --resolve app.logiredtech.co:443:127.0.0.1 -o /dev/null -w "https://app.logiredtech.co      -> %{http_code}\n" https://app.logiredtech.co/
echo ">>> PASO 9 TERMINADO"
