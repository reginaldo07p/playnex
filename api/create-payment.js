// Vercel Serverless Function — creates a PIX transaction with PanteraPay.
// Keep PANTERAPAY_API_KEY in Vercel Environment Variables. Never expose it in the browser.
const API_BASE = 'https://panterapay-production.up.railway.app';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const apiKey = process.env.PANTERAPAY_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'PantePay ainda não foi configurada no servidor (PANTERAPAY_API_KEY).' });
  try {
    const { customerEmail, items, amount, description } = req.body || {};
    if (!/^\S+@\S+\.\S+$/.test(String(customerEmail || ''))) return res.status(400).json({ error: 'Informe um e-mail válido.' });
    if (!Array.isArray(items) || !items.length || !Number.isInteger(amount) || amount < 1) return res.status(400).json({ error: 'Carrinho ou valor inválido.' });
    const expected = items.reduce((sum, item) => {
      if (!Number.isInteger(item.unitPrice) || item.unitPrice < 1 || item.quantity !== 1 || typeof item.name !== 'string') throw new Error('Item inválido.');
      return sum + item.unitPrice;
    }, 0);
    if (expected !== amount) return res.status(400).json({ error: 'O total do carrinho não confere.' });

    // PanteraPay accepts transaction amounts in centavos. The secret remains server-side.
    const upstream = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Authorization': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ amount, description: String(description || 'PLAYNEX').slice(0, 120), customer: { email: customerEmail }, metadata: { items } })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('PanteraPay create transaction failed:', upstream.status, data);
      return res.status(502).json({ error: data.message || data.error || 'A PantePay recusou a criação da cobrança. Verifique a configuração e tente novamente.' });
    }
    return res.status(200).json({ id: data.id, status: data.status, qrCodeBase64: data.qrCodeBase64, copyPaste: data.copyPaste, expiresAt: data.expiresAt });
  } catch (error) {
    console.error('create-payment error:', error);
    return res.status(400).json({ error: error.message || 'Não foi possível criar a cobrança PIX.' });
  }
};
