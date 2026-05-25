# Анализ reference проекта shear_slab_calc

Reference: `C:\Users\Borodin_Artem\Desktop\Projects\shear_slab_calc_reference`
Источник: `https://github.com/AlekseyMalakhov/shear_slab_calc.git`
Назначение анализа: понять архитектуру, расчетную модель и edge cases для будущей clean-room реализации продавливания. Код из reference проекта не переносился.

## Краткий вывод

Reference проект является React/Vite приложением на JavaScript с Bootstrap UI. Архитектурно расчет, состояние формы, геометрия, SVG-скетч и подготовка отчета связаны через один большой `App.jsx`. Это удобно для изучения flow, но для production-ready реализации у нас лучше разделить домен на независимые слои: DTO ввода, нормализация единиц, geometry engine, punching shear calculation engine, reporting/export adapter и UI.

Лицензия в репозитории отсутствует (`LICENSE` не найден), поэтому код, тексты отчетов, формулы в виде конкретной реализации, SVG-алгоритмы и тестовые fixtures нельзя копировать напрямую. Безопасный путь: использовать проект только как behavioral/reference material, заново описать требования, сверить с СП 63.13330 и реализовать собственные типы, функции и тесты.

## Структура reference проекта

Корневые файлы:

- `src/App.jsx` - главный class component, глобальный input/output state, orchestration всех пересчетов, расчет продавливания, часть геометрии контура и обработка вариантов колонны у края/угла.
- `src/lib.js` - утилиты геометрии, проверки данных, отверстия, пересечения, объединение секторов вырубки, SVG-to-PNG helper для отчета.
- `src/settings.js` - таблицы материалов и коэффициенты перевода единиц.
- `src/exportToWord.js` - генерация Word отчета через `docx`, `file-saver`, `canvg`.
- `src/components/*.jsx` - UI-компоненты для ввода нагрузок, размеров, бетона, отверстий, краев плиты, поперечной арматуры, результата и SVG-скетча.
- `tests/App.test.jsx` - интеграционные UI-тесты, покрывающие базовый расчет, моменты, поперечную арматуру, край, угол, отверстия и комбинации.
- `server/*` - минимальная серверная часть/deploy wrapper, не участвует в расчетной логике фронтенда.

## Ключевые модули

### UI

- `Loads.jsx` - ввод `N`, `Mx`, `My`.
- `ColumnSize.jsx` - размеры колонны вдоль X/Y.
- `SlabSize.jsx` - толщина плиты и привязка арматуры; из этого получается рабочая высота `h0`.
- `Concrete.jsx` - выбор класса бетона.
- `UnitsOfMeasurement.jsx` - выбор единиц силы и длины.
- `ShearReinforcementSelect.jsx`, `ShearReinforcement.jsx` - включение поперечного армирования, класс/диаметр стержней, ряды, расстояния и количество стержней по X/Y.
- `SlabEdgeSelect.jsx`, `SlabEdgeData.jsx` - включение учета краев плиты, выбор левого/правого/верхнего/нижнего края и расстояний до них.
- `OpeningIsNearSelect.jsx`, `OpeningIsNearData.jsx` - включение учета отверстий, добавление/удаление отверстий и ввод размеров/координат.
- `Sketch.jsx` - SVG-рендеринг колонны, расчетного контура, отверстий, касательных, зон вырубки и поперечной арматуры.
- `Result.jsx` - текстовый статус расчета.
- `ViewSettings.jsx` - переключатели видимости контура, арматуры и касательных.

### Формулы и расчет

Основной расчет находится в `src/App.jsx`:

- `unitConversion()` приводит пользовательские значения к внутренним единицам: кН, кН*мм и мм.
- `calculateU()` формирует характеристики расчетного контура: `u`, `ab`, `ibx`, `iby`, `wbx`, `wby`, центры тяжести, вырубки от отверстий и параметры для отчета.
- `calculate()` выполняет проверку продавливания: берет `h0`, `Rbt`, геометрию контура, несущую способность бетона, вклад поперечной арматуры, факторы от силы и моментов, итоговый utilization factor.
- Внутренняя функция `calculateShearReinf(st)` считает вклад поперечного армирования: площадь попавших в расчетную зону стержней, `Asw/sw`, `qsw`, `Fsw,ult`, `Mswx,ult`, `Mswy,ult` с ограничениями.

### Геометрия

Геометрия разделена между `App.jsx` и `lib.js`:

- `displayColumn()` строит реальные и SVG-координаты колонны.
- `displaySlabEdge()` строит координаты краев плиты.
- `displayOpenings()` строит координаты отверстий в реальной системе и SVG.
- `displayOpeningTangents()` строит касательные от центра колонны к отверстиям.
- `displayPerimeter()` строит базовый расчетный контур на расстоянии `h0 / 2` от колонны и учитывает обрезание краями плиты.
- `displayCircles()` размещает SVG-кружки поперечной арматуры и определяет стержни, попадающие в расчетную зону.
- `lib.js` содержит низкоуровневые операции: пересечение отрезков, углы, расстояние точка-отрезок, объединение секторов отверстий, пересечение с контуром, расчет характеристик вырубки и проверку стержней относительно вырубленных секторов.

