import { useState } from "react";
import Medicines from "./pages/Medicines";
import Stock from "./pages/Stock";
import Alerts from "./pages/Alerts";
import BinMap from "./pages/BinMap";

const PAGES = [
  { key: "stock",     label: "Stock Inventory",  icon: "▦" },
  { key: "medicines", label: "Medicine Database", icon: "⊕" },
  { key: "alerts",    label: "Alerts",            icon: "⚠" },
  { key: "binmap",    label: "Store Bin Map",     icon: "⊞" },
];

export default function App() {
  const [page, setPage] = useState("stock");

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: "220px", background: "#F7F8FA", borderRight: "1px solid #E5E7EB", padding: "20px 12px", display: "flex", flexDirection: "column" }}>

        <div style={{ marginBottom: "24px", paddingLeft: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#111" }}>AI Medical Store</h2>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#888" }}>Phase 2 — Inventory</p>
        </div>

        <div>
          {PAGES.map(p => (
            <button
              key={p.key}
              onClick={() => setPage(p.key)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                width: "100%", padding: "9px 12px", borderRadius: "8px",
                border: "none", cursor: "pointer", marginBottom: "2px",
                fontSize: "13px", textAlign: "left",
                background: page === p.key ? "#E6F1FB" : "transparent",
                color: page === p.key ? "#185FA5" : "#555",
                fontWeight: page === p.key ? 500 : 400,
              }}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "auto", fontSize: "11px", color: "#aaa", paddingLeft: "8px" }}>
          Phase 1 complete ✓
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
        {page === "stock"     && <Stock />}
        {page === "medicines" && <Medicines />}
        {page === "alerts"    && <Alerts />}
        {page === "binmap"    && <BinMap />}
      </div>

    </div>
  );
}