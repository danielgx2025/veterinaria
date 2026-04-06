# Plan de Marketing — Clínica Veterinaria VetSystem

Estrategia basada en el skill `marketing-ideas` — 7 ideas prioritarias
adaptadas al contexto específico de una clínica veterinaria.

---

## Contexto del negocio

- **Tipo:** Clínica veterinaria física + software de gestión
- **Audiencia:** Dueños de mascotas (B2C) + clínicas veterinarias (B2B para el software)
- **Etapa:** Early stage — foco en adquisición local y retención
- **Ventaja única:** Dueños de mascotas son altamente emocionales con sus animales → alto LTV, alta disposición a recomendar

---

## Idea #1: Google Business Profile (alta prioridad)

**Por qué encaja:** El 46% de las búsquedas en Google son locales. "Veterinaria cerca de mí" tiene altísima intención.

**Cómo empezar:**
1. Reclamar y verificar perfil en Google Business
2. Completar al 100%: horarios, fotos (mínimo 15), descripción con keywords
3. Activar mensajes directos y respuestas a preguntas
4. Configurar botón "Reservar cita" conectado a `/citas/`

**Éxito:** Aparecer en el Local Pack (3 resultados con mapa) para búsquedas de veterinaria en la zona. Objetivo: 50 reseñas con 4.8+ en 6 meses.

**Recursos:** Gratuito. 2-3 horas de setup inicial + 30 min/semana de mantenimiento.

---

## Idea #2: Programa de Referidos (alta prioridad)

**Por qué encaja:** Los dueños de mascotas se conocen entre sí — en parques, comunidades online, grupos de WhatsApp. La confianza personal es el mayor motor de decisión para elegir veterinaria.

**Cómo empezar:**
1. Crear oferta clara: "Trae a un amigo y ambos obtienen 15% en la próxima consulta"
2. Generar código único por cliente en el sistema (columna `codigo_referido` en tabla `clientes`)
3. Entregar tarjetita física al finalizar cada consulta
4. Recordar el beneficio en el email de seguimiento post-consulta

**Métricas:** % de nuevos clientes via referido (objetivo: 25% en 6 meses)

**Recursos:** Bajo costo. Solo diseño de tarjetitas + integración en sistema.

---

## Idea #3: Email/WhatsApp Automation — Recordatorios de cuidado

**Por qué encaja:** El mayor dolor del dueño de mascotas no es la factura — es olvidar la próxima vacuna o desparasitación. Quien les recuerda primero, gana la cita.

**Secuencia a implementar:**
```
Día 0 (post-consulta):
  → "Gracias por visitarnos. Aquí el resumen de la consulta de [Nombre]."

Día 3:
  → "¿Cómo se siente [Nombre]? Si tienes alguna duda, estamos aquí."

30 días antes de próxima vacuna:
  → "Recordatorio: [Nombre] tiene su vacuna [X] el [fecha]. ¿Agendamos?"

Día del cumpleaños de la mascota:
  → "¡Hoy es el cumpleaños de [Nombre]! 🎉 Un descuento del 10% en su próxima consulta."
```

**Herramientas:** WhatsApp Business API, o email con Mailchimp (gratis hasta 500 contactos).

**Recursos:** Medio. Requiere integración con el sistema para disparar automáticamente.

---

## Idea #4: Contenido en Redes Sociales — Historias de pacientes

**Por qué encaja:** El contenido emocional de mascotas tiene el mayor engagement orgánico de cualquier nicho. Costo de producción: cero (ya están las mascotas en la clínica).

**Calendario de contenido:**
| Frecuencia | Formato | Ejemplo |
|-----------|---------|---------|
| 3x/semana | Reels/TikTok (30s) | "Llegó asustado, salió feliz 🐾 — antes/después de su visita" |
| Diario | Stories | Tip del día, "paciente del día", detrás de escenas |
| 1x/semana | Post carrusel | "5 señales de que tu gato necesita ir al veterinario" |
| Mensual | Video largo | "Un día en nuestra clínica" (YouTube) |

**Permisos:** Siempre pedir permiso por escrito al dueño antes de publicar.

**Recursos:** Solo el tiempo del equipo. 1 persona encargada de redes sociales, 1h/día.

