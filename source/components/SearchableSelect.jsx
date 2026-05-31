import React from 'react';

/**
 * SearchableSelect — accessible combobox / autocomplete primitive (S1a).
 *
 * Standalone Opriva component for entity-backed catalog fields. Implements
 * the WAI-ARIA 1.2 combobox pattern with type-to-filter (case + accent
 * insensitive), full keyboard navigation, optional Create-new, a native
 * <select> fallback for touch devices on small catalogs, and zero external
 * dependencies (no react-select, no downshift, no virtualization libs).
 *
 * Drives the controlled-catalog rule from `MEMORY.md §22` and
 * `AGENTS.md §17`. S1a ships this component standalone; later phases
 * (S1b pilot, S1c entity fields, S1d more entity fields, S1e import
 * staging, S1f duplicate detection, S1g backend RBAC) migrate forms and
 * imports onto it.
 *
 * Controlled-input contract
 *   value     — current selected value (string). Empty string means no
 *               selection. Component never owns its value.
 *   onChange  — called with the new value on selection or clear.
 *   options   — Array<string> or Array<{value, label, hint?}>. Strings are
 *               coerced to {value: s, label: s}. Empty / null entries are
 *               dropped.
 *
 * Create-new
 *   When allowCreate is true and the user types a value that does not
 *   exactly match any option label/value, a "+ Create new \"X\"" footer
 *   item appears. Selecting it fires onCreateNew(trimmedValue). The
 *   component never mutates the catalog itself — the caller decides what
 *   to do (push to MASTER_DATA in sandbox, hit a backend API in MVP).
 *
 *   TODO backend Phase 2:
 *     - allowCreate must be permission-aware (RBAC on the server).
 *     - onCreateNew callback should resolve to a server-generated id.
 *     - Caller should run duplicate detection (alias / Levenshtein) before
 *       committing the create.
 *     - Audit trail per catalog_create_event (decidedBy / decidedAt).
 *
 * Native fallback
 *   On touch devices when options.length <= 20 (or when forceNativeSelect
 *   is true), the component renders a native <select> instead. Native
 *   pickers are better UX than custom comboboxes for short lists on
 *   mobile. allowCreate is ignored in this path (native <select> cannot
 *   add new options); a console warning is emitted.
 *
 * Example usage
 *
 *   import SearchableSelect from '../components/SearchableSelect.jsx';
 *
 *   <SearchableSelect
 *     label="Owner"
 *     value={form.owner}
 *     onChange={(v) => setForm((p) => ({ ...p, owner: v }))}
 *     options={['Maria Chen', 'Luis Mora', 'Rafael Soto', 'Ana Ríos']}
 *     required
 *     placeholder="Select an owner"
 *   />
 *
 *   <SearchableSelect
 *     label="Brand / Manufacturer"
 *     value={form.brand}
 *     onChange={(v) => setForm((p) => ({ ...p, brand: v }))}
 *     options={MASTER_DATA.vendors}
 *     allowCreate
 *     onCreateNew={(value) => {
 *       MASTER_DATA.vendors.push(value);
 *       setForm((p) => ({ ...p, brand: value }));
 *     }}
 *   />
 *
 * Accessibility
 *   Follows the WAI-ARIA 1.2 combobox pattern with listbox popup. The
 *   input is role="combobox" with aria-expanded, aria-controls,
 *   aria-activedescendant and aria-autocomplete="list". The popup is
 *   role="listbox" containing role="option" items with aria-selected.
 *   Keyboard: ArrowDown / ArrowUp / Home / End to navigate, Enter to
 *   select (or to fire Create new), Escape to cancel filter and close,
 *   Tab to close popup and continue natural focus flow. Visible state
 *   cues (active row, selected option, hover) combine color + position +
 *   border so the component does not depend on color alone.
 */

// Module-level instance counter for unique IDs.
let __ssInstanceCounter = 0;
function generateInstanceId() {
  __ssInstanceCounter += 1;
  return 'ss-' + __ssInstanceCounter + '-' + Math.random().toString(36).slice(2, 7);
}

/**
 * Accent + case-insensitive normalization, trim whitespace. Standalone so
 * this component has no internal dependency on source/utils.
 */
