# ARCHITECTURE — Free-Caret Rebuild (Hướng C)

> Thiết kế HOW cho rebuild editor Nib sang **free-caret document row-based**. Giải 6 rủi ro blocking R1–R6 (xem `../ROADMAP.md`). Output của Phase A (architect); implementer Phase B+ build theo file này, KHÔNG đoán thêm.
>
> Trạng thái: **§1–§7 lead-gate PASS (2026-06-23, Session A.1 + A.2). Phase A ĐÓNG → unlock Phase B.**

---

# §1 — PM Schema (row-based, mới)

## Đảo chốt cốt lõi vs schema cũ

- **Schema cũ**: `doc(content: nibBlock*)` → mỗi `nibBlock` (group:block, content:`inline*`, defining) LÀ một biểu thức, đặt tự do tại (xOffset,lineIndex) tuyệt đối, **doc order vô nghĩa**, MathLive chiếm cả block. Caret KHÔNG đi xuyên giữa các block.
- **Schema mới**: `doc(content: row*)` → **doc order = thứ tự đọc dọc (trên→dưới)**; mỗi `row` = một CHUỖI editable liên tục chứa text + math atom inline; caret văn bản thật đi xuyên text↔math↔text tuyến tính (PM linear selection khớp tự nhiên vì order = vertical order). Math từ "là block" → thành **inline atom** (một đơn vị trong nhiều đơn vị của row).

## Node types (attribute TỐI THIỂU mỗi node)

1. **`doc`** (giữ file `NibDocument`, topNode) — `content: 'row*'` (zero-or-more → canvas trống hợp lệ, y hệt `nibBlock*` cũ). KHÔNG paragraph wrapper.

2. **`row`** (NEW — thay vai chứa-dòng của nibBlock) — `group: 'block'`, `content: '(text | mathInline)*'`, `defining: true`, `draggable: false`, `selectable: false`. **Attr structural DUY NHẤT: `{ id }`** (set 1 lần lúc tạo, không bao giờ mutate → an toàn với CC-1). NodeView React (`RowView`, thay `NibBlockView`) chỉ làm: (a) định vị dọc theo rowMeta, (b) host ghost-caret (Phase D/R2). Layout dòng (blankBefore, indent) sống ở **rowMeta side-channel** (xem §2), KHÔNG ở attr.

3. **`mathInline`** (NEW — math atom inline) — `group: 'inline'`, `inline: true`, `atom: true`, `selectable: true`, `draggable: false`. **Attr structural: `{ id }`** (static). `atom:true` ⇒ PM coi nó là 1 đơn vị mờ (caret đứng trước/sau; đi VÀO trong = dual-caret handoff Phase D/R2, C1 đã chốt = CÓ). LaTeX + kết quả CAS sống ở **blockMeta** (TÁI DÙNG map cũ) keyed theo atom-id. NodeView = MathLive `<math-field>` inline (Phase D dựng — `MathField.tsx` adapt từ full-editor sang inline atom + bỏ 2 nút ☰/⌨).

4. **`text`** (giữ `NibText`, node built-in `text`, group:inline) — ký tự user gõ thật + marks. Khác cũ: cũ text chỉ là filler ẩn trong math block; nay text là **nội dung hạng nhất của row** (prose thật + B/I/U/S).

5. **Marks** — giữ `NibBold/NibItalic/NibUnderline/NibStrike` áp cho text (feature §7.5.2). Math KHÔNG nhận mark (phá nghĩa toán). `textScale`/`mathSize` → khuyến nghị thành mark trên text / blockMeta của atom (granularity để Phase sau, KHÔNG chặn A.1).

6. **Kết quả CAS = KHÔNG phải node riêng** — render bởi NodeView của `mathInline` từ blockMeta của chính atom đó (exactLatex/approxLatex/isApprox/blockState, qua `ResultView`/`mathMarkup` như hiện tại nhưng inline). Giữ đúng [LOCKED Phase B] "kết quả = phần của block, persist+sync CÙNG block". Kết quả dài (feature §6) wrap xuống dòng kẻ kế = CSS (inline-block wrap), row claim thêm dòng — concern render, không phải schema.
   - **QUYẾT ĐỊNH 1-đường-render:** ca Tính selection trải NHIỀU atom → kết quả gắn vào **atom CUỐI trong range** (blockMeta atom đó nhận result, NodeView atom đó render inline sau). KHÔNG có node `result` tách rời → tránh node non-editable lọt vào luồng caret (caret không bao giờ "kẹt" trong kết quả). (Cơ chế extract chi tiết ở §7/A.2; schema A.1 chỉ cần biết result KHÔNG là node.)