### SVG/sketch/rendering

- `Sketch.jsx` рендерит весь инженерный sketch как один SVG `svg_background`.
- В state хранятся готовые display strings: `columnDisplayString`, `uDisplayString`, `slabEdgeString`, `openingsDisplayString`, `out_asw_square_string`, `in_asw_square_string`.
- Касательные и точки пересечения отверстий с контуром также хранятся в state: `opening_tangents`, `opening_tangents_intersect`, `tangents_triangles`.
- `lib.js` helper `canvas_fake()` берет SVG из DOM, рендерит его через `canvg` в canvas и возвращает PNG data URL для Word отчета.

### Report/export

- `exportToWord.js` получает весь глобальный state.
- Report строится из `report_data`, input values, unit conversion labels, SVG image и набора `Paragraph/TextRun`.
- Export формат: `.docx`, filename `prodavlivanie.docx`.
- Генерация зависит от DOM (`svg_background`, `buffer` canvas), поэтому сейчас tightly coupled с UI.

## Flow данных

1. Дочерний input-компонент меняет локальное значение и передает partial state в `App.getData`.
2. `getData(local_state)` вызывает `setState(local_state, unitConversion)`.
3. `unitConversion()` нормализует входы во внутренние единицы и вызывает `displayColumn`.
4. Далее цепочка пересчетов строит геометрию: колонна -> края плиты -> отверстия -> касательные -> арматура -> периметр.
5. `calculateU()` считает геометрические характеристики расчетного контура.
6. `calculate()` выполняет расчет несущей способности и utilization.
7. Результат кладется в state как `text_result`, `result_color`, `report_data`.
8. UI отображает SVG sketch, result panel и кнопку Word export.
9. Export читает state и DOM SVG, формирует docx.

## Input state reference проекта

Ключевые группы state:

- Loads: `input_n_load`, `input_mx_load`, `input_my_load`, нормализованные `n_load`, `mx_load`, `my_load`.
- Units: `force_units`, `length_units`.
- Column: `input_a_column_size`, `input_b_column_size`, `a_column_size`, `b_column_size`.
- Slab: `input_t_slab_size`, `input_a_slab_size`, `t_slab_size`, `a_slab_size`.
- Materials: `concrete_grade`, `gamma_b`, `shear_bars_grade`, `shear_bars_diameter`.
- Shear reinforcement: `shear_reinforcement`, `shear_bars_row_number`, `input_shear_bars_spacing_to_prev`, `shear_bars_spacing_to_prev`, `shear_bars_number`, `asw_tot`, `aswCircles`.
- Slab edges: `slab_edge`, `edge_left/right/top/bottom`, `input_edge_*_dist`, `edge_*_dist`, computed `slab_edge_type`.
- Openings: `openingIsNear`, `input_openings`, normalized `openings`, display/real coordinates, tangents, merged angles, cut sectors.
- Geometry/rendering: real/display coords, SVG strings, scale factors, sketch visibility settings.
- Output/report: `text_result`, `result_color`, `geom_chars`, `report_data`.

## Output/result structure

Reference не имеет отдельного DTO результата. Результат распределен по state:

- Human-readable status: `text_result`.
- UI color/status: `result_color`.
- Geometry details: `geom_chars`.
- Report payload: `report_data`.

`report_data` включает расчетные значения для отчета: `h0`, `rbt`, `u`, `ab`, `wbx`, `wby`, размеры сторон контура, `ibx`, `iby`, `mbx_ult`, `mby_ult`, `fb_ult`, `fsw_ult`, `f_ult`, `mswx_ult`, `mswy_ult`, `n_factor`, `m_factor_1`, `m_factor_2`, `factor`, `asw_sw`, `qsw`, скорректированные моменты, центры тяжести, максимальные координаты, cut-off характеристики от отверстий и подробности вырубок.

Для нашего проекта нужен явный `CalculationResult` DTO: `status`, `utilization`, `checks`, `geometry`, `reinforcementContribution`, `warnings`, `reportPayload`.

## Обработка типов колонны

### Center column

В reference это случай `slab_edge_type === ""`. Расчетный контур строится вокруг колонны на расстоянии `h0 / 2`, без обрезания краями плиты. Если отверстий нет, моменты считаются напрямую от `Mx/My`. Если отверстия есть, добавляется эксцентриситет от вырубленного участка.

### Edge column

