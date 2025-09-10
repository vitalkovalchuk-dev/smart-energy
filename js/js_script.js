// ====== Бургер-меню для мобільних ======
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeBtn = mobileMenu ? mobileMenu.querySelector(".menu-close") : null;
  const backBtn = mobileMenu ? mobileMenu.querySelector(".menu-back") : null;
  const overlay = document.getElementById("menuOverlay");

  // Відкрити меню
  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("active");
    if (overlay) overlay.classList.add("active");
    // показати root-меню
    mobileMenu.querySelectorAll("ul[data-level]").forEach(ul => ul.style.display = "none");
    const root = mobileMenu.querySelector('ul[data-level="root"]');
    if (root) root.style.display = "block";
    if (backBtn) backBtn.style.visibility = "hidden";
  }

  // Закрити меню
  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
  }

  if (burger) burger.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (overlay) overlay.addEventListener("click", closeMenu);

  // Кнопка "Назад"
  if (backBtn) backBtn.addEventListener("click", () => {
    mobileMenu.querySelectorAll("ul[data-level]").forEach(ul => ul.style.display = "none");
    const root = mobileMenu.querySelector('ul[data-level="root"]');
    if (root) root.style.display = "block";
    backBtn.style.visibility = "hidden";
  });

  // Перемикання підменю
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a[data-submenu]').forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        const submenu = link.dataset.submenu;
        mobileMenu.querySelectorAll('ul[data-level]').forEach(ul => ul.style.display = "none");
        const target = mobileMenu.querySelector(`ul[data-level="${submenu}"]`);
        if (target) {
          target.style.display = "block";
          if (backBtn) backBtn.style.visibility = "visible";
        }
      });
    });
  }
});

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
  if (!form) return; // Якщо на сторінці немає форми

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

    // Перевірка: якщо лінія увімкнена, тиск має бути вказаний
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

    alert("✅ Дані зібрано. Перевір консоль.");
  });
});
