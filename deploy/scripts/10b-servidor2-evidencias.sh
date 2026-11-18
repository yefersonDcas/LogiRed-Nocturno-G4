#!/bin/bash
# PASO 10b · servidor2 · Evidencias del informe y pruebas integrales 3, 4, 7 y 8.
# OJO: apaga ms-conductores unos segundos (pruebas 8 y "gateway con servicio caído") y lo vuelve a encender.
# Uso:  sudo bash /vagrant/taller3/10b-servidor2-evidencias.sh
exec > /vagrant/taller3/logs/evidencia-servidor2.txt 2>&1
source /vagrant/taller3/secretos.txt
S1=172.16.0.178
D=app.logiredtech.co
C="curl -sS --resolve $D:443:127.0.0.1 --cacert /etc/ssl/certs/$D.crt"
t() { echo; echo "################ $1"; [ -n "$2" ] && echo "\$ $2"; }
token() { $C -X POST https://$D/api/usuarios/login -H 'Content-Type: application/json' -d "{\"email\":\"$1\",\"password\":\"$2\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'; }
corto() { sed -E 's/(eyJ[A-Za-z0-9_-]{10})[A-Za-z0-9._-]*/\1…/g'; }

t "Máquina" "hostname; hostname -I"; hostname; hostname -I
t "Node" "node -v"; node -v
for ms in ms-usuarios ms-clientes ms-envios ms-conductores; do
  t "systemctl status $ms" "systemctl status $ms --no-pager -n 0"; systemctl status $ms --no-pager -n 0 | head -6
done
t "Tabla de servicios" ""
printf "%-15s %-7s %-8s %-8s\n" servicio puerto activo enable
for x in ms-usuarios:3001 ms-clientes:3002 ms-envios:3003 ms-conductores:3004; do
  printf "%-15s %-7s %-8s %-8s\n" ${x%:*} ${x#*:} $(systemctl is-active ${x%:*}) $(systemctl is-enabled ${x%:*})
done
t "Archivo .service" "cat /etc/systemd/system/ms-conductores.service"; cat /etc/systemd/system/ms-conductores.service
t "Permisos del .env" "ls -l /srv/logired/app/ms-*/.env"; ls -l /srv/logired/app/ms-*/.env
t "Health de todos" "curl http://127.0.0.1:300X/health"
for p in 3001 3002 3003 3004; do echo -n "$p → "; curl -sS http://127.0.0.1:$p/health | tr -d '\n '; echo; done
t "Puertos" "sudo ss -tlnp | grep -E ':300|:80 |:443 '"; ss -tlnp | grep -E ':300[1-4]|:80 |:443 '
t "Firewall servidor2" "sudo ufw status numbered"; ufw status numbered
t "SELECT desde servidor2 a servidor1" ""
for x in conductores:$CONDUCTORES_DB_PASSWORD:conductores usuarios:$USUARIOS_DB_PASSWORD:usuarios clientes:$CLIENTES_DB_PASSWORD:clientes envios:$ENVIOS_DB_PASSWORD:envios; do
  IFS=: read b c tabla <<< "$x"
  echo "\$ mysql -h $S1 -u ${b}_user -p ${b}_db -e \"SELECT COUNT(*) FROM $tabla\""
  mysql -h $S1 -u ${b}_user -p"$c" ${b}_db -e "SELECT COUNT(*) AS registros FROM $tabla" 2>/dev/null
done
echo "\$ mysql -h $S1 -u envios_user -p clientes_db   (base ajena → debe fallar)"
mysql -h $S1 -u envios_user -p"$ENVIOS_DB_PASSWORD" clientes_db -e "SELECT 1" 2>&1 | grep -v Warning
t "Apache: sitios" "sudo apache2ctl -S"; apache2ctl -S 2>&1 | grep -E 'namevhost|default'
t "Apache: configtest" "sudo apache2ctl configtest"; apache2ctl configtest
t "Vhost HTTPS" "cat /etc/apache2/sites-available/zz-app-ssl.conf"; cat /etc/apache2/sites-available/zz-app-ssl.conf
t "Vhost HTTP" "cat /etc/apache2/sites-available/zz-app.conf"; cat /etc/apache2/sites-available/zz-app.conf 2>/dev/null || cat /etc/apache2/sites-available/app.conf

TA=$(token admin@empresa.com "$ADMIN_PASSWORD")
TD=$(token despacho@logiredtech.co "$DESPACHO_PASSWORD")
TF=$(token flota@logiredtech.co "$FLOTA_PASSWORD")
t "Rutas del gateway con token de administrador" ""
for r in usuarios clientes envios conductores; do $C -o /dev/null -w "GET https://$D/api/$r → %{http_code}\n" https://$D/api/$r -H "Authorization: Bearer $TA"; done
t "Prueba 3: sin token" "curl https://$D/api/conductores"; $C -w "\n→ %{http_code}\n" https://$D/api/conductores
t "Prueba 4: despacho intenta crear un conductor" "curl -X POST https://$D/api/conductores (token despacho)"
$C -w "\n→ %{http_code}\n" -X POST https://$D/api/conductores -H "Authorization: Bearer $TD" -H 'Content-Type: application/json' -d '{}'
t "Prueba 4b: flota intenta ver clientes" ""; $C -w "\n→ %{http_code}\n" https://$D/api/clientes -H "Authorization: Bearer $TF"
t "Cabeceras de seguridad" "curl -I https://$D/login.html"; $C -I https://$D/login.html | grep -iE '^HTTP|x-content|x-frame|content-security|referrer|powered'
t "HTTP redirige a HTTPS" "curl -I http://$D/"; curl -sS --resolve $D:80:127.0.0.1 -I http://$D/ | grep -iE '^HTTP|location'

t "Prueba 7: listar envíos → ms-envios hace UNA petición ?ids= a ms-conductores" "journalctl -u ms-conductores"
DESDE=$(date '+%Y-%m-%d %H:%M:%S'); sleep 1
$C https://$D/api/envios -H "Authorization: Bearer $TA" | head -c 700; echo
sleep 1; journalctl -u ms-conductores --since "$DESDE" --no-pager -o cat

t "Gateway con ms-conductores detenido" "sudo systemctl stop ms-conductores"
systemctl stop ms-conductores; sleep 1
$C -w "\n→ %{http_code}\n" https://$D/api/conductores -H "Authorization: Bearer $TA"
t "Prueba 8a: listar envíos con ms-conductores caído (no se cae, trae aviso)" ""
$C -w "\n→ %{http_code}\n" https://$D/api/envios -H "Authorization: Bearer $TA" | head -c 900; echo
t "Prueba 8b: crear envío con ms-conductores caído" ""
$C -w "\n→ %{http_code}\n" -X POST https://$D/api/envios -H "Authorization: Bearer $TA" -H 'Content-Type: application/json' \
  -d '{"cliente_id":1,"conductor_id":1,"peso_kg":2,"ciudad_destino":"Cali","direccion_destino":"Cl 5 # 1-10"}'
systemctl start ms-conductores; sleep 2
t "ms-conductores encendido otra vez" ""; systemctl is-active ms-conductores

t "app_ssl_access.log (últimas líneas)" "sudo tail -n 15 /var/log/apache2/app_ssl_access.log"; tail -n 15 /var/log/apache2/app_ssl_access.log | corto
echo; echo "FIN"
echo ">>> Listo: evidencias de servidor2 guardadas" > /dev/tty
