import { ChevronLeft } from "lucide-react";
import { C } from "../../constants/theme";

const Header = ({title, subtitle, onBack, right, dark=true}) => (
  <div style={{background: dark?C.pri:"#fff", padding:"42px 16px 16px", color: dark?"#fff":C.text, borderBottom: dark?"none":`1px solid ${C.borderL}`}}>
    <div style={{display:"flex", alignItems:"center", gap:12}}>
      {onBack && (
        <button onClick={onBack} style={{background:"none", border:"none", padding:0, cursor:"pointer", color:"inherit", display:"flex"}}>
          <ChevronLeft size={26}/>
        </button>
      )}
      <div style={{flex:1}}>
        <p style={{fontSize:18, fontWeight:700, margin:0, letterSpacing:-0.3}}>{title}</p>
        {subtitle && <p style={{fontSize:12, margin:"2px 0 0", opacity:dark?0.8:0.6}}>{subtitle}</p>}
      </div>
      {right}
    </div>
  </div>
);

export default Header;
