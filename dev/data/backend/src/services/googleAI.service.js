const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GOOGLE_AI_API_KEY } = require("../utils/secrets");

const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);

const MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview",
];

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const googleAIService = {
    async generateSummary(transcript) {
        const prompt = `
You are a meeting assistant.

Analyze the meeting transcript and return ONLY valid JSON.

Use exactly this structure:

{
    "mainDiscussionPoints": [],
    "decisionsMade": [],
    "actionItems": [],
    "importantDeadlines": []
}

Rules:
- mainDiscussionPoints: Key topics discussed
- decisionsMade: Decisions agreed by participants
- actionItems: Tasks that need to be done
- importantDeadlines: Dates or deadlines mentioned
- If there is no information, return an empty array []
- Do not include markdown
- Do not include explanations

Transcript:
${transcript}
        `;

        let lastError;

        // Try each model as a fallback
        for (const modelName of MODELS) {
            const model = genAI.getGenerativeModel({
                model: modelName,
            });

            console.log(`[GOOGLE AI] Trying model: ${modelName}`);

            // Retry the current model
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const result = await model.generateContent(prompt);
                    const text = result.response.text();

                    try {
                        return JSON.parse(text);
                    } catch (error) {
                        throw new Error(
                            "Gemini returned invalid JSON"
                        );
                    }
                } catch (error) {
                    lastError = error;

                    console.error(
                        `[GOOGLE AI] ${modelName} attempt ${attempt} failed:`,
                        error.message
                    );

                    if (attempt === MAX_RETRIES) {
                        console.log(
                            `[GOOGLE AI] ${modelName} failed. Trying next model...`
                        );
                        break;
                    }

                    const status = error?.status;

                    if (status === 429) {
                        console.log(
                            `[GOOGLE AI] ${modelName} rate limited. ` +
                            `Retrying in ${RETRY_DELAY}ms...`
                        );
                    } else {
                        console.log(
                            `[GOOGLE AI] Retrying ${modelName} ` +
                            `in ${RETRY_DELAY}ms...`
                        );
                    }

                    await sleep(RETRY_DELAY);
                }
            }
        }

        throw new Error(
            `All Google AI models failed. Last error: ${lastError?.message}`
        );
    },
};

module.exports = googleAIService;