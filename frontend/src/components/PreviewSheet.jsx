import React from 'react';

const PreviewSheet = ({ pages, project, logoBase64, showCuttingMarks }) => (
  <section className="canvas">
    {pages.map((page, pIdx) => (
      <div key={pIdx} className="sheet">
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '5mm', marginBottom: '8mm'}}>
          <div>
            <h2 style={{fontSize: '14pt', fontWeight: 800}}>{project?.name || "PROJET SANS NOM"}</h2>
            <p style={{fontSize: '8pt', color: '#64748b'}}>Plan d'étiquetage Électrique - Page {pIdx + 1}</p>
          </div>
          {logoBase64 ? (
            <img src={logoBase64} alt="Logo" style={{maxHeight: '15mm', maxWidth: '45mm', objectFit: 'contain'}} />
          ) : (
            <div style={{fontSize: '8pt', color: '#cbd5e1', border: '1px dashed #cbd5e1', padding: '10px'}}>CETELEC SA</div>
          )}
        </header>

        <div className="sheet-body">
          {page.sections.map(sec => (
            <div key={sec.id} className="section-block">
              <div className="section-title-print">{sec.name}</div>
              <div className="labels-grid">
                {sec.labels.map(l => (
                  <div 
                    key={l.id} 
                    className={`label ${showCuttingMarks ? 'cutting-marks' : ''}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden', padding: '1mm', lineHeight: 1.1, wordBreak: 'break-all',
                      width: `${sec.defaultWidth}mm`, height: `${sec.defaultHeight}mm`,
                      backgroundColor: sec.bgColor, color: sec.textColor,
                      border: `${sec.borderSize}mm solid ${sec.borderColor}`,
                      borderRadius: `${sec.borderRadius}mm`,
                      fontSize: `${sec.fontSize}pt`, fontFamily: sec.fontFamily
                    }}
                  >
                    {l.text}
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
