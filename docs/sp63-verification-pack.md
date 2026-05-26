# СП63 verification pack для продавливания

## Зачем нужен verification pack

Verification pack фиксирует набор расчетных случаев для будущей реализации СП63 и позволяет сравнивать результат `calculatePunchingShear()` с заранее сохраненными ожидаемыми значениями. Это основа для golden tests, инженерной сверки и безопасной замены текущей draft-арифметики на нормативную реализацию.

Пакет не доказывает корректность расчета сам по себе. Он только делает изменения наблюдаемыми: если формула, геометрия контура или коэффициенты меняются, тесты показывают, какие контрольные значения изменились.

## Что такое draft examples

Draft examples - это внутренние примеры, ожидаемые значения которых получены из текущей placeholder-арифметики приложения. Они нужны только для регрессионного контроля текущего поведения.

Текущий начальный dataset использует источник:

`internal draft arithmetic, not СП63 verified`

Все такие cases должны иметь `status: "draft"`. Их нельзя использовать как подтверждение соответствия СП63.

## Draft отличается от verified

`draft` означает, что case сохраняет текущее поведение draft-расчета и помогает не сломать существующий интерфейс и диагностику.

`verified` означает, что expected values сверены с доверенным инженерным источником. Только verified cases могут быть основанием для снятия пользовательского warning о draft-расчете.

`rejected` означает, что case нельзя использовать как эталон: источник, исходные данные или ожидаемые значения признаны непригодными.

## Допустимые источники trusted cases

Для verified cases можно использовать:

- ручной расчет инженера;
- проверенный Excel;
- webcad output;
- нормативный пример.

Источник должен быть явно описан в поле `source`. Для защиты от случайного повышения статуса runner не принимает `status: "verified"` без trusted marker в source, например `manual`, `excel`, `webcad`, `engineer`, `trusted` или `normative`.

## Как добавлять trusted cases

1. Добавить новый объект в `src/calculations/punching-shear/verification/verificationDataset.ts`.
2. Заполнить `input` полными исходными данными расчета.
3. Заполнить `expected` значениями из доверенного источника.
4. Указать допуск в `tolerance`: относительный процент и абсолютный допуск.
5. Описать источник в `source`, включая trusted marker.
6. Описать ограничения и допущения в `notes`.
7. Оставить `status: "draft"`, пока инженерная сверка не завершена.

## Как перевести case из draft в verified

Case можно переводить в `status: "verified"` только после инженерной проверки expected values. Перед переводом нужно убедиться, что:

- исходные данные соответствуют проверенному расчету;
- expected values перенесены без округлений, влияющих на tolerance;
- `source` указывает доверенный источник;
- `notes` фиксирует важные допущения;
- `npm run test` проходит и runner показывает pass по всем полям case.

## Почему warning нельзя снять без verified cases

UI warning защищает пользователя от восприятия draft-расчета как production-реализации СП63. Пока в verification pack нет verified cases, приложение не имеет инженерно подтвержденных golden values. Поэтому warning должен оставаться видимым до появления проверенных cases и прохождения тестов по ним.

## How to add first verified case

Первый verified case нужно готовить через отдельный JSON-файл, а не через ручное редактирование dataset вслепую. Заготовки лежат в:

- `src/calculations/punching-shear/verification/templates/verifiedCenterCase.template.ts`;
- `src/calculations/punching-shear/verification/templates/verifiedCaseInstructions.md`;
- `examples/verification/center-verified-case.example.json`.

Нужно снять исходные данные расчета: тип случая, усилия, толщину плиты, эффективную высоту, защитный слой, класс бетона, размеры колонны, наличие отверстий и параметры поперечного армирования. Для первого случая рекомендуется оставить простой центральный случай прямоугольной колонны без отверстий и без поперечного армирования.

Затем эти же исходные данные нужно прогнать через доверенный источник: ручной расчет инженера, webcad, проверенный Excel или нормативный пример. Из источника нужно получить expected values:

- `controlPerimeterMm`;
- `effectiveDepthMm`;
- `shearStressMpa`;
- `utilizationRatio`;
- `passed`.

После этого заполните JSON: замените `null` в `expected` на числа, укажите `status: "verified"` и подробно заполните `source`. В `source` обязательно должен быть trusted marker: `manual`, `webcad`, `excel` или `нормативный пример`. Без такого источника case нельзя считать verified, потому что приложение не должно подменять инженерную сверку внутренней draft-арифметикой.

Проверка JSON выполняется командой:

```powershell
npm run verification:validate -- examples/verification/center-verified-case.example.json
```

Скрипт только валидирует файл и выводит понятный список проблем. Он не добавляет case в `verificationDataset.ts` автоматически. Текущий example намеренно не проходит проверку как verified, потому что содержит `null`, `TODO` и `status: "draft"`.

## Current report and verification-source flow

Engineering exports include a `calculationId` and `Verification source`. Draft exports always start with `NOT VERIFIED`; that label is expected until an engineer compares the report against WebCAD, manual calculation, verified Excel or a normative example.

For the first real verified case, use `docs/first-verified-case-checklist.md`. Keep `status: "draft"` and `expected` values as `null` in the template until the external check is complete. When the check is complete, fill `verificationSource`, `checkedBy`, `checkedAt`, `comparisonNotes` and expected values before running:

```powershell
npm run verification:validate -- examples/verification/center-verified-case.example.json
```

Compare `u`, `h0`, `v`, `utilization` and `passed`.

## Draft moment-transfer cases

The dataset also includes draft-only moment cases:

- `draft-center-with-mx`;
- `draft-center-with-my`;
- `draft-center-with-mx-my`.

These cases use current internal draft arithmetic for eccentricity and linear stress redistribution only. They must stay `status: "draft"` until checked against a trusted SP63 source. Their expected values are useful for regression testing the current architecture, SVG metadata, report export and diagnostics, but they are not evidence of verified moment-transfer support.

See `docs/moment-transfer-draft.md` for the moment architecture and validation requirements.
