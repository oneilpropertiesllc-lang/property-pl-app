const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const SYSTEM_PROMPT = 'You are a sharp real estate financial analyst and CPA specializing in rental property portfolios. You have access to the user live property data and must use it to give precise, number-driven answers. You can calculate: Per-property and portfolio-wide P&L, NOI, cash flow after debt service, cash-on-cash return, assets/liabilities/equity, tax exposure estimates, expense breakdowns, profitability comparisons. Always show actual dollar figures. Format P&L as clear line items. Note that for official tax filings the user should consult a licensed CPA.';
app.post('/api/chat', async (req, res) => {
  const { messages, portfolioData } = req.body;
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set.' });
  const systemWithData = SYSTEM_PROMPT + ' LIVE PORTFOLIO DATA: ' + portfolioData;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, system: systemWithData, messages })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });
    res.json({ reply: data.content?.[0]?.text || 'No response.' });
  } catch (err) { res.status(500).json({ error: 'Failed: ' + err.message }); }
});
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running at http://localhost:' + PORT));