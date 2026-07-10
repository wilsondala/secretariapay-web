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
    institutionId: batch?.institutionId || batch?.institution_id,
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
    academicYear: row?.academicYear || row?.academic_year || '',
    semesterNumber: row?.semesterNumber ?? row?.semester_number ?? '',
    studentNumber: row?.studentNumber || row?.student_number || '',
    fullName: row?.fullName || row?.full_name || row?.studentName || '',
    courseName: row?.courseName || row?.course_name || '',
    className: row?.className || row?.class_name || '',
    shiftName: row?.shiftName || row?.shift_name || '',
    departmentName: row?.departmentName || row?.department_name || '',
    email: row?.email || '',
    phone: row?.phone || '',
    whatsapp: row?.whatsapp || '',
    responsibleName: row?.responsibleName || row?.responsible_name || '',
    responsiblePhone: row?.responsiblePhone || row?.responsible_phone || '',
    responsibleEmail: row?.responsibleEmail || row?.responsible_email || '',
    status: row?.status || 'PENDING',
    validationMessage: row?.validationMessage || row?.validation_message || '',
    matchedStudentId: row?.matchedStudentId || row?.matched_student_id,
  };
}

export async function fetchImportBatches() {
  const paths = ['/api/v1/academic-student-imports', '/api/v1/admin/academic-student-imports', '/api/v1/admin/imports', '/api/v1/imports/academic-students'];
  const result = await tryGet(paths);
  return { items: normalizeArray(result.data).map(normalizeBatch), source: result.path, isDemo: false };
}

export async function fetchImportRows(batchId) {
  const paths = [`/api/v1/academic-student-imports/${batchId}/rows`, `/api/v1/admin/academic-student-imports/${batchId}/rows`, `/api/v1/admin/imports/${batchId}/rows`, `/api/v1/academic-student-imports/${batchId}`];
  const result = await tryGet(paths);
  return { items: normalizeArray(result.data).map(normalizeRow), source: result.path, isDemo: false };
}

export async function uploadImportCsv({ file, institutionId, academicYear, semester, sourceName }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('institutionId', institutionId);
  if (academicYear) formData.append('academicYear', academicYear);
  if (semester) formData.append('semester', semester);
  if (sourceName) formData.append('sourceName', sourceName);
  const { data } = await api.post('/api/v1/academic-student-imports/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return normalizeBatch(data);
}

export async function updateImportRow(batchId, rowId, payload) {
  const { data } = await api.put(`/api/v1/academic-student-imports/${batchId}/rows/${rowId}`, payload);
  return normalizeRow(data);
}

export async function downloadImportErrors(batchId, importCode = 'importacao') {
  const response = await api.get(`/api/v1/academic-student-imports/${batchId}/errors.csv`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `erros-${importCode}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function validateImportBatch(batchId) {
  const { data } = await api.patch(`/api/v1/academic-student-imports/${batchId}/validate`);
  return data;
}

export async function completeImportBatch(batchId) {
  const { data } = await api.patch(`/api/v1/academic-student-imports/${batchId}/complete`);
  return data;
}

export async function syncImportBatch(batchId) {
  const paths = [`/api/v1/academic-student-imports/${batchId}/sync`, `/api/v1/admin/academic-student-imports/${batchId}/sync`, `/api/v1/admin/imports/${batchId}/sync`];
  const result = await tryMutation('PATCH', paths).catch(async (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) throw error;
    return tryMutation('POST', paths);
  });
  return result.data;
}
