#!/bin/bash
# =====================================================================
# PASO 6a · servidor1 · Bases y usuarios de ms-clientes y ms-envios
# (mismo patrón del paso 1: usuario restringido a servidor2)
# Uso:  sudo bash /vagrant/taller3/6a-servidor1-bases-clientes-envios.sh
# =====================================================================
set -e
exec > >(tee /vagrant/taller3/logs/paso6a-servidor1.log) 2>&1
source /vagrant/taller3/secretos.txt
S2=172.16.0.181
for par in "clientes:$CLIENTES_DB_PASSWORD" "envios:$ENVIOS_DB_PASSWORD"; do
  N=${par%%:*}; C=${par#*:}
  echo ">>> ${N}_db y ${N}_user@'$S2'"
  mysql <<SQL
CREATE DATABASE IF NOT EXISTS ${N}_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${N}_user'@'$S2' IDENTIFIED BY '$C';
ALTER USER '${N}_user'@'$S2' IDENTIFIED BY '$C';
GRANT ALL PRIVILEGES ON ${N}_db.* TO '${N}_user'@'$S2';
SQL
done
mysql -e "FLUSH PRIVILEGES; SELECT user, host FROM mysql.user WHERE user LIKE '%\_user'; SHOW DATABASES LIKE '%\_db';"
echo ">>> PASO 6a TERMINADO"
