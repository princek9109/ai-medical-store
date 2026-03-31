import { useState, useEffect } from "react";
import { getStoreLayout } from "../api";

export default function BinMap() {
  const [layout, setLayout] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => { getStoreLayout().then(r => setLayout(r.data)); }, []);

  const zones = Object.keys(layout);

  return (
    <div style={{maxWidth:"1100px"}}>
      <h2 style={{margin:"0 0 8px",fontSize:"18px",fontWeight:500}}>Store Bin Map</h2>
      <p style={{margin:"0 0 20px",fontSize:"13px",color:"#888"}}>
        Zone → Aisle → Rack → Shelf → Bin hierarchy. Click any bin to see its contents.
      </p>

      {zones.length===0 && (
        <div style={{textAlign:"center",padding:"48px",color:"#aaa",background:"#F7F8FA",borderRadius:"12px"}}>
          No bin locations assigned yet. Add stock with bin codes to see the map here.
        </div>
      )}

      {zones.map(zone => (
        <div key={zone} style={{marginBottom:"24px",background:"#F7F8FA",borderRadius:"12px",padding:"16px",border:"0.5px solid #E5E7EB"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"14px"}}>
            <span style={{fontWeight:600,fontSize:"15px",color:"#185FA5"}}>Zone {zone}</span>
            <span style={{fontSize:"12px",color:"#888",background:"#E6F1FB",padding:"2px 8px",borderRadius:"4px"}}>
              {Object.keys(layout[zone]).length} aisles
            </span>
          </div>

          <div style={{display:"flex",flexWrap:"wrap",gap:"16px"}}>
            {Object.entries(layout[zone]).map(([aisle, racks]) => (
              <div key={aisle} style={{background:"white",borderRadius:"10px",padding:"12px",border:"0.5px solid #E5E7EB",minWidth:"200px"}}>
                <div style={{fontSize:"12px",fontWeight:500,color:"#555",marginBottom:"10px"}}>
                  Aisle {aisle}
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {Object.entries(racks).map(([rack, shelves]) =>
                    Object.entries(shelves).map(([shelf, bins]) =>
                      bins.map(b => (
                        <div key={b.stock_id}
                          onClick={() => setSelected(selected?.stock_id===b.stock_id ? null : b)}
                          style={{padding:"6px 10px",borderRadius:"8px",cursor:"pointer",
                            border:`1px solid ${selected?.stock_id===b.stock_id?"#378ADD":"#e0e0e0"}`,
                            background:selected?.stock_id===b.stock_id?"#E6F1FB":
                              b.quantity<=5?"#FCEBEB":"white",
                            minWidth:"80px",textAlign:"center",transition:"all 0.15s"}}>
                          <div style={{fontSize:"10px",color:"#888",marginBottom:"3px"}}>
                            {zone}-{aisle}-{rack}-{shelf}-{b.bin}
                          </div>
                          <div style={{fontSize:"12px",fontWeight:500,color:"#333",marginBottom:"2px"}}>{b.medicine}</div>
                          <div style={{fontSize:"11px",color:b.quantity<=5?"#A32D2D":"#3B6D11"}}>{b.quantity} units</div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      ))}

      {selected && (
        <div style={{position:"fixed",bottom:"24px",right:"24px",background:"white",
          borderRadius:"12px",padding:"16px 20px",boxShadow:"0 4px 20px rgba(0,0,0,0.12)",
          border:"0.5px solid #E5E7EB",minWidth:"240px",zIndex:100}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px"}}>
            <div>
              <div style={{fontWeight:500,fontSize:"14px",marginBottom:"6px"}}>{selected.medicine}</div>
              <div style={{fontSize:"12px",color:"#666"}}>
                Batch: {selected.batch} · Qty: {selected.quantity}
              </div>
              <div style={{fontSize:"12px",color:"#888",marginTop:"4px"}}>
                Expires: {new Date(selected.expiry_date).toLocaleDateString("en-IN")}
              </div>
              <div style={{fontSize:"12px",color:"#185FA5",marginTop:"4px"}}>
                📍 {selected.bin_location}
              </div>
            </div>
            <button onClick={() => setSelected(null)}
              style={{border:"none",background:"none",cursor:"pointer",color:"#aaa",fontSize:"18px",lineHeight:1}}>×
            </button>
          </div>
        </div>
      )}

    </div>
  );
}