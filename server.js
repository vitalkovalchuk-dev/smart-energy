app.post("/save", async (req, res) => {
  try {
    const newRecord = { ...req.body };
    const file = newRecord.file || "TO.json"; // якщо не передано — пишемо у TO.json
    delete newRecord.file;

    const dataFile = path.join(__dirname, "data", file);

    let records = [];
    if (await fs.pathExists(dataFile)) {
      records = await fs.readJson(dataFile);
    }

    records.push(newRecord);
    await fs.writeJson(dataFile, records, { spaces: 2 });

    res.json({ success: true, message: "Дані збережено" });
  } catch (err) {
    console.error("Помилка запису:", err);
    res.status(500).json({ success: false, error: "Помилка сервера" });
  }
});
