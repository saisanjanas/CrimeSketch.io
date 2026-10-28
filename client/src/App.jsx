import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowLeft, ArrowRight, AudioLines, BadgeCheck,
  Bell, BookOpen, BrainCircuit, BriefcaseBusiness, Check, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Cloud, Command, Download, Ellipsis,
  ExternalLink, Eye, EyeOff, FileAudio, FileCheck2, FileImage, FilePlus2, FileText,
  Fingerprint, Folder, FolderOpen, Gauge, Globe, HardDrive, History, Image as ImageIcon,
  KeyRound, LayoutDashboard, LockKeyhole, LogOut, Menu, MessageSquareText, Mic, MoreHorizontal,
  Paperclip, Plus, RefreshCcw, Search, Send, Settings2, Shield, ShieldCheck, SlidersHorizontal,
  Sparkles, SquareArrowOutUpRight, Upload, UserRound, UserRoundCheck, Users, X, Zap
} from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cases', label: 'Cases', icon: FolderOpen },
  { id: 'audit', label: 'Audit Log', icon: Activity },
  { id: 'about', label: 'About', icon: CircleHelp },
];

const initialCases = [
  { id: 'CS-2026-001', title: 'North District / Witness statement', status: 'review', investigator: 'A. Sharma', updated: '2026-10-28 14:12', evidence: 4, location: 'North District', summary: 'Witness description awaiting investigator review.', features: { age: '30ΓÇô40', face: 'Oval', jaw: 'Defined', eyes: 'Deep-set', brows: 'Thick', nose: 'Straight', mouth: '', hair: 'Short, dark', facialHair: 'Light stubble', notes: 'Small mark near right cheek; witness is uncertain.' }, transcript: 'The person looked around thirty to forty. Their face was oval with a defined jaw, deep-set eyes and thick eyebrows. The nose looked straight. Short dark hair and light stubble. I think there was a small mark near the right cheek, but I am not completely sure.', history: [], messages: [], sketches: [], assets: [], reportGenerated: false, demo: true },
  { id: 'CS-2026-002', title: 'East Sector / Street incident', status: 'description', investigator: 'R. Menon', updated: '2026-10-28 11:36', evidence: 2, location: 'East Sector', summary: 'Translated description requires confirmation.', features: { age: '', face: '', jaw: '', eyes: '', brows: '', nose: '', mouth: '', hair: '', facialHair: '', notes: '' }, transcript: '', history: [], messages: [], sketches: [], assets: [], reportGenerated: false, demo: true },
  { id: 'CS-2026-003', title: 'Central Ward / Review copy', status: 'evidence', investigator: 'A. Sharma', updated: '2026-10-27 18:04', evidence: 1, location: 'Central Ward', summary: 'Evidence intake in progress.', features: { age: '', face: '', jaw: '', eyes: '', brows: '', nose: '', mouth: '', hair: '', facialHair: '', notes: '' }, transcript: '', history: [], messages: [], sketches: [], assets: [], reportGenerated: false, demo: true },
];

const statusLabels = { evidence: 'Evidence intake', description: 'Description review', sketch: 'Sketch in progress', review: 'Awaiting review', complete: 'Completed', archived: 'Archived' };
const blankFeatures = { age: '', face: '', jaw: '', eyes: '', brows: '', nose: '', mouth: '', hair: '', facialHair: '', notes: '' };
const fields = [
  { key: 'age', label: 'Approximate age range', placeholder: 'Not provided ΓÇö do not infer' },
  { key: 'face', label: 'Face shape', options: ['', 'Oval', 'Round', 'Square', 'Oblong', 'Heart-shaped', 'Not clear'] },
  { key: 'jaw', label: 'Jawline / chin', placeholder: 'e.g. Defined jawline, rounded chin' },
  { key: 'eyes', label: 'Eyes', placeholder: 'e.g. Deep-set, close-set' },
  { key: 'brows', label: 'Eyebrows', placeholder: 'e.g. Thick, arched' },
  { key: 'nose', label: 'Nose', placeholder: 'e.g. Straight bridge, broad tip' },
  { key: 'mouth', label: 'Mouth / lips', placeholder: 'Not provided' },
  { key: 'hair', label: 'Hairline / hairstyle', placeholder: 'e.g. Short, dark hair' },
  { key: 'facialHair', label: 'Facial hair', placeholder: 'e.g. Light stubble, or not provided' },
  { key: 'notes', label: 'Distinctive features / uncertainty', placeholder: 'Record only what the witness stated' },
];

