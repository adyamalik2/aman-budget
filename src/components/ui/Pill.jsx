import { C } from "../../constants/theme";

const Pill = ({active, onClick, children, color=C.pri}) => (
  <button onClick={onClick} style={{
    padding:"7px 14px", borderRadius:20, cursor:"pointer",
    fontSize:12, fontWeight:600, whiteSpace:"nowrap",
    background: active ? color : "#fff", color: active ? "#fff" : C.textM,
    border: `1px solid ${active ? color : C.border}`
  }}>{children}</button>
);

export default Pill;
