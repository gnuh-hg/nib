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

## 2026-06-21 11:58 — supabase-client-auth-module-A1

Stack: React/TS/Vite + @supabase/supabase-js@^2.108. `src/lib/supabase.ts` = singleton `createClient(import.meta.env.VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` với placeholder fallback (createClient throw nếu url/key rỗng) + persistSession/autoRefresh, detectSessionInUrl:false (Tauri webview không có OAuth URL callback ở A.1). `src/lib/auth.ts` = 4 wrapper (signInWithEmail/signOut/getSession/onAuthStateChange) trả type Supabase gốc — UI inspect `error` để dịch.
Test no-network: mock tại tầng `vi.mock('@supabase/supabase-js')` trong `src/test/setup.ts` (bắt MỌI import path, không phụ thuộc relative './supabase' vs alias '@/lib/supabase'). Env typed ở `vite-env.d.ts` (ImportMetaEnv optional). `.env.local` gitignored, `.env.example` tracked.
Done-criteria: tsc 0 · build 0 · vitest 62/62 (existing không vỡ, 0 test network thật).

## 2026-06-21 14:30 — tauri-keyring-v4-linux-pattern

Stack: keyring v4 + Tauri 2 (Ubuntu/GNOME). Default features bao gồm `zbus-secret-service-keyring-store` (Linux) + `windows-native-keyring-store` — không cần thêm feature flag trên Linux.
Pattern: `tauri::async_runtime::spawn_blocking` bọc sync keyring API; JoinHandle<R>.await → tauri::Result<R> → `.map_err(|e| format!("..."))?` lấy inner Result<R,String>.
Done-criteria: `cargo build` exit 0 (4m37s fresh, cached <<1s). 3 command: save_token/load_token/clear_token registered trong invoke_handler.
Bài học: apple-native-keyring-store được pull automatically dù build Linux — OK vì conditional compile. Không cần `libsecret-dev` riêng cho zbus (pure Rust).

## 2026-06-21 12:20 — token-store-keychain-fallback-A2

Stack: React/TS/Vite + Tauri 2 keychain IPC. `src/lib/tokenStore.ts` bọc 3 invoke command (save_token/load_token/clear_token) trong try/catch — keychain reject (daemon down / ngoài Tauri / vitest) → fallback localStorage key `nib-auth-token`. clearToken LUÔN clear cả fallback (token lưu fallback không sót). `initTokenSync()` đăng ký onAuthStateChange (auth.ts) → SIGNED_IN save access_token / SIGNED_OUT clear — tách side-effect khỏi wrapper auth.ts.
Test: `vi.mock('@tauri-apps/api/core', ()=>({invoke: vi.fn()}))` + `vi.mock('./auth')` capture callback ref để test hook. localStorage.clear() mỗi beforeEach. Cover cả keychain-path (resolve) lẫn fallback-path (reject).
Done-criteria: tsc 0 · build 0 · vitest 72/72 (+10 mới). KHÔNG đụng src-tauri (glue đã xong A.2-Rust).

## 2026-06-21 12:27 — profileprovider-supabase-migration-A3logic

Migrate ProfileProvider local-only → Supabase-reactive (KHÔNG dùng @testing-library — repo test thuần pure-fn).
Pattern: tách `deriveProfile(session, stored): ProfileData|null` PURE trong profile-context.ts (session null→null guest; session→identity id/email từ Supabase user + stored override displayName/avatarColor/avatarImage layer trên; displayName fallback email local-part). Provider chỉ wire side-effect: useEffect mount → getSession()→setSession + onAuthStateChange→setSession + initTokenSync(); cleanup unsubscribe cả 2 + active-flag chống setState sau unmount. profile=useMemo(deriveProfile). Context value thêm `session`. ProfileData thêm `id?`.
Consumer guard: AccountSection `if(!profile) return null` (login UI = task kế); markup signed-in KHÔNG đổi → design-library không cần sync.
Done-criteria: tsc 0 · build 0 · vitest 76/76 (+4 deriveProfile: null/reflect/override/no-email). gitnexus index stale (contexts→providers rename) → impact thủ công qua grep: consumer = App.tsx (mount) + AccountSection (useProfile). Risk LOW.

## 2026-06-21 17:05 — loginmodal-gsap-rtl-A3build

