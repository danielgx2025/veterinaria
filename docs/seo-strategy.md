# Estrategia SEO — VetSystem / Clínica Veterinaria

Checklist técnico completo basado en el skill `seo-audit`.

---

## Tipo de sitio
**Local Business + SaaS de gestión veterinaria**

- Objetivo primario: captar clientes de la clínica física → búsquedas locales
- Objetivo secundario: posicionar el software para veterinarias → B2B

---

## Keywords objetivo

| Keyword | Intención | Prioridad |
|---------|-----------|-----------|
| `veterinaria [ciudad]` | Local | Alta |
| `clínica veterinaria cerca de mí` | Local | Alta |
| `vacunas para perros [ciudad]` | Local/Transaccional | Alta |
| `desparasitación mascotas` | Informacional/Local | Media |
| `consulta veterinaria urgencia` | Local/Urgente | Alta |
| `cirugía veterinaria [ciudad]` | Local/Transaccional | Media |
| `peluquería canina [ciudad]` | Local | Media |
| `software gestión veterinaria` | B2B | Media |
| `sistema veterinario online` | B2B | Media |

---

## 1. SEO Técnico

### Indexación
- [ ] Verificar `robots.txt` — ✅ Creado en `/public/robots.txt`
- [ ] Sitemap XML — ✅ Creado en `/public/sitemap.xml`
- [ ] Enviar sitemap a Google Search Console
- [ ] Enviar sitemap a Bing Webmaster Tools
- [ ] Verificar que `/api/` y `/dashboard/` están bloqueados para crawlers

### Canonicales y duplicados
- [ ] Todas las páginas tienen `<link rel="canonical" href="...">` auto-referencial
- [ ] Consistency www vs non-www → configurar redirect 301 a versión preferida
- [ ] HTTPS en toda la app (redirigir HTTP → HTTPS)
- [ ] Trailing slash consistency → `/servicios/` siempre con slash final

### Core Web Vitals — objetivos
| Métrica | Objetivo | Estrategia |
|---------|----------|-----------|
| LCP | < 2.5s | Preload de fuentes, imágenes lazy, CSS crítico inline |
| INP | < 200ms | React optimizado, evitar re-renders innecesarios |
| CLS | < 0.1 | Reservar espacio para imágenes con `width`/`height` |

### Implementación técnica de velocidad
```html
<!-- Ya incluido en index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="...fuentes..." />
```

- [ ] Comprimir imágenes a WebP (usar `<picture>` con fallback)
- [ ] Lazy loading en imágenes de mascotas: `<img loading="lazy" />`
- [ ] CDN para assets estáticos (Cloudflare, Vercel Edge)
- [ ] Cache-Control headers: `max-age=31536000` para assets con hash

---

## 2. SEO On-Page

### Estructura de títulos por página

| Página | `<title>` (< 60 chars) | `<meta description>` (< 160 chars) |
|--------|------------------------|-------------------------------------|
| Inicio | `Veterinaria [Ciudad] — Clínica para Mascotas` | `Atendemos perros, gatos y animales exóticos en [Ciudad]. Consultas, vacunas, cirugía y peluquería. Agenda tu cita online.` |
| Servicios | `Servicios Veterinarios en [Ciudad] — VetSystem` | `Consulta general, vacunación, cirugía, laboratorio y estética para mascotas. Veterinarios expertos disponibles 6 días a la semana.` |
| Vacunación | `Vacunas para Perros y Gatos en [Ciudad]` | `Calendario de vacunación personalizado para tu mascota. Vacunas antirrábica, polivalente y felina con cita previa o en el día.` |
| Contacto | `Contacto y Ubicación — Clínica Veterinaria [Ciudad]` | `Encuéntranos en [dirección]. Horarios de atención, teléfono, WhatsApp y formulario de contacto. ¡Agenda tu cita ahora!` |
| Citas | `Agenda tu Cita Veterinaria Online — VetSystem` | `Reserva tu cita en 2 minutos. Elige veterinario, servicio y horario disponible. Confirmación inmediata por WhatsApp.` |

### H1 único por página
```html
<!-- Ejemplo correcto: -->
<h1>Veterinaria en [Ciudad] — Cuidamos a tu mascota</h1>

<!-- NO repetir en H2, NO múltiples H1 -->
```

### Keyword en primeras 100 palabras
- Cada página de servicio debe mencionar la keyword principal dentro del primer párrafo

---

## 3. Schema Markup — ✅ Implementado

