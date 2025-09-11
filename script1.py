# script1.py — виправлена повна версія
import pandas as pd
import os
import math
import re
from pathlib import Path
from datetime import datetime

# ----------------------------
# Налаштування
# ----------------------------
INPUT_FILE = "PRG_2025.csv"
OUTPUT_DIR = "docs/excel"
LIST_FILE = "list_prg.html"
ENCODING = "cp1251"

IDX_TYPE = 0
IDX_NUMBER = 1
IDX_ADDRESS = 2
IDX_STATUS = 3

IDX_PLAN_TECH = list(range(4, 16))   # 12 місяців план по техогляду
IDX_PLAN_ADJ_APR = 16
IDX_PLAN_ADJ_OCT = 17
IDX_PLAN_MAINT = 18
IDX_PLAN_REPAIR = 19

IDX_EXEC_START = 20
EXEC_FIELDS_TOTAL = 16   # 12 місяців + adj_apr + adj_oct + maint_flag + repair_flag

MONTHS = [
    "Січень","Лютий","Березень","Квітень","Травень","Червень",
    "Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"
]

MONTH_NAMES = {
    "січ": 1, "лют": 2, "бер": 3, "кві": 4, "тра": 5, "чер": 6,
    "лип": 7, "сер": 8, "вер": 9, "жов": 10, "лис": 11, "гру": 12
}

# ----------------------------
# Утиліти
# ----------------------------
def cell_text(val):
    """Перетворює значення клітинки у текст (None / NaN -> '')."""
    if val is None:
        return ""
    if isinstance(val, float) and math.isnan(val):
        return ""
    if isinstance(val, float) and val.is_integer():
        return str(int(val))
    return str(val).strip()

def cell_day(val):
    """Повертає лише день з '28.06' або '28.Чер' -> '28', підтримує множинні дні '1 15' -> '1<br/>15'."""
    s = cell_text(val)
    if not s:
        return ""
    # якщо кілька значень через пробіл або кому — повернути їх (з заміною на <br/>)
    if " " in s or "," in s:
        parts = re.split(r"[\s,]+", s)
        out = []
        for p in parts:
            p = p.strip()
            if not p:
                continue
            if re.match(r"^\d+(\.0+)?$", p):
                out.append(str(int(float(p))))
            else:
                out.append(p.split(".")[0] if "." in p else p)
        return "<br/>".join(out)
    # звичайний випадок
    try:
        day_part = s.split(".")[0]
        return str(int(day_part))
    except Exception:
        return s

def safe_month_from_ddmm(value):
    """Визначає місяць 0..11 з формату 'ДД.ММ' або 'ДД.Міс' (повертає None якщо не знайдено)."""
    s = cell_text(value).lower()
    if not s:
        return None
    try:
        parts = s.split(".")
        if len(parts) >= 2:
            mm = parts[1]
            mm = mm.strip()
            if mm.isdigit():
                m = int(mm)
                if 1 <= m <= 12:
                    return m - 1
            else:
                mm3 = mm[:3]
                if mm3 in MONTH_NAMES:
                    return MONTH_NAMES[mm3] - 1
    except Exception:
        pass
    return None

def safe_fname(s):
    """Схема для безпечної назви файлу (зберігає кирилицю/літери/цифри/_, -)."""
    if not s:
        return "unnamed"
    s = s.strip()
    # замінюємо слеші, двокрапки та інші проблемні символи на _
    s = re.sub(r'[\\/:"*?<>|]+', '_', s)
    s = s.replace(" ", "_")
    return s

