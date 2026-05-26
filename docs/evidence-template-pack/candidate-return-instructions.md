# Candidate Return Instructions

Верните разработчику один пакет evidence по каждому расчету.

## Обязательные файлы

- HTML report;
- Markdown report, если выгружен;
- review snapshot JSON или HTML;
- verification candidate JSON;
- заполненный engineer review checklist;
- заполненный template notes;
- скриншоты или файлы trusted source.

## Что написать в сообщении

```text
Calculation ID:
Review status:
Candidate status:
Trusted source:
Checked by:
Checked at:
Краткий вывод:
Расхождения:
Нужен manual import в dataset: да/нет
```

## Важное ограничение

Accepted Review != VERIFIED.

Candidate != VERIFIED.

Разработчик вручную проверяет candidate, импортирует verified case только при наличии достаточного evidence и запускает verification runner.
