export type StackOption =
  | "React"
  | "Node.js"
  | "PHP"
  | "Laravel"
  | "CodeIgniter"
  | "HTML"
  | "Golang"
  | "Custom";

export interface GenerateParams {
  appName: string;
  description?: string;
  stack: StackOption;
  language?: string;
}

export interface GeneratedProject {
  files: Record<string, string>;
  mainLanguage: string;
  instructions?: string;
}

export function generateCode({ appName, description = "", stack, language }: GenerateParams): GeneratedProject {
  const banner = `/*\n * ${appName}\n * ${description}\n */\n\n`;

  switch (stack) {
    case "Node.js": {
      const files = {
        "package.json": JSON.stringify(
          {
            name: appName.toLowerCase().replace(/\s+/g, "-"),
            version: "1.0.0",
            type: "module",
            scripts: { start: "node index.js" },
            dependencies: { express: "^4.19.2" },
          },
          null,
          2
        ),
        "index.js": `${banner}import express from 'express';\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.get('/', (req, res) => {\n  res.send('<h1>${appName}</h1><p>${description}</p>');\n});\n\napp.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));\n`,
        "README.md": `# ${appName}\n\n${description}\n\n## Menjalankan\n\n1. npm install\n2. npm start\n`,
      };
      return { files, mainLanguage: "javascript" };
    }
    case "React": {
      const files = {
        "index.html": `<!doctype html>\n<html>\n  <head>\n    <meta charset=\"utf-8\"/>\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>\n    <title>${appName}</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"./main.jsx\"></script>\n  </body>\n</html>`,
        "main.jsx": `${banner}import React from 'react'\nimport { createRoot } from 'react-dom/client'\n\nfunction App(){\n  return (<main style={{fontFamily:'ui-sans-serif',padding:24}}><h1>${appName}</h1><p>${description}</p></main>)\n}\n\ncreateRoot(document.getElementById('root')).render(<App />)\n`,
        "package.json": JSON.stringify(
          {
            name: appName.toLowerCase().replace(/\s+/g, "-"),
            version: "1.0.0",
            private: true,
            scripts: { dev: "vite" },
            devDependencies: { vite: "^5.0.0", react: "^18.0.0", "react-dom": "^18.0.0" },
          },
          null,
          2
        ),
      };
      return { files, mainLanguage: "jsx" };
    }
    case "PHP": {
      const files = {
        "index.php": `${banner}<?php\n$nama = '${appName}';\n$deskripsi = '${description}';\necho "<h1>$nama</h1><p>$deskripsi</p>";\n`,
      };
      return { files, mainLanguage: "php" };
    }
    case "HTML": {
      const files = {
        "index.html": `<!doctype html>\n<html lang=\"id\">\n<head>\n<meta charset=\"utf-8\"/>\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>\n<title>${appName}</title>\n<style>body{font-family:ui-sans-serif;padding:24px}</style>\n</head>\n<body>\n<h1>${appName}</h1>\n<p>${description}</p>\n</body>\n</html>`,
      };
      return { files, mainLanguage: "html" };
    }
    case "Golang": {
      const files = {
        "main.go": `${banner}package main\n\nimport (\n  \"fmt\"\n  \"net/http\"\n)\n\nfunc handler(w http.ResponseWriter, r *http.Request){\n  fmt.Fprintf(w, "<h1>${appName}</h1><p>${description}</p>")\n}\n\nfunc main(){\n  http.HandleFunc(\"/\", handler)\n  fmt.Println(\"Run on http://localhost:8080\")\n  http.ListenAndServe(\":8080\", nil)\n}\n`,
      };
      return { files, mainLanguage: "go" };
    }
    case "Laravel": {
      const instructions =
        "Gunakan 'composer create-project laravel/laravel " + appName + "' lalu tambahkan controller & route sesuai kebutuhan.";
      const files = {
        "README.md": `# ${appName} (Laravel)\n\n${description}\n\n${instructions}\n`,
      };
      return { files, mainLanguage: "php", instructions };
    }
    case "CodeIgniter": {
      const instructions =
        "Gunakan 'composer create-project codeigniter4/appstarter " + appName + "' lalu buat controller & route.";
      const files = {
        "README.md": `# ${appName} (CodeIgniter 4)\n\n${description}\n\n${instructions}\n`,
      };
      return { files, mainLanguage: "php", instructions };
    }
    case "Custom":
    default: {
      const lang = language || "txt";
      const files = {
        ["main." + (lang.toLowerCase() || "txt")]: `${banner}// ${appName} - ${description}\n// Tulis kode ${lang} Anda di sini.\n`,
      } as Record<string, string>;
      return { files, mainLanguage: lang.toLowerCase() };
    }
  }
}