def make_cell(val, color, href, status_flag=None):
    """Створює HTML для однієї комірки графіка з можливим накладеним написом
       Показує накладку лише для status_flag == 1 (Виконано) та 3 (ТЕРМІНОВО).
    """
    if not val:
        return "<td></td>"
    text = cell_day(val)
    style = (
        "position:relative;"
        f"background:{color}; border-radius:8px; padding:6px 4px; text-align:center;"
        "font-weight:700; color:#111; min-width:34px; min-height:30px;"
    )
    overlay = ""
    if status_flag == 1:
        overlay = ("<span style='position:absolute;top:50%;left:50%;"
                   "transform:translate(-50%,-50%) rotate(-30deg);"
                   "background:rgba(0,255,0,0.22); color:green; font-weight:700; "
                   "font-size:0.72em; padding:2px 6px; border-radius:4px; opacity:0.85;'>Виконано</span>")
    elif status_flag == 3:
        overlay = ("<span style='position:absolute;top:50%;left:50%;"
                   "transform:translate(-50%,-50%) rotate(-30deg);"
                   "background:rgba(255,0,0,0.20); color:red; font-weight:900; "
                   "font-size:0.74em; padding:2px 6px; border-radius:4px; opacity:0.95;'>ТЕРМІНОВО</span>")
    return f"<td><a href=\"{href}\" style='text-decoration:none;color:inherit;'><div style='{style}'>{overlay}{text}</div></a></td>"

def row_html(label, vals, color, href, exec_vals=None):
    """Повертає HTML рядка графіка (12 місяців)"""
    tds = []
    for i in range(12):
        v = vals[i] if i < len(vals) else ""
        flag = exec_vals[i] if exec_vals and i < len(exec_vals) else None
        tds.append(make_cell(v, color, href, flag))
    return f"<tr><td style='text-align:left; padding:8px 6px; font-weight:700'>{label}</td>{''.join(tds)}</tr>"

def get_execution_status(status, plan_dict, exec_dict):
    """Логіка показу стану у каталозі (повертає текст та колір)"""
    if cell_text(status).lower() == "відключене":
        return "-", "black"

    now_month = datetime.now().month - 1

    # 2) якщо у поточному місяці є план у будь-якого виду робіт, дивимось прапор саме для того виду
    for work_type in ("tech","adj","maint","repair"):
        plan = plan_dict.get(work_type, [""]*12)
        execv = exec_dict.get(work_type, [None]*12)
        if plan[now_month]:
            flag = execv[now_month]
            if flag == 1:
                return "Виконано", "green"
            if flag == 3:
                return "ТЕРМІНОВО", "red"
            # 2 або None -> Очікується
            return "Очікується", "black"

    # 3) якщо у поточному місяці немає плану, але до цього усі виконання були 1 — "Виконано"
    for work_type in ("tech","adj","maint","repair"):
        execv = exec_dict.get(work_type, [None]*12)
        prev = [x for x in execv[:now_month] if x is not None]
        if prev and all(x == 1 for x in prev):
            return "Виконано", "lightgreen"

    return "Очікується", "black"

# ----------------------------
# Читання CSV (пропускаємо шапку)
# ----------------------------
df = pd.read_csv(
    INPUT_FILE,
    sep=None,
    engine="python",
    encoding=ENCODING,
    header=None,
    skiprows=1
)

# ----------------------------
# Генерація HTML-графіків
# ----------------------------
os.makedirs(OUTPUT_DIR, exist_ok=True)
rows = []   # <<< важливо: ініціалізуємо до використання у каталозі
now_month = datetime.now().month - 1

