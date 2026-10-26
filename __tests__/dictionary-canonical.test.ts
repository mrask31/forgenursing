import {expect,it} from 'vitest'
import {DICTIONARY_TERMS,isMedicalTermSaved} from '../src/lib/medicalTerms'
it('lists one searchable JVD concept and preserves legacy saved aliases',()=>{expect(DICTIONARY_TERMS.filter(t=>/jugular|^JVD$/.test(t.term))).toHaveLength(1);expect(isMedicalTermSaved('jugular venous distention',new Set(['jvd']))).toBe(true);expect(DICTIONARY_TERMS.find(t=>t.term==='ascites')?.category).toBe('Gastrointestinal')})
