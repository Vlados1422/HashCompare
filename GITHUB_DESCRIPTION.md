# HashCompare

🔐 Современное веб-приложение для вычисления и сравнения хэшей файлов. Поддерживает MD5, SHA-1, SHA-256, SHA-512.

## Возможности

- 📁 Вычисление хэшей файлов (MD5, SHA-1, SHA-256, SHA-512)
- ✏️ Ручное сравнение хэшей
- 🔄 Автоматическое сравнение нескольких файлов
- 📋 Копирование хэшей в буфер обмена
- 📱 Адаптивный дизайн для мобильных устройств
- 🔒 Все вычисления локальны — файлы не отправляются на сервер
- 💻 Установка на Windows как десктопное приложение

## Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/hashcompare.git
cd hashcompare

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev

# Собрать для продакшена
npm run build
```

## Установка на Windows

### Вариант 1: Через браузер (рекомендуется)
1. Откройте приложение в Chrome или Edge
2. Нажмите ⋮ → «Сохранить и поделиться» → «Установить страницу как приложение»
3. Готово! Приложение появится в меню «Пуск»

### Вариант 2: Из исходного кода
1. Установите Node.js 18+
2. Скачайте код: `git clone https://github.com/yourusername/hashcompare.git`
3. Установите зависимости: `npm install`
4. Запустите: `npm run dev`
5. Откройте http://localhost:5173

### Вариант 3: Создать .exe файл
```bash
npm install
npm install --save-dev electron electron-builder
npm run build
npx electron-builder
```

## Технологии

- React 18
- TypeScript
- Vite
- Tailwind CSS
- CryptoJS

## Лицензия

MIT

## Демо

Попробуйте онлайн: [https://hashcompare.example.com](https://hashcompare.example.com)

---

**HashCompare** — проверьте целостность ваших файлов 🔒
