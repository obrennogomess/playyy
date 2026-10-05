import React, { useState, useEffect } from 'react';
import { PlayStorePage } from './components/PlayStorePage';

export default function App() {
  const [slug, setSlug] = useState<string>('cineva');

  useEffect(() => {
    const handleLocation = () => {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/meuspp/')) {
        const pathSlug = pathname.replace('/meuspp/', '').split('/')[0];
        if (pathSlug) {
          setSlug(pathSlug);
        }
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  return <PlayStorePage slug={slug} />;
}

