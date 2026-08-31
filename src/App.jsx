import { useState, useRef, useEffect } from "react";
import { Camera, X, Plus, Loader2, Shuffle, Luggage, Check, Settings, CloudSun, ShoppingBag } from "lucide-react";
import { supabase } from "./supabaseClient";

/**
 * CLOSET IA — produção completa
 * Requer: npm install @supabase/supabase-js lucide-react
 * Requer: supabaseClient.js configurado + setup.sql rodado no Supabase
 * Clima: Open-Meteo (gratuito, sem chave de API)
 * ---------------------------------------------------------
 */

const CATEGORIAS = ["Camisa", "Calça", "Vestido", "Blazer", "Sapato", "Acessório"];
const OCASIOES = ["Reunião de trabalho", "Jantar", "Encontro casual", "Dia livre"];
const ESTILOS = ["Clássica", "Moderna", "Romântica", "Minimalista", "Boho"];
const PERSONALIDADES = ["Discreta", "Ousada", "Sofisticada", "Descontraída"];

const TEXTURA = {
  Camisa: "linear-gradient(160deg,#EDE7DA,#C9BFA8)",
  Calça: "linear-gradient(160deg,#D9CFC0,#8B7E68)",
  Vestido: "linear-gradient(160deg,#E4D9C8,#A8927A)",
  Blazer: "linear-gradient(160deg,#3A3630,#0B0B0B)",
  Sapato: "linear-gradient(160deg,#DCC9A3,#8A6E4A)",
  Acessório: "linear-gradient(160deg,#C9A86A,#8A6A2E)",
};

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
const CATEGORIAS_QUENTES = ["Blazer", "Calça"];

