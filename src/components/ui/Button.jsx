import { C } from "../../constants/theme";

const Btn = ({onClick, children, primary, style={}, disabled}) => (
  <button onClick={onClick} disabled={disabled} style={{
    width:"100%", padding:"13px", borderRadius:12, border:"none", cursor:disabled?"not-allowed":"pointer",
    fontSize:14, fontWeight:700, opacity:disabled?0.5:1,
    background: primary ? C.pri : "#fff", color: primary ? "#fff" : C.pri,
    boxShadow: primary ? "0 4px 14px rgba(22,163,74,0.25)" : `inset 0 0 0 1.5px ${C.pri}`,
    ...style
  }}>{children}</button>
);

export default Btn;
