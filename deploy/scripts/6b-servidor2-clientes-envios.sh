#!/bin/bash
# =====================================================================
# PASO 6b · servidor2 · Despliega ms-clientes (3002) y ms-envios (3003)
# como servicios systemd. ms-envios se despliega con la relación a
# conductores (el parche que se le pasó a Yeferson) para poder probarla.
# Uso:  sudo bash /vagrant/taller3/6b-servidor2-clientes-envios.sh
# =====================================================================
set -e
exec > >(tee /vagrant/taller3/logs/paso6b-servidor2.log) 2>&1
source /vagrant/taller3/secretos.txt
S1=172.16.0.178
APP=/srv/logired/app

echo ">>> Traer lo último de main"
sudo -u vagrant git -C $APP stash -q || true
sudo -u vagrant git -C $APP pull -q
sudo -u vagrant git -C $APP fetch -q origin 'refs/heads/juan-santiago-gutierrez(ms-conductores)'
sudo -u vagrant git -C $APP checkout FETCH_HEAD -- ms-conductores
sudo -u vagrant git -C $APP stash drop -q 2>/dev/null || true
if grep -q conductor_id $APP/ms-envios/src/models/envio.js; then
  echo ">>> ms-envios ya trae la relación con conductores"
else
  echo ">>> Aplicando a ms-envios la relación con conductores (parche)"
  sudo -u vagrant git -C $APP apply /vagrant/taller3/ms-envios-relacion-conductores.patch
fi

desplegar() {
  local MS=$1 PUERTO=$2 BASE=$3 USR=$4 CLAVE=$5 TABLA=$6 EXTRA=$7
  echo; echo "=================== $MS (puerto $PUERTO) ==================="
  cd $APP/$MS
  sudo -u vagrant npm ci --omit=dev --no-audit --no-fund
  printf "PORT=%s\nHOST=127.0.0.1\nDB_HOST=%s\nDB_PORT=3306\nDB_NAME=%s\nDB_USER=%s\nDB_PASSWORD=%s\nJWT_SECRET=%s\n%b" \
    "$PUERTO" "$S1" "$BASE" "$USR" "$CLAVE" "$JWT_SECRET" "$EXTRA" > .env
  chown vagrant:nodeapps .env && chmod 640 .env && ls -l .env
  if mysql -h $S1 -u $USR -p"$CLAVE" $BASE -e "SHOW TABLES LIKE '$TABLA'" 2>/dev/null | grep -q $TABLA; then
    echo "La tabla $TABLA ya existe"
  else
    mysql -h $S1 -u $USR -p"$CLAVE" $BASE < db/schema.sql
  fi
  mysql -h $S1 -u $USR -p"$CLAVE" $BASE -e "SELECT COUNT(*) AS registros FROM $TABLA" 2>/dev/null
  cat > /etc/systemd/system/$MS.service <<UNIT
[Unit]
Description=Microservicio ${MS#ms-} - LogiRed
After=network.target

[Service]
User=nodeapps
Group=nodeapps
WorkingDirectory=$APP/$MS
ExecStart=/usr/bin/node --env-file=.env src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
UNIT
  cp /etc/systemd/system/$MS.service /vagrant/taller3/deploy/
  systemctl daemon-reload && systemctl enable -q $MS && systemctl restart $MS
  sleep 3
  systemctl is-active $MS
  journalctl -u $MS -n 3 --no-pager
  curl -sS http://127.0.0.1:$PUERTO/health; echo
}

desplegar ms-clientes 3002 clientes_db clientes_user "$CLIENTES_DB_PASSWORD" clientes ""
# Envíos necesita además las direcciones de los servicios que consulta
mysql -h $S1 -u envios_user -p"$ENVIOS_DB_PASSWORD" envios_db -e "SHOW TABLES LIKE 'envios'" 2>/dev/null | grep -q envios && \
  mysql -h $S1 -u envios_user -p"$ENVIOS_DB_PASSWORD" envios_db -e \
  "ALTER TABLE envios ADD COLUMN IF NOT EXISTS conductor_id BIGINT UNSIGNED NULL AFTER cliente_id" 2>/dev/null || true
desplegar ms-envios 3003 envios_db envios_user "$ENVIOS_DB_PASSWORD" envios \
  "CLIENTES_URL=http://127.0.0.1:3002\nCONDUCTORES_URL=http://127.0.0.1:3004\n"

echo; echo ">>> Los 4 microservicios"
for s in ms-usuarios ms-clientes ms-envios ms-conductores; do printf "%-15s %s\n" $s "$(systemctl is-active $s)"; done
ss -tlnp | grep ':300'

echo ">>> Prueba por el gateway: crear un envío con cliente 1 y conductor 1"
G="--resolve app.logiredtech.co:80:127.0.0.1"
TOKEN=$(curl -sS $G -X POST http://app.logiredtech.co/api/usuarios/login -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@empresa.com\",\"password\":\"$ADMIN_PASSWORD\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
curl -sS $G -o /dev/null -w "GET /api/clientes -> %{http_code}\n" http://app.logiredtech.co/api/clientes -H "Authorization: Bearer $TOKEN"
curl -sS $G -X POST http://app.logiredtech.co/api/envios -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"cliente_id":1,"conductor_id":1,"peso_kg":3.5,"ciudad_destino":"Cali","direccion_destino":"Cra 5 # 10-20"}' -w "\n-> %{http_code}\n"
curl -sS $G -o /dev/null -w "GET /api/envios -> %{http_code}\n" http://app.logiredtech.co/api/envios -H "Authorization: Bearer $TOKEN"
echo ">>> PASO 6b TERMINADO"
