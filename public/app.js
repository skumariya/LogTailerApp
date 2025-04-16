const { useState, useEffect, useRef } = React;

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState([]); // Initialize as empty array
  const [selectedFile, setSelectedFile] = useState("");
  const [logLines, setLogLines] = useState([]);
  const [numLines, setNumLines] = useState(10);
  const [pattern, setPattern] = useState("");
  const [directory, setDirectory] = useState("");
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    // Check authentication status and fetch files
    fetch("/api/files", { credentials: "include" })
      .then((response) => {
        if (response.ok) {
          setIsAuthenticated(true);
          return response.json();
        }
        throw new Error("Not authenticated");
      })
      .then((data) => {
        // Ensure files is always an array
        setFiles(Array.isArray(data.files) ? data.files : []);
      })
      .catch((error) => {
        setError(error.message);
        setIsAuthenticated(false);
        setFiles([]);
      });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      socketRef.current = io({ withCredentials: true });

      socketRef.current.on("data", ({ filePath, data }) => {
        if (filePath === selectedFile) {
          setLogLines((prev) => [...prev, data]);
          if (logContainerRef.current) {
            logContainerRef.current.scrollTop =
              logContainerRef.current.scrollHeight;
          }
        }
      });

      socketRef.current.on("error", ({ error }) => {
        console.error("Socket error:", error);
        setError(error);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [isAuthenticated, selectedFile]);

  const handleFileSelect = (file) => {
    if (socketRef.current) {
      if (selectedFile) {
        socketRef.current.emit("stopTail", { filePath: selectedFile });
      }
      setSelectedFile(file);
      setLogLines([]);
      socketRef.current.emit("startTail", { filePath: file, lines: numLines });
    }
  };

  const handleSearch = () => {
    fetch(
      `/api/files?pattern=${encodeURIComponent(
        pattern
      )}&directory=${encodeURIComponent(directory)}`,
      {
        credentials: "include",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        // Ensure files is always an array
        setFiles(Array.isArray(data.files) ? data.files : []);
      })
      .catch((error) => {
        console.error("Error fetching files:", error);
        setError("Error fetching files");
        setFiles([]);
      });
  };

  const handleLogout = () => {
    fetch(`/logout`, {
      credentials: "include",
    });
    // Clear user data from state
    setIsAuthenticated(false);
    setFiles([]);
    setError();
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <h1 className="mb-4">File Tail Service</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        <div>
          <a href="/auth/github" className="btn btn-dark auth-button">
            Login with GitHub
          </a>
        </div>
        <div>
          <a href="/auth/google" className="btn btn-primary auth-button">
            Login with Google
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="col-md-4">
        <h1 className="md-4">File Tail Service</h1>
      </div>
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="settings-panel">
        <div className="row">
          <div className="col-md-4">
            <div className="form-group">
              <label>File Pattern:</label>
              <input
                type="text"
                className="form-control"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g., erro.log or debug.log"
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="form-group">
              <label>Directory:</label>
              <input
                type="text"
                className="form-control"
                value={directory}
                onChange={(e) => setDirectory(e.target.value)}
                placeholder="e.g., domailname.com/logs"
              />
            </div>
          </div>
          <div className="col-md-2">
            <div className="form-group">
              <label>Number of Lines:</label>
              <input
                type="number"
                className="form-control"
                value={numLines}
                onChange={(e) => setNumLines(parseInt(e.target.value) || 10)}
                min="1"
              />
            </div>
          </div>
          <div className="col-md-2">
            <div className="form-group">
              <label>&nbsp;</label>
              <button
                className="btn btn-primary form-control"
                onClick={handleSearch}
              >
                Search Files
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-3">
          <div className="file-selector">
            <h4>Available Files</h4>
            <div className="list-group">
              {Array.isArray(files) && files.length > 0 ? (
                files.map((file, index) => (
                  <button
                    key={index}
                    className={`list-group-item list-group-item-action ${
                      selectedFile === file ? "active" : ""
                    }`}
                    onClick={() => handleFileSelect(file)}
                  >
                    {file.split("/").pop()}
                  </button>
                ))
              ) : (
                <div className="list-group-item">No files found</div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-9">
          <div className="log-container" ref={logContainerRef}>
            {logLines.map((line, index) => (
              <pre key={index} className="log-line">
                {line}
              </pre>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
