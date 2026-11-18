#!/bin/bash
# =====================================================================
# PASO 3b · servidor1 · Corrige el error del paso 3:
#   - devuelve el SOA a ns1.logiredtech.co.
#   - sube el serial de verdad (2026100301 -> 2026111601, fecha de hoy + 01)
#   - deja el registro app como está
# Uso:  sudo bash /vagrant/taller3/3b-servidor1-dns-corregir.sh
# =====================================================================
set -e
exec > >(tee /vagrant/taller3/logs/paso3b-servidor1.log) 2>&1
ZONA=/etc/bind/db.logiredtech.co
cp $ZONA $ZONA.bak-taller3b

sed -i 's/SOA[[:space:]]\+ns2\.logiredtech\.co\./SOA     ns1.logiredtech.co./' $ZONA
python3 - "$ZONA" <<'PY'
import re, sys
ruta = sys.argv[1]; t = open(ruta).read()
# El serial es el primer número que aparece DESPUÉS del paréntesis "(" del SOA
i = t.index('(', t.index('SOA'))
m = re.search(r'\d+', t[i:])
viejo = int(m.group()); nuevo = max(viejo + 1, 2026111601)
t = t[:i + m.start()] + str(nuevo) + t[i + m.end():]
open(ruta, 'w').write(t); print(f">>> Serial: {viejo} -> {nuevo}")
PY
grep -qE '^app[[:space:]]' $ZONA || printf 'app\tIN\tA\t172.16.0.181\n' >> $ZONA

if ! named-checkzone logiredtech.co $ZONA; then
  echo "LA ZONA QUEDÓ MAL: se restaura"; cp $ZONA.bak-taller3b $ZONA; exit 1
fi
systemctl restart bind9
sleep 2
echo ">>> Zona corregida"; cat $ZONA
echo ">>> Prueba desde servidor1:"
dig +short @127.0.0.1 app.logiredtech.co
dig +short @172.16.0.178 app.logiredtech.co
dig +short @127.0.0.1 logiredtech.co SOA
echo ">>> PASO 3b TERMINADO"