## Cây doc mẫu (1 row có text + 1 math atom + result)

```
doc
└─ row  (id="r1")                         [rowMeta r1: { blankBefore: 1, indent: 56 }]
   ├─ text "2x + "                         (marks: none)
   ├─ mathInline (id="m1")                 [blockMeta m1: {
   │                                          latexContent: "\\int f\\,dx",
   │                                          blockState: "result-exact",
   │                                          exactLatex: "F(x)+C",
   │                                          approxLatex: "", isApprox: false }]
   │      └─(NodeView render inline: ∫f dx = F(x)+C ; "F(x)+C" màu --result)
   └─ text " + 3"
```

Chuỗi user cảm nhận: `2x + ∫f│dx + 3` — math atom là 1 đơn vị caret xuyên qua.

## Bảng khác biệt cô đọng

| Cũ (block free-placement) | Mới (row-based free-caret) |
|---|---|
| doc `nibBlock*`, doc order vô nghĩa | doc `row*`, doc order = thứ tự dọc |
| nibBlock content `inline*`, NodeView = cả-block, MathLive fill block | row content `(text\|mathInline)*`, NodeView = line container + ghost host |
| Math = chính block (MathField full editor autofocus) | Math = `mathInline` atom inline (1 trong nhiều) |
| Vị trí: blockMeta {xOffset,lineIndex} tuyệt đối, CSS absolute | Vị trí: rowMeta {blankBefore,indent}; dọc=doc order; chỉ leading offset ảo |
| 1 block = 1 expr; caret không xuyên block | 1 row = chuỗi liền; caret xuyên text↔math↔text |
| blockMeta keyed block-id | blockMeta keyed **math-atom-id** (tái dùng, bỏ xOffset/lineIndex) + NEW rowMeta keyed row-id |
| `text` chỉ filler ẩn trong math block | `text` hạng nhất trong row + marks |

---

# §2 — Y.Doc Structure + Whitespace (giải R1)

## Shared types trong Y.Doc (per docId, `src/lib/yjs.ts`)

- **`XmlFragment "prosemirror"`** (giữ const `PROSEMIRROR_FRAGMENT`) — bind bởi `ySyncPlugin` (extension `YjsSync`, không đổi cơ chế). Nay chứa cây `row > (text | mathInline)` thay `nibBlock`. y-prosemirror sync: text+marks trong row (thế mạnh lõi, tin cậy), `mathInline` = XML element rỗng có attr `id` static (atom, no child), `row` sequence + attr `id` static. **Mọi attr trên PM node đều static (id) ⇒ KHÔNG dính bug CC-1** (CC-1 là về attr MUTATE, không phải id set-once — khớp code Phase B đang chạy: nibBlock {id,blockType,starter} static sync OK).
- **`Map "blockMeta"`** (giữ const `BLOCK_META_MAP`, file `yBlockMeta.ts`) — **TÁI DÙNG**, nay keyed theo **math-atom-id**. Giữ field math/CAS: latexContent, blockState, exactLatex, approxLatex, isApprox, errorKind, mathSize, color, inkStrokes. **BỎ xOffset + lineIndex** (atom inline không có xy độc lập — vị trí suy từ row layout + text flow). `DEFAULT_META` bỏ 2 field đó; bridge get/patch/init/deleteBlockMeta + hook `useBlockMeta` tái dùng gần như nguyên văn.
- **`Map "rowMeta"`** (NEW — const `ROW_META_MAP='rowMeta'`, file mới `yRowMeta.ts`) — keyed theo **row-id**. Giá trị `Y.Map { blankBefore: number, indent: number }` (+ tương lai rowColor/claimedLines nếu cần). Side-channel layout của row, **soi gương pattern blockMeta của Phase B** (field layout mutate → giữ NGOÀI PM attr). Cần bridge `yRowMeta.ts` (getRowMeta/patchRowMeta/initRowMeta/deleteRowMeta, ghi trong `ydoc.transact()`, init idempotent) + hook `useRowMeta` — copy nguyên khuôn blockMeta đã proven (kể cả R3 race tolerance: render DEFAULT_ROW_META tới khi entry tới rồi re-render qua observer).
- **`Map "docMeta"`** — giữ (cờ `seeded` của `seedStarter`).

