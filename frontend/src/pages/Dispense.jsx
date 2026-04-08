import { useState, useEffect } from "react";
import { listPrescriptions, confirmItem } from "../api";

export default function Dispense({ onReadyToBill }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [expanded,      setExpanded]      = useState(null);
  const [confirming,    setConfirming]    = useState(null);
  const [msg,           setMsg]           = useState({});

  const load = async () => {
    const res = await listPrescriptions();
    setPrescriptions(res.data.filter(rx => rx.status !== "billed"));
  };
  useEffect(() => { load(); }, []);

  const handleConfirm = async (rx, item) => {
    if (!item.stock_id) {
      setMsg({[item.id]:"No stock linked to this item. Check bin assignment."});
      return;
    }
    setConfirming(item.id);
    try {
      const res = await confirmItem(rx.id, item.id, item.stock_id);
      setMsg({[item.id]: res.data.all_items_dispensed
        ? "All items confirmed! Ready to bill."
        : `Confirmed. Stock remaining: ${res.data.remaining_stock}`});
      await load();
    } catch(e) {
      setMsg({[item.id]: e.response?.data?.detail || "Error confirming item."});
    }
    setConfirming(null);
  };

  const statusBadge = (status) => {
    const map = {
      pending:       { bg:"#FAEEDA", color:"#633806", label:"Pending" },
      ready_to_bill: { bg:"#EAF3DE", color:"#27500A", label:"Ready to bill" },
      billed:        { bg:"#E6F1FB", color:"#0C447C", label:"Billed" },
    };
    const s = map[status] || { bg:"#F1EFE8", color:"#666", label:status };
    return (
      <span style={{fontSize:"11px",padding:"2px 8px",borderRadius:"4px",
        background:s.bg,color:s.color,fontWeight:500}}>{s.label}</span>
    );
  };

  return (
    <div style={{maxWidth:"860px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <h2 style={{margin:0,fontSize:"18px",fontWeight:500}}>Dispense Queue</h2>
        <button onClick={load}
          style={{padding:"7px 16px",borderRadius:"8px",border:"0.5px solid #ccc",
            background:"white",cursor:"pointer",fontSize:"13px",color:"#555"}}>
          Refresh
        </button>
      </div>

      {prescriptions.length===0 && (
        <div style={{textAlign:"center",padding:"48px",color:"#aaa",
          background:"#F7F8FA",borderRadius:"12px"}}>
          No prescriptions in the queue. Create a new prescription to start.
        </div>
      )}

      {prescriptions.map(rx => {
        const allDone = rx.items.every(it => it.is_dispensed);
        const isOpen  = expanded === rx.id;
        return (
          <div key={rx.id} style={{background:"white",borderRadius:"12px",
            border:"0.5px solid #E5E7EB",marginBottom:"10px",overflow:"hidden"}}>

            <div onClick={() => setExpanded(isOpen ? null : rx.id)}
              style={{padding:"14px 18px",cursor:"pointer",display:"flex",
                justifyContent:"space-between",alignItems:"center",
                background:allDone?"#F6FBF0":"white"}}>
              <div>
                <span style={{fontWeight:500,fontSize:"14px"}}>{rx.patient_name}</span>
                <span style={{fontSize:"12px",color:"#888",marginLeft:"10px"}}>Dr. {rx.doctor_name}</span>
                <span style={{fontSize:"11px",color:"#aaa",marginLeft:"10px"}}>
                  {new Date(rx.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
                </span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                {statusBadge(rx.status)}
                <span style={{fontSize:"12px",color:"#888"}}>
                  {rx.items.filter(i=>i.is_dispensed).length}/{rx.items.length} confirmed
                </span>
                <span style={{color:"#aaa"}}>{isOpen?"▲":"▼"}</span>
              </div>
            </div>

            {isOpen && (
              <div style={{padding:"12px 18px",borderTop:"0.5px solid #F0F0F0"}}>
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  {rx.items.map(item => (
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:"12px",
                      padding:"10px 14px",borderRadius:"8px",
                      background:item.is_dispensed?"#F6FBF0":"#FAFAFA",
                      border:"0.5px solid #E5E7EB"}}>

                      <div style={{width:"24px",height:"24px",borderRadius:"50%",
                        background:item.is_dispensed?"#639922":"#E5E7EB",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"white",fontSize:"12px",flexShrink:0}}>
                        {item.is_dispensed ? "✓" : ""}
                      </div>

                      <div style={{flex:1}}>
                        <div style={{fontWeight:500,fontSize:"13px"}}>{item.validated_name}</div>
                        <div style={{fontSize:"12px",color:"#888"}}>
                          Qty: {item.quantity}
                          {item.dosage && ` · ${item.dosage}`}
                          {item.frequency && ` · ${item.frequency}`}
                        </div>
                        {msg[item.id] && (
                          <div style={{fontSize:"12px",color:"#185FA5",marginTop:"3px"}}>{msg[item.id]}</div>
                        )}
                      </div>

                      {!item.is_dispensed && (
                        <button onClick={() => handleConfirm(rx, item)}
                          style={{padding:"5px 14px",borderRadius:"6px",fontSize:"12px",
                            border:"none",background:"#639922",color:"white",
                            cursor:confirming===item.id?"not-allowed":"pointer"}}>
                          {confirming===item.id ? "..." : "Confirm"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {allDone && (
                  <button onClick={() => onReadyToBill && onReadyToBill(rx)}
                    style={{marginTop:"10px",width:"100%",padding:"10px",borderRadius:"8px",
                      border:"none",background:"#185FA5",color:"white",cursor:"pointer",
                      fontSize:"14px",fontWeight:500}}>
                    Proceed to Bill →
                  </button>
                )}
                {!allDone && (
                  <div style={{marginTop:"10px",fontSize:"12px",color:"#aaa",textAlign:"center"}}>
                    Confirm all items above to unlock billing
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}