import { getAtributoById, formatDT, formatTreinamento, linkifyCapitulo } from "../../lib/pericias";

function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

export default function PericiaPanel({ pericia }) {
  if (!pericia) return null;

  const atributo = getAtributoById(pericia.atributoId);
  const desc = linkifyCapitulo(pericia.descricao || "");

  const dtTemAlgo = Boolean(pericia.dt && ((Array.isArray(pericia.dt?.oficiais) && pericia.dt.oficiais.length > 0) || pericia.dt?.incluiLivre || pericia.dt?.incluiNenhuma));

  return (
    <>
      {atributo ? (
        <div className="panel-text">
          <span className="dim">Atributo:</span> {atributo.nome}
        </div>
      ) : null}

      {(pericia.penalidadeDeCarga || pericia.kitDePericia || (pericia.status && pericia.status !== "ok")) ? (
        <div className="panel-text">
          {pericia.penalidadeDeCarga ? <Badge>CARGA</Badge> : null}
          {pericia.kitDePericia ? <Badge>KIT</Badge> : null}
          {pericia.status && pericia.status !== "ok" ? <Badge>EM CONSTRUÇÃO</Badge> : null}
        </div>
      ) : null}

      {dtTemAlgo ? (
        <div className="panel-text">
          <span className="dim">DT:</span> {formatDT(pericia.dt)}
        </div>
      ) : null}

      {desc ? <div className="panel-text">{desc}</div> : null}

      {Array.isArray(pericia.testes) && pericia.testes.length > 0 ? (
        <>
          <div className="panel-subtitle">Testes</div>
          <ul className="panel-testlist" aria-label="testes da perícia">
            {pericia.testes.map((t) => {
              const dtTesteTemOficial = Array.isArray(t.dt?.oficiais) && t.dt.oficiais.length > 0;
              const exigeKit = Boolean(t.exigenciaKitId || pericia.exigenciaKitId);
              const temCarga = Boolean(t.penalidadeDeCarga || pericia.penalidadeDeCarga);

              return (
                <li key={t.id_teste} className="panel-testitem">
                  <div className="panel-testhead">
                    <span className="panel-testname">{t.nome}</span>

                    {(t.exigenciaTreinamento || dtTesteTemOficial) ? (
                      <span className="panel-testmeta dim">
                        {t.exigenciaTreinamento ? `Exigência: ${formatTreinamento(t.exigenciaTreinamento)}` : ""}
                        {dtTesteTemOficial ? `${t.exigenciaTreinamento ? " • " : ""}DT: ${formatDT(t.dt)}` : ""}
                      </span>
                    ) : null}
                  </div>

                  {(temCarga || exigeKit) ? (
                    <div className="panel-testbadges">
                      {temCarga ? <Badge>CARGA</Badge> : null}
                      {exigeKit ? <Badge>KIT</Badge> : null}
                    </div>
                  ) : null}

                  {t.descricao ? <div className="panel-text">{linkifyCapitulo(t.descricao)}</div> : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {pericia.fonte ? <div className="panel-text dim">Fonte: {pericia.fonte}</div> : null}
    </>
  );
}