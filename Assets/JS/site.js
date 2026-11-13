const API = "https://www.elprisenligenu.dk/api/v1/prices";
const ICONS = "./Assets/icons/fontawesome/";
const SITE_ID = window.location.pathname.split("/").filter(Boolean)[0] || "root";
const CACHE = `elprisen:${SITE_ID}:prices`;
const SETTINGS = `elprisen:${SITE_ID}:area`;
const app = document.querySelector("#app");
document.head.insertAdjacentHTML("beforeend", '<meta name="viewport" content="width=device-width, initial-scale=1">');
let area = "DK2";
let prices = [];

try {
    area = localStorage.getItem(SETTINGS) || area;
} catch (error) {
    console.error("Kunne ikke læse det gemte prisområde.", error);
}

render() {
    app.innerHTML = `<style>${styles}</style>
        <main class="app">
            <header class="top">
                <span class="brand"><img src="${ICONS}bolt.svg" alt=""></span>
                <nav class="nav" aria-label="Navigation">
                    <button type="button">Oversigt</button>
                    <button type="button" class="active" aria-current="page">Lige nu</button>
                    <button type="button">Historik</button>
                </nav>
            </header>
            <section class="content" aria-label="Elprisen lige nu">
                <button class="gear" type="button" aria-label="Indstillinger"><img src="${ICONS}gear.svg" alt=""></button>
                <h1>Elprisen lige nu</h1>
                <div class="dial"><div class="dial-inner">
                    <span class="price">${currentPrice()}</span>
                    <span class="unit">kr. pr. kWh</span>
                </div></div>
                <p class="time">${currentTime()}</p>
                <p class="notice" role="status">${prices.length ? "" : "Henter elpriser…"}</p>
            </section>
            <footer class="footer"><p>Priserne er ex. moms og afgifter</p><p>Du vises lige nu priserne for <span>${area === "DK1" ? "Vest" : "Øst"} Danmark</span></p></footer>
        </main>
        <dialog class="dialog">
            <form method="dialog">
                <h2>Indstillinger</h2>
                <label for="area">Prisområde</label>
                <select id="area">
                    <option value="DK1" ${area === "DK1" ? "selected" : ""}>Vest Danmark (DK1)</option>
                    <option value="DK2" ${area === "DK2" ? "selected" : ""}>Øst Danmark (DK2)</option>
                </select>
                <div class="dialog-actions">
                    <button value="cancel">Luk</button>
                    <button class="save" value="save">Gem</button>
                </div>
            </form>
        </dialog>`;

    const dialog = app.querySelector(".dialog");
    app.querySelector(".gear").addEventListener("click", () => dialog.showModal());
    dialog.addEventListener("close", () => {
        if (dialog.returnValue !== "save") return;
        const selectedArea = app.querySelector("#area").value;
        if (selectedArea === area) return;
        area = selectedArea;
        try {
            localStorage.setItem(SETTINGS, area);
        } catch (error) {
            console.error("Kunne ikke gemme prisområdet.", error);
        }
        render();
        loadPrices();
    });
}

function currentPrice() {
    const now = Date.now();
    const current = prices.find((price) =>
        new Date(price.time_start).getTime() <= now && new Date(price.time_end).getTime() > now
    );
    return current ? current.DKK_per_kWh.toLocaleString("da-DK", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : "—";
}

function currentTime() {
    const now = Date.now();
    const current = prices.find((price) =>
        new Date(price.time_start).getTime() <= now && new Date(price.time_end).getTime() > now
    );
    if (!current) return "";
    const format = (date) => new Date(date).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
    return `${format(current.time_start)} - ${format(current.time_end)}`;
}

async function loadPrices() {
    const today = new Date();
    const date = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const key = `${area}-${date}`;

    try {
        const response = await fetch(`${API}/${date}_${area}.json`);
        if (!response.ok) throw new Error(`Elpris-API svarede ${response.status}`);
        prices = await response.json();
        try {
            localStorage.setItem(CACHE, JSON.stringify({ key, prices }));
        } catch (error) {
            console.error("Kunne ikke gemme elpriser til offlinebrug.", error);
        }
    } catch (error) {
        console.error("Kunne ikke hente elpriser.", error);
        try {
            const saved = JSON.parse(localStorage.getItem(CACHE) || "null");
            prices = saved && saved.key === key ? saved.prices : [];
        } catch (cacheError) {
            prices = [];
            console.error("Kunne ikke læse gemte elpriser.", cacheError);
        }
    }

    render();
    if (prices.length) app.querySelector(".notice").textContent = "";
    else app.querySelector(".notice").textContent = "Elprisen kunne ikke hentes.";
}

render();
loadPrices();
window.setInterval(() => {
    const price = app.querySelector(".price");
    const time = app.querySelector(".time");
    if (price) price.textContent = currentPrice();
    if (time) time.textContent = currentTime();
}, 60_000);