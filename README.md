<div align="center">

<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# FlyWire Connectome Lab 🧠🪰

<p>Интерактивный 3D-веб-атлас коннектома целого мозга дрозофилы (<em>Drosophila melanogaster</em>, FlyWire Nature 2024, 139k нейронов, 54.5 млн синапсов), симулятор полёта <strong>Fly-Pilot</strong> на основе оптического потока T4/T5 и кольцевого компаса EPG, симулятор нейронных рефлексов и биофизическая игра на реакцию <strong>«Поймай муху»</strong> (Giant Fiber Escape System).</p>

<p>
  <a href="https://aistudio.google.com/apps">Built with Google AI Studio</a>
</p>

</div>

---

## 🚀 Публикация на GitHub Pages

Проект полностью настроен для работы на GitHub Pages. Все пути к ассетам сконфигурированы относительно (`base: './'`), что позволяет сайту корректно открываться как на домене верхнего уровня, так и в подпапке репозитория (`https://<username>.github.io/<repo-name>/`).

### Способ 1: Автоматический через GitHub Actions (Рекомендуемый)

1. Отправьте код в репозиторий GitHub в ветку `main`.
2. В репозитории GitHub перейдите в **Settings** ➔ **Pages**.
3. В разделе **Build and deployment** ➔ **Source** выберите **GitHub Actions**.
4. GitHub Actions автоматически запустит воркфлоу из `.github/workflows/deploy.yml`, соберёт и опубликует сайт по ссылке `https://hznameai-cmyk.github.io/FlyWire/`.

---

### Способ 2: Через команду npm run deploy (gh-pages)

Если вы клонировали репозиторий локально:

1. Выполните команду:
   ```bash
   npm run deploy
   ```
   *Она автоматически соберёт проект (`npm run build`) и зальёт готовую сборку в ветку `gh-pages`.*
2. В репозитории на GitHub: **Settings** ➔ **Pages** ➔ **Source**: выберите `Deploy from a branch` ➔ ветка `gh-pages` ➔ папка `/ (root)` ➔ **Save**.

---

## 💻 Локальный запуск и разработка

```bash
# Установка зависимостей
npm install

# Запуск локального сервера разработки
npm run dev

# Проверка типов
npm run lint

# Сборка проекта для продакшена (в папку dist/)
npm run build

# Предпросмотр собранной версии
npm run preview
```

---

## 🛠 Технологический стек

- **React 19** + **TypeScript**
- **Vite 6** (`base: './'`)
- **Tailwind CSS v4**
- **Lucide React Icons**
- **Web Audio API** (генеративный синтез звуков нервных импульсов, крылового мотора и предупреждений)
- **Canvas Confetti**
