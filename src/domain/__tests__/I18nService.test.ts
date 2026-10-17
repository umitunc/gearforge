import { describe, expect, it } from 'vitest';
import { i18n, SUPPORTED_LANGUAGES } from '../../application/I18nService';

describe('I18nService & Localization', () => {
  it('supports tr, en, de, ru languages', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(['tr', 'en', 'de', 'ru']);
  });

  it('translates wizard strings correctly in Turkish', () => {
    i18n.setLanguage('tr');
    expect(i18n.t('wizard.title')).toBe('Dişli Tasarım Sihirbazı');
    expect(i18n.t('wizard.step1.title')).toContain('Dişli Tipi');
  });

  it('translates wizard strings correctly in English', () => {
    i18n.setLanguage('en');
    expect(i18n.t('wizard.title')).toBe('Gear Creation Wizard');
    expect(i18n.t('wizard.step1.title')).toContain('Gear Type');
  });

  it('translates wizard strings correctly in German', () => {
    i18n.setLanguage('de');
    expect(i18n.t('wizard.title')).toBe('Zahnrad-Konstruktionsassistent');
    expect(i18n.t('wizard.step1.title')).toContain('Zahnradtyp');
  });

  it('translates wizard strings correctly in Russian', () => {
    i18n.setLanguage('ru');
    expect(i18n.t('wizard.title')).toBe('Мастер создания шестерни');
    expect(i18n.t('wizard.step1.title')).toContain('Тип шестерни');
  });

  it('replaces parameter placeholders in translation strings', () => {
    i18n.setLanguage('en');
    const res = i18n.t('wizard.step_counter', { current: 2, total: 5 });
    expect(res).toBe('Step 2 of 5');
  });
});
