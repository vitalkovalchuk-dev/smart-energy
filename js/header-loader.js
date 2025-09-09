document.addEventListener("DOMContentLoaded", function () {
  fetch("header.html")
    .then(response => {
      if (!response.ok) throw new Error("Не знайдено header.html");
      return response.text();
    })
    .then(data => {
      document.body.insertAdjacentHTML("afterbegin", data);
      initBurgerMenu(); // 🚀 викликаємо з script.js
    })
    .catch(err => console.error("Помилка завантаження хедера:", err));
});
