# GREEN-API MAX Messenger

Web-мессенджер на React/Next.js для работы с MAX через GREEN-API.

Проект поддерживает получение чатов и истории, отправку текстовых сообщений, создание чата по номеру телефона, локальную очередь исходящих сообщений, повторные попытки отправки и синхронизацию между несколькими вкладками браузера.

## Локальный запуск

Требования:

- Node.js
- pnpm

Установка зависимостей:

```bash
pnpm i
```

Запуск dev-сервера:

```bash
pnpm dev
```

После запуска открыть адрес, который выведет Next.js, обычно:

```text
http://localhost:3000
```

При первом запуске необходимо указать параметры GREEN-API instance в настройках приложения:

- API URL
- ID Instance
- API Token Instance

## Основной стек

- Next.js
- React
- TypeScript
- Tailwind CSS
- Jotai
- TanStack Query
- IndexedDB
- BroadcastChannel
- GREEN-API
- OpenAPI generated client

## Архитектура

Основные области проекта:

```text
app/
shared/
domains/
```

Messaging domain разделен на:

```text
domains/messaging/
  domain/
  data-access/
  feature-shared/
  feature-messenger/
```

### domain

Содержит прикладные модели и типы:

- Chat
- Message
- статусы сообщений
- GREEN-API config
- общие константы

Domain не зависит от React и generated API DTO.

### data-access

Содержит:

- generated GREEN-API client
- gateways
- mapping DTO -> domain
- IndexedDB persistence
- API для чатов и сообщений

UI не работает с generated API напрямую.

Основной поток:

```text
generated API
-> gateway
-> domain model
-> feature store/facade
-> UI
```

### feature-shared

Содержит общее messaging-state, например GREEN-API config.

### feature-messenger

Содержит:

- список чатов
- выбранный чат
- сообщения
- composer
- settings
- UI state
- outbox
- sender
- ViewModel-логику

## Работа с чатами

При старте приложение получает чаты с GREEN-API и объединяет их с локально сохраненными чатами.

Новый чат можно создать по номеру телефона. Номер используется для lookup через GREEN-API, после чего приложение получает канонический `chatId`.

Внутри приложения `chatId` является основным идентификатором чата. Телефон хранится как дополнительный атрибут.

Локально добавленные чаты сохраняются в IndexedDB. Это позволяет не терять новый чат, если он еще не появился в серверном `GetChats`.

Merge выполняется по `chatId`:

```text
server chats
+
local-only chats
->
final chat list
```

Когда сервер уже возвращает тот же чат, серверные данные могут обогатить локальную запись.

## Поиск по чатам

Поиск выполняется локально по уже загруженному списку.

Поддерживается поиск:

- по имени
- по номеру телефона

Для телефона пробелы, скобки и дефисы не влияют на сравнение.

## Local-first отправка сообщений

Отправка не идет напрямую из `MessageComposer` в GREEN-API.

Сначала сообщение сохраняется локально:

```text
MessageComposer
-> useMessagesStore
-> IndexedDB outbox
-> sender
-> GREEN-API SendMessage
```

Это близко к local-first подходу.

Пользователь сразу видит сообщение в интерфейсе, даже если сети нет. Серверная отправка выполняется отдельно фоновым sender-ом.

Преимущества:

- сообщение не теряется при временном отсутствии сети
- есть контролируемый retry
- UI сразу показывает локальный результат действия пользователя
- отправка не привязана к жизненному циклу конкретного React component
- несколько вкладок могут безопасно работать с одной очередью

## Outbox

Исходящие сообщения сохраняются в IndexedDB.

Основные состояния:

```text
pending
sending
accepted
failed
```

### pending

Сообщение сохранено локально и готово к отправке либо ожидает следующего retry.

### sending

Sender забрал запись в работу.

При claim записываются:

```text
leaseOwner
leaseUntil
```

### accepted

`SendMessage` успешно завершился и сервер вернул remote message id.

Локальная запись пока остается в outbox, чтобы сообщение не исчезло между успешным `SendMessage` и появлением того же сообщения в `GetChatHistory`.

### failed

Автоматические попытки исчерпаны.

Запись остается локально. Пользователь может выполнить Retry вручную.

## Sender

Sender - фоновый processor очереди.

Упрощенная логика:

```text
wake
-> claimNext
-> SendMessage
-> success
   -> accepted
-> error
   -> pending + nextAttemptAt
   -> либо failed
-> взять следующую запись
```

Sender существует отдельно от UI и может продолжать работу независимо от конкретного компонента.

## Atomic claim

Каждая вкладка имеет собственный React/Jotai runtime, поэтому нельзя использовать только локальный state для блокировки отправки.

Claim выполняется в одной `IndexedDB readwrite transaction`:

```text
прочитать outbox
-> восстановить expired leases
-> выбрать eligible pending message
-> status = sending
-> leaseOwner = current sender
-> leaseUntil = ...
-> commit
```

Если две вкладки одновременно пытаются claim-нуть одну запись, IndexedDB сериализует write transactions.

После commit первой вкладки вторая уже видит `sending` и не получает ту же запись.

## Lease и восстановление после закрытия вкладки

Состояние `sending` не должно оставаться навсегда.

Например:

```text
Tab A
-> claim
-> sending
-> вкладка закрылась
```

Поэтому sender использует lease.

После `leaseUntil` запись считается просроченной и при следующем claim восстанавливается:

```text
sending
-> pending
```

После этого сообщение может забрать другая вкладка.

## Планирование следующего wake

Sender не делает постоянный polling.

Когда готовой работы нет, вычисляется ближайшее время, когда работа может появиться.

Учитываются:

```text
pending.nextAttemptAt
sending.leaseUntil
```

