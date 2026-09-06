import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("journalUser")) || null
  );
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [partnerName, setPartnerName] = useState("");

  const [mood, setMood] = useState("");
  const [entry, setEntry] = useState("");
  const [grateful, setGrateful] = useState("");
  const [photo, setPhoto] = useState(null);
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("home");

  useEffect(() => {
    fetchEntries();

    // Subscribe to live changes from Supabase database
    const channel = supabase
      .channel("entries-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "entries" },
        () => {
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchEntries() {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setEntries(data);
    }
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const todayIso = new Date().toISOString().split("T")[0];

  function handleAuth(e) {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields! 💗");
      return;
    }

    const userData = {
      email,
      name: partnerName || email.split("@")[0],
    };

    setUser(userData);
    localStorage.setItem("journalUser", JSON.stringify(userData));
    setEmail("");
    setPassword("");
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("journalUser");
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  }

  async function saveEntry() {
    if (!entry && !grateful && !mood && !photo) {
      alert("Please add a note, mood, gratitude, or photo first! 🥺");
      return;
    }

    const newEntry = {
      author: user.name,
      date: today,
      iso_date: todayIso,
      mood,
      entry,
      grateful,
      photo,
      is_favorite: false,
    };

    const { error } = await supabase.from("entries").insert([newEntry]);

    if (error) {
      alert("Error saving entry: " + error.message);
    } else {
      setMood("");
      setEntry("");
      setGrateful("");
      setPhoto(null);
      setCurrentView("home");
      alert("Entry saved beautifully to cloud! 💗");
    }
  }

  async function deleteEntry(id) {
    if (window.confirm("Are you sure you want to delete this memory? 🥺")) {
      const { error } = await supabase.from("entries").delete().eq("id", id);
      if (error) alert("Error deleting: " + error.message);
    }
  }

  async function toggleFavorite(id, currentStatus) {
    const { error } = await supabase
      .from("entries")
      .update({ is_favorite: !currentStatus })
      .eq("id", id);

    if (error) alert("Error updating favorite: " + error.message);
  }

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function changeMonth(offset) {
    setCalendarDate(new Date(currentYear, currentMonth + offset, 1));
  }

  function getFormattedIso(day) {
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentYear}-${m}-${d}`;
  }

  const entryDates = new Set(entries.map((item) => item.iso_date));
  const filteredEntries = selectedDate
    ? entries.filter((item) => item.iso_date === selectedDate)
    : entries;

  if (!user) {
    return (
      <div className="app">
        <header className="header">
          <div className="logo">💗</div>
          <h1>Our Journal</h1>
          <p>A little place for OUR memories!!</p>
        </header>

        <main className="journal auth-card">
          <h2>{authMode === "login" ? "Welcome Back 💌" : "Create Account 🌸"}</h2>
          <form onSubmit={handleAuth} className="auth-form">
            {authMode === "signup" && (
              <input
                type="text"
                placeholder="Your Name / Nickname"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="auth-input"
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
            <button type="submit" className="save-button">
              {authMode === "login" ? "Open Our Journal 💗" : "Create Account 💖"}
            </button>
          </form>

          <p className="auth-toggle">
            {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
            >
              {authMode === "login" ? "Sign Up" : "Log In"}
            </span>
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="user-bar">
          <span>Logged in as <strong>{user.name}</strong> 🌸</span>
          <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
        <div className="logo">💗</div>
        <h1>Our Journal</h1>
        <p>A little place for OUR memories!!</p>
      </header>

      <main className="journal">
        <p className="date">{today}</p>

        {currentView === "home" && (
          <div className="view-home">
            <h2>How are you feeling today??</h2>

            <div className="moods">
              {["😭", "😕", "😑", "😊", "😁"].map((emoji) => (
                <button
                  key={emoji}
                  className={`mood ${mood === emoji ? "selected" : ""}`}
                  onClick={() => setMood(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              className="garden-banner-btn"
              onClick={() => setCurrentView("garden")}
            >
              🌱 Visit Our Memory Garden ({entries.length} Flowers Bloomed)
            </button>

            <div className="page-options">
              <button
                className={`page-card ${entry || photo ? "has-content" : ""}`}
                onClick={() => setCurrentView("entry")}
              >
                <span className="page-icon">📖</span>
                <div className="page-card-text">
                  <h3>What happened today?</h3>
                  <p>{entry || photo ? "Memory / Photo attached ✍️" : "Tap to open page..."}</p>
                </div>
              </button>

              <button
                className={`page-card ${grateful ? "has-content" : ""}`}
                onClick={() => setCurrentView("grateful")}
              >
                <span className="page-icon">✨</span>
                <div className="page-card-text">
                  <h3>Grateful page</h3>
                  <p>{grateful ? "Gratitude added ✍️" : "Tap to open page..."}</p>
                </div>
              </button>
            </div>

            <button className="save-button" onClick={saveEntry}>
              Save today's entry 💗
            </button>
          </div>
        )}

        {currentView === "entry" && (
          <div className="view-page">
            <button className="back-btn" onClick={() => setCurrentView("home")}>
              ← Back to Cover
            </button>
            <h2>📖 Ssupp?! What happened today??</h2>
            <textarea
              placeholder="Tell me about your day..."
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              autoFocus
            />

            <div className="photo-upload-section">
              <label htmlFor="photo-input" className="photo-upload-label">
                📷 {photo ? "Change Photo" : "Add a Photo Memory"}
              </label>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
              />

              {photo && (
                <div className="photo-preview-container">
                  <img src={photo} alt="Memory Preview" className="photo-preview" />
                  <button className="remove-photo-btn" onClick={() => setPhoto(null)}>
                    ✕ Remove Photo
                  </button>
                </div>
              )}
            </div>

            <button className="done-btn" onClick={() => setCurrentView("home")}>
              Keep Writing Later 💗
            </button>
          </div>
        )}

        {currentView === "grateful" && (
          <div className="view-page">
            <button className="back-btn" onClick={() => setCurrentView("home")}>
              ← Back to Cover
            </button>
            <h2>✨ Something I'm grateful for</h2>
            <textarea
              placeholder="Something that made today special...!?"
              value={grateful}
              onChange={(e) => setGrateful(e.target.value)}
              autoFocus
            />
            <button className="done-btn" onClick={() => setCurrentView("home")}>
              Keep Writing Later 💗
            </button>
          </div>
        )}

        {currentView === "garden" && (
          <div className="view-page">
            <button className="back-btn" onClick={() => setCurrentView("home")}>
              ← Back to Cover
            </button>
            <h2>🌸 Our Memory Garden 🌻</h2>
            <p className="garden-subtitle">Every memory you save plants a flower here!</p>

            <div className="garden-plot">
              {entries.length === 0 ? (
                <p className="no-entries">Your garden is waiting for its first memory! 🌱</p>
              ) : (
                entries.map((item, index) => {
                  const flowers = ["🌸", "🌹", "🌻", "🌷", "🌺", "🌼"];
                  const flowerEmoji = flowers[index % flowers.length];

                  return (
                    <div
                      key={item.id}
                      className="garden-flower"
                      onClick={() => {
                        setSelectedDate(item.iso_date);
                        setCurrentView("home");
                      }}
                      title={`${item.date} by ${item.author}: ${item.entry || "Grateful entry"}`}
                    >
                      <span className="flower-emoji">{flowerEmoji}</span>
                      <span className="flower-date">{item.date.split(",")[0]}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      <section className="history">
        <h2 className="history-title">Our Memory Calendar 🗓️</h2>

        <div className="calendar-card">
          <div className="calendar-header">
            <button className="month-btn" onClick={() => changeMonth(-1)}>&lt;</button>
            <h3>{monthNames[currentMonth]} {currentYear}</h3>
            <button className="month-btn" onClick={() => changeMonth(1)}>&gt;</button>
          </div>

          <div className="calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateIso = getFormattedIso(day);
              const hasEntry = entryDates.has(dateIso);
              const isSelected = selectedDate === dateIso;

              return (
                <button
                  key={day}
                  className={`calendar-day ${isSelected ? "selected-day" : ""} ${hasEntry ? "has-entry" : ""}`}
                  onClick={() => setSelectedDate(isSelected ? "" : dateIso)}
                >
                  <span className="day-number">{day}</span>
                  {hasEntry && <span className="flower-icon">🌸</span>}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <button className="reset-filter-btn" onClick={() => setSelectedDate("")}>
              Show All Memories ✨
            </button>
          )}
        </div>

        <div className="entries-list">
          {filteredEntries.length === 0 ? (
            <p className="no-entries">No entries found for this date! 🌸</p>
          ) : (
            filteredEntries.map((item) => (
              <div key={item.id} className={`entry-card ${item.is_favorite ? "favorite-card" : ""}`}>
                <div className="entry-header">
                  <div className="header-left">
                    <span className="entry-date">{item.date}</span>
                    <span className="entry-mood">{item.mood}</span>
                    {item.author && <span className="entry-author">by {item.author}</span>}
                  </div>
                  <div className="card-actions">
                    <button
                      className="action-btn fav-btn"
                      onClick={() => toggleFavorite(item.id, item.is_favorite)}
                      title="Favorite this memory"
                    >
                      {item.is_favorite ? "💖" : "🤍"}
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => deleteEntry(item.id)}
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {item.photo && (
                  <div className="entry-photo-wrapper">
                    <img src={item.photo} alt="Memory attachment" className="entry-photo" />
                  </div>
                )}
                {item.entry && <p className="entry-text">{item.entry}</p>}
                {item.grateful && (
                  <div className="entry-grateful">
                    <strong>✨ Grateful for:</strong> {item.grateful}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default App;