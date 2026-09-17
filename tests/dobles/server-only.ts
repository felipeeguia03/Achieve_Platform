/**
 * Stub de `server-only` para los tests.
 *
 * El paquete real **lanza** cuando lo carga un bundle de cliente, que es
 * exactamente su valor: hace fallar el build si un componente de cliente
 * importa por error un módulo con secretos. Vitest corre en `jsdom`, así que
 * resuelve la versión de cliente y lanza aunque el test sea de servidor.
 *
 * Se stubea **sólo en tests**, y sin tocar el código de producción: quitar
 * `server-only` de los módulos para poder testearlos habría cambiado el código
 * para acomodar la herramienta, y perdido la garantía que da en el build.
 * `tests/frontera-backend.test.ts` verifica que la marca siga puesta.
 */
export {};