export default function ClosetIA() {
  const [aba, setAba] = useState("Armário");
  const [pecas, setPecas] = useState([]);
  const [perfil, setPerfil] = useState({ estilo: null, personalidade: null, cidade: "" });
  const [clima, setClima] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [perfilAberto, setPerfilAberto] = useState(false);

  useEffect(() => { carregarTudo(); }, []);
  useEffect(() => { if (perfil.cidade) buscarClima(perfil.cidade); }, [perfil.cidade]);

  async function carregarTudo() {
    setCarregando(true);
    const [{ data: pecasData }, { data: perfilData }] = await Promise.all([
      supabase.from("pecas").select("*").order("created_at", { ascending: false }),
      supabase.from("perfil").select("*").eq("id", "default").single(),
    ]);
    if (pecasData) setPecas(pecasData);
    if (perfilData) setPerfil(perfilData);
    setCarregando(false);
  }

  async function salvarPerfil(novoPerfil) {
    setPerfil(novoPerfil);
    await supabase.from("perfil").update(novoPerfil).eq("id", "default");
  }

  async function buscarClima(cidade) {
    try {
      const geo = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt`
      ).then((r) => r.json());
      const local = geo?.results?.[0];
      if (!local) return setClima(null);
      const dados = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${local.latitude}&longitude=${local.longitude}&current=temperature_2m,precipitation`
      ).then((r) => r.json());
      setClima({ temperatura: Math.round(dados.current.temperature_2m), chuva: dados.current.precipitation > 0, cidade: local.name });
    } catch {
      setClima(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F0EA]">
      <div className="bg-black px-7 pt-12 pb-7 flex items-start justify-between">
        <div>
          <p className="text-[#8A8272] text-xs tracking-wide mb-1">Closet IA</p>
          <h1 className="text-[2.5rem] leading-none italic text-[#F3F0EA]" style={serif}>{aba}</h1>
        </div>
        <button onClick={() => setPerfilAberto(true)} className="mt-1 text-[#B8B2A4]"><Settings size={20} /></button>
      </div>

      <div className="px-5 pt-5 pb-1 flex gap-2 overflow-x-auto max-w-xl mx-auto">
        {["Armário", "Fotos", "Look do dia", "Mala de viagem"].map((t) => (
          <button
            key={t}
            onClick={() => setAba(t)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
              aba === t ? "bg-black text-white border-black" : "border-black/15 text-black/55"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-5 py-6 max-w-xl mx-auto">
        {carregando ? (
          <p className="text-sm text-black/40 text-center py-16">Carregando seu armário...</p>
        ) : (
          <>
            {aba === "Armário" && <Armario pecas={pecas} setPecas={setPecas} />}
            {aba === "Fotos" && <Fotos pecas={pecas} />}
            {aba === "Look do dia" && <LookDoDia pecas={pecas} perfil={perfil} clima={clima} />}
            {aba === "Mala de viagem" && <MalaDeViagem pecas={pecas} />}
          </>
        )}
      </div>

      {perfilAberto && <PerfilModal perfil={perfil} onSave={salvarPerfil} onClose={() => setPerfilAberto(false)} />}
    </div>
  );
}

function PerfilModal({ perfil, onSave, onClose }) {
  const [estilo, setEstilo] = useState(perfil.estilo);
  const [personalidade, setPersonalidade] = useState(perfil.personalidade);
  const [cidade, setCidade] = useState(perfil.cidade || "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="bg-[#F3F0EA] w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl italic" style={serif}>Seu perfil</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <p className="text-[13px] tracking-wide text-black/50 mb-2">SEU ESTILO</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {ESTILOS.map((e) => (
            <button key={e} onClick={() => setEstilo(e)} className={`px-3.5 py-1.5 rounded-full text-sm border ${estilo === e ? "bg-black text-white border-black" : "border-black/15 text-black/55"}`}>{e}</button>
          ))}
        </div>

        <p className="text-[13px] tracking-wide text-black/50 mb-2">SUA PERSONALIDADE</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {PERSONALIDADES.map((p) => (
            <button key={p} onClick={() => setPersonalidade(p)} className={`px-3.5 py-1.5 rounded-full text-sm border ${personalidade === p ? "bg-black text-white border-black" : "border-black/15 text-black/55"}`}>{p}</button>
          ))}
        </div>

        <p className="text-[13px] tracking-wide text-black/50 mb-2">SUA CIDADE (pro clima)</p>
        <input type="text" placeholder="ex: Rio de Janeiro" value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black/40 bg-white mb-6" />

        <button onClick={() => { onSave({ estilo, personalidade, cidade }); onClose(); }} className="w-full bg-black text-white rounded-xl py-3.5 text-sm tracking-wide">SALVAR PERFIL</button>
      </div>
    </div>
  );
}

function PecaCard({ p, onRemove }) {
  return (
    <div className="group">
      <div className="relative rounded-lg overflow-hidden mb-2.5" style={{ aspectRatio: "3/4" }}>
        {p.foto_url ? (
          <img src={p.foto_url} alt={p.categoria} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: TEXTURA[p.categoria] }} />
        )}
        {onRemove && (
          <button onClick={() => onRemove(p.id)} className="absolute top-2 right-2 bg-white/85 rounded-full p-1 opacity-0 group-active:opacity-100 transition-opacity">
            <X size={12} className="text-black" />
          </button>
        )}
      </div>
      <p className="text-sm">{p.categoria}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-black/45">{p.cor}</p>
        {p.link_loja && (
          <a href={p.link_loja} target="_blank" rel="noopener noreferrer" className="text-black/60">
            <ShoppingBag size={13} />
          </a>
        )}
      </div>
    </div>
  );
}