---

## Idea #5: Blog SEO — Contenido evergreen de cuidado animal

**Por qué encaja:** Los dueños buscan respuestas en Google antes de llamar al veterinario. Aparecer en esas búsquedas = captar clientes potenciales antes de la competencia.

**Cómo empezar:**
1. Publicar 1 artículo por semana, mínimo 1,000 palabras
2. Estructura SEO: keyword en H1, respuesta directa en primeros 100 words, FAQ al final
3. CTA en cada artículo: "¿Tienes dudas? Agenda una consulta de 15 min gratis"

**Artículos prioritarios:**
- "Guía completa de vacunas para perros en [año]" (1,500+ palabras)
- "¿Cuándo desparasitar a mi mascota? Calendario mensual"
- "Señales de que tu gato está enfermo (y cuándo ir al veterinario)"
- "Cómo cuidar a un cachorro sus primeros 6 meses"
- "Alimentos prohibidos para perros: la lista completa"

**Recursos:** 3-4 horas por artículo. ROI: tráfico orgánico acumulativo.

---

## Idea #6: Calculadora Gratuita de Vacunas (Lead Magnet)

**Por qué encaja:** Herramientas gratuitas (Engineering as Marketing) generan tráfico SEO y leads de alta calidad — la persona que busca "cuándo vacunar mi perro" ES tu cliente.

**Implementación en el sitio:**
```
URL: /calculadora-vacunas/

Paso 1: ¿Qué tipo de mascota tienes?
Paso 2: ¿Cuándo nació?
Resultado: Calendario personalizado de vacunación

CTA: "Guarda tu calendario" → captura email/WhatsApp
CTA 2: "Agenda la primera vacuna en nuestra clínica"
```

**Métricas:** Leads generados / mes, tasa de conversión a cita real.

**Recursos:** 1 semana de desarrollo del frontend. Alto impacto a largo plazo.

---

## Idea #7: Sistema de Reseñas Post-Consulta

**Por qué encaja:** Las reseñas son el factor #1 en la decisión de elegir una veterinaria. El 88% de los consumidores confía en las reseñas online tanto como en recomendaciones personales.

**Cómo empezar:**
1. Al finalizar cada consulta, el sistema envía automáticamente via WhatsApp:
   > "¡Gracias por visitarnos! Si tu experiencia fue buena, nos ayudaría muchísimo una reseña: [link de Google Reviews]"
2. Responder cada reseña (positiva y negativa) en < 24 horas
3. Las respuestas negativas son oportunidad de mostrar profesionalismo

**Implementación técnica:**
```sql
-- Trigger automático a las 2h de cerrar consulta
UPDATE consultas SET recordatorio_enviado = TRUE WHERE id = $1;
-- Disparar webhook a WhatsApp Business API
```

**Objetivo:** 50 reseñas con 4.8★ en Google en los primeros 6 meses.

**Recursos:** Bajo. WhatsApp Business API tiene costo por mensaje (~$0.005/mensaje).

---

## Métricas y seguimiento mensual

| Métrica | Herramienta | Objetivo (6 meses) |
|---------|-------------|-------------------|
| Reseñas Google | Google Business | 50+ con 4.8★ |
| Tráfico orgánico | Google Analytics | +200% vs mes 1 |
| Nuevos clientes via referido | Sistema (CRM) | 25% del total |
| Leads via calculadora | Analytics + CRM | 20/mes |
| Seguidores redes sociales | Nativo | 500 en Instagram |
| Email open rate | Mailchimp | > 35% |
| Tasa de retención pacientes | Sistema | > 70% (cita en año) |

---

## Presupuesto mensual estimado

| Ítem | Costo mensual |
|------|--------------|
| WhatsApp Business API (500 mensajes) | ~$5 |
| Herramienta de email (hasta 500 contactos) | $0 (Mailchimp free) |
| Google Ads (opcional, mes 3+) | $150-300 |
| Diseño de tarjetitas de referido | $20 (única vez) |
| Total mínimo | ~$25/mes |
| Total con Google Ads | ~$175-325/mes |

**ROI proyectado:** Una cita promedio de $50 → recuperar inversión con 1-2 nuevos clientes al mes.
