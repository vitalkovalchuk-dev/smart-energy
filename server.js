const express = require("express");
const path = require("path");
const fs = require("fs-extra");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

// Папка для зберігання JSON
const dataDir = path.join(__dirname, "data");

// Словник для визначення файлу JSON залежно від сторінки
const pageFiles = {
  inspection: "PO.json",
  maintenance: "TO.json",
  repair: "PR.json",
  adjustment: "ADJ.json",
  vk: "VK.json"
};

// Функція перевірки та створення JSON-файлів
async function ensureJsonFiles() {
  await fs.ensureDir(dataDir); // створюємо папку, якщо її нема
  for (const fileName of Object.values(pageFiles)) {
    const filePath = path.join(dataDir, fileName);
    if (!(await fs.pathExists(filePath))) {
      await fs.writeJson(filePath, []); // порожній масив
      console.log(`Створено файл: ${fileName}`);
    }
  }
}

// Викликаємо при старті сервера
ensureJsonFiles();

app.post("/save", async (req, res) => {
  try {
    const data = { ...req.body };
    const page = data.page || "inspection"; // сторінка має передаватись у req.body
    delete data.page;

    const fileName = pageFiles[page] || "PO.json";
    const dataFile = path.join(dataDir, fileName);
    const journalFile = path.join(__dirname, "journal.html");

    // Читаємо існуючі записи JSON
    let records = [];
    if (await fs.pathExists(dataFile)) {
      records = await fs.readJson(dataFile);
    }
    records.push(data);
    await fs.writeJson(dataFile, records, { spaces: 2 });

    // Логування у journal.html
    const logEntry = `
      <div class="log-entry">
        <strong>Час:</strong> ${new Date().toLocaleString()}<br>
        <strong>Сторінка:</strong> ${page}<br>
        <strong>Дані:</strong> ${JSON.stringify(data)}
      </div><hr>`;
    if (!(await fs.pathExists(journalFile))) {
      await fs.writeFile(journalFile, `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><title>Журнал</title></head><body>${logEntry}</body></html>`);
    } else {
      await fs.appendFile(journalFile, logEntry);
    }

    res.json({ success: true, message: "Дані збережено" });
  } catch (err) {
    console.error("Помилка запису:", err);
    res.status(500).json({ success: false, error: "Помилка сервера" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
