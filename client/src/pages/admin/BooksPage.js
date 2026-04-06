import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import toast from 'react-hot-toast';
import { getBooksAPI, createBookAPI, updateBookAPI, deleteBookAPI } from '../../api';

const CATEGORIES = ['Science', 'Technology', 'History', 'Literature', 'Philosophy', 'Biography'];
const CAT_ICONS = { Science:'⚗️', Technology:'💻', History:'📜', Literature:'✍️', Philosophy:'🧠', Biography:'🌍' };

const defaultForm = {
  title:'', author:'', isbn:'', category:'Science',
  price:0, totalCopies:1, availableCopies:1, publisher:'', publishedYear:'',
  description:'', coverImage:'', extraImages:[], language:'English', pages:''
};

// ── Validation helpers ──
const isValidISBN = (v) => v.replace(/[-\s]/g,'').length >= 10;
const isPositiveNum = (v) => !isNaN(v) && Number(v) >= 0;

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [imgPreview, setImgPreview] = useState('');
  const [imgTab, setImgTab] = useState('url');
  const [urlInput, setUrlInput] = useState('');
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();
  const extraFileRef = useRef();

  useEffect(() => { load(); }, [search, category]);

  const load = async () => {
    try { setLoading(true); const r = await getBooksAPI({ search, category }); setBooks(r.data.data); }
    catch { toast.error('Failed to load books'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null); setForm(defaultForm);
    setImgPreview(''); setUrlInput(''); setImgTab('url'); setErrors({});
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      title:b.title, author:b.author, isbn:b.isbn,
      category:b.category, price:b.price||0, totalCopies:b.totalCopies,
      availableCopies: b.availableCopies !== undefined ? b.availableCopies : b.totalCopies,
      publisher:b.publisher||'', publishedYear:b.publishedYear||'',
      description:b.description||'', coverImage:b.coverImage||'',
      extraImages:b.extraImages||[], language:b.language||'English', pages:b.pages||''
    });
    const isBase64 = b.coverImage?.startsWith('data:');
    setImgPreview(b.coverImage||'');
    setUrlInput(isBase64?'':(b.coverImage||''));
    setImgTab(isBase64?'upload':'url');
    setErrors({});
    setShowModal(true);
  };

  const close = () => {
    setShowModal(false); setEditing(null);
    setForm(defaultForm); setImgPreview(''); setUrlInput(''); setErrors({});
  };

  const hc = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(p => ({...p, [e.target.name]: ''}));
  };

  // Validate form
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.author.trim()) e.author = 'Author is required';
    if (!form.isbn.trim()) e.isbn = 'ISBN is required';
    else if (!isValidISBN(form.isbn)) e.isbn = 'Invalid ISBN (min 10 digits)';
    if (!isPositiveNum(form.price)) e.price = 'Price must be a number';
    if (!form.totalCopies || form.totalCopies < 1) e.totalCopies = 'Min 1 copy required';
    if (form.availableCopies < 0) e.availableCopies = 'Cannot be negative';
    if (form.availableCopies > form.totalCopies) e.availableCopies = 'Cannot exceed total copies';
    if (form.publishedYear && (form.publishedYear < 1000 || form.publishedYear > new Date().getFullYear())) {
      e.publishedYear = `Year must be between 1000 and ${new Date().getFullYear()}`;
    }
    if (form.pages && form.pages < 1) e.pages = 'Pages must be positive';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Main image processing
  const processImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 600;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = h*MAX/w; w = MAX; } }
      else { if (h > MAX) { w = w*MAX/h; h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', 0.75);
      setImgPreview(compressed);
      setForm(p => ({ ...p, coverImage: compressed }));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Extra images processing
  const processExtraImage = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if ((form.extraImages||[]).length >= 5) { toast.error('Max 5 extra images'); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 400;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = h*MAX/w; w = MAX; } }
      else { if (h > MAX) { w = w*MAX/h; h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', 0.65);
      setForm(p => ({ ...p, extraImages: [...(p.extraImages||[]), compressed] }));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const removeExtraImage = (idx) => {
    setForm(p => ({ ...p, extraImages: p.extraImages.filter((_,i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the errors'); return; }
    try {
      setSaving(true);
      if (editing) { await updateBookAPI(editing._id, form); toast.success('Book updated!'); }
      else { await createBookAPI(form); toast.success('Book added!'); }
      close(); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving book');
    } finally { setSaving(false); }
  };

  const handleDelete = async (b) => {
    // Removed window.confirm
    try { await deleteBookAPI(b._id); toast.success('Deleted!'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
  };

  const inputStyle = (field) => ({
    width:'100%', background:'var(--bg-card2)',
    border:`1px solid ${errors[field]?'var(--red)':'var(--border-color2)'}`,
    color:'var(--text-primary)', padding:'11px 13px',
    borderRadius:6, fontSize:13, fontFamily:'Jost,sans-serif',
    outline:'none', boxSizing:'border-box'
  });

  const labelStyle = { fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-secondary)', display:'block', marginBottom:6 };
  const errorStyle = { fontSize:11, color:'var(--red)', marginTop:4 };

  return (
    <div className="page-enter">
      <div className="ap-header">
        <h1 className="ap-title">📚 Books</h1>
        <button className="ap-btn ap-btn--gold" onClick={openAdd}>+ Add Book</button>
      </div>

      <div className="ap-table-box">
        <div className="ap-table-top">
          <input className="ap-search" placeholder="Search title, author, ISBN..." value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="ap-search" style={{width:160}} value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
          <span className="ap-count">{books.length} books</span>
        </div>

        {loading ? <div className="ap-loading"><div className="spinner"/></div>
        : books.length === 0 ? <div className="ap-empty"><div className="ap-empty-icon">📚</div><p>No books found</p></div>
        : (
          <table className="ap-table">
            <thead><tr><th>Cover</th><th>Title & Author</th><th>ISBN</th><th>Category</th><th>Price</th><th>Copies</th><th>Avail</th><th>Actions</th></tr></thead>
            <tbody>
              {books.map(b => (
                <tr key={b._id}>
                  <td>
                    <div style={{width:36,height:48,borderRadius:4,overflow:'hidden',background:'linear-gradient(135deg,#1a1a3a,#2a2a6a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                      {b.coverImage ? <img src={b.coverImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>{e.target.style.display='none'}}/> : <span>{CAT_ICONS[b.category]||'📖'}</span>}
                    </div>
                  </td>
                  <td><strong>{b.title}</strong><br/><span style={{fontSize:11,color:'var(--text-muted)'}}>by {b.author}</span></td>
                  <td style={{fontFamily:'monospace',fontSize:11}}>{b.isbn}</td>
                  <td><span className="ap-badge ap-badge--blue">{CAT_ICONS[b.category]} {b.category}</span></td>
                  <td><strong style={{color:'var(--gold)'}}>₹{b.price||0}</strong></td>
                  <td>{b.totalCopies}</td>
                  <td><span className={`ap-badge ${b.availableCopies>0?'ap-badge--green':'ap-badge--red'}`}>{b.availableCopies}</span></td>
                  <td>
                    <div className="ap-actions">
                      <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={()=>openEdit(b)}>✏️ Edit</button>
                      <button className="ap-btn ap-btn--danger ap-btn--sm" onClick={()=>handleDelete(b)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL — Portal render to body ── */}
      {showModal && ReactDOM.createPortal((
        <div
          style={{
            position:'fixed', top:0, left:0, right:0, bottom:0,
            background:'rgba(0,0,0,0.85)',
            zIndex:9999,
            overflowY:'scroll',
            WebkitOverflowScrolling:'touch',
            backdropFilter:'blur(4px)',
          }}
          onClick={close}
        >
          <div
            onClick={e=>e.stopPropagation()}
            style={{
              background:'var(--bg-card)',
              border:'1px solid var(--border-color)',
              borderRadius:12,
              padding:'28px 28px 32px',
              width:'calc(100% - 32px)',
              maxWidth:600,
              margin:'32px auto 64px',
              position:'relative',
            }}
          >
            {/* Close */}
            <button onClick={close} style={{position:'absolute',top:14,right:14,width:30,height:30,borderRadius:'50%',background:'var(--bg-card2)',border:'1px solid var(--border-color2)',color:'var(--text-secondary)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>

            <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:26,fontWeight:300,color:'var(--text-primary)',marginBottom:24,paddingBottom:16,borderBottom:'1px solid var(--border-color2)'}}>
              {editing ? 'Edit Book' : 'Add New Book'}
            </h2>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{display:'flex',flexDirection:'column',gap:18}}>

                {/* ── COVER IMAGE ── */}
                <div>
                  <label style={labelStyle}>📸 Main Cover Image</label>
                  <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',gap:6,marginBottom:10}}>
                        {['url','upload'].map(tab=>(
                          <button key={tab} type="button" onClick={()=>setImgTab(tab)} style={{padding:'5px 14px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:imgTab===tab?'var(--gold)':'var(--bg-card2)',color:imgTab===tab?'#000':'var(--text-secondary)'}}>
                            {tab==='url'?'🔗 URL':'📁 Upload'}
                          </button>
                        ))}
                      </div>
                      {imgTab==='url' ? (
                        <input style={inputStyle('')} value={urlInput} onChange={e=>{setUrlInput(e.target.value);setImgPreview(e.target.value);setForm(p=>({...p,coverImage:e.target.value}))}} placeholder="https://example.com/cover.jpg"/>
                      ) : (
                        <div onDrop={e=>{e.preventDefault();processImage(e.dataTransfer.files[0])}} onDragOver={e=>e.preventDefault()} onClick={()=>fileInputRef.current.click()} style={{border:'2px dashed var(--border-color)',borderRadius:8,padding:'18px 12px',textAlign:'center',cursor:'pointer',background:'var(--bg-card2)'}}>
                          <div style={{fontSize:24,marginBottom:6}}>📁</div>
                          <div style={{fontSize:12,color:'var(--text-secondary)'}}>Click or Drag & Drop</div>
                          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>JPG/PNG — auto compressed</div>
                          <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>processImage(e.target.files[0])}/>
                        </div>
                      )}
                    </div>
                    <div style={{textAlign:'center',flexShrink:0}}>
                      <div style={{width:60,height:80,borderRadius:6,overflow:'hidden',background:'linear-gradient(135deg,#1a1a3a,#2a2a6a)',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid var(--border-color2)',fontSize:26,boxShadow:'3px 3px 12px rgba(0,0,0,0.3)'}}>
                        {imgPreview?<img src={imgPreview} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setImgPreview('')}/>:<span>{CAT_ICONS[form.category]||'📖'}</span>}
                      </div>
                      <div style={{fontSize:10,color:'var(--text-muted)',marginTop:4}}>Preview</div>
                    </div>
                  </div>
                </div>

                {/* ── EXTRA IMAGES ── */}
                <div>
                  <label style={labelStyle}>🖼️ Extra Images (max 5) — Gallery / Details</label>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:10}}>
                    {(form.extraImages||[]).map((img,idx)=>(
                      <div key={idx} style={{position:'relative',width:60,height:80}}>
                        <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:6,border:'1px solid var(--border-color2)'}}/>
                        <button type="button" onClick={()=>removeExtraImage(idx)} style={{position:'absolute',top:-6,right:-6,width:18,height:18,borderRadius:'50%',background:'var(--red)',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                      </div>
                    ))}
                    {(form.extraImages||[]).length < 5 && (
                      <div onClick={()=>extraFileRef.current.click()} style={{width:60,height:80,border:'2px dashed var(--border-color)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:24,color:'var(--text-muted)',background:'var(--bg-card2)'}}>
                        +
                        <input ref={extraFileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{processExtraImage(e.target.files[0]);e.target.value='';}}/>
                      </div>
                    )}
                  </div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>💡 Add extra photos — back cover, pages, etc. (shown in book detail popup)</div>
                </div>

                {/* ── BOOK FIELDS ── */}
                <div>
                  <label style={labelStyle}>Title *</label>
                  <input style={inputStyle('title')} name="title" value={form.title} onChange={hc} placeholder="Book title"/>
                  {errors.title && <div style={errorStyle}>⚠️ {errors.title}</div>}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div>
                    <label style={labelStyle}>Author *</label>
                    <input style={inputStyle('author')} name="author" value={form.author} onChange={hc} placeholder="Author name"/>
                    {errors.author && <div style={errorStyle}>⚠️ {errors.author}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>ISBN *</label>
                    <input style={inputStyle('isbn')} name="isbn" value={form.isbn} onChange={hc} placeholder="978-..."/>
                    {errors.isbn && <div style={errorStyle}>⚠️ {errors.isbn}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Category *</label>
                    <select style={inputStyle('category')} name="category" value={form.category} onChange={hc}>
                      {CATEGORIES.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>💰 Price (₹) *</label>
                    <input style={inputStyle('price')} type="number" name="price" value={form.price} onChange={hc} min="0" placeholder="0"/>
                    {errors.price && <div style={errorStyle}>⚠️ {errors.price}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Total Copies *</label>
                    <input style={inputStyle('totalCopies')} type="number" name="totalCopies" value={form.totalCopies} onChange={hc} min="1"/>
                    {errors.totalCopies && <div style={errorStyle}>⚠️ {errors.totalCopies}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Available Copies *</label>
                    <input style={inputStyle('availableCopies')} type="number" name="availableCopies" value={form.availableCopies} onChange={hc} min="0"/>
                    {errors.availableCopies && <div style={errorStyle}>⚠️ {errors.availableCopies}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Publisher</label>
                    <input style={inputStyle('publisher')} name="publisher" value={form.publisher} onChange={hc} placeholder="Publisher name"/>
                  </div>
                  <div>
                    <label style={labelStyle}>Published Year</label>
                    <input style={inputStyle('publishedYear')} type="number" name="publishedYear" value={form.publishedYear} onChange={hc} placeholder="2023"/>
                    {errors.publishedYear && <div style={errorStyle}>⚠️ {errors.publishedYear}</div>}
                  </div>
                  <div>
                    <label style={labelStyle}>Language</label>
                    <select style={inputStyle('language')} name="language" value={form.language} onChange={hc}>
                      <option>English</option><option>Hindi</option><option>Gujarati</option>
                      <option>Marathi</option><option>Sanskrit</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Pages</label>
                    <input style={inputStyle('pages')} type="number" name="pages" value={form.pages} onChange={hc} placeholder="350" min="1"/>
                    {errors.pages && <div style={errorStyle}>⚠️ {errors.pages}</div>}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{...inputStyle(''),resize:'vertical',minHeight:80}} name="description" value={form.description} onChange={hc} placeholder="Brief description of the book..."/>
                </div>

                <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:16,borderTop:'1px solid var(--border-color2)'}}>
                  <button type="button" className="ap-btn ap-btn--ghost" onClick={close}>Cancel</button>
                  <button type="submit" className="ap-btn ap-btn--gold" disabled={saving}>
                    {saving?'Saving...':(editing?'Update Book':'Add Book')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
