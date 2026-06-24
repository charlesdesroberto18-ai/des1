import React, { useState, useEffect } from 'react';
import { useGoogleAuth } from './GoogleIntegration';
import { useToast } from './Toast';
import { Transaction } from '../types';
import { createFinanceSpreadsheet, exportTransactionsToSheet, importTransactionsFromSheet, SpreadsheetInfo } from '../lib/googleSheets';
import { DynamicIcon } from './Icons';

interface GoogleSheetsSyncProps {
  transactions: Transaction[];
  onSyncTransactions: (synced: Transaction[]) => void;
}

export default function GoogleSheetsSync({ transactions, onSyncTransactions }: GoogleSheetsSyncProps) {
  const { isConnected, accessToken, loginWithGoogle } = useGoogleAuth();
  const { toast } = useToast();
  
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetInfo | null>(() => {
    try {
      const saved = localStorage.getItem('personal_finance_spreadsheet');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [inputUrl, setInputUrl] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Sync spreadsheet details to localStorage
  useEffect(() => {
    if (spreadsheet) {
      localStorage.setItem('personal_finance_spreadsheet', JSON.stringify(spreadsheet));
    } else {
      localStorage.removeItem('personal_finance_spreadsheet');
    }
  }, [spreadsheet]);

  // Extract Spreadsheet ID from a Google Sheet URL or return raw string if it is already an ID
  const extractSpreadsheetId = (urlOrId: string): string => {
    const trimmed = urlOrId.trim();
    if (trimmed.includes('docs.google.com/spreadsheets')) {
      const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : trimmed;
    }
    return trimmed;
  };

  // Handle linking an existing spreadsheet
  const handleLinkExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !inputUrl.trim()) return;

    setIsLinking(true);
    try {
      const sheetId = extractSpreadsheetId(inputUrl);
      
      // Let's verify if the sheet is accessible by fetching it
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error('Planilha não encontrada ou sem permissão de acesso. Verifique o ID/URL.');
      }

      const data = await response.json();
      const info: SpreadsheetInfo = {
        spreadsheetId: sheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        title: data.properties?.title || 'Planilha Vinculada',
      };

      setSpreadsheet(info);
      setInputUrl('');
      toast.success(`Planilha "${info.title}" vinculada com sucesso!`, 'Conexão Concluída');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao tentar vincular planilha.', 'Falha de Vínculo');
    } finally {
      setIsLinking(false);
    }
  };

  // Create a brand new Spreadsheet
  const handleCreateNew = async () => {
    if (!accessToken) return;

    setIsCreating(true);
    try {
      const info = await createFinanceSpreadsheet(accessToken, 'Planejamento Financeiro - Controle Pessoal');
      
      // Instantly seed/export current transactions
      await exportTransactionsToSheet(accessToken, info.spreadsheetId, transactions);
      
      setSpreadsheet(info);
      toast.success('Sua nova planilha de Finanças no Google Sheets foi criada e sincronizada com sucesso!', 'Planilha Criada');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao criar nova planilha.', 'Erro de Criação');
    } finally {
      setIsCreating(false);
    }
  };

  // Export current local transactions to Sheets
  const handleExport = async () => {
    if (!accessToken || !spreadsheet) return;

    // Direct user confirmation as required by Workspace integration guidelines
    const confirmed = window.confirm(
      `Deseja realmente exportar ${transactions.length} transações locais para a planilha do Google Sheets? Isso sobrescreverá os lançamentos atuais na aba "Transações".`
    );
    if (!confirmed) return;

    setIsExporting(true);
    try {
      await exportTransactionsToSheet(accessToken, spreadsheet.spreadsheetId, transactions);
      toast.success('Todos os lançamentos locais foram exportados com sucesso para a planilha!', 'Sincronização Concluída');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao exportar dados.', 'Falha na Exportação');
    } finally {
      setIsExporting(false);
    }
  };

  // Import transactions from Sheets
  const handleImport = async () => {
    if (!accessToken || !spreadsheet) return;

    setIsImporting(true);
    try {
      const imported = await importTransactionsFromSheet(accessToken, spreadsheet.spreadsheetId);
      if (imported.length === 0) {
        toast.warning('Nenhum lançamento válido foi encontrado na aba "Transações" da planilha para importar.', 'Sem Dados');
        return;
      }

      onSyncTransactions(imported);
      toast.success(`${imported.length} transações foram importadas e unificadas com sucesso!`, 'Lançamentos Importados');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao importar dados.', 'Falha na Importação');
    } finally {
      setIsImporting(false);
    }
  };

  // Unlink active spreadsheet
  const handleUnlink = () => {
    const confirmed = window.confirm('Deseja realmente desvincular a planilha atual? O histórico local não será apagado.');
    if (confirmed) {
      setSpreadsheet(null);
      toast.warning('A planilha do Google Sheets foi desvinculada com sucesso.', 'Desvinculado');
    }
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 space-y-6 shadow-2xl">
      {/* Sync Section Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
            <DynamicIcon name="FileSpreadsheet" size={18} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">Sincronização Google Sheets</h3>
            <p className="text-[10px] text-slate-450 mt-0.5">Gerencie seus lançamentos financeiros diretamente em nuvem</p>
          </div>
        </div>

        {isConnected && (
          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-1 rounded-xl uppercase font-sans flex items-center gap-1">
            <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
            Conectado
          </span>
        )}
      </div>

      {/* Auth state CTA */}
      {!isConnected ? (
        <div className="text-center py-6 space-y-4">
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Conecte sua conta do Google Workspace para criar relatórios financeiros dinâmicos, exportar transações locais e sincronizar fluxos de caixa em tempo real.
          </p>
          <button
            onClick={loginWithGoogle}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-2.5 px-5 rounded-2xl text-xs transition-all cursor-pointer shadow-lg"
          >
            <DynamicIcon name="LockKeyhole" size={13} />
            <span>Autorizar Google Sheets</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Linked Spreadsheets Details */}
          {spreadsheet ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 space-y-3.5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Planilha Ativa</span>
                    <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <DynamicIcon name="Grid" size={13} className="text-emerald-400" />
                      {spreadsheet.title}
                    </h4>
                  </div>
                  <button
                    onClick={handleUnlink}
                    className="text-[9px] text-rose-400 hover:text-rose-300 font-bold hover:underline cursor-pointer"
                  >
                    Desvincular
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <a
                    href={spreadsheet.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 text-white font-bold py-2 px-3 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <DynamicIcon name="ExternalLink" size={11} className="text-emerald-400" />
                    Abrir Planilha no Drive
                  </a>
                  <span className="text-[9px] text-slate-500 font-mono select-all truncate self-center bg-slate-900 border border-white/5 py-1 px-2.5 rounded-lg max-w-[200px]">
                    ID: {spreadsheet.spreadsheetId}
                  </span>
                </div>
              </div>

              {/* Live Sync Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  onClick={handleExport}
                  disabled={isExporting || isImporting}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {isExporting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Exportando...</span>
                    </>
                  ) : (
                    <>
                      <DynamicIcon name="ArrowUpToLine" size={14} />
                      <span>Exportar para o Google Sheets</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleImport}
                  disabled={isExporting || isImporting}
                  className="bg-slate-950 hover:bg-slate-900 disabled:bg-slate-950/50 border border-white/10 hover:border-emerald-500/30 text-slate-200 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  {isImporting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <DynamicIcon name="ArrowDownToLine" size={14} />
                      <span>Importar do Google Sheets</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Form to link spreadsheet
            <div className="space-y-4">
              <div className="text-center p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <p className="text-[11px] text-slate-400 font-medium">
                  Vincule uma planilha do Google Sheets que você já possui para sincronizar suas finanças locais.
                </p>
              </div>

              <form onSubmit={handleLinkExisting} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Cole o ID ou a URL da sua Planilha..."
                  className="flex-1 bg-slate-950 border border-white/10 hover:border-white/20 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLinking}
                  className="bg-white hover:bg-slate-100 disabled:bg-white/50 text-slate-900 font-extrabold px-5 rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1 shadow"
                >
                  {isLinking ? (
                    <div className="h-4 w-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <span>Vincular</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
