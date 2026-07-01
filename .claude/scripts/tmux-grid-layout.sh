#!/usr/bin/env bash
# Nib team layout — lead cột trái (LEAD_PCT% rộng, full cao) + teammate GRID bên phải.
#
# Vì sao có script này (ISSUE-2/6/11/18/29):
#   tmux KHÔNG có built-in nào cho "lead cột trái riêng + phần còn lại dạng lưới".
#   main-vertical → phải chỉ là 1 cột dọc; tiled → lead mất ưu tiên (thành 1 ô).
#   Bản cũ ghép grid bằng join-pane/resize-pane với index pane HARD-CODE → vỡ khi
#   spawn order khác / có zombie pane → "không gian co lại"/layout méo dù không đụng gì.
#   Script này tự TÍNH layout-string theo pane thật đang sống + kích thước window,
#   KHÔNG hardcode index, KHÔNG cap số teammate. Robust cho mọi N.
#
# Dùng: bash .claude/scripts/tmux-grid-layout.sh [LEAD_PCT]   (mặc định 30)
# Guard $TMUX: không có tmux → no-op (in-process mode).
set -euo pipefail
[ -z "${TMUX:-}" ] && exit 0
LEAD_PCT=${1:-30}

# 1) Dọn zombie pane (process thoát nhưng pane còn, pane_dead=1) TRƯỚC khi đếm N
tmux list-panes -F "#{pane_id} #{pane_dead}" | awk '$2==1{print $1}' \
  | xargs -r -I{} tmux kill-pane -t {} 2>/dev/null || true

W=$(tmux display-message -p '#{window_width}')
H=$(tmux display-message -p '#{window_height}')
mapfile -t P < <(tmux list-panes -F '#{pane_index}' | sort -n)
N=${#P[@]}
[ "$N" -le 1 ] && exit 0            # 0/1 pane: không có gì để sắp

lead=${P[0]}                         # lead = pane index nhỏ nhất (pane cũ nhất)
tm=("${P[@]:1}"); M=${#tm[@]}        # teammate = phần còn lại

Lw=$(( W * LEAD_PCT / 100 )); [ "$Lw" -lt 20 ] && Lw=20
Rx=$(( Lw + 1 )); Rw=$(( W - Lw - 1 ))

# Kích thước lưới: cols = ceil(sqrt(M)), rows = ceil(M/cols)
cols=1; while [ $(( cols*cols )) -lt "$M" ]; do cols=$((cols+1)); done
rows=$(( (M + cols - 1) / cols ))

# Chia độ dài L thành k ô nguyên (k-1 vách ngăn 1-cell giữa các ô)
split_len() { local L=$1 k=$2 avail base rem i; avail=$(( L-(k-1) ));
  base=$(( avail/k )); rem=$(( avail%k ));
  for ((i=0;i<k;i++)); do [ "$i" -lt "$rem" ] && echo $((base+1)) || echo "$base"; done; }

mapfile -t rowH < <(split_len "$H" "$rows")
idx=0; y=0; rightbody=""
for ((r=0;r<rows;r++)); do
  rh=${rowH[$r]}
  [ "$r" -lt $((rows-1)) ] && cnt=$cols || cnt=$(( M - cols*(rows-1) ))
  mapfile -t colW < <(split_len "$Rw" "$cnt")
  if [ "$cnt" -eq 1 ]; then
    p=${tm[$idx]}; idx=$((idx+1)); rowstr="${Rw}x${rh},${Rx},${y},${p}"
  else
    cells=""; x=$Rx
    for ((c=0;c<cnt;c++)); do cw=${colW[$c]}; p=${tm[$idx]}; idx=$((idx+1))
      [ -n "$cells" ] && cells="${cells},"; cells="${cells}${cw}x${rh},${x},${y},${p}"
      x=$(( x+cw+1 )); done
    rowstr="${Rw}x${rh},${Rx},${y}{${cells}}"
  fi
  [ -n "$rightbody" ] && rightbody="${rightbody},"; rightbody="${rightbody}${rowstr}"
  y=$(( y+rh+1 ))
done
[ "$rows" -eq 1 ] && right="$rightbody" || right="${Rw}x${H},${Rx},0[${rightbody}]"
body="${W}x${H},0,0{${Lw}x${H},0,0,${lead},${right}}"

# tmux layout checksum (rotate-right + add, 16-bit) — bắt buộc, sai thì tmux từ chối
csum=0
for ((i=0;i<${#body};i++)); do
  c=$(printf '%d' "'${body:$i:1}")
  csum=$(( (csum>>1) + ((csum&1)<<15) )); csum=$(( (csum+c) & 0xffff ))
done
tmux select-layout "$(printf '%04x,%s' "$csum" "$body")"
