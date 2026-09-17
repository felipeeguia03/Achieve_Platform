# Onboarding académico — período, comisión, horarios, analítico y perfil

**Documento:** `docs/onboarding-academico.md`
**Decisiones:** [ADR-105](decisions.md#adr-105), [ADR-106](decisions.md#adr-106),
[ADR-107](decisions.md#adr-107) · [fuente literal](respuesta-po-onboarding-academico-source.md)
**Construye además:** [ADR-061](decisions.md#adr-061) corte 2, [ADR-062](decisions.md#adr-062) y
[ADR-063](decisions.md#adr-063) (cortes 3 y 4 de
[`plan-periodo-comision-horarios.md`](plan-periodo-comision-horarios.md)).
**Estado:** construido el 13–14 de septiembre de 2026 · **sólo datos sintéticos** —
[ADR-006](decisions.md#adr-006) sigue siendo bloqueo absoluto.

---

## 1. Qué quedó, en una tabla

| Pieza | Dónde | Qué hace | Qué **no** hace |
|---|---|---|---|
| **Período** | `/alta/carrera` | Pregunta año lectivo y semestre, sin preselección | Inferirlo del mes (`periodoDeCursado()` ya no existe) |
| **Materias por período** | `/alta/materias` | Las del semestre, las anuales aparte, la salida a otros | Ocultar las que no declaran período |
| **Comisión y horarios** | `/alta/cursada`, cuarto de cinco pasos | Comisión real · *No sé* · *No aparece* · *No tiene*; horario de la comisión · propio · *Todavía no sé* | Elegir la primera comisión; crear `class_session`; tocar `availability`; mudar la cursada de offering |
| **Precedencia de bloques** | `bloques_de_cursada()` | Una sola regla para Hoy, Materias, Calendario, Modo Clase, `UX02` y el compromiso | Mostrar el horario de la materia a quien dijo *no sé mi comisión* |
| **Analítico** | `/recorrido`, opcional, después de HOY | Consentimiento, subida validada por bytes, extracción sintética, vínculo con **su** plan, revisión de lo ambiguo, borrado | Crear o sugerir una cursada; procesar un documento real; llamar a un proveedor externo |
| **Preguntas** | `/recorrido` | 3 (máx. 5) deterministas desde el analítico, todas salteables | Preguntar sin evidencia; hacer sólo preguntas de dificultad |
| **Perfil** | `/recorrido` | Hipótesis aparte de la respuesta, «nos contaste…», *Esto no me representa* | Etiquetar; afirmar causas; alimentar al ADE, Hoy o el riesgo |

## 2. El recorrido completo

```
/login → /alta/whatsapp → /alta/carrera (+ año lectivo y semestre)
       → /alta/materias (por período) → /alta/cursada (comisión y horario)
       → /alta/disponibilidad → /hoy

/recorrido (cuando quiera):
  consentimiento → subir o «Todavía no tengo mi analítico»
  → procesado o fallido (sin guardar el archivo) → revisar lo ambiguo
  → confirmar → preguntas (responder · no sé · prefiero no · saltear)
  → «Esto es lo que entendimos hasta ahora» → «Esto no me representa»
```

## 3. Modelo de datos

| Qué | Tabla / columna | Nota |
|---|---|---|
| Estado de la comisión | `course_enrollment.commission_status` | `NULL` = no se preguntó ≠ `NOT_APPLICABLE` |
| Comisión elegida | `course_enrollment.commission_offering_id` | **Al lado** de `offering_id` (ADR-105 §4) |
| Nombre escrito | `course_enrollment.commission_label` | Sólo con `NOT_LISTED` |
| Estado del horario | `course_enrollment.schedule_status` | `KNOWN` · `UNKNOWN`; llegó **con su escritor** |
| Paso contestado | `enrollment.course_setup_declared_at` | *No sé* cuenta |
| Consentimiento | `academic_record_consent` | Append-only, sin `UPDATE` |
| Documento | `academic_document` | Hash, tipo real; **sólo lo procesado guarda archivo** |
| Resultado | `academic_record_entry` | Crudo inmutable + interpretado + vínculo + revisión; `student`/`unverified` por `CHECK` |
| Respuesta | `profile_answer` | Append-only, pregunta congelada, texto libre privado |
| Hipótesis | `profile_hypothesis` | `BAJA`/`MEDIA`; vigencia **deducida** |

## 4. Cómo se prueba a mano

```bash
node scripts/simular-comisiones.mjs --aplicar   # comisiones A y B sobre horarios simulados
```

1. `estudiante.nuevo@achieve.local` / `achieve-demo-alta`: el alta de cinco pasos.
2. `estudiante.ucc@achieve.local` / `achieve-demo-ucc`: `/alta/cursada` con 9 materias y comisiones.
3. Con `MODO_PRUEBA=1`, en `/recorrido`: *Usar un analítico sintético* genera uno sobre el plan del
   estudiante con recuperación, persistencia, una fila ilegible, una materia actual con un intento
   previo y una materia de otro plan.

Contra Postgres: `scripts/db-superficies.sh` (se puede correr solo; sólo toca su propio mundo).

## 5. Lo que sigue abierto

| # | Qué | Quién | Por qué importa |
|---|---|---|---|
| 19 | ¿Cambiar de comisión **después** del alta es un hecho con evento? | Product Owner | Hoy sólo se contesta en el alta; no hay pantalla para cambiarla |
| 20 | ¿El semestre entra en la clave de `enrollment`? | Product Owner | Reinscribirse en otro semestre del mismo año |
| 21 | ¿El ADE consume hipótesis del perfil, y cuáles? | Product Owner + psicopedagoga | El seam existe sin llamadores |
| 22 | ¿Qué comportamiento refuerza o debilita una hipótesis? | Product Owner + psicopedagoga | Hoy nada la actualiza (ADR-107 §7) |
| — | Corregir un horario o una clase excepcional después del alta | Product Owner | Segunda salida de ADR-064; no hay entidad de excepción |
| — | Extracción real (OCR/PDF de universidad) y proveedor | Legal + CTO | ADR-006, ADR-080; hoy `EXTRACCION_NO_DISPONIBLE` |
| — | Comisiones y horarios institucionales reales | Institución | Hoy son simulados y rotulados |
| — | Electiva pendiente (`PENDING_SELECTION`) | — | ADR-065, corte 6 del plan: **no se construyó** en esta tanda |
| — | Mudar la cursada de offering con el temario en la materia | — | ADR-060, corte 7 del plan |
