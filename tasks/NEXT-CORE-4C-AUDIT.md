# NEXT TASK: CORE-4c — Documents linked record persistence audit

## Estado
Pendiente. No implementar sin audit previo.

## Contexto

Core-4b consolidó `getDocumentFields(context)`:
- standalone: Upload/New Document
- linked: Attach Document desde drawer

Pero save behavior no se unificó todavía.

Problema pendiente:
- Attach Document guarda metadata real:
  - `linkedModule`
  - `linkedRecordId`
  - `linkedRecordName`
- Standalone Upload Document todavía puede guardar Linked Record como string/row display, no necesariamente como relación formal.

## Objetivo del audit

Determinar cómo fortalecer la persistencia de Documents standalone para que guarde relación real con el Linked Record seleccionado, sin romper tabla, drawer, Data Import, ni Attach Document.

## Reviewers requeridos
- architecture
- backend-readiness
- enterprise-ux
- workspace-mode
- ciso-security
- import-data-model

## Preguntas del audit
1. Cómo guarda hoy Upload/New Document el campo Linked Record.
2. Cómo Attach Document guarda linkedModule/linkedRecordId/linkedRecordName.
3. Si `linkedRecordOptions` ya tiene toda la metadata necesaria.
4. Cómo mapear selected linked record value a:
   - linkedRecordId
   - linkedModule
   - linkedRecordName
5. Cómo preservar el display actual en tabla.
6. Si debe agregarse metadata sin cambiar row.
7. Riesgo para Documents Linked Record SearchableSelect.
8. Riesgo para Data Import.
9. Plan mínimo seguro.
10. QA obligatorio.

## Criterios de aceptación del audit
- No modificar archivos.
- Reportar plan claro.
- Decidir si implementación puede hacerse en una subfase pequeña.
