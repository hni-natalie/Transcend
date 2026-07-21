export function normalizeOptions(departments: string[]) {
  return departments.map(dept => ({
    id: dept.toLowerCase().replace(/\s+/g, '_'),
    name: dept
  }));
}

export function getInitials( name:string ) {
  const nameParts = name.trim().split(' ');
  
  if (nameParts.length >= 2) {
    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  }
  
  if (nameParts.length === 1 && nameParts[0].length >= 2) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  
  return name.charAt(0).toUpperCase();
};

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