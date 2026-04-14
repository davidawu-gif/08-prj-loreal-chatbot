/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const currentQuestionDisplay = document.getElementById("currentQuestion");

// Cloudflare Worker endpoint URL
const CLOUDFLARE_WORKER_URL = "https://forproj.pandawu2005.workers.dev/";

// System prompt for L'Oréal chatbot
const SYSTEM_PROMPT = `You are a knowledgeable L'Oréal product expert and beauty advisor. You help customers find the right L'Oréal products for their needs, provide beauty routines and tips, and answer questions about L'Oréal's skincare, haircare, and cosmetics lines.

You should:
- Only answer questions related to L'Oréal products, beauty routines, skincare, haircare, cosmetics, and beauty advice
- Be friendly, professional, and helpful
- Provide specific product recommendations when appropriate
- Politely decline to answer questions unrelated to L'Oréal or beauty topics

If a question is outside these topics, respond with: "I'm here to help you with L'Oréal products and beauty advice. Please ask me something related to our product lines or beauty routines!"`;

// Store conversation history with context tracking
let messageHistory = [];
let userName = "Guest";

// Display initial greeting
const initialMessage = document.createElement("div");
initialMessage.className = "msg ai";
const initialMessageContent = document.createElement("div");
initialMessageContent.textContent =
  "👋 Hello! I'm your L'Oréal Smart Product Advisor. Ask me anything about our products, routines, or beauty tips!";
initialMessage.appendChild(initialMessageContent);
chatWindow.appendChild(initialMessage);

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();

  if (!userMessage) return;

  // Display current user question in the dedicated section
  currentQuestionDisplay.textContent = `Your question: "${userMessage}"`;

  // Display user message in chat window with proper bubble styling
  const userMessageElement = document.createElement("div");
  userMessageElement.className = "msg user";
  const userBubble = document.createElement("div");
  userBubble.textContent = userMessage;
  userMessageElement.appendChild(userBubble);
  chatWindow.appendChild(userMessageElement);

  // Clear input field
  userInput.value = "";

  // Scroll to latest message
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Add user message to conversation history for context
    messageHistory.push({
      role: "user",
      content: userMessage,
    });

    // Prepare messages array with system prompt and full history for multi-turn context
    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...messageHistory,
    ];

    // Show loading indicator
    const loadingMessage = document.createElement("div");
    loadingMessage.className = "msg ai";
    const loadingBubble = document.createElement("div");
    loadingBubble.textContent = "Thinking...";
    loadingMessage.appendChild(loadingBubble);
    chatWindow.appendChild(loadingMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Send request to Cloudflare Worker
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Remove loading indicator
    chatWindow.removeChild(loadingMessage);

    // Extract AI response
    const aiMessage = data.choices[0].message.content;

    // Add AI message to chat window with proper bubble styling
    const aiMessageElement = document.createElement("div");
    aiMessageElement.className = "msg ai";
    const aiBubble = document.createElement("div");
    aiBubble.textContent = aiMessage;
    aiMessageElement.appendChild(aiBubble);
    chatWindow.appendChild(aiMessageElement);

    // Add AI response to conversation history for context tracking
    messageHistory.push({
      role: "assistant",
      content: aiMessage,
    });

    // Scroll to latest message
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    // Remove loading indicator if exists
    const loadingMsgs = chatWindow.querySelectorAll(".msg.ai");
    for (let msg of loadingMsgs) {
      if (msg.textContent === "Thinking...") {
        chatWindow.removeChild(msg);
        break;
      }
    }

    // Display error message
    const errorMessage = document.createElement("div");
    errorMessage.className = "msg ai";
    const errorBubble = document.createElement("div");
    errorBubble.textContent = `Error: ${error.message}. Please try again.`;
    errorMessage.appendChild(errorBubble);
    chatWindow.appendChild(errorMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});
