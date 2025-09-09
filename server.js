// Логування у journal.html
const journalFile = path.join(__dirname, "journal.html");

// Функція створення/додавання запису в журнал
async function logToJournal(page, data) {
  const logEntry = `
    <tr>
      <td>${new Date().toLocaleString()}</td>
      <td>${page}</td>
      <td><pre>${JSON.stringify(data, null, 2)}</pre></td>
    </tr>`;

  if (!(await fs.pathExists(journalFile))) {
    // Якщо файл ще не існує — створюємо повну таблицю
    const header = `
      <!DOCTYPE html>
      <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Журнал подій</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f0f0f0; }
          pre { margin: 0; font-family: monospace; }
        </style>
      </head>
      <body>
        <h1>Електронний журнал</h1>
        <table>
          <thead>
            <tr>
              <th>Час</th>
              <th>Сторінка</th>
              <th>Дані</th>
            </tr>
          </thead>
          <tbody>
            ${logEntry}
          </tbody>
        </table>
      </body>
      </html>`;
    await fs.writeFile(journalFile, header);
  } else {
    // Додаємо новий рядок у tbody
    let html = await fs.readFile(journalFile, "utf-8");
    html = html.replace("</tbody>", `${logEntry}</tbody>`);
    await fs.writeFile(journalFile, html);
  }
}
