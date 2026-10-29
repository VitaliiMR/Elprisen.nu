# ElPriser.nu

En dansk, installérbar PWA til aktuelle og historiske elpriser. Mobilvisningen har navigation mellem Oversigt, Lige nu, Historik og Indstillinger; desktop samler oversigt, timepriser og historik i ét dashboard og åbner indstillinger i en modal.

## Kør appen

Servér projektets rod fra en lokal HTTP-server eller et HTTPS-site. Service workers og PWA-installation virker ikke ved direkte åbning som `file://`.

## Data og offline

Appen henter timepriser fra [Elprisen lige nu API](https://www.elprisenligenu.dk/elpris-api) og bruger prisområderne DK1 og DK2. Historik kan vælges for i dag og de foregående syv dage. API-priser vises ekskl. moms og afgifter.

Service workeren cacher appens lokale filer og viser `offline.html`, hvis appen ellers ikke kan indlæses. Hentede dagspriser gemmes lokalt i browseren, så senest hentede data kan vises uden netværk.
