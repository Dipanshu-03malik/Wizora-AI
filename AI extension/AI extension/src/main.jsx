
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

function App() {
  const [page, setPage] = useState("home");
  return (
    <div className="app-container">
      {page === "home" && <Home navigate={setPage} />}
      {page === "chatWebpage" && <ChatWithWebpage goBack={() => setPage("home")} />}
      {page === "chatDoc" && <ChatWithDoc goBack={() => setPage("home")} />}
      {page === "dataAnalysis" && <DataAnalysis goBack={() => setPage("home")} />}
      {page === "aiChatbot" && <AIChatbot goBack={() => setPage("home")} />}
      {page === "imageGen" && <ImageGen goBack={() => setPage("home")} />}
    </div>
  );
}

function Home({ navigate }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl text-blue-600 font-bold mb-2">Choose a Feature</h1>
      <button onClick={() => navigate("chatWebpage")}>Chat with Webpage</button>
      <button onClick={() => navigate("chatDoc")}>Chat with Document</button>
      <button onClick={() => navigate("dataAnalysis")}>Data Analysis</button>
      <button onClick={() => navigate("aiChatbot")}>AI Chatbot</button>
      <button onClick={() => navigate("imageGen")}>Image Generator</button>
    </div>
  );
}

function ChatWithWebpage({ goBack }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    console.log("🛠️ sendMessage called");
  
    if (!input.trim()) return;
  
    setMessages((prev) => [...prev, { from: "user", text: input }]);
    setInput("");
    setLoading(true);
  
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const payload = {
          url: tabs[0]?.url || "",
          question: input
        };
  
        console.log("📤 Sending request to /ask with payload:", JSON.stringify(payload, null, 2));
  
        try {
          const res = await fetch("http://127.0.0.1:8003/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
  
          console.log("🔄 Response status:", res.status);
  
          if (!res.ok) {
            let errorText = "An error occurred.";
            if (res.status === 404) errorText = "❌ Wrong format of input (404)";
            else if (res.status === 500) errorText = "💥 Server error (500)";
            throw new Error(errorText);
          }
  
          const data = await res.json();
          console.log("✅ Received response from /ask:", JSON.stringify(data, null, 2));
          setMessages((prev) => [...prev, { from: "bot", text: data.answer }]);
        } catch (err) {
          console.error("❌ Fetch failed:", err.message);
          setMessages((prev) => [...prev, { from: "bot", text: err.message }]);
        } finally {
          setLoading(false);
        }
      });
    } catch (outerError) {
      console.error("❌ Outer error:", outerError.message);
      setMessages((prev) => [...prev, { from: "bot", text: "Unexpected error." }]);
      setLoading(false);
    }
  };
  

  return (
    <ChatLayout
      title="Chat with Webpage"
      input={input}
      messages={messages}
      setInput={setInput}
      sendMessage={sendMessage}
      loading={loading}
      goBack={goBack}
    />
  );
}


function ChatWithDoc({ goBack }) {
  const [uploaded, setUploaded] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      await fetch("http://127.0.0.1:8000/upload", { method: "POST", body: formData });
      setUploaded(true);
      setMessages([{ from: "bot", text: "✅ Document uploaded." }]);
    } catch {
      setMessages([{ from: "bot", text: "❌ Upload failed." }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", text: input }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { from: "bot", text: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { from: "bot", text: "Sorry, cannot chat right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={goBack}>⬅ Back</button>
      {!uploaded && <input type="file" onChange={handleUpload} />}
      <ChatLayout
        input={input}
        messages={messages}
        setInput={setInput}
        sendMessage={sendMessage}
        loading={loading}
      />
    </div>
  );
}

function DataAnalysis({ goBack }) {
  const [file, setFile] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setInput(selectedFile.name);
    setMessages((prev) => [
      ...prev,
      { from: "user", text: `📂 Selected file: ${selectedFile.name}` },
    ]);
  };

  const sendMessage = async () => {
    if (!file) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "❗ Please upload a CSV file first." },
      ]);
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8002/analyze-csv/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: data.insights || "No insights." },
      ]);
    } catch (err) {
      console.error("Error analyzing:", err);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "❌ Error analyzing file." },
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div>
      <button onClick={goBack}>⬅ Back</button>

      <input
        type="file"
        accept=".csv"
        onChange={handleUpload}
        className="border p-2 rounded my-2"
      />

      <ChatLayout
        title="Data Analysis"
        input={input}
        messages={messages}
        setInput={setInput}
        sendMessage={sendMessage}
        loading={loading}
      />
    </div>
  );
}


function AIChatbot({ goBack }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", text: input }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://apichatbotrax.vercel.app/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, role: "Human" })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { from: "bot", text: data.response }]);
    } catch {
      setMessages((prev) => [...prev, { from: "bot", text: "Sorry, cannot chat right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatLayout
      title="AI Chatbot"
      input={input}
      messages={messages}
      setInput={setInput}
      sendMessage={sendMessage}
      loading={loading}
      goBack={goBack}
    />
  );
}

function ImageGen({ goBack }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    setMessages((prev) => [...prev, { from: "user", text: input }]);
    setInput("");
    setLoading(true);
  
    try {
      const res = await fetch("http://127.0.0.1:8000/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input })
      });
  
      if (!res.ok) throw new Error("Failed to generate image");
  
      const data = await res.json();
      setMessages((prev) => [...prev, { from: "bot", image: data.image_url }]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: "bot", text: "❌ Could not generate image." }]);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <ChatLayout
      title="Image Generator"
      input={input}
      messages={messages}
      setInput={setInput}
      sendMessage={sendMessage}
      loading={loading}
      goBack={goBack}
    />
  );
}


function ChatLayout({ title, input, messages, setInput, sendMessage, loading, goBack }) {
  return (
    <div className="flex flex-col h-full">
      {goBack && <button onClick={goBack}>⬅ Back</button>}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-2 rounded mb-2">
      {messages.map((m, i) => (
  <div key={i} className={`mb-2 ${m.from === "user" ? "text-right text-black" : "text-left text-blue-600"}`}>
    {m.text && <div className="text-sm">{m.text}</div>}
    {m.image && (
      <img
        src={m.image}
        alt="Generated"
        className="max-w-[300px] max-h-[300px] rounded shadow inline-block"
      />
    )}
  </div>
))}

        {loading && <div className="italic text-gray-500">Loading...</div>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>

</div>
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
