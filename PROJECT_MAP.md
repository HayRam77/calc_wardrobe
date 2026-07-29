# 🗺️ КАРТА ПРОЕКТА calc_wardrobe
обязан максимально бережно относиться к существующему работающему коду и вносить только необходимые дополнения, не затрагивая и не ломая исходный функционал
При создании полного кода файла проверяй полный функционал прописанный в представленом файле для изминения и соответственно вноси его в код

## 📋 ИНСТРУКЦИЯ И ПРАВИЛА ДЛЯ НОВОГО ЧАТА
1. **Чтение карты:** Прочитай этот файл полностью перед началом работы.
2. **Передача кода без сжатия:** Любые изменения записывать **полным несжатым кодом файла** от первой до последней строки (без вырезок `// остальной код без изменений...`).
3. **Синтаксическая проверка:** Перед перезапуском сервера всегда выполнять `node -c /путь/к/файлу.js`.
4. **Архитектурные стандарты SPA:**
   - Запрещен `location.reload()` в модальных окнах — перерисовка таблиц выполняется динамически (реактивно) без сброса SPA-роутера.
   - Порядок Drag-and-Drop и клик-сортировок всегда сохраняются и читаются из БД (`user_table_sort`) через `/api/table-sort/:tableName`.
   - В публичном интерфейсе отключены отладочные информационные строки с массивами ID.
5. **Процедура фиксации результатов:**
   - Выполняется **СТРОГО И ТОЛЬКО ПО ПРЯМОЙ КОМАНДЕ ПОЛЬЗОВАТЕЛЯ: «Фиксируй»**.
   - Вычисляются динамические серверные переменные: `NOW_FILE=$(date +%Y%m%d_%H%M%S)`, `NOW_DATE=$(date +%d.%m.%Y)`.
   - Создаются бэкапы БД и файлов, обновляется `PROJECT_MAP.md`, делается Git commit и push.
   - **ОБЯЗАТЕЛЬНОЕ КОНТРОЛЬНОЕ СЛОВО:** В конце успешной фиксации ИИ ОБЯЗАН написать слово: **«зафиксировал»**.

---

## 🖥️ СЕРВЕР И УЧЁТНЫЕ ДАННЫЕ
- **VPS:** calc (root)
- **Путь:** `/opt/calc_wardrobe`
- **БД:** PostgreSQL `bd_calc`, пользователь `hrroot` / пароль `CalcWardrobe2026!`, `localhost`
- **Git:** ветка `calc2.0`
- **PM2:** процесс `calc-wardrobe`
- **Порт:** 3001, прокси nginx -> `calc.h-r-h.ru:443`
- **SPA:** страницы-фрагменты, стили подключаются через JS

| Система | Логин | Пароль |
|---------|-------|--------|
| Приложение (админ) | admin | 121212 |
| PostgreSQL | hrroot | CalcWardrobe2026! |
| VPS | root | (стандартный) |

---

