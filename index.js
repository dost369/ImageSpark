const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors({
  origin: 'https://dost369.github.io'
}));
app.use(express.json());

const REPLICATE_API_TOKEN = process.env.replicate_api_token;

app.post("/generate-image", async (req, res) => {
    const { prompt, style, ratio, quantity, creativity } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    // Enhance the prompt with style, ratio, and creativity level
    const fullPrompt = `${prompt}, in ${style || 'realistic'} style, aspect ratio ${ratio || '1:1'}, creativity level ${creativity || 5}`;

    try {
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                version: "db21e45c3704e016e4cd4403c0b7885d2bb12cfa3c3c64c06e6aa36d5a5b8a56", // Stable Diffusion 1.5
                input: { prompt: fullPrompt }
            })
        });

        const prediction = await response.json();

        if (!prediction.id) {
            return res.status(500).json({ error: "Failed to initiate prediction" });
        }

        // Poll until the image is ready
        let output;
        let status;
        while (!output && status !== "failed") {
            const res2 = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                headers: {
                    "Authorization": `Token ${REPLICATE_API_TOKEN}`
                }
            });

            const data = await res2.json();
            status = data.status;

            if (status === "succeeded" && data.output) {
                output = data.output;
                break;
            }

            if (status === "failed") {
                return res.status(500).json({ error: "Image generation failed" });
            }

            await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds
        }

        // Send list of images (usually only 1 for this model)
        res.json({ images: Array.isArray(output) ? output : [output] });

    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Something went wrong during generation" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
