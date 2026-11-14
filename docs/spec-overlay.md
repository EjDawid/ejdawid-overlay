# Spec: overlay streamu EjDawid

Wersja 1.6, 14.11.2026. Źródło decyzji: dokument „Plan streamowy” Dawida (karty „OBS i overlay” i „Marka”). Wzory wyglądu: `docs/ref/`, wycięte z tła: `docs/ref/wyciete/` (paski G2–G4, naszywka G5, karta G6).

Oznaczenia sekcji:
- **[D]** sekcje do przeczytania i zatwierdzenia przez Dawida.
- **[CC]** sekcje techniczne dla Claude Code; Dawid może pominąć.

---

## 1. Cel [D]

Minimalny overlay na Twitcha w stylu „papier i ścieg”: gra na pierwszym planie, kolumna z kamerką i paskami przy lewej krawędzi, alerty obok kolumny, trzy ekrany (start, przerwa, koniec) z ilustracją chaty w lesie i czatem. Własny kod w repo na GitHub Pages, podpięty przez StreamElements (SE) jako „loader”. Donate przez Tipply, poza tym kodem.

Zakres na debiut: tylko podstawowe funkcje z tej speki. Wszystko inne dochodzi po debiucie według potrzeby (sekcja „Poza zakresem”).

## 2. Elementy [D]

| ID | Element | Gdzie | Kto robi |
| --- | --- | --- | --- |
| G1 | Kamerka: sylwetka z greenscreenu, bez podłoża, „siedzi” na pasku G2 | scena Gra | OBS (Chroma Key) |
| G2 | Pasek celu followów, jedna linia: „Cel: 32/50 followów  64%”, koralowe wypełnienie na całą wysokość środka paska rośnie od lewej z postępem (z cienką ciemną kreską na końcu), procent przy prawej krawędzi; po osiągnięciu celu „Cel osiągnięty ★” | kolumna | kod |
| G3 | Pasek „Ostatni follow: nick”; przy nowym followie błysk morelowy i podmiana nicku | kolumna | kod |
| G4 | Pasek „Napiwki: nick · kwota” z wyróżnionym największym | pod kolumną | widżet Tipply |
| G5 | Naszywka followa: kremowa łatka w kształcie tarczy, z ciemnym przerywanym ściegiem i kłoskami po bokach, „NOWY FOLLOW!” + nick; też bits poniżej progu („X BITSÓW” + nick). Wzór: `docs/ref/wyciete/naszywka-follow.png` | obok kamerki | kod |
| G6 | Karta zdarzenia: sub, resub, gift (pojedynczy i paczka), bits od progu, raid; różowa kartka z „podartymi” rogami, hasło + nick + liczba + wiadomość. Wzór: `docs/ref/wyciete/karta-zdarzenia.png` | obok kolumny, na wysokości pasków | kod |
| G7 | Karta donate z lektorem | obok kolumny, pod G6 | widżet Tipply |
| G9 | Skrót „schowaj wszystko” (overlay, kamerka, widżety Tipply). Gdy gra coś zasłania, Dawid ręcznie przesuwa kamerkę w OBS | OBS | OBS Hotkeys |
| E1 | Scena chaty: gotowa ilustracja `img/scena-chaty.png`, statyczna | ekrany | obraz |
| E2 | Taśma ukośna u góry (kremowa, ciemne litery): „ZARAZ ZACZYNAMY ★”, „ZARAZ WRACAMY ★”; na ekranie końca duże „DZIĘKI ZA DZIŚ”. Wzór układu: `docs/ref/ekran-startu-uklad.png` | ekrany | kod |
| E3 | Czat po prawej: ciemnomorski kanciasty panel, kończy się nad dolnym pasem; nowe wiadomości wjeżdżają od dołu | ekrany | kod |
| E4 | Alerty (G5, G6, G7) w prześwicie nieba między chatą a czatem; mogą nachodzić na tło, nigdy na czat ani na chatę | ekrany | układ |
| E5 | Przejście na przerwę między scenami OBS | OBS | OBS |
| E6 | Easter egg: miejsce na mały własny symbol w rogu (roślinka), bez funkcji | ekran przerwy | kod |
| E7 | Pastylka na dole tylko na ekranie końca: stały napis „kolejny stream: jak na grafiku”. Start i przerwa bez pastylki | ekran końca | kod |
| W1 | Loader w SE Custom Widget: wczytuje `overlay.css` i `overlay.js` z GitHub Pages, przekazuje zdarzenia | SE | kod (jednorazowo wklejony) |
| W2 | Tryb testowy: przyciski w polach widgetu symulują każde zdarzenie | SE | kod |
| W3 | Ustawienia bez kodu (pola widgetu): tryb ekranu, cel followów, czas naszywki, czas karty, próg bitsów dla karty, dźwięki | SE | kod (Fields) |

