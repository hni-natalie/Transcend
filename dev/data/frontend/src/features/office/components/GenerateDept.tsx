/*
 generate adaptive planes to represent diff departments
 based on input count
*/

import { BlinkingText } from '@/shared';
import { useOfficeSpace } from '@features/office/context/SpaceContext';

export function GenerateDept() {
const { planes, loading } = useOfficeSpace();

  if (loading || !planes) {
    return (
      <BlinkingText
        text="Fetching departments"
        font="/font/Space_Mono/SpaceMono-Regular.ttf"
        fontSize={1.1}
        color="white"
      />
    );
  }
  return <group>{planes}</group>;
}
