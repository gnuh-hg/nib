# Memory — patterns (cách làm đã thành công)

> Pattern đã pass: stack/cấu trúc + done-criteria khách quan đã đạt. Đọc trước khi thiết kế / chọn cách làm.
> LUÔN append (`## YYYY-MM-DD HH:MM — slug`), không overwrite. Dùng 10 entry mới nhất.

## 2026-06-20 14:00 — design-library-snippet-fidelity

Design-library snippet PHẢI: (1) link CSS component thật (không chỉ tokens.css) — thiếu link = CSS inline xấp xỉ = render lệch; (2) dùng class/DOM đọc trực tiếp từ .tsx + .css của component; (3) KHÔNG tự đặt class mới (.nib-demo*). Fidelity gate: grep nib-demo=rỗng + grep src/components≥1 + class grep pass src/. Visual match = USER smoke (agent không reach browser — ISSUE-8/13).

---


## 2026-06-15 11:10 — dock-v2-drag-reposition (Session 3.1 PASS)

- Drag-to-reposition cho floating dock: chuyển `position:absolute` (trong stage) → `createPortal(document.body)` + `.nib-dock-anchor{position:fixed; left/top từ pos state}`. Component VẪN là con React của Canvas → EditorContext/useEditorContext không vỡ (portal chỉ đổi DOM mount, không đổi React tree). Pattern chuẩn cho overlay cần thoát overflow clip + z-index.
- Pure positioning trong dockState.ts (testable không cần DOM): clampPos(x,y,vw,vh) giới hạn [0,vw-56]×[0,vh-56] + guard viewport nhỏ→0; parsePos(raw,vw) JSON guard finite number → fallback defaultPos; defaultPos(vw)=góc phải-trên. +5 unit test.
- Pointer drag: setPointerCapture(e.pointerId) trên handle; dragOrigin ref {px,py,x,y} + dragMoved ref (max Manhattan delta). onMove: setPos(clampPos(origin + delta)). Tap-vs-drag cho ô collapsed: delta<4px = tap→expand, else drag. Bỏ onClick→thay pointer handlers + onKeyDown Enter/Space giữ a11y.
- Persist khi settle: useEffect ghi localStorage khi !isDragging (sau thả + sau resize re-clamp), KHÔNG ghi giữa drag. window.resize → setPos(clampPos) re-clamp vào viewport.
- CSS: `touch-action:none` trên vùng kéo (handle + collapsed) chặn scroll/gesture nuốt pointer; `[data-dragging] * {transition:none!important; user-select:none}` cho kéo mượt không lag.
- Done: `tsc` 0 · `build` 0 · `vitest` 47/47 · grep hex/rgba dock rỗng · dev HTTP 200.

## 2026-06-15 11:22 — dock-v2-overflow-aware-expand-flyout (Session 3.2 PASS — plan dock-v2 DONE)

- Overflow-aware expand direction: state expandDir; doExpand() chọn 'up'/'down' theo spaceBelow=innerHeight-pos.y so với DOCK_EXPANDED_H(460) TRƯỚC animation (không 2 animation nối tiếp). CSS `.nib-dock__expanded[data-expand-up]{top:auto;bottom:0}` → mở lên từ đáy anchor. posRef mirror pos để doExpand callback stable ([] deps) mà vẫn đọc pos mới.
- Flyout flip overflow-aware: bỏ top hardcode CSS → tính JS tại tog(k) bằng getBoundingClientRect (btnRefs[k] + expandedRef): fit dưới viewport(-8px) → top=topRel; else lật lên top=topRel+btnH-flyoutH (clamp≥0). setFlyoutStyle{[k]:{top}} → style prop xuống FlyoutPanel spread (override CSS top:0 fallback). btnRefs = useRef<Partial<Record<PopKey,HTMLButtonElement|null>>>, DockBtn nhận btnRef callback ref.
- Pure helpers tách dockState.ts (testable không DOM): expandDirection(posY,vh), flyoutTop(topRel,expTop,btnH,flyoutH,vh) + FLYOUT_HEIGHTS const. +3 test (down/up + fit/flip/clamp). Pattern: mọi math layout → pure fn + unit test, component chỉ đo DOM + gọi.
- Đo DOM tại thời điểm tương tác (tog/doExpand) thay vì useLayoutEffect: đơn giản, đúng vì dock đã mount sẵn (chỉ đổi openPop), ref luôn current.
- Done: `tsc` 0 · `build` 0 · `vitest` 50/50 · grep hex/rgba dock rỗng · grep top hardcode flyout rỗng · dev HTTP 200. Plan dock-v2 (Phase 1+2+3) HOÀN THÀNH.

## 2026-06-17 17:05 — paper-offsetparent-position-static (S1.3)