function normalizeSearch(value) {
  return String(value == null ? '' : value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Coerce one option entry into the canonical { value, label, hint } shape.
 * Drops empty / null entries by returning null.
 */
function toOptionObject(opt) {
  if (opt == null) return null;
  if (typeof opt === 'string' || typeof opt === 'number') {
    const s = String(opt);
    if (!s) return null;
    return { value: s, label: s, hint: '' };
  }
  if (typeof opt === 'object') {
    const value = opt.value != null ? String(opt.value) : (opt.label != null ? String(opt.label) : '');
    const label = opt.label != null ? String(opt.label) : value;
    const hint = opt.hint != null ? String(opt.hint) : '';
    if (!value && !label) return null;
    return { value, label, hint };
  }
  return null;
}

/** Detect touch-capable environment for native-fallback heuristic. */
function isTouchEnvironment() {
  if (typeof window === 'undefined') return false;
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return true;
  return 'ontouchstart' in window;
}

// ----------------------------------------------------------------------------
// Native <select> fallback for touch devices on small catalogs.
// Maintains the value/onChange contract; ignores allowCreate.
// ----------------------------------------------------------------------------
function NativeSelectFallback(props) {
  const normalizedOptions = (props.options || []).map(toOptionObject).filter(Boolean);
  const selectId = props.id || generateInstanceId();
  const labelId = selectId + '-label';
  return (
    <div className={props.className} style={Object.assign({ display: 'grid', gap: 5 }, props.style || {})}>
      {props.label && (
        <label
          htmlFor={selectId}
          id={labelId}
          style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}
        >
          {props.label}
          {props.required && (
            <abbr title="Required" style={{ color: '#B91C1C', textDecoration: 'none', marginLeft: 2 }}>
              *
            </abbr>
          )}
        </label>
      )}
      <select
        id={selectId}
        value={props.value || ''}
        onChange={(e) => { if (props.onChange) props.onChange(e.target.value); }}
        disabled={!!props.disabled}
        aria-required={props.required ? 'true' : undefined}
        aria-label={props.ariaLabel || props.label || undefined}
        aria-describedby={props.ariaDescribedBy}
        style={{
          border: '1px solid #DDE5EF', borderRadius: 8, padding: '8px 10px',
          background: '#fff', color: '#132033', fontSize: 13, fontFamily: 'inherit',
          boxSizing: 'border-box', width: '100%'
        }}
      >
        <option value="">{props.placeholder || 'Select...'}</option>
        {normalizedOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ----------------------------------------------------------------------------
// SearchableSelect — main component
// ----------------------------------------------------------------------------
export default function SearchableSelect(props) {
  const {
    value = '',
    onChange,
    options = [],
    placeholder,
    label,
    required = false,
    disabled = false,
    allowCreate = false,
    onCreateNew,
    createLabel,
    noResultsText,
    ariaLabel,
    ariaDescribedBy,
    id,
    maxVisibleOptions = 50,
    forceNativeSelect = false,
    className,
    style
  } = props;

  // Decide native fallback up-front. Stable per render given inputs.
  const degradeNative = !!forceNativeSelect
    || (!disabled && isTouchEnvironment() && options.length <= 20);

  // One-time console warning when allowCreate is silently ignored by the
  // native fallback. Useful for caller diagnosis.
  React.useEffect(() => {
    if (degradeNative && allowCreate) {
      // eslint-disable-next-line no-console
      console.warn('[SearchableSelect] allowCreate=true ignored in native <select> fallback (touch device, small catalog).');
    }
  }, [degradeNative, allowCreate]);

  if (degradeNative) {
    return <NativeSelectFallback {...props} />;
  }

  // ------- Custom combobox path -------

  // Stable ID for ARIA across renders.
  const idRef = React.useRef(null);
  if (idRef.current === null) idRef.current = id || generateInstanceId();
  const instanceId = idRef.current;
  const inputId = instanceId + '-input';
  const listboxId = instanceId + '-listbox';
  const optionDomId = (idx) => instanceId + '-option-' + idx;
  const createOptDomId = instanceId + '-option-create';

  const inputRef = React.useRef(null);
  const listboxRef = React.useRef(null);
  const containerRef = React.useRef(null);

  const [open, setOpen] = React.useState(false);
  const [filterText, setFilterText] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const normalizedOptions = React.useMemo(
    () => options.map(toOptionObject).filter(Boolean),
    [options]
  );

  const normalizedFilter = normalizeSearch(filterText);

  const filtered = React.useMemo(() => {
    if (!normalizedFilter) return normalizedOptions;
    return normalizedOptions.filter((o) => {
      const labelN = normalizeSearch(o.label);
      const hintN = o.hint ? normalizeSearch(o.hint) : '';
      return labelN.indexOf(normalizedFilter) >= 0 || (hintN && hintN.indexOf(normalizedFilter) >= 0);
    });
  }, [normalizedOptions, normalizedFilter]);

  const visible = filtered.slice(0, maxVisibleOptions);
  const overflow = Math.max(0, filtered.length - visible.length);

  // Exact match means we do NOT offer Create-new (it's already in the list).
  const hasExactMatch = !!filtered.find(
    (o) => normalizeSearch(o.label) === normalizedFilter || normalizeSearch(o.value) === normalizedFilter
  );
  const showCreate = allowCreate && !!filterText.trim() && !hasExactMatch;
  const createIdx = visible.length; // logical index slot for the create row

  // Currently selected option (by value) — used for display + initial active.
  const selectedOption = normalizedOptions.find((o) => o.value === (value || '')) || null;

  // Reset activeIndex when the popup opens. Prefer the currently-selected
  // option if it is visible; otherwise the first visible row; otherwise the
  // create row when offered.
  React.useEffect(() => {
    if (!open) return;
    let idx = -1;
    if (selectedOption) {
      idx = visible.findIndex((o) => o.value === selectedOption.value);
    }
    if (idx >= 0) {
      setActiveIndex(idx);
    } else if (visible.length > 0) {
      setActiveIndex(0);
    } else if (showCreate) {
      setActiveIndex(createIdx);
    } else {
      setActiveIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // On filter change, reset cursor to top of list (or create row if list is
  // empty). Independent of `open` so typing always re-anchors the cursor.
  React.useEffect(() => {
    setActiveIndex(visible.length > 0 ? 0 : (showCreate ? createIdx : -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedFilter]);

  // Outside-click closes the popup.
  React.useEffect(() => {
    if (!open) return undefined;
    function onDocMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setFilterText('');
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  // Scroll the active option into view when navigating with the keyboard.
  React.useEffect(() => {
    if (!open || activeIndex < 0 || !listboxRef.current) return;
    const el = listboxRef.current.querySelector('[data-active="true"]');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  function commitSelection(opt) {
    if (!opt) return;
    if (onChange) onChange(opt.value);
    setFilterText('');
    setOpen(false);
    if (inputRef.current) inputRef.current.focus();
  }

  function commitCreateNew() {
    const trimmed = String(filterText || '').trim();
    if (!trimmed) return;
    if (onCreateNew) onCreateNew(trimmed);
    setFilterText('');
    setOpen(false);
    if (inputRef.current) inputRef.current.focus();
  }

  function clearSelection() {
    if (disabled) return;
    if (onChange) onChange('');
    setFilterText('');
    if (inputRef.current) inputRef.current.focus();
  }

  function handleInputChange(e) {
    if (disabled) return;
    setFilterText(e.target.value);
    setOpen(true);
  }

  function handleInputFocus() {
    if (disabled) return;
    setOpen(true);
  }

  function handleKeyDown(e) {
    if (disabled) return;
    const key = e.key;
    const totalLogical = visible.length + (showCreate ? 1 : 0);
    if (key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      if (totalLogical === 0) return;
      setActiveIndex((prev) => (prev < totalLogical - 1 ? prev + 1 : 0));
      return;
    }
    if (key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      if (totalLogical === 0) return;
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalLogical - 1));
      return;
    }
    if (key === 'Home') {
      if (!open) return;
      e.preventDefault();
      setActiveIndex(totalLogical > 0 ? 0 : -1);
      return;
    }
    if (key === 'End') {
      if (!open) return;
      e.preventDefault();
      setActiveIndex(totalLogical > 0 ? totalLogical - 1 : -1);
      return;
    }
    if (key === 'Enter') {
      if (!open) { setOpen(true); return; }
      e.preventDefault();
      if (activeIndex < 0) return;
      if (activeIndex < visible.length) {
        commitSelection(visible[activeIndex]);
      } else if (showCreate && activeIndex === createIdx) {
        commitCreateNew();
      }
      return;
    }
    if (key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setFilterText('');
      }
      return;
    }
    if (key === 'Tab') {
      // Let native tab navigation proceed; just close the popup.
      setOpen(false);
    }
  }

  function handleClearClick(e) {
    e.preventDefault();
    e.stopPropagation();
    clearSelection();
  }

  // Display value: when typing or popup open, show filterText. Otherwise
  // show the selected label so the user sees the canonical value.
  const displayValue = open || filterText
    ? filterText
    : (selectedOption ? selectedOption.label : '');

  // ID of the currently active descendant for aria-activedescendant.
  let activeOptId = '';
  if (open && activeIndex >= 0) {
    if (activeIndex < visible.length) activeOptId = optionDomId(activeIndex);
    else if (showCreate && activeIndex === createIdx) activeOptId = createOptDomId;
  }

  // ------- Styles (inline, no external deps) -------

  const containerStyle = Object.assign({
    position: 'relative',
    display: 'grid',
    gap: 5
  }, style || {});

  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid ' + (open ? '#0D9488' : '#DDE5EF'),
    borderRadius: 8,
    background: disabled ? '#F8FAFC' : '#fff',
    boxShadow: open ? '0 0 0 2px rgba(13,148,136,0.12)' : 'none',
    transition: 'border-color .12s, box-shadow .12s'
  };

  const inputStyle = {
    flex: '1 1 auto',
    minWidth: 0,
    border: 'none',
    outline: 'none',
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: 'inherit',
    background: 'transparent',
    color: disabled ? '#94A3B8' : '#132033',
    cursor: disabled ? 'not-allowed' : 'text'
  };

  const clearBtnStyle = {
    border: 'none', background: 'transparent', color: '#94A3B8',
    cursor: 'pointer', padding: '0 6px', fontSize: 16, lineHeight: 1
  };

  const chevronStyle = {
    color: '#94A3B8', padding: '0 8px', userSelect: 'none',
    transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .12s'
  };

  const popupStyle = {
    position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)',
    background: '#fff', border: '1px solid #DDE5EF', borderRadius: 8,
    boxShadow: '0 8px 20px rgba(11,31,58,0.10)', zIndex: 50,
    maxHeight: 240, overflowY: 'auto', padding: 4,
    listStyle: 'none', margin: 0
  };

  const optionStyle = (isActive) => ({
    padding: '8px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#132033',
    background: isActive ? '#F0FDFA' : 'transparent',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  });

  const hintStyle = { fontSize: 11, color: '#94A3B8', fontWeight: 600, flexShrink: 0 };

  const createOptionStyle = (isActive) => Object.assign({}, optionStyle(isActive), {
    borderTop: '1px solid #EEF2F7',
    marginTop: 4,
    color: '#0F766E',
    fontWeight: 700
  });

  const emptyStyle = { padding: '12px 10px', fontSize: 12, color: '#64748B', textAlign: 'center', listStyle: 'none' };
  const overflowStyle = { padding: '6px 10px', fontSize: 11, color: '#94A3B8', textAlign: 'center', borderTop: '1px solid #EEF2F7', marginTop: 4, listStyle: 'none' };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#475569' };

  return (
    <div className={className} style={containerStyle} ref={containerRef}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
          {required && (
            <abbr title="Required" style={{ color: '#B91C1C', textDecoration: 'none', marginLeft: 2 }}>
              *
            </abbr>
          )}
        </label>
      )}
      <div
        style={inputContainerStyle}
        onClick={() => { if (!disabled && inputRef.current) inputRef.current.focus(); }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          value={displayValue}
          placeholder={placeholder || 'Select...'}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          aria-expanded={open ? 'true' : 'false'}
          aria-controls={listboxId}
          aria-activedescendant={activeOptId || undefined}
          aria-autocomplete="list"
          aria-required={required ? 'true' : undefined}
          aria-label={ariaLabel || label || undefined}
          aria-describedby={ariaDescribedBy}
          style={inputStyle}
        />
        {selectedOption && !open && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear selection"
            style={clearBtnStyle}
            onClick={handleClearClick}
          >
            ×
          </button>
        )}
        <span style={chevronStyle} aria-hidden="true">▾</span>
      </div>
      {open && (
        <ul
          role="listbox"
          id={listboxId}
          ref={listboxRef}
          aria-label={(ariaLabel || label || 'Options') + ' options'}
          style={popupStyle}
        >
          {visible.length === 0 && !showCreate && (
            <li role="option" aria-disabled="true" style={emptyStyle}>
              {noResultsText || 'No matches'}
            </li>
          )}
          {visible.map((opt, idx) => {
            const isActive = idx === activeIndex;
            const isSelected = selectedOption && opt.value === selectedOption.value;
            return (
              <li
                key={opt.value + '-' + idx}
                id={optionDomId(idx)}
                role="option"
                aria-selected={isSelected ? 'true' : 'false'}
                data-active={isActive ? 'true' : 'false'}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => { e.preventDefault(); commitSelection(opt); }}
                style={optionStyle(isActive)}
              >
                <span>{opt.label}</span>
                {opt.hint && <span style={hintStyle}>{opt.hint}</span>}
              </li>
            );
          })}
          {overflow > 0 && (
            <li role="option" aria-disabled="true" style={overflowStyle}>
              {overflow + ' more — refine your search'}
            </li>
          )}
          {showCreate && (
            <li
              id={createOptDomId}
              role="option"
              aria-selected={activeIndex === createIdx ? 'true' : 'false'}
              data-active={activeIndex === createIdx ? 'true' : 'false'}
              onMouseEnter={() => setActiveIndex(createIdx)}
              onMouseDown={(e) => { e.preventDefault(); commitCreateNew(); }}
              style={createOptionStyle(activeIndex === createIdx)}
            >
              {'+ ' + (createLabel
                ? createLabel.replace('{value}', filterText.trim())
                : 'Create new "' + filterText.trim() + '"')}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