/* ---------------- ARMÁRIO ---------------- */
function Armario({ pecas, setPecas }) {
  const [preview, setPreview] = useState(null);
  const [arquivoAtual, setArquivoAtual] = useState(null);
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [cor, setCor] = useState("");
  const [linkLoja, setLinkLoja] = useState("");
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivoAtual(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }

  async function adicionarPeca() {
    if (!arquivoAtual) return;
    setEnviando(true);
    try {
      const nomeArquivo = `${Date.now()}-${arquivoAtual.name}`;
      const { error: erroUpload } = await supabase.storage.from("pecas").upload(nomeArquivo, arquivoAtual);
      if (erroUpload) throw erroUpload;
      const { data: { publicUrl } } = supabase.storage.from("pecas").getPublicUrl(nomeArquivo);
      const { data, error } = await supabase
        .from("pecas")
        .insert({ foto_url: publicUrl, categoria, cor: cor || null, link_loja: linkLoja || null })
        .select()
        .single();
      if (error) throw error;
      setPecas((prev) => [data, ...prev]);
      setPreview(null);
      setArquivoAtual(null);
      setCor("");
      setLinkLoja("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Não foi possível salvar a peça. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  async function removerPeca(id) {
    setPecas((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("pecas").delete().eq("id", id);
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-black/[0.08] p-5 mb-9 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <p className="text-[13px] tracking-wide text-black/50 mb-3">ADICIONAR PEÇA</p>

        {preview ? (
          <div className="relative mb-4">
            <img src={preview} alt="preview" className="w-full h-64 object-cover rounded-xl" />
            <button onClick={() => { setPreview(null); setArquivoAtual(null); }} className="absolute top-2.5 right-2.5 bg-black/70 rounded-full p-1.5">
              <X size={15} className="text-white" />
            </button>
          </div>
        ) : (
          <button onClick={() => inputRef.current?.click()} className="w-full h-44 border border-black/15 rounded-xl flex flex-col items-center justify-center gap-2 text-black/35 mb-4">
            <Camera size={26} strokeWidth={1.5} />
            <span className="text-sm">Fotografar ou escolher da galeria</span>
          </button>
        )}

        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

        {preview && (
          <div className="space-y-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((c) => (
                <button key={c} onClick={() => setCategoria(c)} className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${categoria === c ? "bg-black text-white border-black" : "border-black/15 text-black/55"}`}>{c}</button>
              ))}
            </div>
            <input type="text" placeholder="Cor — ex: bege, off-white, champagne" value={cor} onChange={(e) => setCor(e.target.value)} className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black/40 bg-transparent" />
            <input type="url" placeholder="Link da loja (opcional) — ex: https://..." value={linkLoja} onChange={(e) => setLinkLoja(e.target.value)} className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black/40 bg-transparent" />
          </div>
        )}

        <button onClick={adicionarPeca} disabled={!preview || enviando} className="w-full bg-black text-white rounded-xl py-3 text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-25 transition-opacity">
          {enviando ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {enviando ? "SALVANDO" : "ADICIONAR AO ARMÁRIO"}
        </button>
      </div>

      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl italic" style={serif}>Suas peças</h2>
        <span className="text-xs text-black/40">{pecas.length} itens</span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6">
        {pecas.map((p) => <PecaCard key={p.id} p={p} onRemove={removerPeca} />)}
      </div>
    </>
  );
}

/* ---------------- FOTOS ---------------- */
function Fotos({ pecas }) {
  return (
    <>
      <p className="text-sm text-black/50 mb-5">Todas as fotos que você já cadastrou, num só lugar.</p>
      {pecas.length === 0 ? (
        <p className="text-sm text-black/40 py-10 text-center">Nenhuma foto ainda — adicione peças na aba Armário.</p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {pecas.map((p) => (
            <div key={p.id} className="rounded-md overflow-hidden" style={{ aspectRatio: "1/1" }}>
              {p.foto_url ? <img src={p.foto_url} alt={p.categoria} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: TEXTURA[p.categoria] }} />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- LOOK DO DIA ---------------- */
function LookDoDia({ pecas, perfil, clima }) {
  const [ocasiao, setOcasiao] = useState(OCASIOES[0]);
  const [sugestao, setSugestao] = useState(null);
  const [gerando, setGerando] = useState(false);

  function sugerirLook() {
    setGerando(true);
    setTimeout(() => {
      let poolPecas = pecas;
      if (clima?.temperatura >= 27) {
        poolPecas = pecas.filter((p) => !CATEGORIAS_QUENTES.includes(p.categoria) || Math.random() > 0.6);
      } else if (clima?.temperatura <= 16 || clima?.chuva) {
        const blazers = pecas.filter((p) => p.categoria === "Blazer");
        if (blazers.length) poolPecas = [...pecas, ...blazers];
      }
      const porCategoria = {};
      poolPecas.forEach((p) => { (porCategoria[p.categoria] ??= []).push(p); });
      const escolhidas = Object.values(porCategoria).map((lista) => lista[Math.floor(Math.random() * lista.length)]).slice(0, 4);
      setSugestao(escolhidas);
      setGerando(false);
    }, 600);
  }

  const semPerfil = !perfil.estilo || !perfil.personalidade;

  return (
    <>
      {clima && (
        <div className="flex items-center gap-2 mb-5 text-black/55 text-sm">
          <CloudSun size={16} />
          <span>{clima.cidade} · {clima.temperatura}°C{clima.chuva ? " · chuva" : ""}</span>
        </div>
      )}

      {semPerfil && (
        <p className="text-xs text-black/40 mb-4 bg-white border border-black/10 rounded-xl px-4 py-3">
          Defina seu estilo e personalidade no ícone de engrenagem pra sugestões mais precisas.
        </p>
      )}

      <p className="text-sm text-black/50 mb-4">Qual a ocasião?</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {OCASIOES.map((o) => (
          <button key={o} onClick={() => setOcasiao(o)} className={`px-4 py-2 rounded-full text-sm border transition-colors ${ocasiao === o ? "bg-black text-white border-black" : "border-black/15 text-black/55"}`}>{o}</button>
        ))}
      </div>

      <button onClick={sugerirLook} disabled={gerando || pecas.length === 0} className="w-full bg-black text-white rounded-xl py-3.5 text-sm tracking-wide flex items-center justify-center gap-2 mb-8 disabled:opacity-25">
        {gerando ? <Loader2 size={15} className="animate-spin" /> : <Shuffle size={15} />}
        {gerando ? "MONTANDO LOOK" : "SUGERIR LOOK"}
      </button>

      {sugestao && (
        <div>
          <h2 className="text-2xl italic mb-1" style={serif}>{ocasiao}</h2>
          {perfil.estilo && (
            <p className="text-xs text-black/45 mb-4">
              Estilo {perfil.estilo.toLowerCase()} · {perfil.personalidade?.toLowerCase()}{clima ? ` · pensado pros ${clima.temperatura}°C de hoje` : ""}
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-3 gap-y-6">
            {sugestao.map((p) => <PecaCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- MALA DE VIAGEM ---------------- */
function MalaDeViagem({ pecas }) {
  const [selecionadas, setSelecionadas] = useState([]);
  const [dias, setDias] = useState(3);

  function toggle(id) {
    setSelecionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-black/50">Quantos dias de viagem?</p>
        <div className="flex items-center gap-3 bg-white border border-black/10 rounded-full px-3 py-1.5">
          <button onClick={() => setDias((d) => Math.max(1, d - 1))} className="text-black/50 text-lg leading-none px-1">−</button>
          <span className="text-sm w-4 text-center">{dias}</span>
          <button onClick={() => setDias((d) => d + 1)} className="text-black/50 text-lg leading-none px-1">+</button>
        </div>
      </div>

      <p className="text-sm text-black/50 mb-4">Toque nas peças para colocar na mala</p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 mb-8">
        {pecas.map((p) => {
          const ativo = selecionadas.includes(p.id);
          return (
            <button key={p.id} onClick={() => toggle(p.id)} className="text-left">
              <div className="relative rounded-lg overflow-hidden mb-2.5" style={{ aspectRatio: "3/4" }}>
                {p.foto_url ? <img src={p.foto_url} alt={p.categoria} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: TEXTURA[p.categoria] }} />}
                <div className={`absolute inset-0 transition-colors ${ativo ? "bg-black/25" : "bg-transparent"}`} />
                {ativo && <div className="absolute top-2 right-2 bg-white rounded-full p-1"><Check size={12} className="text-black" /></div>}
              </div>
              <p className="text-sm">{p.categoria}</p>
              <p className="text-xs text-black/45">{p.cor}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.08] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Luggage size={16} />
          <p className="text-sm">
            {selecionadas.length === 0 ? "Nenhuma peça na mala ainda" : `${selecionadas.length} peça${selecionadas.length > 1 ? "s" : ""} para ${dias} dia${dias > 1 ? "s" : ""}`}
          </p>
        </div>
        {selecionadas.length > 0 && (
          <p className="text-xs text-black/45">{pecas.filter((p) => selecionadas.includes(p.id)).map((p) => p.categoria).join(" · ")}</p>
        )}
      </div>
    </>
  );
}
