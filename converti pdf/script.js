var pdf; // Variabile globale per il documento PDF
var currentPage = 1; // Pagina corrente del PDF
var canvas; // Elemento canvas per il rendering delle pagine PDF
var context; // Contesto del canvas

function caricaEConverti() {
    var file = document.getElementById('fileInput').files[0];
    if (!file) {
        console.error("Nessun file selezionato");
        return;
    }

    var reader = new FileReader();

    reader.onload = function(event) {
        var arrayBuffer = event.target.result;

        // Leggi il file PDF
        pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(function(pdfDoc) {
            pdf = pdfDoc;

            var promises = [];
            for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                promises.push(pdf.getPage(pageNum).then(function(page) {
                    return page.getTextContent({ normalizeWhitespace: false }).then(function(content) {
                        var rows = [];
                        var prevY = -1;
                        var row = [];

                        content.items.forEach(function(item) {
                            if (prevY !== item.transform[5]) {
                                if (row.length > 0) {
                                    rows.push(row);
                                    row = [];
                                }
                                prevY = item.transform[5];
                            }
                            row.push(item.str);
                        });

                        if (row.length > 0) {
                            rows.push(row);
                        }

                        return rows;
                    });
                }));
            }

            Promise.all(promises).then(function(pagesText) {
                var allRows = [];
                pagesText.forEach(pageRows => {
                    allRows = allRows.concat(pageRows);
                });

                // Converti il testo del PDF in un workbook Excel
                var wb = XLSX.utils.book_new();
                var ws = XLSX.utils.aoa_to_sheet(allRows);
                XLSX.utils.book_append_sheet(wb, ws, "Foglio1");

                // Genera il file Excel
                var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

                // Crea un URL per il file Excel generato
                var blob = new Blob([wbout], { type: 'application/octet-stream' });
                var url = window.URL.createObjectURL(blob);

                // Ottieni il nome del file dall'input
                var nomeFileInput = document.getElementById('nomeFileInput');
                var nomeFile = nomeFileInput ? nomeFileInput.value : 'conversione.xlsx';

                // Salva il file Excel
                creaBottoneDownload(url, nomeFile);
            });
        });
    };

    reader.onerror = function(event) {
        console.error("Errore durante la lettura del file", event);
    };

    reader.readAsArrayBuffer(file);
}

function drawPage(pageNum) {
    pdf.getPage(pageNum).then(function(page) {
        var viewport = page.getViewport({scale: 0.5});
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        page.render({
            canvasContext: context,
            viewport: viewport
        }).promise.then(function() {
            var pageIndicator = document.querySelector('.pagination span');
            if (pageIndicator) {
                pageIndicator.textContent = 'Page ' + currentPage + ' of ' + pdf.numPages;
            }
        });
    });
}

function caricaEVisualizzaPDF() {
    var file = document.getElementById('fileInput').files[0];
    if (!file) {
        console.error("Nessun file selezionato");
        return;
    }

    var reader = new FileReader();

    reader.onload = function(event) {
        var arrayBuffer = event.target.result;

        pdfjsLib.getDocument({data: arrayBuffer}).promise.then(function(pdfDoc) {
            pdf = pdfDoc;
            initializePDFViewer();
            drawPage(currentPage);
        });
    };

    reader.onerror = function(event) {
        console.error("Errore durante la lettura del file", event);
    };

    reader.readAsArrayBuffer(file);
}

function initializePDFViewer() {
    // Inizializza il canvas e il contesto
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');

    // Ottieni il div in cui visualizzare il PDF
    var pdfViewerDiv = document.getElementById('pdfViewer');
    if (pdfViewerDiv) {
        // Aggiungi il canvas al div per visualizzare il PDF
        pdfViewerDiv.appendChild(canvas);

        // Aggiungi il navigatore di pagine
        var navContainer = document.createElement('div');
        navContainer.classList.add('pagination');

        // Aggiungi il pulsante per la pagina precedente
        var prevButton = document.createElement('button');
        prevButton.textContent = '←';
        prevButton.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                drawPage(currentPage);
            }
        });
        navContainer.appendChild(prevButton);

        // Aggiungi il numero di pagina corrente
        var pageIndicator = document.createElement('span');
        pageIndicator.textContent = 'Page ' + currentPage + ' of ' + pdf.numPages;
        pageIndicator.style.color = 'white'; // Imposta il colore del testo a bianco
        navContainer.appendChild(pageIndicator);

        // Aggiungi il pulsante per la pagina successiva
        var nextButton = document.createElement('button');
        nextButton.textContent = '→';
        nextButton.addEventListener('click', function() {
            if (currentPage < pdf.numPages) {
                currentPage++;
                drawPage(currentPage);
            }
        });
        navContainer.appendChild(nextButton);

        pdfViewerDiv.appendChild(navContainer);
    } else {
        console.error("Il div con id 'pdfViewer' non esiste nel documento HTML");
    }
}

function creaBottoneDownload(url, nomeFile) {
    // Verifica se il campo nomeFileInput è vuoto
    var nomeFileInput = document.getElementById('nomeFileInput');
    if (!nomeFileInput || nomeFileInput.value.trim() === '') {
        console.error("Inserisci un nome per il file prima di scaricare.");
        return;
        
    }

    // Crea un elemento <a> per il download
    var a = document.createElement('a');
    a.href = url;
    a.download = nomeFile + ".xlsx";
    a.textContent = "Download"; // Aggiungi testo al link se lo desideri
    a.className = "bottonedownload";
    a.style.position = 'absolute';
    a.style.top = '280px';
    a.style.left = '200px';
    a.style.width = '90px';
    a.style.height = '55px';
    a.style.textAlign = 'center';
    a.style.fontWeight = 'bold'; 
    a.style.borderRadius = '14px';

    // Aggiungi il link alla pagina
    var excelViewerDiv = document.getElementById('excelViewer');
    if (excelViewerDiv) {
        excelViewerDiv.appendChild(a);
    } else {
        console.error("Il div con id 'excelViewer' non esiste nel documento HTML");
    }
}