Один выбранный край дает `slab_edge_type`: `l`, `r`, `t` или `b`. Контур обрезается соответствующей гранью плиты, меняются длины сторон, центр тяжести и моменты инерции/сопротивления. В расчете моментов добавляется эксцентриситет приложения силы из-за смещенного центра контура.

### Corner column

Два соседних края дают `lt`, `rt`, `rb`, `lb`. Контур обрезается двумя гранями, расчетные характеристики считаются для углового случая. Два противоположных края (`lr`, `tb`) или больше двух краев reference помечает как неподдерживаемый/некорректный сценарий.

## Openings logic

Основная идея:

- Пользователь вводит прямоугольные отверстия: размеры вдоль X/Y и координаты центра относительно колонны.
- Неполные отверстия отбрасываются через `findEmptyOps`.
- `checkOpeningDistance` оставляет в расчете только отверстия достаточно близко к колонне: проверяются расстояния от углов колонны до углов и сторон отверстия с порогом `6 * t_slab_size`.
- Для каждого релевантного отверстия строятся касательные из центра колонны.
- Касательные пересекаются с расчетным контуром `u`.
- Сектора нескольких отверстий объединяются через `mergeOpenings`, чтобы не вычитать один и тот же участок дважды.
- `findUIntersectPoints` находит точки пересечения объединенных секторов с контуром.
- `addCornersU` учитывает случаи, когда сектор отверстия выбивает угол расчетного контура.
- Суммарные характеристики вырубки (`cut_off`, `cut_off_ibx`, `cut_off_iby`, `cut_off_sx`, `cut_off_sy`) вычитаются из характеристик контура.
- Для поперечной арматуры `checkCirclesOpenings` исключает стержни, попавшие в сектор вырубки от отверстий.

Для clean-room реализации стоит не повторять эту имплементацию, а описать отверстия как набор полигонов/лучевых секторов и реализовать проверяемые операции на геометрических примитивах: `Point`, `Segment`, `Rect`, `Polygon`, `PerimeterSegment`, `CutSector`.

## Perimeter calculation

Reference строит прямоугольный расчетный контур вокруг колонны на расстоянии `h0 / 2`. Для центральной колонны стороны контура имеют базовые размеры: размер колонны плюс `h0`. Для edge/corner cases контур обрезается краями плиты, если расстояние до края меньше соответствующего положения контура.

Дальше считаются:

- длины сторон контура;
- суммарный периметр `u`;
- площадь расчетного поперечного сечения `ab = u * h0`;
- статические моменты;
- центр тяжести контура;
- моменты инерции `ibx/iby`;
- моменты сопротивления `wbx/wby`;
- поправки на вырубки от отверстий.

В production engine нужно отделить:

- построение raw perimeter geometry;
- clipping slab edges;
- subtract openings/cut sectors;
- расчет section properties;
- подготовку preview geometry для UI.

## Unit conversion

Внутренние расчетные единицы reference:

- сила: кН;
- момент: кН*мм;
- длина: мм;
- напряжения материалов переводятся из МПа в кН/мм2.

Поддерживаются:

- force: кН и т, где т умножается на `9.807`;
- length: мм, см, м с коэффициентами `1`, `10`, `1000`.

Отдельность input и normalized значений важна: пользовательские `input_*` остаются в выбранных единицах, normalized values используются расчетом. Для нашего проекта это стоит оформить как `RawInputDto` и `NormalizedInputDto`, не хранить оба варианта хаотично в UI state.

## Report generation и export logic

Reference генерирует DOCX прямо на клиенте:

- собирает `report_data`;
- строит блоки текста через `docx`;
- добавляет SVG sketch как PNG через `canvg`;
- сохраняет файл через `file-saver`.

Проблемы текущего подхода:

- export зависит от DOM id и canvas;
- report text tightly coupled с расчетным state;
- нет промежуточного формального report model;
- русские тексты отчета и формулы встроены в JS.

Для нашего проекта лучше:

- engine возвращает `CalculationResult`;
- отдельный `ReportModel` собирает разделы, формулы, значения, warnings;
- renderer экспортирует `ReportModel` в DOCX/PDF;
- SVG/Canvas preview передается как asset adapter, а не читается напрямую из DOM.

## Какие параметры нужны для первого production-ready расчета

Минимальный расчет центральной колонны без отверстий и поперечной арматуры:

- расчетный код/нормативная версия;
- единицы ввода;
- `N`, `Mx`, `My`;
- размеры колонны `a`, `b`;
- толщина плиты `h`;
- защитный/геометрический параметр до центра тяжести арматуры `a_s`, чтобы получить `h0`;
- класс бетона и расчетное `Rbt`;
- коэффициент условий работы `gamma_b`;
- флаг/тип положения колонны: center/edge/corner;
- расстояния до краев плиты, если edge/corner;
- список отверстий, если включены;
- параметры поперечной арматуры, если включена.

Для production-ready результата:

