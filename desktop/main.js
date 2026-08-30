// DeEplan — coquille Electron (Lot A7e-1).
// Charge l'app web déployée ; ne duplique aucun code applicatif.
const { app, BrowserWindow, shell, Menu } = require("electron");

const APP_URL = process.env.DEEPLAN_URL || "https://de-eplan.vercel.app";
const APP_ORIGIN = new URL(APP_URL).origin;

// User-agent « Chrome pur » : sinon Google refuse OAuth dans une fenêtre
// Electron (« disallowed_useragent »).
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    title: "DeEplan",
    backgroundColor: "#f4f1e9",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  win.webContents.setUserAgent(CHROME_UA);
  win.loadURL(APP_URL, { userAgent: CHROME_UA });

  // Liens hors du domaine de l'app → navigateur système.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_ORIGIN)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Empêche la navigation hors app dans la fenêtre principale
  // (Google/Supabase OAuth restent autorisés).
  win.webContents.on("will-navigate", (event, url) => {
    const host = new URL(url).host;
    const autorises = [
      new URL(APP_ORIGIN).host,
      "accounts.google.com",
      "wjsvygzatbguwzzzvopv.supabase.co",
    ];
    if (!autorises.some((h) => host === h || host.endsWith("." + h))) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  // Menu minimal (Édition pour le copier/coller, Affichage pour le zoom).
  const template = [
    ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
