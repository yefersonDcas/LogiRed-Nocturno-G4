#!/bin/bash
# =====================================================================
# PASO 2 · servidor2 (SRVBaseDatos, 172.16.0.181)
# Taller 3 · Parte 3: Node.js, código, usuario nodeapps y microservicios
# como servicios del sistema (systemd). Despliega ms-usuarios y ms-conductores.
# Uso:  sudo bash /vagrant/taller3/2-servidor2-microservicios.sh
# =====================================================================
set -e
exec > >(tee /vagrant/taller3/logs/paso2-servidor2.log) 2>&1
source /vagrant/taller3/secretos.txt
SERVIDOR1=172.16.0.178
APP=/srv/logired/app
REPO=https://github.com/yefersonDcas/LogiRed-Nocturno-G4.git
MI_RAMA='juan-santiago-gutierrez(ms-conductores)'

echo ">>> 3.1 Node.js 22 (el de Ubuntu es muy viejo para Express 5), git y cliente de MySQL"
if ! node -v 2>/dev/null | grep -q '^v2[2-9]'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
fi
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs git mysql-client
node -v

echo ">>> 3.1 Usuario de sistema nodeapps (sin privilegios, sin home) que va a correr los servicios"
id nodeapps >/dev/null 2>&1 || adduser --system --group --no-create-home nodeapps

echo ">>> 3.1 Traer el código desde GitHub a $APP"
mkdir -p $APP && chown vagrant:vagrant $APP
if [ ! -d $APP/.git ]; then sudo -u vagrant git clone $REPO $APP; else sudo -u vagrant git -C $APP pull; fi
# Mientras mi Pull Request no entra a main, tomo MI carpeta desde MI rama:
sudo -u vagrant git -C $APP fetch origin "refs/heads/$MI_RAMA"
sudo -u vagrant git -C $APP checkout FETCH_HEAD -- ms-conductores
sudo -u vagrant git -C $APP log --oneline -1

# ---------------------------------------------------------------------
# desplegar <carpeta> <puerto> <base> <usuario_db> <clave_db> <tabla>
# ---------------------------------------------------------------------
desplegar() {
  local MS=$1 PUERTO=$2 BASE=$3 USR=$4 CLAVE=$5 TABLA=$6
  echo; echo "=================== $MS (puerto $PUERTO) ==================="
  cd $APP/$MS

  echo ">>> 3.2 npm ci --omit=dev: instala EXACTAMENTE lo de package-lock.json, sin dependencias de desarrollo"
  sudo -u vagrant npm ci --omit=dev --no-audit --no-fund

  echo ">>> 3.2 .env de producción (el código NO cambia, solo el .env)"
  {
    echo "PORT=$PUERTO"
    echo "HOST=127.0.0.1"
    [ "$MS" = ms-usuarios ] && echo "ROLES=administrador,despacho,flota"
    echo "DB_HOST=$SERVIDOR1"
    echo "DB_PORT=3306"
    echo "DB_NAME=$BASE"
    echo "DB_USER=$USR"
    echo "DB_PASSWORD=$CLAVE"
    echo "JWT_SECRET=$JWT_SECRET"
    [ "$MS" = ms-usuarios ] && echo "JWT_EXPIRA=8h"
    true
  } > .env
  chown vagrant:nodeapps .env && chmod 640 .env     # solo el dueño y el grupo nodeapps lo leen
  ls -l .env

  echo ">>> 2.2 Crear la tabla en servidor1 DESDE servidor2 (prueba que el usuario quedó restringido bien)"
  if mysql -h $SERVIDOR1 -u $USR -p"$CLAVE" $BASE -e "SHOW TABLES LIKE '$TABLA'" | grep -q $TABLA; then
    echo "La tabla $TABLA ya existe: no se vuelve a crear"
  else
    mysql -h $SERVIDOR1 -u $USR -p"$CLAVE" $BASE < db/schema.sql
  fi
  mysql -h $SERVIDOR1 -u $USR -p"$CLAVE" $BASE -e "SELECT * FROM $TABLA" | cut -c1-110

  echo ">>> 3.3 Servicio systemd /etc/systemd/system/$MS.service"
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
  systemctl daemon-reload
  systemctl enable $MS
  systemctl restart $MS
  sleep 3
  systemctl --no-pager status $MS | head -12
  journalctl -u $MS -n 5 --no-pager
  echo ">>> /health de $MS:"; curl -sS http://127.0.0.1:$PUERTO/health; echo
}

desplegar ms-usuarios    3001 usuarios_db    usuarios_user    "$USUARIOS_DB_PASSWORD"    usuarios
desplegar ms-conductores 3004 conductores_db conductores_user "$CONDUCTORES_DB_PASSWORD" conductores

echo; echo ">>> Puertos de los microservicios (deben estar en 127.0.0.1, no en 0.0.0.0)"
ss -tlnp | grep ':300'

echo ">>> Prueba con token: login en ms-usuarios y GET a ms-conductores"
TOKEN=$(curl -sS -X POST http://127.0.0.1:3001/usuarios/login -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"Admin2026*"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
[ -n "$TOKEN" ] && echo "Login OK (token de ${#TOKEN} caracteres)" || echo "LOGIN FALLÓ"
curl -sS -o /dev/null -w "GET /conductores sin token  -> %{http_code}\n" http://127.0.0.1:3004/conductores
curl -sS -w "\nGET /conductores con token  -> %{http_code}\n" http://127.0.0.1:3004/conductores -H "Authorization: Bearer $TOKEN" | tail -c 400
echo ">>> ufw en servidor2 (NO deben aparecer 3001-3006)"; ufw status numbered
echo ">>> PASO 2 TERMINADO"
