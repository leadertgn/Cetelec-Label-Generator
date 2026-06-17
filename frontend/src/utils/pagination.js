/**
 * Calcule la répartition des étiquettes par page A4
 */
export const calculatePages = (activeProject) => {
  if (!activeProject?.sections) return [];

  const {
    marginTop = 15, marginBottom = 10, marginLeft = 15, marginRight = 15,
    headerHeight = 20, footerHeight = 10
  } = activeProject;

  // Fallbacks sécurisés pendant la saisie (évite le NaN)
  const mT = parseFloat(marginTop) || 0;
  const mB = parseFloat(marginBottom) || 0;
  const mL = parseFloat(marginLeft) || 0;
  const mR = parseFloat(marginRight) || 0;
  const hH = parseFloat(headerHeight) || 0;
  const fH = parseFloat(footerHeight) || 0;

  const PAGE_WIDTH_MM  = Math.max(10, 210 - mL - mR);
  const PAGE_HEIGHT_MM = Math.max(10, 297 - mT - mB - hH - fH);
  const GAP_MM         = 3;
  const SECTION_HEADER_MM = 8;

  const pagesArr = [];
  const newPage = () => ({ sections: [] });

  let currentPage = newPage();
  let currentY = 0;

  activeProject.sections.forEach(section => {
    const labels = section.labels || [];
    if (labels.length === 0) return;

    const defW = parseFloat(section.defaultWidth) || 20;
    const defH = parseFloat(section.defaultHeight) || 15;

    const labelW = defW + GAP_MM;
    const labelH = defH + GAP_MM;

    const labelsPerRow = Math.max(1, Math.floor(PAGE_WIDTH_MM / labelW));
    const minSpaceNeeded = SECTION_HEADER_MM + labelH;

    if (currentY + minSpaceNeeded > PAGE_HEIGHT_MM) {
      pagesArr.push(currentPage);
      currentPage = newPage();
      currentY = 0;
    }

    let sectionBlock = { ...section, labels: [] };
    currentY += SECTION_HEADER_MM;

    labels.forEach((label, idx) => {
      const positionInRow = sectionBlock.labels.length % labelsPerRow;
      const isStartOfNewRow = positionInRow === 0;

      if (isStartOfNewRow) {
        if (currentY + labelH > PAGE_HEIGHT_MM) {
          if (sectionBlock.labels.length > 0) {
            currentPage.sections.push(sectionBlock);
          }
          pagesArr.push(currentPage);
          currentPage = newPage();
          currentY = 0;
          sectionBlock = { ...section, labels: [] };
          currentY += SECTION_HEADER_MM;
        }
        currentY += labelH;
      }
      sectionBlock.labels.push(label);
    });

    if (sectionBlock.labels.length > 0) {
      currentPage.sections.push(sectionBlock);
    }
  });

  if (currentPage.sections.length > 0) {
    pagesArr.push(currentPage);
  }

  return pagesArr.length > 0 ? pagesArr : [newPage()];
};
