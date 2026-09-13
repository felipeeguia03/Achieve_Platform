/**
 * Modo Clase — la pantalla · [ADR-098](../docs/decisions.md#adr-098) y
 * [ADR-099](../docs/decisions.md#adr-099).
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { ModoClase, type ModoClaseProps } from "@/components/screens/modo-clase";
import { ctaRegistry, ctasVisibles } from "@/lib/navigation/cta-registry";
import { contexto, contextoVacio } from "@/lib/navigation/context";
import { migasDe } from "@/lib/navigation/migas";
import { nodos, superficieIds } from "@/lib/navigation/surfaces";
import { unidadesDeLaClase, type UnidadDeMateria } from "@/lib/domain/unidades-de-clase";
import type { ClaseProps } from "@/lib/domain/view-models";

const UNIDADES: UnidadDeMateria[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `u${n}`,
  numero: n,
  codigo: `U${n}`,
  nombre: `Tema ${n}`,
  estado: n === 2 ? "criterio_alcanzado" : n === 3 ? "enviada" : "sin_evidencia",
  minutos: 90,
}));

const CLASE: ClaseProps = {
  id: "cl-1",
  cursadaId: "cur-arq",
  materia: "ARQUITECTURA DE COMPUTADORAS I",
  estado: "ACTIVE",
  iniciadaEn: new Date(Date.now() - 43 * 60_000).toISOString(),
  terminadaEn: null,
  fecha: "jue 18 may",
  dia: "jueves 18/05",
  tipo: "PRACTICA",
  horario: { desde: "08:00", hasta: "10:00" },
  horarioEstimado: false,
  docente: null,
  pie: { comision: "B2", aula: "3.12", inscriptos: 48, simulado: true },
  unidades: unidadesDeLaClase(UNIDADES, [], ["u4"]),
  apuntes: [
    { id: "a-1", texto: "Registro de desplazamiento", segundos: 125, creadoEn: "2026-05-18T11:02:05Z", editadoEn: null },
  ],
  marcas: [
    { id: "m-2", tipo: "ASSESSMENT", segundos: 900, texto: "entra en el parcial", creadaEn: "2026-05-18T11:15:00Z" },
    { id: "m-1", tipo: "QUESTION", segundos: 120, texto: null, creadaEn: "2026-05-18T11:02:00Z" },
  ],
  resumen: { QUESTION: 1, IMPORTANT: 0, ASSESSMENT: 1, REVIEW: 0 },
  duracionMinutos: null,
  material: [
    { id: "mat-1", tipo: "ARCHIVO", titulo: "Guía TP3.pdf", url: null, mime: "application/pdf", bytes: 2_500_000, creadoEn: "x" },
    { id: "mat-2", tipo: "LINK", titulo: "Simulador", url: "https://ejemplo.edu/sim", mime: null, bytes: null, creadoEn: "x" },
  ],
  grabaciones: [
    {
      id: "g-1",
      duracion: 1800,
      inicioEnClase: 60,
      bytes: 7_000_000,
      mime: "audio/webm",
      creadaEn: "x",
      etiquetas: [
        { id: "e-1", texto: "Teoría", segundo: null },
        { id: "e-2", texto: "Ejercicio 3", segundo: 750 },
      ],
    },
  ],
};

function montar(over: Partial<ModoClaseProps> = {}, clase: Partial<ClaseProps> = {}) {
  const props: ModoClaseProps = {
    clase: { ...CLASE, ...clase },
    apuntes: { pendientes: [], onAnotar: vi.fn(), onEditar: vi.fn(), onBorrar: vi.fn(), onReintentar: vi.fn() },
    marcas: { pendientes: [], onMarcar: vi.fn(), onReintentar: vi.fn(), onDetalle: vi.fn() },
    grabadora: {
      estado: { tipo: "INACTIVA" },
      onGrabar: vi.fn(),
      onConfirmar: vi.fn(),
      onCancelar: vi.fn(),
      onEtiquetarMomento: vi.fn(),
      onDetener: vi.fn(),
      onReintentar: vi.fn(),
      onEscuchar: vi.fn(async () => null),
      onEtiquetar: vi.fn(),
      onQuitarEtiqueta: vi.fn(),
      onBorrar: vi.fn(),
    },
    material: { subidas: [], onSubir: vi.fn(), onLink: vi.fn(), onAbrir: vi.fn(), onBorrar: vi.fn(), onDescartar: vi.fn() },
    onFinalizar: vi.fn(),
    finalizando: false,
    errorAlFinalizar: false,
    recienGuardada: false,
    ...over,
  };
  return { props, ...render(<ModoClase {...props} />) };
}

describe("la cabecera", () => {
  it("dice la materia, el tipo de clase, el día y el horario", () => {
    montar();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Clase práctica");
    expect(screen.getByText("jueves 18/05 · 08:00–10:00")).toBeInTheDocument();
    expect(document.body).toHaveTextContent("Arquitectura de computadoras I");
  });

  it("sin tipo simulado, el título es «Clase» y no inventa uno", () => {
    montar({}, { tipo: null });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/^Clase$/);
  });

  it("una clase iniciada a mano no inventa horario", () => {
    montar({}, { horario: null, horarioEstimado: null });
    expect(screen.getByText("jueves 18/05 · Iniciada fuera de horario")).toBeInTheDocument();
  });

  it("un horario estimado se dice estimado", () => {
    montar({}, { horarioEstimado: true });
    expect(screen.getByText("Horario estimado por Achieve, no publicado por la facultad")).toBeInTheDocument();
  });
});

describe("los apuntes · ADR-099 §4", () => {
  it("Enter guarda la entrada y vacía la caja", () => {
    const { props } = montar();
    const caja = screen.getByRole("textbox", { name: "Apuntes" });
    fireEvent.change(caja, { target: { value: "Bus de datos" } });
    fireEvent.keyDown(caja, { key: "Enter" });
    expect(props.apuntes.onAnotar).toHaveBeenCalledWith("Bus de datos");
    expect(caja).toHaveValue("");
  });

  it("Shift+Enter no guarda: es un salto de línea", () => {
    const { props } = montar();
    const caja = screen.getByRole("textbox", { name: "Apuntes" });
    fireEvent.change(caja, { target: { value: "uno" } });
    fireEvent.keyDown(caja, { key: "Enter", shiftKey: true });
    expect(props.apuntes.onAnotar).not.toHaveBeenCalled();
  });

  it("Enter con la caja vacía no guarda nada", () => {
    const { props } = montar();
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Apuntes" }), { key: "Enter" });
    expect(props.apuntes.onAnotar).not.toHaveBeenCalled();
  });

  it("cada entrada muestra su momento; una escrita después dice «Después»", () => {
    montar({}, {
      apuntes: [
        { id: "a-1", texto: "en clase", segundos: 125, creadoEn: "x", editadoEn: null },
        { id: "a-2", texto: "en casa", segundos: null, creadoEn: "y", editadoEn: null },
      ],
    });
    expect(document.querySelector('[data-apunte="a-1"]')).toHaveTextContent("00:02:05");
    expect(document.querySelector('[data-apunte="a-2"]')).toHaveTextContent("Después");
  });

  it("una entrada se borra con confirmación, y va con su id", () => {
    const { props } = montar();
    const fila = document.querySelector('[data-apunte="a-1"]') as HTMLElement;
    fireEvent.click(within(fila).getByRole("button", { name: "Borrar apunte" }));
    expect(props.apuntes.onBorrar).not.toHaveBeenCalled();
    fireEvent.click(within(fila).getByRole("button", { name: "Sí, borrar" }));
    expect(props.apuntes.onBorrar).toHaveBeenCalledWith("a-1");
  });

  it("una entrada que no se guardó ofrece reintentar con su clave", () => {
    const { props } = montar({
      apuntes: { pendientes: [{ clave: "k-1", texto: "x", estado: "ERROR" }], onAnotar: vi.fn(), onEditar: vi.fn(), onBorrar: vi.fn(), onReintentar: vi.fn() },
    });
    fireEvent.click(screen.getByRole("button", { name: "No se guardó. Tocá para reintentar" }));
    expect(props.apuntes.onReintentar).toHaveBeenCalledWith("k-1");
  });

  it("siguen siendo editables con la clase terminada", () => {
    montar({}, { estado: "ENDED", terminadaEn: "2026-05-18T13:00:00Z", duracionMinutos: 107 });
    expect(screen.getByRole("textbox", { name: "Apuntes" })).not.toBeDisabled();
  });
});

describe("las marcas", () => {
  it("las cuatro están a un toque, y cada toque manda su tipo", () => {
    const { props } = montar();
    for (const nombre of ["No entendí", "Importante", "Posible evaluación", "Revisar"]) {
      expect(screen.getByRole("button", { name: nombre })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: "No entendí" }));
    fireEvent.click(screen.getByRole("button", { name: "Posible evaluación" }));
    expect(props.marcas.onMarcar).toHaveBeenNthCalledWith(1, "QUESTION");
    expect(props.marcas.onMarcar).toHaveBeenNthCalledWith(2, "ASSESSMENT");
  });

  it("los momentos van en el orden que recibe, y el texto se agrega después con su id", () => {
    const { container, props } = montar();
    const tipos = [...container.querySelectorAll("[data-momento]")].map((e) => e.getAttribute("data-momento"));
    expect(tipos).toEqual(["ASSESSMENT", "QUESTION"]);
    const momento = container.querySelector('[data-momento="QUESTION"]') as HTMLElement;
    fireEvent.click(within(momento).getByRole("button", { name: "Contá qué pasó" }));
    fireEvent.change(within(momento).getByRole("textbox"), { target: { value: "el jacobiano" } });
    fireEvent.click(within(momento).getByRole("button", { name: "Guardar" }));
    expect(props.marcas.onDetalle).toHaveBeenCalledWith("m-1", "el jacobiano");
  });

  it("una marca que no se guardó ofrece reintentar con su clave", () => {
    const { props } = montar({
      marcas: { pendientes: [{ clave: "k-9", tipo: "REVIEW", segundos: 30, estado: "ERROR" }], onMarcar: vi.fn(), onReintentar: vi.fn(), onDetalle: vi.fn() },
    });
    fireEvent.click(screen.getByRole("button", { name: "No se guardó. Tocá para reintentar" }));
    expect(props.marcas.onReintentar).toHaveBeenCalledWith("k-9");
  });
});

describe("la grabación · ADR-099 §2–§3", () => {
  it("*Grabar audio* no graba: pide, y la superficie decide si muestra el aviso", () => {
    const { props } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Grabar audio" }));
    expect(props.grabadora.onGrabar).toHaveBeenCalled();
    expect(props.grabadora.onConfirmar).not.toHaveBeenCalled();
  });

  it("el aviso pide permiso al docente, y sólo confirmarlo empieza", () => {
    const { props } = montar({ grabadora: { ...base().grabadora, estado: { tipo: "AVISO" } } });
    const aviso = screen.getByRole("alertdialog");
    expect(aviso).toHaveTextContent("Pedile permiso a tu docente");
    fireEvent.click(within(aviso).getByRole("button", { name: "Entendido, grabar" }));
    expect(props.grabadora.onConfirmar).toHaveBeenCalled();
  });

  it("grabando: se etiqueta el momento con una sugerencia y se detiene", () => {
    const { props } = montar({
      grabadora: { ...base().grabadora, estado: { tipo: "GRABANDO", desde: Date.now() - 5000, etiquetas: [] } },
    });
    fireEvent.click(screen.getByRole("button", { name: "Etiquetar este momento" }));
    fireEvent.click(within(document.querySelector("[data-grabando]") as HTMLElement).getByRole("button", { name: "Ejercicio" }));
    expect(props.grabadora.onEtiquetarMomento).toHaveBeenCalledWith("Ejercicio");
    fireEvent.click(screen.getByRole("button", { name: "Detener" }));
    expect(props.grabadora.onDetener).toHaveBeenCalled();
  });

  it("sin micrófono lo dice, y la clase sigue: marcas y apuntes están", () => {
    montar({ grabadora: { ...base().grabadora, estado: { tipo: "SIN_MICROFONO" } } });
    expect(screen.getByText("Este navegador no permite grabar audio. La clase sigue igual.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No entendí" })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "Apuntes" })).toBeEnabled();
  });

  it("con la clase terminada no se ofrece grabar", () => {
    montar({}, { estado: "ENDED", terminadaEn: "x", duracionMinutos: 5 });
    expect(screen.queryByRole("button", { name: "Grabar audio" })).toBeNull();
  });

  it("la grabación lista sus etiquetas; una se quita con su id", () => {
    const { props } = montar();
    const g = document.querySelector('[data-grabacion="g-1"]') as HTMLElement;
    expect(g).toHaveTextContent("Grabación 1");
    expect(g).toHaveTextContent("12:30");
    fireEvent.click(within(g).getByRole("button", { name: "Quitar etiqueta Ejercicio 3" }));
    expect(props.grabadora.onQuitarEtiqueta).toHaveBeenCalledWith("e-2");
  });

  it("borrar una grabación pide confirmación", () => {
    const { props } = montar();
    const g = document.querySelector('[data-grabacion="g-1"]') as HTMLElement;
    fireEvent.click(within(g).getByRole("button", { name: "Borrar grabación" }));
    fireEvent.click(within(g).getByRole("button", { name: "Sí, borrar" }));
    expect(props.grabadora.onBorrar).toHaveBeenCalledWith("g-1");
  });
});

describe("el material · ADR-099 §5", () => {
  it("lista archivos y links con su tipo y tamaño", () => {
    montar();
    expect(document.querySelector('[data-material-item="ARCHIVO"]')).toHaveTextContent("PDF · 2,4 MB");
    expect(document.querySelector('[data-material-item="LINK"]')).toHaveTextContent("ejemplo.edu");
  });

  it("un link se agrega con su título", () => {
    const { props } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Agregar link" }));
    fireEvent.change(screen.getByPlaceholderText("https://…"), { target: { value: "https://campus.edu/tp3" } });
    fireEvent.change(screen.getByPlaceholderText("Título (opcional)"), { target: { value: "Consigna" } });
    fireEvent.submit(document.querySelector("[data-formulario-link]") as HTMLFormElement);
    expect(props.material.onLink).toHaveBeenCalledWith("https://campus.edu/tp3", "Consigna");
  });

  it("un link que no es http(s) no sale, y lo dice", () => {
    const { props } = montar();
    fireEvent.click(screen.getByRole("button", { name: "Agregar link" }));
    fireEvent.change(screen.getByPlaceholderText("https://…"), { target: { value: "javascript:alert(1)" } });
    fireEvent.submit(document.querySelector("[data-formulario-link]") as HTMLFormElement);
    expect(props.material.onLink).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("http://");
  });

  it("elegir archivos los manda a subir", () => {
    const { props } = montar();
    const archivo = new File(["%PDF"], "guia.pdf", { type: "application/pdf" });
    fireEvent.change(document.querySelector("[data-selector-de-archivo]") as HTMLInputElement, { target: { files: [archivo] } });
    expect(props.material.onSubir).toHaveBeenCalledWith([archivo]);
  });
});

describe("las unidades y cómo venís · ADR-099 §8", () => {
  it("señala la unidad de esta clase y dice cuáles faltan, sin la que tiene criterio", () => {
    montar();
    const panel = document.querySelector('[data-panel="unidades"]') as HTMLElement;
    expect(within(panel).getByText("Unidad 5 · Tema 5")).toBeInTheDocument();
    expect(panel.querySelector("[data-como-venis]")).toHaveTextContent("Te faltan las unidades 1, 3 y 4");
    expect(panel).toHaveTextContent("Estimada por Achieve");
  });

  it("al día, lo dice", () => {
    const todas = UNIDADES.map((u) => ({ ...u, estado: "criterio_alcanzado" as const }));
    montar({}, { unidades: unidadesDeLaClase(todas, ["u3"], []) });
    const panel = document.querySelector('[data-panel="unidades"]') as HTMLElement;
    expect(panel.querySelector("[data-como-venis]")).toHaveTextContent("Venís al día con las unidades anteriores");
    expect(panel).toHaveTextContent("Según el libro de temas de esta fecha");
  });

  it("dice qué mide, y no usa las palabras que ADR-072 y ADR-075 prohíben", () => {
    montar();
    const panel = document.querySelector('[data-panel="unidades"]') as HTMLElement;
    expect(panel).toHaveTextContent("trabajo registrado, no comprensión");
    expect(panel.textContent).not.toMatch(/dominad|nivel|rendimiento/i);
  });

  it("sin temario, el panel no está", () => {
    montar({}, { unidades: null });
    expect(document.querySelector('[data-panel="unidades"]')).toBeNull();
  });
});

describe("la franja del pie · ADR-099 §6", () => {
  it("comisión, aula e inscriptos, con el rótulo de simulado", () => {
    montar();
    const pie = document.querySelector("[data-franja-de-clase]") as HTMLElement;
    expect(pie.querySelector('[data-dato-de-clase="comision"]')).toHaveTextContent("B2");
    expect(pie.querySelector('[data-dato-de-clase="aula"]')).toHaveTextContent("3.12");
    expect(pie.querySelector('[data-dato-de-clase="inscriptos"]')).toHaveTextContent("48");
    expect(pie.querySelector("[data-simulado]")).toHaveTextContent("Simulado");
  });

  it("cada dato que falta no se dibuja, y sin datos no hay franja", () => {
    montar({}, { pie: { comision: null, aula: "3.12", inscriptos: null, simulado: false } });
    expect(document.querySelector('[data-dato-de-clase="comision"]')).toBeNull();
    expect(document.querySelector("[data-simulado]")).toBeNull();
    montar({}, { pie: { comision: null, aula: null, inscriptos: null, simulado: false } });
    expect(document.querySelectorAll("[data-franja-de-clase]")).toHaveLength(1);
  });
});

describe("finalizar y lo que no se dice", () => {
  it("una sola CTA principal: Finalizar clase", () => {
    const { props, container } = montar();
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Finalizar clase" }));
    expect(props.onFinalizar).toHaveBeenCalled();
  });

  it("si no se pudo finalizar, dice que lo guardado está guardado", () => {
    montar({ errorAlFinalizar: true });
    expect(screen.getByText(/Tus apuntes y marcas están guardados/)).toHaveAttribute("role", "alert");
  });

  it("terminada: sin marcas ni CTA, con duración y conteo derivados", () => {
    const { container } = montar({}, { estado: "ENDED", terminadaEn: "2026-05-18T13:00:00Z", duracionMinutos: 107 });
    expect(screen.queryByRole("button", { name: "No entendí" })).toBeNull();
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(0);
    const resumen = container.querySelector("[data-resumen]") as HTMLElement;
    expect(resumen).toHaveTextContent("1 h 47 min");
    expect(resumen).toHaveTextContent("1 No entendí");
  });

  it("el acuse «Clase guardada» sólo aparece justo después de finalizar", () => {
    const terminada = { estado: "ENDED" as const, terminadaEn: "x", duracionMinutos: 5 };
    const { unmount } = montar({}, terminada);
    expect(screen.queryByText("Clase guardada")).toBeNull();
    unmount();
    montar({ recienGuardada: true }, terminada);
    expect(screen.getByText("Clase guardada")).toBeInTheDocument();
  });

  it("sin checkpoint ni vocabulario prohibido; «Parcial» no es un rótulo", () => {
    montar();
    const texto = document.body.textContent ?? "";
    expect(texto).not.toMatch(/c[oó]mo te qued|entend[ií] bien|estoy perdido/i);
    expect(texto).not.toMatch(/\bnotas?\b|modo estudio|transcrib[ií] (tu|la) clase/i);
    for (const boton of screen.getAllByRole("button")) expect(boton.textContent).not.toMatch(/parcial/i);
    // El texto que escribió el estudiante se muestra tal cual.
    expect(screen.getByText("entra en el parcial")).toBeInTheDocument();
  });
});

describe("el lugar de Modo Clase en la navegación", () => {
  it("`CLASE` tiene ruta y no es superficie: siguen siendo nueve", () => {
    expect(nodos.CLASE.ruta).toBe("/clase");
    expect(nodos.CLASE.wireframe).toBeNull();
    expect(superficieIds).toHaveLength(9);
    expect(superficieIds).not.toContain("CLASE");
  });

  it("`CTA-023` aparece sólo con la clase activa; deny-by-default", () => {
    expect(ctasVisibles("CLASE", contextoVacio)).toEqual([]);
    expect(ctasVisibles("CLASE", contexto({ claseActiva: true })).map((c) => c.id)).toEqual(["CTA-023"]);
  });

  it("`CTA-022` no aparece si hay otra clase activa de otra materia", () => {
    expect(ctasVisibles("UX02", contexto({ courseVisible: true })).map((c) => c.id)).not.toContain("CTA-022");
    expect(ctaRegistry["CTA-022"].destino).toBe("CLASE");
  });

  it("la miga: Materias › la materia (enlazada) › la clase — ADR-099 §9", () => {
    const migas = migasDe("CLASE", "Clase práctica jueves 18/05", {
      etiqueta: "ARQUITECTURA DE COMPUTADORAS I",
      href: "/materia?cursada=cur-arq",
    });
    expect(migas).toEqual([
      { etiqueta: "Materias", href: "/materias" },
      { etiqueta: "Arquitectura de computadoras I", href: "/materia?cursada=cur-arq" },
      { etiqueta: "Clase práctica jueves 18/05", href: null },
    ]);
  });

  it("las pantallas no piden nada a la red", () => {
    for (const archivo of ["components/screens/modo-clase.tsx", "components/screens/modo-clase/paneles.tsx"]) {
      const fuente = readFileSync(resolve(process.cwd(), archivo), "utf8");
      expect(fuente).not.toMatch(/fetch\(|enviar\(|pedir\(|localStorage|getUserMedia|MediaRecorder/);
    }
  });
});

/** Las props por defecto, para sobreescribir una parte. */
function base(): ModoClaseProps {
  const props: ModoClaseProps = {
    clase: CLASE,
    apuntes: { pendientes: [], onAnotar: vi.fn(), onEditar: vi.fn(), onBorrar: vi.fn(), onReintentar: vi.fn() },
    marcas: { pendientes: [], onMarcar: vi.fn(), onReintentar: vi.fn(), onDetalle: vi.fn() },
    grabadora: {
      estado: { tipo: "INACTIVA" },
      onGrabar: vi.fn(),
      onConfirmar: vi.fn(),
      onCancelar: vi.fn(),
      onEtiquetarMomento: vi.fn(),
      onDetener: vi.fn(),
      onReintentar: vi.fn(),
      onEscuchar: vi.fn(async () => null),
      onEtiquetar: vi.fn(),
      onQuitarEtiqueta: vi.fn(),
      onBorrar: vi.fn(),
    },
    material: { subidas: [], onSubir: vi.fn(), onLink: vi.fn(), onAbrir: vi.fn(), onBorrar: vi.fn(), onDescartar: vi.fn() },
    onFinalizar: vi.fn(),
    finalizando: false,
    errorAlFinalizar: false,
    recienGuardada: false,
  };
  return props;
}
