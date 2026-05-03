import React from 'react';

const PreviewSheet = ({ pages, project, logoBase64 }) => (
  <section className="canvas">
    {pages.map((page, pIdx) => (
      <div key={pIdx} className="sheet" style={{
        paddingTop: `${project?.marginTop || 15}mm`,
        paddingBottom: `${project?.marginBottom || 10}mm`,
        paddingLeft: `${project?.marginLeft || 15}mm`,
        paddingRight: `${project?.marginRight || 15}mm`,
      }}>

        {/* En-tête de page */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #0f172a',
          paddingBottom: '2mm',
          marginBottom: '5mm',
          height: `${project?.headerHeight || 20}mm`,
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontSize: '14pt', fontWeight: 800 }}>
              {project?.name || 'PROJET SANS NOM'}
            </h2>
            <p style={{ fontSize: '8pt', color: '#64748b' }}>
              Plan d'étiquetage Électrique — Page {pIdx + 1}
            </p>
          </div>

          {logoBase64 ? (
            <img
              src={logoBase64}
              alt="Logo"
              style={{ maxHeight: '15mm', maxWidth: '45mm', objectFit: 'contain' }}
            />
          ) : (
            <div style={{
              fontSize: '8pt',
              color: '#cbd5e1',
              border: '1px dashed #cbd5e1',
              padding: '6px 10px'
            }}>
              CETELEC SA
            </div>
          )}
        </header>

        {/* Corps de la page : sections + étiquettes */}
        <div className="sheet-body">
          {page.sections.map(sec => (
            <div key={sec.id} className="section-block">

              {/* Titre de section — visible à l'écran ET à l'impression */}
              <div className="section-title-print">{sec.name}</div>

              {/* Grille d'étiquettes */}
              <div className="labels-grid">
                {sec.labels.map(l => (
                  /*
                   * Architecture wrapper / inner :
                   * - .label-wrapper  : positionné en relative, overflow VISIBLE
                   *                     porte les marques de découpe (::before)
                   * - .label-inner    : porte le style visuel (fond, bordure, texte)
                   *                     peut avoir overflow: hidden sans problème
                   *
                   * Cela résout le bug : overflow: hidden sur l'étiquette elle-même
                   * écrasait tous les pseudo-éléments qui dépassaient.
                   */
                  <div
                    key={l.id}
                    className="label-wrapper"
                    style={{
                      width: `${sec.defaultWidth}mm`,
                      height: `${sec.defaultHeight}mm`,
                    }}
                  >
                    <div
                      className="label-inner"
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: sec.bgColor,
                        color: sec.textColor,
                        border: `${sec.borderSize}mm solid ${sec.borderColor}`,
                        borderRadius: `${sec.borderRadius}mm`,
                        fontSize: `${sec.fontSize}pt`,
                        fontFamily: sec.fontFamily,
                      }}
                    >
                      {l.text}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

      </div>
    ))}
  </section>
);

export default PreviewSheet;