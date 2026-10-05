# 🐼 Chinese Flashcards

An interactive web app to learn Chinese HSK characters with flashcards, quizzes, audio, notes, tags, and dark mode.

## 🏗️ Project Structure

This is a monorepo containing:

- **`client/`** — Frontend (HTML, SASS, Vanilla JS)
- **`server/`** — Backend API (Node.js, Express, MongoDB)

## ✨ Features

### Client

- 📚 Interactive flashcards with flip animation
- 🖼️ Image upload with auto-compression
- 🔊 Chinese Text-to-Speech (Web Speech API)
- 📝 Notes + Drawing for each card
- 🎯 4 quiz modes: listening, character→meaning, meaning→character, character→pinyin
- 🏷️ Tags, search, and filter
- ⭐ Favorites and statistics
- 🌙 Dark/Light theme
- 💾 LocalStorage persistence

### Server

- 🔐 JWT authentication
- 📦 REST API for cards, notes, quizzes
- 🗄️ MongoDB database
- 🔒 Password hashing with bcryptjs

## 🛠️ Tech Stack

**Client:**

- HTML5
- SASS (SCSS)
- Vanilla JavaScript (ES6+)
- Web Speech API
- Canvas API

**Server:**

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/chinese-flashcards.git
cd chinese-flashcards
```