LoginModal (auth overlay) + AccountChip + wire (accounts-cloud-sync A.3 build cuối). Stack: React/TS + GSAP (gsap@3.15 + @gsap/react@2.1) + RTL (@testing-library/react@16 + user-event@14).
- GSAP trong React: `useGSAP({scope, dependencies})` + `gsap.matchMedia()` 2 nhánh reduce/no-preference (reduced-motion BẮT BUỘC). CSS KHÔNG set transition opacity/transform khi GSAP sở hữu (tránh double-animate); data-open chỉ gate pointer-events.
- 1 panel 2 mode: render có ĐIỀU KIỆN theo state (KHÔNG [data-mode] CSS như mockup tĩnh); body `key={mode}` remount cho crossfade.
- LoginModal vào AppShell (loginOpen state, cạnh settingsOpen) → Workspace → UnifiedDock(onOpenLogin) → NavLevel(onAccount) → AccountChip. AccountChip signed-out=nib-dock__navbtn IconUser; signed-in=avatar disc + portal menu CLAMP viewport (mistakes.md floating).
- errorKey phải typed union (I18nKey subset), KHÔNG `string` — `t()` nhận I18nKey.
RTL trong vitest jsdom: (1) stub `window.matchMedia` VÔ ĐIỀU KIỆN trong setup (GSAP gọi `_win.matchMedia` trực tiếp — guard `'matchMedia' in window` chặn nhầm); (2) `afterEach(cleanup)` global tránh DOM leak giữa test.
BÀI HỌC bug: focus-on-open bằng `setTimeout(focus,60)` ĐUA với userEvent.type → đuôi password lọt vào email field ("ada@nib.appcretpw"). Fix: focus trực tiếp trong useEffect, BỎ setTimeout.
Done: tsc 0 · build 0 · vitest 82/82 (+6: 5 LoginModal +1 AccountChip) · 0 hex · i18n parity 192=192. design-library synced (snippet dock-nav-level + components.md §8 + INDEX MAPPING row).

## 2026-06-21 23:50 — yjs-provider-offline-first-lifecycle

Stack: Yjs 13.6 + @hocuspocus/provider 4.3 + y-indexeddb 9 + y-prosemirror 1.3 (Phase B.1). Versions trong ARCHITECTURE (^2) STALE — y-indexeddb không có major 2, hocuspocus ^2 là bản 2023; chọn major hiện hành coherent peer yjs ^13.6.
Pattern YjsProvider: `ydoc = useMemo(createYDoc(docId))` (singleton Map cache) → effect: guard indexedDB → persistence + `waitForSync` → `setReady(true)` (render children NGAY, không block WS) → nếu token: hocuspocus + sub 'synced'/'status'/'authenticationFailed' map syncStatus 'local'|'syncing'|'synced'|'error'. Cleanup: `provider.destroy()` (tự destroy websocket riêng qua event 'destroy') + `persistence.destroy()`. token=null → offline-only 'local'.
Hocuspocus v4 backoff (1000/×2/max30000) chỉ set được qua `HocuspocusProviderWebsocket` config (url-variant không nhận delay/factor) → tạo websocket riêng + tear down qua `provider.on('destroy')` để giữ contract "caller .destroy()".
Done-criteria: tsc 0 · build 0 · vitest 82/82 · YjsProvider render children token=null → syncStatus='local' 0 console error.

## 2026-06-22 00:34 — yjs-blockmeta-side-channel-b2

Stack: Yjs 13.6 Map-of-Y.Map side-channel (CC-1). `getBlockMetaMap(ydoc)` (top Y.Map) → mỗi block id = 1 Y.Map entry → field LWW per-key. yBlockMeta.ts: getBlockMeta (fallback DEFAULT_META khi entry chưa có = R3 race tolerance) / patchBlockMeta (tạo entry nếu thiếu, set từng field trong ydoc.transact, bỏ undefined) / initBlockMeta (idempotent: `if root.has(id) return` — gọi 2 lần không reset) / deleteBlockMeta.
useBlockMeta hook: `observeDeep` trên root map (bắt cả entry creation + field change) → setState(getBlockMeta) → re-render; resync trên mount/ydoc/id change. useYjsStatus = wrapper useYjs().syncStatus.
GUARD quan trọng: B.2 chỉ ADD BlockMetaRecord vào types/block.ts (thuần additive) — HOÃN bỏ 14 field khỏi NibBlockAttrs sang B.3 (NibBlock/View/blockActions còn ref → bỏ giờ vỡ tsc). Giữ gate xanh.
Test real Y.Doc (no mock): patch→get; concurrent merge 2 docs qua encodeStateAsUpdate/applyUpdate (key khác nhau không mất); init idempotent. Done: tsc 0 · build 0 · vitest 87/87 (+5).

