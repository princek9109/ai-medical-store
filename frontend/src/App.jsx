import { useState } from "react";
import Medicines       from "./pages/Medicines";
import Stock           from "./pages/Stock";
import Alerts          from "./pages/Alerts";
import BinMap          from "./pages/BinMap";
import NewPrescription from "./pages/NewPrescription";
import Dispense        from "./pages/Dispense";
import Billing         from "./pages/Billing";

const PAGES = [
  { key:"new_rx",    label:"New Prescription", icon:"+" ,  section:"workflow" },
  { key:"dispense",  label:"Dispense Queue",    icon:"✓" ,  section:"workflow" },
  { key:"billing",   label:"Billing",           icon:"₹" ,  section:"workflow" },
  { key:"stock",     label:"Stock Inventory",   icon:"▦" ,  section:"inventory" },
  { key:"medicines", label:"Medicine Database", icon:"⊕" ,  section:"inventory" },
  { key:"alerts",    label:"Alerts",            icon:"!" ,  section:"inventory" },
  { key:"binmap",    label:"Store Bin Map",     icon:"⊞" ,  section:"inventory" },
];

export default function App() {
  const [page, setPage] = useState("new_rx");
  const [activePrescription, setActivePrescription] = useState(null);

  const handlePrescriptionCreated = (rx) => {
    setActivePrescription(rx);
    setPage("dispense");
  };

  const handleReadyToBill = (rx) => {
    setActivePrescription(rx);
    setPage("billing");
  };

  const workflow  = PAGES.filter(p => p.section === "workflow");
  const inventory = PAGES.filter(p => p.section === "inventory");

  const NavBtn = ({ p }) => (
    <button onClick={() => setPage(p.key)}
      style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",
        padding:"9px 12px",borderRadius:"8px",border:"none",cursor:"pointer",
        marginBottom:"2px",fontSize:"13px",textAlign:"left",
        background:page===p.key?"#E6F1FB":"transparent",
        color:page===p.key?"#185FA5":"#555",
        fontWeight:page===p.key?500:400}}>
      {p.icon} {p.label}
    </button>
  );

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"sans-serif"}}>

      {/* Sidebar */}
      <div style={{width:"220px",background:"#F7F8FA",borderRight:"1px solid #E5E7EB",
        padding:"20px 12px",display:"flex",flexDirection:"column"}}>

        <div style={{marginBottom:"24px",paddingLeft:"8px"}}>
          <h2 style={{margin:0,fontSize:"16px",fontWeight:600,color:"#111"}}>AI Medical Store</h2>
          <p style={{margin:"4px 0 0",fontSize:"12px",color:"#888"}}>Phase 3 — Dispense & Billing</p>
        </div>

        <div>
          <div style={{fontSize:"10px",fontWeight:600,color:"#aaa",letterSpacing:"0.08em",
            padding:"0 12px",marginBottom:"4px"}}>WORKFLOW</div>
          {workflow.map(p  => <NavBtn key={p.key} p={p} />)}

          <div style={{fontSize:"10px",fontWeight:600,color:"#aaa",letterSpacing:"0.08em",
            padding:"0 12px",margin:"12px 0 4px"}}>INVENTORY</div>
          {inventory.map(p => <NavBtn key={p.key} p={p} />)}
        </div>

        <div style={{marginTop:"auto",fontSize:"11px",color:"#aaa",paddingLeft:"8px"}}>
          Phases 1 &amp; 2 complete ✓
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,overflow:"auto",padding:"24px"}}>
        {page==="new_rx"    && <NewPrescription onCreated={handlePrescriptionCreated} />}
        {page==="dispense"  && <Dispense prescription={activePrescription} onReadyToBill={handleReadyToBill} />}
        {page==="billing"   && <Billing prescription={activePrescription} onDone={() => setActivePrescription(null)} />}
        {page==="stock"     && <Stock />}
        {page==="medicines" && <Medicines />}
        {page==="alerts"    && <Alerts />}
        {page==="binmap"    && <BinMap />}
      </div>

    </div>
  );
}