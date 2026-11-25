#!/bin/bash
# PRUEBA 9 · después de "sudo reboot" en servidor2: ¿todo volvió solo?
exec > /vagrant/taller3/logs/evidencia-reinicio.txt 2>&1
echo "\$ uptime"; uptime
for ms in ms-usuarios ms-clientes ms-envios ms-conductores apache2; do printf "%-15s %s\n" $ms "$(systemctl is-active $ms)"; done
curl -sS -k --resolve app.logiredtech.co:443:127.0.0.1 -o /dev/null -w "https://app.logiredtech.co → %{http_code}\n" https://app.logiredtech.co/
echo ">>> Listo: prueba 9 guardada" > /dev/tty