Incluido en `frontend/index.html`:

```json
{
  "@type": ["LocalBusiness", "VeterinaryCare"],
  "name": "Clínica Veterinaria VetSystem",
  ...
}
```

**Completar los campos pendientes:**
- [ ] `"latitude"` y `"longitude"` con coordenadas reales
- [ ] `"streetAddress"`, `"addressLocality"`, `"addressRegion"`, `"postalCode"`
- [ ] `"telephone"` con número real
- [ ] `"email"` con email real
- [ ] URLs de `"sameAs"` (Google Business, Facebook, Instagram)

### Schema adicional recomendado
- **FAQPage** — para preguntas frecuentes sobre servicios
- **Review / AggregateRating** — al integrar sistema de reseñas
- **BlogPosting** — para artículos del blog
- **HowTo** — para guías de cuidado (ej: "Cómo bañar a tu perro")

---

## 4. SEO Local (Google Business Profile)

### Configuración inicial
- [ ] Reclamar perfil en Google Business Profile
- [ ] Categoría principal: **Veterinarian** (Veterinario)
- [ ] Categorías secundarias: Pet groomer, Animal hospital
- [ ] Nombre exacto igual al del sitio web
- [ ] Dirección 100% consistente con schema markup y sitio web (NAP consistency)
- [ ] Horarios completos y actualizados
- [ ] Mínimo 10 fotos (exterior, interior, equipo, mascotas atendidas)
- [ ] Descripción de 750 caracteres con keywords locales

### Posts y mantenimiento
- [ ] Publicar post semanal en GBP (oferta, tip de salud, caso de éxito)
- [ ] Responder TODAS las reseñas en < 24 horas (con nombre del paciente si es posible)
- [ ] Solicitar reseñas post-consulta via WhatsApp/email

---

## 5. Contenido — Blog SEO

### Artículos prioritarios (long-tail keywords)

| Artículo | Keyword objetivo | Intent |
|---------|-----------------|--------|
| Guía de vacunas para cachorros 2026 | `vacunas cachorros calendario` | Informacional |
| ¿Cuándo desparasitar a mi perro? | `cuando desparasitar perro` | Informacional |
| Signos de alarma en gatos | `signos alerta enfermedad gato` | Informacional |
| Cómo preparar a tu mascota para la cirugía | `preparar mascota cirugia veterinaria` | Informacional |
| Diferencia entre garrapatas y pulgas | `diferencia garrapatas pulgas perro` | Informacional |

### Estructura de artículo SEO-optimizado
```
H1: [Keyword principal] — [año o calificador]
Párrafo 1: Responde la pregunta directamente (featured snippet)
H2: [Subtema 1]
H2: [Subtema 2]
H2: Preguntas frecuentes (FAQPage schema)
CTA: Agenda tu cita / Calculadora gratuita
```

---

## 6. Herramienta gratuita — Calculadora de Vacunas

URL: `/calculadora-vacunas/`

**Por qué funciona para SEO:**
- Genera backlinks naturales (pet owners comparten herramientas útiles)
- Tiene uso repetido (dueños la visitan cada año)
- Capta emails para seguimiento

**Implementación mínima:**
1. Formulario: especie + fecha de nacimiento
2. Resultado: próximas 3 fechas de vacunación recomendadas
3. CTA: "¿Quieres que te recordemos? Deja tu WhatsApp"
4. Schema HowTo para el proceso

---

## 7. Link Building para veterinaria local

| Táctica | Dificultad | Impacto |
|---------|-----------|---------|
| Directorios locales (Yelp, Páginas Amarillas, etc.) | Bajo | Medio |
| Google Business Profile | Bajo | Alto |
| Colaborar con tiendas de mascotas locales | Medio | Medio |
| Guest posts en blogs de cuidado animal | Medio | Alto |
| Aparecer en medios locales (nota sobre bienestar animal) | Alto | Alto |

---

## 8. Métricas a monitorear

- **Google Search Console:** impresiones, clics, posición media, CTR
- **Google Business Profile Insights:** búsquedas, vistas, acciones (llamadas, rutas)
- **Core Web Vitals:** mensualmente
- **Reseñas:** cantidad, calificación promedio, tiempo de respuesta

**Baseline a establecer:**
- Indexar al menos 10 páginas en los primeros 30 días
- Aparecer en el Local Pack para "veterinaria [ciudad]" en 90 días
- 3 artículos de blog en top 10 en 6 meses