for idx, r in df.iterrows():
    try:
        typ = cell_text(r.iloc[IDX_TYPE])
        num = cell_text(r.iloc[IDX_NUMBER])
        addr = cell_text(r.iloc[IDX_ADDRESS])
        status = cell_text(r.iloc[IDX_STATUS])
        if not num:
            continue

        # --- план ---
        tech_plan = [cell_text(r.iloc[i]) for i in IDX_PLAN_TECH]
        reg_plan = ["" for _ in range(12)]
        if cell_text(r.iloc[IDX_PLAN_ADJ_APR]): reg_plan[3] = cell_day(r.iloc[IDX_PLAN_ADJ_APR])
        if cell_text(r.iloc[IDX_PLAN_ADJ_OCT]): reg_plan[9] = cell_day(r.iloc[IDX_PLAN_ADJ_OCT])
        maint_plan = ["" for _ in range(12)]
        m = safe_month_from_ddmm(r.iloc[IDX_PLAN_MAINT])
        if m is not None:
            maint_plan[m] = cell_day(r.iloc[IDX_PLAN_MAINT])
        repair_plan = ["" for _ in range(12)]
        m2 = safe_month_from_ddmm(r.iloc[IDX_PLAN_REPAIR])
        if m2 is not None:
            repair_plan[m2] = cell_day(r.iloc[IDX_PLAN_REPAIR])

        # --- виконання ---
        exec_raw = []
        for k in range(EXEC_FIELDS_TOTAL):
            col = IDX_EXEC_START + k
            try:
                v = r.iloc[col]
                s = cell_text(v)
                if s == "":
                    exec_raw.append(None)
                else:
                    try:
                        exec_raw.append(int(float(s)))
                    except Exception:
                        exec_raw.append(None)
            except Exception:
                exec_raw.append(None)

        tech_exec = exec_raw[0:12]
        adj_apr = exec_raw[12] if len(exec_raw) > 12 else None
        adj_oct = exec_raw[13] if len(exec_raw) > 13 else None
        maint_flag = exec_raw[14] if len(exec_raw) > 14 else None
        repair_flag = exec_raw[15] if len(exec_raw) > 15 else None

        exec_dict = {"tech": tech_exec, "adj": [None]*12, "maint": [None]*12, "repair": [None]*12}
        if adj_apr is not None: exec_dict["adj"][3] = adj_apr
        if adj_oct is not None: exec_dict["adj"][9] = adj_oct
        if maint_flag is not None and m is not None: exec_dict["maint"][m] = maint_flag
        if repair_flag is not None and m2 is not None: exec_dict["repair"][m2] = repair_flag

        plan_dict = {"tech": tech_plan, "adj": reg_plan, "maint": maint_plan, "repair": repair_plan}

        exec_status, color = get_execution_status(status, plan_dict, exec_dict)

        # --- Таблиця графіка ---
        table = "<table border='1' style='border-collapse:collapse; text-align:center; width:100%'>"
        table += "<tr><th style='text-align:left; padding:8px 6px'>Види робіт</th>"
        for i, mname in enumerate(MONTHS):
            if i == now_month:
                table += f"<th style='background:#eee'>{mname}</th>"
            else:
                table += f"<th>{mname}</th>"
        table += "</tr>"

        # Для сторінок графіків (файли лежать у docs/excel/) посилання на сторінки в корені мають підніматися двома рівнями:
        root_pref = "../../"
        table += row_html("Технічний огляд", tech_plan, "rgba(0,0,255,0.12)", f"{root_pref}inspection.html", exec_dict["tech"])
        table += row_html("Регулювання обладнання", reg_plan, "rgba(255,255,0,0.12)", f"{root_pref}adjustment.html", exec_dict["adj"])
        table += row_html("Технічне обслуговування", maint_plan, "rgba(0,255,0,0.12)", f"{root_pref}maintenance.html", exec_dict["maint"])
        table += row_html("Плановий ремонт", repair_plan, "rgba(255,0,0,0.12)", f"{root_pref}repair.html", exec_dict["repair"])
        table += "</table>"

        title = f"Графік робіт — {typ} {num}"

        # --- Генерація HTML графіку (з підвантаженням header.html з кореня) ---
        safe_name = safe_fname(f"{typ}_{num}")
        graph_filename = f"{safe_name}.html"
        graph_path = Path(OUTPUT_DIR) / graph_filename

        graph_html = f"""<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="../../css/style.css">
<script src="../../js/script.js" defer></script>
</head>
<body>

 # --- Генерація хедера графіків ---
<div id="site-header"></div>
<script>
document.addEventListener("DOMContentLoaded", function(){
  fetch("/smart-energy/header.html").then(r=>r.text()).then(html=>{
    var c = document.getElementById('site-header');
    if(c) c.innerHTML = html;
  }).catch(e=>{/* header may be missing on local test */});
});
</script>

<main style="padding:16px;">
  <h2>{title}</h2>
  <p><b>Адреса:</b> {addr}</p>
  {table}
  <p style="margin-top:12px"><b>Легенда:</b> числа у прямокутниках означають дні виконання робіт. Накладені написи показують стан виконання (Виконано/ТЕРМІНОВО).</p>
  <p><a href="../../{LIST_FILE}" style="display:inline-block;margin-top:20px; padding:8px 16px; background:#eee; border-radius:6px; text-decoration:none;">← Повернутись</a></p>
</main>

</body>
</html>"""

        graph_path.write_text(graph_html, encoding="utf-8")
        rows.append((typ, num, addr, status, exec_status, color))
    except Exception as e:
        print(f"⚠️ Помилка у рядку {idx}: {e}")
        try:
            print("  Дані рядка:", [cell_text(x) for x in r.values])
        except Exception:
            pass

