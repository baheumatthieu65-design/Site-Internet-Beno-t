import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Save, RotateCcw, Copy, CheckCircle2 } from 'lucide-react';

type Template = {
  subject: string;
  body: string;
};

type Templates = {
  order: Template;
  appointment: Template;
};

const DEFAULT_TOKENS = [
  ['{{civilite}}', 'Monsieur / Madame / Autre'],
  ['{{nom}}', 'Nom & prénom'],
  ['{{telephone}}', 'Téléphone'],
  ['{{email}}', 'Adresse email'],
  ['{{remarques}}', 'Remarques'],
  ['{{date}}', 'Date et heure'],
  ['{{reference}}', 'Référence'],
  ['{{marque}}', 'Nom de marque'],
  ['{{type}}', 'Type de demande'],
  ['{{articles}}', 'Liste des articles'],
  ['{{total}}', 'Total'],
  ['{{devise}}', 'Devise'],
] as const;

export const EmailTemplatesEditor: React.FC = () => {
  const [templates, setTemplates] = useState<Templates | null>(null);
  const [active, setActive] = useState<'order' | 'appointment'>('order');
  const [adminCode, setAdminCode] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState('');

  const load = async () => {
    const response = await fetch(`/api/admin/email-templates?ts=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || 'Impossible de charger les templates.');
    }
    setTemplates(data.templates);
  };

  useEffect(() => {
    void load().catch((error) => setMessage(error.message));
  }, []);

  const current = useMemo(
    () => templates?.[active] || { subject: '', body: '' },
    [templates, active]
  );

  const updateCurrent = (patch: Partial<Template>) => {
    setTemplates((previous) =>
      previous
        ? {
            ...previous,
            [active]: { ...previous[active], ...patch },
          }
        : previous
    );
  };

  const insertToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(token);
      window.setTimeout(() => setCopied(''), 1500);
    } catch {
      setCopied(token);
    }
  };

  const save = async () => {
    if (!templates || !adminCode.trim()) {
      setMessage('Saisissez le code administrateur pour enregistrer.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: adminCode,
          templates,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Enregistrement impossible.');
      }

      setTemplates(data.templates);
      setMessage('Templates enregistrés avec succès.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  if (!templates) {
    return (
      <section className="p-5 rounded-3xl bg-[#1a221c] border border-[#3b4b3e]">
        <p className="text-xs text-[#a3b1a5]">
          Chargement des modèles d’e-mails…
        </p>
      </section>
    );
  }

  return (
    <section className="p-5 sm:p-6 rounded-3xl bg-[#1a221c] border border-[#3b4b3e] space-y-5 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#253227] text-[#d4af37]">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-[#f3ece0]">
            Modèles des e-mails de notification
          </h3>
          <p className="text-xs text-[#a3b1a5]">
            Modifiez séparément le mail de commande et le mail de rendez-vous atelier.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActive('order')}
          className={`rounded-xl border px-3 py-2 text-xs font-bold ${
            active === 'order'
              ? 'bg-[#d4af37] text-[#121613] border-[#d4af37]'
              : 'bg-[#121613] text-[#a3b1a5] border-[#38483b]'
          }`}
        >
          Mail de commande
        </button>
        <button
          type="button"
          onClick={() => setActive('appointment')}
          className={`rounded-xl border px-3 py-2 text-xs font-bold ${
            active === 'appointment'
              ? 'bg-[#d4af37] text-[#121613] border-[#d4af37]'
              : 'bg-[#121613] text-[#a3b1a5] border-[#38483b]'
          }`}
        >
          Mail de rendez-vous atelier
        </button>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-[#a3b1a5] mb-1">
          Objet
        </label>
        <input
          value={current.subject}
          onChange={(event) => updateCurrent({ subject: event.target.value })}
          className="w-full bg-[#121613] border border-[#38483b] text-[#f3ece0] text-sm rounded-xl px-3 py-2.5 outline-none focus:border-[#d4af37]"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-[#a3b1a5] mb-1">
          Corps du mail
        </label>
        <textarea
          value={current.body}
          onChange={(event) => updateCurrent({ body: event.target.value })}
          rows={14}
          className="w-full bg-[#121613] border border-[#38483b] text-[#f3ece0] text-xs rounded-xl px-3 py-3 outline-none focus:border-[#d4af37] font-mono"
        />
      </div>

      <div className="p-4 rounded-2xl bg-[#121613] border border-[#2e3c30]">
        <div className="text-[10px] uppercase tracking-wider text-[#d4af37] font-bold mb-2">
          Tokens disponibles
        </div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_TOKENS.map(([token, description]) => (
            <button
              key={token}
              type="button"
              title={description}
              onClick={() => void insertToken(token)}
              className="px-2.5 py-1.5 rounded-lg border border-[#3d4f40] bg-[#18201a] text-[#f3ece0] text-[10px] hover:border-[#d4af37]"
            >
              {copied === token ? (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Copié
                </span>
              ) : (
                <span>{token}</span>
              )}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[#7f8d82]">
          Un clic copie le token ; collez-le ensuite à l’endroit voulu dans l’objet ou le corps.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="password"
          value={adminCode}
          onChange={(event) => setAdminCode(event.target.value)}
          placeholder="Code administrateur pour enregistrer"
          className="flex-1 bg-[#121613] border border-[#38483b] text-[#f3ece0] text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[#d4af37]"
        />
        <button
          type="button"
          onClick={() => void load().catch((error) => setMessage(error.message))}
          className="px-4 py-2.5 rounded-xl bg-[#28362b] border border-[#3b4b3e] text-[#f3ece0] text-xs font-bold inline-flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Recharger
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="px-4 py-2.5 rounded-xl bg-[#d4af37] text-[#121613] text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {message && (
        <p className="text-xs text-[#d4af37]">{message}</p>
      )}
    </section>
  );
};
