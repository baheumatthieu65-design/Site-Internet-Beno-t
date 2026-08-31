import React, { useEffect, useState } from 'react';
import { FileText, Save, RotateCcw, Copy, Check } from 'lucide-react';

type Template = { subject: string; body: string };
type Templates = { order: Template; appointment: Template; customerReply: Template };

const TOKENS = [
  ['{{civilite}}', 'Monsieur / Madame / Autre'],
  ['{{nom}}', 'Nom et prénom'],
  ['{{telephone}}', 'Téléphone'],
  ['{{email}}', 'Adresse email'],
  ['{{remarques}}', 'Remarques'],
  ['{{date}}', 'Date et heure'],
  ['{{reference}}', 'Référence de commande'],
  ['{{marque}}', 'Nom de la marque configurée'],
  ['{{type}}', 'Type de demande'],
  ['{{articles}}', 'Liste des articles'],
  ['{{total}}', 'Total'],
  ['{{devise}}', 'Devise'],
  ['{{statut}}', 'État de traitement de la commande ou demande'],
] as const;

export const EmailTemplatesEditor: React.FC = () => {
  const [templates, setTemplates] = useState<Templates | null>(null);
  const [active, setActive] = useState<'order' | 'appointment' | 'customerReply'>('order');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState('');

  const load = async () => {
    const response = await fetch('/api/admin/email-templates', {
      credentials: 'include',
      cache: 'no-store',
    });
    const data = await response.json();
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || 'Impossible de charger les modèles.');
    }
    setTemplates(data.templates);
  };

  useEffect(() => {
    void load().catch((error) => setMessage(error.message));
  }, []);

  const current = templates?.[active];

  const update = (patch: Partial<Template>) => {
    if (!templates) return;
    setTemplates({
      ...templates,
      [active]: { ...templates[active], ...patch },
    });
  };

  const copyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setCopied(token);
    window.setTimeout(() => setCopied(''), 1200);
  };

  const save = async () => {
    if (!templates) return;
    setMessage('Enregistrement...');

    try {
      const response = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Enregistrement impossible.');
      }

      setTemplates(data.templates);
      setMessage('Modèle(s) enregistré(s) avec succès.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur.');
    }
  };

  if (!templates || !current) {
    return (
      <section className="rounded-2xl border border-[#3b4b3e] bg-[#171f19] p-5">
        <p className="text-xs text-[#a3b1a5]">Chargement des modèles d’e-mails…</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#3b4b3e] bg-[#171f19] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#253227] p-2 text-[#d4af37]">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-serif text-lg font-bold text-[#f3ece0]">
            Personnalisation des e-mails
          </h4>
          <p className="text-xs text-[#9eaa9f]">
            Modifiez le mail de commande, le mail de rendez-vous atelier et le modèle de réponse à envoyer au client.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setActive('order')}
          className={`rounded-xl border px-3 py-2 text-xs font-bold ${
            active === 'order'
              ? 'border-[#d4af37] bg-[#d4af37] text-[#121613]'
              : 'border-[#39493d] bg-[#121613] text-[#a3b1a5]'
          }`}
        >
          Mail de commande
        </button>
        <button
          type="button"
          onClick={() => setActive('appointment')}
          className={`rounded-xl border px-3 py-2 text-xs font-bold ${
            active === 'appointment'
              ? 'border-[#d4af37] bg-[#d4af37] text-[#121613]'
              : 'border-[#39493d] bg-[#121613] text-[#a3b1a5]'
          }`}
        >
          Mail de rendez-vous atelier
        </button>
        <button
          type="button"
          onClick={() => setActive('customerReply')}
          className={`rounded-xl border px-3 py-2 text-xs font-bold ${
            active === 'customerReply'
              ? 'border-[#d4af37] bg-[#d4af37] text-[#121613]'
              : 'border-[#39493d] bg-[#121613] text-[#a3b1a5]'
          }`}
        >
          Réponse au client
        </button>
      </div>

      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#a3b1a5]">
          Objet du mail
        </label>
        <input
          value={current.subject}
          onChange={(e) => update({ subject: e.target.value })}
          className="w-full rounded-xl border border-[#39493d] bg-[#101511] px-3 py-2.5 text-sm text-[#f3ece0] outline-none focus:border-[#d4af37]"
        />
      </div>

      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#a3b1a5]">
          Corps du mail
        </label>
        <textarea
          value={current.body}
          onChange={(e) => update({ body: e.target.value })}
          rows={15}
          className="w-full resize-y rounded-xl border border-[#39493d] bg-[#101511] px-3 py-3 font-mono text-xs leading-5 text-[#f3ece0] outline-none focus:border-[#d4af37]"
        />
      </div>

      <div className="rounded-xl border border-[#2f3d32] bg-[#101511] p-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
          Tokens disponibles
        </div>
        <div className="flex flex-wrap gap-2">
          {TOKENS.map(([token, description]) => (
            <button
              key={token}
              type="button"
              title={description}
              onClick={() => void copyToken(token)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#3c4d40] bg-[#18201a] px-2 py-1.5 text-[10px] text-[#f3ece0] hover:border-[#d4af37]"
            >
              {copied === token ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {token}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[#78857b]">
          Cliquez sur un token pour le copier, puis collez-le dans l’objet ou le corps du mail.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void load().catch((error) => setMessage(error.message))}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#39493d] bg-[#243126] px-4 py-2.5 text-xs font-bold text-[#f3ece0]"
        >
          <RotateCcw className="h-4 w-4" />
          Recharger
        </button>
        <button
          type="button"
          onClick={() => void save()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2.5 text-xs font-bold text-[#121613]"
        >
          <Save className="h-4 w-4" />
          Enregistrer
        </button>
      </div>

      {message && <p className="text-xs text-[#d4af37]">{message}</p>}
    </section>
  );
};
