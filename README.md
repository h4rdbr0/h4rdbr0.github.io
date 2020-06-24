# Тестовое задание

Представлен график работы сотрудников. Входные данные находятся в файле `employee.json`. При запуске на локальной машине необходимо использовать вэб-сервер для избежания ошибок при загрузке данных (CORS request not HTTP).

# Использование

После загрузки страницы автоматически происходит загрузка графика работы. Затем происходит проверка правильности входящего объекта:
- Наличие полей `virtual` и `actual` в объекте (плановое и фактическое время).
- Заполенные массивы `virtual` и `actual`.
- Массивы `virtual` и `actual` имею одинаковую длину.
- Дата начала и конца рабочего времени должны совпадать.

После успешной проверки полностью отобразится график работы.
Закрашенная область соответствует плановому времени работы, заштрихованная область - фактическому. При нажатии на поле с сотрудником происходит смена планового времени на фактическое и наоборот.
Также доступе фильтр по дате - "Выбор даты".