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

// Helper function
export function addPosition(pos1, pos2) {
  // console.log('[AddPosition] ', pos1, ' ', pos2);
  return {
    x: (pos1?.x || 0) + (pos2?.x || 0),
    y: 0,
    z: (pos1?.z || 0) + (pos2?.z || 0)
  }
};

export function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  const maxVisible = 7; // total slots including ellipses/first/last

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  const showLeftEllipsis = currentPage > 4;
  const showRightEllipsis = currentPage < totalPages - 3;

  pages.push(1);

  if (showLeftEllipsis) {
    pages.push('...');
  }

  const start = showLeftEllipsis ? Math.max(2, currentPage - 1) : 2;
  const end = showRightEllipsis ? Math.min(totalPages - 1, currentPage + 1) : totalPages - 1;

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (showRightEllipsis) {
    pages.push('...');
  }

  pages.push(totalPages);

  return pages;
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