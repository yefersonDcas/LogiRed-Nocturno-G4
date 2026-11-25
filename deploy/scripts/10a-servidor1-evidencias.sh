#!/bin/bash
# PASO 10a · servidor1 · Junta las evidencias del informe (solo lectura)
# Uso:  sudo bash /vagrant/taller3/10a-servidor1-evidencias.sh
exec > /vagrant/taller3/logs/evidencia-servidor1.txt 2>&1
t() { echo; echo "################ $1"; echo "\$ $2"; }
t "Máquina" "hostname; hostname -I"; hostname; hostname -I
t "bind-address de MySQL" "grep bind-address /etc/mysql/mysql.conf.d/mysqld.cnf"; grep -n bind-address /etc/mysql/mysql.conf.d/mysqld.cnf
t "MySQL escuchando" "sudo ss -tlnp | grep 3306"; ss -tlnp | grep 3306
t "Firewall servidor1" "sudo ufw status numbered"; ufw status numbered
t "Bases de datos" "SHOW DATABASES LIKE '%_db'"; mysql -e "SHOW DATABASES LIKE '%\_db'"
t "Usuarios y desde dónde se conectan" "SELECT user, host FROM mysql.user WHERE user LIKE '%_user'"; mysql -e "SELECT user, host FROM mysql.user WHERE user LIKE '%\_user' ORDER BY user"
t "Permisos de conductores_user" "SHOW GRANTS FOR 'conductores_user'@'172.16.0.181'"; mysql -e "SHOW GRANTS FOR 'conductores_user'@'172.16.0.181'"
t "Zona DNS" "cat /etc/bind/db.logiredtech.co"; cat /etc/bind/db.logiredtech.co
t "Zona válida" "named-checkzone logiredtech.co /etc/bind/db.logiredtech.co"; named-checkzone logiredtech.co /etc/bind/db.logiredtech.co
t "Resolución" "dig +short app.logiredtech.co @127.0.0.1"; dig +short app.logiredtech.co @127.0.0.1
echo; echo "FIN"
echo ">>> Listo: evidencias de servidor1 guardadas" > /dev/tty
