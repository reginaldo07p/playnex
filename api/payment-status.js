// Vercel Serverless Function — retrieves a PanteraPay transaction status.
const API_BASE = 'https://panterapay-production.up.railway.app';
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  const apiKey = process.env.PANTERAPAY_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'PANTERAPAY_API_KEY não configurada.' });
  const id = String(req.query?.id || '');
  if (!id || !/^[\w-]{1,200}$/.test(id)) return res.status(400).json({ error: 'ID de transação inválido.' });
  try {
    const upstream = await fetch(`${API_BASE}/transactions/${encodeURIComponent(id)}`, { headers: { 'Authorization': apiKey, 'Accept': 'application/json' } });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return res.status(502).json({ error: data.message || data.error || 'Não foi possível consultar a transação.' });
    return res.status(200).json({ id: data.id, status: data.status, expiresAt: data.expiresAt });
  } catch (e) { return res.status(502).json({ error: 'Falha de comunicação com a PantePay.' }); }
};
