// PanteraPay webhook receiver. Configure in provider dashboard as /api/webhook/panterapay.
// Production order fulfillment must be connected to a database and signature verification
// must be added if PanteraPay provides a signing secret/header.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const event = req.body || {};
  const type = event.type || event.event || event.status;
  if (!['payment.approved', 'payment.failed', 'approved', 'failed', 'paid'].includes(String(type))) {
    return res.status(200).json({ received: true, ignored: true });
  }
  // Do not release game keys here yet: persist and validate the transaction/order in the DB first.
  console.log('PanteraPay webhook received', { type, transactionId: event.id || event.transactionId || event.data?.id });
  return res.status(200).json({ received: true });
};
