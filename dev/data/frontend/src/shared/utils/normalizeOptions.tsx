import { DropdownChoice } from '@/shared/types/ui.types';

export function normalizeOptions(departments: string[]) {
  return departments.map(dept => ({
    id: dept.toLowerCase().replace(/\s+/g, '_'),
    name: dept
  }));
}

// export const normalizeChoices = (choices: any[]): DropdownChoice[] => 
//   choices.map(choice => {
//     if (typeof choice === 'string') {
//       return { id: choice, name: choice };
//     }
//     if (choice && typeof choice === 'object') {
//       const raw = choice as any;
//       return {
//         id: String(raw.id ?? raw.value ?? raw.code ?? ''),
//         name: String(raw.name ?? raw.label ?? raw.text ?? '')
//       };
//     }
//     return { id: '', name: '' };
//   });

// export const normalizedChoices = (choices : (string | Object)) : DropdownChoice => {

//   choices.map(choice => {
//   if (typeof choice === 'string') {
//     return { id: choice, name: choice };
//   }
//   if (choice && typeof choice === 'object') {
//     const raw = choice as any;
//     return {
//       id: String(raw.id ?? raw.value ?? raw.code ?? ''),
//       name: String(raw.name ?? raw.label ?? raw.text ?? '')
//     };
//   }
//   return { id: '', name: '' };
//   });
// }