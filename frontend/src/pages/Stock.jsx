import { useState, useEffect } from "react";
import { getStock, addStock, removeStock, getMedicines } from "../api";

export default function Stock() {
  const [stocks, setStocks] = useState([]);
  const [meds, setMeds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ low_stock_only: false, expiring_days: "" });
  const [form, setForm] = useState({
    medicine_id:"", batch_number:"", expiry_date:"",
    quantity:"", mrp:"", purchase_price:"",
    zone:"A", aisle:"01", rack:"R1", shelf:"S1", bin:"B1",
    supplier_id:"", reorder_level:10
  });

  const load = async () => {
    const params = {};
    if (filter.low_stock_only) params.low_stock_only = true;
    if (filter.expiring_days) params.expiring_days = filter.expiring_days;
    const [sRes, mRes] = await Promise.all([getStock(params), getMedicines()]);
    setStocks(sRes.data);
    setMeds(mRes.data);
  };

  useEffect(() => { load(); }, [filter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form,
      quantity: parseInt(form.quantity),
      mrp: parseFloat(form.mrp),
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      reorder_level: parseInt(form.reorder_level)
    };
    await addStock(payload);
    setShowForm(false);
    await load();
    setLoading(false);
  };

  const getMedName = (id) => meds.find(m => m.id === id)?.canonical_name || id;

  const expiryColor = (dateStr) => {
    const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
    if (days <= 7) return "#FCEBEB";
    if (days <= 30) return "#FAEEDA";
    if (days <= 90) return "#EEEDFE";
    return "transparent";
  };

  return (
    <div style={{maxWidth:"1100px"}}>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <h2 style={{margin:0,fontSize:"18px",fontWeight:500}}>Stock Inventory</h2>
        <button onClick={() => setShowForm(!showForm)}
          style={{padding:"8px 16px",borderRadius:"8px",border:"0.5px solid #378ADD",
            background:showForm?"#E6F1FB":"white",cursor:"pointer",fontSize:"13px",color:"#185FA5"}}>
          {showForm ? "Cancel" : "+ Add Stock"}
        </button>
      </div>

      <div style={{display:"flex",gap:"16px",alignItems:"center",marginBottom:"12px",fontSize:"13px",color:"#555"}}>
        <label style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <input type="checkbox" checked={filter.low_stock_only}
            onChange={e => setFilter({...filter,low_stock_only:e.target.checked})} />
          Show low stock only
        </label>
        <select value={filter.expiring_days}
          onChange={e => setFilter({...filter,expiring_days:e.target.value})}
          style={{padding:"5px 8px",borderRadius:"6px",border:"0.5px solid #ccc",fontSize:"13px"}}>
          <option value="">All expiry dates</option>
          <option value="7">Expiring in 7 days</option>
          <option value="30">Expiring in 30 days</option>
          <option value="90">Expiring in 90 days</option>
        </select>
        <span style={{marginLeft:"auto",color:"#888"}}>{stocks.length} items</span>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{background:"#F7F8FA",borderRadius:"12px",padding:"20px",marginBottom:"20px",border:"0.5px solid #E5E7EB"}}>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"16px"}}>

            <div>
              <label style={{fontSize:"12px",color:"#555",display:"block",marginBottom:"4px"}}>Medicine *</label>
              <select required value={form.medicine_id}
                onChange={e => setForm({...form,medicine_id:e.target.value})}
                style={{width:"100%",padding:"7px 10px",borderRadius:"6px",border:"0.5px solid #ccc",fontSize:"13px",background:"white"}}>
                <option value="">Select medicine...</option>
                {meds.map(m => <option key={m.id} value={m.id}>{m.canonical_name}</option>)}
              </select>
            </div>

            {[
              ["batch_number","Batch Number *","text",true],
              ["expiry_date","Expiry Date *","date",true],
              ["quantity","Quantity *","number",true],
              ["mrp","MRP (₹) *","number",true],
              ["purchase_price","Purchase Price (₹)","number",false],
              ["supplier_id","Supplier","text",false],
              ["reorder_level","Reorder Level","number",false],
            ].map(([key,label,type,req]) => (
              <div key={key}>
                <label style={{fontSize:"12px",color:"#555",display:"block",marginBottom:"4px"}}>{label}</label>
                <input type={type} required={req} value={form[key]}
                  onChange={e => setForm({...form,[key]:e.target.value})}
                  style={{width:"100%",padding:"7px 10px",borderRadius:"6px",
                    border:"0.5px solid #ccc",fontSize:"13px",background:"white"}} />
              </div>
            ))}
          </div>

          <div style={{background:"white",borderRadius:"8px",padding:"12px",border:"0.5px solid #E5E7EB"}}>
            <div style={{fontSize:"12px",fontWeight:500,color:"#444",marginBottom:"8px"}}>
              Bin Location (Zone → Aisle → Rack → Shelf → Bin)
            </div>
            <div style={{display:"flex",gap:"8px",alignItems:"flex-end"}}>
              {[["zone","Zone","A"],["aisle","Aisle","01"],["rack","Rack","R1"],
                ["shelf","Shelf","S1"],["bin","Bin","B1"]].map(([key,label,ph]) => (
                <div key={key} style={{flex:1}}>
                  <label style={{fontSize:"11px",color:"#888",display:"block",marginBottom:"3px"}}>{label}</label>
                  <input value={form[key]} placeholder={ph}
                    onChange={e => setForm({...form,[key]:e.target.value})}
                    style={{width:"100%",padding:"6px 8px",borderRadius:"6px",
                      border:"0.5px solid #ccc",fontSize:"12px",textAlign:"center",background:"white"}} />
                </div>
              ))}
              <div style={{flex:1.5,textAlign:"center"}}>
                <div style={{fontSize:"11px",color:"#888",marginBottom:"3px"}}>Preview</div>
                <div style={{padding:"6px 8px",borderRadius:"6px",background:"#E6F1FB",
                  color:"#185FA5",fontSize:"12px",fontWeight:500}}>
                  {[form.zone,form.aisle,form.rack,form.shelf,form.bin].filter(Boolean).join("-")||"---"}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{marginTop:"16px",padding:"9px 24px",borderRadius:"8px",border:"none",
              background:"#185FA5",color:"white",fontSize:"13px",cursor:"pointer",fontWeight:500}}>
            {loading ? "Saving..." : "Add to Stock"}
          </button>
        </form>
      )}

      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #E5E7EB",textAlign:"left"}}>
              {["Medicine","Batch","Expiry","Qty","MRP","Bin Location","Status",""].map(h => (
                <th key={h} style={{padding:"8px 12px",fontWeight:500,color:"#555",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.map((s,i) => {
              const days = Math.ceil((new Date(s.expiry_date)-new Date())/86400000);
              return (
                <tr key={s.id} style={{borderBottom:"0.5px solid #F0F0F0",background:expiryColor(s.expiry_date)}}>
                  <td style={{padding:"10px 12px",fontWeight:500}}>{getMedName(s.medicine_id)}</td>
                  <td style={{padding:"10px 12px",color:"#666"}}>{s.batch_number}</td>
                  <td style={{padding:"10px 12px",color:"#666"}}>{new Date(s.expiry_date).toLocaleDateString("en-IN")}</td>
                  <td style={{padding:"10px 12px"}}>
                    <span style={{fontWeight:500,color:s.quantity<=s.reorder_level?"#A32D2D":"#3B6D11"}}>
                      {s.quantity}
                    </span>
                  </td>
                  <td style={{padding:"10px 12px"}}>₹{s.mrp}</td>
                  <td style={{padding:"10px 12px"}}>
                    <span style={{background:"#E6F1FB",color:"#185FA5",padding:"2px 8px",borderRadius:"4px",fontSize:"12px"}}>
                      {s.bin_location}
                    </span>
                  </td>
                  <td style={{padding:"10px 12px"}}>
                    {days<=7 ? <span style={{color:"#A32D2D",fontWeight:500}}>Expiring soon</span>
                    : days<=30 ? <span style={{color:"#BA7517"}}>Watch</span>
                    : s.quantity<=s.reorder_level ? <span style={{color:"#A32D2D"}}>Low stock</span>
                    : <span style={{color:"#3B6D11"}}>OK</span>}
                  </td>
                  <td style={{padding:"10px 12px"}}>
                    <button onClick={() => { if(window.confirm("Remove this stock?")) removeStock(s.id).then(load); }}
                      style={{fontSize:"11px",padding:"3px 10px",borderRadius:"6px",
                        border:"0.5px solid #F09595",color:"#A32D2D",background:"white",cursor:"pointer"}}>
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
            {stocks.length===0 && (
              <tr><td colSpan={8} style={{padding:"32px",textAlign:"center",color:"#aaa"}}>
                No stock found. Add medicines first, then add stock.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}