## y-prosemirror binding (không đổi nền tảng Phase B)

`YjsSync.configure({ xmlFragment })` → `[ySyncPlugin(xmlFragment), yUndoPlugin({undoManager})]`, `Y.UndoManager(xmlFragment)`. Pattern Phase B mở rộng SẠCH: structure/text/atom sync qua y-prosemirror; layout/latex/result mutate qua Y.Map LWW-per-key (offline-first IndexedDB + Hocuspocus WS giữ nguyên). KHÔNG cần đổi YjsProvider/yProvider/yPersistence.

## Whitespace strategy (R1 — lõi của §2)

**Nguyên tắc:** Nib chỉ lưu glyph user GÕ THẬT. Mọi khoảng-trống caret-tới-được (mọi cột, mọi dòng) là **ẢO** — biểu diễn bằng metadata vị trí thưa, KHÔNG fill literal space/newline, KHÔNG materialize grid. (= IntelliJ virtual-space, áp 2D.)

Ba loại khoảng-trống & cách biểu diễn KHÔNG-fill:

1. **Gap dọc (dòng kẻ trống giữa/trên các row có nội dung):** KHÔNG lưu thành `row` rỗng. Mỗi content-row mang **`blankBefore`** (số dòng kẻ trống ngay trên nó) trong rowMeta. Dòng tuyệt đối = running-sum. **Doc trống = 0 row.** Click dòng 10 trên doc trống rồi gõ → tạo ĐÚNG 1 row, blankBefore phản ánh 10 dòng trên. Chi phí: 1 row + 1 rowMeta. KHÔNG 10 row rỗng.
   - *Đã cân nhắc & loại:* `lineIndex` tuyệt đối/row — loại vì chèn 1 dòng phía trên buộc renumber mọi row sau (N write, thù địch CRDT-merge). blankBefore = O(1) write/insert, merge-an-toàn.

2. **Leading offset ngang (caret ở cột 20 trên row vốn rỗng):** KHÔNG lưu 20 space. Lưu **`indent`** (px hoặc số-cột) trong rowMeta; text row bắt đầu sau indent. Click cột 20 dòng trống + gõ → set indent, chèn glyph ở đầu content row. Chi phí: 1 field rowMeta. KHÔNG 20 space.

3. **Whitespace trong/cuối row (caret đậu QUÁ cuối text của row non-empty, rồi gõ):** CA DUY NHẤT có thể synth literal space — và CHỈ khi user thật sự commit glyph ở đó (đúng semantic IntelliJ). Synth 1 lần, bounded bởi CỘT user chọn (không phải width trang), space thành content thật (user CHỦ Ý có gap). Trước khi gõ, caret-quá-cuối là ghost render-only (Decoration.widget, Phase D/R2) — KHÔNG persist gì. *Nhiều cụm nội dung 1 dòng* dùng các space bounded này HOẶC (ưu tiên) row thứ 2 — chi phí luôn bounded bởi hành động user, không bao giờ bởi kích thước grid.

**Caret-position KHÔNG persist:** cột/dòng của caret khi đậu ở virtual space là **state UI phù du** (PM selection + ghost Decoration, Phase D/R2), KHÔNG ghi vào Y.Doc. Chỉ khi user commit nội dung thì row/indent/blankBefore mới vật chất hoá → doc trống vẫn trống qua reload; KHÔNG persist con trỏ (tránh bloat).