## 2026-06-22 00:50 — yjs-cc1-migration-b3 (node-attr → blockMeta)

Stack: TipTap node strip + Y.Map side-channel migration (CC-1). NibBlock.addAttributes 17→3 ({id,blockType,starter}); 14 layout/CAS field → blockMeta. NibBlockView đọc qua `useBlockMeta(ydoc,id)` (destructure meta), ghi qua `patchBlockMeta(ydoc,id,...)`, BỎ HẲN updateAttributes (R1: grep updateAttributes NibBlockView=0). blockActions đổi signature: patchBlock(ydoc,id,attrs)/setBlockState(ydoc,id,state)/deleteBlock(editor,ydoc,id)/evalBlock(editor,ydoc,id) — evalBlock đọc latex từ getBlockMeta, ghi result qua patchBlockMeta.
SEQUENCING (B.3→B.5): gitnexus impact bắt patchBlock=CRITICAL/evalBlock=HIGH → callers Workspace/CommandPalette/UnifiedDock vỡ nếu đổi signature. Giải: (1) kéo slot `ydoc:Y.Doc|null` vào editor-context SỚM (phần nhỏ B.4); (2) mọi yBlockMeta fn + useBlockMeta TOLERATE ydoc null → DEFAULT_META/no-op; (3) Workspace `const ydoc=null` (1 điểm B.5 swap) + update 3 call sites; UnifiedDock/CommandPalette destructure ydoc từ context. App render DEFAULT_META giữa B.3→B.5 (chấp nhận, gate=tsc/vitest).
convertNibBlock: đơn giản về structural blockType-toggle (math→text carry PM textContent; latex↔text seeding qua meta = B.5, command không có ydoc). Tests cập nhật assert blockType-only.
Done: tsc 0 · build 0 · vitest 87/87 · R1 grep pass · detect_changes blast-radius đúng dự kiến (eval/patch/delete callers).

## 2026-06-22 00:56 — yjs-undo-extension-b4 (NibHistory→YjsSync)

Stack: thay PM history bằng y-prosemirror CRDT undo. `YjsSync` TipTap Extension<Options,Storage>: options `{xmlFragment: Y.XmlFragment|null}` (configure ở B.5), storage `{undoManager: Y.UndoManager|null}`. addProseMirrorPlugins: if !xmlFragment return [] (B.4→B.5 no-op); else `new Y.UndoManager(xmlFragment)` → store vào this.storage.undoManager → `[ySyncPlugin(xmlFragment), yUndoPlugin({undoManager})]`. addKeyboardShortcuts Mod-z/y/Shift-z → this.storage.undoManager?.undo()/redo() (khôi phục Ctrl+Z khi active).
Xóa NibHistory.ts làm mất editor.commands.undo/redo (augmentation) → CommandPalette + TopStrip + Workspace import/extensions ĐỀU vỡ → xử cùng session: TopStrip+CommandPalette gọi `editor.storage.YjsSync?.undoManager?.undo()/redo()` (optional-chaining, no-op tới B.5); Workspace gỡ import+extensions array (KHÔNG add YjsSync — B.5).
y-prosemirror v1.3: yUndoPlugin({undoManager}) cho phép truyền UndoManager riêng → expose qua storage. ySyncPlugin(fragment) returns any.
Done: tsc 0 · build 0 · vitest 87/87 · grep NibHistory=0 · grep undoManager TopStrip=2.

## 2026-06-22 01:03 — yjs-workspace-wiring-b5 (Phase B integration done)

