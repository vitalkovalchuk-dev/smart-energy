// ===== server.js =====
const express = require("express");
const fs = require("fs-extra");
const path = require("path");

const app = express();
const PORT = 3000;

// ===== Шляхи =====
const dataDir = path.join(__dirname, "data");
const journalFile = path.join(dataDir, "journal.json");

// ===== Відповідність сторінок і файлів =====
const fileMap = {
  inspection: "PO.json",
  maintenance: "TO.json",
  repair: "PR.json",
  adjustment: "ADJ.json",
  vk: "VK.json",
};

const fileToPageName = {
  "PO.json": "Технічний огляд",
  "TO.json": "Технічне обслуговування",
  "PR.json": "Плановий ремонт",
  "ADJ.json": "Регулювання",
  "VK.json": "Відомчий контроль",
};

// ===== Словник назв полів =====
const fieldLabels = {
  line1_status: "Лінія 1 — стан (ВКЛ/ВИКЛ)",
  line1_in: "Лінія 1 — тиск на вході, МПа",
  line1_filter_in: "Лінія 1 — тиск перед фільтром, МПа",
  line1_filter_out: "Лінія 1 — тиск після фільтра, МПа",
  line1_out: "Лінія 1 — тиск на виході, мм.вод.ст",

  line2_status: "Лінія 2 — стан (ВКЛ/ВИКЛ)",
  line2_in: "Лінія 2 — тиск на вході, МПа",
  line2_filter_in: "Лінія 2 — тиск перед фільтром, МПа",
  line2_filter_out: "Лінія 2 — тиск після фільтра, МПа",
  line2_out: "Лінія 2 — тиск на виході, мм.вод.ст",

  line1_out_reg: "Лінія 1 — тиск на виході регулятора, мм.вод.ст",
  line1_out_zzk: "Лінія 1 — тиск на ЗЗК, мм.вод.ст",
  line1_out_zsk: "Лінія 1 — тиск на ЗСК, мм.вод.ст",

  line2_out_reg: "Лінія 2 — тиск на виході регулятора, мм.вод.ст",
  line2_out_zzk: "Лінія 2 — тиск на ЗЗК, мм.вод.ст",
  line2_out_zsk: "Лінія 2 — тиск на ЗСК, мм.вод.ст",

  line1_leak1: "Лінія 1 — витік низького тиску, шт",
  line1_leak2: "Лінія 1 — витік середнього тиску, шт",
  line1_leak3: "Лінія 1 — витік високого тиску, шт",

  line2_leak1: "Лінія 2 — витік низького тиску, шт",
  line2_leak2: "Лінія 2 — витік середнього тиску, шт",
  line2_leak3: "Лінія 2 — витік високого тиску, шт",

  // Можна розширювати цей список для TO, PR, VK...
};

// ===== Middleware =====
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname)));

// ===== Ендпоінт збереження =====
app.post("/save", async (req, res) => {
  try {
    const { page, time, data } = req.body;
    if (!page || !fileMap[page]) {
      return res.json({ success: false, error: "Невідома сторінка" });
    }

    const file = fileMap[page];
    const filePath = path.join(dataDir, file);

    // Читаємо існуючі дані
    let allData = [];
    if (await fs.pathExists(filePath)) {
      allData = await fs.readJson(filePath);
    }

    // Новий запис
    const newRecord = { time, data };
    allData.push(newRecord);

    // Зберігаємо у "сирий" файл
    await fs.writeJson(filePath, allData, { spaces: 2 });

    // === Формуємо запис для журналу ===
    const prettyData = Object.entries(data)
      .map(([key, val]) => {
        const label = fieldLabels[key] || key;
        if (typeof val === "boolean") {
          return `${label}: ${val ? "✔" : "✘"}`;
        } else if (val === null || val === "") {
          return `${label}: (немає даних)`;
        } else {
          return `${label}: ${val}`;
        }
      })
      .join("\n");

    let journal = [];
    if (await fs.pathExists(journalFile)) {
      journal = await fs.readJson(journalFile);
    }

    journal.push({
      time,
      source: fileToPageName[file] || file,
      summary: prettyData,
    });

    await fs.writeJson(journalFile, journal, { spaces: 2 });

    res.json({ success: true });
  } catch (err) {
    console.error("Помилка /save:", err);
    res.json({ success: false, error: "Помилка сервера" });
  }
});

// ===== Ендпоінт отримання журналу =====
app.get("/journal-data", async (req, res) => {
  try {
    if (!(await fs.pathExists(journalFile))) {
      return res.json([]);
    }
    const journal = await fs.readJson(journalFile);
    res.json(journal);
  } catch (err) {
    console.error("Помилка /journal-data:", err);
    res.json([]);
  }
});

// ===== Запуск =====
app.listen(PORT, () => {
  console.log(`✅ Сервер працює на http://localhost:${PORT}`);
});
