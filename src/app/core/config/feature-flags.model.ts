export interface FeatureFlags {
  enableI18n: boolean;
  enableLanguageInHeader: boolean;
  enableLanguageInProfile: boolean;
  enableEnglishCatalogs: boolean;
  enableAdminPanel: boolean;
  enableVoluntarios: boolean;
  enableReportes: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableI18n: true,
  enableLanguageInHeader: true,
  enableLanguageInProfile: true,
  enableEnglishCatalogs: true,
  enableAdminPanel: true,
  enableVoluntarios: true,
  enableReportes: true,
};