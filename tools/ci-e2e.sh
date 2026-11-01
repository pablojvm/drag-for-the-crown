#!/usr/bin/env bash
# Lanza una prueba en navegador en el CI. Si falla, deja el final de su salida como anotación del job
# (las anotaciones se ven en la página del workflow y en la API pública, sin descargar los logs).
# Uso: tools/ci-e2e.sh <nombre> <comando...>
name="$1"; shift
if ! curl -sf http://localhost:4173/ >/dev/null; then
  npx vite preview --port 4173 --strictPort >/dev/null 2>&1 &
  for i in $(seq 1 30); do curl -sf http://localhost:4173/ >/dev/null && break; sleep 2; done
fi
out=$(mktemp)
"$@" 2>&1 | tee "$out"
code=${PIPESTATUS[0]}
if [ "$code" != "0" ]; then
  msg=$(grep -v "^$" "$out" | tail -n 4 | tr '\n' ' ' | sed 's/%/%25/g' | cut -c1-900)
  echo "::error title=Prueba ${name}::${msg}"
fi
exit "$code"
