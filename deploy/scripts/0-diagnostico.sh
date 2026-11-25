#!/bin/bash
# =====================================================================
# 0-diagnostico.sh — solo MIRA, no cambia nada.
# Revisa qué tiene instalado esta máquina y lo guarda en
# /vagrant/taller3/logs/diag-<nombre-de-la-maquina>.txt
# Uso:  sudo bash /vagrant/taller3/0-diagnostico.sh
# =====================================================================
SALIDA=/vagrant/taller3/logs/diag-$(hostname).txt
{
echo "### Máquina: $(hostname)   Fecha: $(date)"
echo "### IPs";            ip -4 -br addr
echo "### Sistema";        lsb_release -ds 2>/dev/null
echo "### Firewall (ufw)"; ufw status numbered
echo "### Puertos escuchando"; ss -tlnp
echo "### Servicios";      for s in bind9 named squid apache2 mysql; do printf "%-8s %s\n" "$s" "$(systemctl is-active $s 2>/dev/null)"; done
echo "### DNS: zonas";     grep -A3 "^zone" /etc/bind/named.conf.local 2>/dev/null
echo "### DNS: archivos";  ls -la /etc/bind 2>/dev/null
echo "### Apache: sitios"; ls /etc/apache2/sites-enabled 2>/dev/null; apache2ctl -S 2>/dev/null | head -20
echo "### Node";           node -v 2>/dev/null || echo "sin node"
echo "### MySQL";          mysql --version 2>/dev/null || echo "sin mysql"
echo "### git";            git --version 2>/dev/null || echo "sin git"
echo "### /srv";           ls -la /srv 2>/dev/null
echo "### Internet";       curl -sS -m 8 -o /dev/null -w "github %{http_code}\n" https://github.com || echo "sin salida a internet"
echo "### Proxy";          env | grep -i proxy; cat /etc/apt/apt.conf.d/*proxy* 2>/dev/null
} > "$SALIDA" 2>&1
echo "Listo. Resultado guardado en $SALIDA"