Stack: wire YjsProvider + y-prosemirror vào Workspace (Phase B cuối). Tách Workspace (outer: useProfile→session, wrap `<YjsProvider key={docId} docId={activeDocId} userId={session?.user.id??'local'} token={session?.access_token??null}>`) + WorkspaceEditor (inner: `useYjs().ydoc` → `xmlFragment=ydoc.getXmlFragment('prosemirror')` → useEditor +`YjsSync.configure({xmlFragment})`, deps `[xmlFragment]`; ctx.ydoc=real).
GOTCHA y-prosemirror: ySyncPlugin điều khiển content từ Y.XmlFragment → `content:` của useEditor BỊ BỎ QUA. Phải seed starter VÀO ydoc khi rỗng: seedStarter guard CRDT flag `ydoc.getMap('docMeta').get('seeded')` (idempotent đa thiết bị) + chèn node id cố định qua `editor.schema.nodes.nibBlock.create` + `tr.insert(0,node)` + initBlockMeta. createBlock cũng initBlockMeta(lineIndex,xOffset) cho block mới (layout ở meta).
`key={docId}` trên YjsProvider để switch doc rebind sạch. signed-out token=null → offline-only y-indexeddb.
Done: tsc 0 · build 0 · vitest 87/87 · dev server ready 0 error · impact Workspace=LOW. Gate vàng 2-tab = USER smoke (hocuspocus local).

## 2026-06-22 05:25 — hocuspocus-server-supabase-persistence

Stack: server/ standalone Node+TS, @hocuspocus/server 4.3.0 (`new Server({...})`), @supabase/supabase-js 2.108, yjs 13.6. Phase C.1+C.2 accounts-cloud-sync.
Pattern persistence (W2 = TEXT base64, KHÔNG bytea vì PostgREST không round-trip Uint8Array→bytea):
- onLoadDocument trả Uint8Array → Hocuspocus tự `Y.applyUpdate` (xác nhận core dist dòng 1391: return Uint8Array → applyUpdate). Load = snapshot(.single) + updates(created_at>updated_at, asc) → Y.mergeUpdates([...]).
- onStoreDocument: Y.encodeStateAsUpdate → INSERT base64; count exact head; >50 → compaction fire-and-forget (void), try/catch log KHÔNG throw.
- E2 race: in-memory `Map<string,boolean>` lock per docId, skip nếu đang compact (single-instance Render free đủ; TODO pg_advisory_lock nếu scale).
- supabase client singleton service_role (bypass RLS), server-side only.
- /health W1: onRequest hook write end('OK') + return Promise.reject() để ngắt chain (Hocuspocus catch nội bộ, log sạch).
Done-criteria: tsc --noEmit 0; curl /health 200; grep gates pass. KHÔNG cần Supabase thật để tsc/grep verify.

## 2026-06-22 06:10 — hocuspocus-jwks-asymmetric-verify-c-fix

Stack: @hocuspocus/server 4.3 + jose 5. Supabase project mới ký access token bằng asymmetric ECC ES256 (JWT Signing Keys), KHÔNG phải HS256 legacy secret → verify HS256 luôn fail.
Pattern: bỏ jsonwebtoken; `const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))` ở MODULE SCOPE (lazy — KHÔNG fetch lúc tạo, chỉ fetch+cache+rotate khi jwtVerify lần đầu → boot không fail dù URL giả). Trong onAuthenticate: `try { ({payload}=await jwtVerify(token, JWKS)) } catch { throw Error('unauthorized') }`. JWKS endpoint public (không cần apikey header). Giữ guards cũ: payload.sub non-empty string (E4) + room R5 documentName.split(':')[0]===sub.
Done: tsc 0 · greps pass (createRemoteJWKSet/jwtVerify, jwks.json, 0 jsonwebtoken, 0 SUPABASE_JWT_SECRET) · boot env giả → curl /health 200 sạch. Gate vàng auth thật = C.3 USER smoke.

## 2026-06-22 06:30 — c3-client-wire-render-hocuspocus

Stack: client wire Yjs sync → Render Hocuspocus thật (accounts-cloud-sync C.3). VITE_HOCUSPOCUS_URL=wss://nib-2bdn.onrender.com (TLS wss:// cho server deploy, ws:// chỉ localhost). Token wire đã đúng sẵn từ Phase B — KHÔNG patch: yProvider.ts token→HocuspocusProvider options; YjsProvider.tsx prop token→createHocuspocusProvider chỉ khi truthy; Workspace.tsx token=session?.access_token??null. .env.local TẠO MỚI (gitignored, git check-ignore confirm) + placeholder VITE_SUPABASE_* cho user điền gate vàng. server/src/README.md: env vars (JWKS không cần secret), CC-2 cold-start (Render free spin-down 15ph → reconnect backoff tự xử), Manual Deploy (public repo không auto-deploy).
Done: build 0 · tsc 0 · vitest 87/87 · grep token 2 file pass. Gate vàng 2-tab sync = USER smoke (cần login Supabase thật).

