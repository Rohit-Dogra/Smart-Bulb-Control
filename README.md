# Bulb Control Project

## 🚀 Overview
This project is a React-based web application that controls bulbs remotely. It uses Material-UI for the UI, WebSockets for real-time updates, and Node.js as the backend.

## 📂 Project Structure
```
BulbControlProject/
│── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.js
│   │   │   ├── BulbControl.js
│   │   ├── styles.css
│   │   ├── index.js
│   ├── public/
│   │   ├── index.html
│   ├── package.json
│   ├── .env
```

## 🛠️ Installation & Setup

1. **Clone the Repository**
```sh
git clone https://github.com/yourusername/BulbControlProject.git
cd BulbControlProject/frontend
```

2. **Install Dependencies**
```sh
npm install
```

3. **Start the Development Server**
```sh
npm start
```

## 🔧 Troubleshooting
### 1️⃣ `react-scripts` is not recognized
If you get:
```
'react-scripts' is not recognized as an internal or external command
```
Run:
```sh
npm install react-scripts
```

### 2️⃣ `Could not find index.html`
Ensure that `public/index.html` exists. If missing, create it with:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bulb Control</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>
```

### 3️⃣ `Module not found: Can't resolve './components/App'`
Ensure `App.js` exists in `src/components/` and is correctly imported in `index.js`:
```js
import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import "../styles.css";
ReactDOM.render(<App />, document.getElementById("root"));
```

### 4️⃣ `@emotion/react` Module Not Found
Run:
```sh
npm install @emotion/react @emotion/styled
```

## 📝 License
This project is licensed under the MIT License.

## 📞 Contact
For support, contact: [your email] or create an issue in the repository.

---

Happy Coding! 🚀

