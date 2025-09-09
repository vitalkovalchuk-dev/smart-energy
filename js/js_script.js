// ====== Бургер-меню для мобільних ======
document.addEventListener("DOMContentLoaded", function () {
  const burger = document.querySelector(".burger");
  const mobileMenu = document.querySelector(".mobile-menu");
  const backBtn = document.querySelector(".menu-back");
  const closeBtn = document.querySelector(".menu-close");
  const menuTitle = document.querySelector(".menu-title");
  const overlay = document.getElementById("menuOverlay");

  let currentMenu = mobileMenu?.querySelector("ul[data-level='root']");

  function openMenu() {
    mobileMenu.classList.add("active");
    overlay.classList.add("active");
    showMenu("root", "Меню");
  }

  function closeMenu() {
    mobileMenu.classList.remove("active");
    overlay.classList.remove("active");
  }

  if (burger) {
    burger.addEventListener("click", () => {
      if (mobileMenu.classList.contains("active")) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeMenu();
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      closeMenu();
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      const parent = currentMenu.getAttribute("data-parent");
      if (parent) {
        showMenu(parent, parent === "root" ? "Меню" : parent);
      }
    });
  }

  mobileMenu?.addEventListener("click", function (e) {
    const link = e.target.closest("a[data-submenu]");
    if (link) {
      e.preventDefault();
      const submenu = link.getAttribute("data-submenu");
      showMenu(submenu, link.textContent.trim());
    }
  });

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
});

// ====== Функція задіювання чекбоксів ======
document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll(".line-toggle");

  toggles.forEach((toggle) => {
    const line = toggle.dataset.line;
    const fields = document.querySelectorAll(`[data-line="${line}"]`);

    toggleFields(toggle.checked, fields);

    toggle.addEventListener("change", () => {
      toggleFields(toggle.checked, fields);
    });
  });

  function toggleFields(enabled, fields) {
    fields.forEach((field) => {
      if (field.tagName === "INPUT" || field.tagName === "SELECT") {
        if (!field.classList.contains("line-toggle")) {
          field.disabled = !enabled;
        }
      }
    });
  }
});

// ====== Валідація та відправка даних ======
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("fullForm") || document.getElementById("inspectionForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      sendWorkData();
    });
  }
});

function sendWorkData() {
  const pageMap = {
    "Технічний огляд обладнання": "PO",
    "Регулювання обладнання": "ADJ",
    "Плановий ремонт": "PR",
    "Технічне обслуговування": "TO",
    "Відомчий контроль": "VK"
  };

  const pageTitle = document.querySelector("h2")?.innerText.trim() || "PO";
  const page = pageMap[pageTitle] || "PO";

  // збираємо усі input та checkbox у details
  const inputs = Array.from(document.querySelectorAll("input"));
  const details = inputs
    .map((inp) => {
      if (inp.type === "checkbox") {
        return `${inp.id}: ${inp.checked ? "✅" : "❌"}`;
      } else {
        return `${inp.id}: ${inp.value}`;
      }
    })
    .join("; ");

  if (!navigator.geolocation) {
    alert("Геолокація не підтримується цим браузером.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const objLat = 49.2335;
      const objLng = 28.4712;
      const distance = calcDistance(lat, lng, objLat, objLng);

      const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) || {
          name: "Тестовий користувач",
          role: "Team",
        };

      const record = {
        time: new Date().toLocaleString(),
        user: currentUser.name,
        role: currentUser.role,
        page,
        action: "Передано дані",
        details,
        geo: { lat, lng },
        distance,
      };

      try {
        const res = await fetch("http://localhost:3000/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...record, file: `${page}.json` }),
        });

        const result = await res.json();
        if (result.success) {
          alert("✅ Дані збережено");
        } else {
          alert("❌ Помилка збереження");
        }
      } catch (err) {
        console.error("Помилка:", err);
        alert("❌ Не вдалося передати дані на сервер");
      }
    },
    () => {
      alert("Не вдалося отримати геолокацію");
    }
  );
}

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

document.addEventListener("DOMContentLoaded", () => {
  // Для всіх чекбоксів з id, що закінчується на "_status"
  document.querySelectorAll("input[type=checkbox][id$='_status']").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      // Беремо всі input у тому ж fieldset
      const fieldset = checkbox.closest("fieldset");
      if (!fieldset) return;

      const inputs = fieldset.querySelectorAll("input[type=number]");
      inputs.forEach(input => {
        input.disabled = !checkbox.checked;
      });
    });

    // Виклик при завантаженні, щоб початковий стан був правильний
    checkbox.dispatchEvent(new Event("change"));
  });

  // Обробка форми
  const form = document.getElementById("inspectionForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {};
      form.querySelectorAll("input").forEach(inp => {
        if (inp.type === "checkbox") {
          data[inp.id] = inp.checked;
        } else {
          data[inp.id] = inp.value;
        }
      });

      try {
        const res = await fetch("/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: "ADJ.json",   // 🔹 тут файл
            time: new Date().toISOString(),
            data
          })
        });

        const result = await res.json();
        if (result.success) {
          alert("Дані успішно надіслані!");
          form.reset();
        } else {
          alert("Помилка: " + result.error);
        }
      } catch (err) {
        alert("Не вдалося надіслати дані!");
        console.error(err);
      }
    });
  }
});