(G8, lustrzane odbicie na prawą stronę: wycięte, patrz „Poza zakresem”.)

## 3. Wygląd [D]

- Paleta: krem papieru `#F3E3BF` (tło naszywki, taśma), krem pasków `#EDDAAA` (środek pasków G2/G3), biała obwódka `#F2F1E8` (ramka pasków), tekst pasków `#3A1828`, morela `#E4BC7F` (cień naszywki, błysk G3), koral `#EF7B62` (wypełnienie postępu, pipeta ze wzoru), przygaszony róż `#9D585B` (cienie pasków, cień karty), róż karty `#B5686B` (tło G6, do potwierdzenia pipetą z `docs/ref/wyciete/karta-zdarzenia.png`), morski `#2C4D54` (czat, pastylka, nick na naszywce), atrament `#1F0C01` (kontur, tekst, cień hasła), śliwka `#6A2E30`, ciemny brąz `#3B2314` (litery taśmy).
- Scena chaty: gotowa ilustracja, bez własnego rysowania.
- Kroje: Alfa Slab One (hasła alertów: na karcie kremowe z atramentowym cieniem w prawo-dół, na naszywce atramentowe bez cienia; taśma), Bree Serif (wszystko inne). Oba z Google Fonts, subset `latin-ext`.
- Kontur 4–5 px atramentem na każdym elemencie. Cień twardy, bez rozmycia, w prawo-dół.
- Paski G2/G3 (wzór: `docs/ref/wyciete/pasek-cel.png`, `pasek-ostatni-follow.png`): cienki atramentowy brzeg (2 px), gruba biała obwódka (ok. 7 px), cienka atramentowa linia (2 px), kremowy środek; cień atramentowy 2 px w prawo i 4 px w dół. Tekst jednym kolorem, lekko pogrubiony. G3: tekst wyśrodkowany, mała gwiazdka w konturze w prawym dolnym rogu.
- Kształty kanciaste: paski, karta, czat, pastylka bez zaokrągleń (`border-radius: 0`). Jedyny element bez prostych rogów: naszywka G5 w kształcie tarczy.
- Ruch alertów: wejście pieczątką (ok. 1 s), kołysanie jak na jednej pinezce, wyjście zmięciem. Paski bez animacji poza błyskiem G3.
- Bez gradientów, bez poświaty, bez rozmytych cieni, bez elementów Gravity Falls (postaci, symboli, logo).

## 4. Układ na ekranie 1920×1080 [D]

- Kolumna: 360 px szerokości, lewy margines 40 px, wyśrodkowana w pionie. Od góry: G1 (sylwetka, ok. 200 px wysokości), G2 (60 px), odstęp 20 px, G3 (60 px), odstęp 20 px, G4 Tipply (60 px).
- G5 naszywka (tarcza): ok. 200×175 px, przy prawym górnym rogu kamerki, obrót −6°. Rozmiar do potwierdzenia w OBS.
- G6 karta: 440×190 px, 60 px na prawo od kolumny, na wysokości pasków, obrót −2°. G7 Tipply: 440×110 px, 30 px pod G6.
- Ekrany: ilustracja na całym ekranie; taśma E2 ukośna (−6°) w górnej 1/4; czat E3 460×620 px przy prawej krawędzi (margines 60 px, y≈300–920); alerty w prześwicie nieba x≈1050–1420, y≈320–620; pastylka E7 (tylko koniec) wyśrodkowana na dole (ok. 36 px od dolnej krawędzi).
- Niczego na środku ekranu i nigdy na dolnych 120 px (pasek przedmiotów gry).

Wymiary są punktem wyjścia do testu w OBS; mogą się zmienić po pierwszym podglądzie.

## 5. Zachowanie [D]

