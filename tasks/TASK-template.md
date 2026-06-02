# TASK-[ID]: [Nombre de la tarea]

## Contexto
Breve descripción del problema a resolver y por qué importa.

## Estado
- Pendiente / En progreso / Completado / Diferido

## Scope — archivos a tocar
- `[archivo]`: [qué función/bloque]
- Solo los listados arriba. Nada más.

## Cambios requeridos
1. [Cambio concreto 1]
2. [Cambio concreto 2]

## Constraints
- No tocar archivos fuera de scope.
- Ejecutar build antes de reportar.
- Ejecutar `git diff --check`.
- Si se toca `App.jsx`, confirmar hooks antes de returns condicionales.
- CSS nuevo: usar clases con prefijo `.opriva-[módulo]-`.
- No mergear. Isaac aprueba.

## Reviewers requeridos
- architecture
- backend-readiness
- enterprise-ux
- workspace-mode
- import-data-model, si toca import/mapping/data model
- accessibility, si toca forms/focus/combobox
- ciso-security, si toca Documents/files/auth/audit/PII
- it-procurement-vendor-management, si toca Brand/Product/Provider/Vendor/Coverage

## Criterios de aceptación
- [ ] Build passed
- [ ] `git diff --check` limpio
- [ ] Scope respetado
- [ ] QA funcional realizado
- [ ] No cambios fuera de scope
- [ ] Reporte claro a Isaac

## Notificación opcional al terminar PR
```bash
python scripts/notify.py \
  --task "TASK-[ID]: [Nombre]" \
  --pr "https://github.com/isiven/opriva/pull/N" \
  --summary "[Una línea de resumen]" \
  --status "QA pasó · build limpio"
```
