import api from './api.js';

function normalizeArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.batches)) return payload.batches;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

async function tryGet(paths) {
  let lastError;
  for (const path of paths) {
    try {
      const { data } = await api.get(path);
      return { data, path };
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status === 401 || status === 403) throw error;
    }
  }
  throw lastError;
}

async function tryMutation(method, paths) {
  let lastError;
  for (const path of paths) {
    try {
      const { data } = await api.request({ method, url: path });
      return { data, path };
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status === 401 || status === 403) throw error;
    }
  }
  throw lastError;
}

function normalizeBatch(batch) {
  return {
    ...batch,
    id: batch?.id || batch?.batchId || batch?.batch_id,
    importCode: batch?.importCode || batch?.import_code || batch?.code || '-',
    sourceSystem: batch?.sourceSystem || batch?.source_system || 'WEBSCHOOL',
    sourceName: batch?.sourceName || batch?.source_name || batch?.source || 'WebSchool',
    fileName: batch?.fileName || batch?.file_name || '-',
    academicYear: batch?.academicYear || batch?.academic_year || '-',
    semester: batch?.semester || '-',
    status: batch?.status || 'PENDING',
    totalRows: Number(batch?.totalRows ?? batch?.total_rows ?? 0),
    validRows: Number(batch?.validRows ?? batch?.valid_rows ?? 0),
    invalidRows: Number(batch?.invalidRows ?? batch?.invalid_rows ?? 0),
    importedRows: Number(batch?.importedRows ?? batch?.imported_rows ?? 0),
    syncedRows: Number(batch?.syncedRows ?? batch?.synced_rows ?? batch?.importedRows ?? batch?.imported_rows ?? 0),
    createdCourses: Number(batch?.createdCourses ?? batch?.created_courses ?? 0),
    reusedCourses: Number(batch?.reusedCourses ?? batch?.reused_courses ?? 0),
    createdClasses: Number(batch?.createdClasses ?? batch?.created_classes ?? 0),
    reusedClasses: Number(batch?.reusedClasses ?? batch?.reused_classes ?? 0),
    createdStudents: Number(batch?.createdStudents ?? batch?.created_students ?? 0),
    updatedStudents: Number(batch?.updatedStudents ?? batch?.updated_students ?? 0),
    createdAt: batch?.createdAt || batch?.created_at,
    validatedAt: batch?.validatedAt || batch?.validated_at,
    completedAt: batch?.completedAt || batch?.completed_at,
    notes: batch?.notes || '',
  };
}

function normalizeRow(row, index = 0) {
  return {
    ...row,
    id: row?.id || `${row?.studentNumber || row?.student_number || index}-${index}`,
    rowNumber: row?.rowNumber || row?.row_number || index + 1,
    studentNumber: row?.studentNumber || row?.student_number || '-',
    fullName: row?.fullName || row?.full_name || row?.studentName || '-',
    courseName: row?.courseName || row?.course_name || '-',
    className: row?.className || row?.class_name || '-',
    shiftName: row?.shiftName || row?.shift_name || '-',
    email: row?.email || '-',
    phone: row?.phone || '-',
    whatsapp: row?.whatsapp || '-',
    status: row?.status || 'PENDING',
    validationMessage: row?.validationMessage || row?.validation_message || '',
    matchedStudentId: row?.matchedStudentId || row?.matched_student_id,
  };
}

const demoBatches = [
  {
    id: '6155d281-2bdd-4d8e-ab41-ba8c939e1040',
    importCode: 'WSI-1783164337518',
    sourceSystem: 'WEBSCHOOL',
    sourceName: 'WebSchool IMETRO',
    fileName: 'webschool-alunos-2024-2025.csv',
    academicYear: '2024/2025',
    semester: '2º semestre',
    status: 'COMPLETED',
    totalRows: 3,
    validRows: 3,
    invalidRows: 0,
    importedRows: 3,
    syncedRows: 3,
    reusedCourses: 3,
    reusedClasses: 3,
    updatedStudents: 3,
    createdAt: '2026-07-04T09:44:36',
    completedAt: '2026-07-04T09:44:36',
    notes: 'Sincronização concluída: staging WebSchool ligado ao cadastro académico real.',
  },
  {
    id: 'demo-ei-2026',
    importCode: 'WSI-DEMO-ENG-2026',
    sourceSystem: 'WEBSCHOOL',
    sourceName: 'WebSchool IMETRO',
    fileName: 'engenharia-informatica-2026.xlsx',
    academicYear: '2026',
    semester: '1º semestre',
    status: 'PENDING_VALIDATION',
    totalRows: 2,
    validRows: 2,
    invalidRows: 0,
    importedRows: 0,
    syncedRows: 0,
    createdAt: '2026-07-05T08:30:00',
    notes: 'Lote demonstrativo para homologação do painel.',
  },
];

