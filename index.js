const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const REPLICATE_API_TOKEN = process.env.replicate_api_token;

app.post("/generate", async (req, res) => {
    const prompt = req.body.prompt;

    const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            version: "db21e45c3704e016e4cd4403c0b7885d2bb12cfa3c3c64c06e6aa36d5a5b8a56",
            input: { prompt }
        })
    });

    const prediction = await response.json();

    let output;
    while (!output) {
        const res2 = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
        });
        const data = await res2.json();
        if (data.output) {
            output = data.output;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    res.json({ image_url: output[0] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
