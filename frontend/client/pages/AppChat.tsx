import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  MoreVertical,
  Trash2,
  AlertCircle,
  Loader,
} from "lucide-react";
import UserLayout from "@/components/layouts/UserLayout";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status?: "sent" | "failed";
}

const AppChat = () => {
  const { profileId } = useParams();
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "Hỏi về tính năng sản phẩm",
      createdAt: "2024-01-28",
      messageCount: 12,
    },
    {
      id: "2",
      title: "Cấu hình hệ thống",
      createdAt: "2024-01-27",
      messageCount: 8,
    },
    {
      id: "3",
      title: "Troubleshooting lỗi",
      createdAt: "2024-01-26",
      messageCount: 15,
    },
  ]);

  const [activeSessionId, setActiveSessionId] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "user",
      content: "Làm cách nào để tải tài liệu lên hệ thống?",
      timestamp: "10:30",
      status: "sent",
    },
    {
      id: "2",
      role: "assistant",
      content:
        "Bạn có thể tải tài liệu lên qua hai cách:\n\n1. **Kéo và thả**: Kéo file từ máy tính của bạn vào vùng được chỉ định\n2. **Chọn file**: Nhấn nút \"Chọn file\" để duyệt và chọn từ máy tính\n\nHệ thống hỗ trợ các định dạng: PDF, TXT, DOCX, XLSX",
      timestamp: "10:31",
      status: "sent",
    },
    {
      id: "3",
      role: "user",
      content: "File tối đa bao nhiêu MB?",
      timestamp: "10:32",
      status: "sent",
    },
    {
      id: "4",
      role: "assistant",
      content:
        "Giới hạn kích thước file tối đa là **100MB** cho mỗi file. Nếu bạn có file lớn hơn, bạn có thể:\n\n- Chia nhỏ file thành các phần\n- Nén file trước khi tải lên\n- Liên hệ hỗ trợ để được cấp hạn mức cao hơn",
      timestamp: "10:33",
      status: "sent",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: String(messages.length + 1),
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent",
    };

    setMessages([...messages, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate API response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: String(messages.length + 2),
        role: "assistant",
        content:
          "Đây là câu trả lời từ hệ thống. Trong sản phẩm thực tế, đây sẽ là câu trả lời được tạo bởi mô hình AI dựa trên dữ liệu trong tài liệu của bạn.",
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sent",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <UserLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Left Sidebar - Sessions */}
        <div className="lg:col-span-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
          {/* Create New Session Button */}
          <div className="p-4 border-b border-border">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              Phiên mới
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm phiên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Không tìm thấy phiên nào
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors group ${
                      activeSessionId === session.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">
                          {session.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.messageCount} tin nhắn
                        </p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Chat */}
        <div className="lg:col-span-3 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-card/50">
            <h2 className="font-display font-bold text-lg text-foreground">
              {currentSession?.title || "Chat"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Profile: Hỗ trợ Khách hàng
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 animate-slide-up ${
                  message.role === "user"
                    ? "flex-row-reverse"
                    : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                    message.role === "user"
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/20 text-secondary"
                  }`}
                >
                  {message.role === "user" ? "U" : "A"}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}
                >
                  {/* Markdown-like rendering */}
                  <div className="text-sm leading-relaxed space-y-2">
                    {message.content.split("\n\n").map((paragraph, idx) => (
                      <div key={idx}>
                        {paragraph.split("\n").map((line, lineIdx) => {
                          // Handle markdown bold
                          const boldRegex = /\*\*(.*?)\*\*/g;
                          const parts = line.split(boldRegex);
                          return (
                            <div key={lineIdx}>
                              {parts.map((part, partIdx) =>
                                partIdx % 2 === 1 ? (
                                  <strong key={partIdx}>{part}</strong>
                                ) : (
                                  <span key={partIdx}>{part}</span>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs opacity-70">{message.timestamp}</span>
                    {message.status === "failed" && (
                      <AlertCircle className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold bg-secondary/20 text-secondary">
                  A
                </div>
                <div className="px-4 py-3 rounded-lg bg-muted rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"></div>
                    <div
                      className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card/50">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Nhập câu hỏi..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default AppChat;
