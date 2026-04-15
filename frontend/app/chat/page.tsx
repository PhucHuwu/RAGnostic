import ReactMarkdown from "react-markdown";

const demoAnswer = `# Xin chao\n\n- Day la markdown demo\n- Ho tro danh sach, **in dam**, va ma:\n\n\`\`\`python\nprint(\"RAGnostic\")\n\`\`\``;

export default function ChatPage() {
  return (
    <main className="chat-page">
      <aside className="sidebar glass">
        <h2>Profiles</h2>
        <ul>
          <li>General Assistant</li>
          <li>Legal Docs</li>
          <li>Product Knowledge</li>
        </ul>
      </aside>

      <section className="chat-panel glass">
        <header>
          <h1>Chat Session</h1>
          <p>Session memory: 10 latest user turns</p>
        </header>

        <div className="messages">
          <div className="message user">Tom tat he thong RAGnostic giup toi.</div>
          <div className="message assistant markdown">
            <ReactMarkdown>{demoAnswer}</ReactMarkdown>
          </div>
        </div>

        <form className="composer">
          <input type="text" placeholder="Nhap cau hoi..." />
          <button type="button">Gui</button>
        </form>
      </section>
    </main>
  );
}