Stack: React + TipTap NodeView absolute placement trên paper cố định 664px.
Pattern: block đặt `top = lineIndex * RULE_HEIGHT` (NibBlockView inline + layout-effect). Để offsetParent của .nib-block = .nib-pm (664px) chứ KHÔNG phải desk viewport-wide:
  - `.nib-desk { position: static }` EXPLICIT (RISK#2 — desk positioned → block tràn).
  - `.nib-editor-host { position: relative; min-height: calc(var(--ruled-line-height)*16) }` (RISK#1 — thiếu min-height → host collapse 0 → block stack mất vùng click/scroll).
  - `.nib-pm { position: relative; min-height: inherit }`.
Coords paper-relative: `paperRef.current.getBoundingClientRect()` (KHÔNG dùng desk).
Done: tsc 0 · build 0 · vitest 53/53 · test RISK#1 lineIndex=3→192px · geometry.ts diff=0.

## 2026-06-17 21:40 — library-overlay-data-attr-open (S1.5)

Stack: React overlay (scrim+panel) trên app shell, state-lifted ở AppShell.
Pattern: overlay open/close = `data-open` attr trên wrapper (.nib-library-overlay) → CSS opacity+pointer-events transition, KHÔNG conditional unmount (giữ animation). Panel `transform: translateY(8px)`→`none` khi open: tại rest transform=none nên position:fixed con (context menu tại clientX/Y) resolve theo VIEWPORT (transform!=none tạo containing-block phá fixed → chỉ né bằng cách settle về none).
Sub-popover (sort/ctx/delete) conditional-render OK; click-away = `.nib-lib-popover-backdrop` position:fixed inset0 z69, menu z70.
Danger button: bg `var(--error)` + text `var(--text-on-accent)` (KHÔNG raw #fff — R4; --text-on-accent flips light/dark cho contrast tốt hơn #fff trên error-dark).
Done: tsc 0 · build 0 · vitest 53/53 · 0 hex rời · z-index 50/60/70/80 phân tầng.

## 2026-06-17 22:10 — team-ops: ghi-lại-issues.md là ĐIỀU KIỆN DONE (không phải bước cuối tuỳ chọn)

- Lỗi cơ chế của chính team-ops (user chỉ ra): fix code `.claude/` xong nhưng KHÔNG quay lại đóng `issues.md` (status vẫn `open`, target không ghi đã fix GÌ) → queue mất sync, không ai biết đã fix & fix ra sao.
- **Pattern**: đóng issue NGAY sau Edit, TRƯỚC khi SendMessage báo lead — không để cuối (dễ rớt). `target` phải ghi RÕ **file đã sửa + HOW + ngày `(team-ops, YYYY-MM-DD)`**. Queue chưa cập nhật = CHƯA done dù code đã sửa.
- Đã siết vào `team-ops.md` (mục "Khi xong" bước (a) bắt buộc trước TaskUpdate/SendMessage + "Cách làm" bước 6 "ghi NGAY không để cuối" + gate-table + anti-pattern) và `team-fix/SKILL.md` (§0.5 + §4.5). Agent body/skill → không high-impact.
- Ngưỡng §3 áp trong cùng session này: ISSUE-3+5 (lead bỏ qua plan, lặp ≥2) → cứng hoá PLAN-GATE vào master §3/§4 + playbook §1; ISSUE-6 → đổi guard layout từ đọc `teammateMode` sang kiểm `$TMUX` runtime (đính chính kết luận no-op sai của ISSUE-2). High-impact (master/playbook) → áp theo lệnh trực tiếp user.

## 2026-06-18 15:15 — drill-down dock level (nav-dock S1.1)

- **Bài toán**: 1 dock duy nhất (`UnifiedDock`) cần 2 cấp NAV↔TOOLS thay vì ModeToggle. Giữ collapse/drag/flyout-overflow đã có.
- **Pattern dùng (pass build/tsc/vitest):**
  - State `dockLevel:'nav'|'tools'` **in-memory** (`useState`, default 'nav', KHÔNG persist) — startup luôn về NAV cho dễ định hướng; né thêm localStorage key + parse/clamp. Pure helpers testable: `navSelect(btn)→{mode,level}`, `backToNav()→'nav'` trong dockState.ts (test thuần, không cần DOM).
  - Render drill-down: wrapper `<div className="nib-dock__level" data-level={level} key={level}>` — **key remount** kích hoạt CSS `@keyframes` fade-in 0.15s (đơn giản hơn slide/đo-đạc, 1 subtree mount tại 1 thời điểm). reduced-motion guard tắt animation.
  - Nút collapse đặt **NGOÀI** level wrapper → collapse được ở mọi level, bung về level đang đứng (collapse/expand state độc lập với level).
  - Tách `NavLevel.tsx` riêng (pattern component-per-concern: DockBtn/CalcBtn). UnifiedDock giữ state, truyền props. AccountChip = placeholder inline (avatar `--accent-subtle`+initials `--accent`).
- **Xóa component có vitest an toàn**: grep ref TRƯỚC — ModeToggle chỉ ở UnifiedDock+file của nó, KHÔNG test nào chạm component (test chỉ chạm pure fn `toggleMode` ở dockState — giữ lại). → xóa file + import + render + callback, 0 test fail.
- **Hit target [LOCKED] ≥44px**: redesign mới KHÔNG có "HTML-wins" exception → bump `.nib-dock__btn` 40→44px ngay từ CSS. Đừng kế thừa mốc 40px của dock-v2 (đó là ngoại lệ HTML-thắng riêng).
- Type cho prop `t`: `I18nContextValue['t']` (không có `TFunction` export trong useI18n) — import từ `@/providers/i18n-context`.
- Confirm: tsc 0 · vitest 56/56 · build 0 (2.06s) · grep hex UnifiedDock = 0 · i18n parity 7/7.

## 2026-06-18 15:25 — topstrip-replace-topchrome-pattern

Stack: React/TS — thay header đầy đủ bằng strip mỏng + bỏ sidebar (nav-dock-redesign S1.2).
Pattern: component mới `TopStrip.tsx` (doc-title switcher dropdown + inline-rename + theme/undo/redo), Workspace swap `<TopChrome>`→`<TopStrip>` + bỏ `<SidebarRail>`, GIỮ UnifiedDock+CommandPalette trong EditorContext.Provider (không di chuyển Provider). undo/redo nối `editor.commands.undo()/redo()`; rename persist qua handler AppShell (`handleCommitRename`) truyền xuống prop. Xóa file = xóa import cùng turn (0 dangling).
Dropdown switcher anchored top-left (top:calc(100%+6px);left:0) + max-height 60vh scroll → không overflow viewport, không cần đo getBoundingClientRect (khác context-menu theo con trỏ).
Done-criteria pass: tsc 0 · vitest 56/56 · build 0 (2.16s) · 0 hex rời src/components · strip.* parity en5/vi5 · hit target 44px.

## 2026-06-18 16:12 — settings-overlay-mirror-library + dock-nav-wiring

Stack: React/TS — overlay MVP + wire dock NAV vào app-level state (nav-dock-redesign S1.3, plan HOÀN THÀNH 3/3).
Pattern: `SettingsOverlay/` mirror `LibraryOverlay/` (scrim+panel, data-open no-unmount, reduced-motion). Lang/Theme seg dùng useI18n.setLang + useTheme.setTheme → runtime + persist sẵn trong provider (nib-lang/nib-theme), KHÔNG cần thêm cơ chế lưu. Overlay state ở AppShell (top-level như LibraryOverlay), mở từ dock = thêm prop callback bubble: AppShell→Workspace→UnifiedDock→NavLevel onSettings/onLibrary (hết no-op placeholder). AccountChip đọc localStorage nib-user-name fallback "User".
Quyết định: dock dọc hẹp → AccountChip avatar-only (tên qua title/aria), không render name label (ép dock rộng).
Done-criteria pass: tsc 0 · vitest 56/56 · build 0 (2.02s) · §9 15/15 en+vi · parity 147/147 · 0 hex rời src/components.

## 2026-06-19 16:25 — settings-overlay-layout-neutral-3-variants

Stack: React/TS — SettingsOverlay sidebar-nav + ProfileProvider (settings-redesign S2).
Pattern layout-neutral: component tree CỐ ĐỊNH (SettingsNav + SettingsContent, HTML không hardcode width/position) → 3 hướng nav (rail/tabs/grid) = thuần CSS qua `[data-settings-layout=rail|tabs|grid]` trên `.nib-settings__panel`. Dev switch tạm persist localStorage `nib-settings-layout` → user bấm đổi LIVE chọn 1 hướng, task sau khoá.
Section registry: `SectionDef[]` (id/i18nKey:I18nKey/icon/component/comingSoon?) eager — thêm section = append 1 entry, shell không sửa. activeId trong INTERNAL SettingsContext (không export khỏi index.ts) → props chỉ {open,onClose} (tránh 18-prop LibraryOverlay).
ProfileProvider: wrap NGOÀI ThemeProvider ở App.tsx (dock/TopStrip sau dùng useProfile). StoredProfile persist `nib-profile`, avatarInitials derive tại render (không persist), avatarColor = deriveAvatarColor(name) stable hash %8 → named swatch token (`--swatch-teal..slate`, KHÔNG `--swatch-1..8`). Avatar dùng color-mix(swatch 16%, surface) tránh hex rời.
R1 confirm: thêm TẤT CẢ i18n key settings.* (en+vi) TRƯỚC khi tạo registry — I18nKey=keyof typeof en check compile-time, sai thứ tự → tsc fail.
Done: tsc 0 · build 0 · vitest 62/62 (+6 profile: deriveInitials ''→'?'/'Hung'→'H'/'Nguyen Hai'→'NH', deriveAvatarColor stable) · 0 hex rời · settings.* parity en=vi=19.

## 2026-06-20 — phase-a-cleanup-maintenance-pattern

Stack: team-ops maintenance (git mv + git rm + Edit + Write + Bash).
Pattern: archive plan/docs = git mv giữ history; grep ref-inventory TRƯỚC khi mv để không bỏ sót live ref; memory trim = extract top-N entries vào archive.md rồi cp slim file (không dùng Write vì mất context, dùng sed+cp); log/history entries "Để nguyên" — không cần update path trong prose entries.
Done: ls plan/_archived/ 7 dirs · ls plan/ROADMAP.md = Not found · docs/_archived/ 6 files · SUPERSEDED 5 hits · context.md 10 entries.
