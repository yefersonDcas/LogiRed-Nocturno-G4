#!/bin/bash
# =====================================================================
# PASO 1 · servidor1 (SRVGestionPaquetes, 172.16.0.178)
# Taller 3 · Parte 2: MySQL en servidor1 + bases de datos de los microservicios
# Uso:  sudo bash /vagrant/taller3/1-servidor1-mysql.sh
# =====================================================================
set -e
exec > >(tee /vagrant/taller3/logs/paso1-servidor1.log) 2>&1
source /vagrant/taller3/secretos.txt
SERVIDOR2=172.16.0.181
SERVIDOR1=172.16.0.178

echo ">>> 2.1 Instalar MySQL Server"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mysql-server

echo ">>> 2.1 bind-address: MySQL escucha en 127.0.0.1 Y en la IP de servidor1"
# Por defecto solo escucha en 127.0.0.1 (nadie de afuera podría conectarse).
CNF=/etc/mysql/mysql.conf.d/mysqld.cnf
sed -i "s/^bind-address.*/bind-address            = 127.0.0.1,$SERVIDOR1/" $CNF
grep "^bind-address" $CNF
systemctl restart mysql

echo ">>> 2.1 ufw: el puerto 3306 SOLO se abre para servidor2"
ufw allow from $SERVIDOR2 to any port 3306 proto tcp
ufw status numbered
ss -tlnp | grep 3306

echo ">>> 2.2 Base y usuario de ms-conductores (MI microservicio)"
# El usuario es @'172.16.0.181': solo puede conectarse DESDE servidor2.
mysql <<SQL
CREATE DATABASE IF NOT EXISTS conductores_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'conductores_user'@'$SERVIDOR2' IDENTIFIED BY '$CONDUCTORES_DB_PASSWORD';
ALTER USER 'conductores_user'@'$SERVIDOR2' IDENTIFIED BY '$CONDUCTORES_DB_PASSWORD';
GRANT ALL PRIVILEGES ON conductores_db.* TO 'conductores_user'@'$SERVIDOR2';
SQL

echo ">>> 2.2 Base y usuario de ms-usuarios (le toca al integrador de datos; aquí lo hacemos para tener login)"
mysql <<SQL
CREATE DATABASE IF NOT EXISTS usuarios_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'usuarios_user'@'$SERVIDOR2' IDENTIFIED BY '$USUARIOS_DB_PASSWORD';
ALTER USER 'usuarios_user'@'$SERVIDOR2' IDENTIFIED BY '$USUARIOS_DB_PASSWORD';
GRANT ALL PRIVILEGES ON usuarios_db.* TO 'usuarios_user'@'$SERVIDOR2';
FLUSH PRIVILEGES;
SQL

echo ">>> Verificación: bases y usuarios creados"
mysql -e "SHOW DATABASES; SELECT user, host FROM mysql.user WHERE user LIKE '%\_user';"
echo ">>> PASO 1 TERMINADO"