Например:

```text
retry через 20 секунд
lease истекает через 10 секунд
```

sender проснется через 10 секунд.

Это позволяет восстановить очередь даже после закрытия вкладки, которая держала lease.

## Retry

При ошибке отправки сообщение снова переводится в `pending` и получает новый `nextAttemptAt`.

Используется exponential backoff.

Количество автоматических попыток ограничено общей константой `MAXIMUM_SEND_ATTEMPTS`.

Retry может выполнить другая вкладка.

Например допустимо:

```text
attempt 1 -> Tab A
attempt 2 -> Tab B
attempt 3 -> Tab A
```

Главная гарантия - одна и та же attempt не должна выполняться параллельно несколькими sender-ами.

## Offline flow

При отсутствии сети:

```text
user sends message
-> IndexedDB
-> message immediately appears in UI
-> sender attempts request
-> network error
-> pending + nextAttemptAt
-> retry
```

Пока сообщение существует только локально, UI показывает sending state.

После исчерпания retries:

```text
failed
-> error indicator
-> manual Retry
```

## Статусы сообщений

Есть два уровня статуса.

### Локальный outbox status

Пока сообщение живет в outbox:

```text
pending/sending -> spinner
failed -> error indicator
accepted -> одна галочка
```

### Серверный delivery status

После reconciliation источником становится remote message из истории.

Для исходящих сообщений используются server statuses:

```text
sent -> одна галочка
delivered -> две галочки
read -> две галочки в отдельном read-state
```

UI не показывает доставку или прочтение до фактического серверного подтверждения.

## Reconciliation

После успешного `SendMessage` outbox record получает `remoteMessageId`.

При следующем получении истории приложение ищет сообщение с тем же id.

```text
remote message найден
-> local accepted record удаляется
-> remote message становится source of truth
```

Это позволяет избежать duplicate messages и визуального мерцания.

## Синхронизация между вкладками

IndexedDB является общей durable storage для вкладок одного origin.

BroadcastChannel используется только как сигнал об изменении.

Важно:

```text
IndexedDB = source of truth
BroadcastChannel = invalidation / wake signal
Jotai = per-tab reactive projection
```

### Outbox sync

Пример:

```text
Tab A
-> IndexedDB commit
-> update local Jotai
-> BroadcastChannel "changed"
```

Tab B:

```text
receive event
-> read IndexedDB
-> update local Jotai
-> wake sender
```

По BroadcastChannel не передается authoritative очередь. Вкладка всегда перечитывает IndexedDB.

## Почему sender работает в каждой вкладке

В проекте нет обязательного leader tab.

Каждая вкладка может иметь свой sender.

Безопасность обеспечивается:

- atomic IndexedDB claim
- lease
- retry scheduling

Если одна вкладка закрылась, другая сможет продолжить обработку после истечения lease.

## Синхронизация чатов между вкладками

Для локально добавленных чатов используется тот же принцип:

```text
Tab A adds chat
-> IndexedDB commit
-> local update
-> BroadcastChannel notification
```

Tab B:

```text
notification
-> re-read IndexedDB
-> update chat list
```

Поэтому новый чат появляется в других вкладках без полного reload страницы.

## Persistence-first

Для durable операций используется порядок:

```text
IndexedDB commit
-> reactive state update
-> BroadcastChannel notification
```

Сначала подтверждается persistence, только после этого изменяется локальная projection.

## Jotai и TanStack Query

Jotai используется для client state:

- selected chat
- active view
- search
- settings UI
- hydrated flags
- reactive projection persisted data

TanStack Query используется для server state:

- server chats
- message history

UI не должен самостоятельно смешивать server state и IndexedDB state. Это делается через feature store/facade.

## ViewModel

Presentation logic вынесена в feature ViewModel.

Там находятся, например:

- группировка сообщений по датам
- вычисление соседних bubble
- presentation status
- выбор spinner/check/error visual state

Gateway преобразует API данные в domain, но не решает, какую иконку рисовать.

## Responsive UI

Desktop:

```text
navigation
chat list
conversation
```

Mobile:

```text
chat list
```

или:

```text
conversation
```

Responsive layout контролируется CSS. Основная логика не зависит от `window.innerWidth` или React viewport detection.

## Settings

GREEN-API credentials задаются через Settings.

Если конфигурация отсутствует, приложение требует заполнить ее перед работой с API.

## Shared logger

Для application logging используется общий logger из `shared`.

Сейчас implementation может использовать:

```text
console.log
console.error
```

В дальнейшем backend логирования можно заменить централизованно, например на Sentry, без массового изменения feature-кода.

## Форматирование

Проверка:

```bash
pnpm format:check
```

Форматирование:

```bash
pnpm format
```

Generated API code вручную не форматируется и не редактируется.

## Production build

```bash
pnpm build
```

## Краткая схема отправки

```text
User
  ↓
MessageComposer
  ↓
IndexedDB outbox
  ↓
pending
  ↓
atomic claim
  ↓
sending + lease
  ↓
GREEN-API SendMessage
  ↓
accepted
  ↓
GetChatHistory
  ↓
reconciliation
  ↓
remote message
  ↓
sent / delivered / read
```

При ошибке:

```text
sending
-> error
-> pending + nextAttemptAt
-> retry
```

После достижения лимита:

```text
failed
-> manual Retry
-> pending
```

При нескольких вкладках:

```text
IndexedDB
= shared durable state

BroadcastChannel
= invalidation/wake signal

Jotai
= per-tab reactive state

Sender
= per-tab worker

Atomic claim + lease
= защита от параллельной отправки одной попытки
```

Именно это сочетание дает local-first UX, надежную очередь и корректную работу при нескольких одновременно открытых вкладках.