1. Przed streamem: tylko OBS i Chrome (profil EjDawid). Overlay ładuje kod przy wejściu w scenę.
2. Ekran startu: E1 + taśma „ZARAZ ZACZYNAMY ★” + czat + alerty.
3. Gra: kolumna z aktualnym stanem (G2 z `follower-total`, G3 z `follower-latest`). Bez czatu na ekranie.
4. Follow: G5 + błysk G3 + licznik G2 rośnie. Osiągnięty cel: „Cel osiągnięty ★” do końca streamu; nowy cel wpisuje Dawid przed kolejnym streamem.
5. Bits poniżej progu: G5 z liczbą. Bits od progu, sub, resub, gift, raid: G6, 7 s. Paczka giftów: jedna karta „X subów dla czatu”, bez karty na każdy pojedynczy gift z paczki.
6. Kilka zdarzeń SE naraz: kolejka, jedno po drugim (`widgetDuration`). Donate z Tipply: niezależna karta pod G6, kolizja wykluczona układem.
7. Gra zasłania overlay: skrót „schowaj wszystko” ukrywa grupę (overlay, kamerka, widżety Tipply); w razie potrzeby Dawid ręcznie przesuwa kamerkę w OBS.
8. Przerwa: scena Przerwa z przejściem; taśma „ZARAZ WRACAMY ★”, czat, alerty; mikrofon wyciszony skrótem OBS.
9. Koniec: „DZIĘKI ZA DZIŚ” + czat + pastylka „kolejny stream: jak na grafiku”.

## 6. Dane i zdarzenia [CC]

Źródło: https://docs.streamelements.com/overlays/events i https://docs.streamelements.com/overlays/session-data (stan 14.10.2026; sprawdź aktualność przed kodem).

| Element | Zdarzenie / klucz | Pola |
| --- | --- | --- |
| G2 | `onWidgetLoad`: `session.data["follower-total"]["count"]`; na żywo `onSessionUpdate` (`session["follower-total"]["count"]`) | cel z `fieldData.followGoal` |
| G3 | `onWidgetLoad`: `session.data["follower-latest"]["name"]`; na żywo `onEventReceived` listener `follower-latest` | `event.name` |
| G5 | `follower-latest`; `cheer-latest` gdy `event.amount < fieldData.bitsThreshold` | `name`, `amount` |
| G6 | `subscriber-latest` (`name`, `amount` = miesiące, `tier`, `message`, `gifted`, `sender`, `bulkGifted`, `isCommunityGift`), `cheer-latest` gdy `amount >= bitsThreshold` (`name`, `amount`, `message`), `raid-latest` (`name`, `amount` = widzowie) | jak obok |
| E3 | `message` (`event.data.displayName`, `text`, `emotes[]` z `start`/`end`/`urls`, `badges[]`, `msgId`, `userId`), `delete-message` (`msgId`), `delete-messages` (`userId`) | wiadomości trzymane w DOM z `data-msgid` i `data-userid` |
| E7 | brak danych: stały tekst w kodzie, tylko w trybie `koniec` | — |
| W2 | `widget-button` (`event.field`, `event.value`) → emitowane sztuczne `onEventReceived` | jak w docs SE |
| W3 | `onWidgetLoad`: `fieldData` | patrz sekcja 8 |

Reguły:
- `bulkGifted === true` → jedna karta „X subów dla czatu” (`sender`, `amount`); zdarzenia z `isCommunityGift === true` pomijane.
- `gifted === true` bez `bulkGifted` → karta „SUB OD {sender} DLA {name}”.
- Raid: karta „DZIĘKI ZA RAID!” + `name` + `amount` widzów.
- Czat: ostatnie 30 wiadomości w DOM, starsze usuwane; emotki zamieniane na `<img>` z `urls["2"]`; tekst wstawiany jako tekst (nigdy innerHTML z treści widza).
- Brak danych na starcie (np. `follower-latest` puste): G3 pokazuje „jeszcze nikt”.

## 7. Architektura [CC]

```
Twitch ──► StreamElements ──► Custom Widget (loader, W1) ──► overlay.js z GitHub Pages
                                      │                              │
                                      └── fieldData (W3) ────────────┘
OBS Browser Source: adres overlayu SE (Gra, Start, Przerwa, Koniec)
OBS Browser Source: widżety Tipply (G4, G7), osobne adresy
```

