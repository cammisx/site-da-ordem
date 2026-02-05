import { useEffect, useMemo, useRef, useState } from "react";
import "./styles/pages/login.css";

import {
  getSoundEnabled,
  setSoundEnabled,
  unlockAudio,
  playBeep,
  playClick,
  playError,
} from "./lib/uiSounds";

import { auth, authApi, googleProvider } from "./lib/firebase";
import { listByCategory, getById } from "./lib/dataIndex";
import PericiaPanel from "./components/panels/PericiaPanel";

function clampIndex(i, len) {
  if (len <= 0) return 0;
  return (i + len) % len;
}

function useKeyDown(handler, deps) {
  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function BootSequence({ onDone, onNoise }) {
  const [step, setStep] = useState(0);
  const lines = useMemo(
    () => [
      "ORDEM BIOS v0.98 (c) 1998",
      "Detectando dispositivos OK",
      "Memória: 65536K OK",
      "Iniciando ORDEM.EXE ",
      "Carregando módulos: [AUTH] [ARQUIVOS] [LOG]",
      "Sincronizando",
      "Pronto.",
    ],
    []
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setStep((s) => {
        const next = s + 1;
        if (next >= lines.length) {
          setTimeout(onDone, 450);
          return s;
        }
        // beep suave a cada linha
        onNoise(playBeep);
        return next;
      });
    }, step < 2 ? 520 : 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useKeyDown(
    (e) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        onNoise(playClick);
        onDone();
      }
    },
    [onDone]
  );

  return (
    <div className="boot">
      <div className="boot-inner">
        <div className="boot-title">C:\ORDEM\BOOT&gt;</div>
        <div className="boot-lines" aria-label="boot">
          {lines.slice(0, Math.min(step + 1, lines.length)).map((l, idx) => (
            <div key={idx} className="boot-line">
              {l}
            </div>
          ))}
          <div className="boot-hint">ENTER/ESC: pular</div>
        </div>
      </div>
    </div>
  );
}

function WindowFrame({ title, rightControls, children, onNoise }) {
  return (
    <div className="win95 glitch" role="dialog" aria-label={title}>
      <div className="win95-titlebar">
        <div className="title">
          <span aria-hidden="true">▣</span>
          <span>{title}</span>
        </div>

        <div className="win95-controls" aria-label="controles da janela">
          {rightControls}
          <button
            type="button"
            className="win95-btn"
            aria-label="minimizar"
            onClick={() => onNoise(playClick)}
          >
            _
          </button>
          <button
            type="button"
            className="win95-btn"
            aria-label="maximizar"
            onClick={() => onNoise(playClick)}
          >
            □
          </button>
          <button
            type="button"
            className="win95-btn"
            aria-label="fechar"
            onClick={() => onNoise(playError)}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="win95-body">{children}</div>

      <div className="statusbar" aria-label="barra de status">
        <span>STATUS: ONLINE</span>
        <span>BUILD 0.2 • ORDEM PARANORMAL</span>
      </div>
    </div>
  );
}