# ----------------------------
# Генерація Каталогу (list_prg.html)
# ----------------------------
# Формуємо HTML (вбудований CSS для автономності) з мобільною адаптацією (data-label)
html = []
html.append("""<!DOCTYPE html>
<html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Каталог графіків ПРГ</title>
<link rel="stylesheet" href="css/style.css">
<script src="js/script.js" defer></script>
<style>
:root{--bg:#f7f9fc;--card:#fff;--text:#111827;--muted:#6b7280;--brand:#2563eb}
*{box-sizing:border-box}
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Noto Sans',Arial; background:var(--bg); margin:0; padding:24px; color:var(--text)}
h1{margin:0 0 16px}
.toolbar{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 8px}
.toolbar input[type="search"]{flex:1 1 260px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;outline:none}
.btn{padding:8px 12px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;color:#374151}
.btn.active{background:#e0ebff;border-color:#c7dbff;color:#1d4ed8}
.table-wrap{overflow:auto;border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,.06);background:var(--card)}
table{width:100%;border-collapse:collapse;min-width:960px}
thead th{position:sticky;top:0;background:#f3f4f6;text-align:left;font-weight:600;border-bottom:1px solid #e5e7eb;padding:12px}
tbody td{padding:12px;border-bottom:1px solid #f1f5f9}
tbody tr:nth-child(even){background:#fafafa}
tbody tr:hover{background:#f1f5ff}
.badge{padding:4px 10px;border-radius:999px;font-weight:700;font-size:.85rem;display:inline-block}
.badge.done{background:#d4edda;color:#155724}
.badge.urgent{background:#f8d7da;color:#721c24}
.badge.pending{background:#fff3cd;color:#856404}
a{color:var(--brand);text-decoration:none}
a:hover{text-decoration:underline}
.footer{color:#6b7280;font-size:.875rem;margin-top:12px}
.counter{margin:8px 0 16px;color:#374151;font-weight:500}

/* ===== Адаптивна таблиця для смартфонів ===== */
@media (max-width: 768px) {
  .table-wrap table,
  .table-wrap thead,
  .table-wrap tbody,
  .table-wrap th,
  .table-wrap td,
  .table-wrap tr {
    display: block;
    width: 100%;
  }
  .table-wrap thead {display: none;}
  .table-wrap tr {
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    padding: 10px;
  }
  .table-wrap td {
    border: none;
    display: flex;
    justify-content: space-between;
    padding: 6px 8px;
  }
  .table-wrap td::before {
    content: attr(data-label);
    font-weight: bold;
    color: #555;
    margin-right: 10px;
  }
}
</style>
</head><body>

<!-- контейнер для загального header (header.html повинен бути в корені сайту) -->
<div id="site-header"></div>
<script>
document.addEventListener("DOMContentLoaded", function(){
  fetch("header.html").then(r=>r.text()).then(html=>{
    var c = document.getElementById('site-header');
    if(c) c.innerHTML = html;
  }).catch(e=>{/* header may be absent during local dev */});
});
</script>

<h1>Каталог графіків ПРГ</h1>
<div class="toolbar">
  <input id="search" type="search" placeholder="Пошук за адресою або номером об'єкта…" />
  <button class="btn active" data-filter="all">Показати всі</button>
  <button class="btn" data-filter="done">Виконано</button>
  <button class="btn" data-filter="pending">Очікується</button>
  <button class="btn" data-filter="urgent">ТЕРМІНОВО</button>
  <button class="btn" data-filter="off">Відключене</button>
  <button class="btn" data-filter="on">Включене</button>
</div>
<div class="counter" id="counter">- відібрано 0 об’єктів</div>
<div class="table-wrap"><table>
<thead>
<tr>
  <th style="width:64px">№</th>
  <th>Обладнання</th>
  <th>Адреса</th>
  <th style="width:160px">Виконання</th>
  <th style="width:160px">Статус обладнання</th>
  <th style="width:120px">Графік</th>
</tr></thead>
<tbody>""")

