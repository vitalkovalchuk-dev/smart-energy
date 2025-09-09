// ====== Бургер-меню для мобільних ======
function initBurgerMenu() {
  const burger = document.querySelector(".burger");
  const mobileMenu = document.querySelector(".mobile-menu");
  const backBtn = document.querySelector(".menu-back");
  const closeBtn = document.querySelector(".menu-close");
  const menuTitle = document.querySelector(".menu-title");

  if (!burger || !mobileMenu) return; // Якщо хедер ще не підвантажений

  let currentMenu = mobileMenu.querySelector("ul[data-level='root']");

  // Відкрити бургер-меню
  burger.addEventListener("click", () => {
    mobileMenu.classList.add("active");
    showMenu("root", "Меню");
  });

  // Закрити меню
  closeBtn.addEventListener("click", () => {
    mobileMenu.classList.remove("active");
  });

  // Кнопка "Назад"
  backBtn.addEventListener("click", () => {
    const parent = currentMenu.getAttribute("data-parent");
    if (parent) {
      showMenu(parent, parent === "root" ? "Меню" : parent);
    }
  });

  // Клік по пункту з підменю
  mobileMenu.addEventListener("click", function (e) {
    const link = e.target.closest("a[data-submenu]");
    if (link) {
      e.preventDefault();
      const submenu = link.getAttribute("data-submenu");
      showMenu(submenu, link.textContent.trim());
    }
  });

  // Функція показу меню
  function showMenu(level, title) {
    const menus = mobileMenu.querySelectorAll("ul");
    menus.forEach((m) => (m.style.display = "none"));

    const targetMenu = mobileMenu.querySelector(`ul[data-level='${level}']`);
    if (targetMenu) {
      targetMenu.style.display = "block";
      currentMenu = targetMenu;
    }

    menuTitle.textContent = title;
    backBtn.style.visibility = level === "root" ? "hidden" : "visible";
  }
}

// ====== Функція задіювання чекбоксів ======
document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll('.line-toggle');

  toggles.forEach(toggle => {
    const line = toggle.dataset.line;
    const fields = document.querySelectorAll(`[data-line="${line}"]`);

    // Початковий стан при завантаженні
    toggleFields(toggle.checked, fields);

    // Зміна стану при кліку
    toggle.addEventListener('change', () => {
      toggleFields(toggle.checked, fields);
    });
  });

  function toggleFields(enabled, fields) {
    fields.forEach(field => {
      if (field.tagName === "INPUT" || field.tagName === "SELECT") {
        if (!field.classList.contains('line-toggle')) {
          field.disabled = !enabled;
        }
      }
    });
  }
});

// ====== Валідація та відправка форми ======
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("fullForm");
  if (!form) return; // Якщо на сторінці немає форми, нічого не робимо

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // зупиняємо стандартну відправку

    const formData = {};
    const inputs = this.querySelectorAll("input");

    inputs.forEach(input => {
      const id = input.id;
      const type = input.type;

      if (type === "checkbox") {
        formData[id] = input.checked;
      } else if (type === "number") {
        formData[id] = input.disabled ? null : parseFloat(input.value || 0);
      }
    });

    // Перевіримо: якщо лінія увімкнена, тиск має бути вказаний
    const enabledLines = ['line1', 'line2'].filter(line => formData[`${line}_enabled`]);

    for (const line of enabledLines) {
      if (
        !formData[`${line}_pressure_in`] &&
        !formData[`${line}_pressure_out`]
      ) {
        alert(`❌ Для ${line} увімкненої лінії не вказані тиски!`);
        return;
      }
    }

    console.log("📋 Дані для відправки:", formData);

    // Якщо потрібно надіслати на сервер:
    // fetch('/api/save', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData)
    // }).then(res => res.json()).then(data => {
    //   alert('Дані збережено!');
    // });

    alert("✅ Дані зібрано. Перевір консоль.");
  });
});
