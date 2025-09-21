import { GoogleGenAI } from "@google/genai";
import type { Transaction, SavingsGoal } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const getFinancialInsights = async (transactions: Transaction[], savingsGoal?: SavingsGoal | null): Promise<string> => {
    if (!process.env.API_KEY) {
        return "API key is not configured. Please set the API_KEY environment variable to use AI features.";
    }

    if (transactions.length === 0) {
        return "No transactions to analyze. Add some expenses to get started!";
    }

    const goalPrompt = savingsGoal 
        ? `The user has a savings goal to save ${savingsGoal.targetAmount} for "${savingsGoal.name}" by ${new Date(savingsGoal.deadline).toLocaleDateString()}. Tailor your advice to help them meet this goal.`
        : "The user has not set a savings goal.";

    const prompt = `
        You are a friendly and encouraging financial assistant.
        Analyze the following list of user transactions and provide 3 actionable, personalized tips to help them save money.
        Focus on identifying patterns in non-essential spending like 'Leisure' and 'Daily Expenses'.
        ${goalPrompt}
        Keep the tone positive and empowering. Format the output as a clean, readable list.

        Transactions:
        ${JSON.stringify(transactions, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching financial insights:", error);
        return "Sorry, I couldn't generate insights at the moment. Please try again later.";
    }
};

export const getCategorySuggestion = async (description: string, categories: string[]): Promise<string> => {
    if (!process.env.API_KEY || !description.trim()) {
        return "";
    }

    const prompt = `
        Based on the expense description, what is the most likely category?
        Description: "${description}"
        
        Choose exactly one from the following categories: ${categories.join(', ')}.
        Respond with only the category name and nothing else.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // Ensure quick response for better UX
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        const suggestedCategory = response.text.trim();
        // Validate that the model returned a valid category
        if (categories.includes(suggestedCategory)) {
            return suggestedCategory;
        }
        return "";

    } catch (error) {
        console.error("Error fetching category suggestion:", error);
        return "";
    }
};
