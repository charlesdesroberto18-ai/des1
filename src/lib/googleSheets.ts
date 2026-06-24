import { Transaction } from '../types';

export interface SpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Creates a brand new Google Spreadsheet for Finances
 */
export async function createFinanceSpreadsheet(accessToken: string, title: string): Promise<SpreadsheetInfo> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || 'Central de Finanças Pessoais',
      },
      sheets: [
        {
          properties: {
            title: 'Transações',
            gridProperties: {
              rowCount: 1000,
              columnCount: 7,
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Falha ao criar planilha Google Sheets.');
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    title: data.properties?.title || title,
  };
}

/**
 * Exports personal finance transactions to Google Sheets
 */
export async function exportTransactionsToSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[]
): Promise<void> {
  // We write the headers first, then all transactions
  const header = ['ID Lançamento', 'Data', 'Descrição', 'Tipo', 'Valor (R$)', 'Categoria', 'Notas'];
  const rows = transactions.map((tx) => [
    tx.id,
    tx.date,
    tx.description,
    tx.type === 'income' ? 'Receita' : tx.type === 'additional' ? 'Adicional' : 'Despesa',
    tx.amount,
    tx.category,
    tx.notes || '',
  ]);

  const values = [header, ...rows];

  // We write to the range 'Transações!A1:G' (overwriting previous entries)
  const range = 'Transações!A1:G' + (rows.length + 1);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Falha ao exportar lançamentos para a planilha.');
  }
}

/**
 * Imports transactions from Google Sheets
 */
export async function importTransactionsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Transaction[]> {
  const range = 'Transações!A2:G500'; // Fetch up to 500 records, skipping the header line
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Falha ao ler dados da planilha Google Sheets.');
  }

  const data = await response.json();
  const rows = data.values as any[][];
  if (!rows || rows.length === 0) {
    return [];
  }

  const importedTransactions: Transaction[] = [];

  rows.forEach((row, index) => {
    // If the row lacks essential data, skip it
    if (row.length < 5 || !row[1] || !row[2] || !row[3] || !row[4]) return;

    const id = row[0] || `sheet-tx-${Date.now()}-${index}`;
    const date = row[1];
    const description = row[2];
    const rawType = row[3]?.toLowerCase();
    const type: 'income' | 'expense' | 'additional' = 
      rawType === 'receita' || rawType === 'income' ? 'income' : 
      rawType === 'adicional' || rawType === 'additional' ? 'additional' : 'expense';
    
    // Parse value, removing standard currency formats or symbols if any
    let amount = parseFloat(
      String(row[4])
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    );
    if (isNaN(amount)) amount = 0;

    const category = row[5] || 'outros_gastos';
    const notes = row[6] || '';

    importedTransactions.push({
      id,
      description,
      amount,
      type,
      category,
      date,
      notes,
    });
  });

  return importedTransactions;
}
