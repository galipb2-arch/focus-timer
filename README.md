# Focus Timer

A small Pomodoro-style focus timer that runs entirely in the browser — no build step, no dependencies.

## Features

- Focus / Short Break / Long Break modes with a circular progress ring
- Task list: add tasks, mark them done, and track pomodoros completed per task
- Daily streak counter
- Chime and confetti celebration when a focus session completes
- State (tasks, streak, mode) persisted to `localStorage`

## Running locally

This is a static site (`index.html`, `style.css`, `app.js`), so any static file server works. A ready-made one is included:

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open [http://localhost:8843](http://localhost:8843) in your browser.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Markup for the timer, task list, and streak display |
| `style.css` | Styling, including light/dark theme support |
| `app.js` | Timer logic, task management, and persistence |
| `serve.ps1` | Minimal PowerShell static file server for local development |
