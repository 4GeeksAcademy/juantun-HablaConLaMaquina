"use client";

import { useEffect, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const [usage, setUsage] = useState({
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  });

  const [model, setModel] = useState("");

  useEffect(() => {
    const savedMessages = localStorage.getItem("messages");
    const savedUsage = localStorage.getItem("usage");
    const savedModel = localStorage.getItem("model");

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if (savedUsage) {
      setUsage(JSON.parse(savedUsage));
    }

    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));

    localStorage.setItem("usage", JSON.stringify(usage));

    localStorage.setItem("model", model);
  }, [messages, usage, model]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);

    setInput("");

    setLoading(true);

    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: updatedMessages,
          }),
        }
      );

      const data = await res.json();

      console.log(data);

      if (data.error) {
        alert(data.error.message);
        setLoading(false);
        return;
      }

      const aiMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages([...updatedMessages, aiMessage]);

      setUsage((prev) => ({
        prompt_tokens: prev.prompt_tokens + data.usage.prompt_tokens,

        completion_tokens:
          prev.completion_tokens +
          data.usage.completion_tokens,

        total_tokens:
          prev.total_tokens + data.usage.total_tokens,
      }));

      setModel(data.model);
    } catch (error) {
      console.log(error);
      alert("Error conectando con la API");
    }

    setLoading(false);
  }

  function clearConversation() {
    setMessages([]);

    setUsage({
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    });

    setModel("");

    localStorage.removeItem("messages");
    localStorage.removeItem("usage");
    localStorage.removeItem("model");
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Groq Chat
        </h1>

        <div className="mb-6 bg-gray-900 p-4 rounded border border-gray-700">

          <h2 className="text-xl font-bold mb-3">
            Métricas de uso
          </h2>

          <p>
            <strong>Modelo:</strong>{" "}
            {model || "Sin respuesta todavía"}
          </p>

          <p>
            <strong>Prompt Tokens:</strong>{" "}
            {usage.prompt_tokens}
          </p>

          <p>
            <strong>Completion Tokens:</strong>{" "}
            {usage.completion_tokens}
          </p>

          <p>
            <strong>Total Tokens:</strong>{" "}
            {usage.total_tokens}
          </p>

        </div>

        <div className="border border-gray-700 rounded p-5 h-[500px] overflow-y-auto mb-5">

          {messages.length === 0 && (
            <p className="text-gray-400">
              Escribe tu primer mensaje para comenzar la conversación.
            </p>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded ${
                msg.role === "user"
                  ? "bg-blue-600 ml-auto w-fit max-w-[80%]"
                  : "bg-gray-800 mr-auto w-fit max-w-[80%]"
              }`}
            >
              <p className="font-bold mb-1">
                {msg.role === "user" ? "Tú" : "IA"}
              </p>

              <p>{msg.content}</p>
            </div>
          ))}

          {loading && (
            <p className="text-gray-400">
              Pensando...
            </p>
          )}

        </div>

        <div className="flex gap-3 mb-4">

          <input
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Escribe algo..."
            className="flex-1 p-3 rounded bg-gray-900 border border-gray-700"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-white text-black px-5 rounded disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>

        </div>

        <button
          onClick={clearConversation}
          className="bg-red-600 px-5 py-3 rounded"
        >
          Borrar conversación
        </button>

      </div>
    </main>
  );
}