const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// 🔐 CONFIG
const PIXEL_ID = '422196310290450';
const ACCESS_TOKEN = 'EAAbvLT7za6UBRXegsCqjCmfknROIz5mQehNJLtZCr9MoA3gQw17SejdMEqdppgTGDwtIRpcG0bGcPiu8kF1hkXXHNDZCxssyQbVoJHht3hvUR7ztB64Fb3vFKyGgCFTzBX3BJ9bccIN6e3R5H4S7eQth4FpBbt6jkoxVPrJxkiTO9JRMEQsphZBeGwvHV8ZCYAZDZD';

// 🔑 Hash function for phone (Meta requirement)
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

app.post('/webhook-codnetwork', async (req, res) => {
  try {
    const data = req.body;

    // ✅ 1. ONLY DELIVERED or CONFIRMED
  let eventName = null;

  if (data.status === "confirmed") {
    eventName = "InitiateCheckout";
  }

  if (data.status === "delivered") {
    eventName = "Purchase";
  }

if (!eventName) {
  return res.sendStatus(200);
}

    // ✅ 2. EXTRACT DATA FROM YOUR STRUCTURE
    const eventId = data.lead_id || data.reference || data.id;

    const phoneRaw = data.customer_phone || "";
    const phone = phoneRaw.replace(/\D/g, ''); // clean number

    const value = parseFloat(data.total || 0);
    const currency = data.currency || "SAR";

    // OPTIONAL: hash phone (recommended)
    const hashedPhone = phone ? hashData(phone) : undefined;

    // ✅ 3. SEND TO META
    await axios.post(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        data: [
          {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,

            user_data: {
              ph: hashedPhone ? [hashedPhone] : undefined
            },

            custom_data: {
              value: value,
              currency: currency
            }
          }
        ]
      }
    );

    console.log("✅ Purchase sent:", eventId);

    res.sendStatus(200);

  } catch (err) {
    console.error("❌ ERROR:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
