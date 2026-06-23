import { useState } from "react";
import { Check, FolderTree, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";
import Header from "../components/layout/Header";
import Badge from "../components/ui/Badge";
import Pill from "../components/ui/Pill";
import { C } from "../constants/theme";

const card = {background:"#fff", borderRadius:16, padding:"14px 16px", border:`1px solid ${C.borderL}`, boxShadow:"0 1px 4px rgba(0,0,0,0.03)"};
const inp = {width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"11px 14px", fontSize:14, outline:"none", boxSizing:"border-box", background:"#fff", color:C.text};
const lbl = {fontSize:12, fontWeight:600, color:C.textM, display:"block", marginBottom:6};
const groupColors = ["#16a34a","#2563eb","#d97706","#dc2626","#7c3aed","#0891b2","#ec4899","#f97316"];
const normalizeName = value => (value || "").trim().toLowerCase();

const slugify = value => {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return slug || `grup_${Date.now()}`;
};

const CategoryGroupsScreen = ({categoryGroups = [], txs = [], onCategoryGroupsChange, setSubPage}) => {
  const [groupSheet, setGroupSheet] = useState(null);
  const [categorySheet, setCategorySheet] = useState(null);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const sortedGroups = [...categoryGroups].sort((a,b)=>{
    if((a.active === false) !== (b.active === false)) return a.active === false ? 1 : -1;
    return (a.label || "").localeCompare(b.label || "");
  });
  const query = search.trim().toLowerCase();
  const matchesGroup = group => {
    if(statusFilter === "active" && group.active === false) return false;
    if(statusFilter === "inactive" && group.active !== false) return false;
    if(!query) return true;
    if((group.label || "").toLowerCase().includes(query)) return true;
    return (group.categories || []).some(category => (category.name || "").toLowerCase().includes(query));
  };
  const filteredGroups = sortedGroups.filter(matchesGroup);
  const hasFilter = statusFilter !== "all" || query !== "";
  const isGroupUsed = group => txs.some(tx=>tx.grp === group.id);
  const isCategoryUsed = (group, category) => txs.some(tx=>tx.grp === group.id && normalizeName(tx.cat) === normalizeName(category.name));

  const updateGroup = (groupId, updater) => {
    onCategoryGroupsChange(categoryGroups.map(group => group.id === groupId ? updater(group) : group));
  };

  const closeGroupSheet = () => {
    setGroupSheet(null);
    setErr("");
  };

  const closeCategorySheet = () => {
    setCategorySheet(null);
    setErr("");
  };

  const openAddGroup = () => {
    setErr("");
    setGroupSheet({id:null, label:"", active:true});
  };

  const openEditGroup = group => {
    setErr("");
    setGroupSheet({id:group.id, label:group.label || "", active:group.active !== false});
  };

  const saveGroup = () => {
    const label = groupSheet.label.trim();
    if(!label) {
      setErr("Nama grup wajib diisi.");
      return;
    }
    if(categoryGroups.some(group => group.id !== groupSheet.id && normalizeName(group.label) === normalizeName(label))) {
      setErr("Nama grup sudah ada.");
      return;
    }
    if(groupSheet.id) {
      onCategoryGroupsChange(categoryGroups.map(group => group.id === groupSheet.id ? {...group, label, active:groupSheet.active !== false} : group));
    } else {
      const idBase = slugify(label);
      const used = new Set(categoryGroups.map(group => group.id));
      const id = used.has(idBase) ? `${idBase}_${Date.now()}` : idBase;
      onCategoryGroupsChange([
        ...categoryGroups,
        {id, label, color:groupColors[categoryGroups.length % groupColors.length], active:groupSheet.active !== false, categories:[]},
      ]);
    }
    closeGroupSheet();
  };

  const removeGroup = group => {
    if(isGroupUsed(group)) {
      updateGroup(group.id, item => ({...item, active:false}));
      alert(`Grup ${group.label} pernah dipakai transaksi. Grup dinonaktifkan, transaksi lama tetap aman.`);
      return;
    }
    if(window.confirm(`Hapus grup ${group.label}? Transaksi lama tetap menyimpan key grup lama.`)) {
      onCategoryGroupsChange(categoryGroups.filter(item => item.id !== group.id));
    }
  };

  const toggleGroup = group => {
    updateGroup(group.id, item => ({...item, active:item.active === false}));
  };

  const openAddCategory = group => {
    setErr("");
    setCategorySheet({groupId:group.id, id:null, name:"", active:true});
  };

  const openEditCategory = (group, category) => {
    setErr("");
    setCategorySheet({groupId:group.id, id:category.id, name:category.name || "", active:category.active !== false});
  };

  const saveCategory = () => {
    const name = categorySheet.name.trim();
    if(!name) {
      setErr("Nama kategori wajib diisi.");
      return;
    }
    const group = categoryGroups.find(item => item.id === categorySheet.groupId);
    const categories = Array.isArray(group?.categories) ? group.categories : [];
    if(categories.some(category => category.id !== categorySheet.id && normalizeName(category.name) === normalizeName(name))) {
      setErr("Nama kategori sudah ada di grup ini.");
      return;
    }
    updateGroup(categorySheet.groupId, group => {
      const categories = Array.isArray(group.categories) ? group.categories : [];
      if(categorySheet.id) {
        return {
          ...group,
          categories: categories.map(category => category.id === categorySheet.id ? {...category, name, active:categorySheet.active !== false} : category),
        };
      }
      return {
        ...group,
        categories: [...categories, {id:`cat-${Date.now()}`, name, active:categorySheet.active !== false}],
      };
    });
    closeCategorySheet();
  };

  const removeCategory = (group, category) => {
    if(isCategoryUsed(group, category)) {
      updateGroup(group.id, item => ({
        ...item,
        categories: (item.categories || []).map(cat => cat.id === category.id ? {...cat, active:false} : cat),
      }));
      alert(`Kategori ${category.name} pernah dipakai transaksi. Kategori dinonaktifkan, transaksi lama tetap aman.`);
      return;
    }
    if(window.confirm(`Hapus kategori ${category.name}? Transaksi lama tetap menyimpan teks kategori lama.`)) {
      updateGroup(group.id, item => ({
        ...item,
        categories: (item.categories || []).filter(cat => cat.id !== category.id),
      }));
    }
  };

  const toggleCategory = (group, category) => {
    updateGroup(group.id, item => ({
      ...item,
      categories: (item.categories || []).map(cat => cat.id === category.id ? {...cat, active:cat.active === false} : cat),
    }));
  };

  const selectedGroup = categoryGroups.find(group => group.id === categorySheet?.groupId);

  return (
    <div style={{flex:1, overflowY:"auto", paddingBottom:92, background:C.bg}}>
      <Header
        title="Kategori & Grup"
        subtitle={`${categoryGroups.length} grup budget`}
        onBack={()=>setSubPage(null)}
        right={(
          <button type="button" onClick={openAddGroup} aria-label="Tambah grup" style={{width:36, height:36, borderRadius:12, border:"none", background:"rgba(255,255,255,0.18)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}>
            <Plus size={19}/>
          </button>
        )}
      />

      <div style={{padding:"14px", display:"flex", flexDirection:"column", gap:12}}>
        <div style={{...card, background:C.priBg}}>
          <p style={{fontSize:11, color:C.priD, margin:0, lineHeight:1.45}}>Data nonaktif tidak muncul di pilihan transaksi baru, tetapi transaksi lama tetap aman.</p>
        </div>

        {/* Filter */}
        {categoryGroups.length > 0 && (
          <div style={{...card, display:"flex", flexDirection:"column", gap:10}}>
            <div style={{position:"relative"}}>
              <Search size={15} style={{position:"absolute", left:12, top:12, color:C.textL}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari grup atau kategori..."
                style={{...inp, padding:"11px 14px 11px 36px"}}/>
            </div>
            <div style={{display:"flex", gap:6, overflowX:"auto", paddingBottom:2}}>
              <Pill active={statusFilter==="all"} onClick={()=>setStatusFilter("all")}>Semua</Pill>
              <Pill active={statusFilter==="active"} onClick={()=>setStatusFilter("active")}>Aktif</Pill>
              <Pill active={statusFilter==="inactive"} onClick={()=>setStatusFilter("inactive")}>Nonaktif</Pill>
              {hasFilter && (
                <button type="button" onClick={()=>{setSearch(""); setStatusFilter("all");}}
                  style={{marginLeft:"auto", background:"none", border:"none", color:C.red, fontSize:11, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:3, whiteSpace:"nowrap"}}>
                  <X size={12}/> Reset
                </button>
              )}
            </div>
          </div>
        )}

        {categoryGroups.length === 0 && (
          <div style={{...card, textAlign:"center", padding:"28px 16px"}}>
            <div style={{width:46, height:46, borderRadius:14, background:C.priL, color:C.pri, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px"}}>
              <FolderTree size={22}/>
            </div>
            <p style={{fontSize:14, fontWeight:800, color:C.text, margin:"0 0 4px"}}>Belum ada grup</p>
            <p style={{fontSize:11, color:C.textM, margin:0}}>Tambahkan grup dan kategori untuk transaksi berikutnya.</p>
          </div>
        )}

        {categoryGroups.length > 0 && filteredGroups.length === 0 && (
          <div style={{...card, textAlign:"center", padding:"24px 16px"}}>
            <p style={{fontSize:13, fontWeight:700, color:C.text, margin:"0 0 4px"}}>Tidak ada grup yang cocok</p>
            <p style={{fontSize:11, color:C.textM, margin:0}}>Ubah kata kunci atau filter status.</p>
          </div>
        )}

        {filteredGroups.map(group => {
          const categories = (Array.isArray(group.categories) ? [...group.categories] : []).sort((a,b)=>{
            if((a.active === false) !== (b.active === false)) return a.active === false ? 1 : -1;
            return (a.name || "").localeCompare(b.name || "");
          });
          const groupUsed = isGroupUsed(group);
          return (
            <div key={group.id} style={card}>
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <div style={{width:42, height:42, borderRadius:13, background:(group.color || C.pri)+"18", color:group.color || C.pri, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                  <FolderTree size={20}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{fontSize:14, fontWeight:800, color:C.text, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{group.label}</p>
                  <p style={{fontSize:11, color:C.textM, margin:"2px 0 0"}}>{categories.length} kategori</p>
                </div>
                <Badge bg={group.active === false ? C.borderL : C.priL} color={group.active === false ? C.textM : C.priD}>
                  {group.active === false ? "NONAKTIF" : "AKTIF"}
                </Badge>
              </div>

              <div style={{display:"flex", gap:6, flexWrap:"wrap", marginTop:12}}>
                {categories.length === 0 && <span style={{fontSize:11, color:C.textL}}>Belum ada kategori.</span>}
                {categories.map(category => {
                  const categoryUsed = isCategoryUsed(group, category);
                  return (
                  <div key={category.id} style={{display:"flex", alignItems:"center", gap:5, border:`1px solid ${category.active === false ? C.borderL : C.border}`, borderRadius:999, padding:"5px 7px", background:category.active === false ? C.borderL : "#fff"}}>
                    <Tag size={11} color={category.active === false ? C.textL : group.color || C.pri}/>
                    <span style={{fontSize:11, fontWeight:700, color:category.active === false ? C.textL : C.text}}>{category.name}</span>
                    <button type="button" onClick={()=>openEditCategory(group, category)} aria-label={`Edit ${category.name}`} style={{border:"none", background:"transparent", padding:0, color:C.textM, display:"flex", cursor:"pointer"}}>
                      <Pencil size={11}/>
                    </button>
                    <button type="button" onClick={()=>toggleCategory(group, category)} style={{border:"none", background:"transparent", padding:0, color:category.active === false ? C.pri : C.gold, fontSize:10, fontWeight:800, cursor:"pointer"}}>
                      {category.active === false ? "ON" : "OFF"}
                    </button>
                    <button type="button" onClick={()=>removeCategory(group, category)} aria-label={categoryUsed ? `Nonaktifkan ${category.name}` : `Hapus ${category.name}`} style={{border:"none", background:"transparent", padding:0, color:C.red, display:"flex", cursor:"pointer"}}>
                      <X size={12}/>
                    </button>
                  </div>
                  );
                })}
              </div>

              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12}}>
                <button type="button" onClick={()=>openAddCategory(group)} style={{border:`1px solid ${C.pri}`, borderRadius:10, background:"#fff", color:C.pri, padding:"9px", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:5, cursor:"pointer"}}>
                  <Plus size={13}/> Kategori
                </button>
                <button type="button" onClick={()=>openEditGroup(group)} style={{border:`1px solid ${C.border}`, borderRadius:10, background:"#fff", color:C.textM, padding:"9px", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:5, cursor:"pointer"}}>
                  <Pencil size={13}/> Edit Grup
                </button>
                <button type="button" onClick={()=>toggleGroup(group)} style={{border:`1px solid ${group.active === false ? C.pri : C.gold}`, borderRadius:10, background:"#fff", color:group.active === false ? C.pri : C.gold, padding:"9px", fontSize:11, fontWeight:800, cursor:"pointer"}}>
                  {group.active === false ? "Aktifkan" : "Nonaktifkan"}
                </button>
                <button type="button" onClick={()=>removeGroup(group)} style={{border:`1px solid ${C.redL}`, borderRadius:10, background:"#fff", color:C.red, padding:"9px", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:5, cursor:"pointer"}}>
                  <Trash2 size={13}/> {groupUsed ? "Nonaktifkan" : "Hapus"}
                </button>
              </div>
            </div>
          );
        })}

        <button type="button" onClick={openAddGroup} style={{background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"14px", fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 6px 18px rgba(22,163,74,0.22)"}}>
          <Plus size={17}/> Tambah Grup
        </button>
      </div>

      {groupSheet && (
        <div style={{position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
          <div style={{width:"100%", maxWidth:430, background:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:"88vh", overflowY:"auto", animation:"slideUp 0.3s"}}>
            <div style={{padding:"16px", borderBottom:`1px solid ${C.borderL}`, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <p style={{fontSize:16, fontWeight:800, color:C.text, margin:0}}>{groupSheet.id ? "Edit Grup" : "Tambah Grup"}</p>
              <button type="button" onClick={closeGroupSheet} aria-label="Tutup form grup" style={{background:C.borderL, border:"none", borderRadius:10, padding:8, cursor:"pointer", display:"flex"}}>
                <X size={16} color={C.textM}/>
              </button>
            </div>
            <div style={{padding:"14px 14px calc(32px + env(safe-area-inset-bottom))", display:"flex", flexDirection:"column", gap:14}}>
              <div>
                <label style={lbl}>Nama Grup</label>
                <input style={{...inp, borderColor:err?C.red:C.border}} value={groupSheet.label} onChange={e=>{setGroupSheet(p=>({...p, label:e.target.value})); setErr("");}} placeholder="Rumah, Bunda, Ayah"/>
                {err && <p style={{fontSize:11, color:C.red, margin:"4px 0 0"}}>{err}</p>}
              </div>
              <label style={{display:"flex", alignItems:"center", gap:10, padding:"12px 14px", border:`1px solid ${C.border}`, borderRadius:12, color:C.text, fontSize:13, fontWeight:700}}>
                <input type="checkbox" checked={groupSheet.active !== false} onChange={e=>setGroupSheet(p=>({...p, active:e.target.checked}))}/>
                Grup aktif
              </label>
              <button type="button" onClick={saveGroup} style={{background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"15px", fontSize:15, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
                <Check size={18}/> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {categorySheet && (
        <div style={{position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center"}}>
          <div style={{width:"100%", maxWidth:430, background:"#fff", borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:"88vh", overflowY:"auto", animation:"slideUp 0.3s"}}>
            <div style={{padding:"16px", borderBottom:`1px solid ${C.borderL}`, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div>
                <p style={{fontSize:16, fontWeight:800, color:C.text, margin:0}}>{categorySheet.id ? "Edit Kategori" : "Tambah Kategori"}</p>
                {selectedGroup && <p style={{fontSize:11, color:C.textM, margin:"2px 0 0"}}>{selectedGroup.label}</p>}
              </div>
              <button type="button" onClick={closeCategorySheet} aria-label="Tutup form kategori" style={{background:C.borderL, border:"none", borderRadius:10, padding:8, cursor:"pointer", display:"flex"}}>
                <X size={16} color={C.textM}/>
              </button>
            </div>
            <div style={{padding:"14px 14px calc(32px + env(safe-area-inset-bottom))", display:"flex", flexDirection:"column", gap:14}}>
              <div>
                <label style={lbl}>Nama Kategori</label>
                <input style={{...inp, borderColor:err?C.red:C.border}} value={categorySheet.name} onChange={e=>{setCategorySheet(p=>({...p, name:e.target.value})); setErr("");}} placeholder="Belanja Bulanan, Zakat, Transportasi"/>
                {err && <p style={{fontSize:11, color:C.red, margin:"4px 0 0"}}>{err}</p>}
              </div>
              <label style={{display:"flex", alignItems:"center", gap:10, padding:"12px 14px", border:`1px solid ${C.border}`, borderRadius:12, color:C.text, fontSize:13, fontWeight:700}}>
                <input type="checkbox" checked={categorySheet.active !== false} onChange={e=>setCategorySheet(p=>({...p, active:e.target.checked}))}/>
                Kategori aktif
              </label>
              <button type="button" onClick={saveCategory} style={{background:C.pri, color:"#fff", border:"none", borderRadius:14, padding:"15px", fontSize:15, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
                <Check size={18}/> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryGroupsScreen;