function LoginScreen({ onLoggedIn, onNoise, soundEnabled, setSound }) {
  const [mode, setMode] = useState("login"); // login | signup | reset
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const unsub = authApi.onAuthStateChanged(auth, (user) => {
      if (user) onLoggedIn(user);
    });
    return () => unsub();
  }, [onLoggedIn]);

  const safe = async (fn) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setMsg(null);
    try {
      await fn();
      onNoise(playBeep);
    } catch (err) {
      onNoise(playError);
      setMsg(err?.message || "Falha desconhecida");
    } finally {
      busyRef.current = false;
    }
  };

  const submit = (e) => {
    e.preventDefault();
    onNoise(playClick);
    if (!email) return setMsg("Informe o e-mail.");
    if (mode !== "reset" && !pass) return setMsg("Informe a senha.");

    if (mode === "login") {
      return safe(() => authApi.signInWithEmailAndPassword(auth, email, pass));
    }
    if (mode === "signup") {
      return safe(() => authApi.createUserWithEmailAndPassword(auth, email, pass));
    }
    return safe(async () => {
      await authApi.sendPasswordResetEmail(auth, email);
      setMsg("E-mail de redefinição enviado.");
      setMode("login");
    });
  };

  const google = () => {
    onNoise(playClick);
    return safe(() => authApi.signInWithPopup(auth, googleProvider));
  };

  return (
    <div className="login-desktop" aria-label="tela de acesso">
      <WindowFrame
        title="ORDEM.EXE — TERMINAL DE ACESSO"
        onNoise={onNoise}
        rightControls={
          <button
            type="button"
            className="win95-btn"
            aria-label={soundEnabled ? "som ligado" : "som desligado"}
            title={soundEnabled ? "Som: ON" : "Som: OFF"}
            onClick={() => {
              onNoise(playClick);
              setSound(!soundEnabled);
            }}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        }
      >
        <form className="terminal" onSubmit={submit}>
          <div className="terminal-header">
            <div className="terminal-title">C:\ORDEM\ACESSO&gt; {mode.toUpperCase()}</div>
            <div className="terminal-hint">Setas/ENTER: navegar • ESC: voltar</div>
          </div>

          <div className="prompt">
            {mode === "reset"
              ? "Informe seu e-mail e pressione ENTER para redefinir"
              : "Digite suas credenciais e pressione ENTER"}
            <span className="cursor" />
          </div>

          <div className="field-row">
            <label htmlFor="email">E-MAIL</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              spellCheck="false"
              placeholder="ex: chloe@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => onNoise(playBeep)}
            />
          </div>

          {mode !== "reset" && (
            <div className="field-row">
              <label htmlFor="password">SENHA</label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onFocus={() => onNoise(playBeep)}
              />
            </div>
          )}

          <div className="actions">
            <button type="submit" className="term-btn primary" onMouseDown={() => onNoise(playClick)}>
              {mode === "login" ? "ACESSAR" : mode === "signup" ? "CRIAR CONTA" : "ENVIAR LINK"}
            </button>

            <button
              type="button"
              className="term-btn google"
              onMouseDown={() => onNoise(playClick)}
              onClick={google}
            >
              <span className="google-ic" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.18 3.22l6.86-6.86C35.86 2.2 30.3 0 24 0 14.62 0 6.54 5.38 2.56 13.22l8 6.22C12.68 13.06 17.9 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.1 24.5c0-1.66-.14-2.9-.44-4.18H24v7.9h12.6c-.25 2.06-1.62 5.16-4.66 7.24l7.14 5.54c4.16-3.86 6.02-9.56 6.02-16.5z"/>
                  <path fill="#FBBC05" d="M10.56 28.44a14.9 14.9 0 0 1 0-8.94l-8-6.22A23.94 23.94 0 0 0 0 24c0 3.88.94 7.56 2.56 10.72l8-6.28z"/>
                  <path fill="#34A853" d="M24 48c6.3 0 11.86-2.08 15.82-5.66l-7.14-5.54c-1.92 1.34-4.5 2.26-8.68 2.26-6.1 0-11.32-3.56-13.44-8.94l-8 6.28C6.54 42.62 14.62 48 24 48z"/>
                </svg>
              </span>
              <span>Continuar com Google</span>
            </button>

            <div className="links" aria-label="ações rápidas">
              {mode !== "signup" ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNoise(playClick);
                    setMode("signup");
                  }}
                >
                  CADASTRAR NOVO AGENTE
                </a>
              ) : (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNoise(playClick);
                    setMode("login");
                  }}
                >
                  VOLTAR
                </a>
              )}

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNoise(playClick);
                  setMode((m) => (m === "reset" ? "login" : "reset"));
                }}
              >
                {mode === "reset" ? "CANCELAR" : "REDEFINIR SENHA"}
              </a>
            </div>
          </div>

          {msg && <div className="terminal-msg">{msg}</div>}
        </form>
      </WindowFrame>
    </div>
  );
}

