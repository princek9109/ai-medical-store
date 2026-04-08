import { useState, useRef } from "react";
import { searchDrugs, createPrescription } from "../api";

const EMPTY_ITEM = { extracted_name:"", validated_name:"", medicine_id:null,
  quantity:1, dosage:"", frequency:"", duration:"", confidence:1.0,
  in_stock:true, available_qty:0, bin_location:"", mrp:0,
  stock_id:null, gst_rate:12, hsn_code:"" };

export default function NewPrescription({ onCreated }) {
  const [patient, setPatient] = useState({ patient_name:"", patient_abha_id:"",
    doctor_name:"", doctor_reg_no:"" });
  const [items,   setItems]   = useState([]);
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState(null);
  const timer = useRef(null);

  const handleQueryChange = (val) => {
    setQuery(val);
    clearTimeout(timer.current);
    if (val.length < 2) { setResults([]); return; }
    setSearching(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await searchDrugs(val);
        setResults(res.data);
      } catch(e) { setResults([]); }
      setSearching(false);
    }, 350);
  };

  const addFromResult = (r) => {
    setItems(prev => [...prev, {
      extracted_name: r.canonical_name,
      validated_name: r.canonical_name,
      medicine_id:    r.medicine_id,
      quantity:       1,
      dosage:         "",
      frequency:      "",
      duration:       "",
      confidence:     r.score / 100,
      in_stock:       r.in_stock,
      available_qty:  r.available_qty,
      bin_location:   r.bin_location || "Not assigned",
      mrp:            r.mrp || 0,
      stock_id:       r.stock_id,
      gst_rate:       r.gst_rate,
      hsn_code:       r.hsn_code || ""
    }]);
    setQuery("");
    setResults([]);
  };

  const updateItem = (idx, field, val) => {
    setItems(prev => prev.map((it,i) => i===idx ? {...it,[field]:val} : it));
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_,i) => i!==idx));

  const handleSave = async () => {
    if (!patient.patient_name || !patient.doctor_name) {
      setMsg({ type:"warn", text:"Patient name and doctor name are required." });
      return;
    }
    if (items.length === 0) {
      setMsg({ type:"warn", text:"Add at least one medicine before saving." });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...patient, items: items.map(it => ({
        medicine_id:    it.medicine_id,
        extracted_name: it.extracted_name,
        validated_name: it.validated_name,
        quantity:       it.quantity,
        dosage:         it.dosage,
        frequency:      it.frequency,
        duration:       it.duration,
        confidence:     it.confidence
      }))};
      const res = await createPrescription(payload);
      setMsg({ type:"ok", text:`Prescription saved! ID: ${res.data.id.slice(0,8)}...` });
      if (onCreated) onCreated(res.data);
    } catch(e) {
      setMsg({ type:"err", text: e.response?.data?.detail || "Save failed. Check the console." });
    }
    setSaving(false);
  };

  return (
    <div style={{maxWidth:"860px"}}>
      <h2 style={{margin:"0 0 16px",fontSize:"18px",fontWeight:500}}>New Prescription</h2>

      {msg && (
        <div style={{padding:"10px 16px",borderRadius:"8px",marginBottom:"16px",fontSize:"13px",
          background:msg.type==="ok"?"#EAF3DE":msg.type==="warn"?"#FAEEDA":"#FCEBEB",
          color:msg.type==="ok"?"#3B6D11":msg.type==="warn"?"#633806":"#A32D2D"}}>
          {msg.text}
        </div>
      )}

      <div style={{background:"#F7F8FA",borderRadius:"12px",padding:"16px",marginBottom:"16px",border:"0.5px solid #E5E7EB"}}>
        <div style={{fontSize:"13px",fontWeight:500,marginBottom:"12px",color:"#444"}}>Patient & Doctor Details</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"12px"}}>
          {[["patient_name","Patient Name *"],["patient_abha_id","ABHA ID (optional)"],
            ["doctor_name","Doctor Name *"],["doctor_reg_no","Doctor Reg. No."]
          ].map(([key,label]) => (
            <div key={key}>
              <label style={{fontSize:"12px",color:"#555",display:"block",marginBottom:"4px"}}>{label}</label>
              <input value={patient[key]} onChange={e => setPatient({...patient,[key]:e.target.value})}
                style={{width:"100%",padding:"7px 10px",borderRadius:"6px",
                  border:"0.5px solid #ccc",fontSize:"13px"}} />
            </div>
          ))}
        </div>
      </div>

      <div style={{background:"#F7F8FA",borderRadius:"12px",padding:"16px",marginBottom:"16px",border:"0.5px solid #E5E7EB"}}>
        <div style={{fontSize:"13px",fontWeight:500,marginBottom:"10px",color:"#444"}}>
          Add Medicines — type any name, brand, or composition
        </div>
        <div style={{position:"relative"}}>
          <input value={query} onChange={e => handleQueryChange(e.target.value)}
            placeholder="e.g. paracetamol, Crocin, amoxicillin 500..."
            style={{width:"100%",padding:"9px 14px",borderRadius:"8px",
              border:"1px solid #378ADD",fontSize:"13px",outline:"none"}} />
          {searching && (
            <div style={{fontSize:"12px",color:"#888",padding:"6px 14px"}}>searching...</div>
          )}
          {results.length > 0 && (
            <div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",
              borderRadius:"8px",boxShadow:"0 4px 20px rgba(0,0,0,0.12)",
              border:"0.5px solid #E5E7EB",zIndex:50,maxHeight:"300px",overflowY:"auto"}}>
              {results.map((r,i) => (
                <div key={i} onClick={() => addFromResult(r)}
                  style={{padding:"10px 14px",cursor:"pointer",borderBottom:"0.5px solid #f5f5f5",
                    background:i===0?"#FAFFF8":"white"}}
                  onMouseEnter={e => e.currentTarget.style.background="#F0F7FF"}
                  onMouseLeave={e => e.currentTarget.style.background=i===0?"#FAFFF8":"white"}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <span style={{fontWeight:500,fontSize:"13px"}}>{r.canonical_name}</span>
                      {r.strength && <span style={{fontSize:"12px",color:"#666",marginLeft:"6px"}}>{r.strength}</span>}
                      {r.brand_name && <span style={{fontSize:"12px",color:"#888",marginLeft:"6px"}}>({r.brand_name})</span>}
                      <div style={{fontSize:"11px",color:"#aaa",marginTop:"2px"}}>{r.salt_composition}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0,marginLeft:"12px"}}>
                      <span style={{fontSize:"12px",color:r.in_stock?"#3B6D11":"#A32D2D",fontWeight:500}}>
                        {r.in_stock ? `${r.available_qty} in stock` : "Out of stock"}
                      </span>
                      {r.bin_location && (
                        <div style={{fontSize:"11px",color:"#185FA5"}}>{r.bin_location}</div>
                      )}
                      <div style={{fontSize:"11px",color:"#888"}}>Match: {r.score}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {query.length >= 2 && results.length === 0 && !searching && (
            <div style={{padding:"10px 14px",fontSize:"13px",color:"#888"}}>
              No matches found. Check the Medicine Database or add the medicine there first.
            </div>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div style={{background:"#F7F8FA",borderRadius:"12px",padding:"16px",marginBottom:"16px",border:"0.5px solid #E5E7EB"}}>
          <div style={{fontSize:"13px",fontWeight:500,marginBottom:"12px",color:"#444"}}>
            Prescription Items ({items.length})
          </div>
          {items.map((it,idx) => (
            <div key={idx} style={{background:"white",borderRadius:"10px",padding:"12px 16px",
              marginBottom:"8px",border:"0.5px solid #E5E7EB"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <div>
                  <span style={{fontWeight:500,fontSize:"14px"}}>{it.validated_name}</span>
                  {it.bin_location && (
                    <span style={{fontSize:"11px",background:"#E6F1FB",color:"#185FA5",
                      padding:"1px 6px",borderRadius:"4px",marginLeft:"8px"}}>
                      {it.bin_location}
                    </span>
                  )}
                  {!it.in_stock && (
                    <span style={{fontSize:"11px",background:"#FCEBEB",color:"#A32D2D",
                      padding:"1px 6px",borderRadius:"4px",marginLeft:"8px"}}>Out of stock</span>
                  )}
                </div>
                <button onClick={() => removeItem(idx)}
                  style={{border:"none",background:"none",cursor:"pointer",color:"#ccc",fontSize:"16px"}}>×</button>
              </div>
              <div style={{display:"flex",gap:"12px",flexWrap:"wrap",alignItems:"flex-end"}}>
                {[["Qty","quantity","number"],["Dosage","dosage","text"],
                  ["Frequency","frequency","text"],["Duration","duration","text"]].map(([label,field,type]) => (
                  <div key={field}>
                    <label style={{fontSize:"11px",color:"#888",display:"block",marginBottom:"3px"}}>{label}</label>
                    <input type={type} value={it[field]}
                      onChange={e => updateItem(idx, field, type==="number" ? parseInt(e.target.value)||1 : e.target.value)}
                      style={{padding:"5px 8px",borderRadius:"6px",border:"0.5px solid #ccc",
                        fontSize:"12px",width:field==="quantity"?"60px":"110px"}} />
                  </div>
                ))}
                <div style={{fontSize:"12px",color:"#888",paddingBottom:"6px"}}>
                  MRP: ₹{it.mrp} · GST: {it.gst_rate}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"flex",gap:"12px"}}>
        <button onClick={handleSave} disabled={saving}
          style={{padding:"10px 24px",borderRadius:"8px",border:"none",
            background:"#185FA5",color:"white",fontSize:"13px",cursor:"pointer",fontWeight:500}}>
          {saving ? "Saving..." : "Save Prescription"}
        </button>
        <button onClick={() => { setPatient({patient_name:"",patient_abha_id:"",doctor_name:"",doctor_reg_no:""}); setItems([]); setMsg(null); }}
          style={{padding:"10px 20px",borderRadius:"8px",border:"0.5px solid #ccc",
            background:"white",cursor:"pointer",fontSize:"13px",color:"#666"}}>
          Clear
        </button>
      </div>

    </div>
  );
}