- Jedno repo, jeden `overlay.js` i jeden `overlay.css`; tryb (`gra` / `start` / `przerwa` / `koniec`) przychodzi z `fieldData`.
- Loader (HTML widgetu w SE, ok. 15 linii): `<link>` do CSS, `<script>` do JS z parametrem wersji (`?v=…`) ustawianym ręcznie przy większych zmianach, żeby ominąć cache GitHub Pages; `window.addEventListener` dla `onWidgetLoad`, `onEventReceived`, `onSessionUpdate` przekazuje `obj.detail` do `window.EjOverlay.handle(...)`. Jeśli skrypt nie wczyta się w 5 s, widget pokazuje w rogu mały napis „overlay offline”.
- Kolejka alertów: SE dostarcza zdarzenia do widgetu po kolei z czasem `widgetDuration` (pole ukryte, wartość = czas karty + 1 s). Własna kolejka w JS tylko jako zabezpieczenie: jeśli przyjdzie zdarzenie w trakcie animacji, czeka.
- Fonty: Google Fonts przez `<link>` w loaderze (`Alfa+Slab+One`, `Bree+Serif`, subset `latin-ext`).
- Ilustracja chaty: `img/scena-chaty.png` (ok. 2,4 MB; rozważyć WebP), statyczna.
- Bez zewnętrznych bibliotek (jQuery jest w SE, ale go nie używamy). Czysty JS, CSS animations.
- Sandbox SE: brak `console.log`; debug przez `?debug=1` w parametrze loadera wyświetlający ostatnie zdarzenie w rogu.
- Dźwięki: pliki `.ogg` w repo (`sounds/`), odtwarzane przez `Audio`; adresy wybrane z pól `sound-input` SE mają pierwszeństwo, jeśli ustawione.

## 8. Pola widgetu (Fields) [CC]

| Pole | Typ | Domyślnie | Element |
| --- | --- | --- | --- |
| `mode` | dropdown: gra / start / przerwa / koniec | gra | tryb |
| `followGoal` | number | 100 | G2 |
| `badgeSeconds` | number | 4 | G5 |
| `cardSeconds` | number | 7 | G6 |
| `bitsThreshold` | number | 100 | G5/G6 |
| `soundFollow` | sound-input | pusty (plik z repo) | G5 |
| `soundCard` | sound-input | pusty (plik z repo) | G6 |
| `testFollow`, `testSub`, `testGift`, `testBits`, `testRaid`, `testChat` | button | — | W2 |
| `widgetDuration` | hidden | 8 | kolejka |
| `widgetName` | hidden | „EjDawid overlay” | — |

## 9. Repo [CC]

```
ejdawid-overlay/
  CLAUDE.md
  docs/spec-overlay.md   ta specyfikacja
  docs/ref/              grafiki-wzory od Dawida
  overlay.js
  overlay.css
  index.html             podgląd lokalny bez SE (symuluje fieldData i zdarzenia)
  se/loader.html         HTML do wklejenia w Custom Widget
  se/fields.json         Fields do wklejenia
  img/                   scena chaty, symbol
  sounds/
```

GitHub Pages z gałęzi `main`, katalog główny. Adresy: `https://<konto>.github.io/ejdawid-overlay/overlay.js`.

Kolejność wdrożenia (pionowe kawałki, każdy testowany w OBS):
1. Loader + `overlay.js` wypisujący „działa” i tryb z `fieldData` (test, czy SE przepuszcza skrypt z GitHub Pages).
2. G2 + G3 z danymi sesji.
3. G5 + G6 + W2 + dźwięki.
4. E1 + E2 + E3 + E6 + E7.
5. Dopieszczenie wymiarów po teście w OBS.

## 10. Poza zakresem (na debiut)

| Pomysł | Powód |
| --- | --- |
| Lustrzane odbicie overlayu na prawą stronę (G8) i skróty lewo/prawo | na debiut tylko „schowaj wszystko” + ręczne przesunięcie kamerki |
| Ruch na scenie chaty (dym z komina, migotanie okien, liście) | na debiut statyczna ilustracja |
| Odliczanie do startu, czas od startu streamu | na debiut tylko podstawowe funkcje |
| Pasek napiwków i karta donate w naszym kodzie | donate idą przez Tipply, SE ich nie widzi |
| Przełączanie palety według pory dnia, wersje sceny na pory roku | jedna paleta i jedna scena |
| Ręcznie wpisywana data następnego streamu | stała pastylka o grafiku |
| Pastylki z nazwą gry itd. | pastylka tylko na końcu |
| Easter eggi z funkcją | etap 2 |
| Nocna wersja na horrory | po debiucie |
| Czat na ekranie podczas gry | brak z założenia |
| Automatyczny kolejny próg celu | Dawid ustawia ręcznie przed streamem |

## 11. Otwarte

- Czy SE przepuszcza skrypt z GitHub Pages (test w kawałku 1; zapas: kod wklejony w SE).
- Lista i stylowanie widżetów Tipply (po weryfikacji konta).
- Dokładny kolor karty G6 (pipeta z `docs/ref/karta-zdarzenia.png`).