**R1 PROOF (gate đo được, Phase B test PHẢI có):**
- Y.Doc mới + editor rỗng → `getXmlFragment('prosemirror').length === 0`, `rowMeta.size === 0`, `blockMeta.size === 0`; `Y.encodeStateAsUpdate(ydoc).byteLength` ở mức **vài chục byte** (chỉ cấu trúc doc), KHÔNG ~180KB.
- Click dòng 50, cột 30, gõ "x": ĐÚNG 1 row node + 1 rowMeta {blankBefore≈50, indent≈30×charWidth} + 1 char. Assert `XmlFragment.length===1`, không có space synth / row rỗng.

## §1/§2 — Rủi ro kỹ thuật (cụ thể)

**RỦI RO CHÍNH — y-prosemirror × inline atom × blockMeta (CC-1 mở rộng sang atom inline):** Phase B blockMeta keyed theo BLOCK top-level mà y-prosemirror tạo/xoá nguyên khối → vòng đời id đơn giản. Nay `mathInline` atom được tạo/xoá BÊN TRONG inline content của row qua giao dịch sửa-text thường (gõ, backspace, paste, undo). 3 failure mode + mitigation BẮT BUỘC giải ở Phase B:
1. **Orphan blockMeta khi xoá atom:** backspace 1 math atom xoá PM node NHƯNG không xoá blockMeta entry → leak / kết quả cũ tái xuất nếu id tái dùng. Mitigation: ProseMirror `appendTransaction`/plugin diff id mathInline created-vs-deleted mỗi tx → gọi initBlockMeta/deleteBlockMeta (và init/deleteRowMeta cho row). KHÔNG dựa NodeView unmount đơn thuần — remote delete của y-prosemirror không fire NodeView lifecycle local định-đoạt được.
2. **Undo tái dùng atom id:** yUndoPlugin phục hồi atom đã xoá → re-insert ĐÚNG id cũ; blockMeta phải còn hoặc tái tạo. Khuyến nghị: KHÔNG xoá blockMeta đồng bộ ngay khi atom bị remove trong cửa sổ undo-able; GC orphan meta LAZY (quét entry có id vắng mặt trong doc). Test Phase B: gõ math→result→backspace atom→undo ⇒ kết quả còn nguyên.
3. **CC-1 vẫn ràng buộc:** KHÔNG đặt latex/result/blankBefore/indent lên PM attr (chỉ id static) — verify bằng grep/test Phase B (giống assertion Phase B §E R1: patch field chỉ chạm Y.Map, `node.attrs` không có key layout/latex).

**RỦI RO PHỤ — whitespace round-trip khi merge cộng tác:** 2 device gõ cùng cột-ảo của cùng dòng-trống mới → mỗi bên synth indent/space độc lập → merge: indent LWW (1 thắng) nhưng nếu 1 bên synth literal space còn bên kia set indent → row double-offset / lệch. Mitigation: chọn 1 biểu diễn/row tất định (row-rỗng-edit-đầu → indent; mọi edit sau → literal) + document precedence để 2 client hội tụ; thêm merge test.

---

# §3 — Migration Strategy (giải R3)

## Vấn đề gốc
Old store IDB (`nib-ydoc-${docId}` guest / `nib-ydoc-u-${safe}__${docId}` signed-in — qua `idbStoreName()`) chứa Y.Doc với XmlFragment "prosemirror" gồm node **`nibBlock`** + Map "blockMeta" {xOffset,lineIndex,latexContent,...}. Schema mới KHÔNG định nghĩa `nibBlock` → nếu để `ySyncPlugin` bind thẳng XmlFragment cũ với schema mới ⇒ ProseMirror drop/parse-fail node lạ ⇒ **MẤT DỮ LIỆU / crash**. Đây là R3.

## (a) DETECT — phân biệt old vs new (chạy SAU waitForSync, TRƯỚC khi bind editor)
Flow mở doc: `createYDoc(docId)` → `createIndexeddbPersistence(ydoc,docId,userId)` → `waitForSync` (ydoc đã hydrate từ IDB) → **inspect**:
- Stamp version: doc mới (post-rebuild) ghi `docMeta.set('schemaVersion', 2)` lúc seed. Đọc `version = ydoc.getMap('docMeta').get('schemaVersion')`.
- **version ≥ 2** → schema mới, KHÔNG migrate, bind editor bình thường.
- **version absent + XmlFragment.length===0 + blockMeta.size===0** → doc TRỐNG mới tinh → chỉ stamp schemaVersion=2, bind bình thường (không có gì để convert).
- **version absent + (XmlFragment có child nodeName==='nibBlock' HOẶC blockMeta.size>0)** → **OLD schema có dữ liệu** → MIGRATE. (Detect bằng quét nodeName child top-level XmlFragment cũ — robust kể cả khi docMeta thiếu.)

