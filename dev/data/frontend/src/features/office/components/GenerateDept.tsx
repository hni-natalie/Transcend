/*
 generate adaptive planes to represent diff departments
 based on input count
*/

import { BlinkingText } from '@/shared';
import { useOfficeSpace } from '@features/office/context/SpaceContext';
import { useOfficeSpaceLayout } from '@features/office/context/SpaceLayoutContext';

export function GenerateDept() {
const { planes, activeOverlay, hoverOverlay } = useOfficeSpace();
const { loading } = useOfficeSpaceLayout();

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
  return (
  <group>
    {planes}
    {activeOverlay}
    {hoverOverlay}
  </group>
);
}
