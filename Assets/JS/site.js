const API = "https://www.elprisenligenu.dk/api/v1/prices";
const ICONS = "./Assets/icons/fontawesome/";
const CACHE = "elprisen-prices";
const SETTINGS = "elprisen-area";
const app = document.querySelector("#app");
document.head.insertAdjacentHTML("beforeend", '<meta name="viewport" content="width=device-width, initial-scale=1">');
let area = "DK2";
let prices = [];

try {
    area = localStorage.getItem(SETTINGS) || area;
} catch (error) {
    console.error("Kunne ikke læse det gemte prisområde.", error);
}

const styles = `
*{box-sizing:border-box}
body{margin:0;background:#27282b;color:#ebebeb;font-family:Roboto,Arial,sans-serif}
button,select{font:inherit}
.app{min-height:100vh;min-height:100dvh;padding-bottom:79px}
.top{height:55px;display:flex;align-items:center;justify-content:space-between;padding:0 30px;background:#201e1e}
.brand{width:35px;height:35px;display:grid;place-items:center;border:4px dashed rgba(85,236,32,.5);border-radius:50%;box-shadow:0 0 6px #0004,inset 0 0 8px #5b5b5b40}
.brand img{width:12px;height:18px}
.brand img,.gear img{filter:invert(79%) sepia(92%) saturate(1046%) hue-rotate(46deg) brightness(105%) contrast(91%)}
.nav{display:flex;gap:clamp(12px,5vw,28px);align-items:center}
.nav button{padding:0;border:0;background:none;color:#ebebeb;font-size:12px;font-weight:500;font-variant:all-small-caps;cursor:pointer}
.nav button.active{color:#55ec20}
.content{position:relative;width:min(100%,375px);min-height:calc(100vh - 134px);min-height:calc(100dvh - 134px);margin:auto;padding:62px 20px 30px;text-align:center}
.gear{position:absolute;top:17px;right:20px;padding:0;border:0;background:none;cursor:pointer}
.gear img{width:21px;height:22px}
h1{margin:0 0 45px;font-size:32px;font-weight:300;font-variant:all-small-caps}
.dial{width:min(74vw,277px);aspect-ratio:1;margin:0 auto 15px;display:grid;place-items:center;border:8px solid #0002;border-radius:50%;background:#201e1e;box-shadow:0 0 4px #0004,inset 0 0 8px 2px #ffffff40}
.dial-inner{width:88%;height:88%;display:grid;place-content:center;border:1px dashed #55ec2080;border-radius:50%;outline:1px dashed #55ec2040;outline-offset:-10px}
.price{color:#55ec20;font-size:32px;font-weight:700;line-height:1.15}
.unit{color:#55ec20;font-size:12px;font-weight:700;text-transform:uppercase}
.time{margin:0;color:#55ec20;font-size:16px;font-weight:500}
.notice{min-height:20px;margin:12px 0 0;color:#ebebeb;font-size:12px}
.footer{position:fixed;right:0;bottom:0;left:0;min-height:79px;display:grid;place-content:center;padding:12px 20px;background:#201e1e;text-align:center;font-size:11px;line-height:1.5}
.footer p{margin:0}
.footer span{color:#55ec20}
.dialog{width:min(320px,calc(100% - 32px));padding:22px;border:1px solid #444;border-radius:12px;background:#201e1e;color:#ebebeb}
.dialog::backdrop{background:#0009}
.dialog h2{margin:0 0 18px;font-size:20px;font-weight:400}
.dialog label{display:block;margin-bottom:8px;text-align:left;font-size:14px}
.dialog select{width:100%;padding:10px;border:1px solid #555;border-radius:6px;background:#27282b;color:#ebebeb}
.dialog-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
.dialog button{padding:8px 12px;border:1px solid #555;border-radius:6px;background:#27282b;color:#ebebeb;cursor:pointer}
.dialog button.save{border-color:#55ec20;background:#55ec20;color:#201e1e}
@media(max-width:390px){.top{padding:0 18px}.nav{gap:clamp(10px,4vw,16px)}.nav button{font-size:11px}.content{padding-top:62px}}
`;

function render() {
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