## (b) CONVERT path (chỉ khi old-có-data)
KHÔNG bind editor vào doc cũ. Tạo **Y.Doc thứ 2 `newDoc` (in-memory)** rồi build:
1. Đọc blocks cũ: iterate child XmlFragment cũ; mỗi `nibBlock` lấy attr {id,blockType,starter} + `oldMeta = oldDoc.blockMeta.get(id)` {xOffset,lineIndex,latexContent,blockState,exactLatex,approxLatex,isApprox,errorKind,mathSize,color,inkStrokes}.
2. **Sort theo (lineIndex asc, xOffset asc)** = thứ tự đọc → thứ tự row.
3. Build rows (MVP-safe: **1 block cũ → 1 row mới**; layout remap xấp xỉ — chấp nhận vì free-placement→row-based vốn là remap không gian, DỮ LIỆU latex/result/text giữ NGUYÊN):
   - math block → `row[ mathInline{id} ]`; copy oldMeta **trừ {xOffset,lineIndex}** vào `newDoc.blockMeta[id]`; `newDoc.rowMeta[rowId] = { blankBefore: lineGap, indent: xOffset }`.
   - text block → `row[ text(oldTextContent) ]`; rowMeta.indent = xOffset.
4. **Build cụ thể (tránh hand-encode XmlFragment):** dựng PM JSON doc theo schema MỚI rồi `prosemirrorJSONToYDoc(newSchema, pmJSON, 'prosemirror')` → XmlFragment sạch; rowMeta/blockMeta set qua `initRowMeta/initBlockMeta`.

## (c) PERSIST mới + PRESERVE cũ — HARD CONSTRAINT
- Ghi `newDoc` vào **store IDB MỚI có version suffix**: `${idbStoreName(docId,userId)}__v2` (store cũ KHÔNG đụng = backup). y-indexeddb là append-update; ghi nội dung mới vào CÙNG store còn update `nibBlock` cũ → Y.Doc chứa CẢ HAI = corrupt. Tách store ⇒ tự động thoả "không ghi đè store cũ trước verify".
- `waitForSync` store v2 → **VERIFY**: số mathInline+text rows == số block cũ; số key blockMeta bảo toàn; sample latexContent khớp.
- **Chỉ khi verify PASS**: set cờ "docId dùng v2" (localStorage registry `nib-migrated-v2:${storeName}=1`) → bind editor vào newDoc/store v2.
- **TUYỆT ĐỐI KHÔNG `indexedDB.deleteDatabase(oldStore)`** — store cũ tồn tại vĩnh viễn làm backup (cleanup = feature tương lai có user-consent riêng).

## (d) FALLBACK (convert throw / verify FAIL)
- KHÔNG đụng store cũ. KHÔNG ghi v2 dở. Mở editor trên **doc rỗng schema mới** (app không crash) + notice non-destructive (i18n key mới `migration.failed_preserved` en/vi) + nút "Thử lại". Dữ liệu cũ 100% nguyên trong store cũ.

## (e) TEST MATRIX (≥3 case — Phase B bắt buộc)
| Case | Old store | Expected new |
|---|---|---|
| C1 empty old | XmlFragment.len=0, blockMeta empty, no schemaVersion | stamp schemaVersion=2; 0 row; KHÔNG ghi migration; store cũ nguyên |
| C2 old text | 1 nibBlock text "Bài 1" @(line2,x40) | 1 row[text "Bài 1"]; rowMeta{blankBefore=2,indent=40}; store cũ nguyên; v2 tạo |
| C3 old math+result | nibBlock math, blockMeta{latex="\\int x^2 dx", exact="\\frac{x^3}{3}+C", state=result-exact, x56,line1} | 1 row[mathInline{id}]; newBlockMeta[id]={latex,exact,state...} (bỏ x/line); rowMeta{blankBefore=1,indent=56} |
| C4 convert-fail | node lạ/corrupt | KHÔNG ghi v2; store cũ nguyên; editor mở rỗng + notice + retry |
- Assertion chung: spy `indexedDB.deleteDatabase` **NEVER** gọi; store cũ còn liệt kê sau mọi migrate.

