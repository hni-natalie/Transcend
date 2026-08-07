const { GoogleGenerativeAI } = require("@google/generative-ai");

const { GOOGLE_AI_API_KEY } = require("../utils/secrets");

const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", });

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

        const result = await model.generateContent(prompt);

        return result.response.text();
    },
};

module.exports = googleAIService;