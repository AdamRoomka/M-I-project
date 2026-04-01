## Jak uruchomić

1. Pobierz wszystkie pliki projektu na swój komputer.
2. Otwórz plik `index.html` w przeglądarce (Chrome lub Firefox).
3. Program automatycznie startuje i generuje pierwszy świat.

## Demo
https://m1.romka.lt/

## Sterowanie

- **Drag myszką** po canvasie — obrót świata
- **Scroll kółkiem** — przybliżenie / oddalenie
- **Suwak Obrót kamery** w panelu — obrót ręczny

## Panel sterowania

- **Seed** — wpisz dowolny tekst lub liczbę żeby uzyskać konkretny świat, zaznacz "Losowy seed" żeby za każdym razem był inny
- **Rozmiar chunka** — ile kolumn ma jeden chunk
- **View radius** — ile chunków jest ładowanych od centrum (np. 2 = siatka 5x5)
- **Max wysokość** — ile poziomów bloków ma świat w pionie
- **Skala szumu** — większa wartość = bardziej pagórkowaty teren
- **Oktawy fBm** — więcej oktaw = więcej szczegółów w terenie
- **Poziom morza** — do jakiej wysokości pojawia się woda
- **Gęstość drzew** — próg powyżej którego pojawiają się drzewa
- **Tryb biomów** — auto (szum Perlina) lub ręcznie wybrany biom
- **Skala biomów** — jak duże obszary zajmuje jeden biom
- **Kolory bloków** — zmiana kolorów każdego typu bloku na żywo
- **Rozmiar voxela** — ile pikseli ma jeden blok
- **Zoom** — skala ogólna widoku
- **Animacja ładowania** — włącza efekt stopniowego pojawiania się chunków
- **Ukryj przysłonięte bloki** — optymalizacja renderowania

## Przyciski

- **Start** — generuje świat z obecnymi ustawieniami
- **Stop** — przerywa generowanie
- **Reset** — czyści chunki i generuje od nowa z tym samym seedem
- **Clear** — czyści canvas bez generowania
- **Generuj nowy świat** — losuje nowy seed i od razu generuje