const demoRows = [
  {
    id: 'row-1',
    rowNumber: 1,
    studentNumber: '20200629',
    fullName: 'Yasser Nahari Quianica Coimbra',
    courseName: 'Licenciatura em Gestão de Recursos Humanos',
    className: 'LRH4M',
    shiftName: 'NIGHT',
    phone: '+244954485547',
    whatsapp: '+244954485547',
    status: 'SYNCED',
    matchedStudentId: 'ca481cf1-4bae-4b85-9460-33765303f4c6',
  },
  {
    id: 'row-2',
    rowNumber: 2,
    studentNumber: '20200925',
    fullName: 'Maludi Adélia André Bernardo',
    courseName: 'Licenciatura em Gestão de Recursos Humanos',
    className: 'LRH4M',
    shiftName: 'NIGHT',
    phone: '+5511915102566',
    whatsapp: '+5511915102566',
    status: 'SYNCED',
    matchedStudentId: '749b612e-2ea6-4a28-9d57-9e955b491918',
  },
  {
    id: 'row-3',
    rowNumber: 3,
    studentNumber: '20230294',
    fullName: 'Luísa Mbala Sebastião',
    courseName: 'Licenciatura em Administração de Empresas',
    className: 'LAD2T',
    shiftName: 'NIGHT',
    phone: '+244925939243',
    whatsapp: '+244925939243',
    status: 'SYNCED',
    matchedStudentId: '7efcac5e-6f1f-473e-95e9-0a13634b64bc',
  },
];

export async function fetchImportBatches() {
  const paths = [
    '/api/v1/academic-student-imports',
    '/api/v1/admin/academic-student-imports',
    '/api/v1/admin/imports',
    '/api/v1/imports/academic-students',
  ];
  try {
    const result = await tryGet(paths);
    const batches = normalizeArray(result.data).map(normalizeBatch);
    return { items: batches, source: result.path, isDemo: false };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) throw error;
    return { items: demoBatches.map(normalizeBatch), source: 'dados demonstrativos', isDemo: true };
  }
}

export async function fetchImportRows(batchId) {
  if (!batchId || String(batchId).startsWith('demo-')) {
    return { items: demoRows.map(normalizeRow), source: 'dados demonstrativos', isDemo: true };
  }

  const paths = [
    `/api/v1/academic-student-imports/${batchId}/rows`,
    `/api/v1/admin/academic-student-imports/${batchId}/rows`,
    `/api/v1/admin/imports/${batchId}/rows`,
    `/api/v1/academic-student-imports/${batchId}`,
  ];

  try {
    const result = await tryGet(paths);
    const rawRows = normalizeArray(result.data) || normalizeArray(result.data?.rows);
    const rows = rawRows.length ? rawRows.map(normalizeRow) : demoRows.map(normalizeRow);
    return { items: rows, source: result.path, isDemo: !rawRows.length };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) throw error;
    return { items: demoRows.map(normalizeRow), source: 'dados demonstrativos', isDemo: true };
  }
}

export async function syncImportBatch(batchId) {
  const paths = [
    `/api/v1/academic-student-imports/${batchId}/sync`,
    `/api/v1/admin/academic-student-imports/${batchId}/sync`,
    `/api/v1/admin/imports/${batchId}/sync`,
  ];
  const result = await tryMutation('PATCH', paths).catch(async (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) throw error;
    return tryMutation('POST', paths);
  });
  return result.data;
}