---

# §4 — Dual-Caret Design (giải R2)

## Hai caret & nguyên tắc 1-caret-tại-1-thời-điểm
1. **PM text caret** — gõ trong row text. 2. **MathLive internal caret** — khi sửa trong math atom. CHỈ 1 caret hiện + handoff sạch.

## Ghost caret (PM `Decoration.widget`)
- Plugin `caretGhost` render `<span class="nib-ghost-caret">` (CSS blink, màu `--caret`) tại vị trí cần.
- **Vai trò chính = virtual-space parking**: PM selection luôn ở vị trí THẬT (giữa char/node). "Caret cột 40 khi text hết ở cột 5" KHÔNG biểu diễn được trong PM → PM caret ghim cuối-text (cột 5), **ghost vẽ ở cột-ý-định 40** (x = indent/col×charWidth) tới khi user gõ → materialize (set indent nếu row rỗng / synth space nếu trailing — §2). Tương tự caret trên dòng-kẻ-trống.
- **Render conditions**: hiện khi selection COLLAPSED + `mathFocusActive===null` + (editor focus HOẶC đang virtual-park). Ẩn khi math atom focus / có selection range.
- Native caret cho vị trí text thật (`caret-color: var(--caret)` trên `.nib-pm`); ghost chỉ bù virtual-space + cửa sổ MathLive blur. Khi mathFocusActive → `.nib-pm{caret-color:transparent}` tạm (tránh 2 caret).

## Handoff ENTER atom (3 trigger) — né bug 9021
Bug: focus `<math-field>` trong NodeView làm PM clear selection / fight focus. Mitigation: NodeView mathInline `stopEvent`→true cho event nội bộ MathLive, `ignoreMutation`→true cho DOM mutation nội bộ atom. Thứ tự:
- (a) **Click atom**: PM NodeSelection trên mathInline (selectable:true) → focus `<math-field>` + caret MathLive tại toạ độ click (`mf.setCaretPoint(clientX,clientY)`; fail → caret cuối).
- (b) **Right arrow** khi PM caret NGAY TRƯỚC atom: keymap → `setNodeSelection(atomPos)` → focus, caret MathLive **START (pos 0)**.
- (c) **Left arrow** khi PM caret NGAY SAU atom: → `setNodeSelection(atomPos)` → focus, caret **END**.
- Mọi trigger thứ tự BẮT BUỘC: (1) set `mathFocusActive=atomId` (ghost ẩn + bỏ qua PM blur sắp tới, KHÔNG clear selection), (2) `setNodeSelection` (PM neo), (3) `mf.focus()` trong **requestAnimationFrame** (defer để PM commit tx selection trước → né race 9021), (4) đặt caret MathLive.

## Handoff EXIT atom (2 trigger) — trong keydown handler MathField inline
- **Left arrow** khi `mf.position===0`: preventDefault+stopPropagation → blur math-field → PM `TextSelection` NGAY TRƯỚC atom (pos=atomPos) → `mathFocusActive=null` → PM focus lại, ghost hiện.
- **Right arrow** khi `mf.position===last`: → PM `TextSelection` NGAY SAU atom (pos=atomPos+1) → clear flag.
- Thứ tự: (1) preventDefault MathLive, (2) `mathFocusActive=null`, (3) `editor.view.focus()`, (4) dispatch setTextSelection — restore PM focus TRƯỚC set selection (né dispatch khi editor unfocused → 9021).

## Edge: click GIỮA nội dung atom (C2)
NodeView selectNode + focus math-field + `mf.setCaretPoint(clientX,clientY)` (caret đáp đúng nơi click trong công thức). unavailable/false → fallback caret-cuối.

