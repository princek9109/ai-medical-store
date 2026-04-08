import { useState, useEffect } from "react";
import { createBill, listBills } from "../api";

export default function Billing({ prescription, onBilled }) {
  const [bills,       setBills]       = useState([]);
  const [activeBill,  setActiveBill]  = useState(null);
  const [mode,        setMode]        = useState(prescription ? "new" : "history");
  const [payMode,     setPayMode]     = useState("cash");
  const [discount,    setDiscount]    = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState(null);

  useEffect(() => { listBills().then(r => setBills(r.data)); }, []);

  const round2 = (n) => Math.round(n * 100) / 100;

  const lineItems = (prescription?.items || []).map(it => ({
    stock_id:      it.stock_id,
    medicine_name: it.validated_name,
    quantity:      it.quantity,
    mrp:           it.mrp || 0,
    gst_rate:      it.gst_rate || 12,
    hsn_code:      it.hsn_code || ""
  }));

  const calcPreview = () => {
    let sub = 0, cgst = 0, sgst = 0;
    lineItems.forEach(it => {
      const tax  = round2(it.mrp * it.quantity);
      const half = it.gst_rate / 2;
      sub  += tax;
      cgst += round2(tax * half / 100);
      sgst += round2(tax * half / 100);
    });
    const disc = round2(sub * discount / 100);
    return { sub:round2(sub), cgst:round2(cgst), sgst:round2(sgst),
             disc, total:round2(sub - disc + cgst + sgst) };
  };

  const handleCreateBill = async () => {
    setSaving(true);
    try {
      const res = await createBill({
        prescription_id: prescription.id,
        items: lineItems,
        discount,
        payment_mode: payMode
      });
      setActiveBill(res.data);
      setMode("invoice");
      if (onBilled) onBilled(res.data);
      listBills().then(r => setBills(r.data));
    } catch(e) {
      setMsg(e.response?.data?.detail || "Billing failed.");
    }
    setSaving(false);
  };

  const preview = prescription ? calcPreview() : null;

  const InvoicePrint = ({ bill }) => (
    <div id="invoice-print" style={{fontFamily:"monospace",fontSize:"12px",
      background:"white",padding:"24px",maxWidth:"680px",margin:"0 auto"}}>

      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"16px"}}>
        <div>
          <div style={{fontWeight:700,fontSize:"16px"}}>AI Medical Store</div>
          <div style={{color:"#666"}}>GSTIN: 22AAAAA0000A1Z5</div>
          <div style={{color:"#666"}}>Drug Lic: MH-123456</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontWeight:700,fontSize:"14px"}}>{bill.invoice_number}</div>
          <div>{new Date(bill.created_at).toLocaleDateString("en-IN")}</div>
          <div>{new Date(bill.created_at).toLocaleTimeString("en-IN")}</div>
        </div>
      </div>

      <div style={{display:"flex",gap:"32px",marginBottom:"16px",
        padding:"10px",background:"#F7F8FA",borderRadius:"6px"}}>
        <div>
          <div style={{fontSize:"11px",color:"#888"}}>Patient</div>
          <div style={{fontWeight:500}}>{prescription?.patient_name || "—"}</div>
        </div>
        <div>
          <div style={{fontSize:"11px",color:"#888"}}>Doctor</div>
          <div style={{fontWeight:500}}>{prescription?.doctor_name || "—"}</div>
        </div>
      </div>

      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px",marginBottom:"16px"}}>
        <thead>
          <tr style={{borderBottom:"1px solid #333"}}>
            {["Medicine","HSN","Qty","MRP","Taxable","CGST","SGST","Total"].map(h => (
              <th key={h} style={{padding:"4px 6px",textAlign:"left"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(bill.line_items||[]).map((li,i) => (
            <tr key={i} style={{borderBottom:"0.5px solid #eee"}}>
              <td style={{padding:"4px 6px"}}>{li.medicine_name}</td>
              <td style={{padding:"4px 6px"}}>{li.hsn_code||"—"}</td>
              <td style={{padding:"4px 6px"}}>{li.quantity}</td>
              <td style={{padding:"4px 6px"}}>₹{li.mrp}</td>
              <td style={{padding:"4px 6px"}}>₹{li.taxable_amount}</td>
              <td style={{padding:"4px 6px"}}>₹{li.cgst}</td>
              <td style={{padding:"4px 6px"}}>₹{li.sgst}</td>
              <td style={{padding:"4px 6px"}}>₹{li.line_total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"16px"}}>
        <div style={{minWidth:"200px"}}>
          {[["Subtotal",`₹${bill.subtotal}`],
            ["Discount",`-₹${bill.discount}`],
            ["CGST",`₹${bill.cgst}`],
            ["SGST",`₹${bill.sgst}`]
          ].map(([k,v]) => (
            <div key={k} style={{display:"flex",justifyContent:"space-between",
              padding:"2px 0",fontSize:"12px",color:"#666"}}>
              <span>{k}</span><span>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",
            fontWeight:700,fontSize:"14px",borderTop:"1px solid #333",
            marginTop:"4px",paddingTop:"4px"}}>
            <span>Total</span><span>₹{bill.total}</span>
          </div>
          <div style={{fontSize:"11px",color:"#888",marginTop:"4px"}}>
            Payment: {bill.payment_mode}
          </div>
        </div>
      </div>

      <div style={{borderTop:"0.5px solid #ccc",paddingTop:"12px",
        display:"flex",justifyContent:"space-between",fontSize:"11px",color:"#888"}}>
        <span>Thank you for your purchase.</span>
        <span>Pharmacist signature: ___________</span>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:"900px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <h2 style={{margin:0,fontSize:"18px",fontWeight:500}}>
          {mode==="invoice" ? "Invoice" : mode==="new" ? "Create Bill" : "Bill History"}
        </h2>
        <div style={{display:"flex",gap:"8px"}}>
          {prescription && mode!=="invoice" && (
            <button onClick={() => setMode("new")}
              style={{padding:"7px 14px",borderRadius:"8px",fontSize:"12px",
                border:"0.5px solid #378ADD",background:mode==="new"?"#E6F1FB":"white",
                cursor:"pointer",color:"#185FA5"}}>New Bill
            </button>
          )}
          <button onClick={() => setMode("history")}
            style={{padding:"7px 14px",borderRadius:"8px",fontSize:"12px",
              border:"0.5px solid #ccc",background:mode==="history"?"#F1EFE8":"white",
              cursor:"pointer",color:"#555"}}>History
          </button>
        </div>
      </div>

      {msg && <div style={{padding:"10px 16px",borderRadius:"8px",marginBottom:"16px",
        fontSize:"13px",background:"#FCEBEB",color:"#A32D2D"}}>{msg}</div>}

      {mode==="new" && prescription && preview && (
        <div style={{background:"#F7F8FA",borderRadius:"12px",padding:"20px",border:"0.5px solid #E5E7EB"}}>
          <div style={{marginBottom:"16px"}}>
            <div style={{fontWeight:500,fontSize:"14px",marginBottom:"12px"}}>
              Bill for {prescription.patient_name} — {prescription.items.length} items
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
              <thead>
                <tr style={{borderBottom:"1px solid #E5E7EB",textAlign:"left"}}>
                  {["Medicine","Qty","MRP","Taxable","CGST","SGST","Total"].map(h => (
                    <th key={h} style={{padding:"6px 10px",fontWeight:500,color:"#555"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li,i) => {
                  const tax  = round2(li.mrp * li.quantity);
                  const half = li.gst_rate / 2;
                  const cg   = round2(tax * half / 100);
                  const sg   = round2(tax * half / 100);
                  return (
                    <tr key={i} style={{borderBottom:"0.5px solid #F0F0F0"}}>
                      <td style={{padding:"8px 10px"}}>{li.medicine_name}</td>
                      <td style={{padding:"8px 10px"}}>{li.quantity}</td>
                      <td style={{padding:"8px 10px"}}>₹{li.mrp}</td>
                      <td style={{padding:"8px 10px"}}>₹{tax}</td>
                      <td style={{padding:"8px 10px"}}>₹{cg}</td>
                      <td style={{padding:"8px 10px"}}>₹{sg}</td>
                      <td style={{padding:"8px 10px",fontWeight:500}}>₹{round2(tax+cg+sg)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
            <div style={{display:"flex",gap:"16px",alignItems:"center"}}>
              <div>
                <label style={{fontSize:"12px",color:"#555",display:"block",marginBottom:"4px"}}>Discount %</label>
                <input type="number" value={discount} min={0} max={100}
                  onChange={e => setDiscount(parseFloat(e.target.value)||0)}
                  style={{width:"70px",padding:"5px 8px",borderRadius:"6px",
                    border:"0.5px solid #ccc",fontSize:"13px"}} />
              </div>
              <div>
                <label style={{fontSize:"12px",color:"#555",display:"block",marginBottom:"4px"}}>Payment</label>
                <select value={payMode} onChange={e => setPayMode(e.target.value)}
                  style={{padding:"5px 8px",borderRadius:"6px",border:"0.5px solid #ccc",fontSize:"13px"}}>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"24px",fontWeight:600,color:"#185FA5"}}>₹{preview.total}</div>
              <div style={{fontSize:"12px",color:"#888"}}>CGST ₹{preview.cgst} + SGST ₹{preview.sgst}</div>
            </div>
          </div>

          <button onClick={handleCreateBill} disabled={saving}
            style={{marginTop:"16px",padding:"10px 28px",borderRadius:"8px",border:"none",
              background:"#185FA5",color:"white",fontSize:"13px",cursor:"pointer",fontWeight:500}}>
            {saving ? "Generating invoice..." : "Confirm & Generate Invoice"}
          </button>
        </div>
      )}

      {mode==="invoice" && activeBill && (
        <div>
          <InvoicePrint bill={activeBill} />
          <div style={{display:"flex",gap:"12px",marginTop:"16px"}}>
            <button onClick={() => window.print()}
              style={{padding:"9px 24px",borderRadius:"8px",border:"none",
                background:"#185FA5",color:"white",cursor:"pointer",fontSize:"13px"}}>
              Print Invoice
            </button>
            <button onClick={() => setMode("history")}
              style={{padding:"9px 20px",borderRadius:"8px",border:"0.5px solid #ccc",
                background:"white",cursor:"pointer",fontSize:"13px",color:"#666"}}>
              View All Bills
            </button>
          </div>
        </div>
      )}

      {mode==="history" && (
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {bills.length===0 && <p style={{color:"#aaa",textAlign:"center",padding:"32px"}}>No bills yet.</p>}
          {bills.map(b => (
            <div key={b.id} style={{background:"white",borderRadius:"10px",padding:"14px 18px",
              border:"0.5px solid #E5E7EB",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:500,fontSize:"14px"}}>{b.invoice_number}</div>
                <div style={{fontSize:"12px",color:"#888"}}>
                  {new Date(b.created_at).toLocaleString("en-IN")} · {b.payment_mode}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"20px",fontWeight:600,color:"#185FA5"}}>₹{b.total}</div>
                <div style={{fontSize:"12px",color:"#3B6D11"}}>{b.payment_status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}