#!/bin/bash
# =====================================================================
# PASO 5 · servidor2 · Taller 3 · Parte 4 (final)
# A través del GATEWAY (app.logiredtech.co):
#   1. cambia la contraseña del administrador (PUT /api/usuarios/1)
#   2. crea un usuario de cada rol: despacho y flota (POST /api/usuarios)
# Uso:  sudo bash /vagrant/taller3/5-servidor2-usuarios.sh
# =====================================================================
exec > >(tee /vagrant/taller3/logs/paso5-servidor2.log) 2>&1
source /vagrant/taller3/secretos.txt
G="--resolve app.logiredtech.co:80:127.0.0.1"
API=http://app.logiredtech.co/api/usuarios
login() { curl -sS $G -X POST $API/login -H "Content-Type: application/json" \
  -d "{\"email\":\"$1\",\"password\":\"$2\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'; }

echo ">>> Login del administrador"
TOKEN=$(login admin@empresa.com 'Admin2026*')
if [ -z "$TOKEN" ]; then
  TOKEN=$(login admin@empresa.com "$ADMIN_PASSWORD")
  [ -n "$TOKEN" ] && echo "La contraseña del admin ya estaba cambiada" || { echo "NO SE PUDO HACER LOGIN"; exit 1; }
else
  echo ">>> 1. Cambiar la contraseña del administrador (PUT con el JSON completo + password)"
  curl -sS $G -X PUT $API/1 -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
    -d "{\"nombre\":\"Administrador General\",\"email\":\"admin@empresa.com\",\"rol\":\"administrador\",\"activo\":true,\"password\":\"$ADMIN_PASSWORD\"}" \
    -w "\n-> %{http_code}\n"
fi

echo ">>> 2. Crear un usuario de cada rol (201 la primera vez, 409 si ya existe)"
for u in "Usuario Despacho|despacho@logiredtech.co|despacho|$DESPACHO_PASSWORD" \
         "Usuario Flota|flota@logiredtech.co|flota|$FLOTA_PASSWORD"; do
  IFS='|' read -r NOMBRE EMAIL ROL CLAVE <<< "$u"
  curl -sS $G -X POST $API -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
    -d "{\"nombre\":\"$NOMBRE\",\"email\":\"$EMAIL\",\"rol\":\"$ROL\",\"password\":\"$CLAVE\"}" -w "\n-> %{http_code}\n"
done

echo ">>> Comprobación: login con cada usuario y prueba de permisos en conductores"
echo -n "admin con la clave vieja   -> "; [ -z "$(login admin@empresa.com 'Admin2026*')" ] && echo "rechazada (bien)" || echo "TODAVÍA SIRVE"
TA=$(login admin@empresa.com "$ADMIN_PASSWORD");          echo "admin    nueva clave -> $([ -n "$TA" ] && echo OK || echo FALLA)"
TD=$(login despacho@logiredtech.co "$DESPACHO_PASSWORD"); echo "despacho             -> $([ -n "$TD" ] && echo OK || echo FALLA)"
TF=$(login flota@logiredtech.co "$FLOTA_PASSWORD");       echo "flota                -> $([ -n "$TF" ] && echo OK || echo FALLA)"
C=http://app.logiredtech.co/api/conductores
CUERPO='{"nombre":"Prueba Gateway","cedula":"9988776655","categoria_licencia":"C1","telefono":"3001234567","sede":"Cali"}'
curl -sS $G -o /dev/null -w "GET  conductores despacho -> %{http_code} (esperado 200)\n" $C -H "Authorization: Bearer $TD"
curl -sS $G -o /dev/null -w "POST conductores despacho -> %{http_code} (esperado 403)\n" -X POST $C -H "Content-Type: application/json" -H "Authorization: Bearer $TD" -d "$CUERPO"
ID=$(curl -sS $G -X POST $C -H "Content-Type: application/json" -H "Authorization: Bearer $TF" -d "$CUERPO" | sed -n 's/.*"id": *\([0-9]*\).*/\1/p' | head -1)
echo "POST conductores flota    -> $([ -n "$ID" ] && echo "201, id $ID" || echo FALLA)"
[ -n "$ID" ] && curl -sS $G -o /dev/null -w "DELETE (limpieza) flota   -> %{http_code}\n" -X DELETE $C/$ID -H "Authorization: Bearer $TF"
echo ">>> PASO 5 TERMINADO"