## 2026-06-22 21:15 — phase-d-signout-per-user-idb-session-notice

Stack: React/TS — sign-out polish + per-user IndexedDB isolation (accounts-cloud-sync Phase D). Cloud PARKED local-only → IDB là bản sao DUY NHẤT → KHÔNG bao giờ deleteDatabase khi logout.
- **Per-user IDB namespace**: pure `idbStoreName(docId, userId)` trong yPersistence.ts → signed-in `nib-ydoc-u-${sanitize(userId)}__${docId}`, guest/`local`/null → legacy `nib-ydoc-${docId}` (backward-compat data cũ không mất). userId đã có sẵn prop YjsProvider + trong effect deps → switch user re-bind sạch, KHÔNG đụng signature caller ngoài. createIndexeddbPersistence thêm param optional thứ 3 (backward-compatible) → impact HIGH (core render path) nhưng chỉ 1 call site thật (YjsProvider start). Pure fn unit-test (+3) cover key safety.
- **Intentional vs involuntary sign-out**: module-level flag trong `useSessionExpiredNotice.ts` — `signOutIntentional()` set flag rồi gọi auth.signOut; `consumeIntentionalSignOut()` read-and-reset trong onAuthStateChange SIGNED_OUT handler. Flag false → session expired → banner. SIGNED_IN clear banner. AccountChip + AccountSection ĐỀU gọi signOutIntentional (KHÔNG signOut trực tiếp) để né false-positive notice.
- **SettingsContext mở rộng onClose**: AccountSection cần đóng overlay sau sign-out → thêm `onClose` vào SettingsContextValue (đã có {activeId,setActiveId}), SettingsOverlay provide. Tránh prop-drill, giữ props overlay {open,onClose}.
- **Banner**: render trong AppShell (top-level, có sẵn setLoginOpen), fixed bottom-centre z-70 (trên dock 30, dưới login 90/100), token --warning/--error/--accent, hit-target action 44px, dismiss reuse library.cancel.
- Hit target nút Đăng xuất 44px [LOCKED]. i18n 3 key mới (settings.account.sign_out/local_hint + auth.session_expired) parity en=vi=195.
- design-library: AccountChip đổi logic-only (signOut→signOutIntentional, DOM/class không đổi) → KHÔNG sync snippet. AccountSection thêm 3 class mới → cập nhật components.md §3 (no-snippet, chỉ class list).
Done: tsc 0 · build 0 · vitest 90/90 (+3) · grep deleteDatabase=0 · 0 hex rời · detect_changes scope khớp 3 phase.

## 2026-06-25 08:35 — wipe-typing-layer-leave-build-green
Khi gỡ trọn một subsystem editor (free-caret row/nibBlock + caret/clipboard/meta) mà vẫn giữ build xanh:
- Map phụ thuộc bằng grep importer TRƯỚC khi xoá (chính xác hơn impact cho wholesale-removal): `grep -rln "<module>" src | grep -v "<self>"`.
- Schema tối thiểu thay cho cái bị gỡ: NibDocument `content:'block*'` + NibParagraph (group block, content inline*) + NibTextNode (group inline) tự định nghĩa bằng `@tiptap/core` Node.create (repo CHƯA cài @tiptap/extension-paragraph/document/text — chỉ có core/pm/react). Giữ YjsSync.safeEmptyDocPlugin vì crash empty-doc selection là schema-agnostic (content.size===0), KHÔNG phải đặc thù row.
- Giữ contract cho consumer còn sống: `migrateIfNeeded` → noop trả `{status:'v2-existing'}` (YjsProvider await nó); stub no-op các command đã gỡ (onCalc/onConvert/calc) kèm `// TODO rebuild typing`.
- Sau khi bỏ destructure context (ydoc/activeBlockId) phải sửa luôn deps array của useMemo/useCallback nếu không noUnusedLocals + ref undefined sẽ fail tsc.
- Xoá import CSS trỏ tới file đã xoá (Canvas `row-view.css`) nếu không Vite build vỡ. Orphan .tsx (MathField) compile OK nếu import của nó còn resolve — không cần xoá.
- Gate: tsc 0 · vitest 67/67 · build exit 0. Xoá test gắn schema cũ (block/row/caret/migration/r1-proof); giữ geometry.test+canvasLayout.test (pure math, không coupling).

