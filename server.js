const journalFile = path.join(__dirname, "journal.html");

app.post("/save", async (req, res) => {
  try {
    const newRecord = { ...req.body, time: new Date().toISOString() };
    const file = newRecord.file || "TO.json"; // якщо не передано — пишемо у TO.json
    delete newRecord.file;

    // ===== Запис у JSON =====
    const dataFile = path.join(__dirname, "data", file);
    let records = [];
    if (await fs.pathExists(dataFile)) {
      records = await fs.readJson(dataFile);
    }
    records.push(newRecord);
    await fs.writeJson(dataFile, records, { spaces: 2 });

    // ===== Запис у журнал =====
    const entry = `<p><b>${new Date().toLocaleString("uk-UA")}</b>: Записано технічний огляд (файл: ${file})</p>\n`;

    if (!(await fs.pathExists(journalFile))) {
      const html = `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"><title>Журнал робіт</title></head>
<body>
<h2>Журнал робіт</h2>
${entry}
</body></html>`;
      await fs.writeFile(journalFile, html, "utf8");
    } else {
      let content = await fs.readFile(journalFile, "utf8");
      content = content.replace("</body></html>", entry + "</body></html>");
      await fs.writeFile(journalFile, content, "utf8");
    }

    res.json({ success: true, message: "Дані збережено та додано у журнал" });
  } catch (err) {
    console.error("Помилка запису:", err);
    res.status(500).json({ success: false, error: "Помилка сервера" });
  }
});