## Bảng sync order
| Hành động | Thứ tự event |
|---|---|
| Enter (click/arrow) | flag=atomId → setNodeSelection → rAF(mf.focus) → setCaret |
| Exit (arrow biên) | preventDefault → flag=null → view.focus() → setTextSelection |
| Ghost show | selection collapsed ∧ flag===null ∧ focus |

---

# §5 — Insert Semantics + Click-to-Position (giải R4)

## Click-to-position
`view.posAtCoords({left,top})`:
- Trả pos hợp lệ → `TextSelection.create(doc, pos)` set caret.
- Click virtual-space:
  - **[REVISED 2026-06-24 — materialize-on-click, thay ghost-park]** Mô hình ghost-park ban đầu (set state {targetLine,targetCol} + park PM selection + intercept keydown) phá vỡ với IME/composition: `e.key==='Process'` trong handleKeyDown → bỏ qua materialize → ký tự vào parked selection; đồng thời `TextSelection.create` tại pos cấp-doc throw "TextSelection endpoint not pointing into a node with inline content". **Fix: click virtual-space → INSERT ROW NGAY LẬP TỨC** (không đợi keystroke): `insertRowAtLine(targetLine, targetCol)` tạo row với blankBefore/indent đúng, đặt `Selection.near(rowStart+1)` (caret thật trong row). Mọi input (ASCII/IME/paste) chảy tự nhiên vào row mới. Empty-row cleanup khi user click elsewhere/blur mà không gõ gì.
  - **Phải cuối-text của row có sẵn** (`classifyClick` → 'virtual'): cùng path — insert row kế.
- toạ độ paper-relative qua `paperRef.getBoundingClientRect()` (như `coordsFromPointer` cũ); `RULE_HEIGHT=64`, `MARGIN_L=56` từ `geometry.ts`.

## Type = INSERT không đè
PM mặc định insert-tại-selection (không overwrite trừ khi có selection range) → "INSERT không đè" thoả tự nhiên. Nuance: gõ tại virtual-column → materialize whitespace/indent TRƯỚC rồi insert char.

## Caret giữa 2 atom liền kề (`mathInline│mathInline`)
- pos PM thật (giữa 2 inline atom). **Type** → `tr.insertText(char, gapPos)`.
- **Backspace** tại gap:
  - Text trái non-empty → xoá 1 char (PM default).
  - Caret ngay SAU 1 atom → **xoá atom đó** (delete node mathInline) + GC blockMeta (appendTransaction §2). **KHÔNG "merge" 2 atom** — 2 biểu thức độc lập; backspace chỉ xoá atom-trái, còn `│B`.
  - Caret đầu row (col 0): row rỗng → join về cuối row trước; row có content → join content vào row trước (PM default). Indent là metadata, KHÔNG backspace-từng-char.
- **Delete (forward)** tại gap: đối xứng.

## C2 hit-test
`posAtCoords` trả pos biên atom → NodeSelection + focus math-field tại coord (§4 edge). Caret KHÔNG kẹt trong result (result không phải node — §1).

---

# §6 — Arrow-Nav 2D Plugin Interface (giải R5)

Plugin `caretNav` (keymap + state goalX).

## Left / Right
- **ArrowRight**: caret NGAY TRƯỚC mathInline → enter atom tại start (§4b). Else PM default.
- **ArrowLeft**: caret NGAY SAU mathInline → enter atom tại end (§4c). Else PM default.
- (Trong atom: MathLive xử; tới biên thì exit — §4.)

## Up / Down (phần 2D)
- **ArrowUp**: `coordsAtPos(selection.head)` → {left:curX, top}. targetY = curRowTop − `RULE_HEIGHT`. `posAtCoords({left:goalX, top:targetY})` → `setTextSelection(pos)`. **goalX** lưu trong plugin state, giữ qua chuỗi up/down liên tiếp; reset khi move ngang.
- **ArrowDown**: đối xứng (targetY = curRowBottom + RULE_HEIGHT).
- Gap trống: up/down vào dòng-kẻ-trống → ghost-park {prevLine,goalX} (virtual), PM selection pos gần nhất → caret "đậu" trên dòng trống; gõ → materialize row.
- Special: ArrowUp dòng đầu → giữ / về doc start; ArrowDown cuối → doc end / park dòng trống kế.