## 2026-06-25 14:25 — spacer-atom-side-channel-nodeview (free-caret-v2 A.1)
Path B "spacer-atom" schema — inline LEAF có width float KHÔNG nằm trên PM node attr (né bug y-prosemirror CC-1):
- **Node**: `Node.create<Opts>({ name:'spacer_atom', group:'inline', inline:true, atom:true, selectable:false })`. Attr DUY NHẤT `{id}` static, persist qua `parseHTML: el.getAttribute('data-id')` + `renderHTML: id ? {'data-id':id}:{}`. parseHTML tag `span.nib-spacer`. atom:true + không content = leaf.
- **Width side-channel**: `Y.Map<number>` keyed by atom-id, key const trong yjs.ts (`SPACER_WIDTHS_MAP='nib-spacer-widths'`); wire qua `useMemo(()=>ydoc.getMap<number>(KEY),[ydoc])` trong Workspace + `Extension.configure({spacerWidthMap})`. Map sống trên cùng ydoc → persist/sync cùng doc, ySyncPlugin KHÔNG serialize map (tách fragment).
- **NodeView class** (export cho test, KHÔNG dùng React NodeView cho leaf đơn giản): constructor đọc `widthMap.get(id)??0` set initial `span.style.width`; `widthMap.observe(this._observer)`. Observer = `requestAnimationFrame(()=>{ const w=map.get(id)??0; if(w!==currentW){dom.style.width=w+'px'; currentW=w;} })` — guard new≠old + rAF tránh write-loop (R2/CC-6). `destroy(){ widthMap?.unobserve(this._observer) }` BẮT BUỘC (E3 StrictMode double-mount leak). `ignoreMutation()→true` (leaf, DOM không bubble vào PM). `_observer` là instance field (cùng ref cho observe+unobserve).
- **null-safe**: Options `spacerWidthMap: Y.Map|null` (null→render 0-width, skip observe) → extension mount được trước khi YjsProvider wire.
- **Test deterministic không cần editor mount**: export NodeView class, `new SpacerNodeView({attrs:{id}} as PMNode, map)`, stub `requestAnimationFrame` chạy sync (`vi.stubGlobal('requestAnimationFrame', cb=>{cb(0);return 0})`) → `map.set(id,N)` fires Yjs observer sync → assert `dom.style.width`. E3 test: `view.destroy(); map.set(id,200); expect width unchanged`.
- **Schema content**: NibParagraph `'inline*'`→`'(spacer_atom | text)*'` (cả hai group inline → explicit form). Additive, không phá WorkspaceEditor signature.
Gate: tsc 0 · vitest 74/74 (+7) · build exit 0 · 0 hex rời.