- normalized input snapshot;
- perimeter geometry;
- section properties;
- concrete capacity;
- shear reinforcement contribution;
- force utilization;
- moment utilization before/after cap;
- total utilization;
- warnings/errors about unsupported geometry and invalid input.

## Какие сущности стоит повторить концептуально

Не копируя реализацию, стоит повторить идеи:

- separate raw input and normalized input;
- `Column`, `Slab`, `Loads`, `Material`, `SlabEdge`, `Opening`, `ShearReinforcement`;
- `PerimeterGeometry` с сегментами и section properties;
- `OpeningCut`/`CutSector`;
- `CalculationResult` и `ReportData`;
- deterministic geometry preview model, независимый от React.

## Рекомендуемая архитектура для нашего проекта

Предлагаемая структура:

- `src/calculations/punching-shear/domain` - типы домена и DTO.
- `src/calculations/punching-shear/units` - normalization и conversion.
- `src/calculations/punching-shear/materials` - таблицы материалов и нормативные значения.
- `src/calculations/punching-shear/geometry` - точки, сегменты, контур, clipping, openings.
- `src/calculations/punching-shear/engine` - чистая функция `calculatePunchingShear(input): CalculationResult`.
- `src/calculations/punching-shear/report` - `ReportModel` без DOCX-зависимостей.
- `src/features/punching-shear-form` - UI и validation schema.
- `src/widgets/punching-shear-preview` - SVG/rendering на основе geometry DTO.

Принцип: React/Zustand хранят draft и user preferences, а расчетный engine остается pure TypeScript, без DOM, canvas, React и mutable global state.

## Что безопасно переписать clean-room

Безопасно заново реализовать:

- DTO и Zod-схемы ввода;
- conversion layer для единиц;
- таблицы материалов, если значения берутся и документируются по нормативному источнику, а не копируются из reference;
- построение расчетного контура по СП;
- clipping edge/corner cases;
- openings geometry на собственных примитивах;
- расчет section properties;
- расчет contributions бетона и поперечной арматуры;
- report model и export adapters;
- UI, SVG preview, tests.

Для clean-room важно писать код по собственным спецификациям и нормативам, а reference использовать только как список сценариев и как подсказку, какие edge cases нужны.

## Что нельзя копировать напрямую

Из-за отсутствия явной лицензии нельзя переносить:

- исходный JS-код и структуру функций;
- тексты отчета;
- SVG generation code;
- тесты с теми же fixture values как прямую копию;
- комментарии и формулировки;
- exact implementation details геометрических алгоритмов;
- assets и deployment config.

## Улучшения, которые можно сделать у нас сразу

- Добавить `docs/adr` для решения о clean-room calculation engine.
- Завести `CalculationInput`, `NormalizedCalculationInput`, `CalculationResult`, `CalculationWarning`.
- Ввести enum для `ColumnPlacement`: `center`, `edge`, `corner`.
- Ввести единый units module и запретить смешивание display units с calculation units.
- Подготовить test matrix без копирования reference тестов: center, edge, corner, openings, shear reinforcement, invalid opposite edges.
- Сразу отделить report model от DOCX/PDF exporter.
- Сделать SVG preview полностью производным от geometry DTO.

## Как лучше построить calculation engine

Первый слой - нормализация:

- принять raw DTO;
- проверить schema;
- привести к кН, кН*мм, мм;
- вернуть immutable normalized input.

Второй слой - геометрия:

- построить колонну и базовый perimeter;
- применить slab edge clipping;
- построить opening cuts;
- исключить cut sectors;
- рассчитать section properties.

Третий слой - расчет:

- определить `h0`, `Rbt`, `Ab`, `Fb,ult`;
- посчитать `Wbx/Wby`, `Mbx,ult/Mby,ult`;
- добавить вклад shear reinforcement, если включен;
- посчитать utilization от N и моментов;
- применить нормативное ограничение moment contribution;
- вернуть result с trace steps.

Четвертый слой - presentation:

- преобразовать result trace в UI cards;
- построить SVG preview;
- построить report model;
- export adapters создают DOCX/PDF без участия calculation engine.

## Первые clean-room модули для переписывания

1. `units` - самый низкий риск, нужен всем дальнейшим расчетам.
2. `domain` DTO и Zod-схемы - фиксируют контракт между UI и engine.
3. `materials` - таблицы по нормативному источнику с явной ссылкой в документации.
4. `geometry/perimeter` - центральная колонна без краев и отверстий.
5. `engine/punchingShear` - базовый расчет center column без reinforcement/openings.
6. `geometry/slabEdges` - edge/corner clipping.
7. `geometry/openings` - clean-room секторная/полигональная модель отверстий.
8. `reinforcement/shearReinforcement` - вклад поперечной арматуры.
9. `report/reportModel` - структурированный отчет без DOCX renderer.
