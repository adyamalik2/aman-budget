import { BarChart3, Home, LayoutGrid, Plus, Target } from "lucide-react";
import { C } from "../../constants/theme";

const BottomNav = ({tab, setTab, setAddOpen, setEditTx}) => {
  const items = [
    {id:"home", icon:Home, label:"Beranda"},
    {id:"reports", icon:BarChart3, label:"Laporan"},
    {id:"fab", icon:Plus, label:"", fab:true},
    {id:"goals-tab", icon:Target, label:"Goals"},
    {id:"more", icon:LayoutGrid, label:"Lainnya"},
  ];
  return (
    <div style={{position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#fff", borderTop:`1px solid ${C.borderL}`, display:"flex", alignItems:"center", padding:"6px 4px 10px", zIndex:50, boxSizing:"border-box", boxShadow:"0 -4px 20px rgba(0,0,0,0.04)"}}>
      {items.map(n=>(
        n.fab ? (
          <button key={n.id} onClick={()=>{setEditTx(null); setAddOpen(true);}} style={{flex:1, display:"flex", justifyContent:"center", background:"none", border:"none", padding:0, cursor:"pointer"}}>
            <div style={{width:52, height:52, background:`linear-gradient(135deg, ${C.pri}, ${C.priD})`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", marginTop:-22, boxShadow:`0 8px 20px rgba(22,163,74,0.4)`}}>
              <Plus size={26} color="#fff" strokeWidth={2.5}/>
            </div>
          </button>
        ) : (
          <button key={n.id} onClick={()=>setTab(n.id)} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"6px 0", background:"none", border:"none", cursor:"pointer", color: tab===n.id ? C.pri : C.textL, gap:3}}>
            <n.icon size={20} strokeWidth={tab===n.id ? 2.5 : 2}/>
            <span style={{fontSize:10, fontWeight:tab===n.id?700:500}}>{n.label}</span>
          </button>
        )
      ))}
    </div>
  );
};

export default BottomNav;
