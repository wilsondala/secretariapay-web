const PRODUCTION_API_BASE_URL = 'https://secretariapay-api.paixaoangola.com';
const LOCAL_API_BASE_URL = 'http://localhost:8080';

function cleanEnvironmentValue(value) {
  const normalized = String(value ?? '').trim();
  if (
    normalized.length >= 2
    && ((normalized.startsWith('"') && normalized.endsWith('"'))
      || (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    return normalized.slice(1, -1).trim();
  }
  return normalized;
}

function normalizeApiBaseUrl(value) {
  let candidate = cleanEnvironmentValue(value);

  if (!candidate) {
    return import.meta.env.DEV ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL;
  }

  if (candidate.startsWith('/')) {
    const relativeUrl = candidate.replace(/\/+$/, '');
    return relativeUrl || '/';
  }

  if (/^(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(candidate)) {
    candidate = `http://${candidate}`;
  } else if (!/^https?:\/\//i.test(candidate) && /^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(?:\/|$)/i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Protocolo não suportado: ${parsed.protocol}`);
    }

    const pathname = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.origin}${pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return import.meta.env.DEV ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL;
  }
}

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  appName: cleanEnvironmentValue(import.meta.env.VITE_APP_NAME) || 'SecretáriaPay Académico',
  institutionName: cleanEnvironmentValue(import.meta.env.VITE_INSTITUTION_NAME) || 'Instituto Superior Politécnico Metropolitano de Angola',
  institutionShortName: cleanEnvironmentValue(import.meta.env.VITE_INSTITUTION_SHORT_NAME) || 'IMETRO',
  dcrName: cleanEnvironmentValue(import.meta.env.VITE_DCR_NAME) || 'DCR — Divisão de Cobranças e Recebimentos',
  institutionId: cleanEnvironmentValue(import.meta.env.VITE_INSTITUTION_ID) || 'c3726494-46b5-4563-8e84-0a04334fac8c',
};
