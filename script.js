      const img = new Image();
      img.src = "logo-colegio.png";  // si está en la misma carpeta que script.js y el html

 const state = {
      data: [], grouped: {}, courses: [], columns: [
        { key: 'id', label: 'ID' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'curso', label: 'Curso' },

        { key: 'notaprimertrimestre', label: '1er Trim' },
        { key: 'notasegundotrimestre', label: '2do Trim' },
        { key: 'notatercertrimestre', label: '3er Trim' },
        { key: 'notafinal', label: 'Nota Final' },
        { key: 'exportar', label: 'Exportar', isCheckbox: true }
      ]
    };

    const $ = (q, root = document) => root.querySelector(q);
    const $$ = (q, root = document) => [...root.querySelectorAll(q)];

    function normalizeRow(row) {
      const r = { ...row };
      // Normaliza claves que podrían venir con mayúsculas/minúsculas distintas
      const map = {
        id: 'id', nombre: 'nombre', curso: 'curso', paralelo: 'paralelo', notafinal: 'notafinal', notasegundotrimestre: 'notasegundotrimestre', notatercertrimestre: 'notatercertrimestre', notaprimertrimestre: 'notaprimertrimestre'
      };
      for (const k in row) {
        const kk = k.toLowerCase();
        if (map[kk] && kk !== k) { r[map[kk]] = row[k]; }
      }
      // Asegura todas las columnas
      state.columns.forEach(c => { if (!(c.key in r)) r[c.key] = null; });
      // Limpia curso nulo
      if (!r.curso || typeof r.curso !== 'string') r.curso = 'Sin curso';
      return r;
    }

    function groupByCourse(data) {
      const grouped = {};
      data.forEach(r => {
        const key = String(r.curso).trim();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      });
      const courses = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
      return { grouped, courses };
    }

    function render() {
      $('#countBadge').textContent = `${state.data.length} registros`;
      $('#courseBadge').textContent = `${state.courses.length} cursos`;
      const container = $('#courses');
      container.innerHTML = '';
      const q = $('#globalSearch').value.trim().toLowerCase();

      state.courses.forEach(course => {
        const rows = state.grouped[course];
        // Filtrado global
        const filtered = q ? rows.filter(r => Object.values(r).some(v => (v + "")?.toLowerCase().includes(q))) : rows;

        const details = document.createElement('details');
        details.open = true;
        const summary = document.createElement('summary');
        const left = document.createElement('div'); left.className = 'title';
        left.innerHTML = `<strong>${course}</strong> <span class="badge">${filtered.length}/${rows.length} registros</span>`;
        const right = document.createElement('div');
        //creamos este boton en js <button onclick="calcularNotas()">Calcular Notas Finales</button>

        const btnCalc = document.createElement('button');
        btnCalc.className = 'btn';
        btnCalc.textContent = 'Calcular Notas Finales';
        btnCalc.addEventListener('click', e => {
          e.preventDefault();
          calcularNotas(details.querySelector('table')); // le pasamos la tabla del curso
        });
        right.appendChild(btnCalc);
        const btn = document.createElement('button'); btn.className = 'btn'; btn.textContent = 'Exportar PDF';
        btn.addEventListener('click', e => { e.preventDefault(); exportCoursePDF(course, filtered); });
        right.appendChild(btn);
        summary.append(left, right);
        const tables = document.createElement('div'); tables.className = 'tables';
        const tableWrap = document.createElement('div'); tableWrap.className = 'table-wrap';
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const trh = document.createElement('tr');
        state.columns.forEach(c => { const th = document.createElement('th'); th.textContent = c.label; trh.appendChild(th); });
        thead.appendChild(trh); table.appendChild(thead);
        const tbody = document.createElement('tbody');
        filtered.forEach(r => {
          const tr = document.createElement('tr');
          state.columns.forEach(c => {
            const td = document.createElement('td');

            if (c.isCheckbox) {
              const chk = document.createElement('input');
              chk.type = 'checkbox';
              chk.checked = r.exportar !== false; // true por defecto
              chk.addEventListener('change', e => {
                r.exportar = e.target.checked;
              });
              td.appendChild(chk);
            } else {
              let val = r[c.key];
              if (val === null || val === undefined) val = '';
              td.textContent = val;

              if (["notaprimertrimestre", "notasegundotrimestre", "notatercertrimestre"].includes(c.key)) {
                td.contentEditable = "true";
                td.style.backgroundColor = "#1b2540";
                td.style.outline = "none";

                td.addEventListener("input", e => {
                  const newVal = parseFloat(e.target.innerText) || 0;
                  const id = tr.children[getColIndex("id")].innerText;
                  const record = state.data.find(r => String(r.id) === String(id));
                  if (record) record[c.key] = newVal;
                });
              }
            }

            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        tableWrap.appendChild(table);
        tables.appendChild(tableWrap);
        details.append(summary, tables);
        container.appendChild(details);
      });
    }
function calcularNotas(table) {
  const tbody = table.querySelector("tbody");

  const colTrim1 = getColIndex("notaprimertrimestre");
  const colTrim2 = getColIndex("notasegundotrimestre");
  const colTrim3 = getColIndex("notatercertrimestre");
  const colFinal = getColIndex("notafinal");

  tbody.querySelectorAll("tr").forEach(row => {
    const id = row.children[getColIndex("id")].innerText;
    const record = state.data.find(r => String(r.id) === String(id));

    const t1 = parseFloat(row.children[colTrim1]?.innerText) || 0;
    const t2 = parseFloat(row.children[colTrim2]?.innerText) || 0;
    const t3 = parseFloat(row.children[colTrim3]?.innerText) || 0;

    const notaFinal = (t1 + t2 + t3) / 3;

    row.children[colFinal].innerText = notaFinal.toFixed(2);

    if (record) {
      record.notafinal = parseFloat(notaFinal.toFixed(2));
    }
  });
}


    function getColIndex(key) {
      return state.columns.findIndex(c => c.key === key);
    }
    function loadData(array) {
      if (!Array.isArray(array)) throw new Error('El JSON debe ser un array de objetos');
      state.data = array.map(normalizeRow);
      const { grouped, courses } = groupByCourse(state.data);
      state.grouped = grouped; state.courses = courses;
      render();
    }

    async function readFileAsText(file) {
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onerror = () => rej(new Error('No se pudo leer el archivo'));
        r.onload = () => res(r.result);
        r.readAsText(file);
      });
    }
    const pdfColumns = [
      "id",
      "nombre",
      "notaprimertrimestre",
      "notasegundotrimestre",
      "notatercertrimestre",
      "notafinal"
    ];

    // PDF helpers
function exportCoursePDF(course, rows) {
  if (!rows || !rows.length) {
    alert('No hay datos para exportar.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const img = new Image();
  img.src = "logo-colegio.png"; // debe estar en la misma carpeta que tu index.html

  img.onload = function () {
    // Agregamos logo (ejemplo: esquina superior derecha)
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(img, "PNG", pageWidth - 100, 20, 60, 60);

    // Encabezado
    const head = [state.columns.filter(c => pdfColumns.includes(c.key)).map(c => c.label)];
    const rowsToExport = rows.filter(r => r.exportar !== false);
    const body = rowsToExport.map((r, i) =>
      pdfColumns.map(k => k === "id" ? i + 1 : r[k] ?? '')
    );

    doc.setFontSize(12);
    doc.text(`Curso: ${course}  —  Registros: ${rowsToExport.length}`, 40, 40);

    doc.autoTable({
      startY: 100, // dejamos espacio para el logo
      head: head,
      body: body,
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      theme: 'striped',
      margin: { left: 40, right: 40 }
    });

    doc.save(`Listado_${sanitize(course)}.pdf`);
  };

  img.onerror = function () {
    alert("No se pudo cargar el logo. Revisa la ruta (logo-colegio.png).");
  };
}



function exportAllPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const img = new Image();
  img.src = "logo-colegio.png"; // ruta de tu logo

  img.onload = function () {
    let first = true;

    state.courses.forEach(course => {
      const rows = state.grouped[course];

      // 🔹 Recalcular nota final antes de exportar
      rows.forEach(r => {
        const t1 = parseFloat(r.notaprimertrimestre) || 0;
        const t2 = parseFloat(r.notasegundotrimestre) || 0;
        const t3 = parseFloat(r.notatercertrimestre) || 0;
        r.notafinal = parseFloat(((t1 + t2 + t3) / 3).toFixed(2));
      });

      if (!first) doc.addPage();
      first = false;

      // Poner logo en la esquina superior derecha de cada página
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(img, "PNG", pageWidth - 100, 20, 60, 60);

      // Encabezado y tabla
      const head = [state.columns.filter(c => pdfColumns.includes(c.key)).map(c => c.label)];
      const rowsToExport = rows.filter(r => r.exportar !== false);
      const body = rowsToExport.map((r, i) =>
        pdfColumns.map(k => k === "id" ? i + 1 : r[k] ?? '')
      );

      doc.setFontSize(12);
      doc.text(`Curso: ${course}  —  Registros: ${rowsToExport.length} - Notas Computacion 2025`, 40, 40);

      doc.autoTable({
        startY: 100, // dejamos espacio para el logo
        head: head,
        body: body,
        styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
        headStyles: { fillColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        theme: 'striped',
        margin: { left: 40, right: 40 }
      });
    });

    doc.save('Listado_por_curso.pdf');
  };

  img.onerror = function () {
    alert("No se pudo cargar el logo. Revisa la ruta (logo-colegio.png).");
  };
}


    function sanitize(s) {
      return String(s).replace(/[^\w\-\u00C0-\u024F\s]/g, '').replace(/\s+/g, '_');
    }

    // Events
    $('#loadFileBtn').addEventListener('click', async () => {
      const f = $('#fileInput').files?.[0];
      if (!f) { alert('Selecciona un archivo .json'); return; }
      try {
        const txt = await readFileAsText(f);
        const data = JSON.parse(txt);
        loadData(data);
      } catch (err) { alert('Error al cargar JSON: ' + err.message); }
    });

    $('#loadTextBtn').addEventListener('click', () => {
      const txt = $('#jsonText').value.trim();
      if (!txt) { alert('Pega el JSON en el cuadro de texto.'); return; }
      try {
        const data = JSON.parse(txt);
        loadData(data);
      } catch (err) { alert('JSON inválido: ' + err.message); }
    });

    $('#clearBtn').addEventListener('click', () => {
      $('#jsonText').value = '';
      state.data = []; state.grouped = {}; state.courses = [];
      render();
    });

    $('#exampleBtn').addEventListener('click', () => {
      const ejemplo = [
        {
          "id": 227,
          "nombre": "LUQUE ESPINOZA LIZANDRO ZAIR",
          "curso": "3ro de Secundaria A",
          "paralelo": null,
          "asistencia": 20,
          "sellos": 4,
          "notaexamen": 30,
          "notafinal": 0,
          "notasegundotrimestre": 0,
          "notatercertrimestre": 0,
          "notaprimertrimestre": 83
        },
        {
          "id": 101,
          "nombre": "ALVAREZ QUISPE MARIA",
          "curso": "3ro de Secundaria A",
          "paralelo": null,
          "asistencia": 18,
          "sellos": 5,
          "notaexamen": 28,
          "notafinal": 80,
          "notasegundotrimestre": 75,
          "notatercertrimestre": 78,
          "notaprimertrimestre": 82
        },
        {
          "id": 302,
          "nombre": "CHOQUE VELASCO LUIS",
          "curso": "3ro de Secundaria B",
          "paralelo": null,
          "asistencia": 19,
          "sellos": 3,
          "notaexamen": 27,
          "notafinal": 77,
          "notasegundotrimestre": 70,
          "notatercertrimestre": 74,
          "notaprimertrimestre": 79
        }
      ];
      $('#jsonText').value = JSON.stringify(ejemplo, null, 2);
    });

    $('#exportAll').addEventListener('click', exportAllPDF);

    // Render inicial
    render();
    function exportFilteredJSONFull() {
  let allRows = [];

  state.courses.forEach(course => {
    const rows = state.grouped[course];

    // Solo filas marcadas para exportar
    const rowsToExport = rows.filter(r => r.exportar !== false);

    rowsToExport.forEach(r => {
      // Creamos una copia para no alterar state.data
      allRows.push({ 
        ...r, 
        asistencia: 0, // reseteamos asistencia
        sellos: 0,      // reseteamos sellos
        notaexamen: 0   // reseteamos notaexamen
      });
    });
  });

  // Ordenar por nivel educativo y luego por curso/paralelo
  allRows.sort((a, b) => {
    const nivel = s => s.toLowerCase().includes("primaria") ? 1 : 2;
    const nivelA = nivel(a.curso);
    const nivelB = nivel(b.curso);
    if (nivelA !== nivelB) return nivelA - nivelB;

    if (a.curso !== b.curso) return a.curso.localeCompare(b.curso, 'es', { numeric: true });
    if ((a.paralelo ?? '') !== (b.paralelo ?? '')) return (a.paralelo ?? '').localeCompare(b.paralelo ?? '', 'es', { numeric: true });

    return 0;
  });

  // Reiniciar ID consecutivamente
  allRows = allRows.map((r, i) => ({ ...r, id: i + 1 }));

  // Convertir a JSON
  const jsonStr = JSON.stringify(allRows, null, 2);

  // Descargar
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export_filtrado_completo.json';
  a.click();
  URL.revokeObjectURL(url);
}

$('#exportJSON').addEventListener('click', () => {
  exportFilteredJSONFull();
});