## 2026-06-25 14:28 — virtual-caret-ephemeral-plugin-e1-no-clobber (free-caret-v2 A.2)
Ephemeral UI-state PM plugin (caret/cursor) sống chung với y-prosemirror sync mà KHÔNG bị remote tx xoá:
- **E1 invariant (cốt tử)**: `state.apply(tr, prev) => tr.getMeta(pluginKey) ?? prev`. State CHỈ đổi khi tx mang meta của plugin. Mọi tx khác — đặc biệt remote Yjs sync tx (ySyncPlugin dispatch khi update tới, KHÔNG có meta của ta) — giữ nguyên state. Đây là fix gốc vs row-based ghost-park cũ (caret tắt giữa chừng khi collaborator gõ). Test bắt buộc: activate → `state.apply(state.tr.insertText('x',1))` (tx không meta) → state vẫn active + giữ field.
- **set/clear = dispatch meta tx**: `view.dispatch(view.state.tr.setMeta(key, nextState))`. INACTIVE là object const tái dùng.
- **Decoration-only render**: `props.decorations(state)` → active → `DecorationSet.create(doc,[Decoration.widget(pos, ()=>domNode, {side:1,key})])`; inactive → `DecorationSet.empty`. Widget factory `()=>HTMLElement` CHỈ chạy lúc view render → unit-test decorations() KHÔNG cần jsdom DOM (chỉ đếm `.find().length`). Containment: span absolute + `.nib-pm p{position:relative}`.
- **handleClick return false [LOCKED FIX]**: phát hiện gap (`clientX > coordsAtPos(pos).right + THRESHOLD`) → setVirtualCaret(pos, clientX-viewLeft, clientX) NHƯNG `return false` để PM tự set TextSelection(pos) VALID. TUYỆT ĐỐI KHÔNG setSelection thủ công ở pos ảo (chỗ ghost-park cũ park selection cấp-doc → IME/insert crash). Guard `if(pos<1) return false` (E2: pos 0 = doc root, coordsAtPos throw).
- **Test plugin không cần TipTap/Yjs mount**: dựng PM `Schema` tối thiểu (doc/paragraph/text) + `EditorState.create({schema,doc,plugins:[createPlugin()]})` → apply tx trực tiếp. Nhẹ + tất định.
- **CSS caret**: `var(--accent)` (KHÔNG hex rời) + `@media(prefers-reduced-motion:reduce){animation:none}` (accessibility [LOCKED]) + height-cap `calc(1em+4px)` top:0 (E6 không đẩy line box).
Gate: tsc 0 · vitest 79/79 (+5 incl E1) · build 0 · 0 hex.

## 2026-06-25 14:33 — materialize-on-input-single-tx + ime-compositionstart (free-caret-v2 A.3, gate vàng)
Biến virtual-caret ảo thành nội dung thật khi gõ — KHÔNG park PM-selection ở pos vô lệ (fix gốc bug ghost-park IME row-based cũ):
- **materialize() = 1 PM transaction DUY NHẤT** (tất định, undo 1 bước): `gap = max(0, virtualXClient − coordsAtPos(lineDocPos).right)`; nếu `gap ≥ THRESHOLD(4)` → `widthMap.set(id, gap)` **TRƯỚC `view.dispatch`** (NodeView mới đọc initial width đúng ngay frame đầu) → `tr.insert(lineDocPos, schema.nodes.spacer_atom.create({id}))` → insertPos=lineDocPos+1 (spacer nodeSize=1); nếu char≠'' → `tr.insertText(char, insertPos)`; `tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos)))`; `tr.setMeta(virtualCaretKey, INACTIVE)` (clear caret CÙNG tx); `dispatch(tr)`. gap<threshold → bỏ spacer, insert char tại lineDocPos (merge tự nhiên).
- **handleKeyDown printable → return TRUE**: `materialize(...)` rồi return true để PM KHÔNG insert lần nữa vào selection của nó (tránh double/sai chỗ). Escape→clear+true. Arrow/Enter/Tab (Phase A)→clear+false (nav thật Phase B).
- **compositionstart (IME R3 fix) → return FALSE, KHÔNG preventDefault**: vc.active → `materializeGap` (=materialize char='') insert spacer + đặt selection HỢP LỆ tại pos thật → return false → browser IME compose vào PM selection thật. KHÁC ghost-park cũ (park selection cấp-doc → IME crash "TextSelection endpoint not pointing into inline content"). materializeGap chạy trong handleDOMEvents.compositionstart (editorProps), KHÔNG window listener (race PM↔window).
- **Test materialize không cần TipTap mount**: PM Schema tay có `spacer_atom` (group inline, inline:true, atom:true, attrs{id}); mock view `{ get state(), coordsAtPos:()=>({right:100}), dispatch:tr=>state=state.apply(tr), dom }`; vcState{lineDocPos, virtualXClient}; assert widthMap.values()/spacerCount(descendants)/doc.textContent/selection.from. crypto.randomUUID đã polyfill trong test/setup.ts.
- **measureSpaceWidth**: `canvas.getContext('2d').measureText(' ')` font từ `getComputedStyle(view.dom).font`, fallback 7px khi ≤0 (font chưa load) — KHÔNG magic CHAR_W=7 cứng. (Dùng ở Phase B nav.)
Gate: tsc 0 · vitest 84/84 (+5) · build 0 · 0 hex. Phase A (A.1+A.2+A.3) logic hoàn tất; visual/IME = browser gate (tester Playwright).