function MainMenu({ user, onLogout, onNoise, soundEnabled, setSound }) {
  const MENU = useMemo(
    () => [
      { key: "arquivos", label: "ARQUIVOS" },
      { key: "investigacoes", label: "INVESTIGAÇÕES" },
      { key: "sair", label: "SAIR" },
    ],
    []
  );

  const INVESTIGACOES = useMemo(
    () => [
      { key: "casos_em_andamento", label: "CASOS EM ANDAMENTO" },
      { key: "pistas", label: "PISTAS" },
      { key: "evidencias", label: "EVIDÊNCIAS" },
      { key: "relatorios", label: "RELATÓRIOS" },
    ],
    []
  );

  const FILE_CATEGORIES = useMemo(
    () => [
      { key: "origens", label: "ORIGENS" },
      { key: "classes", label: "CLASSES" },
      { key: "pericias", label: "PERÍCIAS" },
      { key: "equipamentos", label: "EQUIPAMENTOS" },
      { key: "rituais", label: "RITUAIS" },
    ],
    []
  );

  const [focus, setFocus] = useState("menu"); // menu | list
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); // arquivos: origens/classes/...
  const [selectedItemId, setSelectedItemId] = useState(null); // id do item dentro da categoria (ou da investigação)
  const [menuIndex, setMenuIndex] = useState(0);
  const [listIndex, setListIndex] = useState(0);

  const list = useMemo(() => {
    if (!selectedMenu) return [];

    if (selectedMenu === "investigacoes") {
      return INVESTIGACOES;
    }

    if (selectedMenu === "arquivos") {
      // 1º nível: categorias; 2º nível: itens da categoria (vindos do JSON)
      if (!selectedCategory) return FILE_CATEGORIES;
      return listByCategory(selectedCategory).map((it) => ({
        key: it.id,
        label: it.nome,
        data: it,
      }));
    }

    return [];
  }, [selectedMenu, selectedCategory, INVESTIGACOES, FILE_CATEGORIES]);

  const userLabel = user?.displayName || user?.email || "AGENTE";

  const selectedItem = useMemo(() => {
    if (!selectedMenu) return null;

    if (selectedMenu === "investigacoes") {
      if (!selectedItemId) return null;
      return INVESTIGACOES.find((x) => x.key === selectedItemId) || null;
    }

    if (selectedMenu === "arquivos") {
      if (!selectedCategory || !selectedItemId) return null;
      const data = getById(selectedCategory, selectedItemId);
      if (!data) return null;
      return { key: data.id, label: data.nome, data };
    }

    return null;
  }, [selectedMenu, selectedCategory, selectedItemId, INVESTIGACOES]);

  const pickMenu = (key) => {
    setSelectedMenu(key);
    setSelectedCategory(null);
    setSelectedItemId(null);
    setListIndex(0);

    if (key === "sair") {
      onNoise(playClick);
      return onLogout();
    }

    setFocus("list");
    onNoise(playBeep);
  };

  const pickList = (idx) => {
    const it = list[idx];
    if (!it) return;

    // Arquivos: primeiro click escolhe categoria; segundo click escolhe item
    if (selectedMenu === "arquivos" && !selectedCategory) {
      setSelectedCategory(it.key);
      setSelectedItemId(null);
      setListIndex(0);
      onNoise(playBeep);
      return;
    }

    setSelectedItemId(it.key);
    onNoise(playBeep);
  };

  useKeyDown(
    (e) => {
      const key = e.key;

      // global: som
      if (key === "F8") {
        e.preventDefault();
        onNoise(playClick);
        setSound(!soundEnabled);
        return;
      }

      if (focus === "menu") {
        if (key === "ArrowDown") {
          e.preventDefault();
          onNoise(playClick);
          setMenuIndex((i) => clampIndex(i + 1, MENU.length));
        }
        if (key === "ArrowUp") {
          e.preventDefault();
          onNoise(playClick);
          setMenuIndex((i) => clampIndex(i - 1, MENU.length));
        }
        if (key === "Enter") {
          e.preventDefault();
          pickMenu(MENU[menuIndex].key);
        }
        return;
      }

      if (focus === "list") {
        if (key === "Escape") {
          e.preventDefault();
          onNoise(playClick);

          // Arquivos: ESC volta do 2º nível (itens) para categorias
          if (selectedMenu === "arquivos" && selectedCategory) {
            setSelectedCategory(null);
            setSelectedItemId(null);
            setListIndex(0);
            return;
          }

          setFocus("menu");
          return;
        }

        if (key === "ArrowDown") {
          e.preventDefault();
          onNoise(playClick);
          setListIndex((i) => clampIndex(i + 1, list.length));
        }
        if (key === "ArrowUp") {
          e.preventDefault();
          onNoise(playClick);
          setListIndex((i) => clampIndex(i - 1, list.length));
        }
        if (key === "Enter") {
          e.preventDefault();
          pickList(listIndex);
        }
      }
    },
    [focus, menuIndex, listIndex, selectedMenu, selectedCategory, list, soundEnabled]
  );

  const title = "ORDEM.EXE — TERMINAL DE ARQUIVOS";


  return (
    <div className="login-desktop" aria-label="terminal">
      <WindowFrame
        title={title}
        onNoise={onNoise}
        rightControls={
          <button
            type="button"
            className="win95-btn"
            aria-label={soundEnabled ? "som ligado" : "som desligado"}
            title={soundEnabled ? "Som: ON (F8)" : "Som: OFF (F8)"}
            onClick={() => {
              onNoise(playClick);
              setSound(!soundEnabled);
            }}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        }
      >
        <div className="terminal terminal-app" role="application" aria-label="menu principal">
          <div className="terminal-header">
            <div className="terminal-title">C:\ORDEM\ARQUIVOS&gt; MENU</div>
            <div className="terminal-hint">
              {userLabel} • Setas/ENTER • ESC: voltar • F8: som
            </div>
          </div>

          <div className="menu-grid">
            <div className="menu-col">
              <div className="menu-title">DIRETÓRIOS</div>
              <ul className="menu-list" aria-label="menu" role="listbox">
                {MENU.map((m, idx) => {
                  const active = idx === menuIndex && focus === "menu";
                  const chosen = m.key === selectedMenu;
                  return (
                    <li
                      key={m.key}
                      className={`menu-item ${active ? "is-active" : ""} ${chosen ? "is-chosen" : ""}`}
                      onMouseEnter={() => setMenuIndex(idx)}
                      onMouseDown={() => onNoise(playClick)}
                      onClick={() => pickMenu(m.key)}
                      role="option"
                      aria-selected={chosen}
                    >
                      &gt; {m.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="menu-col">
              <div className="menu-title">
                ITENS
                {selectedMenu === "arquivos" && selectedCategory
                  ? ` — ${FILE_CATEGORIES.find((c) => c.key === selectedCategory)?.label || ""}`
                  : ""}
              </div>
              <ul className="menu-list" aria-label="itens" role="listbox">
                {list.length === 0 ? (
                  <li className="menu-item dim">Selecione um diretório…</li>
                ) : (
                  list.map((it, idx) => {
                    const active = idx === listIndex && focus === "list";
                    const chosen = selectedItemId === it.key;
                    return (
                      <li
                        key={it.key}
                        className={`menu-item ${active ? "is-active" : ""} ${chosen ? "is-chosen" : ""}`}
                        onMouseEnter={() => setListIndex(idx)}
                        onMouseDown={() => onNoise(playClick)}
                        onClick={() => {
                          setFocus("list");
                          setListIndex(idx);
                          pickList(idx);
                        }}
                        role="option"
                        aria-selected={chosen}
                      >
                        {active ? "▮" : "  "} {it.label}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            <div className="menu-col panel">
              <div className="menu-title">PAINEL</div>
              <div className="panel-body">
                {!selectedMenu ? (
                  <div className="dim">Selecione um diretório…</div>
                ) : selectedMenu === "arquivos" && !selectedCategory ? (
                  <div className="dim">Escolha uma categoria à esquerda.</div>
                ) : !selectedItem ? (
                  <div className="dim">Nenhum item selecionado.</div>
                ) : (
                  <>
                    <div className="panel-heading">{selectedItem.label}</div>

                    {selectedMenu === "arquivos" && selectedItem.data ? (
                      <>
                        {selectedCategory === "pericias" ? (
                          <PericiaPanel pericia={selectedItem.data} />
                        ) : (
                          <>
                            {selectedItem.data.gancho_resumo && (
                              <div className="panel-text">{selectedItem.data.gancho_resumo}</div>
                            )}

                            {selectedItem.data.atributo_base && (
                              <div className="panel-text"><span className="dim">Atributo-base:</span> {selectedItem.data.atributo_base}</div>
                            )}

                            {selectedItem.data.pericias_treinadas && (
                              <div className="panel-text"><span className="dim">Perícias treinadas:</span> {selectedItem.data.pericias_treinadas}</div>
                            )}

                            {selectedItem.data.poder_nome && (
                              <div className="panel-text"><span className="dim">Poder:</span> {selectedItem.data.poder_nome}</div>
                            )}

                            {selectedItem.data.fonte && (
                              <div className="panel-text dim">Fonte: {selectedItem.data.fonte}</div>
                            )}

                          </>
                        )}

                      </>
                    ) : (
                      <div className="panel-text">Conteúdo temporário.</div>
                    )}

                    <div className="panel-text dim">Dica: ENTER seleciona • ESC volta</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("boot"); // boot | login | app
  const [user, setUser] = useState(null);
  const [soundEnabled, setSound] = useState(getSoundEnabled());

  const onNoise = (fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.body.classList.add("theme-terminal95");
    return () => document.body.classList.remove("theme-terminal95");
  }, []);

  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // tenta desbloquear áudio no primeiro clique/tecla
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const logout = async () => {
    onNoise(playClick);
    try {
      await authApi.signOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setPhase("login");
  };

  return (
    <div className="page">
      <div className="page-inner">
        {phase === "boot" && <BootSequence onDone={() => setPhase("login")} onNoise={onNoise} />}

        {phase === "login" && (
          <LoginScreen
            onLoggedIn={(u) => {
              setUser(u);
              setPhase("app");
            }}
            onNoise={onNoise}
            soundEnabled={soundEnabled}
            setSound={setSound}
          />
        )}

        {phase === "app" && (
          <MainMenu
            user={user}
            onLogout={logout}
            onNoise={onNoise}
            soundEnabled={soundEnabled}
            setSound={setSound}
          />
        )}
      </div>
    </div>
  );
}