function stamp() { return new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z'; }
function IconButton({ icon: Icon, label, onClick, className = '', disabled = false }) { return <button aria-label={label} title={label} disabled={disabled} onClick={onClick} className={`icon-button ${className}`}><Icon size={17} /></button>; }
function PrimaryButton({ children, onClick, icon: Icon, variant = 'lime', disabled = false, className = '', type = 'button' }) { return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant} ${className}`}>{Icon && <Icon size={16} />}{children}</button>; }
function Status({ status, children }) { const tone = status === 'complete' || status === 'connected' || status === 'confirmed' ? 'green' : status === 'review' || status === 'warning' ? 'amber' : status === 'error' ? 'red' : 'neutral'; return <span className={`status status-${tone}`}><i />{children || statusLabels[status] || status}</span>; }
function Mono({ children, className = '' }) { return <span className={`mono ${className}`}>{children}</span>; }
function Field({ label, value, onChange, placeholder = '', type = 'text', options, required = false, help = '' }) { return <label className="field"><span className="field-label">{label}{required && <b> *</b>}</span>{options ? <select value={value ?? ''} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o} value={o}>{o || 'Not provided'}</option>)}</select> : type === 'textarea' ? <textarea rows={3} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} /> : <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} />}{help && <small>{help}</small>}</label>; }

export default function App() {
  const [route, setRoute] = useState('login');
  const [mobileNav, setMobileNav] = useState(false);
  const [mode, setMode] = useState('demo');
  const [user, setUser] = useState(null);
  const [health, setHealth] = useState(null);
  const [notice, setNotice] = useState(null);
  const [cases, setCases] = useState(initialCases);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseFilter, setCaseFilter] = useState('all');
  const [newCaseForm, setNewCaseForm] = useState({ title: '', location: '', incidentDate: '', notes: '', classification: 'RESTRICTED', numberOfWitnesses: 0, evidenceFound: 0 });
  const [loginForm, setLoginForm] = useState({ email: '', password: '', code: '', fullName: '' });
  const [authStep, setAuthStep] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [uploadKind, setUploadKind] = useState('text');
  const [textEvidence, setTextEvidence] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [refineDraft, setRefineDraft] = useState('');
  const [refineBusy, setRefineBusy] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditAction, setAuditAction] = useState('all');
  const [auditRows, setAuditRows] = useState([]);
  const [sketchPreview, setSketchPreview] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [mobileUserMenu, setMobileUserMenu] = useState(false);
  const fileInput = useRef(null);
  const activeCase = cases.find(c => c.id === activeCaseId) || null;
  const isDemo = mode === 'demo';

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => setHealth({ mode: 'unavailable', database: 'unavailable', integrations: {} }));
  }, []);
  useEffect(() => {
    if (notice) { const timer = setTimeout(() => setNotice(null), 5200); return () => clearTimeout(timer); }
  }, [notice]);
  useEffect(() => {
    if (route === 'audit' && isDemo) setAuditRows([
      { id: 1, happened_at: '2026-10-28 14:12:06Z', user_email: 'a.sharma@demo.invalid', role: 'investigator', action: 'case.view', case_id: 'CS-2026-001', resource: 'case', source_ip: 'DEMO / hidden', outcome: 'success' },
      { id: 2, happened_at: '2026-10-28 14:08:42Z', user_email: 'a.sharma@demo.invalid', role: 'investigator', action: 'description.save', case_id: 'CS-2026-001', resource: 'facial_description', source_ip: 'DEMO / hidden', outcome: 'success' },
      { id: 3, happened_at: '2026-10-28 13:50:10Z', user_email: 'r.menon@demo.invalid', role: 'reviewer', action: 'report.download', case_id: 'CS-2026-002', resource: 'report', source_ip: 'DEMO / hidden', outcome: 'success' },
      { id: 4, happened_at: '2026-10-28 11:36:02Z', user_email: 'r.menon@demo.invalid', role: 'reviewer', action: 'evidence.upload', case_id: 'CS-2026-002', resource: 'evidence', source_ip: 'DEMO / hidden', outcome: 'success' },
      { id: 5, happened_at: '2026-10-27 18:04:29Z', user_email: 'a.sharma@demo.invalid', role: 'investigator', action: 'auth.login', case_id: 'ΓÇö', resource: 'session', source_ip: 'DEMO / hidden', outcome: 'success' },
    ]);
    if (route === 'audit' && !isDemo) api('/api/audit').then(d => setAuditRows(d.events || [])).catch(e => setNotice({ type: 'error', message: e.message }));
  }, [route, isDemo]);

  const api = useCallback(async (url, options = {}) => {
    const response = await fetch(url, { credentials: 'include', ...options, headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) } });
    const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }, []);

  const updateCase = (id, updater) => setCases(prev => prev.map(c => c.id === id ? { ...c, ...(typeof updater === 'function' ? updater(c) : updater), updated: stamp().slice(0,16) } : c));
  const addActivity = (caseId, action, detail = '') => setCases(prev => prev.map(c => c.id === caseId ? { ...c, history: [{ id: crypto.randomUUID?.() || String(Date.now()), at: stamp(), action, detail }, ...(c.history || [])], updated: stamp().slice(0,16) } : c));
  const enterDemo = () => {
    setMode('demo'); setUser({ id: 'demo-user', email: 'a.sharma@demo.invalid', fullName: 'A. Sharma', role: 'investigator' });
    setRoute('dashboard'); setNotice({ type: 'warning', message: 'Demo workspace only ΓÇö sample cases and actions are not authenticated or suitable for real case evidence.' });
  };
  const logout = async () => {
    if (!isDemo) await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null); setRoute('login'); setAuthStep('login'); setLoginForm({ email: '', password: '', code: '', fullName: '' }); setActiveCaseId(null);
  };
  const setFeature = (key, value) => { if (!activeCase) return; updateCase(activeCase.id, c => ({ features: { ...blankFeatures, ...c.features, [key]: value } })); };
  const openCase = async (c) => {
    setActiveCaseId(c.id); setRoute('case'); setMobileNav(false);
    if (c.demo) { addActivity(c.id, 'Case opened', 'Demo workspace event'); return; }
    if (c.dbId) {
      try {
        const data = await api(`/api/cases/${c.dbId}`);
        const latestDescription = (data.descriptions || [])[0];
        const latestTranscript = (data.transcripts || [])[0];
        updateCase(c.id, {
          title: data.case.title, status: data.case.status, location: data.case.location_label,
          notes: data.case.notes, evidence: (data.evidence || []).length, evidenceItems: (data.evidence || []).map(ev => ({ ...ev, kind: ev.mime_type?.startsWith('audio/') ? 'audio' : ev.mime_type?.startsWith('image/') ? 'image' : ev.mime_type === 'application/pdf' ? 'pdf' : 'document', demo: false, downloadUrl: `/api/cases/${c.dbId}/evidence/${ev.id}/download` })),
          transcript: latestTranscript?.english_text || latestTranscript?.original_text || latestDescription?.source_text || latestDescription?.sourceText || '',
          features: { ...blankFeatures, ...(typeof latestDescription?.attributes === 'string' ? (() => { try { return JSON.parse(latestDescription.attributes); } catch { return {}; } })() : (latestDescription?.attributes || {})) },
          messages: (data.conversations || []).map(m => ({ role: m.role, content: m.content, at: m.created_at, metadata: m.metadata })),
          history: (data.conversations || []).map(m => ({ id: m.id, at: m.created_at, action: `${m.role} message`, detail: m.content.slice(0,180) })),
          sketches: (data.sketches || []).map(sk => ({ id: sk.id, version: sk.version, at: sk.created_at, status: sk.status, model: sk.model_name, url: `/api/cases/${c.dbId}/sketches/${sk.id}/image` })),
          reports: data.reports || []
        });
      } catch (err) { setNotice({ type: 'error', message: err.message }); }
    }
  };
  const go = (id) => { setRoute(id); setMobileNav(false); if (id !== 'case' && id !== 'sketch' && id !== 'report') setActiveCaseId(null); };

  const resendCode = async () => {
    if (isDemo) return setNotice({ type: 'warning', message: 'Email code delivery is unavailable in demo mode.' });
    setAuthError(''); setAuthLoading(true);
    try {
      if (authStep === 'otp') {
        const result = await api('/api/auth/resend-code', { method: 'POST', body: JSON.stringify({ email: loginForm.email, password: loginForm.password, purpose: 'login' }) });
        setNotice({ type: 'success', message: result.message });
      } else if (authStep === 'verify-email') {
        const result = await api('/api/auth/resend-code', { method: 'POST', body: JSON.stringify({ email: loginForm.email, purpose: 'verify_email' }) });
        setNotice({ type: 'success', message: result.message });
      } else if (authStep === 'reset-password') {
        const result = await api('/api/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email: loginForm.email }) });
        setNotice({ type: 'success', message: result.message });
      }
    } catch (err) { setAuthError(err.message); }
    finally { setAuthLoading(false); }
  };

  const doAuth = async (e) => {
    e?.preventDefault(); setAuthError(''); setAuthLoading(true);
    try {
      if (authStep === 'reset-request') {
        const result = await api('/api/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email: loginForm.email }) });
        setAuthStep('reset-password'); setNotice({ type: 'success', message: result.message });
      } else if (authStep === 'reset-password') {
        const result = await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ email: loginForm.email, code: loginForm.code, newPassword: loginForm.newPassword }) });
        setAuthStep('login'); setAuthMode('login'); setLoginForm(f => ({ ...f, password: '', code: '', newPassword: '' })); setNotice({ type: 'success', message: result.message });
      } else if (authMode === 'register') {
        const result = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ email: loginForm.email, password: loginForm.password, fullName: loginForm.fullName }) });
        setAuthStep('verify-email'); setAuthMode('verify'); setNotice({ type: 'success', message: result.message });
      } else if (authMode === 'verify') {
        const result = await api('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ email: loginForm.email, code: loginForm.code }) });
        setAuthMode('login'); setAuthStep('login'); setLoginForm(f => ({ ...f, code: '' })); setNotice({ type: 'success', message: result.message });
      } else if (authStep === 'login') {
        const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: loginForm.email, password: loginForm.password }) });
        setAuthStep('otp'); setNotice({ type: 'success', message: result.message });
      } else {
        const result = await api('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email: loginForm.email, code: loginForm.code }) });
        setUser({ id: result.user.id, email: result.user.email, fullName: result.user.fullName, role: result.user.role }); setMode('live');
        const liveCases = await api('/api/cases').catch(() => ({ cases: [] }));
        setCases((liveCases.cases || []).map(c => ({ ...c, id: c.case_number, dbId: c.id, status: c.status, investigator: c.assigned_name || 'Assigned investigator', evidence: Number(c.evidence_count || 0), numberOfWitnesses: Number(c.number_of_witnesses || c.numberOfWitnesses || 0), location: c.location_label || '', notes: c.notes || '', classification: c.classification || 'RESTRICTED', updated: c.updated_at || stamp(), features: { ...blankFeatures }, history: [], messages: [], sketches: [], assets: [], evidenceItems: [], transcript: '', demo: false })));
        setRoute('dashboard'); setNotice({ type: 'success', message: 'Authenticated session established.' });
      }
    } catch (err) { setAuthError(err.message); }
    finally { setAuthLoading(false); }
  };

  const createCase = async (e) => {
    e.preventDefault();
    if (!newCaseForm.title.trim()) return setNotice({ type: 'error', message: 'Enter a case title to continue.' });
    if (isDemo) {
      const id = `CS-2026-${String(cases.length + 1).padStart(3, '0')}`;
      const c = { id, title: newCaseForm.title.trim(), status: 'evidence', investigator: user.fullName, updated: stamp().slice(0,16), evidence: Number(newCaseForm.evidenceFound || 0), numberOfWitnesses: Number(newCaseForm.numberOfWitnesses || 0), evidenceFound: Number(newCaseForm.evidenceFound || 0), location: newCaseForm.location, incidentDate: newCaseForm.incidentDate, classification: newCaseForm.classification || 'RESTRICTED', notes: newCaseForm.notes, summary: 'New case created in labelled demo mode.', features: { ...blankFeatures }, transcript: '', history: [{ id: String(Date.now()), at: stamp(), action: 'Case created', detail: 'Demo-only client state' }], messages: [], sketches: [], assets: [], reportGenerated: false, demo: true };
      setCases(prev => [c, ...prev]); setNewCaseForm({ title: '', location: '', incidentDate: '', notes: '', classification: 'RESTRICTED', numberOfWitnesses: 0, evidenceFound: 0 }); setActiveCaseId(c.id); setRoute('case'); setNotice({ type: 'warning', message: 'Demo case created in browser state only; it is not saved to a secure database.' });
      return;
    }
    try {
      const result = await api('/api/cases', { method: 'POST', body: JSON.stringify(newCaseForm) });
      const raw = result.case;
      const c = { id: raw.case_number, dbId: raw.id, title: raw.title, status: raw.status, investigator: user.fullName, updated: stamp().slice(0,16), evidence: Number(raw.evidence_count ?? newCaseForm.evidenceFound ?? 0), numberOfWitnesses: Number(raw.number_of_witnesses ?? newCaseForm.numberOfWitnesses ?? 0), evidenceFound: Number(raw.evidence_found ?? newCaseForm.evidenceFound ?? 0), location: raw.location_label, notes: raw.notes, features: { ...blankFeatures }, transcript: '', history: [], messages: [], sketches: [], assets: [], demo: false };
      setCases(prev => [c, ...prev]); setActiveCaseId(c.id); setRoute('case');
    } catch (err) { setNotice({ type: 'error', message: err.message }); }
  };

  const handleFiles = (files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    const allowed = /\.(pdf|png|jpe?g|webp|wav|mp3|m4a|ogg|mp4|txt)$/i;
    const valid = selected.filter(f => allowed.test(f.name));
    const tooLarge = valid.filter(f => f.size > 25 * 1024 * 1024);
    const good = valid.filter(f => f.size <= 25 * 1024 * 1024);
    setSelectedFiles(prev => [...prev, ...good.map(file => ({ file, id: crypto.randomUUID?.() || `${file.name}-${Date.now()}`, kind: file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'document', status: 'ready' }))]);
    if (valid.length !== selected.length) setNotice({ type: 'error', message: 'Some files were skipped. Supported: PDF, PNG, JPG, WEBP, WAV, MP3, M4A, OGG, MP4 and TXT.' });
    else if (tooLarge.length) setNotice({ type: 'error', message: 'Some files exceeded the 25 MB per-file limit.' });
  };

  const saveEvidence = async () => {
    if (!activeCase) return;
    const witnessTextToSave = textEvidence.trim() && textEvidence.trim() !== (activeCase.transcript || '').trim() ? textEvidence.trim() : '';
    if (!witnessTextToSave && selectedFiles.length === 0) return setNotice({ type: 'info', message: 'No new changes to save. Edit the witness statement or add an evidence file first.' });
    if (isDemo) {
      const inc = selectedFiles.length + (witnessTextToSave ? 1 : 0);
      const newEvidenceItems = [
        ...selectedFiles.map(item => ({ id: item.id, original_name: item.file.name, mime_type: item.file.type || item.kind, size_bytes: item.file.size, status: 'demo_only', created_at: stamp(), kind: item.kind, demo: true })),
        ...(witnessTextToSave ? [{ id: `text-${Date.now()}`, original_name: 'Witness statement (text)', mime_type: 'text/plain', size_bytes: witnessTextToSave.length, status: 'demo_only', created_at: stamp(), kind: 'document', demo: true }] : [])
      ];
      updateCase(activeCase.id, c => ({ evidence: (c.evidence || 0) + inc, evidenceItems: [...(c.evidenceItems || []), ...newEvidenceItems], transcript: witnessTextToSave || c.transcript, summary: 'Evidence provided in demo workspace; no file was uploaded to a secure backend.' }));
      addActivity(activeCase.id, 'Evidence intake updated', `${inc} demo item(s)`);
      if (witnessTextToSave) setFeature('notes', (activeCase.features?.notes ? activeCase.features.notes + '\n' : '') + `Witness statement: ${witnessTextToSave}`);
      setSelectedFiles([]); setTextEvidence(''); setNotice({ type: 'warning', message: 'Demo evidence intake saved in page state only. No transcription or secure upload was performed.' });
      return;
    }
    if (!activeCase.dbId) return setNotice({ type: 'error', message: 'This case does not have a server ID. Refresh the cases list.' });
    try {
      if (selectedFiles.length) {
        const form = new FormData(); selectedFiles.forEach(f => form.append('files', f.file));
        const result = await api(`/api/cases/${activeCase.dbId}/evidence`, { method: 'POST', body: form });
        updateCase(activeCase.id, c => ({ evidence: (c.evidence || 0) + result.evidence.length, evidenceItems: [...(c.evidenceItems || []), ...result.evidence.map(ev => ({ ...ev, kind: ev.mime_type?.startsWith('audio/') ? 'audio' : ev.mime_type?.startsWith('image/') ? 'image' : ev.mime_type === 'application/pdf' ? 'pdf' : 'document', demo: false, downloadUrl: `/api/cases/${activeCase.dbId}/evidence/${ev.id}/download` }))] }));
      }
      if (witnessTextToSave) {
        const sourceText = witnessTextToSave;
        const saved = await api(`/api/cases/${activeCase.dbId}/description`, {
          method: 'POST',
          body: JSON.stringify({ sourceText, attributes: activeCase.features || blankFeatures, confirmed: false })
        });
        const savedDescription = saved.description || {};
        updateCase(activeCase.id, {
          transcript: savedDescription.source_text ?? sourceText,
          features: { ...blankFeatures, ...(savedDescription.attributes || activeCase.features || {}) },
          descriptionVersion: savedDescription.version
        });
      }
      addActivity(activeCase.id, 'Evidence intake updated', `${selectedFiles.length} file(s)${witnessTextToSave ? ' and witness description saved' : ''}`);
      setSelectedFiles([]);
      setTextEvidence('');
      setNotice({ type: 'success', message: witnessTextToSave ? 'Witness description and evidence saved to the database.' : 'Evidence files saved to the database.' });
    } catch (err) { setNotice({ type: 'error', message: err.message }); }
  };

  const confirmDescription = async () => {
    if (!activeCase) return;
    const sourceText = activeCase.transcript || textEvidence || '';
    if (isDemo) {
      updateCase(activeCase.id, { status: 'sketch', summary: 'Description marked as confirmed in demo state.' });
      addActivity(activeCase.id, 'Description confirmed', 'Demo-only confirmation');
      setNotice({ type: 'warning', message: 'Demo description marked confirmed locally. No model-generated verification was performed.' });
      setRoute('sketch'); return;
    }
    try {
      await api(`/api/cases/${activeCase.dbId}/description`, { method: 'POST', body: JSON.stringify({ sourceText, attributes: activeCase.features || {}, confirmed: true }) });
      await api(`/api/cases/${activeCase.dbId}`, { method: 'PATCH', body: JSON.stringify({ status: 'sketch' }) });
      updateCase(activeCase.id, { status: 'sketch' }); setRoute('sketch');
    } catch (err) { setNotice({ type: 'error', message: err.message }); }
  };

  const askAssistant = async (e) => {
    e?.preventDefault();
    if (!activeCase || !chatDraft.trim()) return;
    const userMessage = { role: 'user', content: chatDraft.trim(), at: stamp() };
    const messages = [...(activeCase.messages || []), userMessage];
    updateCase(activeCase.id, { messages }); setChatDraft(''); setChatBusy(true);
    if (isDemo) {
      const key = Object.entries(activeCase.features || {}).find(([k, v]) => !String(v || '').trim());
      const answer = key ? `Demo assistant: the ${fields.find(f => f.key === key[0])?.label || key[0]} is not provided yet. Ask the witness only if this detail is remembered; otherwise leave it as ΓÇ£Not providedΓÇ¥. No AI model is connected in demo mode.` : 'Demo assistant: the currently entered attributes can be reviewed. Please distinguish direct witness observations from uncertain recollections. No live model is connected.';
      setTimeout(() => { updateCase(activeCase.id, c => ({ messages: [...(c.messages || []), userMessage, { role: 'assistant', content: answer, at: stamp() }] })); setChatBusy(false); }, 350);
      return;
    }
    try {
      const result = await api('/api/ai/ask', { method: 'POST', body: JSON.stringify({ caseId: activeCase.dbId, messages: messages.map(m => ({ role: m.role, content: m.content })), attributes: activeCase.features }) });
      updateCase(activeCase.id, c => ({ messages: [...(c.messages || []), userMessage, { role: 'assistant', content: result.answer, at: stamp(), model: result.model }] }));
    } catch (err) {
      updateCase(activeCase.id, c => ({ messages: [...(c.messages || []), { role: 'assistant', content: `Service unavailable: ${err.message}`, at: stamp(), error: true }] }));
    } finally { setChatBusy(false); }
  };

  const generateSketch = async () => {
    if (!activeCase) return;
    if (isDemo) { setNotice({ type: 'warning', message: 'Stable Diffusion 1.5 is not connected. This demo will not fabricate a generated sketch. Configure the provider to enable generation.' }); setSketchPreview(true); return; }
    const description = Object.entries(activeCase.features || {}).filter(([k, v]) => Boolean(v) && k !== 'notes').map(([k, v]) => `${fields.find(f => f.key === k)?.label || k}: ${v}`).join('; ');
    try {
      const result = await api('/api/ai/sketch', { method: 'POST', body: JSON.stringify({ caseId: activeCase.dbId, prompt: `${description}. ${activeCase.features?.notes || ''}` }) });
      if (result.sketch?.imageUrl) {
        updateCase(activeCase.id, c => ({ status: 'review', sketches: [{ ...result.sketch, url: result.sketch.imageUrl, at: result.sketch.created_at || stamp(), status: 'candidate' }, ...(c.sketches || [])] }));
        setNotice({ type: 'success', message: `Sketch version ${result.sketch.version} generated. Review it before approval.` });
      } else setNotice({ type: 'error', message: 'The provider did not return a usable image. No sketch version was saved.' });
    } catch (err) { setNotice({ type: 'error', message: err.message }); }
  };

  const submitRefinement = async (e) => {
    e?.preventDefault();
    if (!activeCase || !refineDraft.trim()) return;
    const instruction = refineDraft.trim(); setRefineDraft(''); setRefineBusy(true);
    if (isDemo) { setRefineBusy(false); setNotice({ type: 'warning', message: `Refinement request recorded in the demo UI: ΓÇ£${instruction}ΓÇ¥. No image was changed because Stable Diffusion is not connected.` }); addActivity(activeCase.id, 'Refinement request (demo)', instruction); return; }
    try {
      const sourceSketch = activeCase.sketches?.[0];
      if (!sourceSketch?.id) throw new Error('Generate a sketch before requesting a refinement.');
      const result = await api('/api/ai/refine', { method: 'POST', body: JSON.stringify({ caseId: activeCase.dbId, sketchId: sourceSketch.id, instruction, confirmedAttributes: activeCase.features }) });
      if (result.sketch?.imageUrl) {
        updateCase(activeCase.id, c => ({ status: 'review', sketches: [{ ...result.sketch, url: result.sketch.imageUrl, at: result.sketch.created_at || stamp(), status: 'candidate' }, ...(c.sketches || [])] }));
        addActivity(activeCase.id, 'Sketch refinement generated', instruction);
        setNotice({ type: 'success', message: `Refined sketch version ${result.sketch.version} is ready for review.` });
      } else setNotice({ type: 'error', message: 'The provider did not return a usable refined image.' });
    } catch (err) { setNotice({ type: 'error', message: err.message }); }
    finally { setRefineBusy(false); }
  };

  const restoreSketch = async (sketchId) => {
    if (!activeCase) return;
    if (isDemo) return setNotice({ type: 'warning', message: 'Demo mode has no persisted sketch assets to restore.' });
    try {
      const result = await api(`/api/cases/${activeCase.dbId}/sketches/${sketchId}/restore`, { method: 'POST' });
      if (!result.sketch?.imageUrl) throw new Error('Restore endpoint returned no image.');
      updateCase(activeCase.id, c => ({ status: 'review', sketches: [{ ...result.sketch, url: result.sketch.imageUrl, at: result.sketch.created_at || stamp(), status: 'candidate' }, ...(c.sketches || [])] }));
      addActivity(activeCase.id, 'Sketch version restored', `Restored version ${result.sourceVersion} as a new version`);
      setNotice({ type: 'success', message: `Version ${result.sourceVersion} restored as a new version for review.` });
    } catch (err) { setNotice({ type: 'error', message: err.message }); }
  };

  const approveSketch = async (requestedSketchId = null) => {
    if (!activeCase) return;
    if (isDemo) return setNotice({ type: 'warning', message: 'An illustrative/demo workspace cannot approve a generated sketch. Connect Stable Diffusion and use an authenticated case.' });
    const sketch = (activeCase.sketches || []).find(s => s.id === requestedSketchId) || activeCase.sketches?.[0];
    if (!sketch?.id) return setNotice({ type: 'error', message: 'Generate a real sketch before approving it.' });
    try {
      await api(`/api/cases/${activeCase.dbId}/sketches/${sketch.id}/approve`, { method: 'POST' });
      updateCase(activeCase.id, c => ({ status: 'review', sketches: (c.sketches || []).map(s => ({ ...s, status: s.id === sketch.id ? 'approved' : (s.status === 'approved' ? 'candidate' : s.status) })) }));
      addActivity(activeCase.id, 'Final sketch approved', `Version ${sketch.version}`);
      setNotice({ type: 'success', message: 'Final sketch approval saved.' });
    } catch (err) { setNotice({ type: 'error', message: err.message }); }
  };

  const reportCase = async () => {
    if (!activeCase) return;
    if (!isDemo && !activeCase.sketches?.some(s => s.status === 'approved')) return setNotice({ type: 'error', message: 'Approve a generated sketch before producing the final case report.' });
    setReportBusy(true);
    try {
      let content;
      if (isDemo) {
        content = {
          title: 'AI-Assisted Case Report', executiveSummary: 'DEMO REPORT. This document was generated from sample/local browser state. No live Gemini model was called and it is not an official investigative record.',
          caseMetadata: { caseId: activeCase.id, title: activeCase.title, status: statusLabels[activeCase.status] || activeCase.status, location: activeCase.location || 'Not provided', reportDate: new Date().toLocaleString(), investigator: activeCase.investigator || user?.fullName || 'Not provided' },
          witnessStatement: activeCase.transcript || 'Not provided', confirmedFacialDescription: Object.entries(activeCase.features || {}).filter(([, v]) => String(v || '').trim()).map(([k, v]) => `${fields.find(f => f.key === k)?.label || k}: ${v}`).join('\n') || 'Not provided', questionsAndAnswers: (activeCase.messages || []).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') || 'No conversation in this demo case.', sketchHistory: 'No real sketch generation has been connected.', evidenceInventory: `${activeCase.evidence || 0} item(s) shown in demo state. Files are not stored in secure server storage.`, modelMetadata: 'DEMO MODE ΓÇö Gemini Flash was not called.', approvalStatus: 'Not approved as official case documentation.', unresolvedInformation: 'Review all details; missing fields remain unverified.', limitations: 'This sample report is for interface testing only and must not be used as an official case report.'
        };
      } else {
        const result = await api('/api/ai/report-content', { method: 'POST', body: JSON.stringify({ caseId: activeCase.dbId, caseData: { ...activeCase, id: activeCase.dbId }, conversation: activeCase.messages || [] }) });
        content = result.report;
      }
      let approvedSketchDataUrl = null;
      if (!isDemo) {
        const approvedSketch = (activeCase.sketches || []).find(s => s.status === 'approved');
        if (approvedSketch?.url) {
          const imageResponse = await fetch(approvedSketch.url, { credentials: 'include' });
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            approvedSketchDataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(imageBlob); });
          }
        }
      }
      downloadPdf(content, activeCase, isDemo, approvedSketchDataUrl);
      updateCase(activeCase.id, { reportGenerated: true }); addActivity(activeCase.id, 'Case report generated', isDemo ? 'Demo report export' : 'Gemini Flash report content');
      setNotice({ type: isDemo ? 'warning' : 'success', message: isDemo ? 'Demo PDF downloaded. It is marked as demo and is not an official case report.' : 'Report PDF generated and downloaded.' });
    } catch (err) { setNotice({ type: 'error', message: err.message }); }
    finally { setReportBusy(false); }
  };

  const downloadPdf = (data, c, demo, sketchDataUrl = null) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const left = 17, width = 176; let y = 18;
    const line = (text, size = 10, bold = false, color = [28, 31, 35]) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
      const rows = doc.splitTextToSize(String(text ?? 'Not provided'), width);
      if (y + rows.length * (size * .42) > 275) { doc.addPage(); y = 18; }
      doc.text(rows, left, y); y += rows.length * (size * .42) + 2.4;
    };
    doc.setFillColor(8, 8, 8); doc.rect(0, 0, 210, 36, 'F');
    doc.setTextColor(197, 255, 61); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('CrimeSketch.io   ΓÇó   HACK FEST 2026', left, 12);
    doc.setTextColor(245, 245, 240); doc.setFontSize(20); doc.text('CASE REPORT', left, 24);
    if (demo) { doc.setFillColor(255, 238, 194); doc.rect(0, 36, 210, 10, 'F'); doc.setTextColor(92, 58, 0); doc.setFontSize(8); doc.text('DEMO REPORT ΓÇö NOT AN OFFICIAL INVESTIGATIVE RECORD', left, 42); }
    y = demo ? 56 : 47;
    const sections = [
      ['CASE METADATA', data.caseMetadata || { caseId: c.id, title: c.title, status: statusLabels[c.status] }],
      ['EXECUTIVE SUMMARY', data.executiveSummary], ['WITNESS STATEMENT', data.witnessStatement],
      ['TRANSCRIPTION / TRANSLATION', data.transcriptAndTranslation || 'Not provided'], ['CONFIRMED FACIAL DESCRIPTION', data.confirmedFacialDescription],
      ['QUESTIONS & ANSWERS', data.questionsAndAnswers], ['SKETCH HISTORY', data.sketchHistory], ['EVIDENCE INVENTORY', data.evidenceInventory],
      ['MODEL METADATA', data.modelMetadata], ['APPROVAL STATUS', data.approvalStatus], ['UNRESOLVED INFORMATION', data.unresolvedInformation], ['LIMITATIONS', data.limitations]
    ];
    sections.forEach(([heading, value]) => { doc.setDrawColor(197,255,61); doc.setLineWidth(.65); doc.line(left, y - 2, left + 13, y - 2); line(heading, 9, true, [75, 91, 53]); if (typeof value === 'object' && value !== null) line(Object.entries(value).map(([k,v]) => `${k}: ${v ?? 'Not provided'}`).join('\n'), 9); else line(value || 'Not provided', 10); y += 1; });
    if (sketchDataUrl) {
      if (y + 95 > 275) { doc.addPage(); y = 18; }
      doc.setDrawColor(197,255,61); doc.line(left, y - 2, left + 13, y - 2); line('FINAL APPROVED SKETCH', 9, true, [75, 91, 53]);
      const imageWidth = 92, imageHeight = 92;
      doc.addImage(sketchDataUrl, 'PNG', left, y, imageWidth, imageHeight, undefined, 'FAST');
      y += imageHeight + 5;
    }
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p++) { doc.setPage(p); doc.setFontSize(8); doc.setTextColor(120,120,120); doc.text(`Case ${c.id}  ΓÇó  Page ${p} of ${pages}`, left, 289); }
    doc.save(`${c.id}-case-report${demo ? '-DEMO' : ''}.pdf`);
  };

  const start3d = async () => {
    if (isDemo) return setNotice({ type: 'warning', message: 'Hitem3D is not connected. No 3D model was generated.' });
    try { await api('/api/ai/3d', { method: 'POST', body: JSON.stringify({ caseId: activeCase.dbId }) }); }
    catch (err) { setNotice({ type: 'error', message: err.message }); }
  };

  const goToNewCase = () => { setActiveCaseId(null); setRoute('new-case'); setNewCaseForm({ title: '', location: '', incidentDate: '', notes: '', classification: 'RESTRICTED', numberOfWitnesses: 0, evidenceFound: 0 }); };
  const filteredCases = useMemo(() => cases.filter(c => (caseFilter === 'all' || c.status === caseFilter) && `${c.id} ${c.title} ${c.investigator} ${c.location || ''}`.toLowerCase().includes(searchTerm.toLowerCase())), [cases, caseFilter, searchTerm]);
  const filteredAudit = useMemo(() => auditRows.filter(row => (auditAction === 'all' || row.action === auditAction) && `${row.user_email || ''} ${row.case_id || ''} ${row.action} ${row.outcome}`.toLowerCase().includes(auditSearch.toLowerCase())), [auditRows, auditAction, auditSearch]);
  const integrations = health?.integrations || {};
  const statuses = [
    ['Gemma 4 / Ollama', integrations.gemma === 'configured_endpoint' ? 'endpoint set' : 'not checked', integrations.gemma === 'configured_endpoint'],
    ['Stable Diffusion 1.5', integrations.stableDiffusion === 'configured' ? 'configured' : 'not connected', integrations.stableDiffusion === 'configured'],
    ['Whisper', integrations.whisper === 'configured' ? 'configured' : 'not connected', integrations.whisper === 'configured'],
    ['Gemini Flash', integrations.gemini === 'configured' ? 'configured' : 'not connected', integrations.gemini === 'configured'],
    ['Hitem3D', integrations.hitem3d === 'configured' ? 'configured' : 'not connected', integrations.hitem3d === 'configured'],
  ];

  if (route === 'login') return <LoginScreen {...{ loginForm, setLoginForm, authStep, setAuthStep, authLoading, authError, showPassword, setShowPassword, authMode, setAuthMode, doAuth, resendCode, enterDemo, health, setAuthError }} />;

  const pageTitle = route === 'dashboard' ? 'INVESTIGATIONS / OVERVIEW' : route === 'cases' ? 'CASE REGISTER' : route === 'new-case' ? 'NEW CASE / INTAKE' : route === 'case' ? 'CASE WORKSPACE' : route === 'sketch' ? 'SKETCH STUDIO / GENERATION' : route === 'report' ? 'REPORT / OUTPUTS' : route === 'audit' ? 'AUDIT / ACTIVITY LOG' : 'ACCOUNT / SECURITY';
  const goActiveCase = (id) => { setActiveCaseId(id); setRoute('case'); };

  return <div className="app-shell cs-horizontal-shell">
    <style>{`
      .cs-horizontal-shell{display:block!important;min-height:100vh;background:#0b0d0c;color:#f0f2ed}
      .cs-horizontal-shell .sidebar{display:none!important}
      .cs-horizontal-shell .main-content{width:100%!important;min-width:0!important;margin:0!important}
      .cs-horizontal-shell .cs-global-header{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:17px clamp(18px,4vw,64px);background:rgba(11,13,12,.94);border-bottom:1px solid #292e29;backdrop-filter:blur(16px)}
      .cs-horizontal-shell .cs-brand{display:flex;align-items:center;gap:11px;white-space:nowrap}
      .cs-horizontal-shell .cs-brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#c9f36a;color:#11150a}
      .cs-horizontal-shell .cs-brand-name{font-weight:800;letter-spacing:-.04em;font-size:17px}
      .cs-horizontal-shell .cs-brand-sub{font-size:9px;letter-spacing:.18em;color:#a2a99b;margin-top:3px}
      .cs-horizontal-shell .cs-nav{display:flex;align-items:center;justify-content:center;gap:5px;flex-wrap:wrap}
      .cs-horizontal-shell .cs-nav button{display:flex;align-items:center;gap:8px;border:1px solid transparent;background:transparent;color:#aab0a5;padding:10px 13px;border-radius:8px;cursor:pointer;font:inherit;font-size:13px}
      .cs-horizontal-shell .cs-nav button.active,.cs-horizontal-shell .cs-nav button:hover{background:#1a2016;border-color:#37452a;color:#d3fa79}
      .cs-horizontal-shell .cs-header-actions{display:flex;align-items:center;gap:12px;white-space:nowrap}
      .cs-horizontal-shell .cs-session{font-size:10px;letter-spacing:.1em;color:#c9f36a;border:1px solid #3a492a;padding:7px 9px;border-radius:99px}
      .cs-horizontal-shell .cs-user{font-size:12px;color:#e7eadf}
      .cs-horizontal-shell .topbar{display:none!important}
      .cs-horizontal-shell .page-wrap{max-width:1480px;margin:0 auto;padding:clamp(22px,4vw,58px)}
      .cs-horizontal-shell .app-footer{max-width:1480px;margin:0 auto;padding:22px clamp(22px,4vw,58px);border-top:1px solid #252a25}
      .cs-horizontal-shell .cs-dashboard-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;margin-bottom:35px}
      .cs-horizontal-shell .cs-dashboard-heading h1{font-size:clamp(36px,5vw,68px);line-height:.98;letter-spacing:-.065em;margin:12px 0 15px;font-weight:800}
      .cs-horizontal-shell .cs-dashboard-heading h1 span{color:#c9f36a}
      .cs-horizontal-shell .cs-dashboard-heading p{max-width:590px;color:#aab0a5;line-height:1.7;margin:0}
      .cs-horizontal-shell .cs-counter-grid{display:grid;grid-template-columns:repeat(2,minmax(0,190px));gap:18px;margin:28px 0 34px}
      .cs-horizontal-shell .cs-counter{width:170px;height:170px;border:1px solid #39432d;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;background:radial-gradient(circle at center,#1b2315 0,#10130f 67%)}
      .cs-horizontal-shell .cs-counter:before{content:'';position:absolute;inset:8px;border:1px dashed #4d5d37;border-radius:50%}
      .cs-horizontal-shell .cs-counter strong{font-size:44px;line-height:1;letter-spacing:-.06em;color:#d3fa79}
      .cs-horizontal-shell .cs-counter span{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#b4bcaa;margin-top:10px}
      .cs-horizontal-shell .cs-section-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:38px 0 15px}
      .cs-horizontal-shell .cs-section-title h2{font-size:20px;margin:0;letter-spacing:-.03em}
      .cs-horizontal-shell .cs-case-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .cs-horizontal-shell .cs-case-card{display:flex;align-items:center;gap:14px;text-align:left;width:100%;background:#111512;border:1px solid #2b322b;border-radius:12px;padding:18px;color:inherit;cursor:pointer}
      .cs-horizontal-shell .cs-case-card:hover{border-color:#718c45;background:#151b13}
      .cs-horizontal-shell .cs-case-card-main{min-width:0;flex:1}.cs-horizontal-shell .cs-case-card-main strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cs-horizontal-shell .cs-case-card-main small{display:block;color:#8e9789;margin-top:7px;font-size:11px}
      .cs-horizontal-shell .cs-empty{border:1px dashed #394039;border-radius:12px;padding:28px;color:#aab0a5}
      .cs-horizontal-shell .cs-about-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .cs-horizontal-shell .cs-about-card{background:#111512;border:1px solid #2b322b;border-radius:12px;padding:22px}.cs-horizontal-shell .cs-about-card h3{margin:13px 0 8px}.cs-horizontal-shell .cs-about-card p{color:#aab0a5;line-height:1.65;font-size:13px}
      .cs-horizontal-shell .next-stage-panel-large{width:100%;min-height:300px;padding:30px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:15px;text-align:left;color:inherit;cursor:pointer;background:linear-gradient(145deg,#171e12,#10130f);border:1px solid #485b31;transition:border-color .2s,transform .2s}.cs-horizontal-shell .next-stage-panel-large:hover{border-color:#c9f36a;transform:translateY(-2px)}.cs-horizontal-shell .next-stage-panel-large .next-stage-icon{display:grid;place-items:center;width:56px;height:56px;border-radius:12px;background:#c9f36a;color:#11150a}.cs-horizontal-shell .next-stage-panel-large h3{font-size:28px;line-height:1.15;margin:0;letter-spacing:-.04em}.cs-horizontal-shell .next-stage-panel-large p{margin:0;color:#aab0a5;line-height:1.7;font-size:13px}.cs-horizontal-shell .next-stage-action{display:flex;align-items:center;gap:10px;color:#d3fa79;font-size:11px;letter-spacing:.08em;font-weight:700;margin-top:10px}.cs-horizontal-shell .description-layout{display:block}.cs-horizontal-shell .description-form-panel{width:100%;max-width:none}.cs-horizontal-shell .summary-stats>div{min-width:0}@media(max-width:850px){.cs-horizontal-shell .cs-global-header{align-items:flex-start;flex-wrap:wrap}.cs-horizontal-shell .cs-nav{order:3;width:100%;justify-content:flex-start}.cs-horizontal-shell .cs-header-actions{margin-left:auto}.cs-horizontal-shell .cs-dashboard-heading{align-items:flex-start;flex-direction:column}.cs-horizontal-shell .cs-case-cards,.cs-horizontal-shell .cs-about-grid{grid-template-columns:1fr}}
      @media(max-width:480px){.cs-horizontal-shell .cs-counter-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.cs-horizontal-shell .cs-counter{width:100%;height:auto;aspect-ratio:1}.cs-horizontal-shell .cs-nav button{padding:8px 9px;font-size:12px}.cs-horizontal-shell .cs-user{display:none}}
    `}</style>
    <header className="cs-global-header">
      <div className="cs-brand"><div className="cs-brand-mark"><Command size={19}/></div><div><div className="cs-brand-name">CrimeSketch.io</div><div className="cs-brand-sub">HACK FEST 2026</div></div></div>
      <nav className="cs-nav" aria-label="Main navigation">{NAV.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => go(item.id)} className={route === item.id ? 'active' : ''}><Icon size={16}/><span>{item.label}</span>{item.id === 'cases' && <span>{cases.length}</span>}</button>; })}</nav>
      <div className="cs-header-actions"><span className="cs-session">{isDemo ? 'DEMO MODE' : 'LIVE SESSION'}</span><span className="cs-user">{user?.fullName || 'Investigator'}</span><button className="top-avatar" onClick={() => setMobileUserMenu(v => !v)} aria-label="Open user menu">{(user?.fullName || 'A').split(' ').map(x => x[0]).join('').slice(0,2)}</button>{mobileUserMenu && <div className="user-popover"><button onClick={() => { setRoute('security'); setMobileUserMenu(false); }}>Account / Security</button><button onClick={logout}>Sign out</button></div>}</div>
    </header>
    <main className="main-content">
      <div className="page-wrap">
        {route === 'dashboard' && <Dashboard {...{ cases, user, isDemo, statuses, health, openCase, goToNewCase, go, setNotice }} />}
        {route === 'cases' && <CasesPage {...{ cases, filteredCases, searchTerm, setSearchTerm, caseFilter, setCaseFilter, openCase, goToNewCase }} />}
        {route === 'new-case' && <NewCasePage {...{ newCaseForm, setNewCaseForm, createCase, go }} />}
        {route === 'case' && activeCase && <CaseWorkspace {...{ activeCase, isDemo, uploadKind, setUploadKind, textEvidence, setTextEvidence, selectedFiles, setSelectedFiles, handleFiles, fileInput, saveEvidence, setFeature, confirmDescription, updateCase, setRoute, addActivity, go, setNotice }} />}
        {route === 'sketch' && activeCase && <SketchStudio {...{ activeCase, isDemo, generateSketch, sketchPreview, setSketchPreview, refineDraft, setRefineDraft, submitRefinement, refineBusy, approveSketch, restoreSketch, confirmDescription, setRoute, updateCase, addActivity, setNotice }} />}
        {route === 'report' && activeCase && <ReportPage {...{ activeCase, isDemo, reportCase, reportBusy, start3d, go, setRoute }} />}
        {route === 'audit' && <AuditPage {...{ auditRows, filteredAudit, auditSearch, setAuditSearch, auditAction, setAuditAction, isDemo, user, setNotice }} />}
        {route === 'about' && <AboutPage go={go} />}
        {route === 'security' && <SecurityPage {...{ user, isDemo, integrations, health, logout, setNotice }} />}
      </div>
      <footer className="app-footer"><div>CrimeSketch.io <span>ΓÇö</span> HACK FEST 2026</div><div className="footer-right"><span>DESIGNATION / RESTRICTED</span><span className="footer-divider">|</span><span className="mono">BUILD 0.1.0</span></div></footer>
    </main>
    {notice && <div role="status" className={`toast toast-${notice.type || 'info'}`}><div className="toast-icon">{notice.type === 'error' ? <AlertCircle size={17} /> : notice.type === 'success' ? <CheckCircle2 size={17} /> : <CircleHelp size={17} />}</div><div>{notice.message}</div><button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={15} /></button></div>}
  </div>;
}

function LoginScreen({ loginForm, setLoginForm, authStep, setAuthStep, authLoading, authError, showPassword, setShowPassword, authMode, setAuthMode, doAuth, resendCode, enterDemo, health, setAuthError }) {
  return <div className="login-screen"><div className="login-grain" /><header className="login-topbar"><div className="brand-lockup"><div className="brand-mark"><Command size={18} /></div><div><div className="brand-name">CrimeSketch.io</div><div className="brand-sub">HACK FEST 2026</div></div></div><div className="login-top-meta"><span><i className="health-dot" /> INVESTIGATION SYSTEM</span><span className="mono">ACCESS GATE / 01</span></div></header><div className="login-grid"><section className="login-intro"><div className="eyebrow"><span className="eyebrow-line" />SECURE INVESTIGATIVE WORKFLOW <span className="mono">/ 2026</span></div><h1>SECURE<br />ACCESS<span className="accent-dot">.</span></h1><p className="login-lede">Authorized personnel only. Access to investigative casework is monitored and recorded.</p><div className="login-index"><div><span className="mono">01</span><strong>CASE INTAKE</strong><small>Structured evidence workflow</small></div><div><span className="mono">02</span><strong>AI-ASSISTED SKETCH</strong><small>Human-reviewed iterations</small></div><div><span className="mono">03</span><strong>TRACEABLE OUTPUTS</strong><small>Reports and audit events</small></div></div><div className="login-micro"><div className="micro-cross">+</div><span className="mono">SECURITY BY DESIGN</span><span className="micro-line" /><span className="mono">ACCESS / LOGGED</span></div></section><section className="auth-panel-wrap"><div className="auth-panel"><div className="panel-kicker"><ShieldCheck size={16} /><span>AUTHENTICATION GATE</span><span className="mono">{authStep === 'otp' ? '02 / 02' : '01 / 02'}</span></div><h2>{authStep === 'otp' ? 'Verify sign-in.' : authStep === 'verify-email' ? 'Verify email.' : authStep === 'reset-request' ? 'Reset password.' : authStep === 'reset-password' ? 'Choose a new password.' : authMode === 'register' ? 'Create account.' : 'Welcome back.'}</h2><p className="auth-subtitle">{authStep === 'otp' ? `Enter the six-digit code sent to ${loginForm.email}.` : authStep === 'verify-email' ? `Enter the verification code sent to ${loginForm.email}.` : authStep === 'reset-request' ? 'Request a time-limited password-reset code by email.' : authStep === 'reset-password' ? `Enter the code sent to ${loginForm.email} and set a new password.` : authMode === 'register' ? 'Register with your institutional account.' : 'Sign in to continue to the case workspace.'}</p>{authError && <div className="auth-error"><AlertCircle size={15} />{authError}</div>}<form onSubmit={doAuth} className="auth-form">
    {(authStep === 'login' && authMode === 'register') && <label className="field"><span className="field-label">FULL NAME</span><input value={loginForm.fullName} onChange={e => setLoginForm(f => ({ ...f, fullName: e.target.value }))} required placeholder="Name as registered" /></label>}
    {(['login','verify-email','reset-request','reset-password'].includes(authStep)) && <label className="field"><span className="field-label">EMAIL ADDRESS</span><div className="input-icon"><UserRound size={16} /><input autoComplete="email" type="email" required value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} placeholder="name@organization.gov" /></div></label>}
    {authStep === 'login' && <label className="field"><span className="field-label">PASSWORD</span><div className="input-icon"><KeyRound size={16} /><input autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} minLength={authMode === 'register' ? 12 : 1} required value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} placeholder={authMode === 'register' ? 'At least 12 characters' : 'Enter password'} /><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{authMode === 'register' && <small>Use a unique password of at least 12 characters.</small>}</label>}
    {(authStep === 'otp' || authStep === 'verify-email' || authStep === 'reset-password') && <label className="field"><span className="field-label">SIX-DIGIT ONE-TIME CODE</span><div className="input-icon"><LockKeyhole size={16} /><input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={loginForm.code} onChange={e => setLoginForm(f => ({ ...f, code: e.target.value.replace(/\D/g,'').slice(0,6) }))} placeholder="000000" /></div><small>Code expires in 10 minutes. Limited attempts apply.</small></label>}
    {authStep === 'reset-password' && <label className="field"><span className="field-label">NEW PASSWORD</span><div className="input-icon"><KeyRound size={16}/><input type={showPassword?'text':'password'} minLength={12} autoComplete="new-password" required value={loginForm.newPassword || ''} onChange={e=>setLoginForm(f=>({...f,newPassword:e.target.value}))} placeholder="At least 12 characters"/></div></label>}
    <button disabled={authLoading} className="btn btn-lime auth-submit" type="submit">{authLoading ? <RefreshCcw className="spin" size={16} /> : authStep === 'otp' ? <ShieldCheck size={16} /> : authStep === 'verify-email' ? <BadgeCheck size={16} /> : authStep.startsWith('reset') ? <KeyRound size={16} /> : authMode === 'register' ? <UserRoundCheck size={16} /> : <LockKeyhole size={16} />}{authLoading ? 'PLEASE WAIT' : authStep === 'otp' ? 'VERIFY & SIGN IN' : authStep === 'verify-email' ? 'VERIFY EMAIL' : authMode === 'register' ? 'CREATE ACCOUNT' : 'CONTINUE SECURELY'}<ArrowRight size={16} /></button>
  </form>{authStep === 'login' && <div className="auth-links">{authMode === 'login' ? <button onClick={() => { setAuthMode('register'); }} type="button">Create account <ArrowDownRight size={14} /></button> : <button onClick={() => setAuthMode('login')} type="button"><ArrowLeft size={14} /> Back to sign in</button>}<button type="button" onClick={() => { setAuthError(''); setAuthStep('reset-request'); }}>Forgot password?</button></div>}{authStep === 'reset-request' && <div className="auth-links"><button type="button" onClick={() => { setAuthStep('login'); setAuthMode('login'); }}><ArrowLeft size={14}/> Back to sign in</button></div>}
  {(authStep === 'otp' || authStep === 'verify-email' || authStep === 'reset-password') && <div className="auth-links"><button type="button" onClick={() => { setAuthStep('login'); setAuthMode('login'); setLoginForm(f => ({ ...f, code: '', newPassword: '' })); }}><ArrowLeft size={14} /> Return to login</button><button type="button" onClick={resendCode} disabled={authLoading}>Resend code</button></div>}<div className="auth-divider"><span>OR</span></div><button className="btn btn-outline demo-entry" onClick={enterDemo}><Command size={16} /> ENTER DEMO WORKSPACE <ArrowRight size={15} /></button><p className="demo-note"><AlertCircle size={13} /> Sample data only. Demo mode is not authentication and must never be used for real evidence.</p></div><div className="auth-panel-foot"><span className="mono"><LockKeyhole size={12} /> {health?.database === 'connected' ? 'DATABASE CONNECTED' : 'BACKEND CONFIGURATION REQUIRED'}</span><span className="mono">TLS REQUIRED IN PRODUCTION</span></div></section></div><footer className="login-footer"><span>┬⌐ 2026 CrimeSketch.io</span><span>AUTHORIZED ACCESS ONLY</span><span className="mono">INTEGRITY / TRACEABILITY / REVIEW</span></footer></div>;
}

function PageHeading({ eyebrow, title, description, action }) { return <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>; }
function SectionLabel({ children, trailing }) { return <div className="section-label"><span>{children}</span>{trailing && <span className="section-trailing">{trailing}</span>}</div>; }
function Dashboard({ cases, user, isDemo, statuses, health, openCase, goToNewCase, go, setNotice }) {
  const solvedCount = cases.filter(c => c.status === 'complete' || c.status === 'archived').length;
  const ongoingCount = cases.filter(c => !['complete', 'archived'].includes(c.status)).length;
  const recentCases = cases.slice(0, 4);
  return <>
    <section className="cs-dashboard-heading">
      <div><div className="eyebrow"><span className="eyebrow-line"/>SECURE CASEWORK / HOME</div><h1>INVESTIGATIONS<span>.</span><br/>OVERVIEW</h1><p>Welcome back, <strong>{user?.fullName || 'Investigator'}</strong>. Manage case records, review witness evidence, and move investigations through a traceable workflow.</p></div>
      <PrimaryButton icon={Plus} onClick={goToNewCase}>CREATE CASE</PrimaryButton>
    </section>
    {isDemo && <div className="demo-warning"><AlertCircle size={17}/><div><strong>DEMO ENVIRONMENT</strong><span>Sample cases and browser-state actions are for demonstration only. Do not enter real evidence while using demo mode.</span></div><button onClick={() => setNotice({ type: 'info', message: 'Configure PostgreSQL, email OTP, and AI provider environment variables. See README.md.' })}>CONFIGURE <ArrowRight size={14}/></button></div>}
    <div className="cs-counter-grid"><div className="cs-counter"><strong>{String(solvedCount).padStart(2,'0')}</strong><span>Cases solved</span></div><div className="cs-counter"><strong>{String(ongoingCount).padStart(2,'0')}</strong><span>Ongoing cases</span></div></div>
    <div className="metadata-strip"><div><span className="meta-key">ACTIVE USER</span><strong>{user?.fullName || 'Investigator'}</strong></div><div><span className="meta-key">ROLE</span><strong>{String(user?.role || 'investigator').toUpperCase()}</strong></div><div><span className="meta-key">WORKSPACE MODE</span><strong className={isDemo ? 'accent-text' : 'text-green'}>{isDemo ? 'DEMO / SAMPLE DATA' : 'LIVE / AUTHENTICATED'}</strong></div><div><span className="meta-key">DATABASE</span><strong>{health?.database === 'connected' ? 'CONNECTED' : 'NOT CONNECTED'}</strong></div></div>
    <div className="cs-section-title"><h2>Recent investigations</h2><button className="link-button" onClick={() => go('cases')}>VIEW ALL CASES <ArrowRight size={14}/></button></div>
    {recentCases.length ? <div className="cs-case-cards">{recentCases.map((c,i) => <button className="cs-case-card" key={c.id} onClick={() => openCase(c)}><span className="row-index mono">/{String(i+1).padStart(2,'0')}</span><div className="cs-case-card-main"><strong>{c.title}</strong><small className="mono">{c.id} ┬╖ {c.updated || 'Recently updated'}</small></div><Status status={c.status}/><ChevronRight size={16}/></button>)}</div> : <div className="cs-empty">No cases yet. Select <strong>Create Case</strong> to start a new investigation.</div>}
    <div className="cs-section-title"><h2>Investigation workflow</h2><span className="mono faint">01 ΓÇö 06</span></div>
    <section className="surface-panel workflow-panel"><div className="workflow-track">{['Case details','Evidence','Description','Sketch','Review','Output'].map((label,i)=><div className="workflow-step" key={label}><div className={`workflow-number ${i===0?'done':''}`}>{i===0?<Check size={14}/>:String(i+1).padStart(2,'0')}</div><div><strong>{label}</strong><span>{['Case context and permissions','Text, audio, images, PDFs','Confirm extracted attributes','Generate / refine','Investigator approval','3D model and PDF report'][i]}</span></div></div>)}</div></section>
    <div className="screen-bottom-note"><span>+</span><span>GENERATED SKETCHES ARE INVESTIGATIVE AIDS, NOT VERIFIED IDENTITIES.</span><span className="mono">FOOTNOTE / 001</span></div>
  </>;
}

function AboutPage({ go }) {
  return <><PageHeading eyebrow="PROJECT / INFORMATION" title={<>ABOUT<br/><span className="heading-light">CRIMESKETCH.</span></>} description="A structured investigation workspace designed to organize witness descriptions and evidence, support sketch iteration, and maintain traceable case outputs."/><div className="cs-about-grid"><section className="cs-about-card"><ShieldCheck size={22}/><h3>Controlled casework</h3><p>Case records and evidence belong in the appropriate authenticated workflow. Live access is governed by backend permissions.</p></section><section className="cs-about-card"><BrainCircuit size={22}/><h3>AI-assisted workflow</h3><p>AI services may help process descriptions and generate sketch candidates when configured. Investigator review remains essential.</p></section><section className="cs-about-card"><History size={22}/><h3>Traceable outputs</h3><p>Case actions, sketch versions, and reports are intended to support a clear review history and audit trail.</p></section></div><div style={{marginTop:24}}><PrimaryButton icon={FolderOpen} onClick={() => go('cases')}>OPEN CASES</PrimaryButton></div></>;
}

function StatBox({ label, value, icon: Icon, note }) { return <div className="stat-box"><div className="stat-top"><span>{label}</span><Icon size={17} /></div><div className="stat-value">{value}<span className="stat-dash">/</span></div><div className="stat-note">{note}</div></div>; }

function CasesPage({ cases, filteredCases, searchTerm, setSearchTerm, caseFilter, setCaseFilter, openCase, goToNewCase }) {
  const [sortBy, setSortBy] = useState('updated');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  useEffect(() => setPage(1), [searchTerm, caseFilter, sortBy]);
  const sortedCases = [...filteredCases].sort((a,b) => sortBy === 'title' ? a.title.localeCompare(b.title) : sortBy === 'status' ? String(a.status).localeCompare(String(b.status)) : String(b.updated).localeCompare(String(a.updated)));
  const pageCount = Math.max(1, Math.ceil(sortedCases.length / pageSize));
  const visibleCases = sortedCases.slice((page-1)*pageSize, page*pageSize);
  const filters = [{ label: 'ALL CASES', value: 'all' }, { label: 'EVIDENCE', value: 'evidence' }, { label: 'DESCRIPTION', value: 'description' }, { label: 'SKETCH', value: 'sketch' }, { label: 'REVIEW', value: 'review' }, { label: 'COMPLETE', value: 'complete' }];
  return <><PageHeading eyebrow="RECORDS / AUTHORIZED VIEW" title={<>CASE<br/><span className="heading-light">REGISTER.</span></>} description="Search and open cases available to your account. Access is checked by the backend in live mode." action={<PrimaryButton icon={Plus} onClick={goToNewCase}>CREATE CASE</PrimaryButton>} /><div className="case-register-toolbar"><div className="search-field"><Search size={16} /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search case ID, title, investigatorΓÇª" /></div><div className="filter-select"><SlidersHorizontal size={15} /><select value={caseFilter} onChange={e => setCaseFilter(e.target.value)}>{filters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}</select><ChevronDown size={14} /></div><div className="filter-select sort-select"><span className="mono">SORT</span><select value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="updated">LAST UPDATED</option><option value="title">TITLE AΓÇôZ</option><option value="status">STATUS</option></select><ChevronDown size={14} /></div></div><div className="filter-tabs">{filters.map(f => <button key={f.value} onClick={() => setCaseFilter(f.value)} className={caseFilter === f.value ? 'selected' : ''}>{f.label}<span>{f.value === 'all' ? cases.length : cases.filter(c => c.status === f.value).length}</span></button>)}</div><section className="surface-panel register-panel"><div className="register-header"><span>CASE / TITLE</span><span>ASSIGNED</span><span>EVIDENCE</span><span>STATUS</span><span>UPDATED</span><span /></div>{visibleCases.length ? visibleCases.map((c,i) => <button className="register-row" key={c.id} onClick={() => openCase(c)}><div className="register-title"><span className="row-index mono">/{String((page-1)*pageSize+i+1).padStart(2,'0')}</span><div><strong>{c.title}</strong><span className="mono case-id">{c.id}</span><small>{c.location || 'Location not provided'}</small></div></div><span>{c.investigator || 'Unassigned'}</span><span className="mono evidence-number">{String(c.evidence || 0).padStart(2,'0')} FILES</span><Status status={c.status} /><span className="mono register-date">{c.updated}</span><ChevronRight size={16} /></button>) : <div className="empty-state"><FolderOpen size={26} /><strong>No cases found</strong><span>Try another search term or filter.</span></div>}<div className="register-foot"><span className="mono">{filteredCases.length ? (page-1)*pageSize+1 : 0}ΓÇô{Math.min(page*pageSize, sortedCases.length)} OF {sortedCases.length} CASES</span><div className="pagination-controls"><button disabled={page<=1} onClick={() => setPage(p=>Math.max(1,p-1))} aria-label="Previous page"><ChevronLeft size={14}/></button><span className="mono">{String(page).padStart(2,'0')} / {String(pageCount).padStart(2,'0')}</span><button disabled={page>=pageCount} onClick={() => setPage(p=>Math.min(pageCount,p+1))} aria-label="Next page"><ChevronRight size={14}/></button></div></div></section><p className="note-inline"><ShieldCheck size={15} /> Case availability is governed by role permissions and case-level access. Demo records are example data only.</p></>;
}
function NewCasePage({ newCaseForm, setNewCaseForm, createCase, go }) {
  const set = (k,v) => setNewCaseForm(f => ({ ...f, [k]: v }));
  return <><button className="back-link" onClick={() => go('dashboard')}><ArrowLeft size={15} /> BACK TO OVERVIEW</button><PageHeading eyebrow="INTAKE / STEP 01" title={<>OPEN A<br /><span className="heading-light">NEW CASE.</span></>} description="Create a case record before adding evidence. Only enter information you are authorized to handle." /><form onSubmit={createCase} className="new-case-layout"><section className="surface-panel form-panel"><div className="panel-heading"><div><SectionLabel>CASE METADATA</SectionLabel><h2>Investigation details</h2></div><span className="mono faint">01 / 06</span></div><div className="form-grid"><Field label="CASE TITLE" value={newCaseForm.title} onChange={v => set('title',v)} placeholder="e.g. North District / Witness statement" required /><Field label="INCIDENT LOCATION / LABEL" value={newCaseForm.location} onChange={v => set('location',v)} placeholder="District, unit, or location label" /><Field label="INCIDENT DATE" type="date" value={newCaseForm.incidentDate} onChange={v => set('incidentDate',v)} /><Field label="NUMBER OF WITNESSES" type="number" value={newCaseForm.numberOfWitnesses ?? 0} onChange={v => set('numberOfWitnesses', Math.max(0, Number(v) || 0))} placeholder="Enter number of witnesses" /><Field label="NUMBER OF EVIDENCE ITEMS FOUND" type="number" value={newCaseForm.evidenceFound ?? 0} onChange={v => set('evidenceFound', Math.max(0, Number(v) || 0))} placeholder="Enter number of evidence items" /><Field label="CASE CLASSIFICATION" value={newCaseForm.classification || 'RESTRICTED'} onChange={v => set('classification',v)} options={['RESTRICTED','CONFIDENTIAL','INTERNAL']} help="Classification options depend on your institution's policy." /><div className="span-two"><Field label="INTAKE NOTES" type="textarea" value={newCaseForm.notes} onChange={v => set('notes',v)} placeholder="Record initial context only. Avoid unsupported conclusions." /></div></div><div className="form-footer"><span className="required-note"><b>*</b> REQUIRED FIELD</span><div><button type="button" className="btn btn-outline" onClick={() => go('dashboard')}>CANCEL</button><PrimaryButton type="submit" icon={ArrowRight}>CREATE CASE & CONTINUE</PrimaryButton></div></div></section><aside className="surface-panel form-aside"><div className="aside-symbol"><FolderOpen size={22} /></div><SectionLabel>WORKFLOW / NEXT</SectionLabel><h3>Case created.<br />Evidence next.</h3><p>After creation, add witness statements, voice recordings, images, or supporting documents. The next stage lets you review extracted details before any sketch is generated.</p><div className="aside-steps"><div className="aside-step active"><span>01</span><div><strong>Case details</strong><small>Required to begin</small></div><Check size={14} /></div><div className="aside-step"><span>02</span><div><strong>Evidence intake</strong><small>Upload / text / audio</small></div></div><div className="aside-step"><span>03</span><div><strong>Description review</strong><small>Confirm facts</small></div></div></div><div className="aside-warning"><AlertCircle size={15} /> Do not upload real evidence while using demo mode.</div></aside></form></>;
}

function CaseWorkspace({ activeCase, isDemo, uploadKind, setUploadKind, textEvidence, setTextEvidence, selectedFiles, setSelectedFiles, handleFiles, fileInput, saveEvidence, setFeature, confirmDescription, updateCase, setRoute, addActivity, go, setNotice }) {
  const [tab, setTab] = useState('evidence');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [translated, setTranslated] = useState('');
  const [translateBusy, setTranslateBusy] = useState(false);
  const f = { ...blankFeatures, ...(activeCase.features || {}) };
  const canConfirm = Object.values(f).some(v => String(v || '').trim()) || (activeCase.transcript || textEvidence).trim();
  const translate = async () => {
    // Prefer the text currently being edited; otherwise use the saved case transcript.
    const source = textEvidence.trim() || activeCase.transcript || ''; 
    if (!source.trim()) return setNotice({ type: 'error', message: 'Add a witness statement before requesting translation.' });
    if (isDemo) return setNotice({ type: 'warning', message: 'Translation model is not connected in demo mode. Original text has been preserved.' });
    setTranslateBusy(true);
    try { const response = await fetch('/api/ai/translate', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: source }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Translation unavailable.'); setTranslated(result.englishText); }
    catch (e) { setNotice({ type: 'error', message: e.message }); } finally { setTranslateBusy(false); }
  };
  const stage = ['evidence','description','sketch','review','complete'];
  const currentIndex = activeCase.status === 'archived' ? 0 : Math.max(0, stage.indexOf(activeCase.status));
  return <><div className="case-heading-row"><button className="back-link" onClick={() => go('cases')}><ArrowLeft size={15} /> CASE REGISTER</button><div className="case-tools"><Status status={activeCase.status} /><span className="mono case-ref">CASE / {activeCase.id}</span><IconButton icon={Ellipsis} label="Case actions" onClick={() => setDetailsOpen(v => !v)} /></div></div><PageHeading eyebrow="INVESTIGATION / ACTIVE RECORD" title={<>{activeCase.title.split('/')[0].trim().toUpperCase()}<span className="accent-dot">.</span><br /><span className="heading-light">CASE WORKSPACE</span></>} description={activeCase.summary || 'Review evidence and maintain the provenance of each case action.'} action={<PrimaryButton variant="outline" icon={History} onClick={() => setDetailsOpen(v => !v)}>CASE DETAILS</PrimaryButton>} /><div className="case-meta-grid"><div><span className="meta-key">CASE ID</span><strong className="mono">{activeCase.id}</strong></div><div><span className="meta-key">ASSIGNED INVESTIGATOR</span><strong>{activeCase.investigator || 'Not assigned'}</strong></div><div><span className="meta-key">LOCATION LABEL</span><strong>{activeCase.location || 'Not provided'}</strong></div><div><span className="meta-key">LAST UPDATED</span><strong className="mono">{activeCase.updated}</strong></div></div><div className="stepper">{[{ label:'CASE DETAILS', stage:'evidence' },{label:'EVIDENCE',stage:'evidence'},{label:'DESCRIPTION',stage:'description'},{label:'SKETCH',stage:'sketch'},{label:'REVIEW',stage:'review'},{label:'OUTPUT',stage:'complete'}].map((s,i) => <div key={s.label} className={`stepper-item ${((activeCase.status==='evidence' && i===0) || (i < currentIndex+1)) ? 'step-complete' : ''} ${(i===0&&activeCase.status==='evidence') || (s.stage===activeCase.status && i>0) ? 'step-current' : ''}`}><span>{i < currentIndex+1 ? <Check size={12}/> : String(i+1).padStart(2,'0')}</span><b>{s.label}</b></div>)}</div><div className="workspace-tabs"><button className={tab==='evidence'?'active':''} onClick={() => setTab('evidence')}><Paperclip size={15}/> EVIDENCE / INPUTS</button><button className={tab==='description'?'active':''} onClick={() => setTab('description')}><SlidersHorizontal size={15}/> FACIAL DESCRIPTION</button><button className={tab==='history'?'active':''} onClick={() => setTab('history')}><History size={15}/> HISTORY <span>{(activeCase.history || []).length}</span></button></div>
    {tab === 'evidence' && <div className="workspace-main-grid"><div className="workspace-primary"><section className="surface-panel evidence-panel"><div className="panel-heading"><div><SectionLabel trailing="01 / INTAKE">EVIDENCE / INGESTION</SectionLabel><h2>Witness input</h2></div><span className="mono faint">MAX 25 MB / FILE</span></div><div className="input-mode-tabs">{[{id:'text',label:'TEXT',icon:MessageSquareText},{id:'voice',label:'VOICE',icon:Mic},{id:'image',label:'IMAGE',icon:FileImage},{id:'pdf',label:'PDF',icon:FileText}].map(it => { const Icon=it.icon; return <button className={uploadKind===it.id?'active':''} onClick={() => setUploadKind(it.id)} key={it.id}><Icon size={17}/>{it.label}</button>; })}</div>{uploadKind === 'text' ? <div className="text-evidence-box"><label className="field"><span className="field-label">WITNESS DESCRIPTION / ORIGINAL TEXT</span><textarea value={textEvidence || activeCase.transcript || ''} onChange={e => setTextEvidence(e.target.value)} rows={7} placeholder="Enter the witness statement in its original language (Hindi, Kannada, Tamil, Telugu, English, etc.). Preserve the witnessΓÇÖs exact words and uncertainty." /></label><div className="text-evidence-footer"><span className="mono">{textEvidence.length} CHARACTERS</span><span>Original statement retained for review</span></div></div> : <button className="drop-zone" onClick={() => fileInput.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}><input ref={fileInput} type="file" multiple accept={uploadKind==='voice'?'audio/*,video/mp4':uploadKind==='image'?'image/*':uploadKind==='pdf'?'.pdf':'.pdf,image/*,audio/*,.txt'} hidden onChange={e => { handleFiles(e.target.files); e.target.value=''; }} /><div className="drop-icon">{uploadKind==='voice'?<AudioLines size={22}/>:uploadKind==='image'?<ImageIcon size={22}/>:<FileText size={22}/>}</div><strong>DROP FILES TO INGEST</strong><span>or select from this device</span><small>PDF ┬╖ PNG ┬╖ JPG ┬╖ WEBP ┬╖ WAV ┬╖ MP3 ┬╖ M4A ┬╖ TXT / 25 MB max</small><span className="drop-cta"><Upload size={14}/> SELECT FILES</span></button>}{selectedFiles.length>0 && <div className="selected-files"><div className="selected-files-header"><span>SELECTED FILES ({selectedFiles.length})</span><button onClick={() => setSelectedFiles([])}>REMOVE ALL</button></div>{selectedFiles.map(item => <div className="selected-file" key={item.id}><div className="file-kind-icon">{item.kind==='audio'?<FileAudio size={16}/>:item.kind==='image'?<FileImage size={16}/>:<FileText size={16}/>}</div><div className="selected-file-info"><strong>{item.file.name}</strong><span className="mono">{(item.file.size/1024).toFixed(1)} KB ┬╖ READY FOR REVIEW</span></div><IconButton icon={X} label="Remove file" onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== item.id))} /></div>)}</div>}<div className="evidence-action-row"><div className="evidence-security"><LockKeyhole size={15}/><span>Private storage is available only in configured live mode. Demo files remain in browser memory.</span></div><PrimaryButton icon={Upload} onClick={saveEvidence}>SAVE EVIDENCE</PrimaryButton></div>{(activeCase.evidenceItems || []).length > 0 && <div className="evidence-history-list"><div className="evidence-history-head"><span>CASE EVIDENCE / SAVED ITEMS</span><span className="mono">{String(activeCase.evidenceItems.length).padStart(2,'0')} ITEMS</span></div>{activeCase.evidenceItems.map(item => <div className="evidence-history-row" key={item.id}><div className="file-kind-icon">{item.kind==='audio'?<FileAudio size={16}/>:item.kind==='image'?<FileImage size={16}/>:<FileText size={16}/>}</div><div className="evidence-history-name"><strong>{item.original_name || item.name}</strong><span className="mono">{item.mime_type || item.kind} ┬╖ {Math.max(0, Number(item.size_bytes || 0)/1024).toFixed(1)} KB ┬╖ {item.demo ? 'DEMO ONLY' : item.status || 'SAVED'}</span></div>{item.downloadUrl ? <a className="evidence-download" href={item.downloadUrl} target="_blank" rel="noreferrer" aria-label={`Download ${item.original_name}`}><Download size={14}/> DOWNLOAD</a> : <span className="mono evidence-private-note">NOT PERSISTED</span>}</div>)}</div>}</section><section className="surface-panel transcript-panel"><div className="panel-heading"><div><SectionLabel>TEXT PROCESSING</SectionLabel><h2>Transcript & translation</h2></div><span className="provider-tag"><Globe size={13}/> LANGUAGE / EN</span></div><div className="transcript-columns"><div className="transcript-column"><div className="transcript-subhead"><span>ORIGINAL / SOURCE</span><span className="status status-neutral"><i/>SOURCE</span></div><p>{textEvidence.trim() || activeCase.transcript || 'No source statement saved. Add text evidence above to begin.'}</p></div><div className="transcript-column translated-column"><div className="transcript-subhead"><span>ENGLISH / TRANSLATION</span><span className="status status-neutral"><i/>{translated ? 'REVIEW' : 'NOT RUN'}</span></div><p>{translated || (isDemo ? 'Demo mode does not call the translation service. Open a live case with the backend and translation model configured to translate Hindi, Kannada, Tamil, Telugu, or other supported languages.' : 'Submit a source statement and run translation when the configured service is available.')}</p>{!isDemo && <button className="link-button" onClick={translate} disabled={translateBusy}>{translateBusy?'PROCESSINGΓÇª':'TRANSLATE TO ENGLISH'} <ArrowRight size={14}/></button>}</div></div>{(!isDemo) && <div className="transcript-note"><AlertCircle size={14}/> Translation must be reviewed against the original before confirmation.</div>}</section></div><aside className="workspace-aside"><div className="surface-panel aside-case-panel"><div className="aside-case-head"><SectionLabel>CASE SUMMARY</SectionLabel><button className="icon-link" onClick={() => setDetailsOpen(v=>!v)}><ChevronDown size={15}/></button></div>{detailsOpen && <><div className="summary-id mono">{activeCase.id}</div><h3>{activeCase.title}</h3><p>{activeCase.notes || 'No intake notes provided.'}</p><div className="summary-stats"><div><span>EVIDENCE ITEMS</span><strong>{String(activeCase.evidence || 0).padStart(2,'0')}</strong></div><div><span>WITNESSES</span><strong>{String(activeCase.numberOfWitnesses ?? activeCase.number_of_witnesses ?? 0).padStart(2,'0')}</strong></div></div><div className="aside-mini-meta"><span>OWNER</span><strong>{activeCase.investigator || 'Not assigned'}</strong></div><div className="aside-mini-meta"><span>CLASSIFICATION</span><strong>{activeCase.classification || 'RESTRICTED'}</strong></div></>}</div><button type="button" className="surface-panel next-stage-panel next-stage-panel-large" onClick={() => setTab('description')}><span className="next-stage-icon"><SlidersHorizontal size={24}/></span><SectionLabel>UP NEXT / 03</SectionLabel><h3>Confirm facial description</h3><p>Review the witness details and confirm only what the source statement supports.</p><span className="next-stage-action">OPEN FACIAL DESCRIPTION <ArrowRight size={16}/></span></button></aside></div>}
    {tab === 'description' && <div className="description-layout"><section className="surface-panel description-form-panel"><div className="panel-heading"><div><SectionLabel trailing="02 / STRUCTURED INPUT">FACIAL DESCRIPTION</SectionLabel><h2>Confirm extracted attributes</h2></div><Status status="warning">NEEDS REVIEW</Status></div><div className="source-quote"><div className="quote-mark">ΓÇ£</div><div><span className="mono">SOURCE STATEMENT</span><p>{textEvidence.trim() || activeCase.transcript || 'No source statement recorded yet.'}</p></div></div><div className="form-grid">{fields.map(field => <div key={field.key} className={field.key==='notes'?'span-two':''}>{field.options ? <Field label={field.label} value={f[field.key]} onChange={v => setFeature(field.key,v)} options={field.options}/> : <Field label={field.label} value={f[field.key]} onChange={v => setFeature(field.key,v)} placeholder={field.placeholder} type={field.key==='notes'?'textarea':'text'} />}</div>)}</div><div className="form-footer"><span className="required-note">MISSING VALUES WILL STAY ΓÇ£NOT PROVIDEDΓÇ¥</span><PrimaryButton icon={CheckCircle2} onClick={confirmDescription} disabled={!canConfirm}>CONFIRM & CONTINUE</PrimaryButton></div></section></div>}
    {tab === 'history' && <HistoryPanel activeCase={activeCase} />}
  </>;
}

function HistoryPanel({ activeCase }) { const events = activeCase.history || []; return <section className="surface-panel history-panel"><div className="panel-heading"><div><SectionLabel>PROVENANCE / CASE HISTORY</SectionLabel><h2>Recorded activity</h2></div><Mono>{events.length.toString().padStart(2,'0')} EVENTS</Mono></div>{events.length ? <div className="history-timeline">{events.map((e,i)=><div className="history-event" key={e.id || i}><div className="history-node"/><div className="history-event-main"><strong>{e.action}</strong><span>{e.detail || 'No additional detail.'}</span></div><span className="mono history-date">{e.at}</span></div>)}</div> : <div className="empty-state"><History size={25}/><strong>No activity in local history</strong><span>Case events will appear here after actions are performed.</span></div>}</section>; }

function SketchStudio({ activeCase, isDemo, generateSketch, sketchPreview, setSketchPreview, refineDraft, setRefineDraft, submitRefinement, refineBusy, approveSketch, restoreSketch, confirmDescription, setRoute, updateCase, addActivity, setNotice }) {
  const [compare, setCompare] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedSketchId, setSelectedSketchId] = useState(null);
  useEffect(() => { setSelectedSketchId(null); }, [activeCase.id, activeCase.sketches?.[0]?.id]);
  const selectedSketch = (activeCase.sketches || []).find(s => s.id === selectedSketchId) || activeCase.sketches?.[0];
  const selectedIndex = selectedSketch ? (activeCase.sketches || []).findIndex(s => s.id === selectedSketch.id) : -1;
  const comparisonSketch = selectedIndex >= 0 ? activeCase.sketches?.[selectedIndex + 1] : null;
  const attrs = Object.entries(activeCase.features || {}).filter(([,v]) => String(v || '').trim());
  return <>
    <div className="case-heading-row"><button className="back-link" onClick={() => setRoute('case')}><ArrowLeft size={15}/> CASE WORKSPACE</button><div className="case-tools"><span className="mono case-ref">CASE / {activeCase.id}</span><Status status="warning">PROVIDER STATUS</Status></div></div>
    <PageHeading eyebrow="IMAGE SYNTHESIS / HUMAN REVIEW" title={<>SKETCH<br/><span className="heading-light">STUDIO.</span></>} description="Generate and refine a candidate sketch from investigator-confirmed attributes. No image-generation provider is connected by default." action={<PrimaryButton icon={FileText} variant="outline" disabled={!isDemo && !activeCase.sketches?.some(s => s.status === 'approved')} onClick={() => setRoute('report')}>OUTPUTS</PrimaryButton>} />
    <div className="sketch-status-banner"><div className="status-pulse"><AlertCircle size={18}/></div><div><strong>{isDemo ? 'STABLE DIFFUSION 1.5 / NOT CONNECTED' : 'IMAGE GENERATION PROVIDER'}</strong><span>{isDemo ? 'The studio is ready for review, but no model-generated sketch will be fabricated in demo mode.' : 'Generation requires a configured Stable Diffusion WebUI-compatible provider. Requests are not marked successful until a real image is returned.'}</span></div><Mono>IMG / SD15</Mono></div>
    <div className="sketch-studio-grid">
      <section className="surface-panel sketch-canvas-panel">
        <div className="canvas-header"><div><SectionLabel>OUTPUT CANVAS / PRIMARY</SectionLabel><h2>Candidate sketch</h2></div><div className="canvas-tools"><button className={`tool-button ${compare?'active':''}`} onClick={() => setCompare(v=>!v)}><SlidersHorizontal size={14}/> COMPARE</button><IconButton icon={Download} label="Export sketch" disabled={!selectedSketch?.url} onClick={() => { if (selectedSketch?.url) window.open(selectedSketch.url, '_blank', 'noopener'); }} /></div></div>
        <div className="sketch-canvas"><div className="canvas-corners"><i/><i/><i/><i/></div>{sketchPreview && <div className="canvas-demo-watermark">DEMO / NO MODEL OUTPUT</div>}
          {selectedSketch?.url ? <div className={`generated-sketch-wrap ${compare && comparisonSketch?.url ? 'compare-mode' : ''}`}>
            {compare && comparisonSketch?.url && <figure className="compare-figure"><img className="generated-sketch" src={comparisonSketch.url} alt={`Sketch version ${comparisonSketch.version}`}/><figcaption>PREVIOUS / V{String(comparisonSketch.version).padStart(2,'0')}</figcaption></figure>}
            <figure className="current-figure"><img className="generated-sketch" src={selectedSketch.url} alt={`Candidate sketch version ${selectedSketch.version}`}/><figcaption>{selectedSketch.status === 'approved' ? 'APPROVED' : 'SELECTED'} / V{String(selectedSketch.version).padStart(2,'0')}</figcaption></figure>
            <div className="generated-sketch-label"><span className="mono">VERSION / {String(selectedSketch.version).padStart(2,'0')}</span><span className="mono">{String(selectedSketch.status || 'candidate').toUpperCase()} ┬╖ REVIEW REQUIRED</span></div>
          </div> : <div className="sketch-empty-art"><div className="crosshair crosshair-a"/><div className="crosshair crosshair-b"/><div className="sketch-frame-icon"><ImageIcon size={28}/></div><strong>NO GENERATED IMAGE</strong><span>Image output will appear here after Stable Diffusion 1.5 successfully returns an artifact.</span><div className="mono sketch-empty-meta">CANVAS / 512 ├ù 512 TARGET</div></div>}
        </div>
        <div className="canvas-footer"><span className="mono">{selectedSketch ? `VERSION ${String(selectedSketch.version).padStart(2,'0')}` : sketchPreview ? 'DEMO PREVIEW REQUESTED' : 'NO SKETCH VERSION'}</span><span className="mono">{selectedSketch ? `CREATED / ${String(selectedSketch.at || '').slice(0,19)}` : 'CREATED / ΓÇö'}</span><span className="mono">MODEL / SD 1.5</span></div>
        <div className="sketch-actions"><PrimaryButton icon={Sparkles} onClick={generateSketch}>GENERATE SKETCH</PrimaryButton><button className="btn btn-outline" onClick={generateSketch}>GENERATE ALTERNATIVE</button><button className="btn btn-ghost" onClick={() => setShowVersions(v => !v)}><History size={15}/> VERSION HISTORY <span className="version-count">{activeCase.sketches?.length || 0}</span></button></div>
        {compare && (!comparisonSketch?.url || !selectedSketch?.url) && <div className="compare-notice"><SlidersHorizontal size={15}/> Comparison requires two real sketch versions.</div>}
        {showVersions && <div className="version-history-list"><div className="version-list-heading"><span>GENERATED VERSIONS</span><span className="mono">{(activeCase.sketches || []).length.toString().padStart(2,'0')} RECORDS</span></div>
          {(activeCase.sketches || []).length ? activeCase.sketches.map(sk => <div className={`version-list-row ${selectedSketch?.id === sk.id ? 'selected' : ''}`} key={sk.id}><button className="version-select" onClick={() => setSelectedSketchId(sk.id)}><span className="version-bullet">{selectedSketch?.id === sk.id ? <Check size={12}/> : String(sk.version).padStart(2,'0')}</span><span><strong>Version {String(sk.version).padStart(2,'0')}</strong><small className="mono">{String(sk.at || '').slice(0,19)} ┬╖ {String(sk.model || sk.model_name || 'Stable Diffusion 1.5')}</small></span><Status status={sk.status === 'approved' ? 'complete' : 'warning'}>{sk.status || 'candidate'}</Status></button>{!isDemo && <button className="restore-version" onClick={() => restoreSketch(sk.id)} title="Restore this version as a new version">RESTORE <RefreshCcw size={12}/></button>}</div>) : <div className="version-empty">No generated sketch versions are saved yet.</div>}
        </div>}
      </section>
      <aside className="sketch-side-column">
        <section className="surface-panel attributes-mini"><div className="panel-heading"><div><SectionLabel>INPUT / CONFIRMED FIELDS</SectionLabel><h2>Sketch attributes</h2></div><span className="mono">{attrs.length.toString().padStart(2,'0')}</span></div>{attrs.length ? attrs.map(([key,value])=><div className="attribute-row" key={key}><span>{fields.find(f=>f.key===key)?.label || key}</span><strong>{value}</strong></div>) : <div className="attribute-empty"><AlertCircle size={16}/><span>No confirmed attributes entered. Return to the description form and review the source statement.</span></div>}<button className="link-button" onClick={() => setRoute('case')}>EDIT DESCRIPTION <ArrowRight size={14}/></button></section>
        <section className="surface-panel refinement-panel"><div className="panel-heading"><div><SectionLabel>ITERATION / 01</SectionLabel><h2>Refinement assistant</h2></div><span className="assistant-dot"/></div><div className="refinement-scope"><Sparkles size={14}/><span>FACIAL ATTRIBUTES ONLY</span></div><div className="refinement-messages"><div className="assistant-message"><div className="assistant-avatar"><BrainCircuit size={15}/></div><div><span className="mono">ASSISTANT / STATUS</span><p>{isDemo ? 'I can record a refinement request in the demo interface. Gemma 4 and the image-generation service are not connected here, so no image will be altered.' : 'Send a focused modification. The provider must return a new image before this workspace can record a successful refinement.'}</p></div></div>{(activeCase.messages || []).filter(m => m.role === 'user' && m.content.toLowerCase().includes('make')).slice(-2).map((m,i)=><div className="refinement-user-message" key={i}><span className="mono">REQUEST / {i+1}</span><p>{m.content}</p></div>)}</div><form className="refinement-compose" onSubmit={submitRefinement}><textarea value={refineDraft} onChange={e=>setRefineDraft(e.target.value)} placeholder="Describe one specific facial adjustmentΓÇª" rows={3}/><div className="compose-footer"><span className="mono">NO IDENTITY MATCHING</span><button disabled={refineBusy || !refineDraft.trim()} type="submit" aria-label="Send refinement request">{refineBusy?<RefreshCcw size={16} className="spin"/>:<Send size={16}/>}</button></div></form><div className="refinement-examples"><span>EXAMPLES</span><button onClick={()=>setRefineDraft('Make the jawline slightly wider.')}>Wider jawline</button><button onClick={()=>setRefineDraft('Make the eyebrows thicker.')}>Thicker brows</button><button onClick={()=>setRefineDraft('Make the nose narrower.')}>Narrower nose</button></div></section>
      </aside>
    </div>
    <div className="approval-bar"><div><ShieldCheck size={18}/><div><strong>HUMAN REVIEW REQUIRED</strong><span>{isDemo ? 'Demo mode cannot approve a generated sketch.' : selectedSketch?.url ? 'Review the selected image and explicitly approve it before final output.' : 'Approval remains unavailable until an actual sketch has been generated and reviewed.'}</span></div></div><PrimaryButton disabled={isDemo || !selectedSketch?.url} onClick={() => approveSketch(selectedSketch.id)}>APPROVE FINAL SKETCH <Check size={16}/></PrimaryButton></div>
  </>;
}
function BoxIcon() { return <div className="cube-icon"><span/><span/><span/><span/></div>; }

function AuditPage({ auditRows, filteredAudit, auditSearch, setAuditSearch, auditAction, setAuditAction, isDemo, user, setNotice }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => setPage(1), [auditSearch, auditAction]);
  const pages = Math.max(1, Math.ceil(filteredAudit.length / pageSize));
  const visibleAudit = filteredAudit.slice((page-1)*pageSize, page*pageSize);
  const actions = ['all', ...new Set(auditRows.map(a => a.action))];
  const exportCsv = () => { if (isDemo) { setNotice({type:'warning',message:'CSV export contains demo audit rows only. These are not server-generated audit records.'}); } const cols = ['happened_at','user_email','role','action','case_id','resource','source_ip','outcome']; const csv = [cols.join(','), ...filteredAudit.map(r => cols.map(c => `"${String(r[c] ?? '').replaceAll('"','""')}"`).join(','))].join('\r\n'); const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ai-nexus-audit-${new Date().toISOString().slice(0,10)}${isDemo?'-DEMO':''}.csv`; a.click(); URL.revokeObjectURL(a.href); };
  return <><PageHeading eyebrow="SECURITY / TRACEABILITY" title={<>AUDIT<span className="accent-dot">.</span><br/><span className="heading-light">ACTIVITY LOG</span></>} description="Review access and workflow events visible to your current role." action={<PrimaryButton icon={Download} variant="outline" onClick={exportCsv}>EXPORT CSV</PrimaryButton>} /><div className="audit-security-banner"><ShieldCheck size={20}/><div><strong>{isDemo?'SAMPLE LOG DATA':'SERVER-SIDE AUDIT EVENTS'}</strong><span>{isDemo?'Rows are illustrative demo events and do not establish real authentication or activity.':'Audit entries are read from the configured database with role-based authorization.'}</span></div><span className="mono">UTC / TIMESTAMP</span></div><div className="audit-toolbar"><div className="search-field"><Search size={16}/><input value={auditSearch} onChange={e=>setAuditSearch(e.target.value)} placeholder="Search user, case ID, actionΓÇª"/></div><div className="filter-select"><SlidersHorizontal size={15}/><select value={auditAction} onChange={e=>setAuditAction(e.target.value)}><option value="all">ALL ACTIONS</option>{actions.filter(a=>a!=='all').map(a=><option key={a} value={a}>{a.toUpperCase()}</option>)}</select><ChevronDown size={14}/></div></div><section className="surface-panel audit-table-panel"><div className="audit-table-scroll"><table className="audit-table"><thead><tr><th>TIMESTAMP / UTC</th><th>USER / ROLE</th><th>ACTION</th><th>CASE / RESOURCE</th><th>SOURCE IP</th><th>OUTCOME</th></tr></thead><tbody>{visibleAudit.map((row,i)=><tr key={row.id || i}><td className="mono audit-time">{new Date(row.happened_at).toISOString ? String(row.happened_at).replace('T',' ').replace('Z','').slice(0,19) : row.happened_at}</td><td><strong>{row.user_email || 'Unknown'}</strong><span className="audit-role">{row.role || 'ΓÇö'}</span></td><td><span className="audit-action"><i/>{row.action}</span></td><td><strong className="mono">{row.case_id || 'ΓÇö'}</strong><span className="audit-resource">{row.resource || 'ΓÇö'}</span></td><td className="mono ip-cell">{isDemo?'DEMO / HIDDEN':row.source_ip || 'Unavailable'}</td><td><Status status={row.outcome==='success'?'complete':'error'}>{row.outcome || 'unknown'}</Status></td></tr>)}</tbody></table>{filteredAudit.length===0 && <div className="empty-state"><Activity size={24}/><strong>No events match</strong><span>Clear or change the current filters.</span></div>}</div><div className="register-foot"><span className="mono">{filteredAudit.length ? (page-1)*pageSize+1 : 0}ΓÇô{Math.min(page*pageSize,filteredAudit.length)} OF {filteredAudit.length} EVENTS</span><div className="pagination-controls"><button disabled={page<=1} onClick={() => setPage(p=>Math.max(1,p-1))} aria-label="Previous audit page"><ChevronLeft size={14}/></button><span className="mono">{String(page).padStart(2,'0')} / {String(pages).padStart(2,'0')}</span><button disabled={page>=pages} onClick={() => setPage(p=>Math.min(pages,p+1))} aria-label="Next audit page"><ChevronRight size={14}/></button></div><span className="mono">VIEWER / {user?.role?.toUpperCase() || 'DEMO'}</span></div></section><div className="audit-bottom-note"><LockKeyhole size={16}/><div><strong>LOG INTEGRITY</strong><span>In live mode, ordinary users cannot change or delete audit events through this interface. Tamper resistance also depends on database and infrastructure controls.</span></div></div></>;
}

function SecurityPage({ user, isDemo, integrations, health, logout, setNotice }) {
  const serviceRows = [
    { label:'PostgreSQL database', state:health?.database==='connected'?'Connected':'Not connected', ok:health?.database==='connected', note:'Cases, permissions, and audit events' },
    { label:'Email / OTP delivery', state:integrations.emailOtp==='configured'?'Configured':'Not configured', ok:integrations.emailOtp==='configured', note:'Required for real 2FA sign-in' },
    { label:'Gemma 4 / Ollama', state:integrations.gemma==='configured_endpoint'?'Endpoint set':'Not configured', ok:integrations.gemma==='configured_endpoint', note:'Local model endpoint; model availability must be tested' },
    { label:'Stable Diffusion 1.5', state:integrations.stableDiffusion==='configured'?'Configured':'Not configured', ok:integrations.stableDiffusion==='configured', note:'Provider-specific image adapter required' },
    { label:'Whisper transcription', state:integrations.whisper==='configured'?'Configured':'Not configured', ok:integrations.whisper==='configured', note:'Provider-specific transcription adapter required' },
    { label:'Gemini Flash', state:integrations.gemini==='configured'?'Configured':'Not configured', ok:integrations.gemini==='configured', note:'Server-side API key required for report content' },
    { label:'Hitem3D', state:integrations.hitem3d==='configured'?'Configured':'Not configured', ok:integrations.hitem3d==='configured', note:'Supported API/workflow and credentials required' },
  ];
  return <><PageHeading eyebrow="ACCOUNT / CONFIGURATION" title={<>SYSTEM<br/><span className="heading-light">SECURITY.</span></>} description="Identity, integration status, and environment readiness. Secrets are never shown in this screen." /><div className="security-grid"><section className="surface-panel identity-panel"><div className="panel-heading"><div><SectionLabel>IDENTITY / CURRENT SESSION</SectionLabel><h2>Account details</h2></div><div className="security-shield"><ShieldCheck size={20}/></div></div><div className="identity-summary"><div className="identity-large-avatar">{(user?.fullName||'A').split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div><h3>{user?.fullName || 'Unknown user'}</h3><p>{user?.email || 'No email available'}</p><Status status={isDemo?'warning':'complete'}>{isDemo?'DEMO IDENTITY':'AUTHENTICATED SESSION'}</Status></div></div><div className="security-detail"><span>ROLE</span><strong>{user?.role || 'investigator'}</strong></div><div className="security-detail"><span>AUTHENTICATION</span><strong>{isDemo?'Demo entry / no authentication':'Password + email OTP'}</strong></div><div className="security-detail"><span>DATABASE MODE</span><strong>{health?.database || 'unavailable'}</strong></div><div className="security-detail"><span>SESSION POLICY</span><strong>8 hours / configured backend</strong></div><div className="identity-warning"><AlertCircle size={16}/><span>A remote browser cannot expose its MAC address to this website. Live logging uses server-observed IP and authenticated session metadata instead.</span></div><PrimaryButton icon={LogOut} variant="outline" onClick={logout}>SIGN OUT</PrimaryButton></section><section className="surface-panel integrations-panel"><div className="panel-heading"><div><SectionLabel>RUNTIME / CONNECTIVITY</SectionLabel><h2>Service integrations</h2></div><span className={`status ${serviceRows.every(s=>s.ok)?'status-green':'status-amber'}`}><i/>{serviceRows.filter(s=>s.ok).length}/{serviceRows.length} CONFIGURED</span></div><div className="integration-list">{serviceRows.map((s,i)=><div className="integration-item" key={s.label}><div className={`integration-symbol ${s.ok?'configured':''}`}>{s.ok?<Check size={15}/>:<X size={15}/>}</div><div className="integration-copy"><strong>{s.label}</strong><span>{s.note}</span></div><span className={`integration-state ${s.ok?'text-green':''}`}>{s.state.toUpperCase()}</span></div>)}</div><div className="integration-footer"><span className="mono">PROVIDER ADAPTERS / SERVER-SIDE</span><button className="link-button" onClick={() => setNotice({type:'info',message:'Set values in .env using .env.example. Never paste production secrets into browser code.'})}>ENVIRONMENT GUIDE <ExternalLink size={14}/></button></div></section></div><section className="surface-panel security-principles"><div className="panel-heading"><div><SectionLabel>SECURITY MODEL</SectionLabel><h2>Control boundaries</h2></div><Mono>POLICY / 04</Mono></div><div className="principles-grid"><div><LockKeyhole size={18}/><strong>Server-side secrets</strong><span>Provider keys remain outside the frontend bundle.</span></div><div><Users size={18}/><strong>Role permissions</strong><span>Backend authorization governs case and audit access.</span></div><div><History size={18}/><strong>Versioned records</strong><span>Meaningful workflow changes are recorded as separate events.</span></div><div><HardDrive size={18}/><strong>Private evidence</strong><span>Uploads require an authenticated backend and private storage.</span></div></div></section></>;
}
