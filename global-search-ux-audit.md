# Corexi Global Search UX Audit

## Executive verdict

The redesigned Global Search now has a much clearer purpose than earlier versions: it is a record-finding and operational-question command center. It is significantly closer to a premium SaaS command pattern than a bulky dashboard.

However, it is not fully refined yet. The biggest remaining issue is that the screen still shows too many secondary areas at once: suggested questions, recent searches, saved searches, and grouped results all compete slightly below the command bar. The screen is usable and credible, but it can become more elegant by making the command bar and result list feel more dominant and reducing visible helper content once results are present.

## Checklist assessment

### 1. Does this screen have one clear purpose?

**Mostly yes.**

The purpose is clear: find records or ask operational questions across Corexi. The command bar, module tabs, grouped results, recent searches, and quick actions all support that purpose.

**Remaining risk:** the combination of suggested questions, recent searches, saved searches, and results may make the screen feel like it has two states visible at once: default discovery and active results. A real SaaS search experience should usually emphasize one state at a time.

### 2. Is there one main focal point?

**Yes, but it can be stronger.**

The command bar is the main focal point and is appropriately restrained, not oversized. The centered layout helps.

**Remaining risk:** the three-column suggestion area immediately below the search bar creates a second visual band. Results then create a third. The eye understands the screen, but it does not feel as sharp as Raycast/Spotlight because the hierarchy is split across too many horizontal layers.

### 3. Can a user understand what to do in 5 seconds?

**Yes.**

A user can quickly understand:
- type a query
- switch module scope
- optionally ask Corexi AI
- open a result
- ask AI about a result
- create a task

The placeholder is strong and product-specific. The shortcut hint helps reinforce the command-center model.

### 4. Are there duplicated controls?

**Mostly no.**

The topbar search has been disabled and converted into a route-context cue, which avoids two competing active search inputs. The main page has one primary command bar and one module filter row.

**Minor concern:** “Filter by module” in the results header overlaps conceptually with the module tabs. It is not a severe duplication, but it may be unnecessary unless it opens advanced module-specific filters.

### 5. Is AI helping or dominating?

**AI is helping, not dominating.**

The “Ask Corexi AI” checkbox and row-level “Ask AI” actions are subtle. This matches the product direction: AI as a support layer, not the page architecture.

**Potential refinement:** the checkbox label could feel more premium as a compact segmented mode: `Search records` / `Ask Corexi AI`. This would feel more intentional than a checkbox.

### 6. Is there too much color?

**No.**

Color is restrained. Blue appears mainly for primary actions and active states. Risk colors are limited to badges. The screen uses mostly white, soft borders, and muted text.

**Watch item:** badges across many result groups can still create small color noise. If the result list grows, risk/status treatment should be reserved for meaningful risk, not every row.

### 7. Are there too many cards?

**Borderline.**

The screen avoids large cards, which is good. But the suggestion/recent/saved area still uses three card-like containers. They are compact, but they can make the top half feel more designed than operational.

**Best refinement:** show suggestions/recent/saved only in the no-query default state. Once results are visible, collapse them into a single slim “Recent and saved” row or hide them entirely.

### 8. Is the screen useful or just visually busy?

**Useful, with mild busyness.**

The result rows are practical and enterprise-relevant. They show record name, type, company, risk/status, date, and quick actions. That makes the screen useful, not decorative.

**Main source of busyness:** too many helper lists are visible at the same time as results. The content is relevant, but the screen would feel more premium if it showed fewer support elements after results appear.

### 9. Does it feel like a real SaaS product or an AI mockup?

**Closer to real SaaS, but not yet elite.**

It feels more credible than an AI mockup because it has:
- real Corexi objects
- grouped operational results
- compact row actions
- module filters
- recent/saved searches
- last updated metadata
- no generic empty-state library

It still has a slight prototype feel because all groups are visible at once and each row exposes multiple actions. A production-grade search would likely reveal actions on hover/focus and prioritize only the highest-confidence result groups.

## Priority recommendations

1. **Use clearer state separation**  
   Default state: recent searches, suggested questions, recently viewed/saved records.  
   Results state: command bar, module tabs, grouped results only.

2. **Reduce visible row action clutter**  
   Show `Open` as the primary action. Reveal `Ask AI` and `Create task` on hover/focus or inside a compact overflow.

3. **Replace AI checkbox with a refined mode control**  
   Use `Search records` / `Ask Corexi AI` as a small segmented toggle.

4. **Remove or clarify “Filter by module”**  
   Keep it only if it opens advanced filters. Otherwise the module tabs already solve this.

5. **Compress helper content after results appear**  
   Suggested/recent/saved queries should not compete with active results.

## Overall score

**Current screen: 7.8 / 10**

Strong foundation. Clear purpose. Good enterprise direction. The next improvement is not more UI — it is stricter progressive disclosure and fewer simultaneous secondary elements.
