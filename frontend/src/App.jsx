import { useState, useEffect, useRef } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let storedSession = localStorage.getItem("sessionId");

    if (!storedSession) {
      storedSession = Date.now().toString();
      localStorage.setItem("sessionId", storedSession);
    }

    setSessionId(storedSession);

    fetch(`/api/conversations/${storedSession}`)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: input })
      });

      const data = await response.json();

      const assistantMessage = {
        role: "assistant",
        content: data.reply
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Something went wrong." }
      ]);
    }

    setInput("");
    setLoading(false);
  };

  const newChat = () => {
    const newSession = Date.now().toString();
    localStorage.setItem("sessionId", newSession);
    setSessionId(newSession);
    setMessages([]);
  };

  return (
    <div style={outerStyle}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2>AI Support Assistant</h2>
          <button style={styles.newChatBtn} onClick={newChat}>
            New Chat
          </button>
        </div>

        <div style={styles.chatBox}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.messageWrapper,
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  ...styles.message,
                  backgroundColor:
                    msg.role === "user" ? "#2563eb" : "#e5e7eb",
                  color: msg.role === "user" ? "#fff" : "#000"
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.messageWrapper}>
              <div style={styles.loadingBubble}>
                Assistant is typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputArea}>
          <input
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button style={styles.sendBtn} onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const outerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  backgroundColor: "#111827"
};

const styles = {
  container: {
    width: "100%",
    maxWidth: 700,
    height: "85vh",
    display: "flex",
    flexDirection: "column",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
  },
  header: {
    padding: 15,
    backgroundColor: "#1f2937",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  newChatBtn: {
    padding: "6px 12px",
    backgroundColor: "#2563eb",
    border: "none",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer"
  },
  chatBox: {
    flex: 1,
    padding: 15,
    overflowY: "auto",
    backgroundColor: "#f3f4f6"
  },
  messageWrapper: {
    display: "flex",
    marginBottom: 10
  },
  message: {
    padding: "10px 14px",
    borderRadius: 12,
    maxWidth: "70%",
    fontSize: 14
  },
  loadingBubble: {
    padding: "10px 14px",
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    fontSize: 14
  },
  inputArea: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #ddd",
    backgroundColor: "#fff"
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
    outline: "none"
  },
  sendBtn: {
    marginLeft: 8,
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer"
  }
};

export default App;
