# Opriva Forms Closure Status

## Estado general

La rama `next/searchable-combobox` contiene una fase avanzada de cierre de formularios.

## Completado

### SearchableSelect / Controlled catalogs
- SearchableSelect primitive agregado.
- New Record forms migrados en campos de catálogo.
- Edit drawer respeta SearchableSelect.
- Brand / Manufacturer ya es SearchableSelect donde aplica.
- Provider / Vendor / Owner en Support Coverage ya son SearchableSelect.
- Documents Linked Record usa registros reales cross-module.

### Licenses
- License MSP tiene Brand / Manufacturer.
- License MSP usa key interna `provider`.
- Label visual MSP sigue siendo `Distributor / Provider`.
- Fallback temporal `provider || distributor` puede existir para compatibilidad local.
- Risk Level es derivado.
- Edit License MSP reconstruye Vendor Cost desde meta/fallback y no bloquea Save.

### Tasks
- `getTaskFields(workspaceMode, context)` existe.
- Contexto `standalone`: incluye Linked Record.
- Contexto `linked`: omite Linked Record porque el padre es implícito.
- Owner es SearchableSelect.
- Task Type, Priority y Status siguen como selects nativos.

### Documents
- `getDocumentFields(context)` existe.
- Contexto `standalone`: 8 campos, incluyendo Linked Record, Client/Department y Provider/Vendor.
- Contexto `linked`: 5 campos; el parent record es implícito.
- `Uploaded by` unificado y SearchableSelect.
- Save behavior aún no se unificó.

### Accessibility
- Focus management en New Record modal.
- Focus management en Detail/Edit drawer.
- Import Preview drawer todavía diferido.

### Product / Strategy docs
- `OPRIVA_CRITICAL_TO_ADVANTAGE_ROADMAP.md` creado.
- Form architecture y controlled catalog rules documentadas.

## Pendiente recomendado

### CORE-4c — Documents linked record persistence
Objetivo:
Fortalecer persistencia de Documents standalone para que no guarde solo un string de Linked Record.

Pendiente:
- standalone Document debe guardar:
  - `linkedRecordId`
  - `linkedModule`
  - `linkedRecordName`
- Igualar mejor la postura de evidencia entre Upload y Attach.
- No fusionar todos los handlers todavía sin audit.

### Preview / Import consistency
Pendiente:
- Import Preview drawer todavía no respeta SearchableSelect.
- Diferir hasta QA completo de Coverage Import.

### Backend Foundation
Pendiente mayor:
- Auth
- Workspaces como tenant real
- RBAC
- Persistencia
- File storage
- Audit trail append-only
- Import jobs persistentes
- Alerts/email jobs

## No repetir

No recrear como pendientes:
- CORE-3
- CORE-2
- Forms-fix-1
- Core-4a
- Core-4b

Ya fueron trabajados en la rama `next/searchable-combobox`.
