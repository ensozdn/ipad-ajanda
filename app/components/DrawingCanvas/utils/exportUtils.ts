export const exportAsPNG = (
  canvas: HTMLCanvasElement,
  bgCanvas: HTMLCanvasElement
) => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  tempCtx.drawImage(bgCanvas, 0, 0);
  tempCtx.drawImage(canvas, 0, 0);

  const imageData = tempCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imageData;
  link.download = `not_${new Date().getTime()}.png`;
  link.click();
};

export const exportAsPDF = async (
  canvas: HTMLCanvasElement,
  bgCanvas: HTMLCanvasElement
) => {
  try {
    const { jsPDF } = await import('jspdf');
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(bgCanvas, 0, 0);
    tempCtx.drawImage(canvas, 0, 0);

    const imgData = tempCanvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    
    const canvasRatio = canvas.height / canvas.width;
    let imgWidth = pdfWidth;
    let imgHeight = pdfWidth * canvasRatio;
    
    if (imgHeight > pdfHeight) {
      imgHeight = pdfHeight;
      imgWidth = pdfHeight / canvasRatio;
    }
    
    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;
    
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(`not_${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    alert('PDF oluşturulurken bir hata oluştu. PNG olarak indiriliyor.');
    exportAsPNG(canvas, bgCanvas);
  }
};
