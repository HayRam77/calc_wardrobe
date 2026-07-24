# 🗺️ КАРТА ПРОЕКТА calc_wardrobe

## ИНСТРУКЦИЯ ДЛЯ НОВОГО ЧАТА
1. Прочитай этот файл полностью перед началом работы
2. При любом изменении функционала — обнови соответствующий раздел
3. Формат: кратко, по делу, только ключевые функции и роуты
4. В конце сессии — закоммить changes.md (если создан)

## СЕРВЕР
- VPS: calc (root)
- Путь: /opt/calc_wardrobe
- БД: PostgreSQL bd_calc, hrroot / CalcWardrobe2026!, localhost
- Git: ветка calc2.0
- PM2: процесс calc-wardrobe
- Порт: 3001, прокси nginx -> calc.h-r-h.ru:443
- SPA: страницы-фрагменты, CSS в head не работает -> стили через JS

## УЧЁТНЫЕ ДАННЫЕ
| Система | Логин | Пароль |
|---------|-------|--------|
| Приложение (админ) | admin | 121212 |
| Приложение (пользователь) | test | (уточнить) |
| PostgreSQL | hrroot | CalcWardrobe2026! |
| VPS | root | (стандартный) |

## КОМАНДЫ
```bash
pm2 flush calc-wardrobe          # очистить логи
pm2 restart calc-wardrobe        # перезапуск
pm2 logs calc-wardrobe --lines 10 --nostream  # логи
node -c routes/файл.js           # проверка синтаксиса JS
git checkout -- файл             # откатить файл
psql -U hrroot -h localhost -d bd_calc -c "SQL"
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"121212"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/..."

СТРУКТУРА
server.js — Главный сервер
Подключает роутеры, CORS, SPA.

config/db.js — Пул соединений pool
middleware/
auth.js — Проверка JWT токена

isAdmin.js — Проверка роли admin

ownerCheck.js — Проверка владельца проекта

validation.js — Валидация запросов

errorHandler.js — Обработчик ошибок

routes/ (/api/...)
auth.js — POST /login, /register

admin.js — GET /users, /projects, /cabinets, /db/export; POST /db/import, /db/optimize; PUT /users/:id; DELETE /users/:id

projects.js — CRUD проектов

cabinets.js — CRUD шкафов; GET /:id/blocks/html (компоненты с цепочками связей), /:id/systems; POST /:id/blocks; GET/POST /export, /import

blockTemplates.js (ОСНОВНОЙ) — CRUD компонентов шкафа; GET /export (с параметрами); POST /import (SELECT+INSERT/UPDATE, без ON CONFLICT); GET /:id/materials; POST/DELETE /:id/materials; GET /:id (возвращает parameters)

block-templates.js — Дубликат (не используется)

systems.js — CRUD систем; GET/POST /export, /import; POST /:id/components; копирование систем

systemComponents.js — CRUD системных компонентов; GET/POST /export, /import; /:id/blocks, /:id/materials

systemComponentTypes.js — CRUD типов системных компонентов

systemModules.js — CRUD модулей; импорт через WHERE NOT EXISTS

systemParameters.js — CRUD параметров

systemParameterTypes.js — CRUD типов параметров

component-types.js — CRUD типов компонентов шкафа; экспорт/импорт

componentTypes.js — Дубликат (не используется)

parameters.js — CRUD параметров

materials.js — CRUD материалов; GET /cabinet/:id/items (цепочки: chain_block_template, chain_system_component, chain_type); GET /cabinet/:id/html (калькуляция: LNquantity, TMquantity, 3 UNION); POST/PUT/DELETE /cabinet/:id

manufacturers.js — CRUD производителей

consumables.js — CRUD расходных материалов

public/pages/
cabinet.html — Вкладки: Конфигурация (Системы, Компоненты шкафа, Материалы), Калькуляция, Расценки. Tooltip цепочек: showChainTooltip() для материалов, attachBlockChainTooltips() для компонентов. CSS tooltip в JS (chainTooltipStyles). Калькуляция LNquantity, TMquantity. Модалки: blockModal (добавить компонент), attachComponentModal. Экспорт PDF.

components-cabinets.html — Вкладки: Компоненты шкафов (loadTemplates), Типы, Параметры. Экспорт/импорт для каждой вкладки.

components-systems.html — Контейнер для вкладок системных компонентов

components-systems-tabs/components-tab.html — Системные компоненты, экспорт/импорт

components-systems-tabs/types-tab.html — Типы системных компонентов, экспорт/импорт

components-systems-tabs/modules-tab.html — Модули, экспорт/импорт

components-systems-tabs/params-tab.html — Параметры, экспорт/импорт

components-systems-tabs/param-types-tab.html — Типы параметров, экспорт/импорт

cabinets-list.html — Список шкафов, экспорт/импорт Excel

manufacturers.html — Производители, экспорт/импорт

consumables.html — Расходные материалы, экспорт/импорт

automation.html — Автоматизация (системы), экспорт/импорт

admin.html — Админка: экспорт/импорт дампа БД, оптимизация

admin-users.html — Управление пользователями

home.html — Главная, список проектов

login.html — Форма входа

project.html — Проект, список шкафов

public/components/
block-template-modal.html — Модальное окно компонента шкафа. Поля: тип, производитель, название, артикул, цена, вес, мощность, LN, TM, ссылка, описание. ПАРАМЕТРЫ: _renderParams (из data.parameters), _addParamRow (select + значение + кнопка ✕ удаления). МАТЕРИАЛЫ: _loadMaterials (список с количеством), _initMaterialHandlers (добавление). Сохранение: сбор параметров из DOM, отправка в body.parameters.

material-modal.html — Модальное окно выбора материала

system-comp-modal.html — Модальное окно системного компонента (с параметрами, блоками, материалами)

system-comp-form.html — Форма системного компонента

system-comp-edit.html — Редактирование системного компонента

cabinet/type-select.html — Выбор типа для шкафа

system/component-select.html — Выбор системного компонента

system/param-select.html — Выбор параметра

system/type-select.html — Выбор типа

public/js/
app.js — Главное меню, рендеринг страниц, logout

auth.js — Логин/логаут на фронте

router.js — SPA-роутер, загрузка страниц-фрагментов

store.js — Хранилище состояния

modules/api.js — fetch-обёртка (apiFetch, apiFetchText, apiFetchBlob)

modules/dom.js — escapeHtml, createTable, showError, showLoading

modules/excel.js — exportExcel, importExcel

modules/modal.js — createModal

modules/tabs.js — initTabs, resetTabs

КЛЮЧЕВЫЕ ОСОБЕННОСТИ
Цепочки связей (tooltip)
Материалы шкафа: GET /api/materials/cabinet/:id/items -> поля chain_block_template, chain_system_component, chain_type. В cabinet.html: showChainTooltip(), attachChainTooltips().

Компоненты шкафа: GET /api/cabinets/:id/blocks/html -> поля chain_system_component, chain_type. В cabinet.html: attachBlockChainTooltips().

CSS tooltip через JS (chainTooltipStyles): position:fixed, opacity:0 по умолчанию, opacity:1 с классом visible.

Калькуляция шкафа
GET /api/materials/cabinet/:id/html — SQL с 3 UNION (project_blocks, system_block_links, system_component_type_blocks). LN и TM умножаются на quantity. Итоги по компонентам и материалам + общий итог.

Экспорт/Импорт Excel
Роуты /export и /import должны быть перед /:id (исправлено в cabinets.js, block-templates.js, materials.js, systemModules.js, systemParameterTypes.js)

Импорт blockTemplates: SELECT+INSERT/UPDATE вместо ON CONFLICT (в таблице нет уникального constraint, только индекс)

Импорт systemModules: WHERE NOT EXISTS вместо ON CONFLICT DO NOTHING

Все экспорты возвращают 200 (проверено для 12 роутов)

Параметры компонентов шкафа
block-template-modal.html: методы _renderParams (загрузка из data.parameters), _addParamRow (создание строки с select, input, кнопками ✕ удаления и ✓ сохранения нового параметра)

blockTemplates.js: при сохранении (POST/PUT) — DELETE FROM component_param_values WHERE component_id = $1, затем INSERT новых параметров

Дамп БД (админка)
GET /api/admin/db/export — pg_dump --data-only --inserts --on-conflict-do-nothing

POST /api/admin/db/import — psql -f filePath
## ПРАВИЛА ОБНОВЛЕНИЯ ФАЙЛА
1. **После каждого изменения функционала** — обнови соответствующий раздел
2. **Не ломай существующее**: перед правкой сделай git checkout -- файл, протестируй изменения
3. **Порядок действий**:
   - Прочитай раздел КЛЮЧЕВЫЕ ОСОБЕННОСТИ — пойми как работает связанный функционал
   - Внеси изменение в код
   - Проверь: node -c файл.js, pm2 restart calc-wardrobe, curl тест
   - Обнови этот файл: добавь/измени описание затронутых функций
   - git add && git commit -m "краткое описание" && git push
4. **Если создаёшь новый файл** — добавь его в раздел СТРУКТУРА
5. **Если добавляешь роут** — укажи его в разделе routes/
6. **Если меняешь API** — обнови описание в routes/ и public/pages/ если затронут фронт
7. **При исправлении бага** — добавь краткое описание проблемы и решения в КЛЮЧЕВЫЕ ОСОБЕННОСТИ
8. **Держи команды актуальными**: если появились новые способы проверки — добавь в раздел КОМАНДЫ

## БЭКАП И ОТКАТ (после каждого задания)

### Создать бэкап
mkdir -p /opt/backups
pg_dump -U hrroot -h localhost bd_calc > /opt/backups/bd_calc_$(date +%Y%m%d_%H%M%S).sql
tar --exclude=node_modules --exclude=.git -czf /opt/backups/calc_wardrobe_$(date +%Y%m%d_%H%M%S).tar.gz -C /opt/calc_wardrobe .
ls -la /opt/backups/

### Откат БД
ls -la /opt/backups/bd_calc_*
psql -U hrroot -h localhost bd_calc < /opt/backups/bd_calc_ИМЯ_ФАЙЛА.sql

### Откат файлов
git checkout -- путь/к/файлу
git log --oneline -5 && git revert ХЕШ
tar -xzf /opt/backups/calc_wardrobe_ИМЯ_ФАЙЛА.tar.gz -C /opt/calc_wardrobe

## ИЗМЕНЕНИЯ 18.07.2026

### Системы автоматизации (automation.html)
- Добавлен столбец "Шкаф" (cabinet_names из API)
- Сортировка по клику на заголовки (ID, Название, Шкаф, Описание)
- Сохранение сортировки в localStorage (systems_sort)

### API systems.js
- GET /api/systems — добавлен JOIN с cabinet_systems и cabinets, поле cabinet_names

### cabinets.js
- Восстановлен после ошибки (не хватало }); после router.post('/import'))
- export/import перенесены перед /:id

### Бэкапы после задачи (18.07.2026)
- Дамп БД: bd_calc_20260718_151846.sql
- Файлы: calc_wardrobe_20260718_151846.tar.gz
- Время: 15:18

### Изменения 18.07.2026 (15:45)
- automation.html: фильтр по шкафам в заголовке столбца (иконка ⚙ + выпадающий список с галочками)
- Бэкап: бд и файлы за 15:45

### 18.07.2026 (16:00)
- automation.html: столбцы переставлены (ID, Шкаф, Название, Описание), иконка фильтра только в Шкаф

### 18.07.2026 (17:30) — Системы автоматизации
- automation.html: ссылки на шкафы в новой вкладке, модалка системы с компонентами
- Кнопки: Привязать компонент (выбор из списка), Добавить компонент, Удалить из системы
- API systems.js: cabinet_ids в GET /api/systems, cabinet_ids в POST/PUT
- API systems.js: GET /:id/cabinets

### 19.07.2026 — drag-and-drop + сортировка
- automation.html: drag+sort+filter ✅
- components-cabinets.html: Компоненты (drag+клиентская сортировка) ✅
- components-cabinets.html: Типы (drag через POST /reorder + клиентская сортировка) ✅
- manufacturers.html: drag+sort ✅
- consumables.html: drag+sort ✅
- API componentTypes.js: POST /reorder
- API blockTemplates.js: PUT /sort-order, ORDER BY position
- API manufacturers.js: PUT /sort-order, ORDER BY position
- API materials.js: PUT /sort-order, ORDER BY position
- Добавлены колонки position в таблицы БД

### 19.07.2026 (продолжение)
- components-cabinets.html: Параметры (drag+sort) ✅
- API parameters.js: POST /reorder, ORDER BY position

## ИТОГИ 19.07.2026 — Drag-and-drop + сортировка

### Реализовано на страницах:
| Страница | Drag | Sort | Сохранение |
|----------|------|------|------------|
| automation.html (Системы автоматизации) | ✅ | ✅ | localStorage + API /systems/sort-order |
| cabinet.html (Шкаф) | ✅ | ✅ | было ранее |
| components-cabinets.html / Компоненты | ✅ | ✅ | localStorage + клиентская сортировка + API /block-templates/sort-order |
| components-cabinets.html / Типы | ✅ | ✅ | localStorage + клиентская сортировка + API /component-types/reorder |
| components-cabinets.html / Параметры | ✅ | ✅ | localStorage + клиентская сортировка + API /parameters/reorder |
| manufacturers.html | ✅ | ✅ | localStorage + клиентская сортировка + API /manufacturers/sort-order |
| consumables.html | ✅ | ✅ | клиентская сортировка + API /materials/sort-order |

### Принцип работы:
1. **Drag-and-drop**: перетаскивание строк за значок ⠿, позиции отправляются через API (PUT/POST /sort-order или /reorder)
2. **Сортировка по клику**: клиентская (сортирует DOM-строки, не дёргает API), сохраняется в localStorage
3. **При обновлении**: позиции загружаются из БД (ORDER BY position), затем применяется клиентская сортировка из localStorage

### Добавленные API роуты:
- PUT /api/systems/sort-order
- PUT /api/block-templates/sort-order
- POST /api/component-types/reorder
- POST /api/parameters/reorder
- PUT /api/manufacturers/sort-order
- PUT /api/materials/sort-order

### Добавленные колонки в БД:
- systems.position
- block_templates.position
- component_types.position
- parameters.position
- manufacturers.position
- materials.position

### Особенности:
- Клиентская сортировка не конфликтует с drag-and-drop
- Сортировка по клику сохраняется в localStorage
- После обновления страницы порядок из БД (position), затем применяется сохранённая сортировка
- Для систем автоматизации дополнительно сохраняется фильтр по шкафам

## Бэкап 20260722_200903
- Откат к коммиту 6888555 (состояние на конец дня 19.07.2026)
- Начало работ: drag-and-drop + фильтрация для всех таблиц
- Дамп БД: bd_calc_20260722_200903.sql
- Файлы: calc_wardrobe_20260722_200903.tar.gz

## Изменения 20260722_211313
- automation.html: полный рефакторинг drag-and-drop (mousedown/move/up) + сортировка + фильтр
- Единый массив systems_order в localStorage для перетаскивания и сортировки по клику
- Сохранение порядка при обновлении страницы
- Дамп БД: bd_calc_20260722_211313.sql
- Файлы: calc_wardrobe_20260722_211313.tar.gz

## 20260723_013945 — Системы автоматизации: БД + drag-and-drop + фильтр
### Реализовано:
- **Таблица ** в БД (user_id, table_name, sort_order, sort_key, sort_dir, filter_data)
- **API ** — GET/PUT для сохранения сортировки и фильтра
- **** — роут
- **** — функции , , 

### Страница automation.html:
- **Drag-and-drop:** mousedown/move/up, сохраняет порядок в БД и localStorage
- **Сортировка по клику:** client-side sort, сохраняет sort_key, sort_dir, sort_order в БД
- **Фильтр по шкафам:** сохраняется в БД + localStorage
- **Статус-строка:** выводит массив ID из БД под таблицей
- **Загрузка из БД:**  восстанавливает порядок, фильтр, сортировку

### Требует доработки:
- При активном фильтре в localStorage порядок таблицы может не совпадать со статус-строкой (нужно очистить localStorage)
- Подключение db-sort.js в index.html (сейчас функции встроены в automation.html)
- Перенос на другие страницы (components-tab, manufacturers, consumables)

### Дамп БД: bd_calc_20260723_013945.sql
### Файлы: calc_wardrobe_20260723_013945.tar.gz

## 20260723_093543 — Фиксация: automation.html полностью готов
### Страница "Системы автоматизации" (automation.html)

**Реализованный функционал:**

1. **Drag-and-drop (mousedown/move/up)**
   - Захват строки за значок ⠿
   - Перемещение строки вверх/вниз
   - Отправка нового порядка на API /api/systems/sort-order (PUT)
   - Сохранение порядка в БД (user_table_sort, table_name='systems')
   - Обновление статус-строки

2. **Сортировка по клику на заголовки**
   - Клиентская сортировка (data.sort + renderSystems)
   - Поддержка столбцов: ID, Шкаф, Название, Описание
   - Сохранение sort_key и sort_dir в БД
   - Сохранение sort_order в БД
   - Обновление статус-строки
   - Визуальный индикатор (▲/▼)

3. **Фильтр по шкафам**
   - Иконка ⚙ в заголовке столбца "Шкаф"
   - Выпадающий список с чекбоксами
   - Множественный выбор
   - Сохранение filter_data в БД
   - Сохранение в localStorage
   - Бейдж с количеством выбранных

4. **Сохранение в БД (user_table_sort)**
   - sort_order: массив id (порядок строк)
   - sort_key: ключ сортировки (id/name/cabinet_names/description)
   - sort_dir: направление (asc/desc)
   - filter_data: {cabinets: [...]}

5. **Загрузка из БД**
   - Promise.all([данные, настройки])
   - Восстановление порядка строк
   - Восстановление фильтра
   - Восстановление сортировки по ключу

6. **Статус-строка**
   - Выводится под кнопками
   - Формат: "N: id1 - id2 - id3 - ..."
   - Обновляется при drag-and-drop, клике, загрузке

**Файлы:**
- /opt/calc_wardrobe/public/pages/automation.html
- /opt/calc_wardrobe/routes/table-sort.js (API)
- Таблица БД: user_table_sort

**Дамп БД:** bd_calc_20260723_093543.sql
**Файлы:** calc_wardrobe_20260723_093543.tar.gz

## 20260723_095854 — components-tab: drag-and-drop + статус-строка + БД
### Вкладка "Компоненты систем" (components-tab.html)
- ✅ Столбец с иконками переноса ⠿
- ✅ Drag-and-drop (mousedown/move/up)
- ✅ Сохранение порядка в БД (user_table_sort, table_name='system-components')
- ✅ Статус-строка под кнопками
- ✅ Сортировка по клику работает
- ❌ Фильтры — будут добавлены позже

### Дамп БД: bd_calc_20260723_095854.sql
### Файлы: calc_wardrobe_20260723_095854.tar.gz

## 20260723_102843 — components-tab: полный функционал
### Вкладка "Компоненты систем" (components-tab.html)
- ✅ Столбец с иконками переноса ⠿
- ✅ Drag-and-drop (mousedown/move/up) + сохранение в БД
- ✅ Статус-строка под кнопками
- ✅ Сортировка по клику
- ✅ Фильтры (3 шт.): Модуль системы, Название, Тип
- ✅ Модальные окна фильтров
- ✅ Логика: галка = показать только выбранное
- ✅ Сохранение filter_data в БД

### Дамп БД: bd_calc_20260723_102843.sql
### Файлы: calc_wardrobe_20260723_102843.tar.gz

## 20260723_143410 — types-tab: drag-and-drop + сортировка + БД
### Вкладка "Типы компонентов систем" (types-tab.html)
- ✅ Столбец с иконками переноса ⠿
- ✅ Drag-and-drop (mousedown/move/up) + сохранение в БД (user_table_sort, table_name='system-component-types')
- ✅ Сортировка по клику (ID, Название, Описание) + сохранение sort_key/dir/order в БД
- ✅ Статус-строка под кнопками с выводом массива порядка
- ✅ Загрузка и восстановление порядка из БД
- ✅ Кнопки: Добавить, Экспорт, Импорт
- ✅ Без фильтров (фильтры только на первой вкладке)

### Дамп БД: bd_calc_20260723_143410.sql
### Файлы: calc_wardrobe_20260723_143410.tar.gz

## 20260723_144418 — Все вкладки "Компоненты систем" готовы
### Страница components-systems.html (5 вкладок):

1. **components-tab.html** (Компоненты систем)
   - drag-and-drop + сортировка + фильтры (3 шт: Модуль, Название, Тип) + статус-строка + БД

2. **types-tab.html** (Типы компонентов систем)
   - drag-and-drop + сортировка + статус-строка + БД (без фильтров)

3. **params-tab.html** (Параметры компонентов систем)
   - drag-and-drop + сортировка + статус-строка + БД (без фильтров)

4. **modules-tab.html** (Модули системы)
   - drag-and-drop + сортировка + статус-строка + БД (без фильтров)

5. **param-types-tab.html** (Тип параметра компонента систем)
   - drag-and-drop + сортировка + статус-строка + БД (без фильтров)

### Общий функционал всех вкладок:
- Drag-and-drop (mousedown/move/up)
- Сохранение порядка в БД (user_table_sort)
- Клиентская сортировка по клику на заголовки
- Сохранение sort_key/sort_dir/sort_order в БД
- Статус-строка под кнопками с выводом массива ID
- Загрузка и восстановление порядка из БД

### Дамп БД: bd_calc_20260723_144418.sql
### Файлы: calc_wardrobe_20260723_144418.tar.gz

## 20260723_$(date +%H%M%S) — cabinet.html: drag-and-drop + сортировка + статус-строка + БД для таблицы «Системы шкафа»

### Реализовано:
- **Таблица «Системы шкафа»** (cabinetSystems) — полный функционал:
  - Drag-and-drop (mousedown/move/up) за значок ⠿
  - Сохранение порядка в БД (user_table_sort, table_name='cabinet_systems')
  - Сортировка по клику на заголовки: ID, Система, Описание
  - Клиентская сортировка с сохранением sort_key/sort_dir/sort_order в БД
  - Статус-строка с массивом ID между заголовком и таблицей
  - Загрузка и восстановление порядка из БД
  - Делегирование событий сортировки на thead

### Исправлен баг:
- **Проблема:** parseFloat выкусывал число из строк типа "6нП16", все значения становились равны 6, сортировка не работала.
- **Решение:** числовая сортировка применяется только если ОБА значения — чистые числа (va == na.toString()). Иначе localeCompare.

### Файлы:
- /opt/calc_wardrobe/public/pages/cabinet.html (функция loadSystems)
- API: /api/table-sort/cabinet_systems (GET/PUT)

### Дамп БД: bd_calc_20260723_*.sql
### Файлы: calc_wardrobe_20260723_*.tar.gz

## 20260723_$(date +%H%M%S) — cabinet.html: синхронизация порядка «Компоненты систем» с «Системы шкафа»

### Реализовано:
- **Таблица «Компоненты систем»** теперь использует порядок из таблицы «Системы шкафа»:
  - При загрузке: получает `sort_order` из `user_table_sort` (table_name='cabinet_systems') и сортирует системы соответственно
  - При изменении порядка в «Системах шкафа» (drag-and-drop или сортировка по клику) — `loadSystemComponents()` вызывается автоматически, перестраивая блоки на лету

### Файлы:
- /opt/calc_wardrobe/public/pages/cabinet.html (loadSystemComponents, loadSystems)

### Дамп БД: bd_calc_20260723_*.sql
### Файлы: calc_wardrobe_20260723_*.tar.gz

## 20260723_1828 — cabinet.html: сортировка + фильтры для таблиц «Компоненты систем»

### Реализовано:
- **Таблица «Компоненты систем»** (внутри каждой системы):
  - Сортировка по клику: ID, Компонент, Тип, Модуль
  - Фильтры: Компонент, Тип, Модуль (⚙ + модальное окно + чекбоксы + Выбрать все/Снять все)
  - Статус-строка с link_id между заголовком и таблицей
  - Сохранение в БД (table_name='system_components_' + systemId)
- **Синхронизация** с «Системы шкафа» — перестроение на лету
- **Столбец ID** шириной под 4 символа

### Файлы:
- /opt/calc_wardrobe/public/pages/cabinet.html

### Дамп БД: bd_calc_20260723_1828*.sql
### Файлы: calc_wardrobe_20260723_1828*.tar.gz

## 20260723_1930 — cabinet.html: все 4 таблицы готовы (drag-and-drop + сортировка + фильтры + статус-строки + БД)

### Реализовано полностью:
1. **Системы шкафа** — drag-and-drop, сортировка (ID, Система, Описание), статус-строка, сохранение в БД (cabinet_systems)
2. **Компоненты систем** — сортировка (ID, Компонент, Тип, Модуль), фильтры (Компонент, Тип, Модуль), статус-строка, сохранение в БД (system_components_ID)
3. **Компоненты шкафа** — drag-and-drop, сортировка (ID, Система, Компонент систем, Тип, Название, LN, TM, Кол-во), фильтры (Система, Компонент систем, Тип, Название), статус-строка, БД (cabinet_blocks)
4. **Материалы шкафа** — drag-and-drop, сортировка (ID, Система, Компонент систем, Название, Ед., Цена, Кол-во, LN, TM), фильтры (Система, Компонент систем, Название), статус-строка, БД (cabinet_materials)

### Синхронизация:
- Порядок систем в «Компоненты систем» синхронизирован с «Системы шкафа» на лету

### Файлы:
- /opt/calc_wardrobe/public/pages/cabinet.html

### Дамп БД: bd_calc_20260723_1930*.sql
### Файлы: calc_wardrobe_20260723_1930*.tar.gz

## 24.07.2026 — Комплексная оптимизация БД, бэкенда, SPA-страниц и роутинга
### Реализовано:
- БД: Смена владельцев объектов на hrroot; консолидация полей LN/TM напрямую в таблицы сущностей; удаление устаревших EAV-таблиц (ln_values, tm_values) и 8 неиспользуемых таблиц (consumables, breakers и др.).
- Бэкенд: Ликвидация N+1 запросов за счет SQL json_agg в systems.js и systemComponents.js; универсальная поддержка items и ids во всех роутах /reorder; увеличение лимита запросов до 50MB; настройка пула pg.Pool (config/db.js); обработчик 404 JSON для /api/*; поддержка dotenv.
- Фронтенд: Полное удаление отладочных строк #sortStatusLine и .comp-status-line; устранение утечек памяти при Drag-and-Drop; сохранение и авто-восстановление сортировки по клику на заголовки из БД; удаление location.reload() из модальных окон для сохранения SPA-роутинга; единый глобальный дебоунс тултипов цепочек связей.
- Файловая структура: Удалены файлы-дубликаты (block-templates.js, component-types.js).
### Файлы:
- server.js, config/db.js, routes/table-sort.js, routes/systems.js, routes/systemComponents.js, routes/blockTemplates.js, routes/materials.js, routes/cabinets.js, routes/projects.js, routes/systemComponentTypes.js, routes/systemModules.js, routes/systemParameters.js, routes/systemParameterTypes.js, routes/componentTypes.js, routes/parameters.js, routes/manufacturers.js
- public/index.html, public/pages/cabinet.html, public/pages/automation.html, public/pages/manufacturers.html, public/pages/consumables.html, public/pages/cabinets-list.html, public/pages/home.html, public/pages/project.html, public/pages/admin.html
- public/pages/components-systems.html, public/pages/components-cabinets.html, все дочерние вкладки
- public/components/ (block-template-modal.html, material-modal.html, system-comp-modal.html, system-comp-edit.html, params-modal.html, param-types-modal.html, types-modal.html, modules-modal.html)
