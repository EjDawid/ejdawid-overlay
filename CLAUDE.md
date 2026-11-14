# CLAUDE.md – ejdawid-overlay

Overlay streamu Twitch kanału **EjDawid**: paski i alerty w scenie gry oraz trzy ekrany (start, przerwa, koniec). Kod żyje w tym repo, jest serwowany z GitHub Pages i wczytywany do OBS przez Custom Widget w StreamElements (SE).

**Specyfikacja:** `docs/spec-overlay.md` (wersja 1.4). To jest źródło prawdy. Nie dodawaj niczego, czego tam nie ma.
**Wzory wyglądu:** `docs/ref/*.png` (grafiki Dawida). Przy różnicy między speką a obrazkiem pytaj.

## Z kim pracujesz

- Dawid zna Pythona na poziomie podstaw z uczelni; JS, CSS i git słabo. Każdy krok, który robi ręcznie (GitHub, SE, OBS), opisuj po kolei, z nazwami przycisków po angielsku, tak jak są w interfejsie.
- Pisz do niego po polsku. Termin techniczny wyjaśnij krótko przy pierwszym użyciu.
- Debiut streamu jest za kilka dni: tylko funkcje ze speki, bez dodatków. Pomysły spoza zakresu zapisz w `docs/pomysly.md`, nie implementuj.
- Po każdym kawałku powiedz: co zrobiłeś, jak to przetestować, co jest następne.

## Stack

- Czysty HTML, CSS i JavaScript (ES2020). **Bez frameworków, bibliotek, npm, bundlera ani kroku build.** Pliki w repo = pliki serwowane.
- Hosting: GitHub Pages z gałęzi `main`, katalog główny. Repo publiczne (darmowe Pages).
- Integracja: SE Custom Widget (`se/loader.html` + `se/fields.json`) wczytuje `overlay.css` i `overlay.js` z Pages i przekazuje zdarzenia `onWidgetLoad`, `onEventReceived`, `onSessionUpdate` do `window.EjOverlay.handle(...)`.
- Fonty: Google Fonts (`Alfa Slab One`, `Bree Serif`, subset `latin-ext`).
- Animacje: CSS (`@keyframes`, `transition`).

## Struktura

```
CLAUDE.md
docs/spec-overlay.md     specyfikacja
docs/ref/                grafiki-wzory od Dawida
docs/pomysly.md          pomysły na po debiucie
overlay.js               cała logika, jeden plik
overlay.css              cały wygląd, jeden plik
index.html               podgląd lokalny: symuluje fieldData i zdarzenia SE przyciskami
se/loader.html           HTML do wklejenia w Custom Widget (krótki, rzadko zmieniany)
se/fields.json           Fields do wklejenia w Custom Widget
img/scena-chaty.png      tło ekranów (statyczne)
sounds/                  dźwięki .ogg
```

## Konwencje

- Nazwy w kodzie po angielsku, komentarze po polsku, krótkie.
- ID elementów ze speki (G2, G5, E3…) w komentarzach i w nazwach klas, np. `.g2-goal`, `.e3-chat`, żeby dało się je odnaleźć.
- Kolory, fonty, kontury i cienie jako zmienne CSS w `:root` (paleta ze speki, sekcja 3). Nigdzie kolorów na sztywno poza `:root`.
- Kształty: **wszystko kanciaste** (`border-radius: 0`), jedyny wyjątek to naszywka G5.
- Wymiary ze speki, sekcja 4 (płótno 1920×1080).
- Tryb ekranu z `fieldData.mode` (`gra` / `start` / `przerwa` / `koniec`) ustawia klasę na `<body>`; CSS pokazuje i chowa elementy według klasy.
- Przy każdej zmianie `overlay.js`/`overlay.css`, którą Dawid ma zobaczyć w OBS: podbij `?v=` w `se/loader.html` i przypomnij, że trzeba wkleić nowy loader w SE albo odświeżyć Browser Source.
- Commity małe, po polsku, jeden kawałek = jeden lub kilka commitów. Push na `main` dopiero po teście w `index.html`.

## Zakazy

- **Nigdy `innerHTML` (ani podobnych) z tekstem od widzów** (nick, wiadomość czatu, wiadomość suba). Tylko `textContent` / `createElement`. Emotki składane jako `<img>` z adresu z `emotes[].urls`.
- Żadnych tokenów, kluczy API, haseł ani adresów e-mail w repo (repo jest publiczne). SE nie wymaga tokenu w kodzie widgetu.
- Żadnych płatnych usług, zewnętrznych API ani serwerów. Wszystko ma działać na darmowym GitHub Pages i darmowym SE.
- Żadnych elementów z Gravity Falls (postaci, symboli, logo), gradientów (poza ilustracją), poświaty, rozmytych cieni.
- Nic na środku ekranu gry i nic na dolnych 120 px (pasek przedmiotów).
- Nie dodawaj funkcji z sekcji 10 speki („Poza zakresem”), nawet jeśli wydają się proste.
- `console.log` nie działa w sandboxie SE: debug przez `?debug=1` w loaderze (napis z ostatnim zdarzeniem w rogu).

## Kolejność pracy (spec, sekcja 9)

1. Loader + `overlay.js` pokazujący „działa” i tryb z `fieldData`. Test: czy SE wczytuje skrypt z GitHub Pages. Jeśli nie: zapas = cały kod wklejony bezpośrednio w Custom Widget.
2. G2 + G3 z danymi sesji.
3. G5 + G6 + tryb testowy W2 + dźwięki.
4. E1 + E2 + E3 + E6 + E7 (ekrany).
5. Dopieszczenie wymiarów po teście w OBS.

Każdy kawałek: najpierw działa w `index.html` w przeglądarce, potem push, potem test w OBS przez SE. Nie zaczynaj następnego, zanim Dawid nie potwierdzi poprzedniego.
