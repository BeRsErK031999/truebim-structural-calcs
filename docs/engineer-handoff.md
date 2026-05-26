# Engineer Handoff

Дата: 2026-05-26

Этот документ предназначен для инженера-конструктора, который проверяет расчет продавливания и возвращает trusted evidence разработчику.

## 1. Что это за приложение

TrueBIM Structural Calcs - веб-приложение для расчета продавливания железобетонной плиты. Сейчас приложение используется как расчетный инструмент и как среда подготовки проверочных материалов: report, engineering review snapshot и verification candidate.

Важно: приложение не заменяет инженерную проверку. Все draft и partial части должны сверяться с доверенным источником.

## 2. Что уже VERIFIED

VERIFIED сейчас относится только к ограниченной области: центральная прямоугольная колонна без моментов, без краев плиты, без отверстий и без усиления.

VERIFIED означает, что соответствующий кейс находится в verification dataset и проходит verification runner.

## 3. Что PARTIAL

PARTIAL означает, что часть расчета связана с проверенной базовой областью, но не вся проверяемая логика имеет trusted evidence.

Сейчас moment transfer для центральной прямоугольной колонны считается partial: базовая force-only область связана с verified evidence, но Mx/My, max/min stress и связанные величины требуют внешней проверки.

## 4. Что DRAFT

DRAFT означает, что область реализована как расчетная архитектура или предварительная логика, но еще не подтверждена trusted evidence.

К draft относятся:

- Mx/My расчетные эффекты, пока нет подтвержденных кейсов;
- edge и corner cases;
- openings;
- shear reinforcement;
- round columns;
- любые unsupported features и предупреждения в report.

## 5. Как открыть приложение

Откройте:

```text
http://192.168.22.37/
```

Review Mode доступен по адресу:

```text
http://192.168.22.37/review
```

Diagnostics доступны по адресу:

```text
http://192.168.22.37/diagnostics
```

## 6. Как выполнить расчет

1. На главной странице заполните исходные данные.
2. Проверьте единицы измерения и геометрию.
3. Выполните расчет.
4. Посмотрите warnings, verification level, draft features и unsupported features.
5. Зафиксируйте расчетный `calculationId`, если он есть в report/export.

## 7. Как выгрузить HTML/Markdown report

После расчета выгрузите report в HTML и Markdown, если доступны обе кнопки.

Report нужен как читаемый расчетный результат: исходные данные, результаты, предупреждения, verification status и схема. Report не является review snapshot, verification candidate или verified case.

## 8. Как открыть Engineering Review

Откройте `/review`.

Review Mode нужен для ручного ввода trusted values и сравнения результата приложения с доверенным источником: WebCAD, Excel, ручной расчет или нормативный пример.

## 9. Как заполнить trusted values

Заполните:

- Source: источник проверки, например `webcad`, `excel`, `manual`, `нормативный пример`;
- Checked by: ФИО или идентификатор инженера;
- Checked at: дата и время проверки;
- reviewer notes;
- axis convention notes;
- expected values для периметра, h0, shear stress, max/min stress, eccentricity, transfer factors, stress point count;
- attachments metadata: ссылки или имена файлов со скриншотами, Excel, PDF, WebCAD output.

Если значение неприменимо или источник его не дает, явно опишите это в notes. Не заполняйте выдуманные значения.

## 10. Как принять review

Review можно перевести в `accepted` только после проверки исходных данных, единиц, осей, знаков Mx/My, warnings и trusted values.

Accepted Review != VERIFIED.

Статус `accepted` означает, что инженер принял manual review record. Он не меняет `verificationLevel`, не добавляет кейс в dataset и не делает расчет VERIFIED.

## 11. Как создать verification candidate

После `accepted` нажмите `Create verification candidate`.

Если checklist полный, candidate получает статус `ready-for-validation`. Если не хватает source, checkedBy, checkedAt, expected values, tolerances или axis notes, candidate остается `incomplete`.

Candidate != VERIFIED.

Candidate - это JSON для ручной проверки и дальнейшего manual import разработчиком. Он не добавляется автоматически в verification dataset.

## 12. Что отправить разработчику

Отправьте:

- HTML report;
- Markdown report, если выгружен;
- review snapshot JSON или HTML;
- verification candidate JSON;
- заполненный engineer checklist;
- исходные файлы trusted evidence: WebCAD output, Excel, PDF, скриншоты, ручной расчет;
- пояснение по осевым соглашениям и знакам Mx/My;
- список расхождений и решение инженера по каждому значимому расхождению.

## 13. Что НЕ делать

Не нужно:

- менять формулы в приложении;
- менять verification logic;
- вручную объявлять draft/partial расчет VERIFIED;
- редактировать verification dataset без согласованного manual import;
- скрывать draft warnings;
- заполнять expected values без доверенного источника;
- считать accepted review равным verified case.

## 14. Как отличать артефакты

Report - читаемый расчетный отчет для инженера. Он показывает input, result, warnings и verification status.

Review snapshot - снимок ручной проверки и сравнения trusted values с результатом приложения.

Verification candidate - JSON, подготовленный из accepted review для ручной validation и будущего manual import.

Verified case - запись в verification dataset, которая прошла verification runner и участвует в capability promotion.

Report != Review Snapshot != Verification Candidate != Verified Case.