## 🛠️ КОМАНДЫ ОБСЛУЖИВАНИЯ
```bash
set +H                                          # Отключение спецсимволов истории в Bash
pm2 flush calc-wardrobe                         # Очистить логи PM2
pm2 restart calc-wardrobe                       # Перезапуск приложения
pm2 logs calc-wardrobe --lines 15 --nostream    # Просмотр логов
node -c /opt/calc_wardrobe/routes/файл.js       # Проверка синтаксиса JS
git checkout -- файл                            # Откатить изменения файла из Git
psql -U hrroot -h localhost -d bd_calc -c "SQL"  # Запрос к БД
📂 СТРУКТУРА ПРОЕКТА
Бэкенд (Node.js / Express)
server.js — Главный сервер (подключает CORS, парсеры 50MB, роутеры /api/*, SPA fallback index.html)
config/db.js — Пул соединений PostgreSQL (pg.Pool)
middleware/
auth.js — Валидация JWT токена
isAdmin.js — Проверка прав администратора
ownerCheck.js — Проверка владельца проекта
validation.js — Валидация запросов (express-validator)
errorHandler.js — Глобальный обработчик ошибок
routes/ (/api/...)
auth.js — Авторизация (POST /login, /register)
admin.js — Управление пользователями, дамп БД, оптимизация
projects.js — CRUD проектов
cabinets.js — CRUD шкафов, привязка систем, компонентов и групп материалов
blockTemplates.js — CRUD компонентов шкафа, привязка материалов и групп материалов
systems.js — CRUD систем автоматизации, копирование систем
systemComponents.js — CRUD системных компонентов, привязанные блоки, материалы и группы материалов
systemComponentTypes.js — CRUD типов системных компонентов, привязанные материалы и группы материалов
componentTypes.js — CRUD типов компонентов шкафа, привязка материалов и групп материалов (component_type_materials, component_type_material_groups)
systemModules.js — CRUD модулей систем
systemParameters.js / systemParameterTypes.js — Справочники параметров
parameters.js — CRUD общих параметров
materialGroups.js — CRUD групп материалов, привязка/отвязка к 5 типам объектов (/bind)
materials.js — CRUD материалов, 10-UNION SQL калькуляция с учётом полного древовидного наследования
manufacturers.js — CRUD производителей
table-sort.js — Сохранение и загрузка сортировки/фильтров таблиц (user_table_sort)
Фронтенд (SPA / Vanilla JS)
public/index.html — Главный каркас SPA приложения
public/pages/
home.html — Список проектов
project.html — Карточка проекта
cabinet.html — Конфигуратор шкафа (системы, компоненты систем, компоненты шкафа, материалы, калькуляция, расценки, столбец «Компонент шкафа», экспорт PDF)
automation.html — Системы автоматизации
consumables.html — Двухвкладочный интерфейс («Материалы» и «Группы материалов»)
manufacturers.html — Справочник производителей
components-cabinets-tabs/ (templates-tab.html, types-tab.html, params-tab.html) — Вкладки компонентов шкафа
components-systems-tabs/ (components-tab.html, types-tab.html) — Вкладки системных компонентов
public/components/
block-template-modal.html — Модальное окно компонента шкафа
cabinet-component-type-modal.html — Модальное окно типа компонента шкафа (материалы, группы материалов)
system-comp-modal.html — Модальное окно системных компонентов
types-modal.html — Модальное окно типов системных компонентов
material-modal.html — Модальное окно выбора/создания материала
🗄️ БАЗА ДАННЫХ (Ключевые таблицы)
systems — Системы автоматизации (id, name, page, installation, room, description, position)
cabinets — Шкафы (id, project_id, name, description, width, height, depth)
cabinet_systems — Связь шкафов и систем (id, cabinet_id, system_id, description, position)
project_blocks — Компоненты в шкафу (id, cabinet_id, template_id, quantity, position)
block_templates — Компоненты шкафа (id, name, article, price, ln, tm, position)
component_types — Типы компонентов шкафа (id, name, description, position)
system_components — Системные компоненты (id, name, type_id, module_id, ln, tm, position)
system_components_link — Связь систем и компонентов (id, system_id, component_id, quantity)
materials — Справочник материалов (id, article, name, manufacturer_id, unit, price, ln, tm, position)
material_groups — Группы материалов (id, name, description, position)
material_group_items — Состав групп материалов (id, group_id, material_id, quantity, position)
Таблицы привязок материалов и групп материалов:
cabinet_material_groups (id, cabinet_id, group_id, quantity)
block_template_material_groups (id, block_template_id, group_id, quantity)
component_type_materials (id, type_id, material_id, quantity)
component_type_material_groups (id, type_id, group_id, quantity)
system_component_material_groups (id, component_id, group_id, quantity)
system_component_type_material_groups (id, type_id, group_id, quantity)
user_table_sort — Состояние Drag-and-Drop, сортировок и фильтров (user_id, table_name, sort_order, sort_key, sort_dir, filter_data)
💾 БЭКАП И ОТКАТ
Создать бэкап вручную
code
Bash
NOW_FILE=$(date +%Y%m%d_%H%M%S)
mkdir -p /opt/backups
pg_dump -U hrroot -h localhost bd_calc > /opt/backups/bd_calc_${NOW_FILE}.sql
tar --exclude=node_modules --exclude=.git -czf /opt/backups/calc_wardrobe_${NOW_FILE}.tar.gz -C /opt/calc_wardrobe .
📜 ИСТОРИЯ ИЗМЕНЕНИЙ (Сводка)
Дата	Изменения
18.07.2026	Добавлены фильтры по шкафам, привязка компонентов и модальные окна в automation.html.
19.07.2026	Внедрен универсальный Drag-and-Drop и клиентская сортировка во все справочники.
23.07.2026	Создана таблица user_table_sort и API /api/table-sort/:tableName для сохранения порядка и фильтров в БД.
24.07.2026	Оптимизация БД. Ликвидированы N+1 запросы за счет json_agg. Увеличен лимит HTTP телозапросов до 50MB.
25.07.2026	Добавлены поля page и installation для систем автоматизации. Внедрены универсальные модальные фильтры (⚙).
27.07.2026	Добавлено добавление новых элементов строго в конец таблиц без алфавитного сброса порядка.
28.07.2026	Созданы таблицы БД для групп материалов, бэкенд API materialGroups.js и двухвкладочный интерфейс consumables.html.
29.07.2026	[ТЕКУЩАЯ СЕССИЯ] Полное завершение сквозного наследования материалов и Групп материалов для всех 5 типов объектов (Шкафы, Компоненты шкафов, Типы компонентов шкафов, Компоненты систем, Типы компонентов систем). Расширена калькуляция материалов шкафа до 10 UNION. Внедрено выделение жирным шрифтом (<strong>) элементов с привязками во всех 4 справочниках. В предпросмотр тултипов при наведении добавлены группы материалов. Создан компонент CabinetComponentTypeModal.