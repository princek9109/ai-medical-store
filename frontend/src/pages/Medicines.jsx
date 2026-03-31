import { useState, useEffect } from "react";
import { getMedicines, addMedicine, deleteMedicine } from "../api";

export default function Medicines() {
  const [meds, setMeds] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    canonical_name:"", brand_name:"", salt_composition:"",
    strength:"", dosage_form:"", manufacturer:"",
    hsn_code:"", gst_rate:12, schedule_type:""
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await getMedicines(search);
    setMeds(res.data);
  };

  useEffect(() => { load(); }, [search]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    await addMedicine(form);
    setShowForm(false);
    setForm({ canonical_name:"", brand_name:"", salt_composition:"",
      strength:"", dosage_form:"", manufacturer:"",
      hsn_code:"", gst_rate:12, schedule_type:"" });
    await load();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this medicine?")) return;
    await deleteMedicine(id);
    load();
  };

  return (
    <div style={{maxWidth:"1100px"}}>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <h2 style={{margin:0,fontSize:"18px",fontWeight:500}}>Medicine Master Database</h2>
        <button onClick={() => setShowForm(!showForm)}
          style={{padding:"8px 16px",borderRadius:"8px",border:"0.5px solid #378ADD",
            background:showForm?"#E6F1FB":"white",cursor:"pointer",fontSize:"13px",color:"#185FA5"}}>
          {showForm ? "Cancel" : "+ Add Medicine"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{background:"#F7F8FA",borderRadius:"12px",padding:"20px",marginBottom:"20px",border:"0.5px solid #E5E7EB"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"16px"}}>
            {[
              ["canonical_name","Generic Name *","text",true],
              ["brand_name","Brand Name","text",false],
              ["salt_composition","Salt Composition","text",false],
              ["strength","Strength (e.g. 500mg)","text",false],
              ["dosage_form","Form (tablet/syrup)","text",false],
              ["manufacturer","Manufacturer","text",false],
              ["hsn_code","HSN Code","text",false],
              ["schedule_type","Schedule (H/X/OTC)","text",false],
            ].map(([key,label,type,req]) => (
              <div key={key}>
                <label style={{fontSize:"12px",color:"#555",display:"block",marginBottom:"4px"}}>{label}</label>
                <input type={type} required={req} value={form[key]}
                  onChange={e => setForm({...form,[key]:e.target.value})}
                  style={{width:"100%",padding:"7px 10px",borderRadius:"6px",
                    border:"0.5px solid #ccc",fontSize:"13px",background:"white"}} />
              </div>
            ))}
            <div>
              <label style={{fontSize:"12px",color:"#555",display:"block",marginBottom:"4px"}}>GST Rate (%)</label>
              <select value={form.gst_rate}
                onChange={e => setForm({...form,gst_rate:parseFloat(e.target.value)})}
                style={{width:"100%",padding:"7px 10px",borderRadius:"6px",border:"0.5px solid #ccc",fontSize:"13px",background:"white"}}>
                <option value={0}>0% (Life-saving)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading}
            style={{padding:"9px 24px",borderRadius:"8px",border:"none",
              background:"#185FA5",color:"white",fontSize:"13px",cursor:"pointer",fontWeight:500}}>
            {loading ? "Saving..." : "Save Medicine"}
          </button>
        </form>
      )}

      <input placeholder="Search medicines..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{width:"100%",padding:"9px 14px",borderRadius:"8px",
          border:"0.5px solid #ccc",fontSize:"13px",marginBottom:"16px",background:"white"}} />

      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #E5E7EB",textAlign:"left"}}>
              {["Generic Name","Brand","Strength","Form","HSN","GST","Schedule",""].map(h => (
                <th key={h} style={{padding:"8px 12px",fontWeight:500,color:"#555",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meds.map((m,i) => (
              <tr key={m.id} style={{borderBottom:"0.5px solid #F0F0F0",background:i%2===0?"white":"#FAFAFA"}}>
                <td style={{padding:"10px 12px",fontWeight:500}}>{m.canonical_name}</td>
                <td style={{padding:"10px 12px",color:"#666"}}>{m.brand_name||"-"}</td>
                <td style={{padding:"10px 12px",color:"#666"}}>{m.strength||"-"}</td>
                <td style={{padding:"10px 12px",color:"#666"}}>{m.dosage_form||"-"}</td>
                <td style={{padding:"10px 12px",color:"#666"}}>{m.hsn_code||"-"}</td>
                <td style={{padding:"10px 12px",color:"#666"}}>{m.gst_rate}%</td>
                <td style={{padding:"10px 12px"}}>
                  {m.schedule_type ? (
                    <span style={{background:"#FAEEDA",color:"#BA7517",padding:"2px 8px",borderRadius:"4px",fontSize:"12px"}}>
                      {m.schedule_type}
                    </span>
                  ) : <span style={{color:"#3B6D11",fontSize:"12px"}}>OTC</span>}
                </td>
                <td style={{padding:"10px 12px"}}>
                  <button onClick={() => handleDelete(m.id)}
                    style={{fontSize:"11px",padding:"3px 10px",borderRadius:"6px",
                      border:"0.5px solid #F09595",color:"#A32D2D",
                      background:"white",cursor:"pointer"}}>Remove
                  </button>
                </td>
              </tr>
            ))}
            {meds.length === 0 && (
              <tr><td colSpan={8} style={{padding:"32px",textAlign:"center",color:"#aaa"}}>
                No medicines found. Add your first medicine above.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}