import { getInitials } from "@shared";

interface DefaultAvatarProps {
  name: string;
  email?: string;
  title?: string;
  className?: string;
  bgColor?: string;
  textColor?: string;
}

// since its svg, the colours need to use hex code
// cant use css var since svg doesnt go through css engine like htmls do
export const DefaultAvatar = ({
  name,
  email = '',
  title = '',
  className = '',
  bgColor = '#333628',
  textColor = '#D0F05C',
}: DefaultAvatarProps) => {

  // const getInitials = () => {
  //   const nameParts = name.trim().split(' ');
    
  //   if (nameParts.length >= 2) {
  //     const firstInitial = nameParts[0].charAt(0).toUpperCase();
  //     const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  //     return firstInitial + lastInitial;
  //   }
    
  //   if (nameParts.length === 1 && nameParts[0].length >= 2) {
  //     return nameParts[0].substring(0, 2).toUpperCase();
  //   }
    
  //   return name.charAt(0).toUpperCase();
  // };

  const initials = getInitials(name);

 return (
    <svg className={className} viewBox="0 0 100 100">
      <title>{title}</title>
      <circle cx="50" cy="50" r="50" fill={bgColor} />
      <text
        x="50"
        y="56"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={textColor}
        className="font-medium text-[40px]"
      >
        {initials}
      </text>
    </svg>
  );
};