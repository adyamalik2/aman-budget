const Badge = ({children, bg, color}) => (
  <span style={{background:bg, color, fontSize:10, padding:"3px 8px", borderRadius:6, fontWeight:700, letterSpacing:0.3}}>
    {children}
  </span>
);

export default Badge;