## Tab
- Trong row text: Tab → math atom KẾ trên row (hoặc atom đầu row sau) → setNodeSelection + enter start (§4b). Shift+Tab = atom trước.
- Trong atom: MathLive xử Tab (nhảy placeholder, feature §3.1). → context-sensitive.

---

# §7 — Vòng-lõi Continuity (giải R6)

## MathLive WYSIWYG GIỮ NGUYÊN (xác nhận KHÔNG bypass)
- mathInline NodeView = MathLive `<math-field>` (biến thể inline từ `MathField.tsx`). Live render x^2→x², `\int`→∫, `\sum`→Σ chạy BÊN TRONG atom **y hệt hôm nay** — row-based chỉ đổi phần XUNG QUANH atom (caret text xuyên qua), KHÔNG đụng WYSIWYG nội bộ.
- **Phân định rõ**: row text = prose thường (gõ "x^2" trong row text = literal "x^2", KHÔNG render x²). Muốn math WYSIWYG → caret phải Ở TRONG math atom. Tạo atom: trigger math (nút "Gõ" / lệnh / phím) chèn `mathInline` rỗng tại caret + focus (enter §4). → WYSIWYG = thuộc tính của atom; R6 giữ.

## Tính target (chốt feature §11.5 "target khi không bôi đen")
- **Có selection (range)**: `doc.nodesBetween(from,to)` lọc `mathInline` → đọc blockMeta.latexContent từng atom → **reconstruct biểu thức theo doc order** (interleave text-run + atom-latex, KHÔNG chỉ concat atom) → CAS → result gắn **atom CUỐI trong range** (§1).
- **No selection (caret collapsed)** — precedence: (1) caret TRONG atom (`mathFocusActive`) → atom đó; (2) caret NGAY SAU 1 atom → atom đó; (3) caret NGAY TRƯỚC 1 atom → atom đó; (4) text thuần không kề atom → **no-op + contextual tip** "đặt con trỏ trong biểu thức toán".
- Ngữ cảnh biến = cả trang (feature §3.3): CAS nhận target latex + định nghĩa gom từ MỌI mathInline trên trang (scan toàn doc). Chi tiết gather = Phase E; A.2 chốt target resolution.

## Result render position
- Result ở blockMeta của target (atom cuối): exactLatex/approxLatex/isApprox/blockState → NodeView atom đó render inline NGAY SAU công thức, màu `--result`/`--approx`, wrap xuống dòng kẻ kế nếu dài (§6, CSS). Tái dùng `ResultView`/`mathMarkup`.
- **evalBlock tái dùng**: `findBlock` đổi scan `'nibBlock'`→`'mathInline'`; `evalBlock(editor,ydoc,atomId)` gần như nguyên văn. Multi-atom: hàm mới `evalSelection(editor,ydoc,{from,to})` reconstruct→cùng path patchBlockMeta trên atom cuối. IPC contract LaTeX-in→{exact_latex,approx_latex,is_approx,error} (feature §9) + timeout/numeric fallback (§8.3) KHÔNG đổi.

---

# Rủi ro mới (§3–§7, cụ thể — chuyển Phase sau)

1. **WS room schema collision (§3 — CAO):** doc v2 local reconnect vào room v1 server `${userId}:${docId}` → server còn update `nibBlock` cũ → merge = corrupt v2. **Mitigation BẮT BUỘC: version hoá room → `${userId}:${docId}:v2`** (yProvider). Phase B/C phải làm.
2. **Reconstruct latex đa-atom (§7 — TRUNG):** selection trải text+atom → serialize đúng thứ tự (atom→latexContent, text-run→raw) rồi join; text-run không đảm bảo latex hợp lệ → CAS parse error (→`--error`). Phase E định nghĩa CHÍNH XÁC "selection→latex serialization" + test.
3. **MathLive `setCaretPoint`/`position` inline (§4 — TRUNG):** API có thể khác khi `<math-field>` nhúng inline atom → fallback caret-cuối + **spike nhỏ Phase D** xác nhận `mf.position`/`setCaretPoint` hoạt động inline (feature §11.2 spike ≤1 ngày).
