"use client";
import React, { useState, useEffect } from "react"

interface ChatMessage {
  id: string
  sender: string
  senderRole: "reporter" | "department"
  message: string
  timestamp: string
  attachment?: {
    name: string
    url: string
  }
}

interface ChatComponentProps {
  pelaporanId: string
  currentUserName: string
  currentUserRole: "reporter" | "department"
  departmentName: string
  onMessagesChange?: (messages: ChatMessage[]) => void
}

export function ChatComponent({
  pelaporanId,
  currentUserName,
  currentUserRole,
  departmentName,
  onMessagesChange,
}: ChatComponentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Load messages
  useEffect(() => {
    const storageBag = `chat-${pelaporanId}`
    const saved = localStorage.getItem(storageBag)
    if (saved) {
      const loadedMessages = JSON.parse(saved)
      setMessages(loadedMessages)
    }
  }, [pelaporanId])

  // Notify parent of message changes
  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages)
    }
  }, [messages, onMessagesChange])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsLoading(true)

    try {
      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: currentUserName,
        senderRole: currentUserRole,
        message: newMessage,
        timestamp: new Date().toISOString(),
      }

      const updated = [...messages, message]
      setMessages(updated)

      // Save to localStorage
      localStorage.setItem(`chat-${pelaporanId}`, JSON.stringify(updated))

      // Clear input
      setNewMessage("")

      // Scroll to bottom
      setTimeout(() => {
        const chatBox = document.getElementById(`chat-messages-${pelaporanId}`)
        if (chatBox) {
          chatBox.scrollTop = chatBox.scrollHeight
        }
      }, 0)
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Gagal mengirim pesan")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString("id-ID")
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h4>💬 Chat / Diskusi</h4>
        <div className="chat-participants">
          <span className="participant reporter">👤 Pelapor</span>
          <span className="participant department">🏢 {departmentName}</span>
        </div>
      </div>

      <div className="chat-messages" id={`chat-messages-${pelaporanId}`}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Belum ada pesan. Mulai diskusi sekarang!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${
                  msg.senderRole === currentUserRole ? "own-message" : "other-message"
                }`}
              >
                <div className="message-header">
                  <strong className={`sender-${msg.senderRole}`}>
                    {msg.senderRole === "reporter" ? "👤" : "🏢"} {msg.sender}
                  </strong>
                  <small className="message-time">
                    {formatTime(msg.timestamp)}
                  </small>
                </div>
                <div className="message-content">
                  <p>{msg.message}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-group">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tulis pesan Anda di sini..."
            rows={3}
            disabled={isLoading}
            className="chat-textarea"
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="btn-send"
          >
            {isLoading ? "Mengirim..." : "📤 Kirim"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          background: #f9f9f9;
          border-radius: 8px;
          overflow: hidden;
          height: 600px;
          border: 1px solid #e0e0e0;
        }

        .chat-header {
          background: #e3f2fd;
          padding: 12px 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .chat-header h4 {
          margin: 0 0 8px;
          color: #0d47a1;
          font-size: 1rem;
        }

        .chat-participants {
          display: flex;
          gap: 12px;
          font-size: 0.85rem;
        }

        .participant {
          padding: 4px 8px;
          border-radius: 4px;
          background: white;
        }

        .participant.reporter {
          background: #c8e6c9;
          color: #1b5e20;
        }

        .participant.department {
          background: #bbdefb;
          color: #0d47a1;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .empty-chat {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
          text-align: center;
        }

        .message {
          padding: 12px;
          border-radius: 8px;
          max-width: 85%;
          word-wrap: break-word;
        }

        .own-message {
          align-self: flex-end;
          background: #c8e6c9;
          margin-left: 15%;
        }

        .other-message {
          align-self: flex-start;
          background: #bbdefb;
          margin-right: 15%;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          gap: 8px;
        }

        .message-header strong {
          font-size: 0.9rem;
        }

        .sender-reporter {
          color: #1b5e20;
        }

        .sender-department {
          color: #0d47a1;
        }

        .message-time {
          font-size: 0.75rem;
          color: #666;
        }

        .message-content {
          margin: 0;
        }

        .message-content p {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.4;
          color: #333;
        }

        .chat-input-form {
          padding: 12px;
          border-top: 1px solid #e0e0e0;
          background: white;
        }

        .input-group {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .chat-textarea {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 0.9rem;
          font-family: inherit;
          resize: none;
        }

        .chat-textarea:focus {
          border-color: #1e88e5;
          outline: none;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
        }

        .chat-textarea:disabled {
          background: #f5f5f5;
          color: #999;
        }

        .btn-send {
          padding: 10px 16px;
          background: #1e88e5;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          white-space: nowrap;
          transition: background 0.3s;
        }

        .btn-send:hover:not(:disabled) {
          background: #1565c0;
        }

        .btn-send:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .chat-container {
            height: 400px;
          }

          .message {
            max-width: 95%;
          }

          .own-message {
            margin-left: 5%;
          }

          .other-message {
            margin-right: 5%;
          }
        }
      `}</style>
    </div>
  )
}