for i, (typ, num, addr, status_eq, exec_status, _color) in enumerate(rows, start=1):
    fname = f"{safe_fname(f'{typ}_{num}')}.html"
    equip_name = f"{typ} {num}"

    if cell_text(status_eq).lower() == "відключене":
        exec_html = "--"
        status_key = "off"
    else:
        if exec_status == "Виконано":
            status_key = "done";   exec_html = "<span class='badge done'>Виконано</span>"
        elif exec_status == "ТЕРМІНОВО":
            status_key = "urgent"; exec_html = "<span class='badge urgent'>ТЕРМІНОВО</span>"
        else:
            status_key = "pending";exec_html = "<span class='badge pending'>Очікується</span>"

    if cell_text(status_eq).lower() == "включене":
        equip_status_key = "on"
    elif cell_text(status_eq).lower() == "відключене":
        equip_status_key = "off"
    else:
        equip_status_key = "all"

    html.append(
        f"<tr data-status=\"{status_key} {equip_status_key}\">"
        f"<td data-label='№'>{i}</td>"
        f"<td data-label='Обладнання'><a href=\"{OUTPUT_DIR}/{fname}\">{equip_name}</a></td>"
        f"<td data-label='Адреса'>{addr}</td>"
        f"<td data-label='Виконання'>{exec_html}</td>"
        f"<td data-label='Статус'>{status_eq}</td>"
        f"<td data-label='Графік'><a href=\"{OUTPUT_DIR}/{fname}\">Відкрити</a></td>"
        f"</tr>"
    )

html.append("""</tbody></table></div>
<div class="footer">Згенеровано автоматично.</div>
<script>
const rows = Array.from(document.querySelectorAll('tbody tr'));
const search = document.querySelector('#search');
const buttons = document.querySelectorAll('.btn[data-filter]');
const counter = document.querySelector('#counter');
let current = 'all';
function applyFilters(){
  const q = search.value.trim().toLowerCase();
  let visibleCount = 0;
  rows.forEach(tr=>{
    const status = tr.dataset.status;
    const text = tr.textContent.toLowerCase();
    const matchFilter = (current==='all' || status.includes(current));
    const matchSearch = (!q || text.includes(q));
    const visible = (matchFilter && matchSearch);
    tr.style.display = visible ? '' : 'none';
    if(visible) visibleCount++;
  });
  counter.textContent = `- відібрано ${visibleCount} об’єктів`;
}
search.addEventListener('input', applyFilters);
buttons.forEach(btn=>btn.addEventListener('click', ()=>{
  buttons.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  current = btn.dataset.filter;
  applyFilters();
}));
applyFilters();
</script>
</body></html>""")

Path(LIST_FILE).write_text("".join(html), encoding="utf-8")

print(f"Згенеровано {len(rows)} графіків у '{OUTPUT_DIR}' та 1 каталог '{LIST_FILE}'")

