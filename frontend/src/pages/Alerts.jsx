import { useState, useEffect } from "react";
import { getExpiryAlerts, getLowStockAlerts } from "../api";

const severityStyle = { CRITICAL:"#FCEBEB", WARNING:"#FAEEDA", NOTICE:"#EEEDFE" };
const severityText  = { CRITICAL:"#A32D2D", WARNING:"#633806", NOTICE:"#26215C" };

export default function Alerts() {
  const [expiry, setExpiry] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [tab, setTab] = useState("expiry");

  useEffect(() => {
    getExpiryAlerts().then(r => setExpiry(r.data));
    getLowStockAlerts().then(r => setLowStock(r.data));
  }, []);

  return (
    <div style={{maxWidth:"900px"}}>
      <h2 style={{margin:"0 0 16px",fontSize:"18px",fontWeight:500}}>Alerts & Notifications</h2>

      <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
        {[["expiry",`Expiry Alerts (${expiry.length})`],["lowstock",`Low Stock (${lowStock.length})`]].map(([key,label])=>(
          <button key={key} onClick={() => setTab(key)}
            style={{padding:"7px 16px",borderRadius:"8px",cursor:"pointer",fontSize:"13px",
              border:`0.5px solid ${tab===key?"#378ADD":"#ccc"}`,
              background:tab===key?"#E6F1FB":"white",
              color:tab===key?"#185FA5":"#555"}}>
            {label}
          </button>
        ))}
      </div>

      {tab==="expiry" && (
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {expiry.length===0 && (
            <p style={{color:"#888",textAlign:"center",padding:"32px"}}>
              No expiry alerts. All stock is healthy.
            </p>
          )}
          {expiry.map(a => (
            <div key={a.id} style={{background:severityStyle[a.severity]||"#F7F8FA",
              borderRadius:"10px",padding:"14px 18px",
              border:`0.5px solid ${severityText[a.severity]||"#ccc"}`,
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>

              <div>
                <div style={{fontWeight:500,fontSize:"14px",marginBottom:"4px"}}>{a.medicine_name}</div>
                <div style={{fontSize:"12px",color:"#666"}}>
                  Batch: {a.batch} · Qty: {a.quantity} · Bin: {a.bin_location}
                </div>
              </div>

              <div style={{textAlign:"right",display:"flex",flexDirection:"column",gap:"4px",alignItems:"flex-end"}}>
                <div style={{fontSize:"20px",fontWeight:600,color:severityText[a.severity]}}>
                  {a.days_remaining} days left
                </div>
                <div style={{fontSize:"12px",color:"#888"}}>
                  Expires: {new Date(a.expiry_date).toLocaleDateString("en-IN")}
                </div>
                <span style={{fontSize:"11px",padding:"2px 8px",borderRadius:"4px",
                  background:severityText[a.severity],color:"white",fontWeight:500}}>
                  {a.severity}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

      {tab==="lowstock" && (
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {lowStock.length===0 && (
            <p style={{color:"#888",textAlign:"center",padding:"32px"}}>
              No low stock alerts. All medicines are well-stocked.
            </p>
          )}
          {lowStock.map(a => (
            <div key={a.id} style={{background:"#FCEBEB",borderRadius:"10px",
              padding:"14px 18px",border:"0.5px solid #F09595",
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>

              <div>
                <div style={{fontWeight:500,fontSize:"14px",marginBottom:"4px"}}>{a.medicine_name}</div>
                <div style={{fontSize:"12px",color:"#666"}}>
                  Bin: {a.bin_location} · Reorder at: {a.reorder_level} units
                </div>
              </div>

              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"28px",fontWeight:600,color:"#A32D2D"}}>{a.current_quantity}</div>
                <div style={{fontSize:"12px",color:"#888"}}>units remaining</div>
                <div style={{fontSize:"12px",color:"#A32D2D",marginTop:"2px"}}>
                  Need {a.shortage} more to reorder level
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}