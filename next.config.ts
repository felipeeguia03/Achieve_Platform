import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Track A: cero red, cero persistencia. No hay rewrites, proxies ni
  // orígenes de imagen remotos. Ver AGENTS.md §5.

  // ⚠️ **`AGENTS.md` es normativo en este repositorio, y no lo escribe una
  // herramienta.** Desde `next@16.3.4`, `next dev` inyecta un bloque de reglas
  // para agentes dentro de `AGENTS.md` cuando detecta un agente de IA — y lo
  // reescribe solo cada vez que Next cambia ese texto.
  //
  // Que el contenido de un archivo normativo pueda cambiar por una
  // actualización de dependencias, sin decisión humana, es exactamente lo que
  // este proyecto documenta para no permitir.
  //
  // `agentRules: false` es el opt-out oficial y declarativo: el gate está en
  // `server/lib/start-server.js` —`if (initResult.agentRules !== false)`— y con
  // esto `ensureAgentRulesForDev` no se llama nunca.
  //
  // Decisión del Product Owner, opción A del brief de ADR-008
  // ([`docs/brief-adr-008-seguridad.md`](docs/brief-adr-008-seguridad.md) §10.4.1).
  agentRules: false,
};

export default nextConfig;
