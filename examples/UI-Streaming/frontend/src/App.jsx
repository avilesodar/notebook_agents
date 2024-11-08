import { useState, useEffect, useRef } from "react";

function App() {
  const [message, setMessage] = useState('');
  const [streamedContent, setStreamedContent] = useState('');
  const eventSourceRef = useRef(null);

 useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const sendMessage = (userMessage) => {

    const newUserMessage = `
    <div class="mb-4">
      <div class="font-bold">You:</div>
      <div class="pl-4">${userMessage}</div>
    </div>
    <div>
      <div class="font-bold">Assistant:</div>
      <div class="pl-4">`;

    setStreamedContent(prevHistory => prevHistory + newUserMessage)

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new EventSource connection
    eventSourceRef.current = new EventSource(
      `http://localhost:8000/chat_stream/${encodeURIComponent(message)}`
    );

    // Handle incoming messages
    eventSourceRef.current.onmessage = (event) => {
      setStreamedContent(prevContent => prevContent + event.data);
    };

    // Handle errors
    eventSourceRef.current.onerror = (err) => {
      console.error(
        "EventSource failed. ReadyState:",
        eventSourceRef.current.readyState,
        "Error:",
        err
      );
      eventSourceRef.current.close();
      setStreamedContent(prevHistory => prevHistory + '</div></div>')
    };

    eventSourceRef.current.onopen = () => {
      eventSourceRef.current.addEventListener('done', () => {
        setStreamedContent(prevHistory => prevHistory + '</div></div>');
      });
    };

    setMessage("")
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-center text-2xl font-bold mb-6">
        Chat API Streaming Data
      </h1>

      <form onSubmit={handleSubmit} className="flex items-center gap-4 mb-6">
        <div className="flex-grow">
          <input
            type="text"
            id="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your message"
          />
        </div>

        <button
          type="submit"
          className="btn waves-effect waves-light"
        >
          Send Message
        </button>
      </form>

      <div
        id="data-container"
        className="mt-4 p-4 border rounded-lg min-h-[200px]"
        dangerouslySetInnerHTML={{ __html: streamedContent }}
      />
    </div>
  )
}

export default App
